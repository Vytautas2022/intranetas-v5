import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { AlertCircle, Check, FileUp, Loader2, X } from "lucide-react";
import { cn } from "../lib/utils";
import type { AssetObject } from "../mock-db/assetObjects";
import type { Club } from "../mock-db/clubs";

interface ParsedRow {
  asset_id: string;
  asset_number: string;
  asset_name: string;
  club_name: string;
  location: string;
  image_url: string;
  qr_url: string;
}

interface RowPreview {
  row: ParsedRow;
  resolvedClubId: string;
  resolvedClubName: string;
  isUpdate: boolean;
  existingId: string | null;
}

interface AssetImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubs: Club[];
  assetTypeId: string;
  existingObjects: AssetObject[];
  onImport: (objects: AssetObject[]) => void;
}

const REQUIRED_COLUMNS = ["asset_id", "asset_name"];

const HEADER_ALIASES: Record<keyof ParsedRow, string[]> = {
  asset_id: ["asset_id", "unikalus numeris"],
  asset_name: ["asset_name", "pavadinimas"],
  asset_number: ["asset_number", "numeris"],
  club_name: ["club_name", "sporto klubas"],
  location: ["location", "lokacija"],
  image_url: ["image_url"],
  qr_url: ["qr_url"],
};

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("lt-LT")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^"|"$/g, "")
    .replace(/\s+/g, " ");
}

function normalizeRow(rawRow: Record<string, string>): ParsedRow {
  const normalizedEntries = new Map<string, string>();
  Object.entries(rawRow).forEach(([key, value]) => {
    normalizedEntries.set(normalizeHeader(key), value ?? "");
  });

  const getValue = (field: keyof ParsedRow) => {
    const aliases = HEADER_ALIASES[field].map(normalizeHeader);
    for (const alias of aliases) {
      const value = normalizedEntries.get(alias);
      if (value !== undefined) return value.trim();
    }
    return "";
  };

  return {
    asset_id: getValue("asset_id"),
    asset_number: getValue("asset_number"),
    asset_name: getValue("asset_name"),
    club_name: getValue("club_name"),
    location: getValue("location"),
    image_url: getValue("image_url"),
    qr_url: getValue("qr_url"),
  };
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
    return row;
  });
}

function parseXLSX(buffer: ArrayBuffer): Record<string, string>[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
  return rows.map((r) => {
    const normalized: Record<string, string> = {};
    Object.entries(r).forEach(([k, v]) => {
      normalized[k.trim()] = String(v ?? "");
    });
    return normalized;
  });
}

function resolveClub(clubName: string, clubs: Club[]): Club | undefined {
  if (!clubName) return undefined;
  const q = clubName.trim().toLowerCase();
  return (
    clubs.find((c) => c.name.toLowerCase() === q) ||
    clubs.find((c) => c.name.toLowerCase().includes(q)) ||
    clubs.find((c) => c.id.toLowerCase() === q)
  );
}

function findExisting(assetId: string, existingObjects: AssetObject[]): AssetObject | null {
  return (
    existingObjects.find((o) => o.id === `asset-object-equipment-${assetId}`) ||
    existingObjects.find((o) => o.metadata?.legacyId === assetId) ||
    existingObjects.find((o) => o.id === assetId) ||
    null
  );
}

function toAssetObject(
  row: ParsedRow,
  assetTypeId: string,
  resolvedClubId: string,
  resolvedRegion: string | undefined,
  existingObj: AssetObject | null,
): AssetObject {
  const stableId =
    existingObj?.id ||
    `asset-object-equipment-${row.asset_id || Date.now()}`;

  return {
    id: stableId,
    assetTypeId,
    code: row.asset_number || row.asset_id || "",
    name: row.asset_name || "",
    active: existingObj?.active ?? true,
    clubId: resolvedClubId || existingObj?.clubId || undefined,
    regionId: resolvedRegion || existingObj?.regionId || undefined,
    qrUrl: row.qr_url || existingObj?.qrUrl || undefined,
    metadata: {
      ...(existingObj?.metadata || {}),
      legacyId: row.asset_id || undefined,
      location: row.location || undefined,
      imageUrl: row.image_url || (existingObj?.metadata?.imageUrl as string) || undefined,
      legacySource: "import",
    },
  };
}

export function AssetImportModal({
  isOpen,
  onClose,
  clubs,
  assetTypeId,
  existingObjects,
  onImport,
}: AssetImportModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [clubOverride, setClubOverride] = useState<string>("");
  const [importDone, setImportDone] = useState(false);

  if (!isOpen) return null;

  const preview: RowPreview[] = (rows ?? []).map((row) => {
    const overriddenClub = clubOverride ? clubs.find((c) => c.id === clubOverride) : undefined;
    const resolvedClub = overriddenClub || resolveClub(row.club_name, clubs);
    const existing = findExisting(row.asset_id, existingObjects);
    return {
      row,
      resolvedClubId: resolvedClub?.id || "",
      resolvedClubName: resolvedClub?.name || row.club_name || "—",
      isUpdate: Boolean(existing),
      existingId: existing?.id || null,
    };
  });

  const handleFile = async (file: File) => {
    setParseError(null);
    setParsing(true);
    setRows(null);
    setImportDone(false);
    try {
      let rawRows: Record<string, string>[];
      if (file.name.toLowerCase().endsWith(".csv")) {
        const text = await file.text();
        rawRows = parseCSV(text);
      } else {
        const buffer = await file.arrayBuffer();
        rawRows = parseXLSX(buffer);
      }

      const normalizedRows = rawRows.map(normalizeRow);
      const missing = REQUIRED_COLUMNS.filter((col) =>
        normalizedRows.every((row) => !row[col as keyof ParsedRow]),
      );
      if (missing.length > 0) {
        setParseError(`Trūksta stulpelių: ${missing.join(", ")}`);
        return;
      }

      const parsed: ParsedRow[] = normalizedRows.filter(
        (row) => row.asset_id || row.asset_name,
      );

      if (parsed.length === 0) {
        setParseError("Failas tuščias arba netinkamas formatas.");
        return;
      }
      setRows(parsed);
    } catch {
      setParseError("Nepavyko nuskaityti failo.");
    } finally {
      setParsing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleImport = () => {
    if (!rows) return;
    const objects = preview.map((p) =>
      toAssetObject(
        p.row,
        assetTypeId,
        p.resolvedClubId,
        clubs.find((c) => c.id === p.resolvedClubId)?.region,
        findExisting(p.row.asset_id, existingObjects),
      ),
    );
    onImport(objects);
    setImportDone(true);
  };

  const handleClose = () => {
    setRows(null);
    setParseError(null);
    setClubOverride("");
    setImportDone(false);
    onClose();
  };

  const newCount = preview.filter((p) => !p.isUpdate).length;
  const updateCount = preview.filter((p) => p.isUpdate).length;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60" onClick={handleClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-lg font-black text-slate-900">Importuoti treniruoklius</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Palaikomi formatai: CSV, XLSX · Stulpeliai: asset_id / Unikalus numeris, asset_name / Pavadinimas, asset_number / Numeris, club_name / Sporto klubas, location / Lokacija
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Upload zone */}
          {!rows && !parsing && (
            <div
              className="border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center gap-4 text-center hover:border-brand-lime hover:bg-brand-lime/5 transition-all cursor-pointer"
              onClick={() => fileRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center">
                <FileUp size={28} className="text-slate-400" />
              </div>
              <div>
                <p className="font-black text-slate-900 text-base">Įkelti failą</p>
                <p className="text-sm text-slate-400 font-medium mt-1">
                  Vilkite failą čia arba spustelėkite
                </p>
                <p className="text-xs text-slate-300 font-bold uppercase tracking-widest mt-2">
                  CSV · XLSX
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleInputChange}
              />
            </div>
          )}

          {parsing && (
            <div className="flex items-center justify-center py-12 gap-3 text-slate-500 font-bold">
              <Loader2 size={20} className="animate-spin" />
              Nuskaitoma...
            </div>
          )}

          {parseError && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
              <AlertCircle size={18} className="shrink-0" />
              <p className="text-sm font-bold">{parseError}</p>
              <button
                onClick={() => { setParseError(null); fileRef.current?.click(); }}
                className="ml-auto text-xs font-black uppercase tracking-widest hover:underline"
              >
                Bandyti dar kartą
              </button>
            </div>
          )}

          {rows && !importDone && (
            <>
              {/* Summary + club override */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="grid gap-4 lg:grid-cols-[minmax(220px,1fr)_auto_auto_auto] lg:items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                      Importuojamas klubas
                    </label>
                    <select
                      value={clubOverride}
                      onChange={(e) => setClubOverride(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-bold bg-white"
                    >
                      <option value="">Iš failo</option>
                      {clubs
                        .filter((c) => c.is_active !== false)
                        .map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <p className="text-[11px] font-semibold text-slate-400">
                      Pasirinkus klubą, jis bus priskirtas visiems importuojamiems turto vienetams.
                    </p>
                  </div>
                  <div className="rounded-xl bg-white px-4 py-3 border border-slate-200">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Importuojami assetai
                    </div>
                    <div className="text-xl font-black text-slate-900">{preview.length}</div>
                  </div>
                  <div className="rounded-xl bg-white px-4 py-3 border border-slate-200">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Update
                    </div>
                    <div className="text-xl font-black text-amber-700">{updateCount}</div>
                  </div>
                  <div className="rounded-xl bg-white px-4 py-3 border border-slate-200">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Create
                    </div>
                    <div className="text-xl font-black text-emerald-700">{newCount}</div>
                  </div>
                </div>
              </div>
              <div className="hidden">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Rasta:
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-black border border-emerald-100">
                    +{newCount} naujų
                  </span>
                  {updateCount > 0 && (
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-black border border-amber-100">
                      ↺ {updateCount} atnaujinimų
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                    Klubas visiems:
                  </label>
                  <select
                    value={clubOverride}
                    onChange={(e) => setClubOverride(e.target.value)}
                    className="p-2 border border-slate-200 rounded-xl text-xs font-bold bg-white min-w-[160px]"
                  >
                    <option value="">Iš failo</option>
                    {clubs
                      .filter((c) => c.is_active !== false)
                      .map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Preview table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 font-black">
                    <tr>
                      <th className="px-3 py-2.5 text-left w-8">#</th>
                      <th className="px-3 py-2.5 text-left">Statusas</th>
                      <th className="px-3 py-2.5 text-left">asset_id</th>
                      <th className="px-3 py-2.5 text-left">asset_name</th>
                      <th className="px-3 py-2.5 text-left">asset_number</th>
                      <th className="px-3 py-2.5 text-left">club_name</th>
                      <th className="px-3 py-2.5 text-left">location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preview.map((p, i) => (
                      <tr key={i} className={cn("hover:bg-slate-50/60", p.isUpdate && "bg-amber-50/30")}>
                        <td className="px-3 py-2 text-slate-400 text-xs font-bold">{i + 1}</td>
                        <td className="px-3 py-2">
                          {p.isUpdate ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md text-[9px] font-black uppercase tracking-wider border border-amber-100">
                              ↺ Update
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[9px] font-black uppercase tracking-wider border border-emerald-100">
                              + Naujas
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-slate-500">
                          {p.row.asset_id || "—"}
                        </td>
                        <td className="px-3 py-2 font-bold text-slate-900 max-w-[180px] truncate">
                          {p.row.asset_name || <span className="text-red-400 font-medium">—</span>}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-slate-500">
                          {p.row.asset_number || "—"}
                        </td>
                        <td className="px-3 py-2 text-slate-600 text-xs">
                          <span
                            className={cn(
                              "font-medium",
                              !p.resolvedClubId && "text-amber-600",
                            )}
                          >
                            {p.resolvedClubId ? p.resolvedClubName : "Nerasta"}
                          </span>
                          {!p.resolvedClubId && p.row.club_name && (
                            <span className="text-[9px] text-amber-500 ml-1">(nerasta)</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-600 text-xs">
                          {p.row.location || <span className="text-slate-300">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {importDone && (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center">
                <Check size={32} className="text-emerald-600" />
              </div>
              <div>
                <p className="font-black text-slate-900 text-lg">Importas sėkmingas</p>
                <p className="text-sm text-slate-400 font-medium mt-1">
                  {newCount} naujų · {updateCount} atnaujintų
                </p>
              </div>
              <button
                onClick={handleClose}
                className="px-6 py-2.5 bg-black text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all"
              >
                Uždaryti
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {rows && !importDone && (
          <div className="shrink-0 border-t border-slate-100 px-6 py-4 flex items-center justify-between gap-4 bg-white">
            <button
              onClick={() => { setRows(null); setParseError(null); setClubOverride(""); }}
              className="px-4 py-2 rounded-xl text-slate-500 font-bold text-sm hover:bg-slate-100 transition-all"
            >
              ← Atgal
            </button>
            <button
              onClick={handleImport}
              disabled={preview.length === 0}
              className="px-6 py-2.5 bg-black text-white rounded-xl font-black text-sm hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              Importuoti {preview.length} įrašų
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

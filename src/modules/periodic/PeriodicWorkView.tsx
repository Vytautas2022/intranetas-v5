import React, { useMemo, useRef, useState } from "react";
import {
  addMonths,
  differenceInDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Columns,
  ExternalLink,
  LayoutList,
  MoreHorizontal,
  Plus,
  Search,
  X,
} from "lucide-react";
import {
  buildPeriodicInstancesForRange,
  canCompletePeriodicInstance,
  canSkipPeriodicInstance,
  getPeriodicInstanceStatusColor,
  getPeriodicInstanceStatusLabel,
  type PeriodicInstance,
  type PeriodicInstanceStatus,
} from "../../mock-db/periodicInstances";
import { type PeriodicCriticality } from "../../mock-db/periodicTemplates";
import { users } from "../../mock-db/users";
import { cn } from "../../lib/utils";
import { PeriodicCompleteModal } from "./PeriodicCompleteModal";

// ─── Types ─────────────────────────────────────────────────────────────────

type Period = "today" | "week" | "month" | "lastMonth" | "all";
type SortField = "criticality" | "name" | "club" | "assignee" | "dueAt" | "status";
type SortDir = "asc" | "desc";
type ViewMode = "list" | "kanban";

interface Props {
  faults?: any[];
  history?: any[];
  templates?: any[];
  clubs?: any[];
  onOpenCard?: (id: string) => void;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const CRIT_ORDER: Record<string, number> = { CRITICAL: 0, IMPORTANT: 1, STANDARD: 2 };

const KANBAN_COLS: Array<{ status: PeriodicInstanceStatus; label: string }> = [
  { status: "SCHEDULED", label: "Suplanuota" },
  { status: "IN_PROGRESS", label: "Vykdoma" },
  { status: "COMPLETED", label: "Atlikta" },
  { status: "OVERDUE", label: "Vėluoja" },
];

const STATUS_OPTIONS: Array<{ value: PeriodicInstanceStatus; label: string }> = [
  { value: "SCHEDULED", label: "Suplanuota" },
  { value: "IN_PROGRESS", label: "Vykdoma" },
  { value: "COMPLETED", label: "Atlikta" },
  { value: "OVERDUE", label: "Vėluoja" },
  { value: "SKIPPED", label: "Praleista" },
  { value: "REJECTED", label: "Atmesta" },
];

// ─── Sub-components ─────────────────────────────────────────────────────────

const FilterSelect: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
}> = ({ value, onChange, placeholder, options }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={cn(
      "text-sm border rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400",
      value
        ? "border-slate-400 bg-slate-50 font-semibold text-slate-700"
        : "border-slate-200 text-slate-500 bg-white",
    )}
  >
    <option value="">{placeholder}</option>
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

const StatusBadge: React.FC<{ status: PeriodicInstanceStatus }> = ({ status }) => (
  <span
    className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap",
      getPeriodicInstanceStatusColor(status),
    )}
  >
    {getPeriodicInstanceStatusLabel(status)}
  </span>
);

const CritDot: React.FC<{ crit: PeriodicCriticality }> = ({ crit }) => (
  <span
    className={cn(
      "h-2.5 w-2.5 rounded-full inline-block shrink-0",
      crit === "CRITICAL" ? "bg-red-500" : crit === "IMPORTANT" ? "bg-orange-400" : "bg-slate-300",
    )}
  />
);

const SortTh: React.FC<{
  label: string;
  field: SortField;
  current: SortField;
  dir: SortDir;
  onClick: (f: SortField) => void;
  className?: string;
}> = ({ label, field, current, dir, onClick, className }) => (
  <th className={cn("px-3 py-2.5 text-left", className)}>
    <button
      onClick={() => onClick(field)}
      className="flex items-center gap-1 text-xs font-black text-slate-500 uppercase tracking-widest hover:text-slate-800"
    >
      {label}
      {current === field ? (
        dir === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />
      ) : (
        <ChevronsUpDown size={10} className="opacity-40" />
      )}
    </button>
  </th>
);

// ─── Action menu ─────────────────────────────────────────────────────────────

const ActionsMenu: React.FC<{
  instance: PeriodicInstance;
  isOpen: boolean;
  hasCard: boolean;
  onOpen: () => void;
  onClose: () => void;
  onDetail: () => void;
  onOpenCard: () => void;
  onComplete: () => void;
  onSkip: () => void;
  onCreateCard: () => void;
}> = ({
  instance,
  isOpen,
  hasCard,
  onOpen,
  onClose,
  onDetail,
  onOpenCard,
  onComplete,
  onSkip,
  onCreateCard,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  // For photo-proof tasks: always allow clicking to open upload modal
  const needsPhotoModal =
    (instance.requiresPhotoProof || instance.templateSnapshot?.proofRequired) &&
    !instance.photoProofIds?.length;
  const canComplete = needsPhotoModal || canCompletePeriodicInstance(instance).allowed;
  const canSkip = canSkipPeriodicInstance(instance).allowed;
  const isDone = ["COMPLETED", "SKIPPED", "REJECTED"].includes(instance.status);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => (isOpen ? onClose() : onOpen())}
        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
      >
        <MoreHorizontal size={16} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={onClose} />
          <div className="absolute right-0 z-40 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl py-1 text-sm">
            <MenuBtn onClick={onDetail}>Peržiūrėti</MenuBtn>
            {!isDone && (
              <MenuBtn onClick={onComplete} disabled={!canComplete}>
                Atlikti
              </MenuBtn>
            )}
            {!isDone && (
              <MenuBtn onClick={onSkip} disabled={!canSkip}>
                Praleisti
              </MenuBtn>
            )}
            {hasCard ? (
              <MenuBtn onClick={onOpenCard}>
                <ExternalLink size={13} className="inline mr-1" />
                Atidaryti kortelę
              </MenuBtn>
            ) : (
              <MenuBtn onClick={onCreateCard}>
                <Plus size={13} className="inline mr-1" />
                Sukurti kortelę
              </MenuBtn>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const MenuBtn: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ onClick, disabled, children }) => (
  <button
    onClick={disabled ? undefined : onClick}
    className={cn(
      "w-full text-left px-3 py-2 text-sm",
      disabled
        ? "text-slate-300 cursor-default"
        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
    )}
  >
    {children}
  </button>
);

// ─── Detail modal ────────────────────────────────────────────────────────────

const DetailModal: React.FC<{
  instance: PeriodicInstance;
  fault: any | null;
  onClose: () => void;
  onOpenCard: () => void;
  getClubName: (i: PeriodicInstance) => string;
  getAssigneeName: (i: PeriodicInstance) => string | null;
  getCrit: (i: PeriodicInstance) => PeriodicCriticality;
}> = ({ instance, fault, onClose, onOpenCard, getClubName, getAssigneeName, getCrit }) => {
  const crit = getCrit(instance);
  const critLabel = { CRITICAL: "Kritinis", IMPORTANT: "Svarbus", STANDARD: "Standartinis" }[crit];
  const assignee = getAssigneeName(instance);

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <CritDot crit={crit} />
            <h3 className="font-black text-slate-900">{instance.titleSnapshot}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-slate-100 text-slate-400">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <Row label="Klubas" value={getClubName(instance)} />
          <Row label="Atsakingas" value={assignee ?? "⚠ Nepriskirta"} warn={!assignee} />
          <Row label="Kritiškumas" value={critLabel} />
          <Row
            label="Planuota"
            value={instance.dueAt ? format(new Date(instance.dueAt), "yyyy-MM-dd") : "—"}
          />
          <Row label="Statusas">
            <StatusBadge status={instance.status} />
          </Row>
          {instance.descriptionSnapshot && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Aprašymas</p>
              <p className="text-sm text-slate-700">{instance.descriptionSnapshot}</p>
            </div>
          )}
          <div className="pt-2">
            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Workflow kortelė</p>
            {fault ? (
              <div className="flex items-center gap-3">
                <StatusBadge status={fault.status as PeriodicInstanceStatus} />
                <button
                  onClick={onOpenCard}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                >
                  <ExternalLink size={12} /> Atidaryti kortelę
                </button>
              </div>
            ) : (
              <span className="text-sm text-slate-400">— Nesukurta</span>
            )}
          </div>
          {(() => {
            const proofRequired = instance.requiresPhotoProof || instance.templateSnapshot?.proofRequired;
            const rawPhotos = instance.photoProofIds?.length
              ? (() => { try { return JSON.parse(localStorage.getItem(`sg_photos_${instance.id}`) || "[]") as string[]; } catch { return []; } })()
              : [];
            if (rawPhotos.length > 0) {
              return (
                <div className="pt-2">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Foto įrodymas</p>
                  <div className="flex flex-wrap gap-2">
                    {rawPhotos.map((src, i) => (
                      <button key={i} onClick={() => window.open(src, "_blank")} className="h-16 w-16 overflow-hidden rounded-lg border border-slate-200 hover:opacity-80">
                        <img src={src} alt={`Nuotrauka ${i + 1}`} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              );
            }
            if (proofRequired) {
              return (
                <div className="pt-2">
                  <p className="text-xs font-bold text-amber-600">⚠ Foto įrodymas nebuvo įkeltas</p>
                </div>
              );
            }
            return null;
          })()}
        </div>
      </div>
    </div>
  );
};

const Row: React.FC<{
  label: string;
  value?: string;
  warn?: boolean;
  children?: React.ReactNode;
}> = ({ label, value, warn, children }) => (
  <div className="flex items-center justify-between">
    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</span>
    {children ?? (
      <span className={cn("text-sm font-semibold", warn && "text-amber-600")}>
        {warn && <AlertTriangle size={13} className="inline mr-1" />}
        {value}
      </span>
    )}
  </div>
);

// ─── Main component ──────────────────────────────────────────────────────────

export const PeriodicWorkView: React.FC<Props> = ({
  faults = [],
  history = [],
  templates = [],
  clubs = [],
  onOpenCard,
}) => {
  const [view, setView] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [filterClub, setFilterClub] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterStatus, setFilterStatus] = useState<PeriodicInstanceStatus | "">("");
  const [filterCriticality, setFilterCriticality] = useState<PeriodicCriticality | "">("");
  const [period, setPeriod] = useState<Period>("month");
  const [sortField, setSortField] = useState<SortField>("dueAt");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [groupByClub, setGroupByClub] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [localStatuses, setLocalStatuses] = useState<Record<string, PeriodicInstanceStatus>>({});
  const [localCardIds, setLocalCardIds] = useState<Record<string, string>>({});
  const [localPhotoIds, setLocalPhotoIds] = useState<Record<string, string[]>>({});
  const [completingInstance, setCompletingInstance] = useState<PeriodicInstance | null>(null);
  const [detailInstance, setDetailInstance] = useState<PeriodicInstance | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ── Date range ──────────────────────────────────────────────────────────────

  const { rangeStart, rangeEnd } = useMemo(() => {
    const now = new Date();
    if (period === "today") return { rangeStart: startOfDay(now), rangeEnd: endOfDay(now) };
    if (period === "week")
      return {
        rangeStart: startOfWeek(now, { weekStartsOn: 1 }),
        rangeEnd: endOfWeek(now, { weekStartsOn: 1 }),
      };
    if (period === "lastMonth") {
      const lm = subMonths(now, 1);
      return { rangeStart: startOfMonth(lm), rangeEnd: endOfMonth(lm) };
    }
    if (period === "all")
      return { rangeStart: subMonths(now, 6), rangeEnd: addMonths(now, 6) };
    return { rangeStart: startOfMonth(now), rangeEnd: endOfMonth(now) };
  }, [period]);

  // ── Build instances ─────────────────────────────────────────────────────────

  const allInstances = useMemo(() => {
    if (!templates.length || !clubs.length) return [];
    try {
      return buildPeriodicInstancesForRange({
        templates,
        clubs,
        history,
        workflowCards: faults,
        rangeStart,
        rangeEnd,
      }).map((inst) => ({
        ...inst,
        status: (localStatuses[inst.id] as PeriodicInstanceStatus) || inst.status,
        workflowCardId: localCardIds[inst.id] || inst.workflowCardId,
        photoProofIds: localPhotoIds[inst.id] || inst.photoProofIds,
      }));
    } catch {
      return [];
    }
  }, [templates, clubs, history, faults, rangeStart, rangeEnd, localStatuses, localCardIds, localPhotoIds]);

  // ── Filter options ──────────────────────────────────────────────────────────

  const availableClubs = useMemo(() => {
    const seen = new Set<string>();
    return allInstances
      .filter((i) => i.clubId && !seen.has(i.clubId) && seen.add(i.clubId))
      .map((i) => ({
        value: i.clubId!,
        label: (clubs as any[]).find((c) => c.id === i.clubId)?.name || i.clubId!,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [allInstances, clubs]);

  const availableAssignees = useMemo(() => {
    const seen = new Set<string>();
    return allInstances
      .filter((i) => i.assigneeId && !seen.has(i.assigneeId) && seen.add(i.assigneeId))
      .map((i) => ({
        value: i.assigneeId!,
        label: users.find((u) => u.id === i.assigneeId)?.name || i.assigneeId!,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [allInstances]);

  // ── Filter + sort ───────────────────────────────────────────────────────────

  const filteredInstances = useMemo(() => {
    let list = allInstances;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.titleSnapshot.toLowerCase().includes(q) ||
          ((clubs as any[]).find((c) => c.id === i.clubId)?.name || "").toLowerCase().includes(q),
      );
    }
    if (filterClub) list = list.filter((i) => i.clubId === filterClub);
    if (filterAssignee) list = list.filter((i) => i.assigneeId === filterAssignee);
    if (filterStatus) list = list.filter((i) => i.status === filterStatus);
    if (filterCriticality)
      list = list.filter(
        (i) => (i.templateSnapshot?.criticality ?? "STANDARD") === filterCriticality,
      );

    return [...list].sort((a, b) => {
      let va: string | number = 0;
      let vb: string | number = 0;
      if (sortField === "criticality") {
        va = CRIT_ORDER[a.templateSnapshot?.criticality ?? "STANDARD"] ?? 2;
        vb = CRIT_ORDER[b.templateSnapshot?.criticality ?? "STANDARD"] ?? 2;
      } else if (sortField === "name") {
        va = a.titleSnapshot;
        vb = b.titleSnapshot;
      } else if (sortField === "club") {
        va = (clubs as any[]).find((c) => c.id === a.clubId)?.name || "";
        vb = (clubs as any[]).find((c) => c.id === b.clubId)?.name || "";
      } else if (sortField === "assignee") {
        va = users.find((u) => u.id === a.assigneeId)?.name || "";
        vb = users.find((u) => u.id === b.assigneeId)?.name || "";
      } else if (sortField === "dueAt") {
        va = a.dueAt;
        vb = b.dueAt;
      } else if (sortField === "status") {
        const so: Record<string, number> = {
          OVERDUE: 0, IN_PROGRESS: 1, SCHEDULED: 2, COMPLETED: 3, REJECTED: 4, SKIPPED: 5,
        };
        va = so[a.status] ?? 9;
        vb = so[b.status] ?? 9;
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [allInstances, search, filterClub, filterAssignee, filterStatus, filterCriticality, sortField, sortDir, clubs]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const now = Date.now();

  const getCrit = (inst: PeriodicInstance): PeriodicCriticality =>
    inst.templateSnapshot?.criticality ?? "STANDARD";

  const getClubName = (inst: PeriodicInstance): string =>
    (clubs as any[]).find((c) => c.id === inst.clubId)?.name || inst.clubId || "—";

  const getAssigneeName = (inst: PeriodicInstance): string | null =>
    users.find((u) => u.id === inst.assigneeId)?.name ?? null;

  const getLinkedFault = (inst: PeriodicInstance): any | null =>
    (faults as any[]).find(
      (f) => f.id === inst.workflowCardId || f.periodicInstanceId === inst.id,
    ) ?? null;

  const getDaysOverdue = (inst: PeriodicInstance): number => {
    if (["COMPLETED", "SKIPPED", "REJECTED"].includes(inst.status)) return 0;
    const diff = differenceInDays(new Date(), new Date(inst.dueAt));
    return diff > 0 ? diff : 0;
  };

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleOpenCard = (inst: PeriodicInstance) => {
    const fault = getLinkedFault(inst);
    if (fault) {
      onOpenCard?.(fault.id);
    } else if (inst.workflowCardId) {
      showToast(`Kortelė nerasta (ID: ${inst.workflowCardId})`);
    }
    setOpenMenuId(null);
  };

  const handleCreateCard = (inst: PeriodicInstance) => {
    const newId = `PC-${Date.now()}`;
    setLocalCardIds((p) => ({ ...p, [inst.id]: newId }));
    showToast("Workflow kortelė sukurta");
    setOpenMenuId(null);
  };

  const handleComplete = (inst: PeriodicInstance) => {
    setCompletingInstance(inst);
    setOpenMenuId(null);
  };

  const handleCompleteConfirm = (photoFiles: string[]) => {
    const inst = completingInstance;
    if (!inst) return;
    const photoIds = photoFiles.map((_, i) => `photo_${inst.id}_${i}`);
    if (photoFiles.length > 0) {
      localStorage.setItem(`sg_photos_${inst.id}`, JSON.stringify(photoFiles));
    }
    if (photoIds.length > 0) {
      setLocalPhotoIds((p) => ({ ...p, [inst.id]: photoIds }));
    }
    const instWithPhotos = { ...inst, photoProofIds: photoIds };
    const chk = canCompletePeriodicInstance(instWithPhotos);
    if (!chk.allowed) { showToast(chk.reason || "Negalima atlikti"); setCompletingInstance(null); return; }
    setLocalStatuses((p) => ({ ...p, [inst.id]: "COMPLETED" }));
    setCompletingInstance(null);
    showToast("Užduotis pažymėta kaip atlikta");
  };

  const handleSkip = (inst: PeriodicInstance) => {
    const chk = canSkipPeriodicInstance(inst);
    if (!chk.allowed) { showToast(chk.reason || "Negalima praleisti"); return; }
    setLocalStatuses((p) => ({ ...p, [inst.id]: "SKIPPED" }));
    setOpenMenuId(null);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const clearFilters = () => {
    setSearch(""); setFilterClub(""); setFilterAssignee("");
    setFilterStatus(""); setFilterCriticality(""); setPeriod("month");
  };

  const hasActiveFilters =
    search || filterClub || filterAssignee || filterStatus || filterCriticality || period !== "month";

  // ── Row renderer (shared between list and grouped list) ─────────────────────

  const renderRow = (inst: PeriodicInstance) => {
    const crit = getCrit(inst);
    const clubName = getClubName(inst);
    const assignee = getAssigneeName(inst);
    const fault = getLinkedFault(inst);
    const daysOver = getDaysOverdue(inst);
    const dueStr = inst.dueAt ? format(new Date(inst.dueAt), "yyyy-MM-dd") : "—";

    return (
      <tr key={inst.id} className="border-b border-slate-100 hover:bg-slate-50">
        {/* Kritiškumas */}
        <td className="px-3 py-2.5">
          <div className="flex items-center justify-center">
            <CritDot crit={crit} />
          </div>
        </td>

        {/* Užduotis */}
        <td className="px-3 py-2.5 max-w-[200px]">
          <p className="text-sm font-bold text-slate-800 truncate">{inst.titleSnapshot}</p>
        </td>

        {/* Klubas */}
        <td className="px-3 py-2.5">
          <span className="text-sm text-slate-600">{clubName}</span>
        </td>

        {/* Atsakingas */}
        <td className="px-3 py-2.5">
          {assignee ? (
            <span className="text-sm text-slate-700">{assignee}</span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
              <AlertTriangle size={12} /> Nepriskirta
            </span>
          )}
        </td>

        {/* Planuota */}
        <td className="px-3 py-2.5 whitespace-nowrap">
          {daysOver > 0 ? (
            <span className="text-xs font-bold text-red-600">
              {dueStr} (vėluoja {daysOver} d.)
            </span>
          ) : (
            <span className="text-sm text-slate-600">{dueStr}</span>
          )}
        </td>

        {/* Instancijos statusas */}
        <td className="px-3 py-2.5">
          <StatusBadge status={inst.status} />
        </td>

        {/* Workflow kortelė */}
        <td className="px-3 py-2.5">
          {fault ? (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-xs font-bold px-1.5 py-0.5 rounded",
                  getPeriodicInstanceStatusColor(fault.status as PeriodicInstanceStatus) ||
                    "bg-slate-100 text-slate-600",
                )}
              >
                {fault.status}
              </span>
              <button
                onClick={() => handleOpenCard(inst)}
                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
              >
                <ExternalLink size={11} /> Atidaryti
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">— Nesukurta</span>
              <button
                onClick={() => handleCreateCard(inst)}
                className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 rounded px-1.5 py-0.5 hover:bg-slate-100"
              >
                <Plus size={11} /> Sukurti
              </button>
            </div>
          )}
        </td>

        {/* Veiksmai */}
        <td className="px-3 py-2.5">
          <ActionsMenu
            instance={inst}
            isOpen={openMenuId === inst.id}
            hasCard={!!fault}
            onOpen={() => setOpenMenuId(inst.id)}
            onClose={() => setOpenMenuId(null)}
            onDetail={() => { setDetailInstance(inst); setOpenMenuId(null); }}
            onOpenCard={() => handleOpenCard(inst)}
            onComplete={() => handleComplete(inst)}
            onSkip={() => handleSkip(inst)}
            onCreateCard={() => handleCreateCard(inst)}
          />
        </td>
      </tr>
    );
  };

  const tableHead = (
    <thead className="bg-slate-50 border-b border-slate-200">
      <tr>
        <SortTh label="" field="criticality" current={sortField} dir={sortDir} onClick={handleSort} className="w-8" />
        <SortTh label="Užduotis" field="name" current={sortField} dir={sortDir} onClick={handleSort} />
        <SortTh label="Klubas" field="club" current={sortField} dir={sortDir} onClick={handleSort} />
        <SortTh label="Atsakingas" field="assignee" current={sortField} dir={sortDir} onClick={handleSort} />
        <SortTh label="Planuota" field="dueAt" current={sortField} dir={sortDir} onClick={handleSort} />
        <SortTh label="Statusas" field="status" current={sortField} dir={sortDir} onClick={handleSort} />
        <th className="px-3 py-2.5 text-left text-xs font-black text-slate-500 uppercase tracking-widest">
          Workflow kortelė
        </th>
        <th className="px-3 py-2.5 w-12" />
      </tr>
    </thead>
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-[200] bg-slate-900 text-white text-sm font-semibold px-4 py-3 rounded-lg shadow-xl">
          {toast}
        </div>
      )}

      {/* TOP BAR */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
              placeholder="Ieškoti užduoties..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {/* View toggle */}
          <div className="ml-auto flex items-center gap-0.5 border border-slate-200 rounded-md p-1">
            <button
              onClick={() => setView("list")}
              title="Sąrašas"
              className={cn(
                "p-1.5 rounded transition-colors",
                view === "list" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700",
              )}
            >
              <LayoutList size={15} />
            </button>
            <button
              onClick={() => setView("kanban")}
              title="Kanban"
              className={cn(
                "p-1.5 rounded transition-colors",
                view === "kanban" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700",
              )}
            >
              <Columns size={15} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            value={filterClub}
            onChange={setFilterClub}
            placeholder="Visi klubai"
            options={availableClubs}
          />
          <FilterSelect
            value={filterAssignee}
            onChange={setFilterAssignee}
            placeholder="Atsakingas"
            options={availableAssignees}
          />
          <FilterSelect
            value={filterStatus}
            onChange={(v) => setFilterStatus(v as PeriodicInstanceStatus | "")}
            placeholder="Statusas"
            options={STATUS_OPTIONS}
          />
          <FilterSelect
            value={filterCriticality}
            onChange={(v) => setFilterCriticality(v as PeriodicCriticality | "")}
            placeholder="Kritiškumas"
            options={[
              { value: "CRITICAL", label: "Kritinis" },
              { value: "IMPORTANT", label: "Svarbus" },
              { value: "STANDARD", label: "Standartinis" },
            ]}
          />
          <FilterSelect
            value={period}
            onChange={(v) => setPeriod(v as Period)}
            placeholder="Periodas"
            options={[
              { value: "today", label: "Šiandien" },
              { value: "week", label: "Ši savaitė" },
              { value: "month", label: "Šis mėnuo" },
              { value: "lastMonth", label: "Praėjęs mėnuo" },
              { value: "all", label: "Visi" },
            ]}
          />
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-2 py-1.5 rounded hover:bg-slate-100"
            >
              <X size={12} /> Išvalyti
            </button>
          )}
        </div>
      </div>

      {/* Empty: no instances at all */}
      {allInstances.length === 0 && (
        <div className="flex flex-col items-center py-24 text-center">
          <Calendar size={44} className="text-slate-200 mb-4" />
          <p className="font-black text-slate-500 text-lg">Periodinių darbų instancijų nerasta</p>
          <p className="text-sm text-slate-400 mt-1">Sukurkite šabloną ir sugeneruokite darbus</p>
        </div>
      )}

      {/* Empty: filters produce nothing */}
      {allInstances.length > 0 && filteredInstances.length === 0 && (
        <div className="flex flex-col items-center py-20 text-center">
          <p className="font-bold text-slate-500">Pagal pasirinktus filtrus įrašų nerasta</p>
          <button
            onClick={clearFilters}
            className="mt-3 text-sm font-bold text-blue-600 hover:underline"
          >
            Išvalyti filtrus
          </button>
        </div>
      )}

      {/* LIST VIEW */}
      {view === "list" && filteredInstances.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer select-none">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-slate-300"
                checked={groupByClub}
                onChange={(e) => setGroupByClub(e.target.checked)}
              />
              Grupuoti pagal klubą
            </label>
            <span className="text-xs text-slate-400 font-semibold">{filteredInstances.length} įrašų</span>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            {groupByClub ? (
              // Grouped by club
              (() => {
                const groups = new Map<string, PeriodicInstance[]>();
                filteredInstances.forEach((inst) => {
                  const key = inst.clubId || "__none__";
                  if (!groups.has(key)) groups.set(key, []);
                  groups.get(key)!.push(inst);
                });
                return Array.from(groups.entries()).map(([clubId, instances]) => (
                  <div key={clubId}>
                    <div className="bg-slate-100 px-4 py-2 border-b border-slate-200">
                      <span className="text-xs font-black text-slate-600 uppercase tracking-widest">
                        {(clubs as any[]).find((c) => c.id === clubId)?.name || clubId}
                        <span className="ml-2 font-normal text-slate-400">({instances.length})</span>
                      </span>
                    </div>
                    <table className="w-full">
                      {tableHead}
                      <tbody>{instances.map(renderRow)}</tbody>
                    </table>
                  </div>
                ));
              })()
            ) : (
              <table className="w-full">
                {tableHead}
                <tbody>{filteredInstances.map(renderRow)}</tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* KANBAN VIEW */}
      {view === "kanban" && filteredInstances.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {KANBAN_COLS.map((col) => {
            const cards = filteredInstances.filter((i) => i.status === col.status);
            const colColor =
              col.status === "OVERDUE"
                ? "bg-red-50 border-red-200"
                : col.status === "COMPLETED"
                  ? "bg-green-50 border-green-200"
                  : col.status === "IN_PROGRESS"
                    ? "bg-blue-50 border-blue-200"
                    : "bg-slate-50 border-slate-200";

            return (
              <div key={col.status} className={cn("rounded-lg border p-3", colColor)}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-black text-slate-600 uppercase tracking-widest">
                    {col.label}
                  </h4>
                  <span className="text-xs font-bold text-slate-400 bg-white rounded-full px-2 py-0.5 border border-slate-200">
                    {cards.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {cards.length === 0 && (
                    <p className="text-xs text-center text-slate-400 py-4">—</p>
                  )}
                  {cards.map((inst) => {
                    const crit = getCrit(inst);
                    const fault = getLinkedFault(inst);
                    const assignee = getAssigneeName(inst);
                    const daysOver = getDaysOverdue(inst);

                    const borderColor =
                      crit === "CRITICAL"
                        ? "border-l-red-500"
                        : crit === "IMPORTANT"
                          ? "border-l-orange-400"
                          : "border-l-slate-300";

                    return (
                      <div
                        key={inst.id}
                        className={cn(
                          "bg-white rounded-md p-3 border border-slate-200 border-l-4 shadow-sm",
                          borderColor,
                        )}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <CritDot crit={crit} />
                          <p className="text-sm font-bold text-slate-800 leading-tight flex-1">
                            {inst.titleSnapshot}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500 mb-1">{getClubName(inst)}</p>
                        {assignee ? (
                          <p className="text-xs text-slate-600 mb-2">{assignee}</p>
                        ) : (
                          <p className="flex items-center gap-1 text-xs text-amber-600 font-bold mb-2">
                            <AlertTriangle size={11} /> Nepriskirta
                          </p>
                        )}
                        <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                          <Calendar size={11} />
                          <span className={daysOver > 0 ? "text-red-600 font-bold" : ""}>
                            {inst.dueAt ? format(new Date(inst.dueAt), "yyyy-MM-dd") : "—"}
                            {daysOver > 0 && ` (${daysOver} d.)`}
                          </span>
                        </div>
                        {fault && (
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="text-xs text-slate-500">Kortelė:</span>
                            <span className="text-xs font-bold text-slate-700">{fault.status}</span>
                          </div>
                        )}
                        <button
                          onClick={() => setDetailInstance(inst)}
                          className="mt-1 w-full text-center text-xs font-bold text-slate-600 hover:text-slate-900 py-1.5 border border-slate-200 rounded hover:bg-slate-50"
                        >
                          → Atidaryti
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {detailInstance && (
        <DetailModal
          instance={detailInstance}
          fault={getLinkedFault(detailInstance)}
          onClose={() => setDetailInstance(null)}
          onOpenCard={() => handleOpenCard(detailInstance)}
          getClubName={getClubName}
          getAssigneeName={getAssigneeName}
          getCrit={getCrit}
        />
      )}

      {/* Completion modal with photo upload */}
      {completingInstance && (
        <PeriodicCompleteModal
          instance={completingInstance}
          onClose={() => setCompletingInstance(null)}
          onConfirm={handleCompleteConfirm}
        />
      )}
    </div>
  );
};

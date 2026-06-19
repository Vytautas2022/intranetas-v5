import React, { useState } from "react";
import {
  Edit2,
  ExternalLink,
  History,
  Plus,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react";
import { PeriodicTemplate } from "../../mock-db/periodicTemplates";
import { cn } from "../../lib/utils";

interface PeriodicTemplatesViewProps {
  templates: PeriodicTemplate[];
  history?: any[];
  onEditTemplate: (template: PeriodicTemplate) => void;
  onCreateTemplate: () => void;
  onOpenCard?: (id: string) => void;
}

const formatDate = (value?: string | number) =>
  value ? new Date(value).toLocaleDateString("lt-LT") : "-";

const getPeriod = (value?: string | number) => {
  if (!value) return "-";
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

export const PeriodicTemplatesView: React.FC<PeriodicTemplatesViewProps> = ({
  templates,
  history = [],
  onEditTemplate,
  onCreateTemplate,
  onOpenCard,
}) => {
  const [historyTemplate, setHistoryTemplate] = useState<PeriodicTemplate | null>(null);
  const templateHistory = historyTemplate
    ? history
        .filter((record) => record.templateId === historyTemplate.id)
        .sort(
          (a, b) =>
            new Date(b.scheduledDate || b.completedAt || 0).getTime() -
            new Date(a.scheduledDate || a.completedAt || 0).getTime(),
        )
    : [];

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-black text-slate-900">Periodiniai šablonai</h2>
        <button
          onClick={onCreateTemplate}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-sm"
        >
          <Plus size={16} /> Naujas šablonas
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100">
              <th className="pb-3 px-2 uppercase text-[10px] tracking-widest font-black">
                Pavadinimas
              </th>
              <th className="pb-3 px-2 uppercase text-[10px] tracking-widest font-black">
                Tipas
              </th>
              <th className="pb-3 px-2 uppercase text-[10px] tracking-widest font-black">
                Periodiškumas
              </th>
              <th className="pb-3 px-2 uppercase text-[10px] tracking-widest font-black text-center">
                Aktyvus
              </th>
              <th className="pb-3 px-2" />
            </tr>
          </thead>
          <tbody>
            {(templates || []).map((template) => (
              <tr
                key={template.id}
                className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
              >
                <td className="py-4 px-2">
                  <div className="flex flex-col">
                    <span className="font-black text-slate-900">
                      {template.name || template.title}
                    </span>
                    {template.sopUrl && (
                      <a
                        href={template.sopUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 hover:text-emerald-700 text-[10px] font-bold flex items-center gap-1 mt-1"
                      >
                        SOP nuoroda <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </td>
                <td className="py-4 px-2">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest",
                      template.type === "MANDATORY" || template.isMandatory
                        ? "bg-red-50 text-red-600 border border-red-100"
                        : "bg-slate-50 text-slate-600 border border-slate-100",
                    )}
                  >
                    {template.type === "MANDATORY" || template.isMandatory
                      ? "Privaloma"
                      : "Neprivaloma"}
                  </span>
                </td>
                <td className="py-4 px-2 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  {template.recurrence || template.frequency}
                </td>
                <td className="py-4 px-2 text-center text-slate-900">
                  <div className="flex justify-center">
                    {template.isActive ? (
                      <ToggleRight className="text-emerald-500" />
                    ) : (
                      <ToggleLeft className="text-slate-300" />
                    )}
                  </div>
                </td>
                <td className="py-4 px-2 text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => setHistoryTemplate(template)}
                      className="inline-flex items-center gap-1 px-2 py-2 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-900 transition-all text-xs font-bold"
                    >
                      <History size={15} /> Istorija
                    </button>
                    <button
                      onClick={() => onEditTemplate(template)}
                      className="p-2 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-900 transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {historyTemplate && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-black text-slate-900">Istorija</h3>
                <p className="text-sm text-slate-500">
                  {historyTemplate.name || historyTemplate.title}
                </p>
              </div>
              <button
                onClick={() => setHistoryTemplate(null)}
                className="p-2 rounded-md hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="p-3 font-black text-[10px] uppercase tracking-widest">Periodas</th>
                    <th className="p-3 font-black text-[10px] uppercase tracking-widest">Klubas</th>
                    <th className="p-3 font-black text-[10px] uppercase tracking-widest">Būsena</th>
                    <th className="p-3 font-black text-[10px] uppercase tracking-widest">Atliko</th>
                    <th className="p-3 font-black text-[10px] uppercase tracking-widest">Atlikta</th>
                    <th className="p-3 font-black text-[10px] uppercase tracking-widest">Kortelės nuoroda</th>
                    <th className="p-3 font-black text-[10px] uppercase tracking-widest">Komentaras</th>
                    <th className="p-3 font-black text-[10px] uppercase tracking-widest">Nuotraukų sk.</th>
                  </tr>
                </thead>
                <tbody>
                  {templateHistory.length === 0 ? (
                    <tr>
                      <td className="p-6 text-center text-slate-500" colSpan={8}>
                        Istorijos įrašų nėra
                      </td>
                    </tr>
                  ) : (
                    templateHistory.map((record) => (
                      <tr key={record.id} className="border-t border-slate-100">
                        <td className="p-3 font-bold text-slate-800">
                          {getPeriod(record.scheduledDate || record.completedAt)}
                        </td>
                        <td className="p-3 text-slate-700">
                          {record.clubName || record.clubId || "-"}
                        </td>
                        <td className="p-3">
                          <span
                            className={cn(
                              "px-2 py-1 rounded text-xs font-black",
                              record.status === "COMPLETED"
                                ? "bg-emerald-100 text-emerald-700"
                                : record.status === "OVERDUE"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-slate-100 text-slate-700",
                            )}
                          >
                            {record.status || "-"}
                          </span>
                        </td>
                        <td className="p-3 text-slate-700">{record.completedBy || "-"}</td>
                        <td className="p-3 text-slate-700">{formatDate(record.completedAt)}</td>
                        <td className="p-3">
                          {record.generatedTaskId && onOpenCard ? (
                            <button
                              onClick={() => onOpenCard(record.generatedTaskId)}
                              className="inline-flex items-center gap-1 text-blue-700 font-bold hover:text-blue-900"
                            >
                              Atidaryti <ExternalLink size={13} />
                            </button>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-700 max-w-[240px] truncate">
                          {record.notes ||
                            record.decisionReason ||
                            record.rescheduleReason ||
                            "-"}
                        </td>
                        <td className="p-3 text-slate-700">
                          {record.attachments?.length || 0}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

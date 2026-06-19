import React, { useMemo } from "react";
import { addMonths, format } from "date-fns";
import { ExternalLink } from "lucide-react";
import {
  buildPeriodicInstancesForRange,
  type PeriodicInstance,
} from "../../mock-db/periodicInstances";
import { users } from "../../mock-db/users";
import { workflowTypes } from "../../mock-db/workflowTypes";
import { cn } from "../../lib/utils";

interface Props {
  faults?: any[];
  templates?: any[];
  history?: any[];
  clubs?: any[];
  onOpenCard?: (id: string) => void;
}

const statusLabels: Record<PeriodicInstance["status"], string> = {
  SCHEDULED: "Suplanuota",
  IN_PROGRESS: "Vykdoma",
  COMPLETED: "Atlikta",
  REJECTED: "Atmesta",
  OVERDUE: "Vėluoja",
  SKIPPED: "Praleista",
};

const statusClass: Record<PeriodicInstance["status"], string> = {
  SCHEDULED: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-zinc-200 text-zinc-700",
  OVERDUE: "bg-red-100 text-red-700",
  SKIPPED: "bg-gray-100 text-gray-600",
};

const formatDate = (value?: number | string) =>
  value ? format(new Date(value), "yyyy-MM-dd") : "-";

export const PeriodicLatestTasksView: React.FC<Props> = ({
  faults = [],
  templates = [],
  history = [],
  clubs = [],
  onOpenCard,
}) => {
  const instances = useMemo(() => {
    const now = new Date();
    return buildPeriodicInstancesForRange({
      templates,
      clubs,
      history,
      workflowCards: faults,
      rangeStart: addMonths(now, -12),
      rangeEnd: addMonths(now, 12),
    }).sort((a, b) => {
      const dateA = a.completedAt || a.updatedAt || a.dueDate || a.dueAt;
      const dateB = b.completedAt || b.updatedAt || b.dueDate || b.dueAt;
      return dateB - dateA;
    });
  }, [clubs, faults, history, templates]);

  const getWorkflowName = (workflowTypeId?: string) =>
    workflowTypes.find((workflow) => workflow.id === workflowTypeId)?.name ||
    workflowTypeId ||
    "-";

  const getClubName = (clubId?: string) =>
    clubs.find((club) => club.id === clubId)?.name || clubId || "-";

  const getAssigneeName = (assigneeId?: string) =>
    users.find((user) => user.id === assigneeId)?.name || assigneeId || "Nepriskirta";

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <h2 className="text-lg font-black text-slate-900">Naujausios užduotys</h2>
        <p className="text-sm text-slate-500">
          Naujausi periodiniai darbai viename sąraše.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <th className="p-3">Data</th>
              <th className="p-3">Workflow</th>
              <th className="p-3">Klubas</th>
              <th className="p-3">Pavadinimas</th>
              <th className="p-3">Atsakingas</th>
              <th className="p-3">Statusas</th>
              <th className="p-3 text-right">Kortelė</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {instances.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-slate-500">
                  Užduočių nėra.
                </td>
              </tr>
            ) : (
              instances.map((instance) => (
                <tr key={instance.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-700">
                    {formatDate(instance.completedAt || instance.dueDate || instance.dueAt)}
                  </td>
                  <td className="p-3 text-slate-700">
                    {getWorkflowName(instance.workflowTypeId)}
                  </td>
                  <td className="p-3 text-slate-700">{getClubName(instance.clubId)}</td>
                  <td className="p-3 font-bold text-slate-900">
                    {instance.titleSnapshot}
                  </td>
                  <td className="p-3 text-slate-700">
                    {getAssigneeName(instance.assigneeId)}
                  </td>
                  <td className="p-3">
                    <span
                      className={cn(
                        "inline-flex px-2 py-1 rounded text-xs font-black",
                        statusClass[instance.status],
                      )}
                    >
                      {statusLabels[instance.status]}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {instance.workflowCardId && onOpenCard ? (
                      <button
                        onClick={() => onOpenCard(instance.workflowCardId!)}
                        className="inline-flex items-center gap-1 text-blue-700 font-bold hover:text-blue-900"
                      >
                        Atidaryti <ExternalLink size={13} />
                      </button>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

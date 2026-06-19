import React, { useMemo, useState } from "react";
import { addMonths, endOfDay, format } from "date-fns";
import { ExternalLink, Search, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { workflowTypes } from "../../mock-db/workflowTypes";

interface Props {
  history?: any[];
  faults?: any[];
  templates?: any[];
  clubs?: any[];
  onOpenCard?: (id: string) => void;
  onOpenTemplate?: (template: any) => void;
}

const statusLabel: Record<string, string> = {
  COMPLETED: "Atlikta",
  OVERDUE: "Vėluoja",
  SKIPPED: "Praleista",
  REJECTED: "Atmesta",
  SCHEDULED: "Suplanuota",
  IN_PROGRESS: "Vykdoma",
  RESCHEDULED: "Perplanuota",
  ACTION_NEEDED: "Reikia veiksmo",
};

const statusClass: Record<string, string> = {
  COMPLETED: "bg-emerald-100 text-emerald-700",
  OVERDUE: "bg-red-100 text-red-700",
  SKIPPED: "bg-gray-100 text-gray-600",
  REJECTED: "bg-zinc-100 text-zinc-700",
  SCHEDULED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  RESCHEDULED: "bg-amber-100 text-amber-700",
  ACTION_NEEDED: "bg-orange-100 text-orange-700",
};

const formatDate = (value?: number | string) =>
  value ? new Date(value).toLocaleDateString("lt-LT") : "-";

const getPeriod = (value?: number | string) => {
  if (!value) return "-";
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const getRecordDate = (record: any) =>
  new Date(record.completedAt || record.scheduledDate || 0).getTime();

const isCompletedPeriodicCard = (card: any) => {
  const status = String(card.status || "").toLowerCase();
  return (
    Boolean(card.periodicTemplateId || card.template_id) &&
    (status.includes("fixed") ||
      status.includes("done") ||
      status.includes("completed") ||
      status.includes("atlikta"))
  );
};

interface DetailModalProps {
  record: any;
  template?: any;
  workflowName: string;
  onClose: () => void;
  onOpenCard?: (id: string) => void;
  onOpenTemplate?: (template: any) => void;
}

const RecordDetailModal: React.FC<DetailModalProps> = ({
  record,
  template,
  workflowName,
  onClose,
  onOpenCard,
  onOpenTemplate,
}) => (
  <div
    className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center p-4"
    onClick={onClose}
  >
    <div
      className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div>
          <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
            {record.templateTitle || template?.name || "-"}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {record.clubName || "-"} · {getPeriod(record.scheduledDate || record.completedAt)}
          </p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors">
          <X size={18} className="text-slate-400" />
        </button>
      </div>

      <div className="p-5 space-y-3 text-sm">
        <Row label="Workflow">{workflowName}</Row>
        <Row label="Klubas">{record.clubName || "-"}</Row>
        <Row label="Atliko">{record.completedBy || "-"}</Row>
        <Row label="Atlikimo data">{formatDate(record.completedAt)}</Row>
        <Row label="Komentaras">
          {record.notes || record.decisionReason || record.rescheduleReason || "-"}
        </Row>
        <Row label="Nuotraukų sk.">{record.attachments?.length || 0}</Row>
        <Row label="Statusas">
          <span
            className={cn(
              "px-2 py-0.5 rounded text-xs font-bold uppercase",
              statusClass[record.status] || "bg-slate-100 text-slate-600",
            )}
          >
            {statusLabel[record.status] || record.status || "-"}
          </span>
        </Row>
        {(record.generatedTaskId || record.workflowCardId) && onOpenCard && (
          <Row label="Kortelė">
            <button
              onClick={() => {
                onOpenCard(record.generatedTaskId || record.workflowCardId);
                onClose();
              }}
              className="inline-flex items-center gap-1 text-blue-700 font-bold hover:text-blue-900"
            >
              Atidaryti kortelę <ExternalLink size={13} />
            </button>
          </Row>
        )}
        {template && onOpenTemplate && (
          <Row label="Šablonas">
            <button
              onClick={() => {
                onOpenTemplate(template);
                onClose();
              }}
              className="inline-flex items-center gap-1 text-blue-700 font-bold hover:text-blue-900"
            >
              Atidaryti šabloną <ExternalLink size={13} />
            </button>
          </Row>
        )}
      </div>

      <div className="p-5 pt-0">
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
        >
          Uždaryti
        </button>
      </div>
    </div>
  </div>
);

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-start gap-2">
    <span className="text-slate-400 font-bold w-32 shrink-0">{label}</span>
    <span className="text-slate-800 font-semibold">{children}</span>
  </div>
);

export const PeriodicHistoryView: React.FC<Props> = ({
  history = [],
  faults = [],
  templates = [],
  clubs = [],
  onOpenCard,
  onOpenTemplate,
}) => {
  const defaultDateFrom = format(addMonths(new Date(), -12), "yyyy-MM-dd");
  const defaultDateTo = format(new Date(), "yyyy-MM-dd");

  const [search, setSearch] = useState("");
  const [workflowFilter, setWorkflowFilter] = useState("");
  const [clubFilter, setClubFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState(defaultDateFrom);
  const [dateTo, setDateTo] = useState(defaultDateTo);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  const getTemplate = (templateId?: string) =>
    templates.find((template) => template.id === templateId);

  const completedCardHistory = useMemo(
    () =>
      faults.filter(isCompletedPeriodicCard).map((card) => {
        const templateId = card.periodicTemplateId || card.template_id;
        const template = getTemplate(templateId);
        const completedAt = card.completedAt || card.closedAt || card.updatedAt || Date.now();
        const club = clubs.find((item) => item.id === card.clubId);

        return {
          id: `workflow-${card.id}`,
          templateId,
          templateTitle:
            template?.name ||
            template?.title ||
            card.periodicTemplateTitle ||
            card.title ||
            "Periodinė užduotis",
          workflowTypeId: card.workflowTypeId || template?.destinationWorkflowTypeId,
          clubId: card.clubId,
          clubName: card.clubName || club?.name || card.clubId || "-",
          status: "COMPLETED",
          completedAt,
          scheduledDate: card.periodicDueDate || card.dueDate || card.dueAt || completedAt,
          completedBy: card.completedBy || card.closedBy || card.updatedBy || card.assigned_to || "-",
          notes:
            card.completionComment ||
            card.resolution ||
            card.comments?.[card.comments.length - 1]?.text ||
            "",
          attachments: card.attachments || card.media || [],
          generatedTaskId: card.id,
          workflowCardId: card.id,
        };
      }),
    [faults, templates, clubs],
  );

  const executionHistory = useMemo(() => {
    const byId = new Map<string, any>();
    history.forEach((record) => {
      byId.set(record.workflowCardId || record.generatedTaskId || record.id, record);
    });
    completedCardHistory.forEach((record) => {
      const key = record.workflowCardId || record.generatedTaskId || record.id;
      if (!byId.has(key)) byId.set(key, record);
    });
    return Array.from(byId.values());
  }, [completedCardHistory, history]);

  const getWorkflowId = (record: any) =>
    getTemplate(record.templateId)?.destinationWorkflowTypeId || record.workflowTypeId || "";

  const getWorkflowName = (record: any) => {
    const workflowId = getWorkflowId(record);
    return workflowTypes.find((workflow) => workflow.id === workflowId)?.name || workflowId || "-";
  };

  const workflowOptions = useMemo(() => {
    const ids = new Set<string>();
    executionHistory.forEach((record) => {
      const workflowId =
        templates.find((template) => template.id === record.templateId)
          ?.destinationWorkflowTypeId || record.workflowTypeId;
      if (workflowId) ids.add(workflowId);
    });
    return Array.from(ids)
      .map((id) => ({
        id,
        name: workflowTypes.find((workflow) => workflow.id === id)?.name || id,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "lt"));
  }, [executionHistory, templates]);

  const allClubNames = useMemo(
    () => Array.from(new Set(executionHistory.map((record) => record.clubName).filter(Boolean))).sort(),
    [executionHistory],
  );

  const allAssignees = useMemo(
    () =>
      Array.from(new Set(executionHistory.map((record) => record.completedBy).filter(Boolean))).sort(),
    [executionHistory],
  );

  const filtered = useMemo(() => {
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? endOfDay(new Date(dateTo)) : null;
    const query = search.trim().toLowerCase();

    return executionHistory
      .filter((record) => {
        const recordDate = new Date(record.scheduledDate || record.completedAt || 0);
        const workflowId =
          templates.find((template) => template.id === record.templateId)
            ?.destinationWorkflowTypeId || record.workflowTypeId || "";

        if (from && recordDate < from) return false;
        if (to && recordDate > to) return false;
        if (workflowFilter && workflowId !== workflowFilter) return false;
        if (clubFilter && record.clubName !== clubFilter) return false;
        if (assigneeFilter && record.completedBy !== assigneeFilter) return false;
        if (query && !(record.templateTitle || "").toLowerCase().includes(query)) return false;
        return true;
      })
      .sort((a, b) => getRecordDate(b) - getRecordDate(a));
  }, [executionHistory, search, workflowFilter, clubFilter, assigneeFilter, dateFrom, dateTo, templates]);

  const hasFilters =
    search ||
    workflowFilter ||
    clubFilter ||
    assigneeFilter ||
    dateFrom !== defaultDateFrom ||
    dateTo !== defaultDateTo;

  const clearFilters = () => {
    setSearch("");
    setWorkflowFilter("");
    setClubFilter("");
    setAssigneeFilter("");
    setDateFrom(defaultDateFrom);
    setDateTo(defaultDateTo);
  };

  const selectedTemplate = selectedRecord ? getTemplate(selectedRecord.templateId) : undefined;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Ieškoti pagal pavadinimą"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-slate-300"
            />
          </div>

          <select
            value={workflowFilter}
            onChange={(event) => setWorkflowFilter(event.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm"
          >
            <option value="">Workflow</option>
            {workflowOptions.map((workflow) => (
              <option key={workflow.id} value={workflow.id}>
                {workflow.name}
              </option>
            ))}
          </select>

          <select
            value={clubFilter}
            onChange={(event) => setClubFilter(event.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm"
          >
            <option value="">Klubas</option>
            {allClubNames.map((clubName) => (
              <option key={clubName} value={clubName}>
                {clubName}
              </option>
            ))}
          </select>

          <select
            value={assigneeFilter}
            onChange={(event) => setAssigneeFilter(event.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm"
          >
            <option value="">Atsakingas</option>
            {allAssignees.map((assignee) => (
              <option key={assignee} value={assignee}>
                {assignee}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="flex-1 min-w-0 border border-slate-200 rounded-xl px-2 py-2 text-xs"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="flex-1 min-w-0 border border-slate-200 rounded-xl px-2 py-2 text-xs"
            />
          </div>
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-700 transition-colors"
          >
            Išvalyti filtrus
          </button>
        )}
      </div>

      <div className="text-xs text-slate-500 font-medium px-1">
        {filtered.length} įrašai
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <th className="p-3">Užduotis</th>
                <th className="p-3">Workflow</th>
                <th className="p-3">Klubas</th>
                <th className="p-3">Atliko</th>
                <th className="p-3">Atlikimo data</th>
                <th className="p-3">Statusas</th>
                <th className="p-3">Komentaras</th>
                <th className="p-3 text-right">Nuotraukų sk.</th>
                <th className="p-3 text-right">Kortelė</th>
                <th className="p-3 text-right">Šablonas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-10 text-center text-slate-400 text-sm">
                    Įrašų nerasta pagal pasirinktus filtrus.
                  </td>
                </tr>
              ) : (
                filtered.map((record) => {
                  const template = getTemplate(record.templateId);
                  return (
                    <tr
                      key={record.id}
                      onClick={() => setSelectedRecord(record)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="p-3 font-semibold text-slate-900 max-w-[220px] truncate">
                        {record.templateTitle || template?.name || "-"}
                      </td>
                      <td className="p-3 text-slate-600">{getWorkflowName(record)}</td>
                      <td className="p-3 text-slate-600">{record.clubName || "-"}</td>
                      <td className="p-3 text-slate-600">{record.completedBy || "-"}</td>
                      <td className="p-3 text-slate-600">{formatDate(record.completedAt)}</td>
                      <td className="p-3">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-black uppercase",
                            statusClass[record.status] || "bg-slate-100 text-slate-600",
                          )}
                        >
                          {statusLabel[record.status] || record.status || "-"}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 max-w-[220px] truncate text-xs">
                        {record.notes || record.decisionReason || record.rescheduleReason || "-"}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-700">
                        {record.attachments?.length || 0}
                      </td>
                      <td className="p-3 text-right">
                        {(record.generatedTaskId || record.workflowCardId) && onOpenCard ? (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              onOpenCard(record.generatedTaskId || record.workflowCardId);
                            }}
                            className="inline-flex items-center gap-1 text-blue-700 font-bold hover:text-blue-900"
                          >
                            Kortelė <ExternalLink size={13} />
                          </button>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {template && onOpenTemplate ? (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              onOpenTemplate(template);
                            }}
                            className="inline-flex items-center gap-1 text-blue-700 font-bold hover:text-blue-900"
                          >
                            Šablonas <ExternalLink size={13} />
                          </button>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRecord && (
        <RecordDetailModal
          record={selectedRecord}
          template={selectedTemplate}
          workflowName={getWorkflowName(selectedRecord)}
          onClose={() => setSelectedRecord(null)}
          onOpenCard={onOpenCard}
          onOpenTemplate={onOpenTemplate}
        />
      )}
    </div>
  );
};

import React, { useMemo, useState } from "react";
import {
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { lt } from "date-fns/locale";
import { CalendarDays, CheckCircle2, Clock, ExternalLink, X } from "lucide-react";
import { users } from "../../mock-db/users";
import { workflowTypes } from "../../mock-db/workflowTypes";
import {
  buildPeriodicInstancesForRange,
  type PeriodicInstance,
} from "../../mock-db/periodicInstances";
import { cn } from "../../lib/utils";

interface Props {
  faults?: any[];
  templates?: any[];
  history?: any[];
  clubs?: any[];
  onOpenCard?: (id: string) => void;
}

type ViewMode = "week" | "month" | "quarter" | "halfYear" | "year";

const viewModeLabels: Record<ViewMode, string> = {
  week: "Savaitė",
  month: "Mėnuo",
  quarter: "3 mėn",
  halfYear: "6 mėn",
  year: "Metai",
};

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

const getRange = (mode: ViewMode, anchor: Date) => {
  if (mode === "week") {
    return {
      start: startOfWeek(anchor, { weekStartsOn: 1 }),
      end: endOfWeek(anchor, { weekStartsOn: 1 }),
    };
  }
  if (mode === "quarter") {
    const start = startOfMonth(anchor);
    return { start, end: endOfMonth(addMonths(start, 2)) };
  }
  if (mode === "halfYear") {
    const start = startOfMonth(anchor);
    return { start, end: endOfMonth(addMonths(start, 5)) };
  }
  if (mode === "year") {
    return { start: startOfYear(anchor), end: endOfYear(anchor) };
  }
  return { start: startOfMonth(anchor), end: endOfMonth(anchor) };
};

const getAssigneeName = (assigneeId?: string) =>
  users.find((user) => user.id === assigneeId)?.name || assigneeId || "Nepriskirta";

const formatDate = (value?: number) =>
  value ? format(new Date(value), "yyyy-MM-dd", { locale: lt }) : "-";

export const PeriodicCalendarView: React.FC<Props> = ({
  faults = [],
  templates = [],
  history = [],
  clubs = [],
  onOpenCard,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [selectedInstance, setSelectedInstance] = useState<PeriodicInstance | null>(null);
  const [filters, setFilters] = useState({
    region: "",
    assigneeId: "",
    clubId: "",
    date: "",
  });

  const activeClubs = useMemo(
    () => clubs.filter((club) => (club.isActive ?? club.is_active) === true),
    [clubs],
  );

  const regions = useMemo(
    () =>
      Array.from(
        new Set(activeClubs.map((club) => club.region).filter(Boolean)),
      ).sort(),
    [activeClubs],
  );

  const range = useMemo(() => {
    const date = filters.date ? new Date(filters.date) : anchorDate;
    return getRange(viewMode, date);
  }, [anchorDate, filters.date, viewMode]);

  const instances = useMemo(
    () =>
      buildPeriodicInstancesForRange({
        templates,
        clubs,
        history,
        workflowCards: faults,
        rangeStart: range.start,
        rangeEnd: range.end,
      }),
    [clubs, faults, history, range.end, range.start, templates],
  );

  const getInstanceClub = (instance: PeriodicInstance) =>
    activeClubs.find((club) => club.id === instance.clubId);

  const getInstanceAssigneeId = (instance: PeriodicInstance) =>
    instance.assigneeId || getInstanceClub(instance)?.coordinator_id;

  const assignedUserIds = useMemo(() => {
    const ids = new Set<string>();

    templates.forEach((template) => {
      const explicitAssignee =
        template.assigned_to ||
        template.assignedTo?.id ||
        template.defaultResponsibleId;
      if (explicitAssignee) ids.add(explicitAssignee);

      const targetClubIds =
        template.targetMode === "ALL_CLUBS"
          ? activeClubs.map((club) => club.id)
          : template.targetMode === "REGIONS"
            ? activeClubs
                .filter((club) => template.targetRegions?.includes(club.region || ""))
                .map((club) => club.id)
            : template.targetClubIds || [];

      targetClubIds.forEach((clubId) => {
        const coordinatorId = activeClubs.find((club) => club.id === clubId)?.coordinator_id;
        if (coordinatorId) ids.add(coordinatorId);
      });
    });

    instances.forEach((instance) => {
      const assigneeId = getInstanceAssigneeId(instance);
      if (assigneeId) ids.add(assigneeId);
    });

    return ids;
  }, [activeClubs, instances, templates]);

  const assignedUsers = useMemo(
    () =>
      users
        .filter((user) => user.is_active !== false && assignedUserIds.has(user.id))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [assignedUserIds],
  );

  const filteredInstances = useMemo(
    () =>
      instances.filter((instance) => {
        const club = getInstanceClub(instance);
        const assigneeId = getInstanceAssigneeId(instance);

        if (filters.region && club?.region !== filters.region) {
          return false;
        }
        if (filters.assigneeId && assigneeId !== filters.assigneeId) {
          return false;
        }
        if (filters.clubId && instance.clubId !== filters.clubId) {
          return false;
        }
        return isWithinInterval(new Date(instance.dueDate || instance.dueAt), range);
      }),
    [filters, instances, range, activeClubs],
  );

  const kpis = useMemo(() => {
    const assigned = filteredInstances.filter((item) => item.status !== "REJECTED").length;
    const completed = filteredInstances.filter((item) => item.status === "COMPLETED").length;
    const overdue = filteredInstances.filter((item) => item.status === "OVERDUE").length;
    const completedOnTime = filteredInstances.filter(
      (item) =>
        item.status === "COMPLETED" &&
        Boolean(item.completedAt) &&
        item.completedAt! <= (item.dueDate || item.dueAt),
    ).length;

    return { assigned, completed, overdue, completedOnTime };
  }, [filteredInstances]);

  const selectedTemplate = selectedInstance
    ? templates.find((template) => template.id === selectedInstance.templateId)
    : undefined;
  const selectedTemplateHistory = selectedInstance
    ? history
        .filter((record) => record.templateId === selectedInstance.templateId)
        .sort(
          (a, b) =>
            new Date(b.scheduledDate || 0).getTime() -
            new Date(a.scheduledDate || 0).getTime(),
        )
    : [];

  const workflowName = (workflowTypeId?: string) =>
    workflowTypes.find((workflow) => workflow.id === workflowTypeId)?.name ||
    workflowTypeId ||
    "-";

  const clubName = (clubId?: string) =>
    activeClubs.find((club) => club.id === clubId)?.name || clubId || "-";

  const visibleClubs = useMemo(
    () =>
      activeClubs.filter(
        (club) => !filters.region || club.region === filters.region,
      ),
    [activeClubs, filters.region],
  );

  const periodLabel = `${format(range.start, "yyyy-MM-dd")} - ${format(range.end, "yyyy-MM-dd")}`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Priskirta", value: kpis.assigned, icon: CalendarDays },
          { label: "Atlikta", value: kpis.completed, icon: CheckCircle2 },
          { label: "Vėluoja", value: kpis.overdue, icon: Clock },
          { label: "Atlikta laiku", value: kpis.completedOnTime, icon: CheckCircle2 },
        ].map((item) => (
          <div key={item.label} className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {item.label}
              </span>
              <item.icon size={18} className="text-slate-400" />
            </div>
            <div className="mt-2 text-3xl font-black text-slate-900">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">Periodiniai darbai</h2>
            <p className="text-sm text-slate-500">{periodLabel}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(Object.keys(viewModeLabels) as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-bold border transition-colors",
                  viewMode === mode
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
                )}
              >
                {viewModeLabels[mode]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            className="border border-slate-200 rounded-md px-3 py-2 text-sm"
            value={filters.region}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                region: event.target.value,
                clubId: "",
              }))
            }
          >
            <option value="">Regionas</option>
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>

          <select
            className="border border-slate-200 rounded-md px-3 py-2 text-sm"
            value={filters.clubId}
            onChange={(event) =>
              setFilters((current) => ({ ...current, clubId: event.target.value }))
            }
          >
            <option value="">Klubas</option>
            {visibleClubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
          </select>

          <select
            className="border border-slate-200 rounded-md px-3 py-2 text-sm"
            value={filters.assigneeId}
            onChange={(event) =>
              setFilters((current) => ({ ...current, assigneeId: event.target.value }))
            }
          >
            <option value="">Atsakingas</option>
            {assignedUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            className="border border-slate-200 rounded-md px-3 py-2 text-sm"
            value={filters.date}
            onChange={(event) => {
              setFilters((current) => ({ ...current, date: event.target.value }));
              if (event.target.value) setAnchorDate(new Date(event.target.value));
            }}
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="grid grid-cols-[1.3fr_1fr_1fr_140px_120px] gap-0 bg-slate-50 border-b border-slate-200 text-xs font-black uppercase tracking-wide text-slate-500">
          <div className="p-3">Pavadinimas</div>
          <div className="p-3">Klubas</div>
          <div className="p-3">Atsakingas</div>
          <div className="p-3">Terminas</div>
          <div className="p-3">Statusas</div>
        </div>

        {filteredInstances.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Šiam laikotarpiui įrašų nėra</div>
        ) : (
          filteredInstances.map((instance) => (
            <button
              key={instance.id}
              onClick={() => setSelectedInstance(instance)}
              className="w-full grid grid-cols-[1.3fr_1fr_1fr_140px_120px] gap-0 border-b border-slate-100 last:border-0 text-left hover:bg-slate-50 transition-colors"
            >
              <div className="p-3">
                <div className="font-bold text-slate-900">{instance.titleSnapshot}</div>
                <div className="text-xs text-slate-500">{workflowName(instance.workflowTypeId)}</div>
              </div>
              <div className="p-3 text-sm text-slate-700">{clubName(instance.clubId)}</div>
              <div className="p-3 text-sm text-slate-700">{getAssigneeName(getInstanceAssigneeId(instance))}</div>
              <div className="p-3 text-sm font-semibold text-slate-700">
                {formatDate(instance.dueDate || instance.dueAt)}
              </div>
              <div className="p-3">
                <span
                  className={cn(
                    "inline-flex px-2 py-1 rounded text-xs font-black",
                    statusClass[instance.status],
                  )}
                >
                  {statusLabels[instance.status]}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {selectedInstance && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {selectedInstance.titleSnapshot}
                </h3>
                <p className="text-sm text-slate-500">Periodinė užduotis</p>
              </div>
              <button
                onClick={() => setSelectedInstance(null)}
                className="p-2 rounded-md hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <Detail label="Šablonas" value={selectedTemplate?.name || selectedInstance.templateId} />
              <Detail label="Workflow" value={workflowName(selectedInstance.workflowTypeId)} />
              <Detail label="Klubas" value={clubName(selectedInstance.clubId)} />
              <Detail label="Atsakingas" value={getAssigneeName(getInstanceAssigneeId(selectedInstance))} />
              <Detail label="Terminas" value={formatDate(selectedInstance.dueDate || selectedInstance.dueAt)} />
              <Detail label="Statusas" value={statusLabels[selectedInstance.status]} />
              <Detail
                label="Atlikimo informacija"
                value={
                  selectedInstance.completedAt
                    ? `${formatDate(selectedInstance.completedAt)} · ${selectedInstance.completedBy || "-"}`
                    : "-"
                }
              />
              <div>
                <div className="text-xs font-bold uppercase text-slate-500 mb-1">
                  Kortelės nuoroda
                </div>
                {selectedInstance.workflowCardId && onOpenCard ? (
                  <button
                    onClick={() => onOpenCard(selectedInstance.workflowCardId!)}
                    className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-900"
                  >
                    Atidaryti kortelę <ExternalLink size={14} />
                  </button>
                ) : (
                  <div className="font-semibold text-slate-900">-</div>
                )}
              </div>
              {(() => {
                const proofRequired = selectedInstance.requiresPhotoProof || selectedInstance.templateSnapshot?.proofRequired;
                const rawPhotos: string[] = selectedInstance.photoProofIds?.length
                  ? (() => { try { return JSON.parse(localStorage.getItem(`sg_photos_${selectedInstance.id}`) || "[]") as string[]; } catch { return []; } })()
                  : [];
                return (
                  <div>
                    <div className="text-xs font-bold uppercase text-slate-500 mb-1">Nuotraukos</div>
                    {rawPhotos.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {rawPhotos.map((src, i) => (
                          <button key={i} onClick={() => window.open(src, "_blank")} className="h-16 w-16 overflow-hidden rounded-lg border border-slate-200 hover:opacity-80">
                            <img src={src} alt={`Nuotrauka ${i + 1}`} className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    ) : proofRequired ? (
                      <div className="font-semibold text-amber-600">⚠ Foto įrodymas nebuvo įkeltas</div>
                    ) : (
                      <div className="font-semibold text-slate-900">-</div>
                    )}
                  </div>
                );
              })()}
              <Detail
                label="Komentarai"
                value={
                  selectedInstance.completionComment ||
                  selectedInstance.history.find((event) => event.reason)?.reason ||
                  (selectedInstance.requiresComment ? "Reikalingas komentaras" : "-")
                }
              />
            </div>

            <div className="px-5 pb-5">
              <h4 className="text-sm font-black text-slate-900 mb-3">Istorija</h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                {selectedTemplateHistory.length === 0 ? (
                  <div className="p-4 text-sm text-slate-500">Istorijos įrašų nėra</div>
                ) : (
                  selectedTemplateHistory.map((record) => (
                    <div
                      key={record.id}
                      className="grid grid-cols-[120px_1fr_120px] gap-3 p-3 border-b border-slate-100 last:border-0 text-sm"
                    >
                      <div className="font-bold text-slate-700">
                        {format(new Date(record.scheduledDate), "yyyy-MM")}
                      </div>
                      <div className="text-slate-700">{record.clubName}</div>
                      <div className="font-bold text-slate-900">{record.status}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Detail = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <div className="text-xs font-bold uppercase text-slate-500 mb-1">{label}</div>
    <div className="font-semibold text-slate-900">{value}</div>
  </div>
);

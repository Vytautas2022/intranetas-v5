import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { mockPeriodicTemplates } from "../../mock-db/periodicTemplates";
import { generateOccurrences } from "./utils/occurrenceHelper";
import { PeriodicOccurrence, OccurrenceStatus } from "./types";
import { clubs } from "../../mock-db/clubs";
import { users } from "../../mock-db/users";
import { RichTextEditor } from "../../components/ui/RichTextEditor";
import {
  format,
  startOfYear,
  endOfYear,
  startOfWeek,
  endOfWeek,
  eachMonthOfInterval,
  addMonths,
  startOfMonth,
  getWeek,
  parseISO,
  startOfDay,
  endOfDay,
  subDays,
  addDays,
  isBefore,
} from "date-fns";
import { lt } from "date-fns/locale";
import {
  ChevronDown,
  Check,
  Search as SearchIcon,
  Plus,
  LayoutGrid,
  Calendar as CalendarIcon,
  Filter,
  User,
  Clock,
  Building2,
  MoreVertical,
  Activity,
  History,
  AlertCircle,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { TemplateEditModal } from "../periodic-tasks/TemplateEditModal";
import { PeriodicTemplate } from "../../mock-db/periodicTemplates";
import { cn } from "../../lib/utils";
import { createAuditLogEntry } from "../../logic/auditLogic";
import {
  workflowTypes as defaultWorkflowTypes,
  type WorkflowType,
} from "../../mock-db/workflowTypes";

interface PeriodicTaskHistory {
  id: string;
  timestamp: number;
  user: string;
  action: "created" | "activated" | "deactivated" | "edited";
}

const ClubDropdown = ({
  clubs,
  selectedClubIds,
  onChange,
}: {
  clubs: any[];
  selectedClubIds: string[];
  onChange: (ids: string[]) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: PointerEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("pointerdown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const filteredClubs = clubs.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const selectedClubs = clubs.filter((c) => selectedClubIds.includes(c.id));

  const getLabel = () => {
    if (selectedClubIds.length === 0) return "Visi klubai";
    if (selectedClubIds.length === 1) return selectedClubs[0]?.name || "...";
    return `${selectedClubIds.length} klubai`;
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2 border border-slate-200 rounded text-sm bg-white text-left flex justify-between items-center hover:border-slate-300 transition-colors"
      >
        <span className="truncate">{getLabel()}</span>
        <ChevronDown size={14} className="text-slate-500" />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded shadow-lg z-[60] p-2">
          <div className="relative mb-2">
            <SearchIcon
              size={14}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              autoFocus
              placeholder="Ieškoti klubo..."
              className="w-full p-2 pl-7 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-slate-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="max-h-64 overflow-auto">
            <div
              onClick={() => {
                onChange([]);
                setIsOpen(false);
              }}
              className={`p-2 cursor-pointer text-sm hover:bg-slate-50 ${selectedClubIds.length === 0 ? "bg-slate-100 font-bold text-slate-900" : "text-slate-600"}`}
            >
              Visi klubai
            </div>
            {filteredClubs.map((c) => {
              const isSelected = selectedClubIds.includes(c.id);
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    const newIds = isSelected
                      ? selectedClubIds.filter((id) => id !== c.id)
                      : [...selectedClubIds, c.id];
                    onChange(newIds);
                  }}
                  className={`p-2 cursor-pointer text-sm flex items-center justify-between hover:bg-slate-50 ${isSelected ? "font-bold text-slate-900 bg-slate-50" : "text-slate-600"}`}
                >
                  {c.name}
                  {isSelected && <Check size={14} className="text-slate-900" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

interface PeriodicCalendarSubModuleProps {
  templates?: any[];
  setTemplates?: React.Dispatch<React.SetStateAction<any[]>>;
  workflowTypes?: WorkflowType[];
}

export const PeriodicCalendarSubModule: React.FC<PeriodicCalendarSubModuleProps> = ({
  templates = mockPeriodicTemplates,
  setTemplates,
  workflowTypes = defaultWorkflowTypes,
}) => {
  const [year] = useState(new Date().getFullYear());
  const [filters, setFilters] = useState({
    region: "",
    clubIds: [] as string[],
    search: "",
    department: "Visi",
    assignee: "Visi",
    status: "Visi", // "Visi", "Aktyvios", "Neaktyvios"
    applicationType: "Visi", // "Visi", "GENERAL", "CLUB"
    dateFrom: "",
    dateTo: "",
  });
  const [viewMode, setViewMode] = useState<"calendar" | "list">(() => {
    const saved = localStorage.getItem("periodic-view-mode");
    return (saved as "calendar" | "list") || "calendar";
  });

  const [calendarSubMode, setCalendarSubMode] = useState<"week" | "month">(() => {
    return typeof window !== 'undefined' && window.innerWidth < 768 ? "week" : "month";
  });

  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    localStorage.setItem("periodic-view-mode", viewMode);
  }, [viewMode]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [viewMode, calendarSubMode, currentDate]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [localTemplates, setLocalTemplates] = useState<any[]>(templates);
  
  // Occurrence logic
  const dateRange = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = addMonths(start, 1);
    return { start, end };
  }, [currentDate]);

  const occurrences = useMemo(() => {
    return generateOccurrences(
      localTemplates,
      dateRange.start,
      dateRange.end,
      clubs
    );
  }, [localTemplates, dateRange, clubs]);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<{ occurrence?: PeriodicOccurrence, template?: any } | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [selectedOccurrence, setSelectedOccurrence] = useState<PeriodicOccurrence | null>(null);
  const activeClubs = useMemo(
    () => clubs.filter((club) => (club.isActive ?? club.is_active) === true),
    [],
  );

  // Memoized visible weeks based on current date and view mode
  const visibleWeeks = useMemo(() => {
    if (calendarSubMode === 'week') {
      return [getWeek(currentDate, { weekStartsOn: 1 })];
    } else {
      // Find month group for current date
      const monthIdx = currentDate.getMonth();
      const monthLabel = [
        "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
        "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
      ][monthIdx];
      
      const group = [
        { label: "JAN", weeks: [1, 2, 3, 4] },
        { label: "FEB", weeks: [5, 6, 7, 8] },
        { label: "MAR", weeks: [9, 10, 11, 12, 13] },
        { label: "APR", weeks: [14, 15, 16, 17] },
        { label: "MAY", weeks: [18, 19, 20, 21, 22] },
        { label: "JUN", weeks: [23, 24, 25, 26] },
        { label: "JUL", weeks: [27, 28, 29, 30] },
        { label: "AUG", weeks: [31, 32, 33, 34, 35] },
        { label: "SEP", weeks: [36, 37, 38, 39] },
        { label: "OCT", weeks: [40, 41, 42, 43] },
        { label: "NOV", weeks: [44, 45, 46, 47, 48] },
        { label: "DEC", weeks: [49, 50, 51, 52] },
      ].find(g => g.label === monthLabel);
      
      return group ? group.weeks : [1, 2, 3, 4];
    }
  }, [calendarSubMode, currentDate]);

  const monthGroups = useMemo(
    () => [
      { label: "JAN", weeks: [1, 2, 3, 4] },
      { label: "FEB", weeks: [5, 6, 7, 8] },
      { label: "MAR", weeks: [9, 10, 11, 12, 13] },
      { label: "APR", weeks: [14, 15, 16, 17] },
      { label: "MAY", weeks: [18, 19, 20, 21, 22] },
      { label: "JUN", weeks: [23, 24, 25, 26] },
      { label: "JUL", weeks: [27, 28, 29, 30] },
      { label: "AUG", weeks: [31, 32, 33, 34, 35] },
      { label: "SEP", weeks: [36, 37, 38, 39] },
      { label: "OCT", weeks: [40, 41, 42, 43] },
      { label: "NOV", weeks: [44, 45, 46, 47, 48] },
      { label: "DEC", weeks: [49, 50, 51, 52] },
    ],
    [],
  );

  const filteredWeeks = useMemo(() => {
    return visibleWeeks; // High-performance: only generate visible weeks
  }, [visibleWeeks]);

  const filteredMonthGroups = useMemo(() => {
    return monthGroups
      .map((mg) => ({
        ...mg,
        weeks: mg.weeks.filter((w) => filteredWeeks.includes(w)),
      }))
      .filter((mg) => mg.weeks.length > 0);
  }, [monthGroups, filteredWeeks]);

  const handleCancelOccurrence = (occurrence: PeriodicOccurrence, reason: string) => {
    setLocalTemplates(prev => {
      const next = prev.map(t => {
        if (t.id === occurrence.taskId) {
          return {
            ...t,
            occurrenceOverrides: {
              ...(t.occurrenceOverrides || {}),
              [occurrence.occurrenceId]: {
                ...occurrence,
                status: 'cancelled',
                cancelledAt: Date.now(),
                cancelledBy: 'Dabartinis Vartotojas',
                cancelReason: reason
              }
            }
          };
        }
        return t;
      });
      setTemplates?.(next);
      return next;
    });

    createAuditLogEntry({
      moduleId: "periodic",
      moduleName: "Periodiniai darbai",
      entityType: "TEMPLATE",
      entityId: occurrence.taskId,
      entityTitle: occurrence.title,
      actionType: "UPDATED" as any, // "PERIODIC_OCCURRENCE_CANCELLED" is what prompt asks, but types might be strict
      changeDescription: `Atšauktas periodinis įvykis (${occurrence.plannedDate}). Priežastis: ${reason}`,
      locationLabel: `Periodiniai darbai > ${occurrence.title}`,
      canRestore: false,
    });
    
    setIsCancelModalOpen(false);
    setCancelTarget(null);
    setCancelReason("");
  };

  const handleDeactivateTemplate = (template: any, reason: string) => {
    setLocalTemplates(prev => prev.map(t => {
      if (t.id === template.id) {
        return {
          ...t,
          isActive: false,
          deactivatedAt: Date.now(),
          deactivatedBy: 'Dabartinis Vartotojas',
          deactivateReason: reason
        };
      }
      return t;
    }));

    createAuditLogEntry({
      moduleId: "periodic",
      moduleName: "Periodiniai darbai",
      entityType: "TEMPLATE",
      entityId: template.id,
      entityTitle: template.title,
      actionType: "DEACTIVATED" as any, 
      changeDescription: `Deaktyvuota periodinė užduotis. Priežastis: ${reason}`,
      locationLabel: `Periodiniai darbai > ${template.title}`,
      canRestore: false,
    });
    
    setIsCancelModalOpen(false);
    setCancelTarget(null);
    setCancelReason("");
  };

  const mapStatusToStyles = (status: OccurrenceStatus, isPast = false) => {
    if (isPast) {
      switch (status) {
        case 'completed_on_time': return { bg: 'bg-green-200', text: 'text-green-800', icon: 'OK' };
        case 'completed_late': return { bg: 'bg-orange-200', text: 'text-orange-700', icon: 'OK' };
        case 'overdue': return { bg: 'bg-red-200', text: 'text-red-800', icon: '!' };
        case 'cancelled': return { bg: 'bg-slate-200', text: 'text-slate-400', icon: 'X', decoration: 'line-through' };
        default: return { bg: 'bg-slate-100', text: 'text-slate-400', icon: '' };
      }
    }
    switch (status) {
      case 'planned': return { bg: 'bg-yellow-400', text: 'text-white', icon: 'V' };
      case 'completed_on_time': return { bg: 'bg-emerald-500', text: 'text-white', icon: 'OK' };
      case 'overdue': return { bg: 'bg-rose-500', text: 'text-white', icon: '!' };
      case 'completed_late': return { bg: 'bg-orange-500', text: 'text-white', icon: 'OK' };
      case 'cancelled': return { bg: 'bg-slate-200', text: 'text-slate-400', icon: 'X', decoration: 'line-through' };
      default: return { bg: 'bg-slate-100', text: 'text-slate-400', icon: '' };
    }
  };

  const getKey = useCallback(
    (templateId: string, clubId: string) => `${templateId}-${clubId}`,
    [],
  );

  const filteredTemplates = useMemo(() => {
    return localTemplates.filter(
      (t) =>
        filters.assignee === "Visi" ||
        t.assigned_to === filters.assignee ||
        t.assignedTo?.id === filters.assignee ||
        t.defaultResponsibleId === filters.assignee,
    );
  }, [localTemplates, filters]);

  const generalTemplates = useMemo(() => {
    return filteredTemplates.filter(
      (t) => (t.applicationType || "CLUB") === "GENERAL",
    );
  }, [filteredTemplates]);

  const clubTemplates = useMemo(() => {
    return filteredTemplates.filter(
      (t) => (t.applicationType || "CLUB") === "CLUB",
    );
  }, [filteredTemplates]);

  const handleCreateNew = () => {
    const newTemplate = {
      id: "PT-" + Date.now().toString().slice(-6),
      title: "",
      description: "",
      category: "MAINTENANCE",
      type: "MANDATORY",
      recurrence: "monthly",
      scope: "ALL",
      destinationType: "WORKFLOW_CARD",
      assignmentStrategy: "MANUAL_UNASSIGNED",
      assignmentSource: "MANUAL_UNASSIGNED",
      visibleWeeksBeforeDue: 4,
      requiresComment: false,
      requiresPhotoProof: false,
      isMandatory: true,
      applicationType: "CLUB",
      department: "Operacijos",
      isActive: false,
      history: [
        {
          id: "h-" + Date.now(),
          timestamp: Date.now(),
          user: "Sistemos administratorius",
          action: "created",
        },
      ],
    };
    setSelectedTemplate(newTemplate);
    setIsModalOpen(true);
  };

  const handleSaveTemplate = (updated: any) => {
    setLocalTemplates((prev) => {
      const exists = prev.find((t) => t.id === updated.id);
      let next;
      if (exists) {
        // Track history for activation/deactivation
        const historyEntry: PeriodicTaskHistory = {
          id: "h-" + Date.now(),
          timestamp: Date.now(),
          user: "Sistemos administratorius",
          action: "edited",
        };

        let actionType: any = "UPDATED";
        if (updated.isActive && !exists.isActive) {
          historyEntry.action = "activated";
          actionType = "STATUS_CHANGED";
        } else if (!updated.isActive && exists.isActive) {
          historyEntry.action = "deactivated";
          actionType = "DEACTIVATED";
        }

        createAuditLogEntry({
          moduleId: "periodic",
          moduleName: "Periodiniai darbai",
          entityType: "TEMPLATE",
          entityId: updated.id,
          entityTitle: updated.title,
          actionType: actionType,
          changeDescription: `Redaguota periodinė užduotis: ${updated.title}`,
          locationLabel: "Periodiniai darbai",
          canRestore: true,
          oldValue: exists,
          newValue: updated,
          snapshotBefore: exists,
          snapshotAfter: updated
        });

        const newHistory = [...(exists.history || []), historyEntry];
        next = prev.map((t) =>
          t.id === updated.id ? { ...updated, history: newHistory } : t,
        );
      } else {
        next = [...prev, updated];
        createAuditLogEntry({
          moduleId: "periodic",
          moduleName: "Periodiniai darbai",
          entityType: "TEMPLATE",
          entityId: updated.id,
          entityTitle: updated.title,
          actionType: "CREATED",
          changeDescription: `Sukurta nauja periodinė užduotis: ${updated.title}`,
          locationLabel: "Periodiniai darbai",
          canRestore: false
        });
      }
      setTemplates?.(next);
      return next;
    });
    setIsModalOpen(false);
  };

  const regions = Array.from(
    new Set(activeClubs.map((c) => c.region).filter(Boolean)),
  ).sort();
  const assignedUserIds = new Set<string>();
  localTemplates.forEach((template) => {
    const directAssignee =
      template.assigned_to || template.assignedTo?.id || template.defaultResponsibleId;
    if (directAssignee) assignedUserIds.add(directAssignee);

    const targetClubIds =
      template.targetMode === "ALL_CLUBS" || template.scope === "ALL"
        ? activeClubs.map((club) => club.id)
        : template.targetMode === "REGIONS"
          ? activeClubs
              .filter((club) => template.targetRegions?.includes(club.region || ""))
              .map((club) => club.id)
          : template.targetClubIds || [];

    targetClubIds.forEach((clubId) => {
      const coordinatorId = activeClubs.find((club) => club.id === clubId)?.coordinator_id;
      if (coordinatorId) assignedUserIds.add(coordinatorId);
    });
  });
  const assignedUsers = users
    .filter((user) => user.is_active !== false && assignedUserIds.has(user.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  const filteredClubs = activeClubs.filter(
    (c) =>
      (!filters.region || c.region === filters.region) &&
      (!filters.clubIds.length || filters.clubIds.includes(c.id)),
  );

  return (
    <div className="p-3 md:p-6 space-y-6 bg-slate-50 min-h-full overflow-y-auto">
      {/* Navigation and Period Selector */}
      {viewMode === "calendar" && (
        <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const step = calendarSubMode === "week" ? { weeks: -1 } : { months: -1 };
                setCurrentDate(prev => {
                  const d = new Date(prev);
                  if (calendarSubMode === "week") d.setDate(d.getDate() - 7);
                  else d.setMonth(d.getMonth() - 1);
                  return d;
                });
              }}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
            >
              <ChevronDown className="rotate-90" size={20} />
            </button>
            <div className="text-center min-w-[140px]">
              <span className="text-sm font-black text-slate-900 uppercase tracking-tight">
                {calendarSubMode === "month" 
                  ? format(currentDate, "MMMM yyyy", { locale: lt })
                  : (
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">
                        {getWeek(currentDate, { weekStartsOn: 1 })} savaitė
                      </span>
                      <span>
                        {format(startOfWeek(currentDate, { weekStartsOn: 1 }), "MMM d", { locale: lt })} - {format(endOfWeek(currentDate, { weekStartsOn: 1 }), "MMM d", { locale: lt })}
                      </span>
                    </div>
                  )}
              </span>
            </div>
            <button
              onClick={() => {
                setCurrentDate(prev => {
                  const d = new Date(prev);
                  if (calendarSubMode === "week") d.setDate(d.getDate() + 7);
                  else d.setMonth(d.getMonth() + 1);
                  return d;
                });
              }}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
            >
              <ChevronDown className="-rotate-90" size={20} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
            >
              Šiandien
            </button>
          </div>
        </div>
      )}

      {/* Header section with Create Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            Periodiniai darbai
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Planuokite ir valdykite pasikartojančias užduotis
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
            <button
              onClick={() => {
                setCalendarSubMode("week");
                if (viewMode !== "calendar") setViewMode("calendar");
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all text-[10px] font-black uppercase tracking-widest",
                viewMode === "calendar" && calendarSubMode === "week"
                  ? "bg-slate-900 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-600",
              )}
            >
              Savaitė
            </button>
            <button
              onClick={() => {
                setCalendarSubMode("month");
                if (viewMode !== "calendar") setViewMode("calendar");
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all text-[10px] font-black uppercase tracking-widest",
                viewMode === "calendar" && calendarSubMode === "month"
                  ? "bg-slate-900 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-600",
              )}
            >
              Mėnuo
            </button>
          </div>
          <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === "list"
                  ? "bg-slate-900 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-600",
              )}
              title="Kortelių rodinys"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === "calendar"
                  ? "bg-slate-900 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-600",
              )}
              title="Kalendoriaus rodinys"
            >
              <CalendarIcon size={18} />
            </button>
          </div>
          <button
            onClick={handleCreateNew}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#d9f945] text-black px-6 py-3 rounded-2xl font-black uppercase text-sm hover:scale-[1.02] transition-colors active:scale-95 shadow-lg shadow-lime-200/50"
          >
            <Plus size={20} />
            Nauja periodinė užduotis
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                region: e.target.value,
                clubIds: [],
              }))
            }
            value={filters.region}
            className="p-2 px-4 border border-slate-200 rounded-xl text-sm font-bold bg-slate-50 text-slate-700"
          >
            <option value="">Regionas</option>
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>

          <ClubDropdown
            clubs={activeClubs.filter(
              (club) => !filters.region || club.region === filters.region,
            )}
            selectedClubIds={filters.clubIds}
            onChange={(ids) => setFilters((prev) => ({ ...prev, clubIds: ids }))}
          />

          <select
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                assignee: e.target.value,
              }))
            }
            value={filters.assignee}
            className="p-2 px-4 border border-slate-200 rounded-xl text-sm font-bold bg-slate-50 text-slate-700"
          >
            <option value="Visi">Atsakingas</option>
            {assignedUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => {
              setFilters((prev) => ({
                ...prev,
                dateFrom: e.target.value,
                dateTo: e.target.value,
              }));
              if (e.target.value) setCurrentDate(new Date(e.target.value));
            }}
            className="p-2 px-4 border border-slate-200 rounded-xl text-sm font-bold bg-slate-50 text-slate-700"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm animate-pulse">
            <div className="h-8 bg-slate-100 rounded-xl w-48 mb-6" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-12 bg-slate-50 rounded-xl flex-1" />
                  <div className="h-12 bg-slate-50 rounded-xl w-24" />
                  <div className="h-12 bg-slate-50 rounded-xl w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : viewMode === "calendar" ? (
        <div className="space-y-6">
          {/* General Tasks Section in Calendar View */}
          {generalTemplates.length > 0 && (
            <div className="border border-slate-200 rounded-3xl shadow-sm bg-white overflow-hidden">
              <div className="p-4 bg-slate-900 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-black text-white text-sm flex items-center gap-2 uppercase tracking-wide">
                  🌐 Bendros periodinės užduotys
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th
                        rowSpan={2}
                        className="p-3 text-left font-black text-slate-400 uppercase tracking-widest align-bottom border-r border-slate-200 sticky left-0 bg-white z-10 shadow-[1px_0_2px_rgba(0,0,0,0.05)] w-72 min-w-[288px]"
                      >
                        Užduoties pavadinimas
                      </th>
                      {filteredMonthGroups.map((mg) => (
                        <th
                          key={mg.label}
                          colSpan={mg.weeks.length}
                          className="p-1 px-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-r border-slate-200 last:border-0 bg-slate-50/30"
                        >
                          {mg.label}
                        </th>
                      ))}
                    </tr>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      {filteredWeeks.map((w) => (
                        <th
                          key={w}
                          className="p-1 min-w-[32px] text-center text-[9px] font-bold text-slate-400 border-r border-slate-200 last:border-0"
                        >
                          {w}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {generalTemplates.map((template) => {
                      const assigneeUser = users.find(
                        (u) => u.id === template.assigned_to,
                      );
                      return (
                        <tr
                          key={`${template.id}-general`}
                          className="border-b border-slate-100 hover:bg-slate-50/50"
                        >
                          <td
                            className="p-3 font-bold text-slate-700 cursor-pointer hover:text-slate-900 border-r border-slate-200 sticky left-0 bg-white hover:bg-slate-50 z-10 shadow-[1px_0_1px_rgba(0,0,0,0.05)]"
                            onClick={() => {
                              setSelectedTemplate(template);
                              setIsModalOpen(true);
                            }}
                          >
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={cn(
                                    "px-1.5 py-0.5 rounded-[4px] text-[9px] font-black tracking-widest uppercase",
                                    (template.department || "Operacijos") ===
                                      "Marketingas"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-slate-100 text-slate-600",
                                  )}
                                >
                                  {template.department === "Marketingas"
                                    ? "MKT"
                                    : "OPS"}
                                </span>
                                <span className="line-clamp-2 leading-tight">
                                  {(template.priority === "CRITICAL" || template.criticality === "CRITICAL") && "🔴 "}
                                  {(template.priority === "IMPORTANT" || template.criticality === "IMPORTANT") && "🟡 "}
                                  {template.title}
                                </span>
                                {!template.isActive && (
                                  <span className="px-1.5 py-0.5 bg-red-50 text-red-600 text-[8px] font-black rounded uppercase border border-red-100">
                                    Neaktyvi
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          {filteredWeeks.map((w) => {
                            const occ = occurrences.find(
                              (o) => o.taskId === template.id && o.plannedWeek === w
                            );
                            const isPastOcc = occ ? isBefore(startOfDay(new Date(occ.plannedDate)), startOfDay(new Date())) : false;
                            const styles = occ ? mapStatusToStyles(occ.status, isPastOcc) : null;

                            return (
                              <td
                                key={w}
                                className={cn(
                                  "p-1 text-center cursor-pointer border-r border-slate-100 last:border-0",
                                  occ ? "bg-slate-50/50" : "hover:bg-slate-100",
                                )}
                                onClick={() => {
                                  if (occ && occ.status !== 'cancelled') setSelectedOccurrence(occ);
                                }}
                                onContextMenu={(e) => {
                                  if (occ) {
                                    e.preventDefault();
                                    setCancelTarget({ occurrence: occ });
                                    setIsCancelModalOpen(true);
                                  }
                                }}
                              >
                                {occ ? (
                                  <div className={cn(
                                    "w-6 h-6 rounded-lg mx-auto flex items-center justify-center shadow-sm",
                                    styles?.bg,
                                    styles?.text
                                  )}>
                                    <span className={cn("font-black text-[10px]", styles?.decoration)}>
                                      {styles?.icon}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="w-2 h-2 rounded-full border-2 border-slate-200 mx-auto opacity-30" />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Club Tasks Section */}
          <div className="pt-4 pb-2">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
              <Building2 className="text-[#d9f945]" size={24} />
              🏢 Klubų periodinės užduotys
            </h2>
          </div>

          {filteredClubs.map((club) => (
            <div
              key={club.id}
              className="border border-slate-200 rounded-3xl shadow-sm bg-white overflow-hidden"
            >
              <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2 uppercase tracking-wide">
                  <Building2 size={16} className="text-slate-400" />
                  {club.name}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th
                        rowSpan={2}
                        className="p-3 text-left font-black text-slate-400 uppercase tracking-widest align-bottom border-r border-slate-200 sticky left-0 bg-white z-10 shadow-[1px_0_2px_rgba(0,0,0,0.05)] w-72 min-w-[288px]"
                      >
                        Užduoties pavadinimas
                      </th>
                      {filteredMonthGroups.map((mg) => (
                        <th
                          key={mg.label}
                          colSpan={mg.weeks.length}
                          className="p-1 px-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-r border-slate-200 last:border-0 bg-slate-50/30"
                        >
                          {mg.label}
                        </th>
                      ))}
                    </tr>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      {filteredWeeks.map((w) => (
                        <th
                          key={w}
                          className="p-1 min-w-[32px] text-center text-[9px] font-bold text-slate-400 border-r border-slate-200 last:border-0"
                        >
                          {w}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {clubTemplates.map((template) => {
                      const assigneeUser = users.find(
                        (u) => u.id === template.assigned_to,
                      );
                      return (
                        <tr
                          key={`${template.id}-${club.id}`}
                          className="border-b border-slate-100 hover:bg-slate-50/50"
                        >
                          <td
                            className="p-3 font-bold text-slate-700 cursor-pointer hover:text-slate-900 border-r border-slate-200 sticky left-0 bg-white hover:bg-slate-50 z-10 shadow-[1px_0_1px_rgba(0,0,0,0.05)]"
                            onClick={() => {
                              setSelectedTemplate(template);
                              setIsModalOpen(true);
                            }}
                          >
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={cn(
                                    "px-1.5 py-0.5 rounded-[4px] text-[9px] font-black tracking-widest uppercase",
                                    (template.department || "Operacijos") ===
                                      "Marketingas"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-slate-100 text-slate-600",
                                  )}
                                >
                                  {template.department === "Marketingas"
                                    ? "MKT"
                                    : "OPS"}
                                </span>
                                <span className="line-clamp-2 leading-tight">
                                  {(template.priority === "CRITICAL" || template.criticality === "CRITICAL") && "🔴 "}
                                  {(template.priority === "IMPORTANT" || template.criticality === "IMPORTANT") && "🟡 "}
                                  {template.title}
                                </span>
                                {!template.isActive && (
                                  <span className="px-1.5 py-0.5 bg-red-50 text-red-600 text-[8px] font-black rounded uppercase border border-red-100">
                                    Neaktyvi
                                  </span>
                                )}
                              </div>
                              {assigneeUser && (
                                <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                  <User size={10} />
                                  {assigneeUser.name}
                                </div>
                              )}
                            </div>
                          </td>
                          {filteredWeeks.map((w) => {
                            const occ = occurrences.find(
                              (o) => o.taskId === template.id && o.objectId === club.id && o.plannedWeek === w
                            );
                            const isPastOcc = occ ? isBefore(startOfDay(new Date(occ.plannedDate)), startOfDay(new Date())) : false;
                            const styles = occ ? mapStatusToStyles(occ.status, isPastOcc) : null;
                            
                            return (
                              <td
                                key={w}
                                className={cn(
                                  "p-1 text-center cursor-pointer border-r border-slate-100 last:border-0",
                                  occ ? "bg-slate-50/50" : "hover:bg-slate-100",
                                )}
                                onClick={() => {
                                  if (occ && occ.status !== 'cancelled') setSelectedOccurrence(occ);
                                }}
                                onContextMenu={(e) => {
                                  if (occ) {
                                    e.preventDefault();
                                    setCancelTarget({ occurrence: occ });
                                    setIsCancelModalOpen(true);
                                  }
                                }}
                              >
                                {occ ? (
                                  <div className={cn(
                                    "w-6 h-6 rounded-lg mx-auto flex items-center justify-center shadow-sm",
                                    styles?.bg,
                                    styles?.text
                                  )}>
                                    <span className={cn("font-black text-[10px]", styles?.decoration)}>
                                      {styles?.icon}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="w-2 h-2 rounded-full border-2 border-slate-200 mx-auto opacity-30" />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Card View */
        <div className="space-y-8 pb-20">
          {/* General Section */}
          {generalTemplates.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <span className="p-2 bg-slate-900 text-white rounded-xl">🌐</span>
                Bendros periodinės užduotys
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {generalTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onOpen={() => {
                      setSelectedTemplate(template);
                      setIsModalOpen(true);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Club Section */}
          {clubTemplates.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <span className="p-2 bg-[#d9f945] text-black rounded-xl shadow-lg shadow-lime-100">🏢</span>
                Klubų periodinės užduotys
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {clubTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onOpen={() => {
                      setSelectedTemplate(template);
                      setIsModalOpen(true);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredTemplates.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <SearchIcon size={32} className="text-slate-200" />
              </div>
              <h3 className="text-slate-900 font-bold">Užduočių nerasta</h3>
              <p className="text-slate-400 text-sm">
                Bandykite pakeisti filtrus arba paieškos frazę
              </p>
            </div>
          )}
        </div>
      )}
      {isModalOpen && selectedTemplate && (
        <TemplateEditModal
          template={selectedTemplate}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveTemplate}
        />
      )}

      {isCancelModalOpen && cancelTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Atšaukimo patvirtinimas</h3>
                <p className="text-xs text-slate-500 font-medium">Šis veiksmas bus įrašytas į auditą</p>
              </div>
              <button onClick={() => setIsCancelModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                <AlertCircle className="text-amber-600 shrink-0" size={20} />
                <div className="text-xs text-amber-800 font-medium leading-relaxed">
                  {cancelTarget.occurrence ? (
                    <>Ar tikrai norite atšaukti <strong>{cancelTarget.occurrence.title}</strong> darbą numatytą <strong>{cancelTarget.occurrence.plannedDate}</strong>?</>
                  ) : (
                    <>Ar tikrai norite deaktyvuoti visą periodinę užduotį <strong>{cancelTarget.template?.title}</strong>? Ateities darbai nebebus generuojami.</>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {cancelTarget.occurrence && (
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                    <button 
                      className="px-4 py-2 bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm"
                    >
                      Tik šį įvykį
                    </button>
                    <button 
                      onClick={() => setCancelTarget({ template: localTemplates.find(t => t.id === cancelTarget.occurrence?.taskId) })}
                      className="px-4 py-2 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-lg hover:text-slate-600 transition-colors"
                    >
                      Visą užduotį
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priežastis (Privaloma)</label>
                  <textarea
                    autoFocus
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Nurodykite atšaukimo priežastį..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 min-h-[100px] resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setIsCancelModalOpen(false)}
                className="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-colors"
              >
                Grįžti
              </button>
              <button 
                disabled={!cancelReason.trim()}
                onClick={() => {
                  if (cancelTarget.occurrence) {
                    handleCancelOccurrence(cancelTarget.occurrence, cancelReason);
                  } else {
                    handleDeactivateTemplate(cancelTarget.template, cancelReason);
                  }
                }}
                className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-200"
              >
                {cancelTarget.occurrence ? "Atšaukti įvykį" : "Deaktyvuoti"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {selectedOccurrence !== null && (() => {
        const occ = selectedOccurrence;
        const isPast = isBefore(startOfDay(new Date(occ.plannedDate)), startOfDay(new Date()));
        const occClubName = activeClubs.find(c => c.id === occ.objectId)?.name;
        const statusLabelsLt: Record<OccurrenceStatus, string> = {
          planned: 'Suplanuota',
          completed_on_time: 'Atlikta laiku',
          completed_late: 'Atlikta velai',
          overdue: 'Veluoja',
          cancelled: 'Atsaukta',
        };
        const occStyles = mapStatusToStyles(occ.status);
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{occ.title}</h3>
                  {occClubName && <p className="text-xs text-slate-500 font-medium mt-0.5">{occClubName}</p>}
                  {isPast && <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-1">Praeities irasas — tik perziura</p>}
                </div>
                <button onClick={() => setSelectedOccurrence(null)} className="p-2 hover:bg-white rounded-xl transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Numatyta</span>
                  <span className="font-bold text-slate-900 text-sm">{occ.plannedDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Statusas</span>
                  <span className={cn("px-2.5 py-1 rounded-xl text-xs font-black", occStyles.bg, occStyles.text)}>
                    {statusLabelsLt[occ.status]}
                  </span>
                </div>
                {occ.completedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Atlikta</span>
                    <span className="text-sm text-slate-700">{new Date(occ.completedAt).toLocaleDateString('lt-LT')}</span>
                  </div>
                )}
                {occ.cancelReason && (
                  <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
                    <span className="font-black uppercase tracking-widest text-slate-400">Priezastis: </span>
                    {occ.cancelReason}
                  </div>
                )}
                {(occ as any).workflowCardId && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Kortele</span>
                    <span className="text-xs font-bold text-blue-600">#{(occ as any).workflowCardId}</span>
                  </div>
                )}
              </div>
              {!isPast && occ.status !== 'cancelled' && (
                <div className="p-6 pt-0 flex gap-3">
                  <button
                    onClick={() => {
                      const isCompleted = occ.status === 'completed_on_time' || occ.status === 'completed_late';
                      setLocalTemplates(prev => {
                        const next = prev.map(t => {
                          if (t.id !== occ.taskId) return t;
                          return {
                            ...t,
                            occurrenceOverrides: {
                              ...(t.occurrenceOverrides || {}),
                              [occ.occurrenceId]: {
                                ...occ,
                                status: isCompleted ? 'planned' : 'completed_on_time',
                                completedAt: isCompleted ? null : Date.now(),
                                completedBy: isCompleted ? null : 'Vartotojas',
                              }
                            }
                          };
                        });
                        setTemplates?.(next);
                        return next;
                      });
                      setSelectedOccurrence(null);
                    }}
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    {occ.status === 'completed_on_time' || occ.status === 'completed_late' ? 'Atzymeti' : 'Atlikti'}
                  </button>
                  <button
                    onClick={() => {
                      const tmpl = localTemplates.find(t => t.id === occ.taskId);
                      const crit = tmpl?.criticality ?? (tmpl?.isMandatory ? 'CRITICAL' : 'STANDARD');
                      if (crit === 'CRITICAL') {
                        alert('Kritine uzduotis negali buti ataukta.');
                        return;
                      }
                      setSelectedOccurrence(null);
                      setCancelTarget({ occurrence: occ });
                      setIsCancelModalOpen(true);
                    }}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
                  >
                    Atsaukti
                  </button>
                </div>
              )}
              {(isPast || occ.status === 'cancelled') && (
                <div className="p-6 pt-0">
                  <button
                    onClick={() => setSelectedOccurrence(null)}
                    className="w-full py-3 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
                  >
                    Uzdaryti
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        );
      })()}
    </div>
  );
};

const TemplateCard = React.memo(
  ({ template, onOpen }: { template: any; onOpen: () => void }) => {
    const assigneeUser = users.find((u) => u.id === template.assigned_to);
    
    const sopStatus = useMemo(() => {
      const sop = template.sop;
      if (!sop || !sop.url) return { label: 'Nėra SOP', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: AlertCircle };
      
      const updatedAt = sop.updatedAt;
      if (!updatedAt) return { label: 'SOP yra', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: Check, sub: 'Atnaujinimo data nežinoma' };
      
      const daysOld = Math.floor((Date.now() - updatedAt) / (1000 * 60 * 60 * 24));
      
      if (daysOld > 180) return { label: 'SOP yra', color: 'bg-red-50 text-red-600 border-red-100', icon: AlertCircle, sub: `Neatnaujinta >180 d.` };
      if (daysOld > 90) return { label: 'SOP yra', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: AlertCircle, sub: `Neatnaujinta >90 d.` };
      
      return { label: 'SOP yra', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: Check };
    }, [template.sop]);

    return (
      <div
        onClick={onOpen}
        className="group relative bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-xl hover:shadow-slate-200/50 hover:border-[#d9f945] transition-shadow duration-200 cursor-pointer flex flex-col h-full"
      >
        {/* Card Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col gap-1">
            <span
              className={cn(
                "px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider w-fit",
                template.department === "Marketingas"
                  ? "bg-blue-50 text-blue-600 border border-blue-100"
                  : "bg-slate-50 text-slate-600 border border-slate-100",
              )}
            >
              {template.department}
            </span>
            <span className="px-2 py-0.5 bg-slate-900 text-white text-[8px] font-black rounded uppercase tracking-widest w-fit">
              {(template.applicationType || "CLUB") === "GENERAL"
                ? "Bendroji"
                : "Klubų"}
            </span>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider",
                template.isActive
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                  : "bg-red-50 text-red-600 border border-red-100",
              )}
            >
              <div
                className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  template.isActive ? "bg-emerald-500" : "bg-red-500",
                )}
              />
              {template.isActive ? "Aktyvi" : "Neaktyvi"}
            </div>

            <div 
              className={cn(
                "flex flex-col items-end",
                template.sop?.url && "cursor-alias hover:opacity-80"
              )}
              onClick={(e) => {
                if (template.sop?.url) {
                  e.stopPropagation();
                  window.open(template.sop.url, '_blank');
                }
              }}
            >
              <div className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border",
                sopStatus.color
              )}>
                <sopStatus.icon size={10} />
                {sopStatus.label}
              </div>
              {sopStatus.sub && (
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5 mr-1 text-right leading-none">
                  {sopStatus.sub}
                </span>
              )}
            </div>
          </div>
        </div>

        <h3 className="text-lg font-black text-slate-900 leading-tight mb-2 group-hover:text-slate-800 transition-colors">
          {template.title}
        </h3>

        <div className="mt-auto space-y-3 pt-4 border-t border-slate-50">
          <div className="flex items-center justify-between text-slate-400">
            <div className="flex items-center gap-2">
              <Clock size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {template.recurrence || template.frequency}
              </span>
            </div>
            {(template.applicationType || "CLUB") === "CLUB" && (
              <div className="flex items-center gap-2 text-slate-500">
                <Building2 size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {template.scope === "ALL"
                    ? "Visi padaliniai"
                    : template.scope === "SELECTED"
                      ? "Vienas padalinys"
                      : "Regionas"}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                <User size={12} />
              </div>
              <span className="text-xs font-bold text-slate-700 truncate max-w-[120px]">
                {assigneeUser?.name || "Nepriskirta"}
              </span>
            </div>
            <button className="p-2 hover:bg-slate-50 rounded-xl text-slate-300 group-hover:text-slate-900 transition-colors">
              <MoreVertical size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  },
);

const TemplateEditModalImproved = ({
  template,
  onClose,
  onSave,
  clubs,
  users,
  workflowTypes,
}: {
  template: any;
  onClose: () => void;
  onSave: (val: any) => void;
  clubs: any[];
  users: any[];
  workflowTypes: WorkflowType[];
}) => {
  const [formData, setFormData] = useState({ 
    ...template,
    startDate: template.startDate || format(new Date(), 'yyyy-MM-dd'),
    sop: template.sop || { exists: false, url: '', updatedAt: null, updatedBy: null, history: [] }
  });
  const [errors, setErrors] = useState<string | null>(null);
  const [sopWarningVisible, setSopWarningVisible] = useState(
    !!template.id && (!template.sop || !template.sop.url)
  );
  const [copyOptionsVisible, setCopyOptionsVisible] = useState(false);
  const [copyFormData, setCopyFormData] = useState({
    targetClubId: '',
    copySop: true,
    copyPeriodicity: true,
    copyDescription: true,
    copyAttachments: true
  });
  const activeWorkflowTypes = useMemo(
    () =>
      workflowTypes
        .filter((workflow) => Boolean(workflow.active ?? workflow.enabled))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name)),
    [workflowTypes],
  );

  const validateAndSave = () => {
    if (!formData.title?.trim()) {
      setErrors("Užduoties pavadinimas privalomas.");
      return;
    }
    if (!formData.department) {
      setErrors("Pasirinkite skyrių.");
      return;
    }
    if (!formData.recurrence && !formData.frequency) {
      setErrors("Pasirinkite periodiškumą.");
      return;
    }
    if (!formData.startDate) {
      setErrors("Pradžios data privaloma.");
      return;
    }

    const date = parseISO(formData.startDate);
    const startWeek = getWeek(date);
    const month = date.getMonth() + 1;
    const quarter = Math.floor(date.getMonth() / 3) + 1;

    const finalData = {
      ...formData,
      startWeek,
      month,
      quarter
    };

    setErrors(null);
    onSave(finalData);
  };

  const handleSopUrlChange = (newUrl: string) => {
    const currentSop = formData.sop || { exists: false, url: '', updatedAt: null, updatedBy: null, history: [] };
    if (newUrl === currentSop.url) return;

    const newHistory = [...(currentSop.history || [])];
    if (currentSop.url || newUrl) {
      newHistory.push({
        oldUrl: currentSop.url || null,
        newUrl: newUrl,
        updatedAt: Date.now(),
        updatedBy: 'Admin'
      });
    }

    setFormData({
      ...formData,
      sop: {
        ...currentSop,
        exists: !!newUrl,
        url: newUrl,
        updatedAt: Date.now(),
        updatedBy: 'Admin',
        history: newHistory
      }
    });

    createAuditLogEntry({
      moduleId: "periodic",
      moduleName: "Periodiniai darbai",
      entityType: "TEMPLATE",
      entityId: formData.id,
      entityTitle: formData.title,
      actionType: "UPDATED",
      changeDescription: `Pakeista SOP nuoroda: ${newUrl || "Pašalinta"} užduočiai "${formData.title}"`,
      locationLabel: `Periodiniai darbai > SOP Redagavimas > ${formData.title}`,
      canRestore: true,
      oldValue: currentSop.url,
      newValue: newUrl
    });
  };

  const handleCopy = () => {
    if (!copyFormData.targetClubId) return;
    
    const newTemplate = {
      ...formData,
      id: `PT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      targetClubIds: [copyFormData.targetClubId],
      scope: 'SELECTED',
      sop: copyFormData.copySop ? formData.sop : { exists: false, url: '', updatedAt: null, updatedBy: null, history: [] },
      recurrence: copyFormData.copyPeriodicity ? formData.recurrence : undefined,
      frequency: copyFormData.copyPeriodicity ? formData.frequency : undefined,
      description: copyFormData.copyDescription ? formData.description : '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      history: [{
        id: `h-${Date.now()}`,
        timestamp: Date.now(),
        user: 'Admin',
        action: 'created'
      }]
    };
    
    // Add to audit
    createAuditLogEntry({
      moduleId: "periodic",
      moduleName: "Periodiniai darbai",
      entityType: "TEMPLATE",
      entityId: newTemplate.id,
      entityTitle: newTemplate.title,
      actionType: 'CREATED',
      locationLabel: `Periodiniai darbai > Kopijavimas > ${newTemplate.title}`,
      changeDescription: `Užduotis nukopijuota klubui ${clubs.find(c => c.id === copyFormData.targetClubId)?.name}`,
      canRestore: false,
      newValue: newTemplate
    });

    onSave(newTemplate);
    setCopyOptionsVisible(false);
  };

  const validateAndSetStatus = (newStatus: boolean) => {
    if (newStatus) {
      if (!formData.title?.trim()) {
        setErrors("Užduotis negali būti aktyvuota, nes trūksta pavadinimo.");
        return;
      }
      if (!formData.department) {
        setErrors("Užduotis negali būti aktyvuota, nes trūksta skyriaus pasirinkimo.");
        return;
      }
      if (formData.scope === "SELECTED" && (!formData.targetClubIds || formData.targetClubIds.length === 0)) {
        setErrors("Užduotis negali būti aktyvuota, nes nepasirinktas padalinys.");
        return;
      }
      if (!formData.recurrence && !formData.frequency) {
        setErrors("Užduotis negali būti aktyvuota, nes trūksta periodiškumo.");
        return;
      }
    }
    setErrors(null);
    setFormData({ ...formData, isActive: newStatus });
  };

  const handleScopeChange = (scope: string) => {
    let targetClubIds: string[] = [];
    if (scope === "ALL") {
      targetClubIds = clubs.filter(c => c.is_active !== false).map(c => c.id);
    }
    setFormData({ ...formData, scope: scope as any, targetClubIds });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60"
      />
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        className="relative bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase">
              {template.id ? "Redaguoti užduotį" : "Nauja periodinė užduotis"}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                "w-2 h-2 rounded-full",
                formData.isActive ? "bg-emerald-500" : "bg-red-500"
              )} />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Statusas: {formData.isActive ? "Aktyvi" : "Neaktyvi"}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-6">
          {sopWarningVisible && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-4"
            >
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-sm">
                <AlertCircle size={20} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-amber-900 uppercase">Trūksta SOP</h4>
                <p className="text-xs text-amber-700 font-medium mt-1">
                  Ši periodinė užduotis neturi SOP. Rekomenduojama pridėti SOP nuorodą, kad procesas būtų standartizuotas.
                </p>
                <div className="flex gap-4 mt-3">
                  <button 
                    onClick={() => {
                      setSopWarningVisible(false);
                      const el = document.getElementById('sop-url-input');
                      el?.focus();
                    }}
                    className="text-xs font-black text-amber-900 uppercase hover:underline"
                  >
                    Pridėti SOP
                  </button>
                  <button 
                    onClick={() => setSopWarningVisible(false)}
                    className="text-xs font-black text-amber-400 uppercase hover:text-amber-600"
                  >
                    Priminti vėliau
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {errors && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 animate-shake">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-sm font-bold">{errors}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">
                  Taikymo tipas *
                </label>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { id: "GENERAL", label: "Bendroji", icon: "🌐" },
                    { id: "CLUB", label: "Klubų", icon: "🏢" },
                  ].map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          applicationType: type.id,
                        })
                      }
                      className={cn(
                        "py-3 rounded-xl text-sm font-black transition-colors border flex items-center justify-center gap-2",
                        (formData.applicationType || "CLUB") === type.id
                          ? "bg-slate-900 text-white border-slate-900 shadow-md"
                          : "bg-white text-slate-500 border-slate-200 hover:border-slate-300",
                      )}
                    >
                      <span>{type.icon}</span>
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">
                  Pavadinimas *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#d9f945] font-bold"
                  placeholder="Užduoties pavadinimas"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">
                  Skyrius *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["Operacijos", "Marketingas"].map((dep) => (
                    <button
                      key={dep}
                      type="button"
                      onClick={() => setFormData({ ...formData, department: dep })}
                      className={cn(
                        "py-3 rounded-xl text-sm font-black transition-colors border",
                        formData.department === dep
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                      )}
                    >
                      {dep}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">
                  Kurti kortelę workflow
                </label>
                <select
                  value={formData.destinationWorkflowTypeId || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      destinationType: e.target.value ? "WORKFLOW_CARD" : formData.destinationType,
                      destinationWorkflowTypeId: e.target.value || undefined,
                    })
                  }
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#d9f945] font-bold"
                >
                  <option value="">Nepasirinkta</option>
                  {activeWorkflowTypes.map((workflow) => (
                    <option key={workflow.id} value={workflow.id}>
                      {workflow.label || workflow.name}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-[10px] font-semibold text-slate-400 leading-relaxed ml-1">
                  Pasirinktas workflow nustato, kuriame Kanban atsiras periodinio darbo kortelė.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">
                  Aprašymas
                </label>
                <RichTextEditor
                  value={formData.description || ""}
                  onChange={(val) => setFormData({ ...formData, description: val })}
                  placeholder="Išsamus užduoties aprašymas..."
                  minHeight="120px"
                />
              </div>
            </div>

            <div className="space-y-4">
              {(formData.applicationType || "CLUB") === "CLUB" && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">
                    Padaliniai, kur bus naudojama *
                  </label>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: "SELECTED", label: "Vienas padalinys" },
                        { id: "ALL", label: "Visi padaliniai" },
                        { id: "REGION", label: "Kai kurie padaliniai" },
                      ].map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleScopeChange(s.id)}
                          className={cn(
                            "py-3 px-4 rounded-xl text-sm font-bold transition-colors border flex items-center justify-between",
                            formData.scope === s.id
                              ? "bg-slate-100 text-slate-900 border-slate-300"
                              : "bg-white text-slate-500 border-slate-200 hover:border-slate-300",
                          )}
                        >
                          {s.label}
                          {formData.scope === s.id && <Check size={16} />}
                        </button>
                      ))}
                    </div>

                    {formData.scope === "SELECTED" && (
                      <div className="space-y-3">
                        <select
                          value={formData.targetClubIds?.[0] || ""}
                          disabled={!!template.id}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              targetClubIds: [e.target.value],
                            })
                          }
                          className={cn(
                            "w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold appearance-none",
                            template.id && "opacity-60 cursor-not-allowed"
                          )}
                        >
                          <option value="">-- Pasirinkite vieną --</option>
                          {clubs.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        {template.id && (
                          <button
                            type="button"
                            onClick={() => setCopyOptionsVisible(true)}
                            className="w-full py-2 px-4 bg-slate-100 text-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                          >
                            <Plus size={14} /> Kopijuoti kitam klubui
                          </button>
                        )}
                      </div>
                    )}

                    {formData.scope === "REGION" && (
                      <div className="grid grid-cols-2 gap-1 bg-slate-50 p-3 rounded-2xl border border-slate-200 max-h-40 overflow-y-auto">
                        {clubs.map((c) => (
                          <label
                            key={c.id}
                            className="flex items-center gap-2 p-1 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.targetClubIds?.includes(c.id)}
                              onChange={(e) => {
                                const ids = formData.targetClubIds || [];
                                setFormData({
                                  ...formData,
                                  targetClubIds: e.target.checked
                                    ? [...ids, c.id]
                                    : ids.filter((id) => id !== c.id),
                                });
                              }}
                              className="rounded border-slate-300 focus:ring-[#d9f945]"
                            />
                            <span className="text-[10px] font-bold text-slate-600 truncate">
                              {c.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">
                  Periodiškumas *
                </label>
                <select
                  value={formData.recurrence || formData.frequency}
                  onChange={(e) => setFormData({ ...formData, recurrence: e.target.value as any, frequency: e.target.value as any })}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#d9f945] font-bold"
                >
                  <option value="daily">Kasdien</option>
                  <option value="weekly">Kas savaitę</option>
                  <option value="monthly">Kas mėnesį</option>
                  <option value="quarterly">Kas ketvirtį</option>
                  <option value="6_months">Sausis / Liepa</option>
                  <option value="yearly">Kartą metuose</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">
                  Planuojama Pradžios data *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#d9f945] font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">
                  SOP Nuoroda (Google Docs / Workspace)
                </label>
                <div className="relative">
                  <input
                    id="sop-url-input"
                    type="url"
                    value={formData.sop?.url || ""}
                    onChange={(e) => handleSopUrlChange(e.target.value)}
                    placeholder="https://docs.google.com/..."
                    className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#d9f945] font-bold"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Activity size={18} />
                  </div>
                </div>
                {formData.sop?.updatedAt && (
                  <p className="mt-2 text-[8px] font-bold text-slate-400 uppercase tracking-tighter ml-1">
                    Atnaujinta: {new Date(formData.sop.updatedAt).toLocaleDateString()} ({formData.sop.updatedBy})
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">
                  Statusas
                </label>
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => validateAndSetStatus(true)}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-xs font-black uppercase transition-colors flex items-center justify-center gap-2",
                      formData.isActive ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <Activity size={14} /> Aktyvi
                  </button>
                  <button
                    type="button"
                    onClick={() => validateAndSetStatus(false)}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-xs font-black uppercase transition-colors flex items-center justify-center gap-2",
                      !formData.isActive ? "bg-white text-red-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <Activity size={14} /> Neaktyvi
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* History / Audit Section */}
          <div className="pt-6 border-t border-slate-100">
            <h3 className="text-xs font-black text-slate-900 uppercase mb-4 flex items-center gap-2">
              <History size={16} className="text-slate-400" />
              Užduoties istorija
            </h3>
            <div className="space-y-3">
              {formData.history && formData.history.length > 0 ? (
                formData.history.map((h: any) => (
                  <div key={h.id} className="flex gap-4 group">
                    <div className="w-px bg-slate-100 relative">
                      <div className="absolute top-2 -left-1 w-2 h-2 rounded-full bg-slate-200 group-last:bg-slate-400" />
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex justify-between items-start">
                        <span className="text-[11px] font-black text-slate-900 uppercase">
                          {h.action === 'created' ? 'Sukurta' : 
                           h.action === 'activated' ? 'Aktyvuota' :
                           h.action === 'deactivated' ? 'Deaktyvuota' : 'Redaguota'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {new Date(h.timestamp).toLocaleString('lt-LT')}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mt-1">
                        Atliko: {h.user}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[10px] font-bold text-slate-400 uppercase italic">Istorijos įrašų nėra</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-4 text-slate-500 font-black uppercase text-xs tracking-widest hover:text-slate-900 transition-colors"
          >
            Atšaukti
          </button>
          <button
            onClick={validateAndSave}
            className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-colors shadow-lg active:scale-95"
          >
            Išsaugoti pakeitimus
          </button>
        </div>

        {/* Copy Options Modal Overlay */}
        {copyOptionsVisible && (
          <div className="absolute inset-0 z-[110] flex items-center justify-center bg-slate-900/40 p-6 backdrop-blur-[2px]">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[32px] p-8 shadow-2xl w-full max-w-sm space-y-6"
            >
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Kopijuoti kitam klubui</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Sukurti naują užduoties kopiją</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">Pasirinkite klubą</label>
                  <select
                    value={copyFormData.targetClubId}
                    onChange={(e) => setCopyFormData({ ...copyFormData, targetClubId: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="">Pasirinkite...</option>
                    {clubs.filter(c => !formData.targetClubIds?.includes(c.id)).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  {[
                    { id: 'copySop', label: 'Kopijuoti SOP' },
                    { id: 'copyPeriodicity', label: 'Kopijuoti Periodiškumą' },
                    { id: 'copyDescription', label: 'Kopijuoti Aprašymą/Checklistus' },
                    { id: 'copyAttachments', label: 'Kopijuoti Priedus' },
                  ].map(opt => (
                    <label key={opt.id} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={(copyFormData as any)[opt.id]}
                        onChange={(e) => setCopyFormData({ ...copyFormData, [opt.id]: e.target.checked })}
                        className="rounded border-slate-300 text-slate-900 focus:ring-[#d9f945]"
                      />
                      <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors uppercase tracking-tight">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setCopyOptionsVisible(false)}
                  className="flex-1 py-3 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-900 transition-colors"
                >
                  Atšaukti
                </button>
                <button 
                  onClick={handleCopy}
                  disabled={!copyFormData.targetClubId}
                  className="flex-1 py-3 bg-[#d9f945] text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-[#c8e640] transition-colors shadow-lg active:scale-95 disabled:opacity-50"
                >
                  Sukurti kopiją
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

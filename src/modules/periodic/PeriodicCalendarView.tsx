import React, { useMemo } from "react";
import {
  getWeek,
  startOfYear,
  endOfYear,
  eachWeekOfInterval,
  getMonth,
  addDays,
  getYear,
} from "date-fns";
import { cn } from "../../lib/utils";
import { Check, X, Circle, AlertCircle } from "lucide-react";

interface Props {
  faults?: any[];
  templates?: any[];
  history?: any[];
  clubs?: any[];
  onOpenCard?: (id: string) => void;
}

export const PeriodicCalendarView: React.FC<Props> = ({
  faults = [],
  templates = [],
  history = [],
  clubs = [],
  onOpenCard,
}) => {
  const today = new Date();
  const currentWeekNum = getWeek(today, { weekStartsOn: 1 });
  const currentYear = today.getFullYear();

  // 1. Generate 52 weeks
  const weeksData = useMemo(() => {
    return Array.from({ length: 52 }, (_, i) => i + 1);
  }, []);

  // 2. Group by month
  const monthGroups = useMemo(() => {
    return [
      { month: "JAN", idx: 0, weeks: [1, 2, 3, 4] },
      { month: "FEB", idx: 1, weeks: [5, 6, 7, 8] },
      { month: "MAR", idx: 2, weeks: [9, 10, 11, 12, 13] },
      { month: "APR", idx: 3, weeks: [14, 15, 16, 17] },
      { month: "MAY", idx: 4, weeks: [18, 19, 20, 21, 22] },
      { month: "JUN", idx: 5, weeks: [23, 24, 25, 26] },
      { month: "JUL", idx: 6, weeks: [27, 28, 29, 30] },
      { month: "AUG", idx: 7, weeks: [31, 32, 33, 34, 35] },
      { month: "SEP", idx: 8, weeks: [36, 37, 38, 39] },
      { month: "OCT", idx: 9, weeks: [40, 41, 42, 43] },
      { month: "NOV", idx: 10, weeks: [44, 45, 46, 47, 48] },
      { month: "DEC", idx: 11, weeks: [49, 50, 51, 52] },
    ];
  }, []);

  // 3. Build task rows - SAFE MODE & MIGRATION READY
  const rows = useMemo(() => {
    const rowsMap = new Map<string, any>();

    // Init from templates
    (templates || []).forEach((t) => {
      const freq = (t.frequency || t.recurrence || "monthly").toLowerCase();

      // Fallback variables just in case
      const legacyMonthData = t.month || {};

      rowsMap.set(t.id, {
        id: t.id,
        name: t.name || t.title,
        frequency: freq,
        occurrences: t.occurrences || [], // Backwards compatible with real occurrences
        legacyMonthData, // keep task.month data safe
      });
    });

    // Populate planned items & Overlay legacy month data visually
    rowsMap.forEach((row) => {
      if (!row.occurrences || row.occurrences.length === 0) {
        // SIMULATE WEEK DATA (TEMP): map month -> 4 weeks
        monthGroups.forEach((mg) => {
          // check if legacy month has value
          const monthHasValue = row.legacyMonthData[mg.month] || false;

          mg.weeks.forEach((wk, i) => {
            // First week of the month gets the "action" if monthly, the rest are planned or empty
            if (i === 0 && monthHasValue) {
              row.occurrences.push({
                week: wk,
                status: "completed",
                done: true,
              });
            } else {
              row.occurrences.push({
                week: wk,
                status: "planned",
                done: false,
              });
            }
          });
        });
      }
    });

    // Overlay history (Real Data overriding simulation)
    (history || []).forEach((h) => {
      const d = new Date(h.scheduledDate || h.completedAt);
      if (getYear(d) === currentYear) {
        const w = getWeek(d, { weekStartsOn: 1 });
        if (!rowsMap.has(h.templateId)) {
          rowsMap.set(h.templateId, {
            id: h.templateId,
            name: h.templateTitle,
            frequency: "unknown",
            occurrences: [],
          });
        }

        const row = rowsMap.get(h.templateId);
        const existing = row.occurrences.find((o: any) => o.week === w);
        const status =
          h.status === "COMPLETED"
            ? "completed"
            : h.status === "OVERDUE"
              ? "overdue"
              : "scheduled";

        if (existing) {
          existing.status = status;
          existing.done = h.status === "COMPLETED";
          existing.id = h.generatedTaskId || h.id;
        } else {
          row.occurrences.push({
            week: w,
            status,
            done: h.status === "COMPLETED",
            id: h.generatedTaskId || h.id,
          });
        }
      }
    });

    // Overlay faults (live)
    (faults || []).forEach((f) => {
      const isPeriodic = f.source === "PERIODIC" || f.periodic?.isPeriodic;
      if (!isPeriodic) return;

      const d = new Date(f.due_date || f.created_at);
      if (getYear(d) === currentYear) {
        const w = getWeek(d, { weekStartsOn: 1 });
        const tId = f.template_id || f.periodic?.templateId;
        if (tId) {
          if (!rowsMap.has(tId)) {
            rowsMap.set(tId, {
              id: tId,
              name: f.title,
              frequency: "unknown",
              occurrences: [],
            });
          }

          const row = rowsMap.get(tId);
          // Prioritize completed OVER overdue, scheduled
          const existingIndex = row.occurrences.findIndex(
            (o: any) => o.week === w,
          );
          const newStatus =
            f.status === "Sutvarkyta"
              ? "completed"
              : f.status === "Atmesta"
                ? "overdue"
                : "scheduled";

          const newItem = {
            week: w,
            status: newStatus,
            done: newStatus === "completed",
            id: f.id,
          };

          if (existingIndex >= 0) {
            const existing = row.occurrences[existingIndex];
            if (existing.status === "planned" || newStatus === "completed") {
              row.occurrences[existingIndex] = newItem;
            }
          } else {
            row.occurrences.push(newItem);
          }
        }
      }
    });

    return Array.from(rowsMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [templates, history, faults, weeksData, currentYear]);

  const renderStatus = (cell: any, isCurrentWeek: boolean) => {
    if (!cell) {
      return (
        <div className="w-full h-full min-h-[36px] flex flex-col items-center justify-center border-r border-slate-100 last:border-0 opacity-50" />
      );
    }

    return (
      <div
        onClick={() => {
          if (cell.id && onOpenCard) onOpenCard(cell.id);
        }}
        className={cn(
          "w-full h-full min-h-[36px] flex flex-col items-center justify-center border-r border-slate-100 last:border-0",
          cell.id ? "cursor-pointer hover:bg-slate-100" : "",
        )}
      >
        <div
          className={cn(
            "w-6 h-6 rounded-md flex items-center justify-center transition-all",
            cell.id && "hover:scale-110 active:scale-95 shadow-sm",
          )}
        >
          {cell.done ? (
            <Check size={14} className="text-emerald-500 font-bold" />
          ) : cell.status === "planned" ? (
            <Circle size={10} className="text-slate-300" />
          ) : (
            <X size={14} className="text-red-500 font-bold" />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[600px]">
      <div className="flex justify-between items-end mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Peržiūra: Savaitinis ({currentYear})
          </h2>
          <p className="text-slate-500 font-medium text-sm mt-1">
            S1..S52 periodinių darbų tvarkaraštis
          </p>
        </div>
        <div className="flex gap-4 text-xs font-bold text-slate-600">
          <div className="flex items-center gap-1.5">
            <Check size={14} className="text-emerald-500" /> Atlikta
          </div>
          <div className="flex items-center gap-1.5">
            <X size={14} className="text-red-500" /> Praleista
          </div>
          <div className="flex items-center gap-1.5">
            <AlertCircle size={14} className="text-amber-500" /> Aktyvi
          </div>
          <div className="flex items-center gap-1.5">
            <Circle size={10} className="text-slate-300" /> Planuojama
          </div>
        </div>
      </div>

      <div className="overflow-x-auto flex-1 rounded-2xl border border-slate-200 bg-slate-50 shadow-inner">
        <div className="min-w-max">
          {/* Header: Months */}
          <div className="flex items-stretch bg-slate-100 border-b border-slate-200 sticky top-0 z-20">
            <div className="w-64 shrink-0 border-r border-slate-200 p-3 flex items-center bg-slate-100 sticky left-0 z-30">
              <span className="font-bold text-slate-500 uppercase text-xs tracking-widest">
                Užduotis
              </span>
            </div>
            <div className="flex flex-1">
              {monthGroups.map((mg, i) => (
                <div
                  key={i}
                  className="border-r border-slate-200 last:border-0"
                  style={{ width: `${mg.weeks.length * 36}px` }}
                >
                  <div className="text-center py-2 text-xs font-black uppercase text-slate-700 tracking-widest border-b border-slate-200 bg-slate-200/50">
                    {mg.month}
                  </div>
                  <div className="flex h-8">
                    {mg.weeks.map((wd) => {
                      const isCurrent = wd === currentWeekNum;
                      return (
                        <div
                          key={wd}
                          className={cn(
                            "flex-1 border-r border-slate-200 last:border-0 text-[9px] font-bold text-center flex items-center justify-center",
                            isCurrent
                              ? "bg-amber-100 text-amber-800"
                              : "text-slate-500",
                          )}
                        >
                          S{wd}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Body: Rows */}
          <div className="bg-white relative">
            {/* Current Week Highlight */}
            <div
              className="absolute top-0 bottom-0 pointer-events-none bg-amber-50/50 border-x border-amber-200/30 z-0"
              style={{
                left: `calc(16rem + ${(currentWeekNum - 1) * 36}px)`,
                width: "36px",
              }}
            />

            {rows.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-medium">
                Nėra periodinių darbų
              </div>
            ) : (
              rows.map((row) => (
                <div
                  key={row.id}
                  className="flex border-b border-slate-100 hover:bg-slate-50/80 transition-colors relative z-10 group"
                >
                  <div className="w-64 shrink-0 border-r border-slate-200 p-3 bg-white group-hover:bg-slate-50/80 transition-colors sticky left-0 z-20 shadow-[1px_0_2px_rgba(0,0,0,0.05)] flex flex-col justify-center">
                    <span className="font-bold text-sm text-slate-800 line-clamp-2 leading-tight">
                      {row.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">
                      {row.frequency}
                    </span>
                  </div>
                  <div className="flex flex-1 items-stretch">
                    {monthGroups.map((mg, i) => (
                      <div
                        key={i}
                        className="flex border-r border-slate-200 last:border-0"
                        style={{ width: `${mg.weeks.length * 36}px` }}
                      >
                        {mg.weeks.map((wd) => {
                          const occ = row.occurrences.find(
                            (o: any) => o.week === wd,
                          );
                          return (
                            <div key={wd} className="flex-1 w-[36px]">
                              {renderStatus(occ, wd === currentWeekNum)}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

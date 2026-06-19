import React, { useMemo, useState } from "react";
import { addMonths, endOfMonth, format, startOfMonth, startOfYear } from "date-fns";
import {
  buildPeriodicInstancesForRange,
} from "../../mock-db/periodicInstances";
import { cn } from "../../lib/utils";
import { AlertCircle, BarChart3, CheckCircle2, Clock, TrendingDown } from "lucide-react";

interface Props {
  faults?: any[];
  history?: any[];
  templates?: any[];
  clubs?: any[];
}

type Period = "month" | "quarter" | "year";

const periodLabels: Record<Period, string> = {
  month: "Šis mėnuo",
  quarter: "3 mėn.",
  year: "Šie metai",
};

const statusLabels: Record<string, string> = {
  COMPLETED: "Atlikta",
  OVERDUE: "Vėluoja",
  SKIPPED: "Praleista",
  REJECTED: "Atmesta",
  SCHEDULED: "Suplanuota",
  IN_PROGRESS: "Vykdoma",
};

const statusClass: Record<string, string> = {
  COMPLETED: "bg-emerald-100 text-emerald-700",
  OVERDUE: "bg-red-100 text-red-700",
  SKIPPED: "bg-slate-100 text-slate-600",
  REJECTED: "bg-zinc-100 text-zinc-700",
  SCHEDULED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
};

function getPeriodRange(period: Period) {
  const now = new Date();
  if (period === "month") return { start: startOfMonth(now), end: endOfMonth(now) };
  if (period === "quarter") return { start: startOfMonth(addMonths(now, -2)), end: endOfMonth(now) };
  return { start: startOfYear(now), end: endOfMonth(now) };
}

export const PeriodicDashboard: React.FC<Props> = ({
  faults = [],
  history = [],
  templates = [],
  clubs = [],
}) => {
  const [period, setPeriod] = useState<Period>("month");

  const range = useMemo(() => getPeriodRange(period), [period]);

  const filteredHistory = useMemo(() => {
    return history.filter((record) => {
      const date = new Date(record.scheduledDate || record.completedAt || 0);
      return date >= range.start && date <= range.end;
    });
  }, [history, range]);

  const currentInstances = useMemo(() => {
    return buildPeriodicInstancesForRange({
      templates,
      clubs,
      history,
      workflowCards: faults,
      rangeStart: range.start,
      rangeEnd: range.end,
    });
  }, [templates, clubs, history, faults, range]);

  const kpis = useMemo(() => {
    const total = currentInstances.length;
    const completed = currentInstances.filter((i) => i.status === "COMPLETED").length;
    const overdue = currentInstances.filter((i) => i.status === "OVERDUE").length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, overdue, pct };
  }, [currentInstances]);

  const byClub = useMemo(() => {
    const map = new Map<string, { name: string; total: number; completed: number }>();
    currentInstances.forEach((inst) => {
      const club = clubs.find((c: any) => c.id === inst.clubId);
      const name = club?.name || inst.clubId;
      const entry = map.get(inst.clubId) || { name, total: 0, completed: 0 };
      entry.total++;
      if (inst.status === "COMPLETED") entry.completed++;
      map.set(inst.clubId, entry);
    });
    return Array.from(map.values())
      .map((e) => ({ ...e, pct: e.total > 0 ? Math.round((e.completed / e.total) * 100) : 0 }))
      .sort((a, b) => a.pct - b.pct);
  }, [currentInstances, clubs]);

  const byAssignee = useMemo(() => {
    const map = new Map<string, { name: string; total: number; completed: number; overdue: number }>();
    currentInstances.forEach((inst) => {
      const name = inst.assigneeId || "Nepriskirta";
      const entry = map.get(name) || { name, total: 0, completed: 0, overdue: 0 };
      entry.total++;
      if (inst.status === "COMPLETED") entry.completed++;
      if (inst.status === "OVERDUE") entry.overdue++;
      map.set(name, entry);
    });
    return Array.from(map.values())
      .map((e) => ({ ...e, pct: e.total > 0 ? Math.round((e.completed / e.total) * 100) : 0 }))
      .sort((a, b) => b.total - a.total);
  }, [currentInstances]);

  const byCriticality = useMemo(() => {
    const templateMap = Object.fromEntries(templates.map((t: any) => [t.id, t]));
    const buckets: Record<string, { total: number; completed: number }> = {
      CRITICAL: { total: 0, completed: 0 },
      IMPORTANT: { total: 0, completed: 0 },
      STANDARD: { total: 0, completed: 0 },
    };
    currentInstances.forEach((inst) => {
      const tmpl = templateMap[inst.templateId];
      const crit: string =
        inst.templateSnapshot?.criticality ||
        tmpl?.criticality ||
        (tmpl?.isMandatory ? "CRITICAL" : "STANDARD");
      if (crit in buckets) {
        buckets[crit].total++;
        if (inst.status === "COMPLETED") buckets[crit].completed++;
      }
    });
    return Object.entries(buckets).map(([label, data]) => ({
      label,
      ...data,
      pct: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
    }));
  }, [currentInstances, templates]);

  const overdueNow = useMemo(() => {
    const now = Date.now();
    return currentInstances
      .filter(
        (i) =>
          i.status === "OVERDUE" ||
          (i.status !== "COMPLETED" &&
            i.status !== "SKIPPED" &&
            i.overdueAt &&
            i.overdueAt < now),
      )
      .sort((a, b) => {
        const critOrder: Record<string, number> = { CRITICAL: 0, IMPORTANT: 1, STANDARD: 2 };
        const aCrit = critOrder[a.templateSnapshot?.criticality ?? "STANDARD"] ?? 2;
        const bCrit = critOrder[b.templateSnapshot?.criticality ?? "STANDARD"] ?? 2;
        if (aCrit !== bCrit) return aCrit - bCrit;
        return (a.overdueAt ?? 0) - (b.overdueAt ?? 0);
      });
  }, [currentInstances]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Suvestinė</h2>
        <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-sm ml-auto">
          {(Object.keys(periodLabels) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                period === p ? "bg-slate-900 text-white shadow-md" : "text-slate-400 hover:text-slate-600",
              )}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Card 1: Tinklo įvykdymas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Iš viso", value: kpis.total, icon: BarChart3, color: "text-slate-600" },
          { label: "Atlikta", value: kpis.completed, icon: CheckCircle2, color: "text-emerald-600" },
          { label: "Vėluoja", value: kpis.overdue, icon: Clock, color: "text-red-600" },
          { label: "Įvykdymas", value: `${kpis.pct}%`, icon: TrendingDown, color: kpis.pct >= 80 ? "text-emerald-600" : kpis.pct >= 60 ? "text-orange-500" : "text-red-600" },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
              <item.icon size={18} className={item.color} />
            </div>
            <div className={cn("text-3xl font-black", item.color)}>{item.value}</div>
            <div className="text-xs text-slate-400 mt-1">
              {format(range.start, "yyyy-MM-dd")} — {format(range.end, "yyyy-MM-dd")}
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar for overall completion */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-black text-slate-900 uppercase tracking-tight">Tinklo įvykdymas</span>
          <span className={cn(
            "text-2xl font-black",
            kpis.pct >= 80 ? "text-emerald-600" : kpis.pct >= 60 ? "text-orange-500" : "text-red-600",
          )}>
            {kpis.pct}%
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className={cn(
              "h-3 rounded-full transition-all duration-700",
              kpis.pct >= 80 ? "bg-emerald-500" : kpis.pct >= 60 ? "bg-orange-400" : "bg-red-500",
            )}
            style={{ width: `${kpis.pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>{kpis.completed} atlikta</span>
          <span>{kpis.total} iš viso</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 2: Pagal klubą */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Pagal klubą</h3>
            <p className="text-xs text-slate-400 mt-0.5">Blogiausiai vykdantys klubai pirmi</p>
          </div>
          <div className="divide-y divide-slate-50">
            {byClub.length === 0 ? (
              <div className="p-5 text-sm text-slate-400 text-center">Duomenų nėra</div>
            ) : (
              byClub.slice(0, 10).map((club) => (
                <div key={club.name} className="p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-800 truncate">{club.name}</div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                      <div
                        className={cn(
                          "h-1.5 rounded-full",
                          club.pct >= 80 ? "bg-emerald-400" : club.pct >= 60 ? "bg-orange-400" : "bg-red-400",
                        )}
                        style={{ width: `${club.pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={cn("text-sm font-black", club.pct >= 80 ? "text-emerald-600" : club.pct >= 60 ? "text-orange-500" : "text-red-600")}>
                      {club.pct}%
                    </div>
                    <div className="text-[10px] text-slate-400">{club.completed}/{club.total}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card 3: Pagal atsakingą */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Pagal atsakingą</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="p-3">Atsakingas</th>
                  <th className="p-3 text-right">Iš viso</th>
                  <th className="p-3 text-right">Atlikta %</th>
                  <th className="p-3 text-right">Vėluoja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {byAssignee.length === 0 ? (
                  <tr><td colSpan={4} className="p-5 text-center text-slate-400">Duomenų nėra</td></tr>
                ) : (
                  byAssignee.slice(0, 10).map((a) => (
                    <tr key={a.name} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-800 max-w-[140px] truncate">{a.name}</td>
                      <td className="p-3 text-right text-slate-600">{a.total}</td>
                      <td className={cn("p-3 text-right font-black", a.pct >= 80 ? "text-emerald-600" : a.pct >= 60 ? "text-orange-500" : "text-red-600")}>
                        {a.pct}%
                      </td>
                      <td className="p-3 text-right">
                        {a.overdue > 0 ? (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-lg text-xs font-black">{a.overdue}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Card 4: Pagal kritiškumą */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-4">Pagal kritiškumą</h3>
        <div className="grid grid-cols-3 gap-4">
          {byCriticality.map((item) => {
            const critLabels: Record<string, string> = { CRITICAL: "Kritinė", IMPORTANT: "Svarbi", STANDARD: "Standartinė" };
            const critColors: Record<string, string> = { CRITICAL: "bg-red-500", IMPORTANT: "bg-orange-400", STANDARD: "bg-blue-400" };
            return (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full shrink-0", critColors[item.label])} />
                  <span className="text-xs font-black text-slate-500 uppercase tracking-tight">{critLabels[item.label]}</span>
                </div>
                <div className={cn("text-2xl font-black", item.pct >= 80 ? "text-emerald-600" : item.pct >= 60 ? "text-orange-500" : "text-red-600")}>
                  {item.pct}%
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={cn("h-2 rounded-full", item.pct >= 80 ? "bg-emerald-400" : item.pct >= 60 ? "bg-orange-400" : "bg-red-400")}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400">{item.completed}/{item.total}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Card 5: Vėluoja dabar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-2">
          <AlertCircle size={18} className="text-red-500" />
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Vėluoja dabar</h3>
          {overdueNow.length > 0 && (
            <span className="ml-auto px-2 py-0.5 bg-red-100 text-red-700 text-xs font-black rounded-lg">{overdueNow.length}</span>
          )}
        </div>
        {overdueNow.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500 font-medium">Visi darbai įvykdyti laiku</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {overdueNow.slice(0, 15).map((inst) => {
              const club = clubs.find((c: any) => c.id === inst.clubId);
              const dueDate = inst.dueDate || inst.dueAt;
              const daysOverdue = dueDate
                ? Math.floor((Date.now() - dueDate) / (1000 * 60 * 60 * 24))
                : 0;
              return (
                <div key={inst.id} className="p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate">{inst.titleSnapshot}</div>
                    <div className="text-xs text-slate-500">{club?.name || inst.clubId}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-black rounded-lg">
                      +{daysOverdue}d
                    </span>
                    {dueDate && (
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {format(new Date(dueDate), "yyyy-MM-dd")}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

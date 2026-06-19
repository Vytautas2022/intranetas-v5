import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { mockPeriodicHistory } from '../../mock-db/periodicHistory';
import { mockPeriodicTemplates } from '../../mock-db/periodicTemplates';

interface PeriodicAnalyticsProps {
  faults: any[];
  history: any[];
  templates: any[];
  clubs: any[];
}

export const PeriodicAnalytics: React.FC<PeriodicAnalyticsProps> = ({ faults, history, templates, clubs }) => {
  const [filterRegion, setFilterRegion] = useState<string>('ALL');
  const [filterActive, setFilterActive] = useState<string>('ALL');

  const regions = useMemo(() => {
    const r = new Set<string>();
    (clubs || []).forEach(c => { if(c && c.region) r.add(c.region); });
    return Array.from(r);
  }, [clubs]);

  const stats = useMemo(() => {
    const safeHistory = history || [];
    const safeTemplates = templates || [];
    const total = safeHistory.length;
    const completed = safeHistory.filter(h => h && h.status === 'COMPLETED').length;
    const overdue = safeHistory.filter(h => h && h.status === 'OVERDUE').length;
    const rescheduled = safeHistory.filter(h => h && h.status === 'RESCHEDULED').length;
    
    const costs = safeHistory.filter(h => h && h.actualCost).map(h => h.actualCost!);
    const avgCost = (costs?.length || 0) > 0 ? costs.reduce((a, b) => a + b, 0) / costs.length : 0;
    
    const inspectionTasks = safeHistory.filter(h => {
      if (!h) return false;
      const t = safeTemplates.find(x => x && x.id === h.templateId);
      return t && (t.type as string) === 'INSPECTION';
    });
    const actionRequired = inspectionTasks.filter(h => h && h.decision === 'ACTION_NEEDED').length;
    const actionRate = (inspectionTasks?.length || 0) > 0 ? (actionRequired / inspectionTasks.length) * 100 : 0;

    return {
      onTimeRate: total > 0 ? (completed / total) * 100 : 0,
      overdue,
      rescheduled,
      avgCost,
      actionRate
    };
  }, [history, templates]);

  const perClubAnalytics = useMemo(() => {
    let filteredClubs = (clubs || []);
    
    if (filterRegion !== 'ALL') {
      filteredClubs = (filteredClubs || []).filter(c => c && c.region === filterRegion);
    }
    
    if (filterActive !== 'ALL') {
      const active = filterActive === 'ACTIVE';
      filteredClubs = (filteredClubs || []).filter(c => c && (c.is_active === active || (active && c.is_active === undefined)));
    }

    return (filteredClubs || []).map(club => {
        const clubTasks = (faults || []).filter(f => f && f.clubId === club.id && f.periodic?.isPeriodic);
        const completed = (clubTasks || []).filter(t => t && (t.status === 'CLOSED' || t.status === 'SUTVARKYTA')).length;
        const total = (clubTasks?.length || 0);
        const progress = total > 0 ? (completed / total) * 100 : 0;
        
        return {
            ...club,
            completed,
            total,
            progress
        };
    }).sort((a, b) => b.progress - a.progress);
  }, [clubs, faults, filterRegion, filterActive]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-slate-500 mr-2">
            {/* Using a lucide icon if available, or just text */}
            <span className="text-[10px] font-black uppercase tracking-widest">Filtrai:</span>
        </div>
        
        <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black text-slate-400 uppercase ml-1">Regionas</span>
            <select 
                value={filterRegion} 
                onChange={(e) => setFilterRegion(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-slate-900/10 min-w-[120px]"
            >
                <option value="ALL">Visi regionai</option>
                {(regions || []).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
        </div>

        <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black text-slate-400 uppercase ml-1">Būsena</span>
            <select 
                value={filterActive} 
                onChange={(e) => setFilterActive(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-slate-900/10 min-w-[120px]"
            >
                <option value="ALL">Visi klubai</option>
                <option value="ACTIVE">Tik aktyvūs</option>
                <option value="INACTIVE">Neaktyvūs</option>
            </select>
        </div>
      </div>

      {/* Progress Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {(perClubAnalytics || []).map(club => (
              <div key={club.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                      <h3 className="font-black text-slate-900 text-sm truncate pr-2">{club && club.name}</h3>
                      <span className={cn(
                          "text-[10px] font-black px-2 py-0.5 rounded-full shrink-0",
                          club && club.progress > 80 ? "bg-emerald-100 text-emerald-700" :
                          club && club.progress > 50 ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                      )}>
                          {club && club.completed}/{club && club.total}
                      </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${club && club.progress}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className={cn(
                              "h-full rounded-full",
                              club && club.progress > 80 ? "bg-emerald-500" :
                              club && club.progress > 50 ? "bg-amber-500" :
                              "bg-red-500"
                          )}
                      />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Progresas
                      </p>
                      <p className="text-[10px] text-slate-900 font-black">
                          {club && club.progress.toFixed(0)}%
                      </p>
                  </div>
              </div>
          ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: 'Atlikta laiku', value: `${stats.onTimeRate.toFixed(0)}%` },
          { label: 'Vėluojantys', value: stats.overdue },
          { label: 'Atidėti', value: stats.rescheduled },
          { label: 'Vidutinė kaina', value: `${stats.avgCost.toFixed(0)} €` },
          { label: 'Apžiūrų veiksmai', value: `${stats.actionRate.toFixed(0)}%` },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{stat.label}</p>
            <p className="text-xl font-black text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 mb-6 uppercase tracking-wider">Periodinių darbų progresas pagal klubus</h3>
            <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white">
                        <tr className="text-left text-slate-500 border-b border-slate-100">
                            <th className="pb-3 px-2">Klubas</th>
                            <th className="pb-3 px-2 text-center">Atlikta</th>
                            <th className="pb-3 px-2 text-center">Viso</th>
                            <th className="pb-3 px-2 text-right">Progresas</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(perClubAnalytics || []).map((c, idx) => (
                            <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-2 font-black text-slate-700">{c && c.name}</td>
                                <td className="py-3 px-2 text-center text-slate-600 font-bold">{c && c.completed}</td>
                                <td className="py-3 px-2 text-center text-slate-400">{c && c.total}</td>
                                <td className="py-3 px-2 text-right">
                                    <span className={cn(
                                        "font-black",
                                        c && c.progress > 80 ? "text-emerald-500" :
                                        c && c.progress > 50 ? "text-amber-500" :
                                        "text-red-500"
                                    )}>
                                        {c && c.progress.toFixed(0)}%
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black mb-6 uppercase tracking-wider">Paskutiniai 10 įvykių</h3>
            <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                <table className="w-full text-sm text-slate-700">
                  <thead className="sticky top-0 bg-white">
                    <tr className="text-left text-slate-500 border-b border-slate-100">
                      <th className="pb-3">Šablonas</th>
                      <th className="pb-3">Klubas</th>
                      <th className="pb-3">Kaina</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(history || []).slice(0, 10).map(h => (
                      <tr key={h.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="py-3 align-top font-bold">{h && h.templateTitle}</td>
                        <td className="py-3 align-top text-slate-600">{h && h.clubName}</td>
                        <td className="py-3 align-top text-right font-black">{h && (h.actualCost || 0)} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
          </div>
      </div>
    </div>
  );
};

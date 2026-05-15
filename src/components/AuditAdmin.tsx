import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  Search, 
  Filter, 
  Calendar, 
  User as UserIcon, 
  RefreshCcw, 
  ChevronRight,
  AlertCircle,
  X,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { getAuditLogs, restoreFromAuditLog, filterAuditLogs } from '../logic/auditLogic';
import { users } from '../mock-db/users';
import { clubs } from '../mock-db/clubs';
import { periodicTaskTemplates } from '../mock-db/periodicTasks';
import { cn } from '../lib/utils';
import { AuditLogEntry } from '../mock-db/auditLogs';

export const AuditAdmin: React.FC = () => {
  const [filters, setFilters] = useState({
    moduleId: '',
    userId: '',
    actionType: '',
    dateFrom: '',
    dateTo: '',
    search: ''
  });

  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<{ success: boolean; message: string } | null>(null);

  const modules = [
    { id: 'periodic', name: 'Periodiniai darbai' },
    { id: 'users', name: 'Vartotojai' },
    { id: 'clubs', name: 'Padaliniai' },
    { id: 'faults', name: 'Gedimai' },
    { id: 'orders', name: 'Užsakymai' }
  ];

  const actions = [
    'CREATED', 'UPDATED', 'STATUS_CHANGED', 'DEACTIVATED', 'RESTORED', 
    'COMMENT_ADDED', 'COMMENT_EDITED', 'COMMENT_DELETED'
  ];

  const filteredLogs = useMemo(() => {
    let logs = filterAuditLogs(filters);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      logs = logs.filter(l => 
        l.entityTitle.toLowerCase().includes(q) || 
        l.changeDescription.toLowerCase().includes(q) ||
        l.userName.toLowerCase().includes(q)
      );
    }
    return logs;
  }, [filters]);

  const handleRestore = () => {
    if (!selectedEntry) return;

    const dbs: Record<string, any[]> = {
      periodic: periodicTaskTemplates,
      users: users,
      clubs: clubs,
      // Add other DBs as they are integrated
    };

    const result = restoreFromAuditLog(selectedEntry.id, dbs);
    setRestoreStatus(result);
    if (result.success) {
      setTimeout(() => {
        setIsRestoreModalOpen(false);
        setRestoreStatus(null);
        setSelectedEntry(null);
      }, 2000);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'UPDATED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'STATUS_CHANGED': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'DEACTIVATED': return 'bg-red-100 text-red-700 border-red-200';
      case 'RESTORED': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
            <History className="text-brand-lime" size={28} />
            Sistemos auditas
          </h2>
          <p className="text-slate-500 text-sm font-medium">Sekite visus sistemos pakeitimus ir veiksmus</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Ieškoti..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-lime/20 outline-none"
              value={filters.search}
              onChange={e => setFilters({...filters, search: e.target.value})}
            />
          </div>

          <select 
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-lime/20 outline-none"
            value={filters.moduleId}
            onChange={e => setFilters({...filters, moduleId: e.target.value})}
          >
            <option value="">Visi moduliai</option>
            {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>

          <select 
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-lime/20 outline-none"
            value={filters.userId}
            onChange={e => setFilters({...filters, userId: e.target.value})}
          >
            <option value="">Visi vartotojai</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>

          <select 
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-lime/20 outline-none"
            value={filters.actionType}
            onChange={e => setFilters({...filters, actionType: e.target.value})}
          >
            <option value="">Visi veiksmai</option>
            {actions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <div className="flex gap-2">
            <input 
              type="date"
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              value={filters.dateFrom}
              onChange={e => setFilters({...filters, dateFrom: e.target.value})}
            />
            <input 
              type="date"
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              value={filters.dateTo}
              onChange={e => setFilters({...filters, dateTo: e.target.value})}
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-40">Data / Laikas</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-40">Vartotojas</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-40">Modulis</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Objektas / Veiksmas</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">Veiksmai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 text-xs">{format(new Date(log.timestamp), 'yyyy-MM-dd')}</span>
                      <span className="text-slate-400 text-[10px]">{format(new Date(log.timestamp), 'HH:mm:ss')}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                         {log.userName.charAt(0)}
                       </div>
                       <div className="flex flex-col">
                         <span className="font-bold text-slate-700 text-xs">{log.userName}</span>
                         <span className="text-[9px] font-black text-slate-400 uppercase">{log.userRole}</span>
                       </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-slate-100 rounded text-[9px] font-black text-slate-600 uppercase">
                      {log.moduleName}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{log.entityTitle}</span>
                        <span className={cn("px-2 py-0.5 rounded text-[8px] font-black border uppercase", getActionColor(log.actionType))}>
                          {log.actionType}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{log.changeDescription}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                        <Filter size={10} />
                        {log.locationLabel}
                      </div>
                      {(log.oldValue !== undefined || log.newValue !== undefined) && (
                        <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-3 text-[10px]">
                          <div className="flex flex-col">
                            <span className="text-slate-400 uppercase font-bold">Sena reikšmė</span>
                            <span className="text-red-500 line-through font-medium">{String(log.oldValue ?? '-')}</span>
                          </div>
                          <ChevronRight size={14} className="text-slate-300" />
                          <div className="flex flex-col">
                            <span className="text-slate-400 uppercase font-bold">Nauja reikšmė</span>
                            <span className="text-emerald-600 font-bold">{String(log.newValue ?? '-')}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    {log.canRestore ? (
                      <button 
                        onClick={() => {
                          setSelectedEntry(log);
                          setIsRestoreModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-brand-lime/10 text-black rounded-lg text-xs font-bold hover:bg-brand-lime transition-colors"
                      >
                        <RefreshCcw size={12} />
                        Atkurti
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 italic">Neatstatoma</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 font-medium italic">
                    Audito įrašų nerasta
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restore Modal */}
      <AnimatePresence>
        {isRestoreModalOpen && selectedEntry && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-lg">Atkurti duomenis</h3>
                <button onClick={() => setIsRestoreModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {!restoreStatus ? (
                  <>
                    <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                      <AlertCircle className="text-amber-500 shrink-0" size={20} />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-amber-900">Ar tikrai norite atkurti?</p>
                        <p className="text-xs text-amber-700 leading-relaxed">
                          Šis veiksmas pakeis dabartinę <strong>{selectedEntry.entityTitle}</strong> būseną į buvusią prieš šį pakeitimą.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sena reikšmė</span>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm font-bold text-slate-700 break-words">
                            {String(selectedEntry.oldValue ?? 'Pvz. duomenų snapshot')}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dabartinė reikšmė</span>
                          <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-sm font-bold text-slate-400 break-words">
                            {String(selectedEntry.newValue ?? '-')}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button 
                        onClick={() => setIsRestoreModalOpen(false)}
                        className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-colors"
                      >
                        Atšaukti
                      </button>
                      <button 
                        onClick={handleRestore}
                        className="flex-[2] py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-colors"
                      >
                        Patvirtinti atkūrimą
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="py-8 flex flex-col items-center justify-center gap-4 text-center">
                    {restoreStatus.success ? (
                      <>
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                          <CheckCircle2 size={32} />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-xl text-slate-900">Sėkmingai atkurta!</h4>
                          <p className="text-sm text-slate-500">Duomenys buvo sėkmingai atstatyti.</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                          <X size={32} />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-xl text-slate-900">Klaida atkuriant</h4>
                          <p className="text-sm text-slate-500">{restoreStatus.message}</p>
                        </div>
                         <button 
                          onClick={() => setRestoreStatus(null)}
                          className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
                        >
                          Bandyti dar kartą
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

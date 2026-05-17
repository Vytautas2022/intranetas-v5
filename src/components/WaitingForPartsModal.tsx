import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, FileText, AlertCircle, ArrowRight, Calendar, Zap } from 'lucide-react';
import { addDays, format, isToday, isTomorrow, isPast, parseISO, startOfDay } from 'date-fns';
import { lt } from 'date-fns/locale';

interface WaitingForPartsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { nextAction: string; dueDate: string; reason: string }) => void;
  faultTitle: string;
  isExtensionOnly?: boolean;
  isBulk?: boolean;
}

const isRiskZone = (dateStr: string) => {
  if (!dateStr) return false;
  try {
    const date = parseISO(dateStr);
    return isToday(date);
  } catch (e) {
    return false;
  }
};

export const WaitingForPartsModal: React.FC<WaitingForPartsModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  faultTitle,
  isExtensionOnly = false,
  isBulk = false
}) => {
  const [nextAction, setNextAction] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const containerClassName = React.useMemo(() => `
    flex flex-col gap-1 p-3 px-4 bg-slate-50 border rounded-2xl transition-all cursor-pointer
    ${isRiskZone(dueDate) ? 'border-orange-200 bg-orange-50/30' : 'border-slate-200'}
    hover:border-amber-300 hover:bg-slate-100/50
    focus-within:ring-2 focus-within:ring-amber-500/10 focus-within:border-amber-300
  `, [dueDate]);

  // Set default suggestion (NOW + 2 days) when modal opens
  useEffect(() => {
    if (isOpen) {
      const defaultDate = addDays(new Date(), 2);
      // Format to YYYY-MM-DDTHH:mm for datetime-local
      const formatted = format(defaultDate, "yyyy-MM-dd'T'HH:mm");
      setDueDate(formatted);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const isNextActionRequired = !isExtensionOnly;
    if ((isNextActionRequired && !nextAction.trim()) || !dueDate) {
      setError('Visi laukai yra privalomi.');
      return;
    }
    if (isExtensionOnly && !reason.trim()) {
      setError('Visi laukai yra privalomi.');
      return;
    }

    const selectedDate = parseISO(dueDate);
    const now = new Date();
    
    if (selectedDate < now) {
      setError('Terminas negali būti praeityje.');
      return;
    }

    onSubmit({ nextAction, dueDate, reason: isExtensionOnly ? reason : '' });
    // Reset fields
    setNextAction('');
    setDueDate('');
    setReason('');
  };

  const handleQuickDate = (days: number) => {
    const newDate = addDays(new Date(), days);
    setDueDate(format(newDate, "yyyy-MM-dd'T'HH:mm"));
  };

  const getHumanReadableDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = parseISO(dateStr);
      if (isToday(date)) return `Šiandien ${format(date, 'HH:mm')}`;
      if (isTomorrow(date)) return `Rytoj ${format(date, 'HH:mm')}`;
      
      const now = new Date();
      const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0 && diffDays < 7) {
        return `Po ${diffDays} d. (${format(date, 'EEEE', { locale: lt })})`;
      }
      
      return format(date, 'PPP HH:mm', { locale: lt });
    } catch (e) {
      return dateStr;
    }
  };

  const getFullTooltip = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = parseISO(dateStr);
      return `${format(date, 'yyyy-MM-dd HH:mm')} (${format(date, 'EEEE', { locale: lt })})`;
    } catch (e) {
      return dateStr;
    }
  };

  const title = isBulk 
    ? "Atnaujinti kelis darbus" 
    : (isExtensionOnly ? "SLA pratęsimas" : "Laukiama – nurodykite veiksmus");

  const submitLabel = isBulk ? "Atnaujinti" : (isExtensionOnly ? "Pratęsti SLA" : "Patvirtinti perkėlimą");

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">{title}</h3>
                  <p className="text-xs text-slate-400 font-medium truncate max-w-[300px]">{faultTitle}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-xs font-bold animate-in fade-in zoom-in-95">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {!isExtensionOnly && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Sekantis veiksmas</label>
                  <textarea
                    required
                    value={nextAction}
                    onChange={(e) => setNextAction(e.target.value)}
                    placeholder="Pvz. Užsakyti detalę, susisiekti su tiekėju, patikrinti garantiją"
                    className="w-full min-h-[80px] px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                  />
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Naujas SLA terminas</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 7].map(days => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => handleQuickDate(days)}
                        className="px-2 py-1 bg-slate-50 hover:bg-amber-50 hover:text-amber-600 text-slate-500 rounded-lg text-[10px] font-black transition-all border border-slate-100 hover:border-amber-100 active:scale-95"
                      >
                        +{days} d.
                      </button>
                    ))}
                  </div>
                </div>

                <div className="group relative">
                  <div 
                    onClick={() => {
                      const input = document.getElementById('sla-input');
                      if (input) (input as any).showPicker?.() || input.focus();
                    }}
                    className={containerClassName}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className={isRiskZone(dueDate) ? 'text-orange-500' : 'text-slate-400'} />
                        <span className="text-sm font-bold text-slate-900">
                          {getHumanReadableDate(dueDate)}
                        </span>
                      </div>
                      {isRiskZone(dueDate) && (
                        <span className="flex items-center gap-1 text-[10px] font-black text-orange-600 uppercase tracking-widest">
                          <Zap size={10} /> Skubos zona
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 pl-5">
                      <input
                        id="sla-input"
                        type="datetime-local"
                        required
                        value={dueDate}
                        min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                        title={getFullTooltip(dueDate)}
                        onChange={(e) => setDueDate(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-transparent text-[10px] font-bold text-slate-400 focus:outline-none cursor-pointer"
                      />
                    </div>
                  </div>
                  
                  {/* Tooltip on hover */}
                  <div className="absolute left-1/2 -bottom-2 translate-y-full -translate-x-1/2 px-3 py-1.5 bg-slate-800 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap shadow-xl">
                    {getFullTooltip(dueDate)}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45" />
                  </div>
                </div>
              </div>

              {isExtensionOnly && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Priežastis</label>
                  <textarea
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Kodėl pratęsiamas SLA?"
                    className="w-full min-h-[80px] px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-6 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all border border-transparent"
                >
                  Atšaukti
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all shadow-lg shadow-amber-200 flex items-center justify-center gap-2"
                >
                  {submitLabel} <ArrowRight size={18} />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  CheckCircle2, 
  HelpCircle, 
  FileText, 
  AlertCircle, 
  ArrowRight,
  RefreshCw,
  PlusCircle
} from 'lucide-react';
import { Fault } from '../types/faults';
import { cn } from '../lib/utils';

interface SopDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  fault: Fault | null;
  onConfirm: (decision: 'NONE' | 'CREATE' | 'UPDATE') => void;
}

export const SopDecisionModal: React.FC<SopDecisionModalProps> = ({
  isOpen,
  onClose,
  fault,
  onConfirm
}) => {
  if (!fault) return null;

  const hasSop = !!fault.sopUrl;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl overflow-hidden"
          >
            {/* Header Icon */}
            <div className={cn(
              "w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 transition-colors",
              hasSop ? "bg-blue-50 text-blue-500" : "bg-amber-50 text-amber-500"
            )}>
              {hasSop ? <FileText size={32} /> : <AlertCircle size={32} />}
            </div>

            <div className="text-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 mb-2 leading-tight">
                {hasSop ? "SOP patikrinimas" : "SOP nėra"}
              </h3>
              <p className="text-slate-500 text-sm font-medium">
                {hasSop 
                  ? "Ar reikia atnaujinti / papildyti esamą SOP pagal šį darbą?" 
                  : "Ar tai pasikartojantis darbas, kuriam reikėtų sukurti naują SOP?"}
              </p>
            </div>
            
            <div className="grid gap-4">
              <button 
                onClick={() => onConfirm(hasSop ? 'UPDATE' : 'CREATE')}
                className={cn(
                  "w-full p-4 rounded-2xl font-bold transition-all text-left flex items-center justify-between group border-2",
                  hasSop 
                    ? "bg-blue-50/50 border-blue-100 hover:bg-blue-50 text-blue-700" 
                    : "bg-amber-50/50 border-amber-100 hover:bg-amber-50 text-amber-700"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-2 rounded-xl",
                    hasSop ? "bg-blue-100" : "bg-amber-100"
                  )}>
                    {hasSop ? <RefreshCw size={20} /> : <PlusCircle size={20} />}
                  </div>
                  <div>
                    <span className="block text-sm uppercase tracking-wider mb-0.5">Taip</span>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {hasSop ? "Bus sukurta užduotis atnaujinimui" : "Bus sukurta užduotis sukūrimui"}
                    </p>
                  </div>
                </div>
                <ArrowRight size={20} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </button>

              <button 
                onClick={() => onConfirm('NONE')}
                className="w-full p-4 bg-slate-50 hover:bg-slate-100 border-2 border-slate-100 rounded-2xl font-bold text-slate-600 transition-all text-left flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-slate-200/50 rounded-xl">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <span className="block text-sm uppercase tracking-wider mb-0.5">Ne</span>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tęsti be papildomų veiksmų</p>
                  </div>
                </div>
                <ArrowRight size={20} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </button>
            </div>

            {hasSop && fault.sopUrl && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <a 
                  href={fault.sopUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 hover:text-blue-500 uppercase tracking-widest transition-colors"
                >
                  <FileText size={12} />
                  Peržiūrėti esamą SOP
                </a>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

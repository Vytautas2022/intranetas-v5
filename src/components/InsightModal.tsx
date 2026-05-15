import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, Lightbulb } from 'lucide-react';
import { Fault } from '../types/faults';

interface InsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  fault: Fault | null;
  onSubmit: (text: string) => void;
  onSkip: () => void;
}

export const InsightModal: React.FC<InsightModalProps> = ({
  isOpen,
  onClose,
  fault,
  onSubmit,
  onSkip
}) => {
  const [text, setText] = useState('');

  if (!fault) return null;

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
            className="relative bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl overflow-hidden flex flex-col gap-6"
          >
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto bg-amber-50 text-amber-500">
              <Lightbulb size={32} />
            </div>

            <div className="text-center">
              <h3 className="text-2xl font-black text-slate-900 mb-2 leading-tight">
                Pridėti patirtį ateičiai?
              </h3>
              <div className="text-slate-600 text-sm font-medium text-left bg-slate-50 p-4 rounded-xl border border-slate-100">
                Jei radote greitą ar gerą sprendimą, užrašykite jį čia.<br/><br/>
                Pvz:<br/>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-500">
                  <li>iš kur gavote detalę greitai</li>
                  <li>ką reikėjo patikrinti pirmiausia</li>
                  <li>koks buvo tikras gedimo priežastis</li>
                </ul>
                <br/>
                <span className="text-slate-500 italic">Ši informacija padės kitiems kolegoms kitą kartą sutvarkyti greičiau.</span>
              </div>
            </div>
            
            <textarea
              className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-700 min-h-[120px]"
              placeholder="Trumpai aprašykite sprendimą..."
              value={text}
              onChange={e => setText(e.target.value)}
            />

            <div className="flex gap-3 mt-2">
              <button 
                onClick={() => { setText(''); onSkip(); }}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors"
              >
                Praleisti
              </button>
              <button 
                onClick={() => { onSubmit(text); setText(''); }}
                disabled={!text.trim()}
                className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-bold rounded-xl transition-colors disabled:cursor-not-allowed"
              >
                Pridėti
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

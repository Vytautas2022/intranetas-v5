import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, ShoppingCart, MessageCircle, X, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

interface HomeActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (action: 'fault' | 'order' | 'other', subType?: string) => void;
}

export const HomeActionModal: React.FC<HomeActionModalProps> = ({ isOpen, onClose, onSelectAction }) => {
  const groups = [
    {
      name: 'Darbai',
      items: [
        {
          id: 'fault',
          subType: 'FACILITY_FAULT',
          title: 'Patalpų darbai',
          description: 'Pranešti apie techninį sutrikimą ar pastato problemą',
          icon: AlertCircle,
          color: 'text-red-600',
          bg: 'bg-red-50',
          hover: 'hover:border-red-200'
        },
        {
          id: 'fault',
          subType: 'EQUIPMENT_FAULT',
          title: 'Treniruoklių darbai',
          description: 'Pranešti apie sporto inventoriaus ar treniruoklio problemą',
          icon: Zap,
          color: 'text-orange-600',
          bg: 'bg-orange-50',
          hover: 'hover:border-orange-200'
        }
      ]
    },
    {
      name: 'Užsakymai',
      items: [
        {
          id: 'order',
          title: 'Užsakymai',
          description: 'Užsakyti prekes, paslaugas ar inventorių',
          icon: ShoppingCart,
          color: 'text-black',
          bg: 'bg-brand-lime',
          hover: 'hover:border-black'
        }
      ]
    },
    {
      name: 'Kita',
      items: [
        {
          id: 'other',
          title: 'Kiti klausimai',
          description: 'Bendri klausimai, pasiūlymai ar kita informacija',
          icon: MessageCircle,
          color: 'text-amber-600',
          bg: 'bg-amber-50',
          hover: 'hover:border-amber-200'
        }
      ]
    }
  ];

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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Pasirinkite veiksmą</h3>
                <p className="text-sm text-slate-400 font-medium">Ką norėtumėte daryti?</p>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors"
                id="close-home-modal"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              {groups.map((group) => (
                <div key={group.name} className="space-y-3">
                  <div className="px-1">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{group.name}</h4>
                  </div>
                  <div className="space-y-2">
                    {group.items.map((action, idx) => (
                      <button
                        key={`${action.id}-${action.title}`}
                        onClick={() => onSelectAction(action.id as any, (action as any).subType)}
                        className={cn(
                          "w-full p-4 rounded-2xl border border-slate-100 bg-white flex items-start gap-4 transition-all text-left",
                          "hover:shadow-lg hover:shadow-slate-100",
                          action.hover
                        )}
                        id={`action-${action.id}-${idx}`}
                      >
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", action.bg)}>
                          <action.icon size={24} className={action.color} />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-slate-900">{action.title}</div>
                          <div className="text-xs text-slate-400 font-medium mt-0.5 leading-relaxed">
                            {action.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

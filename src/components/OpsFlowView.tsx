
import React from 'react';
import { motion } from 'motion/react';
import { Fault, Status } from '../types/faults';
import { cn } from '../lib/utils';
import { ArrowRight } from 'lucide-react';

interface Props {
  tasks: Fault[];
  onNavigateTo: (status: string, type: string) => void;
}

const FLOW_STEPS = {
  gedimai: [Status.NEW, Status.IN_PROGRESS, Status.WAITING_DETAILS, Status.FIXED, Status.REJECTED],
  uzsakymai: [Status.NEW, 'PENDING_APPROVAL', 'ORDERED', 'DELIVERED', Status.FIXED],
  periodiniai: [Status.NEW, 'IN_PROGRESS', 'INSPECTION', Status.FIXED]
};

export const OpsFlowView: React.FC<Props> = React.memo(({ tasks, onNavigateTo }) => {

  const getCount = React.useCallback((type: 'gedimai' | 'uzsakymai' | 'periodiniai', status: string, subtype?: string) => {
    return tasks.filter(t => {
      // Basic type mapping
      if (type === 'gedimai' && (t.type === 'FACILITY_FAULT' || t.type === 'EQUIPMENT_FAULT')) {
          if (subtype) return t.type === subtype && t.status === status;
          return t.status === status;
      }
      if (type === 'uzsakymai' && t.type === 'ORDER') return t.status === status;
      if (type === 'periodiniai' && t.periodic?.isPeriodic) return t.status === status;
      return false;
    }).length;
  }, [tasks]);

  const renderFlow = (type: 'gedimai' | 'uzsakymai' | 'periodiniai', title: string) => (
    <div key={type} className="mb-12">
      <h3 className="text-lg font-black text-slate-900 mb-6">{title}</h3>
      <div className="flex flex-col md:flex-row gap-4 items-center">
        {FLOW_STEPS[type].map((status, idx) => {
          const count = getCount(type, status);
          return (
            <React.Fragment key={status}>
              <button 
                onClick={() => onNavigateTo(status, type)}
                className="w-full md:w-40 p-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-brand-lime transition-colors text-center"
              >
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{status}</div>
                <div className="text-2xl font-black text-slate-900">{count}</div>
              </button>
              {idx < FLOW_STEPS[type].length - 1 && (
                <ArrowRight className="text-slate-300 hidden md:block" size={24} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="p-8">
      <h2 className="text-2xl font-black text-slate-900 mb-8">Procesų flow</h2>
      {renderFlow('gedimai', 'Gedimai')}
      {renderFlow('uzsakymai', 'Užsakymai')}
      {renderFlow('periodiniai', 'Periodiniai darbai')}
    </div>
  );
});

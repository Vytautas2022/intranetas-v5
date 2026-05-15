import React from 'react';
import { ExternalLink, Plus, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';
import { PeriodicTemplate } from '../../mock-db/periodicTemplates';
import { cn } from '../../lib/utils';

interface PeriodicTemplatesViewProps {
  templates: PeriodicTemplate[];
  onEditTemplate: (template: PeriodicTemplate) => void;
  onCreateTemplate: () => void;
}

export const PeriodicTemplatesView: React.FC<PeriodicTemplatesViewProps> = ({ templates, onEditTemplate, onCreateTemplate }) => {
  console.log("PeriodicTemplatesView templates:", templates);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Periodiniai šablonai</h2>
        <button 
          onClick={onCreateTemplate}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-sm"
        >
          <Plus size={16} /> Naujas šablonas
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100">
              <th className="pb-3 px-2 uppercase text-[10px] tracking-widest font-black">Pavadinimas</th>
              <th className="pb-3 px-2 uppercase text-[10px] tracking-widest font-black">Tipas</th>
              <th className="pb-3 px-2 uppercase text-[10px] tracking-widest font-black">Periodiškumas</th>
              <th className="pb-3 px-2 uppercase text-[10px] tracking-widest font-black text-center">Aktyvus</th>
              <th className="pb-3 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {(templates || []).map(t => (
              <tr key={t.id} onClick={() => onEditTemplate(t)} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer">
                <td className="py-4 px-2">
                  <div className="flex flex-col">
                    <span className="font-black text-slate-900">{t && (t.name || t.title)}</span>
                    {t && t.sopUrl && (
                      <a href={t.sopUrl} target="_blank" rel="noreferrer" className="text-emerald-600 hover:text-emerald-700 text-[10px] font-bold flex items-center gap-1 mt-1">
                        SOP Nuoroda <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </td>
                <td className="py-4 px-2">
                   <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest",
                    t && t.type === 'MANDATORY' ? "bg-red-50 text-red-600 border border-red-100" : "bg-slate-50 text-slate-600 border border-slate-100"
                  )}>
                    {t && t.type}
                  </span>
                </td>
                <td className="py-4 px-2 text-slate-600 font-bold uppercase text-[10px] tracking-wider">{t && (t.recurrence || t.frequency)}</td>
                <td className="py-4 px-2 text-center text-slate-900">
                  <div className="flex justify-center">
                    {t && t.isActive ? <ToggleRight className="text-emerald-500" /> : <ToggleLeft className="text-slate-300" />}
                  </div>
                </td>
                <td className="py-4 px-2 text-right">
                  <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all"><Edit2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

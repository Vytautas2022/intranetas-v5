import React, { useState } from 'react';
import { FileText, AlertTriangle, Calendar, CheckCircle2, Clock, RotateCcw as History, Edit3, Save, X as CloseIcon } from 'lucide-react';
import { RichTextEditor } from './ui/RichTextEditor';
import DOMPurify from 'dompurify';
import { cn } from '../lib/utils';
import { Fault } from '../types/faults';
import { mockPeriodicTemplates } from '../mock-db/periodicTemplates';

import { createAuditLogEntry } from '../logic/auditLogic';

export const PeriodicDecisionBlock: React.FC<{
  fault: Fault;
  onUpdate: (updates: Partial<Fault>) => void;
  currentUser: { id: string; name: string; role: string };
}> = ({ fault, onUpdate, currentUser }) => {
  if (!fault.periodic?.isPeriodic) return null;

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState(fault.task_description || '');

  const template = mockPeriodicTemplates.find(t => t.id === fault.periodic?.templateId);

  const handleDecision = (decision: "NOT_CHECKED" | "OK_NO_ACTION" | "ACTION_NEEDED" | "EXECUTE" | "REJECT") => {
    onUpdate({
      inspection_decision: decision,
      periodic: {
        ...fault.periodic!,
        inspectionDecision: decision as any,
      }
    });

    if (decision === 'EXECUTE') {
      onUpdate({ status: 'Vykdoma' as any });
    }
  };

  const handleSaveDescription = () => {
    // Add to system audit log
    createAuditLogEntry({
      moduleId: 'periodic', 
      moduleName: 'Periodiniai darbai',
      entityType: 'PERIODIC_TASK',
      entityId: fault.id,
      entityTitle: template?.name || template?.title || fault.periodic?.templateTitle || fault.id,
      actionType: 'UPDATED',
      fieldName: 'task_description',
      oldValue: fault.task_description,
      newValue: tempDescription,
      changeDescription: 'Redaguotas laukas „Užduoties aprašymas“',
      locationLabel: `Periodiniai darbai > ${template?.name || 'Užduotis'}`,
      canRestore: true,
    });

    onUpdate({
      task_description: tempDescription,
      task_description_updated_at: Date.now(),
      task_description_updated_by: currentUser.name,
      // Add to internal history too 
      history: [
        ...(fault.history || []),
        {
          id: `h-desc-${Date.now()}`,
          timestamp: Date.now(),
          user: currentUser.name,
          actionType: 'DESCRIPTION_UPDATE',
          description: 'Redaguotas laukas „Užduoties aprašymas“'
        }
      ] as any
    });
    setIsEditingDescription(false);
  };

  const handleCancelDescription = () => {
    setTempDescription(fault.task_description || '');
    setIsEditingDescription(false);
  };

  const isOptional = fault.periodic_type === 'OPTIONAL';
  const decision = fault.inspection_decision || fault.periodic?.inspectionDecision || 'NOT_CHECKED';

  return (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
          <History size={14} className="text-brand-lime" /> Periodinio darbo sprendimas
        </h3>
        <span className={cn(
          "px-2 py-0.5 rounded text-[8px] font-black uppercase border",
          fault.periodic_type === 'MANDATORY' ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-slate-100 text-slate-500 border-slate-200"
        )}>
          {fault.periodic_type === 'MANDATORY' ? 'Privalomas' : 'Pasirinktinis (Optional)'}
        </span>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-bold text-slate-900 leading-tight">{template?.name || template?.title || fault.periodic?.templateTitle}</p>
        <div className="flex gap-2">
          <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600 flex items-center gap-1 shadow-sm">
            <Calendar size={10} />
            Terminas: {fault.due_date ? new Date(fault.due_date).toLocaleDateString('lt-LT') : (fault.periodic?.dueDate ? new Date(fault.periodic.dueDate as any).toLocaleDateString('lt-LT') : '-')}
          </span>
        </div>
      </div>

      {/* Task Description Section */}
      <div className="pt-2 border-t border-slate-200/60 pb-2">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Užduoties aprašymas</h4>
          {!isEditingDescription && (
            <button 
              onClick={() => setIsEditingDescription(true)}
              className="text-[10px] font-bold text-slate-900 hover:text-brand-lime flex items-center gap-1 uppercase tracking-tight"
            >
              <Edit3 size={10} /> Redaguoti aprašymą
            </button>
          )}
        </div>

        {isEditingDescription ? (
          <div className="space-y-3">
            <RichTextEditor
              value={tempDescription}
              onChange={setTempDescription}
              placeholder="Įveskite užduoties aprašymą..."
              minHeight="100px"
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={handleCancelDescription}
                className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase text-slate-500 hover:bg-slate-200 transition-colors flex items-center gap-1"
              >
                <CloseIcon size={12} /> Atšaukti
              </button>
              <button 
                onClick={handleSaveDescription}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase hover:bg-slate-800 transition-colors flex items-center gap-1 shadow-sm"
              >
                <Save size={12} /> Išsaugoti
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className={cn(
               "p-3 rounded-xl border border-dashed text-xs leading-relaxed",
               fault.task_description ? "bg-white border-slate-200 text-slate-700" : "bg-slate-100/50 border-slate-200 text-slate-400 italic"
            )}>
              {fault.task_description ? (
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(fault.task_description) }} 
                />
              ) : (
                "Aprašymas nepridėtas"
              )}
            </div>
            {fault.task_description_updated_at && (
              <div className="text-[9px] font-medium text-slate-400 italic pl-1">
                Paskutinį kartą redagavo: <span className="font-bold text-slate-500">{fault.task_description_updated_by}</span>, {new Date(fault.task_description_updated_at).toLocaleString('lt-LT')}
              </div>
            )}
          </div>
        )}
      </div>

      {isOptional ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => handleDecision('EXECUTE')}
              className={cn(
                "p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1",
                decision === 'EXECUTE' 
                  ? "bg-brand-lime border-brand-lime text-black shadow-lg shadow-brand-lime/20" 
                  : "bg-white border-slate-200 text-slate-500 hover:border-brand-lime/40"
              )}
            >
              <CheckCircle2 size={18} />
              <span className="text-[10px] font-black uppercase">Vykdyti</span>
            </button>
            <button 
              onClick={() => handleDecision('REJECT')}
              className={cn(
                "p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1",
                decision === 'REJECT' 
                  ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20" 
                  : "bg-white border-slate-200 text-slate-500 hover:border-red-500/40"
              )}
            >
              <AlertTriangle size={18} />
              <span className="text-[10px] font-black uppercase">Nevykdyti</span>
            </button>
          </div>

          {decision === 'REJECT' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <label className="text-[10px] font-black text-red-500 uppercase tracking-widest pl-1">Kodėl nevykdoma? (privaloma)</label>
              <textarea 
                value={fault.rejection_comment || ''}
                onChange={(e) => onUpdate({ rejection_comment: e.target.value })}
                placeholder="Nurodykite priežastį..."
                className="w-full bg-white border border-red-200 rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-red-500/10 outline-none min-h-[80px]"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          <button 
            onClick={() => handleDecision('OK_NO_ACTION')}
            className={cn(
              "w-full text-xs font-bold p-3 text-left rounded-xl transition-all border flex items-center justify-between",
              decision === 'OK_NO_ACTION' 
                ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm" 
                : "bg-white border-slate-200 hover:bg-emerald-50 text-slate-600"
            )}
          >
            <span>OK – veiksmų nereikia</span>
            {decision === 'OK_NO_ACTION' && <CheckCircle2 size={14} />}
          </button>
          <button 
            onClick={() => handleDecision('ACTION_NEEDED')}
            className={cn(
              "w-full text-xs font-bold p-3 text-left rounded-xl transition-all border flex items-center justify-between",
              decision === 'ACTION_NEEDED' 
                ? "bg-amber-50 border-amber-500 text-amber-800 shadow-sm" 
                : "bg-white border-slate-200 hover:bg-amber-50 text-slate-600"
            )}
          >
            <span>Reikia atlikti veiksmą / Atlikta</span>
            {decision === 'ACTION_NEEDED' && <AlertTriangle size={14} />}
          </button>
        </div>
      )}
    </div>
  );
};

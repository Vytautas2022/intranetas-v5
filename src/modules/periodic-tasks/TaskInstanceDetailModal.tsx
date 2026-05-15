import React, { useState, useMemo } from 'react';
import { usePeriodicTasks } from './PeriodicTaskContext';
import { getPeriodicTaskStatusLabel, getPeriodicTaskCategoryLabel, canComplete } from '../../logic/periodicTaskLogic';
import { periodicTaskTemplates } from '../../mock-db/periodicTasks';

interface Props {
  instanceId: string;
  onClose: () => void;
  currentUser: { id: string; name: string };
}

export const TaskInstanceDetailModal: React.FC<Props> = ({ instanceId, onClose, currentUser }) => {
  const { instances, startTask, completeTask, skipTask, setInspectionResult, markSopViewed } = usePeriodicTasks();
  const instance = instances.find(i => i.id === instanceId);
  const template = useMemo(() => {
    if (!instance) return null;
    return periodicTaskTemplates.find(t => t.id === instance.templateId);
  }, [instance]);
  const [notes, setNotes] = useState('');

  if (!instance) return null;

  const handleAction = (action: () => void) => {
    action();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex justify-end z-50" onClick={onClose}>
      <div className="bg-white w-[600px] h-full shadow-xl p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{instance.title}</h2>
            <p className="text-slate-500 text-sm">{instance.clubName} • {new Date(instance.dueDate).toLocaleDateString()}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">Uždaryti</button>
        </div>

        {/* Status Actions */}
        <div className="flex flex-wrap gap-2 mb-6 p-4 bg-slate-50 rounded-lg">
          {instance.status === 'SCHEDULED' && (
            <button onClick={() => handleAction(() => startTask(instance.id, currentUser.name))} className="px-3 py-1 bg-slate-900 text-white text-xs font-bold rounded">Pradėti</button>
          )}

          {template && canComplete(instance, template) && (
            <>
              <button onClick={() => handleAction(() => completeTask(instance.id, { actualCost: 0 }, currentUser.name))} className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded">Atlikti</button>
              <button onClick={() => handleAction(() => setInspectionResult(instance.id, 'OK', notes || 'Be pastabų', currentUser.name))} className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded">OK</button>
              <button onClick={() => handleAction(() => setInspectionResult(instance.id, 'ACTION_NEEDED', notes, currentUser.name))} className="px-3 py-1 bg-amber-600 text-white text-xs font-bold rounded">Reikia veiksmų</button>
            </>
          )}

          {instance.status !== 'COMPLETED' && instance.status !== 'SKIPPED' && (
            <button onClick={() => handleAction(() => skipTask(instance.id, 'Vartotojas praleido', currentUser.name))} className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded">Praleisti</button>
          )}
        </div>

        {/* Info */}
        <div className="mb-6 text-sm space-y-2">
          <p><span className="text-slate-500">Statusas:</span> <span className="font-bold">{getPeriodicTaskStatusLabel(instance.status)}</span></p>
          <p><span className="text-slate-500">Aprašymas:</span> {instance.description}</p>
          {instance.sourceType === 'PERIODIC' && (
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs mt-2">
                  <h4 className="font-bold text-amber-900 mb-1">Periodinio darbo informacija</h4>
                  <p>Template ID: {instance.templateId}</p>
              </div>
          )}
          <button onClick={() => markSopViewed(instance.id, currentUser.name)} className="text-xs text-amber-700 underline font-bold">Žiūrėti SOP</button>
        </div>
        
        {/* Inspection Notes */}
        {instance.status === 'IN_PROGRESS' && (
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-2 border rounded text-xs mb-4" placeholder="Pastabos..." />
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { usePeriodicTasks } from './PeriodicTaskContext';
import { TaskInstanceCard } from './TaskInstanceCard';
import { TaskInstanceDetailModal } from './TaskInstanceDetailModal';
import { TaskInstanceStatus } from '../../mock-db/periodicTasks';

const COLUMNS: { id: TaskInstanceStatus; label: string }[] = [
  { id: 'PENDING', label: 'Laukia' },
  { id: 'IN_PROGRESS', label: 'Vykdoma' },
  { id: 'ACTION_NEEDED', label: 'Reikia veiksmų' },
  { id: 'COMPLETED', label: 'Atlikta' },
  { id: 'OVERDUE', label: 'Vėluoja' },
  { id: 'SKIPPED', label: 'Praleista' },
];

interface Props {
  currentUser: { id: string; name: string };
}

export const PeriodicTaskKanban: React.FC<Props> = ({ currentUser }) => {
  const { instances, selectedInstanceId, setSelectedInstanceId } = usePeriodicTasks();

  return (
    <>
      <div className="flex gap-4 p-4 h-full overflow-x-auto items-start">
        {COLUMNS.map(col => (
          <div key={col.id} className="w-64 flex-shrink-0">
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 px-1">
              {col.label} ({instances.filter(i => i.status === col.id).length})
            </h3>
            <div className="space-y-3">
              {instances
                .filter(i => i.status === col.id)
                .map(instance => (
                  <TaskInstanceCard key={instance.id} instance={instance} onClick={() => setSelectedInstanceId(instance.id)} />
                ))}
            </div>
          </div>
        ))}
      </div>
      
      {selectedInstanceId && (
        <TaskInstanceDetailModal
          instanceId={selectedInstanceId}
          onClose={() => setSelectedInstanceId(null)}
          currentUser={currentUser}
        />
      )}
    </>
  );
};

import React from 'react';
import { PeriodicTaskInstance } from '../../mock-db/periodicTasks';
import { getPeriodicTaskCategoryLabel } from '../../logic/periodicTaskLogic';

interface TaskInstanceCardProps {
  instance: PeriodicTaskInstance;
  onClick: () => void;
}

/**
 * Compact task instance card for Kanban boards.
 */
export const TaskInstanceCard: React.FC<TaskInstanceCardProps> = ({ instance, onClick }) => {
  const isOverdue = instance.status === 'OVERDUE';
  const statusColor = isOverdue 
    ? 'text-red-700 border-red-200 bg-red-50' 
    : 'text-slate-600 border-slate-200 bg-slate-50';

  const formattedDate = new Date(instance.dueDate).toLocaleDateString();

  return (
    <div
      onClick={onClick}
      className={`p-3 bg-white border rounded-lg cursor-pointer transition-all hover:shadow-sm hover:border-slate-300 space-y-2 ${
        isOverdue ? 'border-red-300' : 'border-slate-200'
      }`}
    >
      <div className="flex justify-between items-start">
        <span className="font-bold text-sm text-slate-900 line-clamp-1">
          {instance.sourceType === 'PERIODIC' && <span className="bg-amber-100 text-amber-800 text-[9px] px-1 rounded mr-1">PERIODINIS</span>}
          {instance.title}
        </span>
        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${statusColor}`}>
          {instance.status}
        </span>
      </div>

      <div className="text-xs text-slate-500">{instance.clubName}</div>

      <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[10px] text-slate-400">
        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
          {instance.templateId} {/* Should ideally be category label if available */}
        </span>
        <span>{formattedDate}</span>
      </div>
    </div>
  );
};

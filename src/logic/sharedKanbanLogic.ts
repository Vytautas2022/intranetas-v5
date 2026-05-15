import { KanbanEntity, KanbanColumnSummary } from '../types/kanban';
import { addStatusChangeHistory } from './historyLogic';
import { calculateSlaProgress, getSlaStatus } from './sharedSlaLogic';

/**
 * Groups entities by status.
 */
export const groupByStatus = (entities: KanbanEntity[], statuses: string[]): Record<string, KanbanEntity[]> => {
  return statuses.reduce((acc, status) => {
    acc[status] = entities.filter(e => e.status === status);
    return acc;
  }, {} as Record<string, KanbanEntity[]>);
};

/**
 * Updates an entity status and records history.
 */
export const moveEntityStatus = (entity: KanbanEntity, newStatus: string, user: string) => {
  const oldStatus = entity.status;
  entity.status = newStatus;
  entity.updatedAt = Date.now();
  addStatusChangeHistory(entity, oldStatus, newStatus, user);
};

/**
 * Calculates summary for a Kanban column.
 */
export const calculateColumnSummary = (
  entities: KanbanEntity[], 
  statusId: string, 
  getSlaHours: (e: KanbanEntity) => number
): KanbanColumnSummary => {
  const columnEntities = entities.filter(e => e.status === statusId);
  const summary: KanbanColumnSummary = {
    statusId,
    total: columnEntities.length,
    overdue: 0,
    warning: 0,
    critical: 0,
    ok: 0,
  };

  columnEntities.forEach(e => {
    const slaHours = getSlaHours(e);
    if (!e.createdAt || slaHours <= 0) {
        summary.ok++;
        return;
    }
    const progress = calculateSlaProgress(Number(e.createdAt), slaHours);
    const status = getSlaStatus(progress);

    if (status === 'overdue') summary.overdue++;
    else if (status === 'critical') summary.critical++;
    else if (status === 'warning') summary.warning++;
    else summary.ok++;
  });

  return summary;
};

/**
 * Sorts entities by SLA danger level.
 */
export const sortBySlaDanger = (entities: KanbanEntity[], getSlaHours: (e: KanbanEntity) => number): KanbanEntity[] => {
  const getSeverity = (e: KanbanEntity) => {
    const slaHours = getSlaHours(e);
    if (!e.createdAt || slaHours <= 0) return 0;
    const progress = calculateSlaProgress(Number(e.createdAt), slaHours);
    const status = getSlaStatus(progress);
    
    if (status === 'overdue') return 4;
    if (status === 'critical') return 3;
    if (status === 'warning') return 2;
    return 1;
  };

  return [...entities].sort((a, b) => getSeverity(b) - getSeverity(a));
};

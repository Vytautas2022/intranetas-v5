import { 
  PeriodicTaskTemplate, 
  PeriodicTaskInstance, 
  TaskInstanceStatus,
  PeriodicTaskCategory,
  periodicTaskInstances
} from '../mock-db/periodicTasks';
import { createHistoryItem, addHistoryItem } from './historyLogic';

/**
 * Calculates the next due date based on recurrence type.
 */
export const generateNextDueDate = (template: PeriodicTaskTemplate, lastDate: number = Date.now()): number => {
  const date = new Date(lastDate);
  switch (template.recurrence) {
    case 'daily': date.setDate(date.getDate() + 1); break;
    case 'weekly': date.setDate(date.getDate() + 7); break;
    case 'monthly': date.setMonth(date.getMonth() + 1); break;
    case 'quarterly': date.setMonth(date.getMonth() + 3); break;
    default: date.setDate(date.getDate() + 1);
  }
  return date.getTime();
};

/**
 * Determines if a new instance should be created.
 */
export const shouldCreateInstance = (template: PeriodicTaskTemplate, existingInstances: PeriodicTaskInstance[], clubId: string): boolean => {
  return !existingInstances.some(inst => inst.templateId === template.id && inst.clubId === clubId && inst.status !== 'COMPLETED' && inst.status !== 'SKIPPED');
};

/**
 * Creates a new task instance.
 */
export const createInstanceFromTemplate = (template: PeriodicTaskTemplate, clubId: string, clubName: string, dueDate: number): PeriodicTaskInstance => {
  return {
    id: Math.random().toString(36).substring(2, 9),
    templateId: template.id,
    title: template.title,
    description: template.description,
    status: 'SCHEDULED',
    dueDate,
    clubId,
    clubName,
    comments: [],
    history: [createHistoryItem({ type: 'TASK_CREATED', user: 'SYSTEM' })],
    updatedAt: Date.now(),
    updatedBy: 'SYSTEM'
  };
};

/**
 * Mocks a cron job to keep instances up to date.
 */
export const refreshInstances = (templates: PeriodicTaskTemplate[], instances: PeriodicTaskInstance[], clubs: any[]): PeriodicTaskInstance[] => {
  // In production, this would be a server-side cron.
  // For now, scan for overdue and create new instances if needed.
  return instances.map(inst => {
    if (inst.status !== 'COMPLETED' && inst.status !== 'SKIPPED' && inst.dueDate < Date.now()) {
      return { ...inst, status: 'OVERDUE', updatedAt: Date.now() };
    }
    return inst;
  });
};

/**
 * Starts a task.
 */
export const startTask = (instance: PeriodicTaskInstance, user: string) => {
  instance.status = 'IN_PROGRESS';
  instance.updatedAt = Date.now();
  instance.updatedBy = user;
  addHistoryItem(instance, createHistoryItem({ type: 'TASK_STARTED', user }));
};

/**
 * Completes a task.
 */
export const completeTask = (instance: PeriodicTaskInstance, data: any, user: string) => {
  instance.status = 'COMPLETED';
  instance.actualCost = data.actualCost;
  instance.updatedAt = Date.now();
  instance.updatedBy = user;
  addHistoryItem(instance, createHistoryItem({ type: 'TASK_COMPLETED', user, meta: { actualCost: data.actualCost } }));
};

/**
 * Skips a task.
 */
export const skipTask = (instance: PeriodicTaskInstance, reason: string, user: string) => {
  instance.status = 'SKIPPED';
  instance.updatedAt = Date.now();
  instance.updatedBy = user;
  addHistoryItem(instance, createHistoryItem({ type: 'TASK_SKIPPED', user, meta: { reason } }));
};

/**
 * Sets results for inspection tasks.
 */
export const setInspectionResult = (instance: PeriodicTaskInstance, result: string, notes: string, user: string) => {
  instance.updatedAt = Date.now();
  instance.updatedBy = user;
  instance.comments.push({ id: Math.random().toString(), text: `Rezultatas: ${result}. Pastabos: ${notes}`, authorName: user, createdAt: Date.now() });
  addHistoryItem(instance, createHistoryItem({ type: 'INSPECTION_RESULT', user, meta: { result, notes } }));
};

/**
 * Marks SOP as viewed.
 */
export const markSopViewed = (instance: PeriodicTaskInstance, user: string) => {
  addHistoryItem(instance, createHistoryItem({ type: 'SOP_VIEWED', user }));
};

/**
 * Checks if task is ready to complete.
 */
export const canComplete = (instance: PeriodicTaskInstance, template: PeriodicTaskTemplate): boolean => {
  if (instance.status !== 'IN_PROGRESS') return false;
  
  if (template.isMandatory === false && instance.inspectionDecision === undefined) {
    return false; // User must decide if it's necessary
  }
  
  return true;
};

/**
 * Returns task status label.
 */
export const getPeriodicTaskStatusLabel = (status: TaskInstanceStatus): string => ({
  SCHEDULED: "Suplanuota",
  PENDING: "Laukia",
  IN_PROGRESS: "Vykdoma",
  INSPECTION_NEEDED: "Reikia patikros",
  ACTION_NEEDED: "Reikia veiksmų",
  COMPLETED: "Atlikta",
  SKIPPED: "Praleista",
  OVERDUE: "Vėluoja"
}[status]);

/**
 * Returns task category label.
 */
export const getPeriodicTaskCategoryLabel = (category: PeriodicTaskCategory): string => ({
  MAINTENANCE: "Priežiūra",
  INSPECTION: "Patikra",
  CLEANING: "Valymas",
  SAFETY: "Sauga",
  EQUIPMENT: "Įranga"
}[category]);

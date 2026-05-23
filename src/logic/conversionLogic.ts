import { Fault, Status } from '../types/faults';
import { generateUniqueId } from './idLogic';

export type ConversionMode = 'PROJECT' | 'SOMEDAY';

export function convertTaskToTaskModule(
  sourceTask: Fault,
  mode: ConversionMode,
  currentUser: { name: string; id: string }
): { updatedSource: Fault; newTask: Fault } {
  const now = Date.now();
  const rawId = generateUniqueId();
  const newTaskId = (mode === 'PROJECT' ? 'p' : 't') + rawId;

  // Map to "Užduotys" module (which uses Fault objects in mockTasks)
  const newTask: Fault = {
    ...sourceTask,
    id: newTaskId,
    source_task_id: sourceTask.id,
    entityType: mode === 'PROJECT' ? 'project' : 'task',
    status: mode === 'PROJECT' ? Status.NEW : Status.SOMEDAY,
    phase: mode === 'PROJECT' ? 'Planuojama' : sourceTask.phase,
    type: mode === 'PROJECT' ? 'PROJECT' : 'SOMEDAY',
    createdAt: now,
    updatedAt: now,
    created_at: new Date(now).toISOString(),
    updated_at: new Date(now).toISOString(),
    status_history: [{
      from: sourceTask.status || null,
      to: mode === 'PROJECT' ? Status.NEW : Status.SOMEDAY,
      date: new Date(now).toISOString(),
      user: currentUser.name
    }],
    updatedBy: currentUser.name,
    history: [
      {
        id: generateUniqueId('h'),
        timestamp: now,
        user: currentUser.name,
        actionType: 'CONVERTED_FROM_FAULT',
        reason: `Sukurta iš darbo ${sourceTask.code}`
      }
    ],
    comments: [],
    // Generate a visible code e.g. P-100 or T-100
    code: (mode === 'PROJECT' ? 'P-' : 'T-') + Math.floor(Math.random() * 1000 + 100),
    converted_to_task_id: undefined,
    converted_at: undefined,
    converted_by: undefined
  };

  const updatedSource: Fault = {
    ...sourceTask,
    status: Status.MOVED,
    converted_to_task_id: newTaskId,
    converted_at: now,
    converted_by: currentUser.name,
    updatedAt: now,
    updatedBy: currentUser.name,
    history: [
      ...sourceTask.history,
      {
        id: generateUniqueId('h'),
        timestamp: now,
        user: currentUser.name,
        actionType: 'MOVED_TO_TASKS',
        reason: `Perkelta į ${mode === 'PROJECT' ? 'projektus' : 'užduotis (Kada nors)'}`
      }
    ]
  };

  return { updatedSource, newTask };
}

export function returnTaskToDarbai(
  sourceTask: Fault,
  currentUser: { name: string; id: string }
): { updatedSource: Fault; newFault: Fault } {
  const now = Date.now();
  const rawId = generateUniqueId();
  const newFaultId = 'f' + rawId;

  const newFault: Fault = {
    ...sourceTask,
    id: newFaultId,
    source_task_id: sourceTask.id,
    entityType: 'fault',
    status: Status.NEW,
    type: sourceTask.type || 'OTHER',
    createdAt: now,
    updatedAt: now,
    created_at: new Date(now).toISOString(),
    updated_at: new Date(now).toISOString(),
    status_history: [{
      from: sourceTask.status || null,
      to: Status.NEW,
      date: new Date(now).toISOString(),
      user: currentUser.name
    }],
    updatedBy: currentUser.name,
    history: [
      {
        id: generateUniqueId('h'),
        timestamp: now,
        user: currentUser.name,
        actionType: 'RETURNED_FROM_TASKS',
        reason: `Grąžinta iš užduočių (Kada nors). Šaltinis: ${sourceTask.code}`
      }
    ],
    comments: [],
    code: 'F-' + Math.floor(Math.random() * 1000 + 100)
  };

  const updatedSource: Fault = {
    ...sourceTask,
    updatedAt: now,
    updatedBy: currentUser.name,
    history: [
      ...sourceTask.history,
      {
        id: generateUniqueId('h'),
        timestamp: now,
        user: currentUser.name,
        actionType: 'RETURNED_TO_DARBAI',
        reason: 'Darbas grąžintas į "Darbai" modulį'
      }
    ]
  };

  return { updatedSource, newFault };
}

export function promoteSomedayToProject(
  task: Fault,
  currentUser: { name: string; id: string }
): Fault {
  const now = Date.now();
  return {
    ...task,
    entityType: 'project',
    status: Status.NEW,
    type: 'PROJECT',
    updatedAt: now,
    updated_at: new Date(now).toISOString(),
    status_history: [
      ...(task.status_history || []),
      {
        from: task.status,
        to: Status.NEW,
        date: new Date(now).toISOString(),
        user: currentUser.name
      }
    ],
    updatedBy: currentUser.name,
    history: [
      ...task.history,
      {
        id: generateUniqueId('h'),
        timestamp: now,
        user: currentUser.name,
        actionType: 'PROMOTED_TO_PROJECT',
        reason: 'Užduotis paversta projektu'
      }
    ]
  };
}

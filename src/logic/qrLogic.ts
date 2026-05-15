import { Fault, Status, FaultComment } from '../types/faults';
import { qrEquipment, qrLocations } from '../mock-db/qr-mapping';
import { clubs } from '../mock-db/clubs';
import { equipmentList as adminEquipment } from '../mock-db/admin';
import { generateUniqueId, generateId } from './idLogic';

export interface QrReportInput {
  equipment_id?: string;
  location_id?: string;
  comment: string;
}

export interface QrReportResult {
  success: boolean;
  message: string;
  existingTask?: Fault;
  newTask?: Fault;
}

export function handleQrReport(
  input: QrReportInput,
  allTasks: Fault[],
  currentUser: { name: string; id: string }
): QrReportResult {
  const now = Date.now();
  
  // 1. Deduplication
  let existingTask: Fault | undefined;
  
  const activeStatuses = [Status.NEW, Status.IN_PROGRESS, Status.WAITING_DETAILS];

  if (input.equipment_id) {
    existingTask = allTasks.find(t => 
      t.entityType === 'fault' &&
      t.type === 'EQUIPMENT_FAULT' &&
      t.equipment_id === input.equipment_id &&
      activeStatuses.includes(t.status as Status)
    );
  } else if (input.location_id) {
    existingTask = allTasks.find(t => 
      t.entityType === 'fault' &&
      t.type === 'FACILITY_FAULT' &&
      t.location_id === input.location_id &&
      activeStatuses.includes(t.status as Status)
    );
  }

  if (existingTask) {
    // Add comment to existing task
    const newComment: FaultComment = {
      id: generateUniqueId('c'),
      text: input.comment || "Pakartotinai užregistruota per QR",
      author: currentUser.name,
      createdAt: now,
      mentions: [],
      edited: false,
      history: [],
      deleted: false,
      source: "QR"
    };

    const updatedTask: Fault = {
      ...existingTask,
      comments: [...existingTask.comments, newComment],
      repeat_count: (existingTask.repeat_count || 0) + 1,
      updatedAt: now,
      updatedBy: currentUser.name
    };

    return {
      success: true,
      message: "Problema jau užregistruota. Jūsų pranešimas pridėtas.",
      existingTask: updatedTask
    };
  }

  // 2. Create new task
  let clubId = '';
  let title = '';
  let type = '';

  if (input.equipment_id) {
    // Search in both mapping and admin list
    let eq: any = qrEquipment.find(e => e.id === input.equipment_id);
    if (!eq) {
      const adminEq = adminEquipment.find(e => e.id === input.equipment_id);
      if (adminEq) {
        eq = {
          id: adminEq.id,
          name: adminEq.name,
          number: adminEq.number,
          clubId: adminEq.club_id
        };
      }
    }

    if (eq) {
      clubId = eq.clubId;
      title = `${eq.name} (${eq.number})`;
      type = 'EQUIPMENT_FAULT';
    }
  } else if (input.location_id) {
    const loc = qrLocations.find(l => l.id === input.location_id);
    if (loc) {
      clubId = loc.clubId;
      title = loc.name;
      type = 'FACILITY_FAULT';
    }
  }

  if (!clubId) {
    return { success: false, message: "Nerastas objektas pagal nurodytą ID." };
  }

  const club = clubs.find(c => c.id === clubId);
  const clubName = club ? club.name : clubId;

  const newTask: Fault = {
    id: generateUniqueId('f'),
    title: title || 'QR Pranešimas',
    description: input.comment,
    clubId,
    clubName,
    status: Status.NEW,
    type,
    entityType: 'fault',
    createdAt: now,
    updatedAt: now,
    assigneeId: '',
    assigneeName: 'Nepriskirta',
    priority: 'medium',
    slaHours: 24,
    assignedTo: 'Nepriskirta',
    comments: [],
    media: [],
    watchers: [],
    rejected: false,
    rejectReason: '',
    updatedBy: currentUser.name,
    code: generateId(),
    equipment_id: input.equipment_id,
    location_id: input.location_id,
    repeat_count: 0,
    history: [
      {
        id: generateUniqueId('h'),
        timestamp: now,
        user: 'Anonimas',
        actionType: 'CREATED_VIA_QR'
      }
    ],
    source: 'QR'
  };

  return {
    success: true,
    message: "Pranešimas sėkmingai užregistruotas.",
    newTask
  };
}

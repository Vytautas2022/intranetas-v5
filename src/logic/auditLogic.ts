import { AuditLogEntry, ActionType, auditLogs } from '../mock-db/auditLogs';
import { currentUser } from '../mock-db/currentUser';

export const createAuditLogEntry = (params: {
  moduleId: string;
  moduleName: string;
  entityType: string;
  entityId: string;
  entityTitle: string;
  actionType: ActionType;
  fieldName?: string;
  oldValue?: any;
  newValue?: any;
  changeDescription: string;
  locationLabel: string;
  canRestore?: boolean;
  snapshotBefore?: any;
  snapshotAfter?: any;
}) => {
  const newEntry: AuditLogEntry = {
    id: Math.random().toString(36).substring(2, 9),
    ...params,
    userId: currentUser.id,
    userName: currentUser.name,
    userRole: currentUser.role,
    timestamp: new Date().toISOString(),
    canRestore: params.canRestore ?? false,
  };

  auditLogs.unshift(newEntry);
  return newEntry;
};

export const getAuditLogs = () => {
  return auditLogs;
};

export const filterAuditLogs = (filters: {
  moduleId?: string;
  userId?: string;
  actionType?: string;
  dateFrom?: string;
  dateTo?: string;
}) => {
  return auditLogs.filter(log => {
    if (filters.moduleId && log.moduleId !== filters.moduleId) return false;
    if (filters.userId && log.userId !== filters.userId) return false;
    if (filters.actionType && log.actionType !== filters.actionType) return false;
    if (filters.dateFrom && new Date(log.timestamp) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(log.timestamp) > new Date(filters.dateTo)) return false;
    return true;
  });
};

export const restoreFromAuditLog = (logEntryId: string, databases: Record<string, any[]>) => {
  const log = auditLogs.find(l => l.id === logEntryId);
  if (!log || !log.canRestore) return { success: false, message: "Šio veiksmo atkurti negalima." };

  const db = databases[log.moduleId];
  if (!db) return { success: false, message: "Modulis nerastas." };

  const entityIndex = db.findIndex(e => e.id === log.entityId);
  if (entityIndex === -1) return { success: false, message: "Objektas nebeegzistuoja." };

  const entity = db[entityIndex];
  const oldValue = log.oldValue;
  const fieldName = log.fieldName;

  if (fieldName) {
    // Single field restore
    entity[fieldName] = oldValue;
  } else if (log.snapshotBefore) {
    // Full snapshot restore
    db[entityIndex] = { ...entity, ...log.snapshotBefore };
  } else {
    return { success: false, message: "Nėra duomenų atkūrimui." };
  }

  // Create new audit log for restoration
  createAuditLogEntry({
    moduleId: log.moduleId,
    moduleName: log.moduleName,
    entityType: log.entityType,
    entityId: log.entityId,
    entityTitle: log.entityTitle,
    actionType: 'RESTORED',
    changeDescription: `Atkurta reikšmė iš įrašo ${log.id}`,
    locationLabel: log.locationLabel,
    canRestore: false
  });

  return { success: true, message: "Duomenys sėkmingai atkurti." };
};

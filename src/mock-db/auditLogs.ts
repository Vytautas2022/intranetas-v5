export type ActionType = 
  | 'CREATED' 
  | 'UPDATED' 
  | 'STATUS_CHANGED' 
  | 'DEACTIVATED' 
  | 'RESTORED' 
  | 'COMMENT_ADDED' 
  | 'COMMENT_EDITED' 
  | 'COMMENT_DELETED';

export interface AuditLogEntry {
  id: string;
  moduleId: string;
  moduleName: string;
  entityType: string;
  entityId: string;
  entityTitle: string;
  actionType: ActionType;
  userId: string;
  userName: string;
  userRole: string;
  timestamp: string;
  fieldName?: string;
  oldValue?: any;
  newValue?: any;
  changeDescription: string;
  locationLabel: string;
  canRestore: boolean;
  snapshotBefore?: any;
  snapshotAfter?: any;
}

const _seedAuditLogs: AuditLogEntry[] = [
  {
    id: "a1",
    moduleId: "periodic",
    moduleName: "Periodiniai darbai",
    entityType: "TEMPLATE",
    entityId: "pt1",
    entityTitle: "Patikrinti gesintuvus",
    actionType: "STATUS_CHANGED",
    userId: "u3",
    userName: "Admin User",
    userRole: "OPS",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    fieldName: "isActive",
    oldValue: true,
    newValue: false,
    changeDescription: "Statusas pakeistas iš Aktyvi į Neaktyvi",
    locationLabel: "Periodiniai darbai > Operacijos",
    canRestore: true,
    snapshotBefore: { isActive: true },
    snapshotAfter: { isActive: false }
  }
];

const _loadPersistedAuditLogs = (): AuditLogEntry[] => {
  if (typeof window === 'undefined') return _seedAuditLogs;
  try {
    const raw = localStorage.getItem('sg_audit_logs');
    if (raw) return JSON.parse(raw) as AuditLogEntry[];
  } catch {
    // ignore corrupt data
  }
  return _seedAuditLogs;
};

export const auditLogs: AuditLogEntry[] = _loadPersistedAuditLogs();

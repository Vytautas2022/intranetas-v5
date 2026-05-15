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

export const auditLogs: AuditLogEntry[] = [
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

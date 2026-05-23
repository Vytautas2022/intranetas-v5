import type { AuditLogEntry, ActionType } from "../mock-db/auditLogs";
import type { AuditEntry } from "../types/faults";
import type { HistoryItem } from "../types/common";

export interface AuditActor {
  id?: string;
  name: string;
  role?: string;
}

export interface AuditEventInput {
  moduleId: string;
  moduleName: string;
  entityType: string;
  entityId: string;
  entityTitle: string;
  actionType: ActionType | string;
  changeDescription: string;
  locationLabel: string;
  actor: AuditActor;
  fieldName?: string;
  oldValue?: any;
  newValue?: any;
  canRestore?: boolean;
  snapshotBefore?: any;
  snapshotAfter?: any;
}

export interface AppAuditEventInput {
  faultId: string;
  action: string;
  description: string;
  user: string;
  changes?: Record<string, { from: any; to: any }>;
  previousState?: string;
  metadata?: any;
}

export interface HistoryEventInput {
  type: string;
  from?: string | null;
  to?: string | null;
  user: string;
  meta?: Record<string, unknown>;
}

const createAuditId = (prefix = "a") =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export const createGlobalAuditEntry = (
  input: AuditEventInput,
): AuditLogEntry => ({
  id: createAuditId("audit"),
  moduleId: input.moduleId,
  moduleName: input.moduleName,
  entityType: input.entityType,
  entityId: input.entityId,
  entityTitle: input.entityTitle,
  actionType: input.actionType as ActionType,
  userId: input.actor.id || "unknown",
  userName: input.actor.name,
  userRole: input.actor.role || "UNKNOWN",
  timestamp: new Date().toISOString(),
  fieldName: input.fieldName,
  oldValue: input.oldValue,
  newValue: input.newValue,
  changeDescription: input.changeDescription,
  locationLabel: input.locationLabel,
  canRestore: input.canRestore ?? false,
  snapshotBefore: input.snapshotBefore,
  snapshotAfter: input.snapshotAfter,
});

export const createAppAuditEntry = (
  input: AppAuditEventInput,
): AuditEntry => ({
  id: createAuditId("app_audit"),
  faultId: input.faultId,
  timestamp: Date.now(),
  user: input.user,
  action: input.action,
  description: input.description,
  changes: input.changes,
  previousState: input.previousState,
  metadata: input.metadata,
});

export const createHistoryEvent = (
  input: HistoryEventInput,
): HistoryItem => ({
  id: createAuditId("history"),
  type: input.type,
  from: input.from,
  to: input.to,
  date: Date.now(),
  user: input.user,
  meta: input.meta,
});

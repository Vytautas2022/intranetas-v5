import { Fault as MockFault, FaultComment } from '../mock-db/faults';
import type { Checklist } from './checklists';

export type { FaultComment };

export enum Status {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  WAITING_DETAILS = 'waiting_details',
  FIXED = 'fixed',
  REJECTED = 'rejected',
  SOMEDAY = 'someday',
  MOVED = 'moved'
}
export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type EntityType = 'fault' | 'task' | 'project' | 'sop';

export interface FaultHistoryItem {
  id: string;
  timestamp: number;
  user: string;
  actionType: string;
  oldStatus?: string;
  newStatus?: string;
  oldSlaDeadline?: number;
  newSlaDeadline?: number;
  reason?: string;
  nextAction?: string;
}

export interface Fault extends MockFault {
  isDeleted?: boolean;
  archivedAt?: number;
  archivedBy?: string;
  archiveReason?: string;
  typeId?: string;
  orderData?: any;
  attachments?: any[];
  isWatched?: boolean;
  slaExtensionCount?: number;
  sopTitle?: string | null;
  sop?: {
    url: string;
    updatedAt: number | null;
    updatedBy: string | null;
  };
  sopStatus?: "EXISTS" | "MISSING" | "NEEDS_UPDATE";
  isRecurring?: boolean;
  createdTaskId?: string | null;
  waitingDetailsReason?: string;
  history: any[];
  created_at?: string;
  updated_at?: string;
  status_history?: any[];
  // Unified fields
  entityType: EntityType;
  phase?: 'Renkama info' | 'Planuojama' | 'Vykdoma';
  relatedFaultId?: string;
  category?: string;
  workflowTypeId?: string;
  assigned_to?: string;
  assigned_by?: string;
  assigned_at?: number;
  public_url?: string;
  assetObjectId?: string;
  report_count?: number;
  photos?: any[];
  videos?: any[];
  
  // New fields for periodic refactor (template_id/due_date removed; flat periodicXxx fields are in MockFault)
  source?: "USER" | "QR" | "PERIODIC";
  periodic_type?: "MANDATORY" | "OPTIONAL";
  region?: string;
  inspection_decision?: "NOT_CHECKED" | "OK_NO_ACTION" | "ACTION_NEEDED" | "EXECUTE" | "REJECT";
  rejection_comment?: string;
  task_description?: string;
  task_description_updated_at?: number;
  task_description_updated_by?: string;
  generatedAutomatically?: boolean;
  checklists?: Checklist[];
}

export type TaskType = "SOP_CREATE" | "SOP_UPDATE";
export type TaskStatus = "NAUJAS" | "VYKDOMA" | "ATLIKTA" | "UŽSAKYTA" | "PRISTATYTA" | "PATVIRTINTA";

export interface InventoryOrder {
  id: string;
  clubId: string;
  createdBy: string;
  createdAt: number;
  status: "NAUJAS" | "VYKDOMA" | "UŽSAKYTA" | "PRISTATYTA" | "PATVIRTINTA";
  supplierId: string;
  items: {
    productId: string;
    productName: string;
    addedQuantity: number;
    orderQuantity: number;
    targetQuantity: number;
    status: 'OK' | 'MISSING' | 'DAMAGED';
  }[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  slaDeadline: number;
  createdAt: number;
  closedAt?: number;
  relatedFaultId: string;
  clubName: string;
  priority: Priority;
  assignee: string;
  attachments: any[];
  history: any[];
  typeId?: string; // For compatibility
  // periodicXxx flat fields are inherited via the Fault base from mock-db/faults.ts
}

export interface Attachment {
  id: string;
  type: 'image' | 'video';
  url: string;
  name: string;
  size: number;
}

export interface AnalyticsData {
  typesChart: { name: string; value: number }[];
  periodData: { name: string; total: number; delayed: number; slaCompliance: number }[];
  topRecurring: { name: string; count: number }[];
  clubsChart: { name: string; value: number }[];
  stats: {
    total: number;
    delayed: number;
    recurring: number;
    mostCommon: string;
    sopCoverage: number;
    avgResolutionTime: number;
    slaCompliance: number;
    waitingDetailsMetrics: {
      moveCount: number;
      avgDays: number;
      overdueCount: number;
      repeatedCount: number;
      topReasons: { reason: string; count: number }[];
      percentage: number;
      currentCount: number;
    };
    rootCauses: {
      topSlaReasons: { reason: string; count: number }[];
    };
    sopAnalytics: {
      newSopsCreated: number;
      sopUpdateTasks: number;
      slaCompliance: number;
      overdueTasks: number;
      avgCreationTimeDays: number;
    };
  };
}

export interface AuditEntry {
  id: string;
  faultId: string;
  timestamp: number;
  user: string;
  action: string;
  description: string;
  changes?: Record<string, { from: any; to: any }>;
  previousState?: string;
  metadata?: any;
}

export interface RecurringTask {
  id: string;
  title: string;
  description: string;
  relatedFaultId: string;
  clubId: string;
  typeId: string;
  createdAt: number;
  deadline: number;
  status: Status.NEW | Status.IN_PROGRESS | Status.FIXED;
  assignee: string;
}

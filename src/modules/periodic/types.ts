
import { RecurrenceType } from "../../mock-db/periodicTemplates";

export type OccurrenceStatus = 'planned' | 'completed_on_time' | 'overdue' | 'completed_late' | 'cancelled';

export interface PeriodicOccurrence {
  occurrenceId: string;
  taskId: string;
  objectId: string; // clubId
  title: string;
  plannedDate: string; // ISO format
  plannedWeek: number;
  status: OccurrenceStatus;
  completedAt?: number;
  completedBy?: string;
  cancelledAt?: number;
  cancelledBy?: string;
  cancelReason?: string;
  isLate?: boolean;
  completedLate?: boolean;
  createdFromRecurrence: true;
}

export interface OccurrenceOverride {
  occurrenceId: string;
  taskId: string;
  plannedDate: string;
  status: OccurrenceStatus;
  completedAt?: number;
  completedBy?: string;
  cancelledAt?: number;
  cancelledBy?: string;
  cancelReason?: string;
}

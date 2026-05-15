import { BaseOperationalEntity } from './common';

/**
 * Configuration for a Kanban board status column.
 */
export interface KanbanStatusConfig {
  id: string;
  label: string;
  description?: string;
  colorToken?: "neutral" | "brand" | "red";
  isTerminal?: boolean;
}

/**
 * An entity mapped to a Kanban board, extending the base operational entity.
 */
export interface KanbanEntity extends BaseOperationalEntity {}

/**
 * Event recorded when an entity is moved between Kanban statuses.
 */
export interface KanbanMoveEvent {
  entityId: string;
  fromStatus: string;
  toStatus: string;
  movedBy: string;
  movedAt: string | number;
}

/**
 * Summary of entities grouped by status in a Kanban column.
 */
export interface KanbanColumnSummary {
  statusId: string;
  total: number;
  overdue: number;
  warning: number;
  critical: number;
  ok: number;
}

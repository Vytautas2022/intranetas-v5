import type { Checklist } from "./checklists";

/**
 * Shared types for operational entities.
 */

/**
 * Represents an attached file, link, or media.
 */
export interface Attachment {
  id: string;
  type: "image" | "video" | "file" | "link" | "pdf";
  url: string;
  name: string;
  size?: number;
  uploadedAt?: string | number;
  uploadedBy?: string;
}

/**
 * Represents a comment on an entity.
 */
export interface CommentItem {
  id: string;
  text: string;
  authorId?: string;
  authorName: string;
  createdAt: string | number;
  updatedAt?: string | number;
}

/**
 * Represents a change in history.
 */
export interface HistoryItem {
  id?: string;
  type: string;
  from?: string | null;
  to?: string | null;
  date: string | number;
  user: string;
  /** Custom metadata for the history entry. */
  meta?: Record<string, unknown>;
}

/**
 * Represents a user assigned to an entity.
 */
export interface AssignedTo {
  id: string;
  name: string;
  role: string;
}

/**
 * Common base for operational entities like faults, tasks, projects, etc.
 */
export interface BaseOperationalEntity {
  id: string;
  title: string;
  description?: string;
  clubId?: string;
  clubName?: string;
  status: string;
  priority?: string;
  assignedTo?: AssignedTo | null;
  createdAt?: string | number;
  updatedAt?: string | number;
  history?: HistoryItem[];
  comments?: CommentItem[];
  attachments?: Attachment[];
  checklists?: Checklist[];
}

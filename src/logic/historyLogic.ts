import { HistoryItem } from '../types/common';

interface EntityWithHistory {
  history?: any[];
  status_history?: any[];
  [key: string]: any;
}

/**
 * Factory function to create a standardized history item.
 */
export const createHistoryItem = (params: {
  type: string;
  from?: string | null;
  to?: string | null;
  user: string;
  meta?: Record<string, unknown>;
}): HistoryItem => {
  return {
    id: Math.random().toString(36).substring(2, 9),
    type: params.type,
    from: params.from,
    to: params.to,
    date: Date.now(),
    user: params.user,
    meta: params.meta,
  };
};

/**
 * Adds a history item to the entity, respecting existing structures.
 * Works with 'history' or 'status_history' arrays, or initializes 'history' if missing.
 */
export const addHistoryItem = (entity: EntityWithHistory, historyItem: HistoryItem) => {
  if (Array.isArray(entity.history)) {
    entity.history.push(historyItem);
  } else if (Array.isArray(entity.status_history)) {
    entity.status_history.push(historyItem);
  } else {
    entity.history = [historyItem];
  }
};

/**
 * Helper to add a status change event.
 */
export const addStatusChangeHistory = (entity: EntityWithHistory, fromStatus: string, toStatus: string, user: string) => {
  const item = createHistoryItem({
    type: 'STATUS_CHANGE',
    from: fromStatus,
    to: toStatus,
    user,
  });
  addHistoryItem(entity, item);
};

/**
 * Helper to add an assignee change event.
 */
export const addAssigneeChangeHistory = (entity: EntityWithHistory, fromUser: string, toUser: string, user: string) => {
  const item = createHistoryItem({
    type: 'ASSIGNEE_CHANGE',
    from: fromUser,
    to: toUser,
    user,
  });
  addHistoryItem(entity, item);
};

/**
 * Helper to add a comment added event.
 */
export const addCommentHistory = (entity: EntityWithHistory, commentText: string, user: string) => {
  const item = createHistoryItem({
    type: 'COMMENT_ADDED',
    meta: { comment: commentText },
    user,
  });
  addHistoryItem(entity, item);
};

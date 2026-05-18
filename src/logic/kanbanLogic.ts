import { Fault, StatusHistoryItem } from '../mock-db/faults';
import { Status } from '../types/faults';

/**
 * Creates a record of the initial status for a new fault.
 */
export function createFaultHistory(user: string): StatusHistoryItem[] {
  const now = new Date().toISOString();
  return [
    {
      from: null,
      to: Status.NEW,
      date: now,
      user: user
    }
  ];
}

/**
 * Moves a fault to a new status and records the change in history.
 * Note: Since this is MOCK DB, it modifies the fault object directly.
 */
export function moveFault(fault: Fault, newStatus: string, user: string): void {
  const now = new Date().toISOString();
  const fromStatus = fault.status;
  
  if (fromStatus === newStatus) return;

  const historyItem: StatusHistoryItem = {
    from: fromStatus,
    to: newStatus,
    date: now,
    user: user
  };

  if (!fault.status_history) {
    fault.status_history = [];
  }

  fault.status_history.push(historyItem);
  fault.status = newStatus;
  fault.updated_at = now;
  fault.updatedAt = Date.now();
  
  // Also update closedAt if status is fixed
  if (newStatus === Status.FIXED) {
    fault.closedAt = Date.now();
  }
}

import { Fault, FaultWatcher } from "../mock-db/faults";

export function setWatchMode(fault: Fault, userId: string, mode: "all" | "done_only"): void {
  const existing = fault.watchers.find(w => w.userId === userId);

  if (existing) {
    existing.mode = mode;
  } else {
    fault.watchers.push({ userId, mode });
  }
  fault.updatedAt = Date.now();
}

export function unwatchFault(fault: Fault, userId: string): void {
  const index = fault.watchers.findIndex(w => w.userId === userId);
  if (index !== -1) {
    fault.watchers.splice(index, 1);
  }
  fault.updatedAt = Date.now();
}

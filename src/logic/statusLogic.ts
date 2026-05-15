import { Fault } from "../mock-db/faults";
import { Status } from "../types/faults";
import { canClosePeriodicTask } from "./periodicActionLogic";

export function rejectFault(fault: Fault, reason: string, user: { role: string; name: string }): void {
  if (user.role !== "OPS" && user.role !== "Admin") {
    throw new Error("Tik OPS vartotojai gali atmesti gedimus");
  }

  if (!reason || reason.trim() === "") {
    throw new Error("Atmetimo priežastis yra privaloma");
  }

  // Validate periodic tasks
  const { allowed, reason: periodicReason } = canClosePeriodicTask(fault as any);
  if (!allowed) {
    throw new Error(periodicReason || "Negalima atmesti užduoties.");
  }

  fault.status = Status.REJECTED;
  fault.rejected = true;
  fault.rejectReason = reason;
  const now = Date.now();
  fault.updatedAt = now;
  fault.updatedBy = user.name;

  // Add system comment
  fault.comments.push({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
    text: "Atmesta: " + reason,
    author: user.name,
    createdAt: Date.now(),
    mentions: [],
    parentId: null,
    system: true,
    edited: false,
    history: [],
    deleted: false
  });
}

export function validateStatusChange(fault: Fault, newStatus: string): void {
  if (newStatus === Status.FIXED || newStatus === Status.REJECTED) {
     const { allowed, reason } = canClosePeriodicTask(fault as any);
     if (!allowed) {
       throw new Error(reason || "Negalima uždaryti užduoties.");
     }
  }
}

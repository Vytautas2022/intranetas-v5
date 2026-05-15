import { Fault } from "../mock-db/faults";

export interface SLAResult {
  overdue: boolean;
  text: string;
}

export function checkSLA(fault: Fault): "overdue" | "warning" | "ok" {
  const end = fault.slaDeadline || (new Date(fault.createdAt).getTime() + fault.slaHours * 3600000);
  const now = Date.now();
  
  if (now >= end) return "overdue";
  
  const total = end - fault.createdAt;
  const passed = now - fault.createdAt;
  const percent = passed / total;
  
  if (percent >= 0.8) return "warning";
  return "ok";
}

export function getRemainingTime(fault: Fault): SLAResult {
  const end = fault.slaDeadline || (new Date(fault.createdAt).getTime() + fault.slaHours * 3600000);
  const now = Date.now();
  const diff = end - now;

  if (diff <= 0) {
    return { overdue: true, text: "Vėluoja" };
  }

  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);

  return { overdue: false, text: `${h}v ${m}m` };
}

export interface SLAHeat {
  progress: number;
  color: 'ok' | 'warning' | 'critical' | 'overdue';
  badgeText: string;
}

export function getSLAHeat(fault: Fault): SLAHeat {
  const createdAt = fault.created_at ? new Date(fault.created_at).getTime() : fault.createdAt;
  const slaTotal = fault.slaHours * 3600 * 1000;
  const now = Date.now();
  const passed = now - createdAt;
  const progress = passed / slaTotal;

  let color: 'ok' | 'warning' | 'critical' | 'overdue' = 'ok';
  if (progress > 1) color = 'overdue';
  else if (progress > 0.9) color = 'critical';
  else if (progress > 0.6) color = 'warning';

  const remaining = slaTotal - passed;
  let badgeText = '';

  if (color === 'overdue') {
    const overdueMs = passed - slaTotal;
    const h = Math.floor(overdueMs / 3600000);
    const m = Math.floor((overdueMs % 3600000) / 60000);
    badgeText = h > 0 ? `+${h}h` : `+${m}m`;
  } else {
    const h = Math.floor(remaining / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000);
    if (h > 0) {
      badgeText = `${h}val liko`;
    } else {
      badgeText = `${m}min liko`;
    }
  }

  // Formatting based on user request:
  // Green -> "4h left" (4h liko)
  // Yellow -> "1.5h left"
  // Red -> "20m left"
  // Overdue -> "+2h"
  
  // Actually, I should use English/LT consistently. User requested "4h left", "1.5h left", "20m left", "+2h".
  // I will use that exact format.
  if (color === 'overdue') {
    const overdueMs = Math.abs(passed - slaTotal);
    const h = Math.floor(overdueMs / 3600000);
    const m = Math.floor((overdueMs % 3600000) / 60000);
    badgeText = h > 0 ? `+${h}h` : `+${m}m`;
  } else {
    const remainingMs = Math.abs(slaTotal - passed);
    const h = Math.floor(remainingMs / 3600000);
    const m = Math.floor((remainingMs % 3600000) / 60000);
    
    if (h >= 1) {
      const decimals = Math.floor(m / 6);
      badgeText = decimals > 0 ? `${h}.${decimals}h` : `${h}h`;
    } else {
      badgeText = `${m}m`;
    }
  }

  return { progress, color, badgeText };
}

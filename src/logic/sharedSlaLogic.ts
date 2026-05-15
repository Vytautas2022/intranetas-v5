/**
 * Shared SLA calculation helpers.
 * Defines SLA status, progress, and formatting helpers.
 */

export type SlaStatus = "ok" | "warning" | "critical" | "overdue";

/**
 * Calculates SLA progress as a ratio of elapsed time over total SLA duration.
 */
export const calculateSlaProgress = (startDate: number, slaHours: number, now: number = Date.now()): number => {
  const elapsed = now - startDate;
  const total = slaHours * 60 * 60 * 1000;
  return total > 0 ? elapsed / total : 0;
};

/**
 * Maps SLA progress ratio to a status category.
 */
export const getSlaStatus = (progress: number): SlaStatus => {
  if (progress > 1) return "overdue";
  if (progress >= 0.9) return "critical";
  if (progress >= 0.6) return "warning";
  return "ok";
};

/**
 * Formats the SLA badge text based on remaining time or overdue duration.
 */
export const formatSlaBadge = (startDate: number, slaHours: number, now: number = Date.now()): string => {
  const slaMs = slaHours * 60 * 60 * 1000;
  const deadline = startDate + slaMs;
  const diffMs = deadline - now;
  const isOverdue = diffMs < 0;

  if (isOverdue) {
    const overdueMs = Math.abs(diffMs);
    const hoursOverdue = Math.floor(overdueMs / (60 * 60 * 1000));
    const daysOverdue = Math.floor(hoursOverdue / 24);
    
    if (daysOverdue > 0) return `+${daysOverdue}d`;
    return `+${hoursOverdue}h`;
  }

  const hoursLeft = diffMs / (60 * 60 * 1000);
  if (hoursLeft >= 1) return `${Math.round(hoursLeft * 10) / 10}h`;
  return `${Math.round((diffMs / (60 * 1000)))}m`;
};

/**
 * Maps SLA status to a UI color token.
 */
export const getSlaColorToken = (status: SlaStatus): string => {
  switch (status) {
    case "ok": return "neutral";
    case "warning": return "brand";
    case "critical": return "red";
    case "overdue": return "red";
    default: return "neutral";
  }
};

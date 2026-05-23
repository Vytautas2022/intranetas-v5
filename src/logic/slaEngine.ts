export type SlaStatus = "ok" | "warning" | "critical" | "overdue";

export interface SlaEvaluationInput {
  createdAt?: number | string;
  created_at?: number | string;
  slaHours?: number;
  slaDeadline?: number;
}

export interface SlaThresholds {
  warning: number;
  critical?: number;
}

export interface SlaEvaluation {
  start: number;
  deadline: number;
  totalMs: number;
  elapsedMs: number;
  remainingMs: number;
  progress: number;
  status: SlaStatus;
  overdue: boolean;
}

const DEFAULT_SLA_HOURS = 0;
const MS_PER_HOUR = 3600000;

export const resolveSlaStart = (
  item: SlaEvaluationInput,
  options: { preferCreatedAtString?: boolean } = {},
): number => {
  const rawStart =
    options.preferCreatedAtString && item.created_at
      ? item.created_at
      : item.createdAt || item.created_at || 0;

  return typeof rawStart === "string"
    ? new Date(rawStart).getTime()
    : Number(rawStart || 0);
};

export const resolveSlaHours = (item: SlaEvaluationInput): number =>
  Number(item.slaHours || DEFAULT_SLA_HOURS);

export const getSlaDeadline = (
  item: SlaEvaluationInput,
  options: { preferCreatedAtString?: boolean } = {},
): number => {
  if (item.slaDeadline !== undefined && item.slaDeadline !== null) {
    return Number(item.slaDeadline);
  }
  return (
    resolveSlaStart(item, options) +
    resolveSlaHours(item) * MS_PER_HOUR
  );
};

export const calculateSlaProgress = (
  startDate: number,
  slaHours: number,
  now: number = Date.now(),
): number => {
  const elapsed = now - startDate;
  const total = slaHours * MS_PER_HOUR;
  return total > 0 ? elapsed / total : 0;
};

export const getSlaStatus = (
  progress: number,
  thresholds: SlaThresholds = { warning: 0.6, critical: 0.9 },
): SlaStatus => {
  if (progress > 1) return "overdue";
  if (thresholds.critical !== undefined && progress >= thresholds.critical) {
    return "critical";
  }
  if (progress >= thresholds.warning) return "warning";
  return "ok";
};

export const evaluateSla = (
  item: SlaEvaluationInput,
  options: {
    now?: number;
    thresholds?: SlaThresholds;
    preferCreatedAtString?: boolean;
    ignoreExplicitDeadline?: boolean;
  } = {},
): SlaEvaluation => {
  const now = options.now ?? Date.now();
  const start = resolveSlaStart(item, {
    preferCreatedAtString: options.preferCreatedAtString,
  });
  const configuredTotalMs = resolveSlaHours(item) * MS_PER_HOUR;
  const deadline = options.ignoreExplicitDeadline
    ? start + configuredTotalMs
    : getSlaDeadline(item, {
        preferCreatedAtString: options.preferCreatedAtString,
      });
  const totalMs = options.ignoreExplicitDeadline
    ? configuredTotalMs
    : Math.max(deadline - start, 0);
  const elapsedMs = now - start;
  const remainingMs = deadline - now;
  const progress = totalMs > 0 ? elapsedMs / totalMs : 0;

  return {
    start,
    deadline,
    totalMs,
    elapsedMs,
    remainingMs,
    progress,
    status: getSlaStatus(progress, options.thresholds),
    overdue: remainingMs <= 0,
  };
};

export const formatRemainingSlaTime = (
  remainingMs: number,
): { overdue: boolean; text: string } => {
  if (remainingMs <= 0) {
    return { overdue: true, text: "Vėluoja" };
  }

  const h = Math.floor(remainingMs / MS_PER_HOUR);
  const m = Math.floor((remainingMs % MS_PER_HOUR) / 60000);
  return { overdue: false, text: `${h}v ${m}m` };
};

export const formatCompactSlaBadge = (
  startDate: number,
  slaHours: number,
  now: number = Date.now(),
): string => {
  const deadline = startDate + slaHours * MS_PER_HOUR;
  const diffMs = deadline - now;

  if (diffMs < 0) {
    const overdueMs = Math.abs(diffMs);
    const hoursOverdue = Math.floor(overdueMs / MS_PER_HOUR);
    const daysOverdue = Math.floor(hoursOverdue / 24);

    if (daysOverdue > 0) return `+${daysOverdue}d`;
    return `+${hoursOverdue}h`;
  }

  const hoursLeft = diffMs / MS_PER_HOUR;
  if (hoursLeft >= 1) return `${Math.round(hoursLeft * 10) / 10}h`;
  return `${Math.round(diffMs / 60000)}m`;
};

export const formatHeatSlaBadge = (remainingMs: number): string => {
  if (remainingMs < 0) {
    const overdueMs = Math.abs(remainingMs);
    const h = Math.floor(overdueMs / MS_PER_HOUR);
    const m = Math.floor((overdueMs % MS_PER_HOUR) / 60000);
    return h > 0 ? `+${h}h` : `+${m}m`;
  }

  const h = Math.floor(remainingMs / MS_PER_HOUR);
  const m = Math.floor((remainingMs % MS_PER_HOUR) / 60000);

  if (h >= 1) {
    const decimals = Math.floor(m / 6);
    return decimals > 0 ? `${h}.${decimals}h` : `${h}h`;
  }

  return `${m}m`;
};

export const getSlaColorToken = (status: SlaStatus): string => {
  switch (status) {
    case "ok":
      return "neutral";
    case "warning":
      return "brand";
    case "critical":
      return "red";
    case "overdue":
      return "red";
    default:
      return "neutral";
  }
};

import { Fault } from "../mock-db/faults";
import {
  evaluateSla,
  formatHeatSlaBadge,
  formatRemainingSlaTime,
} from "./slaEngine";

export interface SLAResult {
  overdue: boolean;
  text: string;
}

export function checkSLA(fault: Fault): "overdue" | "warning" | "ok" {
  const sla = evaluateSla(fault, {
    thresholds: { warning: 0.8 },
  });

  if (sla.overdue) return "overdue";
  return sla.status === "warning" ? "warning" : "ok";
}

export function getRemainingTime(fault: Fault): SLAResult {
  const sla = evaluateSla(fault);
  return formatRemainingSlaTime(sla.remainingMs);
}

export interface SLAHeat {
  progress: number;
  color: "ok" | "warning" | "critical" | "overdue";
  badgeText: string;
}

export function getSLAHeat(fault: Fault): SLAHeat {
  const sla = evaluateSla(fault, {
    thresholds: { warning: 0.6, critical: 0.9 },
    preferCreatedAtString: true,
  });

  const color =
    sla.progress > 1
      ? "overdue"
      : sla.progress > 0.9
        ? "critical"
        : sla.progress > 0.6
          ? "warning"
          : "ok";

  return {
    progress: sla.progress,
    color,
    badgeText: formatHeatSlaBadge(sla.remainingMs),
  };
}

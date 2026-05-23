/**
 * Compatibility exports for shared SLA consumers.
 * Core SLA behavior lives in slaEngine.
 */
export type { SlaStatus } from "./slaEngine";
export {
  calculateSlaProgress,
  formatCompactSlaBadge as formatSlaBadge,
  getSlaColorToken,
  getSlaStatus,
} from "./slaEngine";

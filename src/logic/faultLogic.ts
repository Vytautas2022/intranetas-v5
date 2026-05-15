import { faultTypes, FaultTypeDefinition } from "../mock-db/faultTypes";

export function getFaultMeta(faultId: string) {
  const fault = faultTypes.find(f => f.id === faultId);
  if (!fault) return null;

  return {
    sla: fault.sla,
    priority: fault.priority,
    name: fault.name,
    sopUrl: fault.sopUrl
  };
}

export function getPriorityLabel(priority: string) {
  switch (priority) {
    case "critical": return "🔴 KRITINIS";
    case "high": return "🟠 SVARBUS";
    case "medium": return "🔵 VIDUTINIS";
    case "low": return "⚪ ŽEMAS";
    default: return priority.toUpperCase();
  }
}

export function getPriorityColor(priority: string) {
  switch (priority) {
    case "critical": return "bg-white text-slate-800 border-red-200 shadow-sm shadow-red-100";
    case "high": return "bg-white text-slate-800 border-orange-200 shadow-sm shadow-orange-100";
    case "medium": return "bg-white text-slate-800 border-blue-200 shadow-sm shadow-blue-100";
    case "low": return "bg-white text-slate-800 border-slate-200 shadow-sm";
    default: return "bg-white text-slate-600 border-slate-200";
  }
}

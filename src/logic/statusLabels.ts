const WAITING_DETAILS_VALUES = new Set([
  "Laukiama detali\u0173",
  "Laukiama detali\u00c5\u00b3",
]);

export const formatWorkflowStatusLabel = (status?: string | null): string => {
  if (!status) return "";
  if (WAITING_DETAILS_VALUES.has(status)) return "Laukiama";
  if (status === "Sutvarkyta") return "Atlikta";
  return status;
};

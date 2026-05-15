export interface PeriodicExecutionRecord {
  id: string;
  templateId: string;
  templateTitle: string;
  generatedTaskId?: string;
  clubId: string;
  clubName: string;
  scheduledDate: string | number;
  completedAt?: string | number;
  status: "SCHEDULED" | "COMPLETED" | "SKIPPED" | "RESCHEDULED" | "OVERDUE" | "ACTION_NEEDED";
  decision?: "OK_NO_ACTION" | "ACTION_NEEDED";
  decisionReason?: string;
  supplierId?: string;
  supplierName?: string;
  plannedBudget?: number;
  actualCost?: number;
  invoiceUrl?: string;
  attachments?: Array<{
    id: string;
    type: "image" | "file" | "link" | "pdf";
    url: string;
    name: string;
  }>;
  notes?: string;
  completedBy?: string;
  rescheduledFrom?: string | number;
  rescheduledTo?: string | number;
  rescheduleReason?: string;
}

export const mockPeriodicHistory: PeriodicExecutionRecord[] = [
  {
    id: "H1",
    templateId: "PT_WATER",
    templateTitle: "Vandens tyrimai",
    clubId: "SG_VYT",
    clubName: "SportGates Vytauto",
    scheduledDate: "2026-04-05",
    completedAt: "2026-04-05",
    status: "COMPLETED",
    decision: "OK_NO_ACTION",
    supplierId: "SUP_LAB",
    supplierName: "UAB Laboratorija",
    plannedBudget: 50,
    actualCost: 50,
    completedBy: "User_1"
  },
  {
    id: "H2",
    templateId: "PT_WATER",
    templateTitle: "Vandens tyrimai",
    clubId: "SG_KNS",
    clubName: "SportGates Kaunas",
    scheduledDate: "2026-04-05",
    status: "OVERDUE"
  },
  {
    id: "H3",
    templateId: "PT_WINDOWS",
    templateTitle: "Lauko langų valymas",
    clubId: "SG_VYT",
    clubName: "SportGates Vytauto",
    scheduledDate: "2026-03-15",
    completedAt: "2026-03-17",
    status: "COMPLETED",
    supplierId: "SUP_CLEAN",
    supplierName: "Clean Solutions",
    plannedBudget: 200,
    actualCost: 210,
    completedBy: "User_2"
  },
  {
    id: "H4",
    templateId: "PT_WINDOWS",
    templateTitle: "Lauko langų valymas",
    clubId: "OGM",
    clubName: "Ozas Gym",
    scheduledDate: "2026-03-16",
    status: "RESCHEDULED",
    rescheduleReason: "Blogas oras, lietus",
    rescheduledFrom: "2026-03-16",
    rescheduledTo: "2026-03-20"
  },
  {
    id: "H5",
    templateId: "PT_CEILING",
    templateTitle: "Sijų / aukštų zonų valymas",
    clubId: "SG_VYT",
    clubName: "SportGates Vytauto",
    scheduledDate: "2026-04-15",
    completedAt: "2026-04-16",
    status: "COMPLETED",
    supplierId: "SUP_CLEAN",
    supplierName: "Clean Solutions",
    plannedBudget: 150,
    actualCost: 150,
    completedBy: "User_2"
  },
  {
    id: "H6",
    templateId: "PT_FIRE",
    templateTitle: "Gesintuvų patikra",
    clubId: "SG_KNS",
    clubName: "SportGates Kaunas",
    scheduledDate: "2026-04-01",
    completedAt: "2026-04-01",
    status: "COMPLETED",
    decision: "OK_NO_ACTION",
    notes: "Visi gesintuvai tvarkingi",
    completedBy: "User_1"
  },
  {
    id: "H7",
    templateId: "PT_FIRE",
    templateTitle: "Gesintuvų patikra",
    clubId: "OGM",
    clubName: "Ozas Gym",
    scheduledDate: "2026-04-01",
    completedAt: "2026-04-02",
    status: "ACTION_NEEDED",
    decision: "ACTION_NEEDED",
    decisionReason: "Vienas gesintuvas turi pasibaigusį galiojimą",
    notes: "Užsakyta naujų gesintuvų"
  },
  {
    id: "H8",
    templateId: "PT_HVAC",
    templateTitle: "Klimato sistemos aptarnavimas",
    clubId: "SG_VYT",
    clubName: "SportGates Vytauto",
    scheduledDate: "2026-04-10",
    completedAt: "2026-04-10",
    status: "COMPLETED",
    supplierId: "SUP_HVAC",
    supplierName: "HVAC Experts",
    plannedBudget: 300,
    actualCost: 350,
    completedBy: "User_3"
  },
  {
    id: "H9",
    templateId: "PT_CLEAN_AUDIT",
    templateTitle: "Valymo kokybės auditas",
    clubId: "SG_VYT",
    clubName: "SportGates Vytauto",
    scheduledDate: "2026-04-28",
    completedAt: "2026-04-28",
    status: "COMPLETED",
    decision: "OK_NO_ACTION",
    completedBy: "User_1"
  },
  {
    id: "H10",
    templateId: "PT_CLEAN_AUDIT",
    templateTitle: "Valymo kokybės auditas",
    clubId: "OGM",
    clubName: "Ozas Gym",
    scheduledDate: "2026-04-28",
    status: "SKIPPED",
    decisionReason: "Klubas uždarytas remontui"
  },
  {
    id: "H11",
    templateId: "PT_SHOWERS",
    templateTitle: "Dušų / persirengimo patikra",
    clubId: "SG_VYT",
    clubName: "SportGates Vytauto",
    scheduledDate: "2026-05-08",
    completedAt: "2026-05-08",
    status: "COMPLETED",
    decision: "OK_NO_ACTION",
    completedBy: "User_1"
  },
  {
    id: "H12",
    templateId: "PT_SHOWERS",
    templateTitle: "Dušų / persirengimo patikra",
    clubId: "SG_KNS",
    clubName: "SportGates Kaunas",
    scheduledDate: "2026-05-08",
    status: "ACTION_NEEDED",
    decision: "ACTION_NEEDED",
    decisionReason: "Sugedęs dušas vyrų rūbinėje"
  },
  {
    id: "H13",
    templateId: "PT_TURNSTILE",
    templateTitle: "Turniketų / praėjimo sistemos patikra",
    clubId: "SG_VYT",
    clubName: "SportGates Vytauto",
    scheduledDate: "2026-05-04",
    completedAt: "2026-05-04",
    status: "COMPLETED",
    supplierId: "SUP_TECH",
    supplierName: "Tech Solutions",
    completedBy: "User_3"
  },
  {
    id: "H14",
    templateId: "PT_WATER",
    templateTitle: "Vandens tyrimai",
    clubId: "OGM",
    clubName: "Ozas Gym",
    scheduledDate: "2026-05-05",
    completedAt: "2026-05-05",
    status: "COMPLETED",
    supplierId: "SUP_LAB",
    supplierName: "UAB Laboratorija",
    plannedBudget: 50,
    actualCost: 50,
    completedBy: "User_1"
  },
  {
    id: "H15",
    templateId: "PT_WINDOWS",
    templateTitle: "Lauko langų valymas",
    clubId: "SG_KNS",
    clubName: "SportGates Kaunas",
    scheduledDate: "2026-03-30",
    completedAt: "2026-03-31",
    status: "COMPLETED",
    supplierId: "SUP_CLEAN",
    supplierName: "Clean Solutions",
    plannedBudget: 200,
    actualCost: 200,
    completedBy: "User_2"
  },
  {
    id: "H16",
    templateId: "PT_FIRE",
    templateTitle: "Gesintuvų patikra",
    clubId: "SG_VYT",
    clubName: "SportGates Vytauto",
    scheduledDate: "2026-05-01",
    completedAt: "2026-05-01",
    status: "COMPLETED",
    decision: "OK_NO_ACTION",
    completedBy: "User_1"
  },
  {
    id: "H17",
    templateId: "PT_HVAC",
    templateTitle: "Klimato sistemos aptarnavimas",
    clubId: "OGM",
    clubName: "Ozas Gym",
    scheduledDate: "2026-05-10",
    status: "SCHEDULED"
  },
  {
    id: "H18",
    templateId: "PT_CLEAN_AUDIT",
    templateTitle: "Valymo kokybės auditas",
    clubId: "SG_KNS",
    clubName: "SportGates Kaunas",
    scheduledDate: "2026-05-05",
    completedAt: "2026-05-05",
    status: "COMPLETED",
    decision: "OK_NO_ACTION",
    completedBy: "User_1"
  },
  {
    id: "H19",
    templateId: "PT_SHOWERS",
    templateTitle: "Dušų / persirengimo patikra",
    clubId: "OGM",
    clubName: "Ozas Gym",
    scheduledDate: "2026-05-08",
    completedAt: "2026-05-08",
    status: "COMPLETED",
    decision: "OK_NO_ACTION",
    completedBy: "User_1"
  },
  {
    id: "H20",
    templateId: "PT_TURNSTILE",
    templateTitle: "Turniketų / praėjimo sistemos patikra",
    clubId: "SG_KNS",
    clubName: "SportGates Kaunas",
    scheduledDate: "2026-05-04",
    status: "OVERDUE"
  }
];

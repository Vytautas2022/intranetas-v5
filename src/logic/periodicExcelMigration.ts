
import { ExcelRow, mockExcelData } from '../mock-db/periodicExcelData';
import { PeriodicTemplate, PeriodicTemplateType } from '../mock-db/periodicTemplates';
import { PeriodicExecutionRecord } from '../mock-db/periodicHistory';
import { clubs as mockClubs } from '../mock-db/clubs';

export const migrateExcelToPeriodic = () => {
  const templates: PeriodicTemplate[] = [];
  const history: PeriodicExecutionRecord[] = [];
  const processedTemplateKeys = new Set<string>();

  mockExcelData.forEach((row, rowIndex) => {
    // 1. Create Template if not already processed for this task number/name
    const templateKey = `${row.task_number}_${row.task_name}`;
    
    if (!processedTemplateKeys.has(templateKey)) {
      const template: PeriodicTemplate = {
        id: `PT_IMPORT_${row.task_number}`,
        name: row.task_name,
        title: row.task_name,
        description: `Importuotas darbas: ${row.task_name}`,
        frequency: "monthly",
        recurrence: "monthly",
        type: "MANDATORY",
        sopUrl: row.sop_link,
        sopRequired: !!row.sop_link,
        budgetRequired: false,
        isActive: true,
        targetMode: "ALL_CLUBS", // Default to all clubs for now
        targetClubIds: [],
        targetRegions: [],
        preferredSupplierIds: [],
        decisionChecklist: ["Patikrinta pagal SOP"],
        executionChecklist: ["Atlikta pagal SOP"],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        assigned_to: row.responsible === "Miglė" ? "Miglė (Vilnius)" : "Tomas (Kaunas)",
        defaultResponsibleId: row.responsible === "Miglė" ? "U2" : "U3" // Example IDs
      };
      
      templates.push(template);
      processedTemplateKeys.add(templateKey);
    }

    // 2. Map Club ID
    const normalizedRowClubName = row.club_name.toLowerCase().trim();
    const club = mockClubs.find(c => 
      c.name.toLowerCase().trim() === normalizedRowClubName ||
      c.name.toLowerCase().includes(normalizedRowClubName) ||
      normalizedRowClubName.includes(c.name.toLowerCase())
    );

    if (!club) return;

    // 3. Create Task History for existing months
    Object.entries(row.monthly_data).forEach(([monthStr, val]) => {
      if (!val) return;
      
      const month = parseInt(monthStr);
      const year = 2026; // As per Row 1 requirement
      const scheduledDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      
      const record: PeriodicExecutionRecord = {
        id: `H_IMPORT_${rowIndex}_${month}`,
        templateId: `PT_IMPORT_${row.task_number}`,
        templateTitle: row.task_name,
        clubId: club.id,
        clubName: club.name,
        scheduledDate: scheduledDate,
        status: val === "V" ? "COMPLETED" : "SCHEDULED",
        completedAt: val === "V" ? scheduledDate : undefined,
        decision: val === "V" ? "OK_NO_ACTION" : undefined,
        completedBy: val === "V" ? row.responsible : undefined
      };
      
      history.push(record);
    });
  });

  return { templates, history };
};

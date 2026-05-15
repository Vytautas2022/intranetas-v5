
import { 
  addDays, 
  addWeeks, 
  addMonths, 
  addYears, 
  isBefore, 
  isAfter, 
  startOfDay, 
  getWeek, 
  format,
  parseISO,
  isSameDay,
  endOfDay
} from "date-fns";
import { PeriodicTemplate } from "../../../mock-db/periodicTemplates";
import { PeriodicOccurrence, OccurrenceStatus } from "../types";

export const generateOccurrences = (
  templates: PeriodicTemplate[],
  rangeStart: Date,
  rangeEnd: Date,
  clubs: any[]
): PeriodicOccurrence[] => {
  const occurrences: PeriodicOccurrence[] = [];
  const today = startOfDay(new Date());

  templates.forEach((template) => {
    if (!template.isActive && !template.deactivatedAt) return;

    const startDateStr = template.startDate || format(template.createdAt as number, "yyyy-MM-dd");
    let current = parseISO(startDateStr);
    
    // Determine which clubs this template applies to
    let targetClubs = [];
    if (template.targetMode === "ALL_CLUBS") {
      targetClubs = clubs;
    } else if (template.targetMode === "SELECTED_CLUBS") {
      targetClubs = clubs.filter(c => template.targetClubIds.includes(c.id));
    } else if (template.targetMode === "REGIONS") {
      targetClubs = clubs.filter(c => template.targetRegions.includes(c.region));
    }

    targetClubs.forEach(club => {
      let runCurrent = new Date(current);
      
      // Safety break to prevent infinite loops if frequency is invalid
      let iterations = 0;
      const MAX_ITERATIONS = 500;

      while (isBefore(runCurrent, rangeEnd) && iterations < MAX_ITERATIONS) {
        iterations++;
        
        if (!isBefore(runCurrent, rangeStart)) {
          const dateKey = format(runCurrent, "yyyy-MM-dd");
          const occurrenceId = `${template.id}-${club.id}-${dateKey}`;
          
          // Check for overrides
          const override = template.occurrenceOverrides?.[occurrenceId];
          
          if (override?.status === 'cancelled') {
             occurrences.push({
               occurrenceId,
               taskId: template.id,
               objectId: club.id,
               title: template.name || template.title || "",
               plannedDate: dateKey,
               plannedWeek: getWeek(runCurrent, { weekStartsOn: 1 }),
               status: 'cancelled',
               cancelledAt: override.cancelledAt,
               cancelledBy: override.cancelledBy,
               cancelReason: override.cancelReason,
               createdFromRecurrence: true
             });
          } else {
            const completedAt = override?.completedAt;
            let status: OccurrenceStatus = 'planned';
            
            if (completedAt) {
              const completedDate = new Date(completedAt);
              if (isBefore(completedDate, endOfDay(runCurrent)) || isSameDay(completedDate, runCurrent)) {
                status = 'completed_on_time';
              } else {
                status = 'completed_late';
              }
            } else if (isBefore(runCurrent, today) && !isSameDay(runCurrent, today)) {
              status = 'overdue';
            }

            occurrences.push({
              occurrenceId,
              taskId: template.id,
              objectId: club.id,
              title: template.name || template.title || "",
              plannedDate: dateKey,
              plannedWeek: getWeek(runCurrent, { weekStartsOn: 1 }),
              status,
              completedAt,
              completedBy: override?.completedBy,
              createdFromRecurrence: true
            });
          }
        }

        // Advance based on frequency
        const freq = (template.frequency || template.recurrence || "monthly").toLowerCase();
        if (freq === "daily") runCurrent = addDays(runCurrent, 1);
        else if (freq === "weekly") runCurrent = addWeeks(runCurrent, 1);
        else if (freq === "monthly") runCurrent = addMonths(runCurrent, 1);
        else if (freq === "quarterly") runCurrent = addMonths(runCurrent, 3);
        else if (freq === "6_months") runCurrent = addMonths(runCurrent, 6);
        else if (freq === "yearly") runCurrent = addYears(runCurrent, 1);
        else break; // Fallback for custom or unknown
      }
    });
  });

  return occurrences;
};

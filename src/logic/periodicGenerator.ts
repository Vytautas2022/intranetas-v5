import { PeriodicTaskTemplate, PeriodicTaskInstance } from '../mock-db/periodicTasks';
import { Club } from '../mock-db/clubs';
import { format } from 'date-fns';
import {
  adaptPeriodicInstanceToPeriodicTaskInstance,
  adaptPeriodicTaskTemplateToPeriodicTemplate,
  createPeriodicInstanceFromTemplate,
} from '../mock-db/periodicInstances';

export const generatePeriodicKanbanCards = (
  templates: PeriodicTaskTemplate[],
  existingInstances: PeriodicTaskInstance[],
  clubs: Club[],
  currentDate: Date
): PeriodicTaskInstance[] => {
  const newInstances: PeriodicTaskInstance[] = [];
  const currentPeriodKey = format(currentDate, 'yyyy-MM');

  templates.forEach(template => {
    if (template.schedule && template.schedule.includes(currentPeriodKey)) {
      clubs.forEach(club => {
        // Idempotency: Check if already exists
        const exists = existingInstances.some(
          i => i.templateId === template.id && i.clubId === club.id && i.metadata?.periodKey === currentPeriodKey
        );
        if (!exists) {
          const canonicalTemplate =
            adaptPeriodicTaskTemplateToPeriodicTemplate(template);
          const canonicalInstance = createPeriodicInstanceFromTemplate({
            template: canonicalTemplate,
            club,
            dueAt: currentDate.getTime(),
          });
          const legacyInstance =
            adaptPeriodicInstanceToPeriodicTaskInstance(canonicalInstance);

          newInstances.push({
            ...legacyInstance,
            id: `periodic-${template.id}-${club.id}-${currentPeriodKey}`,
            clubName: club.name,
            metadata: { periodKey: currentPeriodKey },
          });
        }
      });
    }
  });

  return [...existingInstances, ...newInstances];
};

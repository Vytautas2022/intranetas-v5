import { PeriodicTaskTemplate, PeriodicTaskInstance } from '../mock-db/periodicTasks';
import { Club } from '../mock-db/clubs';
import { format } from 'date-fns';

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
          newInstances.push({
            id: `periodic-${template.id}-${club.id}-${currentPeriodKey}`,
            templateId: template.id,
            sourceType: 'PERIODIC',
            title: template.title,
            description: template.description,
            status: 'PENDING',
            dueDate: currentDate.getTime(),
            clubId: club.id,
            clubName: club.name,
            comments: [],
            history: [{ type: 'PERIODIC_INSTANCE_CREATED', user: 'system', date: Date.now(), meta: { templateId: template.id, clubId: club.id } }],
            updatedAt: Date.now(),
            updatedBy: 'system',
            metadata: { periodKey: currentPeriodKey }
          });
        }
      });
    }
  });

  return [...existingInstances, ...newInstances];
};

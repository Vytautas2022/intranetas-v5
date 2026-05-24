import { PeriodicTemplate } from '../mock-db/periodicTemplates';
import { PeriodicExecutionRecord } from '../mock-db/periodicHistory';
import { Fault, Task, Status } from '../types/faults';
import { Club } from '../mock-db/clubs';
import { User } from '../mock-db/users';
import { workflowTypes as defaultWorkflowTypes } from '../mock-db/workflowTypes';
import {
  resolvePeriodicDestinationWorkflowTypeId,
  type ResolvePeriodicDestinationWorkflowContext,
} from './appWorkflowHelpers';

/**
 * PRODUCTION NOTE:
 * This logic currently runs on the client/context to simulate task generation.
 * In production, this should be moved to a server-side CRON job or cloud function.
 */

export const getNextRunDate = (template: PeriodicTemplate, fromDate: Date = new Date()): Date => {
  const nextDate = new Date(fromDate);
  
  // Rule: Monthly tasks always fallback to the 1st of the month if configured
  if (template.recurrence === 'monthly' || template.frequency === 'monthly') {
    nextDate.setMonth(nextDate.getMonth() + 1);
    nextDate.setDate(1); // CRITICAL RULE: Monthly task -> 1st day of month
    return nextDate;
  }

  const freq = template.frequency || template.recurrence;
  switch (freq) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      nextDate.setDate(1); // Standard for quarterly as well
      break;
    case 'custom_days':
      // @ts-ignore
      nextDate.setDate(nextDate.getDate() + (template.customIntervalDays || 1));
      break;
    default:
      nextDate.setMonth(nextDate.getMonth() + 1);
      nextDate.setDate(1);
  }
  return nextDate;
};

export const shouldGeneratePeriodicTask = (
  template: PeriodicTemplate,
  existingCards: (Fault | Task)[],
  history: PeriodicExecutionRecord[],
  clubId: string,
  now: Date = new Date()
): boolean => {
  // Check if there is already an active generated card for this template in this club for this specific period
  const startOfCurrentPeriod = new Date(now);
  if (template.frequency === 'monthly' || template.recurrence === 'monthly') {
    startOfCurrentPeriod.setDate(1);
    startOfCurrentPeriod.setHours(0, 0, 0, 0);
  }

  const hasCardForThisPeriod = existingCards.some(
    (card: any) =>
      (card.template_id === template.id || card.periodic?.templateId === template.id) &&
      (card.source === 'PERIODIC' || card.periodic?.isPeriodic) &&
      (card.clubId === clubId) &&
      (new Date(card.due_date || card.periodic?.dueDate).getMonth() === startOfCurrentPeriod.getMonth()) &&
      (new Date(card.due_date || card.periodic?.dueDate).getFullYear() === startOfCurrentPeriod.getFullYear())
  );

  if (hasCardForThisPeriod) return false;

  // For monthly tasks, we assume we should generate one if it's missing for the current month
  if (template.frequency === 'monthly' || template.recurrence === 'monthly') {
    return true;
  }

  // Check last execution for other frequencies
  const lastExecution = history
    .filter(h => h.templateId === template.id && h.clubId === clubId)
    .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())[0];

  if (!lastExecution) return true;

  const lastDate = new Date(lastExecution.scheduledDate);
  const nextRun = getNextRunDate(template, lastDate);

  return now >= nextRun;
};

export const createPeriodicTaskCard = (
  template: PeriodicTemplate,
  club: Club,
  responsibleUser: User,
  now: Date = new Date(),
  workflowContext?: ResolvePeriodicDestinationWorkflowContext
): Fault | Task => {
  const dueDate = new Date(now);
  if (template.frequency === 'monthly' || template.recurrence === 'monthly') {
    dueDate.setDate(1); // 1st day of month
    dueDate.setHours(23, 59, 59, 999);
  }
  const workflowResolution = resolvePeriodicDestinationWorkflowTypeId(template, {
    workflowTypes: workflowContext?.workflowTypes || defaultWorkflowTypes,
    fallbackLegacyCategory: workflowContext?.fallbackLegacyCategory || 'OTHER',
  });

  // Assuming Fault/Task interface structure - adjusting for required fields
  return {
    id: `GEN_${template.id}_${club.id}_${dueDate.getFullYear()}_${dueDate.getMonth()}`,
    title: template.name || template.title,
    description: template.description,
    status: Status.NEW,
    createdAt: now.getTime(),
    updatedAt: now.getTime(),
    clubId: club.id,
    clubName: club.name,
    region: club.region,
    assigned_to: responsibleUser.name,
    assigned_by: 'System',
    assigned_at: now.getTime(),
    source: 'PERIODIC',
    label: 'Periodinis',
    periodic_type: template.type,
    template_id: template.id,
    due_date: dueDate.getTime(),
    type: 'PERIODIC',
    category: 'PERIODIC',
    workflowTypeId: workflowResolution.workflowTypeId,
    periodic: {
      isPeriodic: true,
      templateId: template.id,
      templateTitle: template.name || template.title,
      taskType: template.type,
      dueDate: dueDate.getTime(),
      generatedFromTemplate: true,
      inspectionDecision: 'NOT_CHECKED',
      rescheduleCount: 0
    },
    attachments: [],
    history: [{
      id: `H_GEN_${Date.now()}`,
      timestamp: now.getTime(),
      action: 'GENERATED_FROM_TEMPLATE',
      authorName: 'System'
    }]
  } as any;
};

export const generatePeriodicTasks = (
  templates: PeriodicTemplate[],
  clubs: Club[],
  users: User[],
  existingCards: (Fault | Task)[],
  history: PeriodicExecutionRecord[],
  now: Date = new Date(),
  workflowContext?: ResolvePeriodicDestinationWorkflowContext
): (Fault | Task)[] => {
  const newCards: (Fault | Task)[] = [];

  templates.filter(t => t.isActive).forEach(template => {
    let targetClubs: Club[] = [];
    if (template.targetMode === 'ALL_CLUBS') {
      targetClubs = clubs;
    } else if (template.targetMode === 'SELECTED_CLUBS' && template.targetClubIds?.length > 0) {
      targetClubs = clubs.filter(c => template.targetClubIds.includes(c.id));
    } else if (template.targetMode === 'REGIONS' && template.targetRegions?.length > 0) {
      targetClubs = clubs.filter(c => template.targetRegions.includes(c.region || ''));
    } else {
      // Default: If no mode matched or no specific clubs/regions, assume ALL_CLUBS
      targetClubs = clubs;
    }

    targetClubs.forEach(club => {
      if (shouldGeneratePeriodicTask(template, existingCards, history, club.id, now)) {
        // Resolve responsible user
        let user: User | undefined;
        
        // REGIONAL ASSIGNMENT RULE: Vilnius -> Miglė, Kaunas -> Tomas
        const regionalResponsible = club.region === 'Vilnius' ? 'Miglė' : 
                                  club.region === 'Kaunas' ? 'Tomas' : null;

        if (template.responsibleMode === 'CLUB_COORDINATOR') {
          user = users.find(u => u.role === 'COORDINATOR' && u.assigned_clubs?.includes(club.id)) || users[0];
        } else if (template.responsibleMode === 'OPS') {
          user = users.find(u => u.role === 'OPS' || u.name === regionalResponsible) || users[0];
        } else {
          // Check if template has specific assignment
          const templateAssigned = template.assigned_to;
          user = users.find(u => u.id === template.defaultResponsibleId || u.name === templateAssigned || u.name === regionalResponsible) || users[0];
        }
        
        if (user) {
          newCards.push(createPeriodicTaskCard(template, club, user, now, workflowContext));
        }
      }
    });
  });

  return newCards;
};

export const markPeriodicOverdue = (
  cards: (Fault | Task)[],
  now: Date = new Date()
): any[] => {
  return cards.map(card => {
    if (card.periodic?.isPeriodic && card.status !== 'CLOSED') {
      const dueDate = new Date(card.periodic.dueDate as number);
      if (now > dueDate) {
        return {
          ...card,
          status: 'OVERDUE'
        };
      }
    }
    return card;
  });
};

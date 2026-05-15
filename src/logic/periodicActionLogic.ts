import { Fault, Task } from '../types/faults';
import { User } from '../mock-db/users';

export const reschedulePeriodicTask = (
  card: Fault | Task,
  newDate: number,
  reason: string,
  user: User
): Fault | Task => {
  if (!card.periodic?.isPeriodic) return card;

  const oldDate = card.periodic.dueDate;
  
  return {
    ...card,
    periodic: {
      ...card.periodic,
      dueDate: newDate,
      rescheduleCount: (card.periodic.rescheduleCount || 0) + 1,
    },
    history: [
      ...card.history,
      {
        id: `H_RESCH_${Date.now()}`,
        timestamp: Date.now(),
        action: 'PERIODIC_RESCHEDULED',
        authorName: user.name,
        meta: {
          from: oldDate,
          to: newDate,
          reason
        }
      }
    ]
  };
};

export const setInspectionDecision = (
  card: Fault | Task,
  decision: "OK_NO_ACTION" | "ACTION_NEEDED",
  reason: string | undefined,
  user: User
): Fault | Task => {
  if (!card.periodic?.isPeriodic || card.periodic.taskType !== 'INSPECTION') return card;

  return {
    ...card,
    periodic: {
      ...card.periodic,
      inspectionDecision: decision,
    },
    history: [
      ...card.history,
      {
        id: `H_DEC_${Date.now()}`,
        timestamp: Date.now(),
        action: 'PERIODIC_DECISION_SET',
        authorName: user.name,
        meta: {
          decision,
          reason
        }
      }
    ]
  };
};

export const canClosePeriodicTask = (card: Fault | Task): { allowed: boolean; reason?: string } => {
  if (!card.periodic?.isPeriodic) return { allowed: true };

  // Inspection check
  if (card.periodic.taskType === 'INSPECTION') {
    if (!card.periodic.inspectionDecision || card.periodic.inspectionDecision === 'NOT_CHECKED') {
      return { allowed: false, reason: 'Būtina priimti sprendimą dėl patikros.' };
    }
  }

  return { allowed: true };
};

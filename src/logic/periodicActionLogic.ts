import { Fault, Task } from '../types/faults';
import { User } from '../mock-db/users';

// After Fault.periodic was flattened, Fault uses flat periodicXxx fields + source==='PERIODIC'.
// Task objects don't carry periodicXxx fields — only Fault does.
const isPeriodic = (card: Fault | Task): boolean =>
  (card as Fault).source === 'PERIODIC' || !!(card as any).periodicTemplateId;

const getPeriodicDueDate = (card: Fault | Task): number | undefined =>
  (card as Fault).periodicDueDate;

const getInspectionDecision = (card: Fault | Task): string | undefined =>
  (card as Fault).periodicInspectionDecision;

export const reschedulePeriodicTask = (
  card: Fault | Task,
  newDate: number,
  reason: string,
  user: User
): Fault | Task => {
  if (!isPeriodic(card)) return card;

  const oldDate = getPeriodicDueDate(card);

  return {
    ...card,
    periodicDueDate: newDate,
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
  } as unknown as Fault | Task;
};

export const setInspectionDecision = (
  card: Fault | Task,
  decision: "OK_NO_ACTION" | "ACTION_NEEDED",
  reason: string | undefined,
  user: User
): Fault | Task => {
  if (!isPeriodic(card)) return card;

  return {
    ...card,
    periodicInspectionDecision: decision,
    inspection_decision: decision,
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
  } as unknown as Fault | Task;
};

export const canClosePeriodicTask = (card: Fault | Task): { allowed: boolean; reason?: string } => {
  if (!isPeriodic(card)) return { allowed: true };

  const decision = getInspectionDecision(card);
  const periodicType = (card as Fault).periodicType ?? (card as any).periodic_type;
  const isInspection = periodicType === 'OPTIONAL';

  if (isInspection && (!decision || decision === 'NOT_CHECKED')) {
    return { allowed: false, reason: 'Būtina priimti sprendimą dėl patikros.' };
  }

  return { allowed: true };
};

import { Checklist, ChecklistTemplate, WorkflowCardWithChecklists } from "../types/checklists";

export const MAX_CHECKLISTS_PER_CARD = 5;

const newId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const nowIso = () => new Date().toISOString();

const normalizeTitle = (title: string) => title.trim() || "Naujas checklist";
const normalizeText = (text: string) => text.trim();

const addChecklistHistory = <T extends WorkflowCardWithChecklists>(
  card: T,
  user: string | undefined,
  actionType: string,
  reason: string,
): T => {
  const entry = {
    id: newId("h-checklist"),
    timestamp: Date.now(),
    date: nowIso(),
    user: user || "Sistema",
    actionType,
    type: actionType,
    reason,
  };

  return {
    ...card,
    history: [entry, ...(card.history || [])],
    updatedAt: Date.now(),
    updatedBy: user || card.updatedBy,
  };
};

const updateChecklistCollection = <T extends WorkflowCardWithChecklists>(
  card: T,
  cardId: string,
  updater: (checklists: Checklist[], timestamp: string) => Checklist[],
): T => {
  if (card.id !== cardId) return card;
  return {
    ...card,
    checklists: updater([...(card.checklists || [])], nowIso()),
    updatedAt: Date.now(),
  };
};

export const getChecklistProgress = (checklist: Checklist) => {
  const completed = checklist.items.filter((item) => item.completed).length;
  return { completed, total: checklist.items.length };
};

export const createChecklist = <T extends WorkflowCardWithChecklists>(
  card: T,
  cardId: string,
  title: string,
  user?: string,
): T => {
  const current = card.checklists || [];
  if (card.id !== cardId || current.length >= MAX_CHECKLISTS_PER_CARD) return card;

  const timestamp = nowIso();
  const updated = {
    ...card,
    checklists: [
      ...current,
      {
        id: newId("chk"),
        title: normalizeTitle(title),
        items: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    updatedAt: Date.now(),
    updatedBy: user || card.updatedBy,
  };

  return addChecklistHistory(updated, user, "CHECKLIST_ADDED", "Checklist added");
};

export const updateChecklistTitle = <T extends WorkflowCardWithChecklists>(
  card: T,
  cardId: string,
  checklistId: string,
  title: string,
  user?: string,
): T => {
  const updated = updateChecklistCollection(card, cardId, (checklists, timestamp) =>
    checklists.map((checklist) =>
      checklist.id === checklistId
        ? { ...checklist, title: normalizeTitle(title), updatedAt: timestamp }
        : checklist,
    ),
  );
  return addChecklistHistory(updated, user, "CHECKLIST_RENAMED", "Checklist renamed");
};

export const deleteChecklist = <T extends WorkflowCardWithChecklists>(
  card: T,
  cardId: string,
  checklistId: string,
  user?: string,
): T => {
  const updated = updateChecklistCollection(card, cardId, (checklists) =>
    checklists.filter((checklist) => checklist.id !== checklistId),
  );
  return addChecklistHistory(updated, user, "CHECKLIST_DELETED", "Checklist deleted");
};

export const addChecklistItem = <T extends WorkflowCardWithChecklists>(
  card: T,
  cardId: string,
  checklistId: string,
  text: string,
  user?: string,
): T => {
  const cleanText = normalizeText(text);
  if (!cleanText) return card;

  const updated = updateChecklistCollection(card, cardId, (checklists, timestamp) =>
    checklists.map((checklist) =>
      checklist.id === checklistId
        ? {
            ...checklist,
            items: [
              ...checklist.items,
              {
                id: newId("chk-item"),
                text: cleanText,
                completed: false,
                createdAt: timestamp,
                updatedAt: timestamp,
              },
            ],
            updatedAt: timestamp,
          }
        : checklist,
    ),
  );
  return addChecklistHistory(updated, user, "CHECKLIST_ITEM_ADDED", "Checklist item added");
};

export const updateChecklistItem = <T extends WorkflowCardWithChecklists>(
  card: T,
  cardId: string,
  checklistId: string,
  itemId: string,
  text: string,
  user?: string,
): T => {
  const cleanText = normalizeText(text);
  if (!cleanText) return card;

  const updated = updateChecklistCollection(card, cardId, (checklists, timestamp) =>
    checklists.map((checklist) =>
      checklist.id === checklistId
        ? {
            ...checklist,
            items: checklist.items.map((item) =>
              item.id === itemId ? { ...item, text: cleanText, updatedAt: timestamp } : item,
            ),
            updatedAt: timestamp,
          }
        : checklist,
    ),
  );
  return addChecklistHistory(updated, user, "CHECKLIST_ITEM_EDITED", "Checklist item edited");
};

export const toggleChecklistItem = <T extends WorkflowCardWithChecklists>(
  card: T,
  cardId: string,
  checklistId: string,
  itemId: string,
  completed: boolean,
  user?: string,
): T => {
  const updated = updateChecklistCollection(card, cardId, (checklists, timestamp) =>
    checklists.map((checklist) =>
      checklist.id === checklistId
        ? {
            ...checklist,
            items: checklist.items.map((item) =>
              item.id === itemId
                ? {
                    ...item,
                    completed,
                    completedAt: completed ? timestamp : undefined,
                    completedBy: completed ? user : undefined,
                    updatedAt: timestamp,
                  }
                : item,
            ),
            updatedAt: timestamp,
          }
        : checklist,
    ),
  );
  return addChecklistHistory(
    updated,
    user,
    completed ? "CHECKLIST_ITEM_COMPLETED" : "CHECKLIST_ITEM_UNCOMPLETED",
    completed ? "Checklist item completed" : "Checklist item uncompleted",
  );
};

export const deleteChecklistItem = <T extends WorkflowCardWithChecklists>(
  card: T,
  cardId: string,
  checklistId: string,
  itemId: string,
  user?: string,
): T => {
  const updated = updateChecklistCollection(card, cardId, (checklists, timestamp) =>
    checklists.map((checklist) =>
      checklist.id === checklistId
        ? {
            ...checklist,
            items: checklist.items.filter((item) => item.id !== itemId),
            updatedAt: timestamp,
          }
        : checklist,
    ),
  );
  return addChecklistHistory(updated, user, "CHECKLIST_ITEM_DELETED", "Checklist item deleted");
};

export const cloneChecklistTemplatesForGeneratedCard = (
  template?: { checklistTemplates?: ChecklistTemplate[]; decisionChecklist?: string[]; executionChecklist?: string[] },
): Checklist[] => {
  const timestamp = nowIso();
  const explicitTemplates = template?.checklistTemplates || [];
  const fallbackTemplates: ChecklistTemplate[] = [];

  if (!explicitTemplates.length && template?.decisionChecklist?.length) {
    fallbackTemplates.push({
      id: "decision-checklist-template",
      title: "Sprendimo checklist",
      items: template.decisionChecklist,
    });
  }

  if (!explicitTemplates.length && template?.executionChecklist?.length) {
    fallbackTemplates.push({
      id: "execution-checklist-template",
      title: "Vykdymo checklist",
      items: template.executionChecklist,
    });
  }

  return [...explicitTemplates, ...fallbackTemplates]
    .slice(0, MAX_CHECKLISTS_PER_CARD)
    .map((checklistTemplate, checklistIndex) => ({
      id: newId(`chk-${checklistIndex + 1}`),
      title: normalizeTitle(checklistTemplate.title),
      createdAt: timestamp,
      updatedAt: timestamp,
      items: checklistTemplate.items.map((itemText, itemIndex) => ({
        id: newId(`chk-item-${checklistIndex + 1}-${itemIndex + 1}`),
        text: itemText,
        completed: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      })),
    }));
};

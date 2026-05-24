import React, { useState } from "react";
import { CheckSquare, Edit2, Plus, Trash2, X } from "lucide-react";
import { Checklist } from "../types/checklists";
import {
  MAX_CHECKLISTS_PER_CARD,
  addChecklistItem,
  createChecklist,
  deleteChecklist,
  deleteChecklistItem,
  getChecklistProgress,
  toggleChecklistItem,
  updateChecklistItem,
  updateChecklistTitle,
} from "../logic/checklistLogic";
import { cn } from "../lib/utils";

interface ChecklistSectionProps<T extends { id: string; checklists?: Checklist[]; history?: any[]; updatedAt?: string | number; updatedBy?: string }> {
  card: T;
  currentUser?: { id?: string; name?: string };
  onUpdate: (updates: Partial<T>) => void;
}

export const ChecklistSection = <T extends { id: string; checklists?: Checklist[]; history?: any[]; updatedAt?: string | number; updatedBy?: string }>({
  card,
  currentUser,
  onUpdate,
}: ChecklistSectionProps<T>) => {
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [itemInputs, setItemInputs] = useState<Record<string, string>>({});
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");
  const checklists = card.checklists || [];
  const userName = currentUser?.name || currentUser?.id || "Sistema";
  const canAddChecklist = checklists.length < MAX_CHECKLISTS_PER_CARD;

  const applyCard = (nextCard: T) => {
    onUpdate({
      checklists: nextCard.checklists,
      history: nextCard.history,
      updatedAt: nextCard.updatedAt,
      updatedBy: nextCard.updatedBy,
    } as unknown as Partial<T>);
  };

  const submitChecklist = () => {
    if (!newChecklistTitle.trim() || !canAddChecklist) return;
    applyCard(createChecklist(card, card.id, newChecklistTitle, userName));
    setNewChecklistTitle("");
  };

  const submitItem = (checklistId: string) => {
    const text = itemInputs[checklistId] || "";
    if (!text.trim()) return;
    applyCard(addChecklistItem(card, card.id, checklistId, text, userName));
    setItemInputs((prev) => ({ ...prev, [checklistId]: "" }));
  };

  return (
    <section className="space-y-3 pt-5 border-t border-slate-100/70">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.18em] flex items-center gap-2">
          <CheckSquare size={13} /> Checklistai
        </h3>
        <span className="text-[10px] font-semibold text-slate-400">
          {checklists.length} / {MAX_CHECKLISTS_PER_CARD}
        </span>
      </div>

      <div className="space-y-3">
        {checklists.map((checklist) => {
          const progress = getChecklistProgress(checklist);
          return (
            <div key={checklist.id} className="rounded-lg border border-slate-100 bg-white p-3 space-y-3 shadow-sm shadow-slate-100/60">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {editingTitleId === checklist.id ? (
                    <input
                      autoFocus
                      value={draftText}
                      onChange={(event) => setDraftText(event.target.value)}
                      onBlur={() => {
                        applyCard(updateChecklistTitle(card, card.id, checklist.id, draftText, userName));
                        setEditingTitleId(null);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          applyCard(updateChecklistTitle(card, card.id, checklist.id, draftText, userName));
                          setEditingTitleId(null);
                        }
                        if (event.key === "Escape") setEditingTitleId(null);
                      }}
                      className="w-full rounded border border-slate-200 px-2 py-1 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-lime/30"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setDraftText(checklist.title);
                        setEditingTitleId(checklist.id);
                      }}
                      className="block max-w-full truncate text-left text-sm font-bold text-slate-900 hover:text-slate-700"
                    >
                      {checklist.title}
                    </button>
                  )}
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1.5 w-24 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-brand-lime"
                        style={{ width: `${progress.total ? (progress.completed / progress.total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">
                      {progress.completed}/{progress.total} atlikta
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setDraftText(checklist.title);
                      setEditingTitleId(checklist.id);
                    }}
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                    title="Pervadinti"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCard(deleteChecklist(card, card.id, checklist.id, userName))}
                    className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600"
                    title="Istrinti"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {checklist.items.map((item) => (
                  <div key={item.id} className="flex items-start gap-2 group">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={(event) =>
                        applyCard(toggleChecklistItem(card, card.id, checklist.id, item.id, event.target.checked, userName))
                      }
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-lime focus:ring-brand-lime"
                    />
                    <div className="min-w-0 flex-1">
                      {editingItemId === item.id ? (
                        <input
                          autoFocus
                          value={draftText}
                          onChange={(event) => setDraftText(event.target.value)}
                          onBlur={() => {
                            applyCard(updateChecklistItem(card, card.id, checklist.id, item.id, draftText, userName));
                            setEditingItemId(null);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              applyCard(updateChecklistItem(card, card.id, checklist.id, item.id, draftText, userName));
                              setEditingItemId(null);
                            }
                            if (event.key === "Escape") setEditingItemId(null);
                          }}
                          className="w-full rounded border border-slate-200 px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-lime/30"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setDraftText(item.text);
                            setEditingItemId(item.id);
                          }}
                          className={cn(
                            "block w-full text-left text-xs leading-relaxed text-slate-700",
                            item.completed && "text-slate-400 line-through",
                          )}
                        >
                          {item.text}
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDraftText(item.text);
                        setEditingItemId(item.id);
                      }}
                      className="p-1 rounded text-slate-300 hover:text-slate-600 hover:bg-slate-100 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                      title="Redaguoti"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyCard(deleteChecklistItem(card, card.id, checklist.id, item.id, userName))}
                      className="p-1 rounded text-slate-300 hover:text-red-600 hover:bg-red-50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                      title="Istrinti"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={itemInputs[checklist.id] || ""}
                  onChange={(event) =>
                    setItemInputs((prev) => ({ ...prev, [checklist.id]: event.target.value }))
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") submitItem(checklist.id);
                  }}
                  placeholder="Naujas punktas..."
                  className="min-w-0 flex-1 rounded border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-lime/30"
                />
                <button
                  type="button"
                  onClick={() => submitItem(checklist.id)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
                >
                  <Plus size={13} /> Prideti
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {canAddChecklist ? (
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={newChecklistTitle}
            onChange={(event) => setNewChecklistTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submitChecklist();
            }}
            placeholder="Checklist pavadinimas..."
            className="min-w-0 flex-1 rounded-md border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-lime/30"
          />
          <button
            type="button"
            onClick={submitChecklist}
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            <Plus size={14} /> Prideti checklist
          </button>
        </div>
      ) : (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
          Pasiektas maksimalus 5 checklistu limitas.
        </p>
      )}
    </section>
  );
};

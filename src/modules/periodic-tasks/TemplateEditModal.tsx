import React, { useMemo, useState } from "react";
import { AlertCircle, ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import { PeriodicChecklistItem, PeriodicCriticality, PeriodicTemplate } from "../../mock-db/periodicTemplates";
import { clubs } from "../../mock-db/clubs";
import { workflowTypes } from "../../mock-db/workflowTypes";

interface TemplateEditModalProps {
  template: PeriodicTemplate;
  onClose: () => void;
  onSave: (template: PeriodicTemplate) => void;
}

const activeClubs = clubs.filter((club) => club.is_active !== false);

const today = new Date().toISOString().split("T")[0];

const getInitialClubIds = (template: PeriodicTemplate): string[] => {
  if (template.targetMode === "ALL_CLUBS") {
    return activeClubs.map((club) => club.id);
  }
  if (template.targetMode === "REGIONS") {
    return activeClubs
      .filter((club) => template.targetRegions?.includes(club.region || ""))
      .map((club) => club.id);
  }
  return template.targetClubIds || [];
};

const genId = () => `ci-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const TemplateEditModal: React.FC<TemplateEditModalProps> = ({
  template,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<PeriodicTemplate>({
    ...template,
    targetMode: "SELECTED_CLUBS",
    targetClubIds: getInitialClubIds(template),
    description: template.description || "",
    frequency: template.frequency || template.recurrence || "monthly",
    recurrence: template.recurrence || template.frequency || "monthly",
    destinationType: template.destinationType || "WORKFLOW_CARD",
    visibleWeeksBeforeDue: template.visibleWeeksBeforeDue ?? 4,
    requiresComment: Boolean(template.requiresComment),
    requiresPhotoProof: Boolean(template.requiresPhotoProof || template.proofRequired),
    isMandatory: template.isMandatory ?? template.type === "MANDATORY",
    startDate: template.startDate || today,
    customFrequencyValue: template.customFrequencyValue ?? 7,
    customFrequencyUnit: template.customFrequencyUnit ?? "days",
    criticality: template.criticality,
    executionChecklistItems: template.executionChecklistItems ?? [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const enabledWorkflows = useMemo(
    () =>
      workflowTypes
        .filter((wf) => wf.enabled !== false && wf.active !== false)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  const isCustomFrequency = formData.frequency === "custom_frequency";

  const toggleClub = (clubId: string) => {
    setFormData((cur) => {
      const sel = new Set(cur.targetClubIds || []);
      if (sel.has(clubId)) sel.delete(clubId);
      else sel.add(clubId);
      return { ...cur, targetMode: "SELECTED_CLUBS", targetClubIds: Array.from(sel), targetRegions: [] };
    });
  };

  // ── Checklist helpers ────────────────────────────────────────────────────

  const checklist = formData.executionChecklistItems ?? [];

  const addChecklistItem = () => {
    if (checklist.length >= 5) return;
    const item: PeriodicChecklistItem = {
      id: genId(),
      order: checklist.length + 1,
      text: "",
      required: true,
    };
    setFormData((cur) => ({
      ...cur,
      executionChecklistItems: [...(cur.executionChecklistItems ?? []), item],
    }));
  };

  const removeChecklistItem = (id: string) => {
    setFormData((cur) => {
      const next = (cur.executionChecklistItems ?? [])
        .filter((i) => i.id !== id)
        .map((i, idx) => ({ ...i, order: idx + 1 }));
      return { ...cur, executionChecklistItems: next };
    });
  };

  const updateChecklistItem = (id: string, patch: Partial<PeriodicChecklistItem>) => {
    setFormData((cur) => ({
      ...cur,
      executionChecklistItems: (cur.executionChecklistItems ?? []).map((i) =>
        i.id === id ? { ...i, ...patch } : i,
      ),
    }));
  };

  const moveChecklistItem = (id: string, dir: -1 | 1) => {
    setFormData((cur) => {
      const items = [...(cur.executionChecklistItems ?? [])];
      const idx = items.findIndex((i) => i.id === id);
      const target = idx + dir;
      if (target < 0 || target >= items.length) return cur;
      [items[idx], items[target]] = [items[target], items[idx]];
      return { ...cur, executionChecklistItems: items.map((i, n) => ({ ...i, order: n + 1 })) };
    });
  };

  // ── Validation ───────────────────────────────────────────────────────────

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.destinationWorkflowTypeId) e.workflow = "Workflow privalomas";
    if (!(formData.name || formData.title)?.trim()) e.name = "Pavadinimas privalomas";
    if (!formData.targetClubIds?.length) e.clubs = "Pasirinkite bent vieną padalinį";
    if (!formData.frequency) e.frequency = "Periodiškumas privalomas";
    if (isCustomFrequency && (!formData.customFrequencyValue || formData.customFrequencyValue < 1)) {
      e.customFreq = "Įveskite teigiamą skaičių";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const selectedWorkflow = workflowTypes.find((wf) => wf.id === formData.destinationWorkflowTypeId);

    onSave({
      ...formData,
      name: formData.name || formData.title || "",
      title: formData.name || formData.title || "",
      description: formData.description || "",
      frequency: formData.frequency,
      recurrence: formData.frequency,
      destinationType: selectedWorkflow?.action === "order" ? "ORDER" : "WORKFLOW_CARD",
      targetMode: "SELECTED_CLUBS",
      targetRegions: [],
      visibleWeeksBeforeDue: Math.max(0, formData.visibleWeeksBeforeDue ?? 0),
      requiresComment: Boolean(formData.requiresComment),
      requiresPhotoProof: Boolean(formData.requiresPhotoProof),
      isMandatory: Boolean(formData.isMandatory),
      type: formData.isMandatory ? "MANDATORY" : "OPTIONAL",
      isActive: formData.isActive !== false,
      startDate: formData.startDate || today,
      customFrequencyValue: isCustomFrequency ? (formData.customFrequencyValue ?? 7) : undefined,
      customFrequencyUnit: isCustomFrequency ? (formData.customFrequencyUnit ?? "days") : undefined,
      criticality: formData.criticality,
      executionChecklistItems: (formData.executionChecklistItems ?? []).filter((i) => i.text.trim()),
      updatedAt: Date.now(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex justify-between items-center p-5 border-b border-slate-200">
          <h2 className="text-lg font-black text-slate-900">Periodinis šablonas</h2>
          <button onClick={onClose} className="p-2 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* WORKFLOW */}
          <FieldError error={errors.workflow}>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Workflow</label>
            <select
              className={`w-full p-2 border rounded-md text-sm ${errors.workflow ? "border-red-500" : "border-slate-200"}`}
              value={formData.destinationWorkflowTypeId || ""}
              onChange={(e) => setFormData((cur) => ({ ...cur, destinationWorkflowTypeId: e.target.value || undefined }))}
            >
              <option value="">Pasirinkite workflow</option>
              {enabledWorkflows.map((wf) => (
                <option key={wf.id} value={wf.id}>{wf.name}</option>
              ))}
            </select>
          </FieldError>

          {/* PAVADINIMAS */}
          <FieldError error={errors.name}>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pavadinimas</label>
            <input
              className={`w-full p-2 border rounded-md text-sm ${errors.name ? "border-red-500" : "border-slate-200"}`}
              value={formData.name || formData.title || ""}
              onChange={(e) => setFormData((cur) => ({ ...cur, name: e.target.value, title: e.target.value }))}
            />
          </FieldError>

          {/* PADALINIAI */}
          <FieldError error={errors.clubs}>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-500 uppercase">Padaliniai</label>
              <span className="text-xs font-semibold text-slate-400">{formData.targetClubIds?.length || 0} pasirinkta</span>
            </div>
            <div className={`max-h-56 overflow-y-auto border rounded-md divide-y divide-slate-100 ${errors.clubs ? "border-red-500" : "border-slate-200"}`}>
              {activeClubs.map((club) => (
                <label key={club.id} className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300"
                    checked={formData.targetClubIds?.includes(club.id) || false}
                    onChange={() => toggleClub(club.id)}
                  />
                  <span className="font-semibold text-slate-800">{club.name}</span>
                  <span className="ml-auto text-xs text-slate-400">{club.region}</span>
                </label>
              ))}
            </div>
          </FieldError>

          {/* PERIODIŠKUMAS */}
          <FieldError error={errors.frequency}>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Periodiškumas</label>
            <select
              className={`w-full p-2 border rounded-md text-sm ${errors.frequency ? "border-red-500" : "border-slate-200"}`}
              value={formData.frequency || "monthly"}
              onChange={(e) =>
                setFormData((cur) => ({
                  ...cur,
                  frequency: e.target.value as PeriodicTemplate["frequency"],
                  recurrence: e.target.value as PeriodicTemplate["frequency"],
                }))
              }
            >
              <option value="daily">Kasdien</option>
              <option value="weekly">Kas savaitę</option>
              <option value="monthly">Kas mėnesį</option>
              <option value="quarterly">Kas ketvirtį</option>
              <option value="6_months">Kas 6 mėn.</option>
              <option value="yearly">Kas metus</option>
              <option value="custom_frequency">Pasirinkti dažnumą...</option>
            </select>
            {!isCustomFrequency && (
              <p className="mt-1 text-xs text-slate-500">
                Kita užduotis sukuriama tik tada, kai paskutinė užduotis pažymima kaip Atlikta.
              </p>
            )}
          </FieldError>

          {/* PRADŽIOS DATA — FEATURE 1 */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pradžios data</label>
            <input
              type="date"
              className="w-full p-2 border border-slate-200 rounded-md text-sm"
              value={formData.startDate || today}
              onChange={(e) => setFormData((cur) => ({ ...cur, startDate: e.target.value }))}
            />
            <p className="mt-1 text-xs text-slate-500">Pirmoji instancija generuojama nuo šios datos.</p>
          </div>

          {/* PASIRINKTI DAŽNUMĄ — FEATURE 2, conditional */}
          {isCustomFrequency && (
            <FieldError error={errors.customFreq}>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dažnumas</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  max={365}
                  className={`w-24 p-2 border rounded-md text-sm ${errors.customFreq ? "border-red-500" : "border-slate-200"}`}
                  value={formData.customFrequencyValue ?? 7}
                  onChange={(e) =>
                    setFormData((cur) => ({
                      ...cur,
                      customFrequencyValue: Math.max(1, Math.min(365, Number(e.target.value) || 1)),
                    }))
                  }
                />
                <select
                  className="flex-1 p-2 border border-slate-200 rounded-md text-sm"
                  value={formData.customFrequencyUnit ?? "days"}
                  onChange={(e) =>
                    setFormData((cur) => ({
                      ...cur,
                      customFrequencyUnit: e.target.value as "days" | "weeks" | "months",
                    }))
                  }
                >
                  <option value="days">Dienų</option>
                  <option value="weeks">Savaičių</option>
                  <option value="months">Mėnesių</option>
                </select>
              </div>
            </FieldError>
          )}

          {/* KIEK SAVAIČIŲ PRIEŠ RODYTI */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Kiek savaičių prieš rodyti
            </label>
            <input
              type="number"
              min={0}
              className="w-full p-2 border border-slate-200 rounded-md text-sm"
              value={formData.visibleWeeksBeforeDue ?? 4}
              onChange={(e) =>
                setFormData((cur) => ({
                  ...cur,
                  visibleWeeksBeforeDue: Math.max(0, Number(e.target.value) || 0),
                }))
              }
            />
          </div>

          {/* KRITIŠKUMAS */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kritiškumas</label>
            <select
              className="w-full p-2 border border-slate-200 rounded-md text-sm"
              value={formData.criticality ?? ""}
              onChange={(e) =>
                setFormData((cur) => ({
                  ...cur,
                  criticality: (e.target.value as PeriodicCriticality) || undefined,
                }))
              }
            >
              <option value="">Automatiškai (pagal privalomumą)</option>
              <option value="CRITICAL">Kritinis</option>
              <option value="IMPORTANT">Svarbus</option>
              <option value="STANDARD">Standartinis</option>
            </select>
          </div>

          {/* PRIVALOMA / REIKIA KOMENTARO / REIKIA FOTO */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <ToggleField
              label="Privaloma"
              checked={formData.isMandatory ?? formData.type === "MANDATORY"}
              onChange={(checked) =>
                setFormData((cur) => ({
                  ...cur,
                  isMandatory: checked,
                  type: checked ? "MANDATORY" : "OPTIONAL",
                }))
              }
            />
            <ToggleField
              label="Reikia komentaro"
              checked={Boolean(formData.requiresComment)}
              onChange={(checked) => setFormData((cur) => ({ ...cur, requiresComment: checked }))}
            />
            <ToggleField
              label="Reikia foto"
              checked={Boolean(formData.requiresPhotoProof)}
              onChange={(checked) =>
                setFormData((cur) => ({ ...cur, requiresPhotoProof: checked, proofRequired: checked }))
              }
            />
          </div>

          {/* SOP NUORODA */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">SOP nuoroda</label>
            <input
              className="w-full p-2 border border-slate-200 rounded-md text-sm"
              value={formData.sopUrl || ""}
              onChange={(e) =>
                setFormData((cur) => ({
                  ...cur,
                  sopUrl: e.target.value,
                  sopRequired: Boolean(e.target.value),
                }))
              }
              placeholder="https://..."
            />
          </div>

          {/* VYKDYMO KONTROLINIS SĄRAŠAS — FEATURE 3 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-500 uppercase">
                Vykdymo kontrolinis sąrašas
              </label>
              <span className="text-xs text-slate-400">{checklist.length}/5</span>
            </div>

            {checklist.length > 0 && (
              <div className="space-y-2 mb-2">
                {checklist.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2 bg-slate-50 rounded-lg p-2">
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveChecklistItem(item.id, -1)}
                        className="p-0.5 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === checklist.length - 1}
                        onClick={() => moveChecklistItem(item.id, 1)}
                        className="p-0.5 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20"
                      >
                        <ArrowDown size={12} />
                      </button>
                    </div>

                    <span className="text-[10px] font-black text-slate-400 w-4 shrink-0">{item.order}.</span>

                    <input
                      className="flex-1 bg-white border border-slate-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-300"
                      placeholder="Žingsnio aprašymas..."
                      value={item.text}
                      onChange={(e) => updateChecklistItem(item.id, { text: e.target.value })}
                    />

                    <label className="flex items-center gap-1 text-[10px] font-bold text-slate-500 shrink-0 cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-3 w-3 rounded border-slate-300"
                        checked={item.required}
                        onChange={(e) => updateChecklistItem(item.id, { required: e.target.checked })}
                      />
                      Priv.
                    </label>

                    <button
                      type="button"
                      onClick={() => removeChecklistItem(item.id)}
                      className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={addChecklistItem}
              disabled={checklist.length >= 5}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed px-2 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
            >
              <Plus size={13} />
              Pridėti žingsnį
            </button>
          </div>

          {/* STATUSAS */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Statusas</label>
            <select
              className="w-full p-2 border border-slate-200 rounded-md text-sm"
              value={formData.isActive === false ? "inactive" : "active"}
              onChange={(e) => setFormData((cur) => ({ ...cur, isActive: e.target.value === "active" }))}
            >
              <option value="active">Aktyvi</option>
              <option value="inactive">Neaktyvi</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-5 border-t border-slate-200">
          <button onClick={onClose} className="px-5 py-2 text-sm font-bold text-slate-600 hover:text-slate-900">
            Atšaukti
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-slate-900 text-white rounded-md text-sm font-black hover:bg-slate-800"
          >
            Išsaugoti
          </button>
        </div>
      </div>
    </div>
  );
};

const FieldError = ({
  children,
  error,
}: {
  children: React.ReactNode;
  error?: string;
}) => (
  <div>
    {children}
    {error && (
      <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-600">
        <AlertCircle size={12} />
        {error}
      </div>
    )}
  </div>
);

const ToggleField = ({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) => (
  <label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 cursor-pointer hover:bg-slate-50">
    <input
      type="checkbox"
      className="h-4 w-4 rounded border-slate-300"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
    {label}
  </label>
);

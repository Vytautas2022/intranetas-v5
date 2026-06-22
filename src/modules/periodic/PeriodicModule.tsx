import React, { useEffect, useState } from "react";
import { Calendar, History, ListChecks, Plus } from "lucide-react";
import { PeriodicCalendarView } from "./PeriodicCalendarView";
import { PeriodicHistoryView } from "./PeriodicHistoryView";
import { PeriodicLatestTasksView } from "./PeriodicLatestTasksView";
import { cn } from "../../lib/utils";
import { PeriodicTemplate } from "../../mock-db/periodicTemplates";
import { TemplateEditModal } from "../periodic-tasks/TemplateEditModal";
import type { WorkflowType } from "../../mock-db/workflowTypes";

type VisiblePeriodicTab = "calendar" | "latest" | "history";
type PeriodicTab =
  | VisiblePeriodicTab
  | "worklist"
  | "templates"
  | "analytics"
  | "dashboard";

interface PeriodicModuleProps {
  faults: any[];
  history: any[];
  templates: any[];
  clubs: any[];
  workflowTypes?: WorkflowType[];
  activeTab?: PeriodicTab;
  onTabChange?: (tab: PeriodicTab) => void;
  onOpenCard?: (id: string) => void;
  canManageTemplates?: boolean;
  onTemplatesChange?: (templates: any[]) => void;
}


export const PeriodicModule: React.FC<PeriodicModuleProps> = ({
  faults,
  history,
  templates,
  clubs,
  workflowTypes = [],
  activeTab: externalActiveTab,
  onTabChange,
  onOpenCard,
  canManageTemplates = true,
  onTemplatesChange,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<VisiblePeriodicTab>("calendar");
  const [editingTemplate, setEditingTemplate] = useState<PeriodicTemplate | null>(null);
  const [localTemplates, setLocalTemplates] = useState(templates);

  useEffect(() => {
    setLocalTemplates(templates);
  }, [templates]);

  const requestedActiveTab = externalActiveTab || internalActiveTab;
  const activeTab: VisiblePeriodicTab =
    requestedActiveTab === "latest" ||
    requestedActiveTab === "history" ||
    requestedActiveTab === "calendar"
      ? requestedActiveTab
      : "calendar";
  const setActiveTab = onTabChange || setInternalActiveTab;

  const tabs = [
    { id: "calendar" as const, label: "Kalendorius", icon: Calendar },
    { id: "latest" as const, label: "Naujausios užduotys", icon: ListChecks },
    { id: "history" as const, label: "Istorija", icon: History },
  ];

  const handleCreateTemplate = () => {
    const newId = `PT-${Math.floor(100 + Math.random() * 900)}`;
    setEditingTemplate({
      id: newId,
      name: "",
      title: "",
      description: "",
      frequency: "monthly",
      recurrence: "monthly",
      type: "MANDATORY",
      destinationType: "WORKFLOW_CARD",
      assignmentStrategy: "MANUAL_UNASSIGNED",
      assignmentSource: "MANUAL_UNASSIGNED",
      visibleWeeksBeforeDue: 4,
      requiresComment: false,
      requiresPhotoProof: false,
      isMandatory: true,
      targetMode: "SELECTED_CLUBS",
      targetClubIds: [],
      targetRegions: [],
      isActive: true,
      sopRequired: false,
      budgetRequired: false,
      decisionChecklist: [],
      executionChecklist: [],
      preferredSupplierIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as PeriodicTemplate);
  };

  const handleSaveTemplate = (updatedTemplate: PeriodicTemplate) => {
    const next = localTemplates.some((template) => template.id === updatedTemplate.id)
      ? localTemplates.map((template) =>
          template.id === updatedTemplate.id ? updatedTemplate : template,
        )
      : [...localTemplates, updatedTemplate];

    setLocalTemplates(next);
    onTemplatesChange?.(next);
  };

  return (
    <div className="space-y-6 p-4 min-h-[300px] overflow-visible">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all",
                activeTab === tab.id
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200",
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {canManageTemplates && (
          <button
            type="button"
            onClick={handleCreateTemplate}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-95"
          >
            <Plus size={16} />
            Nauja periodinė užduotis
          </button>
        )}
      </div>

      <div>
        {activeTab === "calendar" && (
          <PeriodicCalendarView
            faults={faults}
            templates={localTemplates}
            history={history}
            clubs={clubs}
            workflowTypes={workflowTypes}
            onOpenCard={onOpenCard}
          />
        )}

        {activeTab === "latest" && (
          <PeriodicLatestTasksView
            faults={faults}
            templates={localTemplates}
            history={history}
            clubs={clubs}
            workflowTypes={workflowTypes}
            onOpenCard={onOpenCard}
          />
        )}

        {activeTab === "history" && (
          <PeriodicHistoryView
            history={history}
            faults={faults}
            templates={localTemplates}
            clubs={clubs}
            onOpenCard={onOpenCard}
            onOpenTemplate={canManageTemplates ? setEditingTemplate : undefined}
          />
        )}
      </div>

      {editingTemplate && (
        <TemplateEditModal
          template={editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onSave={handleSaveTemplate}
          workflowTypes={workflowTypes}
          clubs={clubs}
        />
      )}
    </div>
  );
};

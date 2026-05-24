import React, { useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { WorkflowType } from "../mock-db/workflowTypes";
import { cn } from "../lib/utils";

interface WorkflowSelectorProps {
  workflows: WorkflowType[];
  selectedWorkflowTypeIds: string[];
  onChange: (workflowTypeIds: string[]) => void;
}

const sortWorkflows = (workflows: WorkflowType[]) =>
  [...workflows].sort(
    (a, b) =>
      (a.order ?? Number.MAX_SAFE_INTEGER) -
        (b.order ?? Number.MAX_SAFE_INTEGER) ||
      (a.name || a.label || "").localeCompare(b.name || b.label || ""),
  );

export const WorkflowSelector: React.FC<WorkflowSelectorProps> = ({
  workflows,
  selectedWorkflowTypeIds,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const selectedLabel = useMemo(() => {
    if (selectedWorkflowTypeIds.length === 0) return "Visi workflow";
    if (selectedWorkflowTypeIds.length === workflows.length) return "Visi workflow";
    if (selectedWorkflowTypeIds.length === 1) {
      const selectedWorkflow = workflows.find(
        (workflow) => workflow.id === selectedWorkflowTypeIds[0],
      );
      return selectedWorkflow?.name || selectedWorkflow?.label || "Visi workflow";
    }
    return `${selectedWorkflowTypeIds.length} workflow`;
  }, [selectedWorkflowTypeIds, workflows]);

  const closeDropdown = () => {
    setIsOpen(false);
    setQuery("");
  };

  React.useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeDropdown();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [selectedWorkflowTypeIds]);

  const filteredWorkflows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return sortWorkflows(
      workflows.filter((workflow) => {
        const name = workflow.name || workflow.label || "";
        return normalizedQuery ? name.toLowerCase().includes(normalizedQuery) : true;
      }),
    );
  }, [query, workflows]);

  const toggleWorkflow = (workflowId: string) => {
    const next = selectedWorkflowTypeIds.includes(workflowId)
      ? selectedWorkflowTypeIds.filter((id) => id !== workflowId)
      : [...selectedWorkflowTypeIds, workflowId];
    onChange(next.length === workflows.length ? [] : next);
  };

  if (!workflows.length) {
    return (
      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-400">
        <span>Nėra workflow</span>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative z-[120]">
      <button
        type="button"
        onClick={() => {
          if (isOpen) {
            closeDropdown();
          } else {
            setIsOpen(true);
          }
        }}
        className="flex max-w-[220px] sm:max-w-[260px] items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown size={14} className="text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-[min(360px,calc(100vw-24px))] rounded-2xl border border-slate-100 bg-white shadow-2xl z-[130] p-2">
          <div className="relative mb-3">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ieškoti workflow..."
              className="w-full rounded-xl border border-slate-100 bg-slate-50 py-2 pl-9 pr-3 text-xs font-medium outline-none focus:ring-2 focus:ring-brand-lime/30"
            />
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1 pb-2">
            <button
              type="button"
              onClick={() => onChange([])}
              className={cn(
                "w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2",
                selectedWorkflowTypeIds.length === 0
                  ? "bg-brand-lime text-black"
                  : "text-slate-700 hover:bg-slate-50",
              )}
            >
              <input
                type="checkbox"
                readOnly
                checked={selectedWorkflowTypeIds.length === 0}
                className="h-3.5 w-3.5 rounded border-slate-300"
              />
              <span>Visi workflow</span>
            </button>

            {filteredWorkflows.length > 0 ? (
              filteredWorkflows.map((workflow) => (
                <button
                  key={workflow.id}
                  type="button"
                  onClick={() => toggleWorkflow(workflow.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2",
                    selectedWorkflowTypeIds.includes(workflow.id)
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-700 hover:bg-slate-50",
                  )}
                >
                  <input
                    type="checkbox"
                    readOnly
                    checked={selectedWorkflowTypeIds.includes(workflow.id)}
                    className="h-3.5 w-3.5 rounded border-slate-300"
                  />
                  <span className="block truncate">{workflow.name || workflow.label}</span>
                </button>
              ))
            ) : (
              <div className="px-3 py-5 text-center text-xs font-bold text-slate-400">
                Workflow nerasta
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

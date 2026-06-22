import React, { useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { WorkflowType } from "../mock-db/workflowTypes";
import { cn } from "../lib/utils";

interface WorkflowSelectorProps {
  workflows: WorkflowType[];
  selectedWorkflowId: string | null;
  onChange: (workflowTypeId: string | null) => void;
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
  selectedWorkflowId,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const selectedLabel = useMemo(() => {
    if (!selectedWorkflowId) return "Visi workflow";
    const selectedWorkflow = workflows.find(
      (workflow) => workflow.id === selectedWorkflowId,
    );
    return selectedWorkflow?.name || selectedWorkflow?.label || "Visi workflow";
  }, [selectedWorkflowId, workflows]);

  const sortedWorkflows = useMemo(() => sortWorkflows(workflows), [workflows]);
  const options = useMemo(
    () => [
      { id: null as string | null, label: "Visi workflow" },
      ...sortedWorkflows.map((workflow) => ({
        id: workflow.id,
        label: workflow.name || workflow.label || workflow.id,
      })),
    ],
    [sortedWorkflows],
  );

  const closeDropdown = () => {
    setIsOpen(false);
  };

  const selectWorkflow = (workflowId: string | null) => {
    onChange(workflowId);
    closeDropdown();
  };

  React.useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeDropdown();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;
    const selectedIndex = Math.max(
      0,
      options.findIndex((option) => option.id === selectedWorkflowId),
    );
    window.setTimeout(() => optionRefs.current[selectedIndex]?.focus(), 0);
  }, [isOpen, options, selectedWorkflowId]);

  const focusOption = (index: number) => {
    const nextIndex = (index + options.length) % options.length;
    optionRefs.current[nextIndex]?.focus();
  };

  const handleOptionKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
    workflowId: string | null,
  ) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeDropdown();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusOption(index + 1);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      focusOption(index - 1);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      focusOption(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      focusOption(options.length - 1);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectWorkflow(workflowId);
    }
  };

  if (!workflows.length) {
    return (
      <div className="flex min-h-10 items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-400">
        <span>Nėra workflow</span>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative z-[120] min-w-0">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            closeDropdown();
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex min-h-10 max-w-[calc(100vw-2rem)] sm:max-w-[260px] items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown size={14} className="text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <div
          className="fixed left-3 right-3 mt-2 sm:absolute sm:left-0 sm:right-auto sm:w-[min(320px,calc(100vw-24px))] rounded-2xl border border-slate-100 bg-white shadow-2xl z-[130] p-2"
          role="radiogroup"
          aria-label="Workflow filtras"
        >
          <div className="max-h-72 overflow-y-auto space-y-1">
            {options.map((option, index) => {
              const selected = selectedWorkflowId === option.id;
              return (
                <button
                  key={option.id || "all"}
                  ref={(node) => {
                    optionRefs.current[index] = node;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => selectWorkflow(option.id)}
                  onKeyDown={(event) =>
                    handleOptionKeyDown(event, index, option.id)
                  }
                  className={cn(
                    "w-full min-h-11 text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 outline-none",
                    selected
                      ? "bg-brand-lime text-black"
                      : "text-slate-700 hover:bg-slate-50 focus:bg-slate-50",
                  )}
                >
                  <span
                    className={cn(
                      "h-3.5 w-3.5 rounded-full border flex items-center justify-center shrink-0",
                      selected ? "border-black" : "border-slate-300",
                    )}
                    aria-hidden="true"
                  >
                    {selected && (
                      <span className="h-1.5 w-1.5 rounded-full bg-black" />
                    )}
                  </span>
                  <span className="block truncate">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

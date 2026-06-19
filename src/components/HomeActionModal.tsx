import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, X } from "lucide-react";
import { cn } from "../lib/utils";
import { workflowIconMap, WorkflowType } from "../mock-db/workflowTypes";
import type { AuthUser } from "../auth/types";
import {
  canCreateWorkflowCardResolver,
  canViewWorkflowResolver,
} from "../logic/permissionPreviewResolver";

interface HomeActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (workflowTypeId: string) => void;
  workflows: WorkflowType[];
  currentUser?: AuthUser;
}

const categoryLabels: Record<string, string> = {
  DARBAI: "Darbai",
  KONTROLE: "Kontrole",
  UZSAKYMAI: "Uzsakymai",
  IDEJOS: "Idejos",
};

const categoryOrder = ["DARBAI", "KONTROLE", "UZSAKYMAI", "IDEJOS"];

export const HomeActionModal: React.FC<HomeActionModalProps> = ({
  isOpen,
  onClose,
  onSelectAction,
  workflows,
  currentUser,
}) => {
  const visibleWorkflows = currentUser
    ? workflows.filter(
        (workflow) =>
          canViewWorkflowResolver(currentUser, workflow) &&
          canCreateWorkflowCardResolver(
            currentUser,
            workflow.id,
            workflow.objectType === "ORDER" ? "orders" : "darbai",
          ),
      )
    : workflows;

  const groups = categoryOrder
    .map((category) => ({
      name: categoryLabels[category] || category,
      items: visibleWorkflows.filter(
        (workflow) =>
          workflow.enabled && !workflow.archivedAt && workflow.category === category,
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Pasirinkite veiksma
                </h3>
                <p className="text-sm text-slate-400 font-medium">
                  Ka noretumete daryti?
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors"
                id="close-home-modal"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              {groups.map((group) => (
                <div key={group.name} className="space-y-3">
                  <div className="px-1">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      {group.name}
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {group.items.map((workflow, idx) => {
                      const Icon =
                        workflowIconMap[
                          workflow.icon as keyof typeof workflowIconMap
                        ] || AlertCircle;

                      return (
                        <button
                          key={`${workflow.id}-${workflow.name}`}
                          onClick={() => onSelectAction(workflow.id)}
                          className={cn(
                            "w-full p-4 rounded-2xl border border-slate-100 bg-white flex items-start gap-4 transition-all text-left",
                            "hover:shadow-lg hover:shadow-slate-100",
                            workflow.hover,
                          )}
                          id={`action-${workflow.id}-${idx}`}
                        >
                          <div
                            className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                              workflow.bg,
                            )}
                          >
                            <Icon size={24} className={workflow.color} />
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-slate-900">
                              {workflow.name}
                            </div>
                            <div className="text-xs text-slate-400 font-medium mt-0.5 leading-relaxed">
                              {workflow.description}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

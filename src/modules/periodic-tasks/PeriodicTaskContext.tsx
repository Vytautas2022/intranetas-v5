import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  PeriodicTaskTemplate,
  PeriodicTaskInstance,
  periodicTaskTemplates,
  periodicTaskInstances
} from '../../mock-db/periodicTasks';
import { clubs } from '../../mock-db/clubs';
import * as taskLogic from '../../logic/periodicTaskLogic';
import { generatePeriodicKanbanCards } from '../../logic/periodicGenerator';

interface PeriodicTaskContextType {
  templates: PeriodicTaskTemplate[];
  instances: PeriodicTaskInstance[];
  selectedInstanceId: string | null;
  setSelectedInstanceId: (id: string | null) => void;
  refreshInstances: () => void;
  startTask: (id: string, user: string) => void;
  completeTask: (id: string, data: any, user: string) => void;
  skipTask: (id: string, reason: string, user: string) => void;
  setInspectionResult: (id: string, result: string, notes: string, user: string) => void;
  markSopViewed: (id: string, user: string) => void;
  createTemplate: (template: PeriodicTaskTemplate) => void;
  updateTemplate: (id: string, updates: Partial<PeriodicTaskTemplate>) => void;
  toggleTemplateActive: (id: string) => void;
}

const PeriodicTaskContext = createContext<PeriodicTaskContextType | undefined>(undefined);

export const PeriodicTaskProvider = ({ children }: { children: ReactNode }) => {
  const [templates, setTemplates] = useState<PeriodicTaskTemplate[]>(periodicTaskTemplates);
  const [instances, setInstances] = useState<PeriodicTaskInstance[]>(periodicTaskInstances);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);

  useEffect(() => {
    refreshInstances();
  }, []);

  const refreshInstances = () => {
    setInstances(prev => {
        const instancesWithPeriodic = generatePeriodicKanbanCards(templates, prev, clubs, new Date());
        return taskLogic.refreshInstances(templates, instancesWithPeriodic, clubs);
    });
  };

  const updateInstance = (id: string, updater: (inst: PeriodicTaskInstance) => void) => {
    setInstances(prev => prev.map(inst => {
      if (inst.id === id) {
        const newInst = { ...inst };
        updater(newInst);
        return newInst;
      }
      return inst;
    }));
  };

  const startTask = (id: string, user: string) => {
    updateInstance(id, (inst) => taskLogic.startTask(inst, user));
  };

  const completeTask = (id: string, data: any, user: string) => {
    updateInstance(id, (inst) => taskLogic.completeTask(inst, data, user));
  };

  const skipTask = (id: string, reason: string, user: string) => {
    updateInstance(id, (inst) => taskLogic.skipTask(inst, reason, user));
  };

  const setInspectionResult = (id: string, result: string, notes: string, user: string) => {
    updateInstance(id, (inst) => taskLogic.setInspectionResult(inst, result, notes, user));
  };

  const markSopViewed = (id: string, user: string) => {
    updateInstance(id, (inst) => taskLogic.markSopViewed(inst, user));
  };

  const createTemplate = (template: PeriodicTaskTemplate) => {
    setTemplates(prev => [...prev, template]);
  };

  const updateTemplate = (id: string, updates: Partial<PeriodicTaskTemplate>) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const toggleTemplateActive = (id: string) => {
    // Placeholder logic for toggling, assuming active field might be added later
  };

  return (
    <PeriodicTaskContext.Provider value={{
      templates, instances, selectedInstanceId, setSelectedInstanceId,
      refreshInstances, startTask, completeTask, skipTask, setInspectionResult,
      markSopViewed, createTemplate, updateTemplate, toggleTemplateActive
    }}>
      {children}
    </PeriodicTaskContext.Provider>
  );
};

export const usePeriodicTasks = () => {
  const context = useContext(PeriodicTaskContext);
  if (!context) throw new Error('usePeriodicTasks must be used within PeriodicTaskProvider');
  return context;
};

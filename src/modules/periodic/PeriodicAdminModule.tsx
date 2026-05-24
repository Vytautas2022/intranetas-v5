import React from 'react';
import { PeriodicCalendarSubModule } from './CalendarSubModule';
import type { PeriodicTemplate } from '../../mock-db/periodicTemplates';
import {
  workflowTypes as defaultWorkflowTypes,
  type WorkflowType,
} from '../../mock-db/workflowTypes';

interface PeriodicAdminModuleProps {
  templates?: PeriodicTemplate[];
  setTemplates?: React.Dispatch<React.SetStateAction<any[]>>;
  workflowTypes?: WorkflowType[];
}

export const PeriodicAdminModule: React.FC<PeriodicAdminModuleProps> = ({
  templates,
  setTemplates,
  workflowTypes = defaultWorkflowTypes,
}) => {
  return (
    <div className="flex flex-col min-h-full md:h-full w-full">
      <div className="flex-1 md:p-4">
        <PeriodicCalendarSubModule
          templates={templates}
          setTemplates={setTemplates}
          workflowTypes={workflowTypes}
        />
      </div>
    </div>
  );
};

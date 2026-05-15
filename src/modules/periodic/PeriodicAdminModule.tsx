import React from 'react';
import { PeriodicCalendarSubModule } from './CalendarSubModule';

export const PeriodicAdminModule: React.FC = () => {
  return (
    <div className="flex flex-col min-h-full md:h-full w-full">
      <div className="flex-1 md:p-4">
        <PeriodicCalendarSubModule />
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { PeriodicTaskProvider } from './PeriodicTaskContext';
import { PeriodicTaskKanban } from './PeriodicTaskKanban';
import { PeriodicTaskTemplatesView } from './PeriodicTaskTemplatesView';
import { PeriodicTaskAnalytics } from './PeriodicTaskAnalytics';

interface Props {
  currentUser: { id: string; name: string };
  clubs: any[];
  onCreateOrder?: (taskId: string) => void;
}

export const PeriodicTaskModule: React.FC<Props> = ({ currentUser, clubs, onCreateOrder }) => {
  const [activeTab, setActiveTab] = useState<'kanban' | 'templates' | 'analytics'>('kanban');

  return (
    <PeriodicTaskProvider>
      <div className="h-full flex flex-col">
        <div className="flex border-b bg-white border-slate-200">
          <button 
            className={`px-4 py-3 text-sm font-bold border-b-2 ${activeTab === 'kanban' ? 'border-amber-500 text-slate-900' : 'border-transparent text-slate-500'}`}
            onClick={() => setActiveTab('kanban')}
          >
            Kanban
          </button>
          <button 
            className={`px-4 py-3 text-sm font-bold border-b-2 ${activeTab === 'templates' ? 'border-amber-500 text-slate-900' : 'border-transparent text-slate-500'}`}
            onClick={() => setActiveTab('templates')}
          >
            Šablonai
          </button>
          <button 
            className={`px-4 py-3 text-sm font-bold border-b-2 ${activeTab === 'analytics' ? 'border-amber-500 text-slate-900' : 'border-transparent text-slate-500'}`}
            onClick={() => setActiveTab('analytics')}
          >
            Analitika
          </button>
        </div>
        <div className="flex-1 overflow-hidden bg-white">
          {activeTab === 'kanban' && <PeriodicTaskKanban currentUser={currentUser} />}
          {activeTab === 'templates' && <PeriodicTaskTemplatesView />}
          {activeTab === 'analytics' && <PeriodicTaskAnalytics />}
        </div>
      </div>
    </PeriodicTaskProvider>
  );
};

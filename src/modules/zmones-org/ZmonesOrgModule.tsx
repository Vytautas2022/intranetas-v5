import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { ZmonesOrgProvider } from './ZmonesOrgContext';
import { ColleaguesSection } from './ColleaguesSection';
import { OfficeSection } from './OfficeSection';
import { ClubsSection } from './ClubsSection';

type TabType = 'kolegos' | 'ofisas' | 'klubai';

interface ZmonesOrgModuleProps {
  onGeneratePeriodicTasks?: (clubId: string) => void;
}

const ZmonesOrgContent: React.FC<ZmonesOrgModuleProps> = ({ onGeneratePeriodicTasks }) => {
  const [activeTab, setActiveTab] = useState<TabType>('kolegos');

  const tabs: { id: TabType; label: string }[] = [
    { id: 'kolegos', label: 'Kolegos' },
    { id: 'ofisas', label: 'Ofisas' },
    { id: 'klubai', label: 'Klubai' },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <div className="flex items-center justify-between px-8 py-5 border-b border-slate-200 bg-white shrink-0">
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Žmonės ir organizacija</h1>
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn("px-5 py-2 rounded-lg text-xs font-extrabold uppercase tracking-widest transition-all",
                activeTab === tab.id ? "bg-white text-black shadow-sm" : "text-slate-400 hover:text-slate-700")}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="h-full max-w-[1600px] mx-auto">
          {activeTab === 'kolegos' && <ColleaguesSection />}
          {activeTab === 'ofisas' && <OfficeSection />}
          {activeTab === 'klubai' && <ClubsSection onGeneratePeriodicTasks={onGeneratePeriodicTasks} />}
        </div>
      </main>
    </div>
  );
};

export const ZmonesOrgModule: React.FC<ZmonesOrgModuleProps> = ({ onGeneratePeriodicTasks }) => {
  return (
    <ZmonesOrgProvider>
      <ZmonesOrgContent onGeneratePeriodicTasks={onGeneratePeriodicTasks} />
    </ZmonesOrgProvider>
  );
};

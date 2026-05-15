import React, { useState, useMemo } from 'react';
import { Calendar, Settings, BarChart3, History } from 'lucide-react';
import { motion } from 'motion/react';
import { PeriodicCalendarView } from './PeriodicCalendarView';
import { PeriodicTemplatesView } from './PeriodicTemplatesView';
import { PeriodicAnalytics } from './PeriodicAnalytics';
import { cn } from '../../lib/utils';
import { PeriodicTemplate } from '../../mock-db/periodicTemplates';
import { TemplateEditModal } from '../periodic-tasks/TemplateEditModal';

interface PeriodicModuleProps {
  faults: any[];
  history: any[];
  templates: any[];
  clubs: any[];
  activeTab?: 'calendar' | 'templates' | 'analytics' | 'history';
  onTabChange?: (tab: 'calendar' | 'templates' | 'analytics' | 'history') => void;
  onOpenCard?: (id: string) => void;
}

export const PeriodicModule: React.FC<PeriodicModuleProps> = ({ 
    faults, history, templates, clubs, activeTab: externalActiveTab, onTabChange, onOpenCard 
}) => {
    const [internalActiveTab, setInternalActiveTab] = useState<'calendar' | 'templates' | 'analytics' | 'history'>('calendar');
    const [editingTemplate, setEditingTemplate] = useState<PeriodicTemplate | null>(null);
    const [localTemplates, setLocalTemplates] = useState(templates);
    
    // Controlled vs Uncontrolled
    const activeTab = externalActiveTab || internalActiveTab;
    const setActiveTab = onTabChange || setInternalActiveTab;

    const tabs = [
        { id: 'calendar', label: 'Darbai', icon: Calendar },
        { id: 'templates', label: 'Šablonai', icon: Settings },
        { id: 'analytics', label: 'Analitika', icon: BarChart3 },
        { id: 'history', label: 'Istorija', icon: History },
    ] as const;

    const handleCreateTemplate = () => {
        const newId = `PT-${Math.floor(100 + Math.random() * 900)}`;
        setEditingTemplate({
            id: newId,
            name: '',
            title: '',
            description: '',
            frequency: 'monthly',
            recurrence: 'monthly',
            type: 'MANDATORY',
            targetMode: 'ALL_CLUBS',
            targetClubIds: [],
            targetRegions: [],
            isActive: true,
            sopRequired: false,
            budgetRequired: false,
            decisionChecklist: [],
            executionChecklist: [],
            preferredSupplierIds: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        } as PeriodicTemplate);
    };

    const handleSaveTemplate = (updatedTemplate: PeriodicTemplate) => {
        if (localTemplates.some(t => t.id === updatedTemplate.id)) {
            setLocalTemplates(localTemplates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
        } else {
            setLocalTemplates([...localTemplates, updatedTemplate]);
        }
    };
    
    // (Part 3: Show a basic list IF templates is empty, in a controlled way)
    if (activeTab === 'templates' && (!localTemplates || localTemplates.length === 0)) {
        return <div style={{ padding: 20 }}>Nėra periodinių darbų</div>;
    }

    return (
        <div className="space-y-6 bg-red-50 p-4 min-h-[300px]">
            <div className="flex gap-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                            activeTab === tab.id
                                ? "bg-slate-900 text-white"
                                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                        )}
                    >
                        <tab.icon size={16} /> {tab.label}
                    </button>
                ))}
            </div>

            <div className="mt-6">
                {activeTab === 'calendar' && <PeriodicCalendarView faults={faults} templates={localTemplates} history={history} clubs={clubs} onOpenCard={onOpenCard} />}
                {activeTab === 'templates' && <PeriodicTemplatesView templates={localTemplates} onEditTemplate={setEditingTemplate} onCreateTemplate={handleCreateTemplate} />}
                {activeTab === 'analytics' && <PeriodicAnalytics faults={faults} history={history} templates={localTemplates} clubs={clubs} />}
                {activeTab === 'history' && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <h2 className="text-lg font-black text-slate-900 mb-6">Istorija</h2>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-slate-500 border-b border-slate-100">
                                    <th className="pb-3 px-2">Data</th>
                                    <th className="pb-3 px-2">Šablonas</th>
                                    <th className="pb-3 px-2">Klubas</th>
                                    <th className="pb-3 px-2">Statusas</th>
                                    <th className="pb-3 px-2">Kaina</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(history || []).map(h => (
                                    <tr key={h.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                        <td className="py-4 px-2">{new Date(h.scheduledDate || 0).toLocaleDateString('lt-LT')}</td>
                                        <td className="py-4 px-2 font-semibold">{h.templateTitle}</td>
                                        <td className="py-4 px-2 text-slate-600">{h.clubName}</td>
                                        <td className="py-4 px-2">
                                            <span className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase", 
                                                h.status === 'COMPLETED' ? "bg-emerald-100 text-emerald-800" :
                                                h.status === 'OVERDUE' ? "bg-red-100 text-red-700" :
                                                "bg-slate-100 text-slate-700"
                                            )}>
                                                {h.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-2 font-bold">{h.actualCost || 0} €</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {editingTemplate && (
                <TemplateEditModal 
                    template={editingTemplate} 
                    onClose={() => setEditingTemplate(null)} 
                    onSave={handleSaveTemplate}
                />
            )}
        </div>
    );
};

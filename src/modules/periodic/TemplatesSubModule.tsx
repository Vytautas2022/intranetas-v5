import React, { useState } from 'react';
import { periodicTaskTemplates as periodicTemplates } from '../../mock-db/periodicTasks';

export const PeriodicTemplatesSubModule: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredTemplates = periodicTemplates.filter(t => 
        t.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 grid gap-4">
            <div className="mb-4">
                <input 
                    type="text" 
                    placeholder="Paieška..." 
                    className="p-2 border rounded w-full md:w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
             {filteredTemplates.map((template: any) => (
                    <div
                        key={template.id}
                        className="border border-slate-200 rounded-lg p-4 shadow-sm bg-white"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <strong className="text-lg">[{template.id}] {template.title}</strong>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${template.type === 'MANDATORY' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                {template.type}
                            </span>
                        </div>
                        <div className="text-sm text-slate-600 mb-1">Dažnumas: {template.recurrence}</div>
                        <div className="text-sm text-slate-600 mb-1">Kategorija: {template.category}</div>
                        
                        <div className="mt-4 flex gap-2">
                            <button className="px-3 py-1 text-sm bg-slate-100 rounded hover:bg-slate-200">Peržiūrėti</button>
                            <button className="px-3 py-1 text-sm bg-slate-100 rounded hover:bg-slate-200">Redaguoti</button>
                        </div>
                    </div>
                ))}
        </div>
    );
};

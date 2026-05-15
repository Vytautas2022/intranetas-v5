import React from 'react';
import { usePeriodicTasks } from './PeriodicTaskContext';

export const PeriodicTaskTemplatesView: React.FC = () => {
  const { templates } = usePeriodicTasks();

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-slate-900 mb-6">Užduočių šablonai</h2>
      <table className="w-full text-sm bg-white border rounded">
        <thead>
          <tr className="border-b text-left text-slate-500">
            <th className="p-3">Pavadinimas</th>
            <th className="p-3">Tipas</th>
            <th className="p-3">Periodiškumas</th>
            <th className="p-3">Apimtis</th>
            <th className="p-3">SOP</th>
          </tr>
        </thead>
        <tbody>
          {templates.map(t => (
            <tr key={t.id} className="border-b hover:bg-slate-50">
              <td className="p-3 font-bold">{t.title}</td>
              <td className="p-3">{t.type}</td>
              <td className="p-3">{t.recurrence}</td>
              <td className="p-3">{t.scope}</td>
              <td className="p-3">{t.sopLink ? 'Taip' : 'Ne'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

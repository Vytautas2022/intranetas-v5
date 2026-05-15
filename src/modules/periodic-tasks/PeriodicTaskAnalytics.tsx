import React, { useMemo } from 'react';
import { usePeriodicTasks } from './PeriodicTaskContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * Analytics dashboard for periodic tasks.
 */
export const PeriodicTaskAnalytics: React.FC = () => {
  const { instances, templates } = usePeriodicTasks();

  const metrics = useMemo(() => {
    const total = instances.length;
    const completed = instances.filter(i => i.status === 'COMPLETED').length;
    const overdue = instances.filter(i => i.status === 'OVERDUE').length;
    const skipped = instances.filter(i => i.status === 'SKIPPED').length;
    const totalCost = instances.reduce((acc, i) => acc + (i.actualCost || 0), 0);
    const avgCost = completed > 0 ? totalCost / completed : 0;

    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    const completionByTemplate = templates.map(t => ({
      name: t.title,
      total: instances.filter(i => i.templateId === t.id && i.status === 'COMPLETED').length
    }));

    const costsByClub = Object.entries(instances.reduce((acc, i) => {
      acc[i.clubName] = (acc[i.clubName] || 0) + (i.actualCost || 0);
      return acc;
    }, {} as Record<string, number>)).map(([name, total]) => ({ name, total }));

    const overdueByCategory = Object.entries(instances.filter(i => i.status === 'OVERDUE').reduce((acc, i) => {
      const template = templates.find(t => t.id === i.templateId);
      const cat = template?.category || 'Kita';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)).map(([name, total]) => ({ name, total }));

    return { completionRate, overdue, skipped, avgCost, completionByTemplate, costsByClub, overdueByCategory };
  }, [instances, templates]);

  const cards = [
    { label: 'Įvykdymo procentas', value: `${metrics.completionRate.toFixed(0)}%` },
    { label: 'Vėluojančios užduotys', value: metrics.overdue, critical: metrics.overdue > 0 },
    { label: 'Praleistos užduotys', value: metrics.skipped },
    { label: 'Vidutinė kaina', value: `${metrics.avgCost.toFixed(0)} EUR` },
  ];

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className={`p-4 bg-white rounded-lg border shadow-sm ${c.critical ? 'border-red-200' : 'border-slate-200'}`}>
            <p className="text-xs text-slate-500 uppercase font-bold">{c.label}</p>
            <p className={`text-2xl font-bold ${c.critical ? 'text-red-600' : 'text-slate-900'}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold mb-4">Įvykdymai pagal šabloną</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.completionByTemplate}>
                <XAxis dataKey="name" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Bar dataKey="total" fill="#475569" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold mb-4">Vėluojantys pagal kategoriją</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.overdueByCategory}>
                <XAxis dataKey="name" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Bar dataKey="total" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

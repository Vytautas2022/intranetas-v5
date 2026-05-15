import React, { useMemo } from 'react';
import { useOrders } from './OrderContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getOrderCategoryLabel } from '../../logic/orderLogic';

/**
 * Analytics dashboard for orders.
 */
export const OrderAnalytics: React.FC = () => {
  const { orders } = useOrders();

  const metrics = useMemo(() => {
    const safeOrders = orders || [];
    const totalSpending = safeOrders.reduce((acc, o) => acc + (o.actualCost || o.estimatedBudget || 0), 0);
    const avgBudget = safeOrders.length > 0 ? (safeOrders.reduce((acc, o) => acc + (o.estimatedBudget || 0), 0) / safeOrders.length) : 0;
    const pendingApprovals = safeOrders.filter(o => o && o.status === 'PENDING_APPROVAL').length;
    const delayedDeliveries = safeOrders.filter(o => o && o.status === 'WAITING_DELIVERY' && (Date.now() - (o.requestedAt || 0)) > (7 * 24 * 60 * 60 * 1000)).length;

    const spendingByClub = Object.values(safeOrders.reduce((acc, o) => {
      if (o && o.clubName) {
        acc[o.clubName] = (acc[o.clubName] || 0) + (o.actualCost || o.estimatedBudget || 0);
      }
      return acc;
    }, {} as Record<string, number>)).map((total, i) => ({ 
      name: Object.keys(safeOrders.reduce((a, o) => { if(o && o.clubName) a[o.clubName] = 1; return a; }, {} as any))[i], 
      total 
    }));

    const spendingByCategory = Object.entries(safeOrders.reduce((acc, o) => {
      if (o) {
        const label = getOrderCategoryLabel(o.category);
        acc[label] = (acc[label] || 0) + (o.actualCost || o.estimatedBudget || 0);
      }
      return acc;
    }, {} as Record<string, number>)).map(([name, total]) => ({ name, total }));

    const topSuppliers = Object.entries(safeOrders.reduce((acc, o) => {
      if (o && o.items) {
        (o.items || []).forEach(item => {
          if (item && item.supplierName) {
            acc[item.supplierName] = (acc[item.supplierName] || 0) + ((item.quantity || 0) * (item.actualUnitPrice || item.unitPrice || 0));
          }
        });
      }
      return acc;
    }, {} as Record<string, number>)).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total).slice(0, 5);

    return { totalSpending, avgBudget, pendingApprovals, delayedDeliveries, spendingByClub, spendingByCategory, topSuppliers };
  }, [orders]);

  const cards = [
    { label: 'Visa išlaidos', value: `${metrics.totalSpending.toFixed(0)} EUR` },
    { label: 'Vidutinis biudžetas', value: `${metrics.avgBudget.toFixed(0)} EUR` },
    { label: 'Laukia patvirtinimo', value: metrics.pendingApprovals },
    { label: 'Vėluojantys pristatymai', value: metrics.delayedDeliveries, critical: metrics.delayedDeliveries > 0 },
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
          <h3 className="text-sm font-bold mb-4">Išlaidos pagal kategoriją</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.spendingByCategory}>
                <XAxis dataKey="name" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Bar dataKey="total" fill="#475569" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold mb-4">Top 5 Tiekėjai</h3>
          <div className="space-y-3">
            {metrics.topSuppliers.map(s => (
              <div key={s.name} className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-slate-600">{s.name}</span>
                <span className="font-bold">{s.total.toFixed(0)} EUR</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useOrders } from './OrderContext';
import { getOrderCategoryLabel, getOrderStatusLabel } from '../../logic/orderLogic';
import { OrderDetailModal } from './OrderDetailModal';
import type { AuthUser } from '../../auth/types';

interface Props {
  currentUser: Pick<AuthUser, "id" | "name" | "role" | "assignedRoleIds" | "effectiveRoles" | "effectivePermissionsPreview">;
}

export const OrderListView: React.FC<Props> = ({ currentUser }) => {
  const { orders, selectedOrderId, setSelectedOrderId } = useOrders();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredOrders = (orders || []).filter(o => {
    if (!o) return false;
    const matchesSearch = (o.code || '').toLowerCase().includes(search.toLowerCase()) || 
                          (o.items || []).some(i => i && i.productName && i.productName.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <div className="p-4 space-y-4">
        {/* ... existing filter UI ... */}
        <div className="flex gap-4">
          <input 
            placeholder="Paieška pagal kodą ar prekę..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="p-2 border rounded text-sm w-64"
          />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="p-2 border rounded text-sm">
            <option value="ALL">Visi statusai</option>
            <option value="DRAFT">Juodraštis</option>
            <option value="PENDING_APPROVAL">Laukia patvirtinimo</option>
            <option value="APPROVED">Patvirtinta</option>
            <option value="ORDERED">Užsakyta</option>
            <option value="CLOSED">Uždaryta</option>
          </select>
        </div>

        <table className="w-full text-sm bg-white border rounded">
          {/* ... existing table head ... */}
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="p-3">Kodas</th>
              <th className="p-3">Klubas</th>
              <th className="p-3">Kategorija</th>
              <th className="p-3">Statusas</th>
              <th className="p-3 text-right">Biudžetas</th>
              <th className="p-3">Autorius</th>
              <th className="p-3">Data</th>
              <th className="p-3">Veiksmai</th>
            </tr>
          </thead>
          <tbody>
            {(filteredOrders || []).map(o => (
              <tr key={o.id} className="border-b hover:bg-slate-50">
                <td className="p-3 font-bold">{o.code}</td>
                <td className="p-3">{o.clubName}</td>
                <td className="p-3">{getOrderCategoryLabel(o.category)}</td>
                <td className="p-3 text-xs font-bold">{getOrderStatusLabel(o.status)}</td>
                <td className="p-3 text-right">{o.estimatedBudget} EUR</td>
                <td className="p-3">{o.requestedBy}</td>
                <td className="p-3 text-xs">{new Date(o.requestedAt).toLocaleDateString()}</td>
                <td className="p-3">
                  <button onClick={() => setSelectedOrderId(o.id)} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded">Peržiūrėti</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedOrderId && (
        <OrderDetailModal 
          orderId={selectedOrderId} 
          onClose={() => setSelectedOrderId(null)} 
          currentUser={currentUser}
        />
      )}
    </>
  );
};

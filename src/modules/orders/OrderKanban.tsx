import React from 'react';
import { useOrders } from './OrderContext';
import { OrderCard } from './OrderCard';
import { OrderStatus } from '../../mock-db/orders';
import { OrderDetailModal } from './OrderDetailModal';
import { UserRole } from '../../types/roles';

const COLUMNS: { id: OrderStatus; label: string }[] = [
  { id: 'DRAFT', label: 'Juodraščiai' },
  { id: 'PENDING_APPROVAL', label: 'Laukia patvirtinimo' },
  { id: 'APPROVED', label: 'Patvirtinta' },
  { id: 'ORDERED', label: 'Užsakyta' },
  { id: 'WAITING_DELIVERY', label: 'Laukia pristatymo' },
  { id: 'DELIVERED', label: 'Pristatyta' },
  { id: 'DELIVERED_TO_CLUB', label: 'Klubuose' },
  { id: 'SENT_TO_ACCOUNTING', label: 'Buhalterijai' },
  { id: 'CLOSED', label: 'Uždaryti' },
];

interface Props {
  currentUser: { id: string; name: string; role: UserRole };
}

export const OrderKanban: React.FC<Props> = ({ currentUser }) => {
  const { orders, selectedOrderId, setSelectedOrderId } = useOrders();

  return (
    <>
      <div className="flex gap-4 p-4 h-full overflow-x-auto items-start">
        {COLUMNS.map(col => (
          <div key={col.id} className="w-64 flex-shrink-0">
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 px-1">
              {col.label} ({(orders || []).filter(o => o && o.status === col.id).length})
            </h3>
            <div className="space-y-3">
              {(orders || [])
                .filter(o => o && o.status === col.id)
                .map(order => (
                  <OrderCard key={order.id} order={order} onClick={() => setSelectedOrderId(order.id)} />
                ))}
            </div>
          </div>
        ))}
        
        {/* Rejected Section */}
        <div className="w-64 flex-shrink-0 mt-8">
          <h3 className="text-xs font-bold text-red-500 uppercase mb-3 px-1">Atmesta ({(orders || []).filter(o => o && o.status === 'REJECTED').length})</h3>
          <div className="space-y-3">
            {(orders || [])
              .filter(o => o && o.status === 'REJECTED')
              .map(order => (
                <OrderCard key={order.id} order={order} onClick={() => setSelectedOrderId(order.id)} />
              ))}
          </div>
        </div>
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

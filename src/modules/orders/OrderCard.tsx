import React from 'react';
import { Order } from '../../mock-db/orders';
import { getOrderCategoryLabel } from '../../logic/orderLogic';

interface OrderCardProps {
  order: Order;
  onClick: () => void;
}

/**
 * Compact order card for Kanban boards.
 */
export const OrderCard: React.FC<OrderCardProps> = ({ order, onClick }) => {
  const urgencyColor = (order.urgency === 'urgent' || order.urgency === 'critical') 
    ? 'text-red-600 border-red-200 bg-red-50' 
    : 'text-slate-600 border-slate-200 bg-slate-50';

  const daysAgo = Math.floor((Date.now() - order.requestedAt) / (1000 * 60 * 60 * 24));

  return (
    <div
      id={`order-card-${order.id}`}
      onClick={onClick}
      className={`p-3 bg-white border rounded-lg cursor-pointer transition-all hover:shadow-sm hover:border-slate-300 space-y-2 ${
        order.urgency === 'critical' ? 'border-l-4 border-l-red-500' : 'border-slate-200'
      }`}
    >
      <div className="flex justify-between items-start">
        <span className="font-bold text-sm text-slate-900">{order.code}</span>
        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${urgencyColor}`}>
          {order.urgency}
        </span>
      </div>

      <div className="text-xs text-slate-500">{order.clubName}</div>

      <div className="flex justify-between items-center text-[11px]">
        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
          {getOrderCategoryLabel(order.category)}
        </span>
        <span className="font-bold text-slate-900">
          {order.estimatedBudget} EUR
        </span>
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[10px] text-slate-400">
        <span>{order.items.length} prekės</span>
        <span>{order.requestedBy} • {daysAgo}d.</span>
      </div>
    </div>
  );
};

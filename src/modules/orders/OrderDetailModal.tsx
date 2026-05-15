import React, { useState } from 'react';
import { useOrders } from './OrderContext';
import { Order } from '../../mock-db/orders';
import { 
  getOrderCategoryLabel, 
  getOrderStatusLabel, 
  getOrderUrgencyLabel, 
  canUserApprove 
} from '../../logic/orderLogic';
import { UserRole } from '../../types/roles';

interface Props {
  orderId: string;
  onClose: () => void;
  currentUser: { id: string; name: string; role: UserRole };
}

export const OrderDetailModal: React.FC<Props> = ({ orderId, onClose, currentUser }) => {
  const { orders, approveOrder, rejectOrder, submitForApproval, advanceOrderStatus, closeOrder, addComment } = useOrders();
  const order = orders.find(o => o.id === orderId);
  const [comment, setComment] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  if (!order) return null;

  const handleAction = (action: () => void) => {
    action();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex justify-end z-50" onClick={onClose}>
      <div className="bg-white w-[600px] h-full shadow-xl p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{order.code}</h2>
            <p className="text-slate-500 text-sm">{order.clubName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">Uždaryti</button>
        </div>

        {/* Status Actions */}
        <div className="flex flex-wrap gap-2 mb-6 p-4 bg-slate-50 rounded-lg">
          {order.status === 'DRAFT' && (
            <button onClick={() => handleAction(() => submitForApproval(order.id, currentUser.name))} className="px-3 py-1 bg-slate-900 text-white text-xs font-bold rounded">Teikti tvirtinti</button>
          )}

          {order.status === 'PENDING_APPROVAL' && canUserApprove(order, currentUser.id, currentUser.role) && (
            <>
              <button onClick={() => handleAction(() => approveOrder(order.id, currentUser.id, currentUser.name))} className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded">Patvirtinti</button>
              {!showReject ? (
                <button onClick={() => setShowReject(true)} className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded">Atmesti</button>
              ) : (
                <div className="flex gap-2">
                  <input value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Priežastis" className="text-xs p-1 border rounded" />
                  <button onClick={() => handleAction(() => rejectOrder(order.id, currentUser.id, currentUser.name, rejectionReason))} className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded">Patvirtinti atmetimą</button>
                </div>
              )}
            </>
          )}

          {order.status === 'APPROVED' && <button onClick={() => handleAction(() => advanceOrderStatus(order.id, 'ORDERED', currentUser.name))} className="px-3 py-1 bg-slate-800 text-white text-xs font-bold rounded">Žymėti užsakytą</button>}
          {order.status === 'ORDERED' && <button onClick={() => handleAction(() => advanceOrderStatus(order.id, 'WAITING_DELIVERY', currentUser.name))} className="px-3 py-1 bg-slate-800 text-white text-xs font-bold rounded">Laukia pristatymo</button>}
          {order.status === 'WAITING_DELIVERY' && <button onClick={() => handleAction(() => advanceOrderStatus(order.id, 'DELIVERED', currentUser.name))} className="px-3 py-1 bg-slate-800 text-white text-xs font-bold rounded">Pristatyta</button>}
          {order.status === 'DELIVERED' && <button onClick={() => handleAction(() => advanceOrderStatus(order.id, 'DELIVERED_TO_CLUB', currentUser.name))} className="px-3 py-1 bg-slate-800 text-white text-xs font-bold rounded">Pristatyta į klubą</button>}
          {order.status === 'DELIVERED_TO_CLUB' && <button onClick={() => handleAction(() => advanceOrderStatus(order.id, 'SENT_TO_ACCOUNTING', currentUser.name))} className="px-3 py-1 bg-slate-800 text-white text-xs font-bold rounded">Siųsti į buhalteriją</button>}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div><p className="text-slate-500">Statusas</p><p className="font-bold">{getOrderStatusLabel(order.status)}</p></div>
          <div><p className="text-slate-500">Kategorija</p><p className="font-bold">{getOrderCategoryLabel(order.category)}</p></div>
          <div><p className="text-slate-500">Skubumas</p><p className="font-bold">{getOrderUrgencyLabel(order.urgency)}</p></div>
          <div><p className="text-slate-500">Biudžetas</p><p className="font-bold">{order.estimatedBudget} EUR</p></div>
        </div>

        {/* Items Table */}
        <table className="w-full text-xs mb-6">
          <thead className="text-slate-500 border-b"><tr><th className="text-left py-2">Prekė</th><th className="text-right py-2">Kiekis</th></tr></thead>
          <tbody>{order.items.map(item => <tr key={item.id} className="border-b last:border-0"><td className="py-2">{item.productName}</td><td className="text-right py-2">{item.quantity}</td></tr>)}</tbody>
        </table>
        
        {/* Comments */}
        <div className="space-y-2 mb-6">
          <p className="font-bold text-sm">Komentarai</p>
          <div className="flex gap-2">
            <input value={comment} onChange={e => setComment(e.target.value)} className="flex-1 p-2 border rounded text-xs" placeholder="Naujas komentaras..." />
            <button onClick={() => { addComment(order.id, comment, currentUser.name); setComment(''); }} className="px-3 py-1 bg-slate-900 text-white rounded text-xs">Siųsti</button>
          </div>
          {order.comments.map(c => <div key={c.id} className="p-2 bg-slate-50 rounded text-xs"><span className="font-bold">{c.authorName}:</span> {c.text}</div>)}
        </div>
      </div>
    </div>
  );
};

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Order, ordersList, priceHistoryList, OrderPriceHistoryEntry } from '../../mock-db/orders';
import * as orderLogic from '../../logic/orderLogic';
import { addCommentHistory } from '../../logic/historyLogic';
import { createAuditLogEntry } from '../../logic/auditLogic';

interface OrderContextType {
  orders: Order[];
  priceHistory: OrderPriceHistoryEntry[];
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;
  createOrder: (payload: any, user: string) => void;
  submitForApproval: (id: string, user: string) => void;
  approveOrder: (id: string, approverId: string, approverName: string, comment?: string) => void;
  rejectOrder: (id: string, approverId: string, approverName: string, reason: string) => void;
  advanceOrderStatus: (id: string, newStatus: any, user: string) => void;
  linkInvoice: (id: string, invNum: string, invUrl: string, user: string) => void;
  closeOrder: (id: string, actualCosts: number, user: string) => void;
  addComment: (id: string, text: string, user: string) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>(ordersList);
  const [priceHistory] = useState<OrderPriceHistoryEntry[]>(priceHistoryList);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const updateOrder = (id: string, updater: (order: Order) => void) => {
    setOrders(prev => prev.map(o => {
      if (o.id === id) {
        const newOrder = { ...o };
        updater(newOrder);
        return newOrder;
      }
      return o;
    }));
  };

  const createOrder = (payload: any, user: string) => {
    const newOrder = orderLogic.createOrder(payload, user);
    setOrders(prev => [newOrder, ...prev]);

    createAuditLogEntry({
      moduleId: 'orders',
      moduleName: 'Užsakymai',
      entityType: 'ORDER',
      entityId: newOrder.id,
      entityTitle: newOrder.code || `Užsakymas ${newOrder.id}`,
      actionType: 'CREATED',
      changeDescription: `Sukurtas naujas užsakymas: ${newOrder.code}`,
      locationLabel: 'Užsakymai',
      canRestore: false,
      snapshotAfter: newOrder
    });
  };

  const submitForApproval = (id: string, user: string) => {
    updateOrder(id, (order) => orderLogic.submitForApproval(order, user));
  };

  const approveOrder = (id: string, approverId: string, approverName: string, comment?: string) => {
    const oldOrder = orders.find(o => o.id === id);
    updateOrder(id, (order) => orderLogic.approveOrder(order, approverId, approverName, comment));
    
    if (oldOrder) {
      createAuditLogEntry({
        moduleId: 'orders',
        moduleName: 'Užsakymai',
        entityType: 'ORDER',
        entityId: id,
        entityTitle: oldOrder.code || `Užsakymas ${id}`,
        actionType: 'STATUS_CHANGED',
        changeDescription: `Užsakymas patvirtintas: ${approverName}${comment ? ` (${comment})` : ''}`,
        locationLabel: 'Užsakymai > Patvirtinimas',
        canRestore: true,
        oldValue: oldOrder,
        snapshotBefore: oldOrder
      });
    }
  };

  const rejectOrder = (id: string, approverId: string, approverName: string, reason: string) => {
    updateOrder(id, (order) => orderLogic.rejectOrder(order, approverId, approverName, reason));
  };

  const advanceOrderStatus = (id: string, newStatus: any, user: string) => {
    updateOrder(id, (order) => orderLogic.advanceOrderStatus(order, newStatus, user));
  };

  const linkInvoice = (id: string, invNum: string, invUrl: string, user: string) => {
    updateOrder(id, (order) => orderLogic.linkInvoice(order, invNum, invUrl, user));
  };

  const closeOrder = (id: string, actualCosts: number, user: string) => {
    updateOrder(id, (order) => orderLogic.closeOrder(order, actualCosts, user));
  };

  const addComment = (id: string, text: string, user: string) => {
    updateOrder(id, (order) => {
      order.comments.push({
        id: Math.random().toString(36).substring(2, 9),
        text,
        authorName: user,
        createdAt: Date.now()
      });
      addCommentHistory(order, text, user);
      order.updatedAt = Date.now();
      order.updatedBy = user;
    });
  };

  return (
    <OrderContext.Provider value={{ 
      orders, priceHistory, selectedOrderId, setSelectedOrderId,
      createOrder, submitForApproval, approveOrder, rejectOrder, advanceOrderStatus,
      linkInvoice, closeOrder, addComment
    }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrders must be used within OrderProvider');
  return context;
};

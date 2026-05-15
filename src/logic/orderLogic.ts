import { Order, OrderStatus, OrderUrgency, OrderCategory } from '../mock-db/orders';
import { systemSettings } from '../mock-db/settings';
import { createHistoryItem, addHistoryItem } from './historyLogic';
import { canApprove, UserRole } from '../types/roles';
import { resolveAssignee } from './assignmentLogic';

/**
 * Creates a new order in DRAFT status.
 */
export const createOrder = (payload: Partial<Order> & { clubId: string, clubName: string, category: OrderCategory, requestedBy: string }, user: string): Order => {
  const code = `ORD-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  
  const approvalRequired = systemSettings.approvalSettings.approvalRequiredCategories.includes(payload.category);

  const newOrder: Order = {
    id: Math.random().toString(36).substring(2, 9),
    code,
    ...payload,
    urgency: payload.urgency || "normal",
    status: "DRAFT",
    currency: "EUR",
    estimatedBudget: 0,
    items: payload.items || [],
    attachments: [],
    approvalChain: [],
    approvalRequired,
    requestedBy: payload.requestedBy,
    requestedAt: Date.now(),
    comments: [],
    history: [createHistoryItem({ type: "ORDER_CREATED", user, meta: { code } })],
    updatedAt: Date.now(),
    updatedBy: user,
  };
  return newOrder;
};

/**
 * Submits a draft order for approval.
 */
export const submitForApproval = (order: Order, user: string): void => {
  if (order.status !== 'DRAFT') throw new Error("Tik juodraščius galima teikti tvirtinti.");
  if (order.items.length === 0) throw new Error("Užsakyme turi būti bent viena prekė.");

  order.status = "PENDING_APPROVAL";
  order.updatedAt = Date.now();
  order.updatedBy = user;
  
  addHistoryItem(order, createHistoryItem({ type: "ORDER_SUBMITTED", user }));
};

/**
 * Approves an order.
 */
export const approveOrder = (order: Order, approverId: string, approverName: string, comment?: string): void => {
  order.status = "APPROVED";
  order.approvedAt = Date.now();
  order.updatedAt = Date.now();
  order.updatedBy = approverName;

  order.approvalChain.push({
    approverId,
    approverName,
    status: "APPROVED",
    comment,
    timestamp: Date.now()
  });

  addHistoryItem(order, createHistoryItem({ type: "ORDER_APPROVED", user: approverName, meta: { comment } }));
};

/**
 * Rejects an order.
 */
export const rejectOrder = (order: Order, approverId: string, approverName: string, reason: string): void => {
  if (!reason) throw new Error("Privaloma nurodyti atmetimo priežastį.");

  order.status = "REJECTED";
  order.updatedAt = Date.now();
  order.updatedBy = approverName;

  order.approvalChain.push({
    approverId,
    approverName,
    status: "REJECTED",
    comment: reason,
    timestamp: Date.now()
  });

  addHistoryItem(order, createHistoryItem({ type: "ORDER_REJECTED", user: approverName, meta: { reason } }));
};

/**
 * Advances order status to the next stage.
 */
export const advanceOrderStatus = (order: Order, newStatus: OrderStatus, user: string): void => {
  const oldStatus = order.status;
  order.status = newStatus;
  order.updatedAt = Date.now();
  order.updatedBy = user;

  if (newStatus === 'ORDERED') order.orderedAt = Date.now();
  if (newStatus === 'DELIVERED') order.deliveredAt = Date.now();
  if (newStatus === 'DELIVERED_TO_CLUB') order.deliveredToClubAt = Date.now();
  if (newStatus === 'SENT_TO_ACCOUNTING') order.sentToAccountingAt = Date.now();

  addHistoryItem(order, createHistoryItem({ type: "STATUS_CHANGE", from: oldStatus, to: newStatus, user }));
};

/**
 * Links an invoice to an order.
 */
export const linkInvoice = (order: Order, invoiceNumber: string, invoiceUrl: string, user: string): void => {
  order.invoiceNumber = invoiceNumber;
  order.invoiceUrl = invoiceUrl;
  order.invoiceConfirmedBy = user;
  order.updatedAt = Date.now();
  
  addHistoryItem(order, createHistoryItem({ type: "INVOICE_LINKED", user, meta: { invoiceNumber } }));
};

/**
 * Closes an order.
 */
export const closeOrder = (order: Order, actualCosts: number, user: string): void => {
  order.status = "CLOSED";
  order.actualCost = actualCosts;
  order.closedAt = Date.now();
  order.updatedAt = Date.now();
  
  addHistoryItem(order, createHistoryItem({ type: "ORDER_CLOSED", user, meta: { actualCosts } }));
};

/**
 * Calculates budget variance.
 */
export const getOrderBudgetVariance = (order: Order): number => {
  return (order.actualCost || 0) - order.estimatedBudget;
};

/**
 * Checks if the user can approve the order.
 */
export const canUserApprove = (order: Order, userId: string, userRole: UserRole): boolean => {
  if (!canApprove(userRole)) return false;
  if (order.status !== 'PENDING_APPROVAL') return false;
  
  // Prevent self-approval
  return order.requestedBy !== userId;
};

/**
 * Returns a readable label for order status.
 */
export const getOrderStatusLabel = (status: OrderStatus): string => ({
  DRAFT: "Juodraštis",
  PENDING_APPROVAL: "Laukia patvirtinimo",
  APPROVED: "Patvirtinta",
  REJECTED: "Atmesta",
  ORDERED: "Užsakyta",
  WAITING_DELIVERY: "Laukia pristatymo",
  DELIVERED: "Pristatyta",
  DELIVERED_TO_CLUB: "Pristatyta į klubą",
  SENT_TO_ACCOUNTING: "Išsiųsta į buhalteriją",
  CLOSED: "Uždaryta"
}[status]);

/**
 * Returns a readable label for order urgency.
 */
export const getOrderUrgencyLabel = (urgency: OrderUrgency): string => ({
  low: "Žema",
  normal: "Įprasta",
  urgent: "Skubi",
  critical: "Kritinė"
}[urgency]);

/**
 * Returns a readable label for order category.
 */
export const getOrderCategoryLabel = (category: OrderCategory): string => ({
  INVENTORY: "Inventorius",
  CLEANING: "Valymo priemonės",
  MAINTENANCE: "Priežiūra",
  EQUIPMENT: "Įranga",
  PRINT: "Spauda",
  VENDING: "Vendingas",
  FIRST_AID_KIT: "Vaistinėlės turinys",
  IT: "IT",
  OTHER: "Kita"
}[category]);

import { ProductTransfer } from '../mock-db/transfers';

export function calculateMissing(target: number, current: number): number {
  return Math.max(target - current, 0);
}

export interface OrderItemState {
  itemId: string;
  currentQty: number;
  missingQty: number;
  orderQty: number;
}

export interface OrderCategoryState {
  category: string;
  items: OrderItemState[];
}

export interface OrderPayload {
  clubId: string;
  type: "order";
  categories: OrderCategoryState[];
}

export interface ProductAnalytics {
  product_id: string;
  daily_usage: number;
  suggested_order_qty: number;
  days_left: number;
  reorder_flag: boolean;
  alert_level: 'none' | 'warning' | 'critical';
}

/**
 * Calculates weighted daily usage: (avg_7d * 0.7) + (avg_30d * 0.3)
 */
export function calculateDailyUsage(productId: string, transfers: ProductTransfer[], clubId?: string): number {
  const now = Date.now();
  const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
  const monthAgo = now - (30 * 24 * 60 * 60 * 1000);

  const productTransfers = transfers.filter(t => t.product_id === productId && (!clubId || t.club_id === clubId));

  const weekTransfers = productTransfers.filter(t => t.timestamp >= weekAgo);
  const monthTransfers = productTransfers.filter(t => t.timestamp >= monthAgo);

  const sum7d = weekTransfers.reduce((acc, t) => acc + t.quantity, 0);
  const sum30d = monthTransfers.reduce((acc, t) => acc + t.quantity, 0);

  const avg7d = sum7d / 7;
  const avg30d = sum30d / 30;

  return (avg7d * 0.7) + (avg30d * 0.3);
}

export function getProductAnalytics(
  productId: string, 
  onHand: number, 
  transfers: ProductTransfer[], 
  minOrderQty: number = 1,
  clubId?: string
): ProductAnalytics {
  const dailyUsage = calculateDailyUsage(productId, transfers, clubId);
  const daysLeft = dailyUsage > 0 ? onHand / dailyUsage : 999;
  
  const reorderDays = 14;
  const reorderFlag = daysLeft < reorderDays;

  let suggestedQty = 0;
  if (reorderFlag) {
    suggestedQty = (reorderDays * dailyUsage) - onHand;
    if (suggestedQty > 0) {
      suggestedQty = Math.ceil(suggestedQty / minOrderQty) * minOrderQty;
    } else {
      suggestedQty = 0;
    }
  }

  let alertLevel: 'none' | 'warning' | 'critical' = 'none';
  if (daysLeft < 7) alertLevel = 'critical';
  else if (daysLeft < 14) alertLevel = 'warning';

  return {
    product_id: productId,
    daily_usage: dailyUsage,
    suggested_order_qty: Math.max(0, suggestedQty),
    days_left: daysLeft,
    reorder_flag: reorderFlag,
    alert_level: alertLevel
  };
}

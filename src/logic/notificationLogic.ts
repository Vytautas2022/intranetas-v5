import { generateUniqueId } from './idLogic';
import { Notification } from '../mock-db/notifications';

export function markAsRead(notifications: Notification[], id: string): Notification[] {
  return notifications.map(n => n.id === id ? { ...n, read: true } : n);
}

export function markAsUnread(notifications: Notification[], id: string): Notification[] {
  return notifications.map(n => n.id === id ? { ...n, read: false } : n);
}

export function toggleRead(notifications: Notification[], id: string): Notification[] {
  return notifications.map(n => n.id === id ? { ...n, read: !n.read } : n);
}

export function markAllAsRead(notifications: Notification[]): Notification[] {
  return notifications.map(n => ({ ...n, read: true }));
}

export function markAllAsUnread(notifications: Notification[]): Notification[] {
  return notifications.map(n => ({ ...n, read: false }));
}

export function getUnreadCount(notifications: Notification[]): number {
  return notifications.filter(n => !n.read).length;
}

export function addNotification(notifications: Notification[], userId: string, text: string, type: "normal" | "priority" | "sla", faultId: string): Notification[] {
  const newNotif: Notification = {
    id: generateUniqueId('n'),
    userId,
    text,
    type,
    read: false,
    createdAt: Date.now(),
    faultId
  };
  return [newNotif, ...notifications];
}

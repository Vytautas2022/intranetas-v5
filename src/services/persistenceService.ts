import { readMockStorage, writeMockStorage } from '../logic/mockDbHydration';

// Keys for all persisted state — app_ prefix = pre-existing, sg_ prefix = added here
const KEYS = {
  // Pre-existing (hydrateMockCollection in App.tsx)
  FAULTS:             'app_faults',
  TASKS:              'app_tasks',
  USERS:              'app_users',
  PERIODIC_TEMPLATES: 'app_periodic_templates',
  // New
  ORDERS:             'sg_orders',
  PERIODIC_HISTORY:   'sg_periodic_history',
  PERIODIC_INSTANCES: 'sg_periodic_instances',
  WORKFLOW_TYPES:     'sg_workflow_types',
  NOTIFICATIONS:      'sg_notifications',
  AUDIT_LOGS:         'sg_audit_logs',
  ASSET_TYPES:        'sg_asset_types',
  ASSET_OBJECTS:      'sg_asset_objects',
} as const;

export function saveToStorage<T>(key: string, data: T): void {
  writeMockStorage(key, data);
}

export function loadFromStorage<T>(key: string, fallback: T): T {
  return readMockStorage<T>(key) ?? fallback;
}

export function clearStorage(): void {
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem('sg_mock_db_meta');
}

export { KEYS };

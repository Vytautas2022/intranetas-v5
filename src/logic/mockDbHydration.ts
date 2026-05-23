const MOCK_DB_META_KEY = "sg_mock_db_meta";
const MOCK_DB_VERSION = "2026-05-18-state-v1";

interface MockDbMeta {
  version: string;
  hydratedAt: number;
  keys: Record<string, { hydratedAt: number; itemCount?: number }>;
}

const isBrowser = () => typeof window !== "undefined";

const readMeta = (): MockDbMeta => {
  if (!isBrowser()) {
    return { version: MOCK_DB_VERSION, hydratedAt: Date.now(), keys: {} };
  }

  try {
    const saved = localStorage.getItem(MOCK_DB_META_KEY);
    if (!saved) {
      return { version: MOCK_DB_VERSION, hydratedAt: Date.now(), keys: {} };
    }

    const parsed = JSON.parse(saved) as MockDbMeta;
    return {
      version: parsed.version || MOCK_DB_VERSION,
      hydratedAt: parsed.hydratedAt || Date.now(),
      keys: parsed.keys || {},
    };
  } catch {
    return { version: MOCK_DB_VERSION, hydratedAt: Date.now(), keys: {} };
  }
};

const writeMeta = (meta: MockDbMeta) => {
  if (!isBrowser()) return;
  localStorage.setItem(MOCK_DB_META_KEY, JSON.stringify(meta));
};

const recordHydration = (key: string, itemCount?: number) => {
  const previous = readMeta();
  writeMeta({
    version: MOCK_DB_VERSION,
    hydratedAt:
      previous.version === MOCK_DB_VERSION ? previous.hydratedAt : Date.now(),
    keys: {
      ...previous.keys,
      [key]: { hydratedAt: Date.now(), itemCount },
    },
  });
};

export const readMockStorage = <T,>(key: string): T | null => {
  if (!isBrowser()) return null;

  const saved = localStorage.getItem(key);
  if (!saved) return null;

  try {
    return JSON.parse(saved) as T;
  } catch (error) {
    console.warn(`[mock-db] Ignoring invalid localStorage payload for ${key}`, error);
    localStorage.setItem(`${key}:invalid:${Date.now()}`, saved);
    localStorage.removeItem(key);
    return null;
  }
};

export const writeMockStorage = <T,>(key: string, value: T) => {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(value));
  recordHydration(key, Array.isArray(value) ? value.length : undefined);
};

export const hydrateMockCollection = <T extends Record<string, any>>(
  key: string,
  seed: T[],
  options: {
    mergeSeed?: boolean;
    getKey?: (item: T) => string;
  } = {},
): T[] => {
  const saved = readMockStorage<T[]>(key);
  const getKey = options.getKey || ((item: T) => String(item.id));

  if (!saved || !Array.isArray(saved)) {
    recordHydration(key, seed.length);
    return seed;
  }

  if (!options.mergeSeed) {
    recordHydration(key, saved.length);
    return saved;
  }

  const merged = new Map<string, T>();
  seed.forEach((item) => merged.set(getKey(item), item));
  saved.forEach((item) => merged.set(getKey(item), item));
  const hydrated = Array.from(merged.values());
  recordHydration(key, hydrated.length);
  return hydrated;
};

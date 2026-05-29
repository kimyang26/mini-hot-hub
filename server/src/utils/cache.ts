interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

export function getCache<T>(key: string): T | undefined {
  const entry = cache.get(key);

  if (!entry) {
    return undefined;
  }

  if (Date.now() >= entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }

  console.info(`[cache hit] ${key}`);
  return entry.data as T;
}

export function setCache<T>(key: string, data: T, ttlSeconds: number): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export function deleteCache(key: string): void {
  cache.delete(key);
}

export function clearCache(): void {
  cache.clear();
}

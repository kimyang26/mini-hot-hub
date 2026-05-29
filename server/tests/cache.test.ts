import { describe, expect, it, beforeEach } from 'vitest';
import { clearCache, getCache, setCache } from '../src/utils/cache';

describe('cache', () => {
  beforeEach(() => {
    clearCache();
  });

  it('stores and reads a cached value before ttl expires', () => {
    setCache('hot:weibo', { ok: true }, 60);

    expect(getCache<{ ok: boolean }>('hot:weibo')).toEqual({ ok: true });
  });

  it('keeps platform cache keys isolated', () => {
    setCache('hot:weibo', 'weibo', 60);
    setCache('hot:zhihu', 'zhihu', 60);

    expect(getCache<string>('hot:weibo')).toBe('weibo');
    expect(getCache<string>('hot:zhihu')).toBe('zhihu');
  });

  it('expires entries after ttl', async () => {
    setCache('hot:bilibili', 'old', 0.01);

    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(getCache<string>('hot:bilibili')).toBeUndefined();
  });
});

import { platformMeta, sources } from '../config/platforms';
import { createMockProvider } from '../providers/mock';
import type { HotProvider } from '../providers/types';
import type { HotPlatform, HotResponse, SourceKey } from '../types/hot';
import { getCache, setCache } from '../utils/cache';
import { env } from '../utils/env';

const providers: Record<SourceKey, HotProvider> = {
  weibo: createMockProvider('weibo'),
  zhihu: createMockProvider('zhihu'),
  bilibili: createMockProvider('bilibili'),
};

function createErrorPlatform(source: SourceKey): HotPlatform {
  return {
    source,
    ...platformMeta[source],
    status: 'error',
    items: [],
    message: '暂时获取失败，请稍后再试',
  };
}

export async function getHotPlatform(
  source: SourceKey,
  limit: number,
  refresh = false,
): Promise<HotPlatform> {
  const cacheKey = `hot:${source}`;

  if (!refresh) {
    const cached = getCache<HotPlatform>(cacheKey);
    if (cached) {
      return {
        ...cached,
        items: cached.items.slice(0, limit),
      };
    }
  }

  console.info(`[cache miss] ${cacheKey}`);

  try {
    const platform = await providers[source].fetchHot(limit);
    if (platform.status === 'success') {
      setCache(cacheKey, platform, env.CACHE_TTL);
    }

    return platform;
  } catch {
    return createErrorPlatform(source);
  }
}

export async function getAllHotPlatforms(limit: number, refresh = false): Promise<HotResponse> {
  const platforms = await Promise.all(
    sources.map((source) => getHotPlatform(source, limit, refresh)),
  );

  return {
    platforms,
    generatedAt: new Date().toISOString(),
    cacheTtlSeconds: env.CACHE_TTL,
  };
}

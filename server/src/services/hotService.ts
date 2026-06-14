import { platformMeta, sources } from '../config/platforms';
import { createBilibiliProvider } from '../providers/bilibili';
import type { HotProvider } from '../providers/types';
import { createWeiboProvider } from '../providers/weibo';
import { createZhihuProvider } from '../providers/zhihu';
import type { HotPlatform, HotResponse, SourceKey } from '../types/hot';
import { getCache, setCache } from '../utils/cache';
import { env } from '../utils/env';

const providers: Record<SourceKey, HotProvider> = {
  weibo: createWeiboProvider(),
  zhihu: createZhihuProvider(),
  bilibili: createBilibiliProvider(),
};
const cacheFetchLimit = 20;

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
    const platform = await providers[source].fetchHot(cacheFetchLimit);
    if (platform.status === 'success') {
      setCache(cacheKey, platform, env.CACHE_TTL);
    }

    return {
      ...platform,
      items: platform.items.slice(0, limit),
    };
  } catch (error) {
    console.error(
      `[provider error] ${source}`,
      error instanceof Error ? error.message : 'Unknown provider error',
    );

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

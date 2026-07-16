const sources = ['weibo', 'zhihu', 'bilibili'];
const cache = new Map();
const cacheTtlSeconds = 600;
const cacheFetchLimit = 20;

const platformMeta = {
  weibo: { sourceName: '微博', listName: '热搜榜' },
  zhihu: { sourceName: '知乎', listName: '热榜' },
  bilibili: { sourceName: 'B站', listName: '热门' },
};

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': 'content-type',
      ...(init.headers ?? {}),
    },
  });
}

function clampLimit(value) {
  const limit = Number(value ?? 10);

  if (!Number.isFinite(limit)) {
    return 10;
  }

  return Math.min(20, Math.max(1, Math.floor(limit)));
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function normalizeItem(item, index) {
  const title = String(item.title ?? '').trim();
  const url = String(item.url ?? '').trim();

  if (!title || !isHttpUrl(url)) {
    return undefined;
  }

  return {
    rank: index + 1,
    title,
    url,
    heat: item.heat,
  };
}

function formatHeat(value, unit) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return undefined;
  }

  if (number >= 10000) {
    return `${Math.round(number / 10000)}万${unit}`;
  }

  return `${Math.round(number)} ${unit}`;
}

function createPlatform(source, items, emptyMessage) {
  return {
    source,
    ...platformMeta[source],
    status: items.length > 0 ? 'success' : 'empty',
    updatedAt: new Date().toISOString(),
    items,
    ...(items.length > 0 ? {} : { message: emptyMessage }),
  };
}

function createErrorPlatform(source) {
  return {
    source,
    ...platformMeta[source],
    status: 'error',
    items: [],
    message: '暂时获取失败，请稍后再试',
  };
}

async function fetchWeibo(limit) {
  const response = await fetch('https://weibo.com/ajax/statuses/hot_band', {
    headers: {
      'User-Agent': 'Mozilla/5.0 mini-hot-hub/1.0',
      Referer: 'https://weibo.com/',
    },
  });

  if (!response.ok) {
    throw new Error(`Weibo hot API returned ${response.status}`);
  }

  const payload = await response.json();
  const list = Array.isArray(payload?.data?.band_list) ? payload.data.band_list : [];
  const items = list
    .filter((item) => item?.is_ad !== 1)
    .map((item) => {
      const title = String(item?.note || item?.word || '').trim();
      const query = String(item?.word_scheme || item?.word || title).trim();
      const params = new URLSearchParams({ q: query });

      return {
        title,
        url: `https://s.weibo.com/weibo?${params.toString()}`,
        heat: formatHeat(item?.num ?? item?.raw_hot, '热度'),
      };
    })
    .map(normalizeItem)
    .filter(Boolean)
    .slice(0, limit);

  return createPlatform('weibo', items, '微博热搜当前暂无可展示内容');
}

async function fetchZhihu(limit) {
  const params = new URLSearchParams({
    domain: '0',
    period: 'hour',
    limit: String(Math.max(limit, 20)),
  });
  const response = await fetch(`https://www.zhihu.com/api/v4/creators/rank/hot?${params}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 mini-hot-hub/1.0',
      Referer: 'https://www.zhihu.com/',
    },
  });

  if (!response.ok) {
    throw new Error(`Zhihu hot API returned ${response.status}`);
  }

  const payload = await response.json();
  const list = Array.isArray(payload?.data) ? payload.data : [];
  const items = list
    .map((item) => {
      const id = item?.question?.id ?? '';
      const url = item?.question?.url || `https://www.zhihu.com/question/${id}`;

      return {
        title: item?.question?.title,
        url,
        heat: formatHeat(item?.reaction?.new_pv ?? item?.reaction?.pv, '浏览'),
      };
    })
    .map(normalizeItem)
    .filter(Boolean)
    .slice(0, limit);

  return createPlatform('zhihu', items, '知乎热榜当前暂无可展示内容');
}

async function fetchBilibili(limit) {
  const params = new URLSearchParams({
    rid: '0',
    type: 'all',
  });
  const response = await fetch(`https://api.bilibili.com/x/web-interface/ranking/v2?${params}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 mini-hot-hub/1.0',
      Referer: 'https://www.bilibili.com/v/popular/rank/all',
    },
  });

  if (!response.ok) {
    throw new Error(`Bilibili popular API returned ${response.status}`);
  }

  const payload = await response.json();
  const list = Array.isArray(payload?.data?.list) ? payload.data.list : [];
  const items = list
    .map((item) => ({
      title: item?.title,
      url: item?.bvid
        ? `https://www.bilibili.com/video/${String(item.bvid).trim()}`
        : item?.short_link_v2,
      heat: formatHeat(item?.stat?.view ?? item?.stat?.vv, '播放'),
    }))
    .map(normalizeItem)
    .filter(Boolean)
    .slice(0, limit);

  return createPlatform('bilibili', items, 'B站热门当前暂无可展示内容');
}

const providers = {
  weibo: fetchWeibo,
  zhihu: fetchZhihu,
  bilibili: fetchBilibili,
};

async function getHotPlatform(source, limit) {
  const cacheKey = `hot:${source}`;
  const now = Date.now();
  const cached = cache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return {
      ...cached.data,
      items: cached.data.items.slice(0, limit),
    };
  }

  try {
    const platform = await providers[source](cacheFetchLimit);
    if (platform.status === 'success') {
      cache.set(cacheKey, {
        data: platform,
        expiresAt: now + cacheTtlSeconds * 1000,
      });
    }

    return {
      ...platform,
      items: platform.items.slice(0, limit),
    };
  } catch (error) {
    console.error(`[provider error] ${source}`, error);
    return createErrorPlatform(source);
  }
}

async function getAllHotPlatforms(limit) {
  const platforms = await Promise.all(sources.map((source) => getHotPlatform(source, limit)));

  return {
    platforms,
    generatedAt: new Date().toISOString(),
    cacheTtlSeconds,
  };
}

export { getAllHotPlatforms, getHotPlatform, json, clampLimit, sources };

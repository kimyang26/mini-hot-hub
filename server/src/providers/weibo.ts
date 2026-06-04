import { platformMeta } from '../config/platforms';
import { hotItemSchema } from '../schemas/hot';
import type { HotItem, HotPlatform } from '../types/hot';
import type { HotProvider } from './types';
import { z } from 'zod';

const WEIBO_HOT_URL = 'https://weibo.com/ajax/statuses/hot_band';
const WEIBO_SEARCH_URL = 'https://s.weibo.com/weibo';
const WEIBO_TIMEOUT_MS = 8000;

const weiboHotItemSchema = z
  .object({
    word: z.string().optional(),
    word_scheme: z.string().optional(),
    note: z.string().optional(),
    num: z.coerce.number().nonnegative().optional(),
    raw_hot: z.coerce.number().nonnegative().optional(),
    is_ad: z.coerce.number().int().optional(),
  })
  .passthrough();

const weiboHotResponseSchema = z
  .object({
    ok: z.literal(1),
    data: z.object({
      band_list: z.array(weiboHotItemSchema),
    }),
  })
  .passthrough();

type WeiboHotItem = z.infer<typeof weiboHotItemSchema>;

function formatHeat(value: number | undefined): string | undefined {
  if (value === undefined || !Number.isFinite(value)) {
    return undefined;
  }

  if (value >= 10000) {
    return `${Math.round(value / 10000)}万热度`;
  }

  return `${Math.round(value)} 热度`;
}

function createWeiboSearchUrl(query: string): string {
  const params = new URLSearchParams({ q: query });
  return `${WEIBO_SEARCH_URL}?${params.toString()}`;
}

function normalizeWeiboItems(items: WeiboHotItem[], limit: number): HotItem[] {
  return items
    .filter((item) => item.is_ad !== 1)
    .map((item) => {
      const title = item.note?.trim() || item.word?.trim() || '';
      const query = item.word_scheme?.trim() || item.word?.trim() || title;

      return {
        rank: 1,
        title,
        url: createWeiboSearchUrl(query),
        heat: formatHeat(item.num ?? item.raw_hot),
      };
    })
    .map((item, index) => hotItemSchema.safeParse({ ...item, rank: index + 1 }))
    .filter((result) => result.success)
    .map((result) => result.data)
    .slice(0, limit);
}

export function createWeiboProvider(): HotProvider {
  return {
    source: 'weibo',
    async fetchHot(limit: number): Promise<HotPlatform> {
      const response = await fetch(WEIBO_HOT_URL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 mini-hot-hub/1.0',
          Referer: 'https://weibo.com/',
        },
        signal: AbortSignal.timeout(WEIBO_TIMEOUT_MS),
      });

      if (!response.ok) {
        throw new Error(`Weibo hot API returned ${response.status}`);
      }

      const payload: unknown = await response.json();
      const parsed = weiboHotResponseSchema.safeParse(payload);

      if (!parsed.success) {
        throw new Error('Weibo hot API response shape changed');
      }

      const items = normalizeWeiboItems(parsed.data.data.band_list, limit);
      const meta = platformMeta.weibo;

      if (items.length === 0) {
        return {
          source: 'weibo',
          ...meta,
          status: 'empty',
          updatedAt: new Date().toISOString(),
          items,
          message: '微博热搜当前暂无可展示内容',
        };
      }

      return {
        source: 'weibo',
        ...meta,
        status: 'success',
        updatedAt: new Date().toISOString(),
        items,
      };
    },
  };
}

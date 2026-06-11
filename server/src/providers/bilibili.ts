import { z } from 'zod';
import { platformMeta } from '../config/platforms';
import { hotItemSchema } from '../schemas/hot';
import type { HotItem, HotPlatform } from '../types/hot';
import type { HotProvider } from './types';

const BILIBILI_POPULAR_URL = 'https://api.bilibili.com/x/web-interface/popular';
const BILIBILI_TIMEOUT_MS = 8000;

const bilibiliPopularItemSchema = z
  .object({
    title: z.string().optional(),
    bvid: z.string().optional(),
    short_link_v2: z.string().url().optional(),
    stat: z
      .object({
        view: z.coerce.number().nonnegative().optional(),
        vv: z.coerce.number().nonnegative().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

const bilibiliPopularResponseSchema = z
  .object({
    code: z.literal(0),
    data: z.object({
      list: z.array(bilibiliPopularItemSchema),
    }),
  })
  .passthrough();

type BilibiliPopularItem = z.infer<typeof bilibiliPopularItemSchema>;

function formatHeat(value: number | undefined): string | undefined {
  if (value === undefined || !Number.isFinite(value)) {
    return undefined;
  }

  if (value >= 10000) {
    return `${Math.round(value / 10000)}万播放`;
  }

  return `${Math.round(value)} 播放`;
}

function createBilibiliUrl(item: BilibiliPopularItem): string {
  if (item.bvid?.trim()) {
    return `https://www.bilibili.com/video/${item.bvid.trim()}`;
  }

  return item.short_link_v2 ?? '';
}

function normalizeBilibiliItems(items: BilibiliPopularItem[], limit: number): HotItem[] {
  return items
    .map((item) => ({
      rank: 1,
      title: item.title?.trim() ?? '',
      url: createBilibiliUrl(item),
      heat: formatHeat(item.stat?.view ?? item.stat?.vv),
    }))
    .map((item, index) => hotItemSchema.safeParse({ ...item, rank: index + 1 }))
    .filter((result) => result.success)
    .map((result) => result.data)
    .slice(0, limit);
}

export function createBilibiliProvider(): HotProvider {
  return {
    source: 'bilibili',
    async fetchHot(limit: number): Promise<HotPlatform> {
      const params = new URLSearchParams({
        ps: String(Math.max(limit, 20)),
        pn: '1',
      });

      const response = await fetch(`${BILIBILI_POPULAR_URL}?${params.toString()}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 mini-hot-hub/1.0',
          Referer: 'https://www.bilibili.com/v/popular/all',
        },
        signal: AbortSignal.timeout(BILIBILI_TIMEOUT_MS),
      });

      if (!response.ok) {
        throw new Error(`Bilibili popular API returned ${response.status}`);
      }

      const payload: unknown = await response.json();
      const parsed = bilibiliPopularResponseSchema.safeParse(payload);

      if (!parsed.success) {
        throw new Error('Bilibili popular API response shape changed');
      }

      const items = normalizeBilibiliItems(parsed.data.data.list, limit);
      const meta = platformMeta.bilibili;

      if (items.length === 0) {
        return {
          source: 'bilibili',
          ...meta,
          status: 'empty',
          updatedAt: new Date().toISOString(),
          items,
          message: 'B站热门当前暂无可展示内容',
        };
      }

      return {
        source: 'bilibili',
        ...meta,
        status: 'success',
        updatedAt: new Date().toISOString(),
        items,
      };
    },
  };
}

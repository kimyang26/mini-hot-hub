import { z } from 'zod';
import { platformMeta } from '../config/platforms';
import { hotItemSchema } from '../schemas/hot';
import type { HotItem, HotPlatform } from '../types/hot';
import type { HotProvider } from './types';

const ZHIHU_HOT_URL = 'https://www.zhihu.com/api/v4/creators/rank/hot';
const ZHIHU_TIMEOUT_MS = 8000;

const zhihuHotItemSchema = z
  .object({
    question: z
      .object({
        id: z.union([z.string(), z.number()]).optional(),
        title: z.string().optional(),
        url: z.string().url().optional(),
      })
      .passthrough(),
    reaction: z
      .object({
        new_pv: z.coerce.number().nonnegative().optional(),
        pv: z.coerce.number().nonnegative().optional(),
        score: z.coerce.number().nonnegative().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

const zhihuHotResponseSchema = z
  .object({
    data: z.array(zhihuHotItemSchema),
  })
  .passthrough();

type ZhihuHotItem = z.infer<typeof zhihuHotItemSchema>;

function formatHeat(value: number | undefined): string | undefined {
  if (value === undefined || !Number.isFinite(value)) {
    return undefined;
  }

  if (value >= 10000) {
    return `${Math.round(value / 10000)} 万浏览`;
  }

  return `${Math.round(value)} 浏览`;
}

function createZhihuUrl(item: ZhihuHotItem): string {
  if (item.question.url) {
    return item.question.url;
  }

  return `https://www.zhihu.com/question/${item.question.id ?? ''}`;
}

function normalizeZhihuItems(items: ZhihuHotItem[], limit: number): HotItem[] {
  return items
    .map((item) => ({
      rank: 1,
      title: item.question.title?.trim() ?? '',
      url: createZhihuUrl(item),
      heat: formatHeat(item.reaction?.new_pv ?? item.reaction?.pv),
    }))
    .map((item, index) => hotItemSchema.safeParse({ ...item, rank: index + 1 }))
    .filter((result) => result.success)
    .map((result) => result.data)
    .slice(0, limit);
}

export function createZhihuProvider(): HotProvider {
  return {
    source: 'zhihu',
    async fetchHot(limit: number): Promise<HotPlatform> {
      const params = new URLSearchParams({
        domain: '0',
        period: 'hour',
        limit: String(Math.max(limit, 20)),
      });

      const response = await fetch(`${ZHIHU_HOT_URL}?${params.toString()}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 mini-hot-hub/1.0',
          Referer: 'https://www.zhihu.com/',
        },
        signal: AbortSignal.timeout(ZHIHU_TIMEOUT_MS),
      });

      if (!response.ok) {
        throw new Error(`Zhihu hot API returned ${response.status}`);
      }

      const payload: unknown = await response.json();
      const parsed = zhihuHotResponseSchema.safeParse(payload);

      if (!parsed.success) {
        throw new Error('Zhihu hot API response shape changed');
      }

      const items = normalizeZhihuItems(parsed.data.data, limit);
      const meta = platformMeta.zhihu;

      if (items.length === 0) {
        return {
          source: 'zhihu',
          ...meta,
          status: 'empty',
          updatedAt: new Date().toISOString(),
          items,
          message: '知乎热榜当前暂无可展示内容',
        };
      }

      return {
        source: 'zhihu',
        ...meta,
        status: 'success',
        updatedAt: new Date().toISOString(),
        items,
      };
    },
  };
}

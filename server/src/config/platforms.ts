import type { SourceKey } from '../types/hot';

export const sources = ['weibo', 'zhihu', 'bilibili'] as const;

export const platformMeta: Record<SourceKey, { sourceName: string; listName: string }> = {
  weibo: {
    sourceName: '微博',
    listName: '热搜榜',
  },
  zhihu: {
    sourceName: '知乎',
    listName: '热榜',
  },
  bilibili: {
    sourceName: 'B站',
    listName: '热门',
  },
};

export function isSourceKey(value: string): value is SourceKey {
  return sources.includes(value as SourceKey);
}

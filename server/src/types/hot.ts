export type SourceKey = 'weibo' | 'zhihu' | 'bilibili';
export type PlatformStatus = 'success' | 'empty' | 'error';

export interface HotItem {
  rank: number;
  title: string;
  url: string;
  heat?: string;
}

export interface HotPlatform {
  source: SourceKey;
  sourceName: string;
  listName: string;
  status: PlatformStatus;
  updatedAt?: string;
  items: HotItem[];
  message?: string;
}

export interface HotResponse {
  platforms: HotPlatform[];
  generatedAt: string;
  cacheTtlSeconds: number;
}

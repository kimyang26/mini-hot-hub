import type { HotPlatform, HotResponse, SourceKey } from '../types/hot';

const apiBase = import.meta.env.VITE_API_BASE ?? '';

async function requestJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBase}${path}`);

  if (!response.ok) {
    throw new Error('热榜数据暂时不可用');
  }

  return (await response.json()) as T;
}

export function fetchAllHot(limit = 10): Promise<HotResponse> {
  return requestJson<HotResponse>(`/api/hot?limit=${limit}`);
}

export function fetchHotPlatform(source: SourceKey, limit = 10): Promise<HotPlatform> {
  return requestJson<HotPlatform>(`/api/hot/${source}?limit=${limit}`);
}

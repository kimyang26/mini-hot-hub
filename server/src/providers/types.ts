import type { HotPlatform, SourceKey } from '../types/hot';

export interface HotProvider {
  source: SourceKey;
  fetchHot(limit: number): Promise<HotPlatform>;
}

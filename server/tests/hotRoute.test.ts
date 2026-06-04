import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../src/app';
import { clearCache } from '../src/utils/cache';

const weiboResponse = {
  ok: 1,
  data: {
    band_list: Array.from({ length: 12 }, (_, index) => ({
      word: `微博真实热搜 ${index + 1}`,
      word_scheme: `#微博真实热搜 ${index + 1}#`,
      note: `微博真实热搜 ${index + 1}`,
      num: 100000 + index,
      rank: index,
    })),
  },
};

describe('hot routes', () => {
  beforeEach(() => {
    clearCache();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(weiboResponse), { status: 200 })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns health status', async () => {
    const response = await request(app).get('/api/health').expect(200);

    expect(response.body).toEqual({ ok: true });
  });

  it('returns aggregated platforms with real weibo provider data', async () => {
    const response = await request(app).get('/api/hot?limit=10').expect(200);

    expect(response.body.platforms).toHaveLength(3);
    expect(response.body.platforms[0].source).toBe('weibo');
    expect(response.body.platforms[0].items).toHaveLength(10);
    expect(response.body.platforms[0].items[0].title).toBe('微博真实热搜 1');
  });

  it('returns one platform by source', async () => {
    const response = await request(app).get('/api/hot/weibo?limit=3&refresh=1').expect(200);

    expect(response.body.source).toBe('weibo');
    expect(response.body.items).toHaveLength(3);
  });

  it('rejects an unknown source', async () => {
    const response = await request(app).get('/api/hot/douyin').expect(404);

    expect(response.body.message).toBe('不支持的平台');
  });
});

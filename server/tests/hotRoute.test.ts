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

const zhihuResponse = {
  data: Array.from({ length: 12 }, (_, index) => ({
    question: {
      id: `zhihu-${index + 1}`,
      title: `知乎真实热榜 ${index + 1}`,
      url: `https://www.zhihu.com/question/${index + 1}`,
    },
    reaction: {
      new_pv: 200000 + index,
    },
  })),
};

const bilibiliResponse = {
  code: 0,
  data: {
    list: Array.from({ length: 12 }, (_, index) => ({
      title: `B站真实热门 ${index + 1}`,
      bvid: `BV${index + 1}abc123456`,
      short_link_v2: `https://b23.tv/BV${index + 1}abc123456`,
      stat: {
        view: 300000 + index,
      },
    })),
  },
};

function mockFetch(failingHost?: string) {
  const fetchMock = vi.fn(async (input: string | URL | Request) => {
    const url = input instanceof Request ? input.url : String(input);

    if (failingHost && url.includes(failingHost)) {
      throw new Error('upstream failed');
    }

    const body = url.includes('zhihu.com')
      ? zhihuResponse
      : url.includes('bilibili.com')
        ? bilibiliResponse
        : weiboResponse;

    return new Response(JSON.stringify(body), { status: 200 });
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('hot routes', () => {
  let fetchMock: ReturnType<typeof mockFetch>;

  beforeEach(() => {
    clearCache();
    fetchMock = mockFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns health status', async () => {
    const response = await request(app).get('/api/health').expect(200);

    expect(response.body).toEqual({ ok: true });
  });

  it('returns aggregated platforms with three real providers', async () => {
    const response = await request(app).get('/api/hot?limit=10').expect(200);

    expect(response.body.platforms).toHaveLength(3);
    expect(response.body.platforms[0].source).toBe('weibo');
    expect(response.body.platforms[0].items).toHaveLength(10);
    expect(response.body.platforms[0].items[0].title).toBe('微博真实热搜 1');
    expect(response.body.platforms[1].source).toBe('zhihu');
    expect(response.body.platforms[1].items).toHaveLength(10);
    expect(response.body.platforms[1].items[0].title).toBe('知乎真实热榜 1');
    expect(response.body.platforms[2].source).toBe('bilibili');
    expect(response.body.platforms[2].items).toHaveLength(10);
    expect(response.body.platforms[2].items[0].title).toBe('B站真实热门 1');
  });

  it('keeps other platforms available when one provider fails', async () => {
    vi.unstubAllGlobals();
    fetchMock = mockFetch('zhihu.com');

    const response = await request(app).get('/api/hot?limit=10&refresh=1').expect(200);
    const weibo = response.body.platforms.find((platform: { source: string }) => platform.source === 'weibo');
    const zhihu = response.body.platforms.find((platform: { source: string }) => platform.source === 'zhihu');
    const bilibili = response.body.platforms.find(
      (platform: { source: string }) => platform.source === 'bilibili',
    );

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(weibo.status).toBe('success');
    expect(weibo.items).toHaveLength(10);
    expect(zhihu.status).toBe('error');
    expect(zhihu.items).toHaveLength(0);
    expect(zhihu.updatedAt).toBeUndefined();
    expect(bilibili.status).toBe('success');
    expect(bilibili.items).toHaveLength(10);
  });

  it('keeps updatedAt stable while cached data is valid', async () => {
    const firstResponse = await request(app).get('/api/hot?limit=10').expect(200);
    const secondResponse = await request(app).get('/api/hot?limit=10').expect(200);

    expect(fetchMock).toHaveBeenCalledTimes(3);

    for (const firstPlatform of firstResponse.body.platforms) {
      const secondPlatform = secondResponse.body.platforms.find(
        (platform: { source: string }) => platform.source === firstPlatform.source,
      );

      expect(secondPlatform.updatedAt).toBe(firstPlatform.updatedAt);
    }
  });

  it('returns one platform by source', async () => {
    const response = await request(app).get('/api/hot/weibo?limit=3&refresh=1').expect(200);

    expect(response.body.source).toBe('weibo');
    expect(response.body.items).toHaveLength(3);
  });

  it('returns zhihu platform by source', async () => {
    const response = await request(app).get('/api/hot/zhihu?limit=3&refresh=1').expect(200);

    expect(response.body.source).toBe('zhihu');
    expect(response.body.items).toHaveLength(3);
    expect(response.body.items[0].title).toBe('知乎真实热榜 1');
  });

  it('returns bilibili platform by source', async () => {
    const response = await request(app).get('/api/hot/bilibili?limit=3&refresh=1').expect(200);

    expect(response.body.source).toBe('bilibili');
    expect(response.body.items).toHaveLength(3);
    expect(response.body.items[0].title).toBe('B站真实热门 1');
  });

  it('rejects an unknown source', async () => {
    const response = await request(app).get('/api/hot/douyin').expect(404);

    expect(response.body.message).toBe('不支持的平台');
  });
});

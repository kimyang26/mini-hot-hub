import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBilibiliProvider } from '../src/providers/bilibili';

const validBilibiliResponse = {
  code: 0,
  data: {
    list: [
      {
        title: '真实B站热门第一条',
        bvid: 'BV1abc123456',
        short_link_v2: 'https://b23.tv/BV1abc123456',
        stat: {
          view: 1234567,
        },
      },
      {
        title: '真实B站热门第二条',
        short_link_v2: 'https://b23.tv/BV2abc123456',
        stat: {
          vv: 9800,
        },
      },
      {
        title: '',
        bvid: 'BV3abc123456',
        stat: {
          view: 1,
        },
      },
    ],
  },
};

describe('bilibili provider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('normalizes valid bilibili popular video items', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(validBilibiliResponse), { status: 200 })),
    );

    const platform = await createBilibiliProvider().fetchHot(10);

    expect(platform.status).toBe('success');
    expect(platform.items).toHaveLength(2);
    expect(platform.items[0]).toMatchObject({
      rank: 1,
      title: '真实B站热门第一条',
      url: 'https://www.bilibili.com/video/BV1abc123456',
      heat: '123万播放',
    });
    expect(platform.items[1]).toMatchObject({
      rank: 2,
      title: '真实B站热门第二条',
      url: 'https://b23.tv/BV2abc123456',
      heat: '9800 播放',
    });
  });

  it('throws when the upstream response shape changes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ code: -1 }), { status: 200 })),
    );

    await expect(createBilibiliProvider().fetchHot(10)).rejects.toThrow(
      'Bilibili popular API response shape changed',
    );
  });
});

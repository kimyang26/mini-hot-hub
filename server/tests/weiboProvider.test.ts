import { afterEach, describe, expect, it, vi } from 'vitest';
import { createWeiboProvider } from '../src/providers/weibo';

const validWeiboResponse = {
  ok: 1,
  data: {
    band_list: [
      {
        word: '真实热搜第一条',
        word_scheme: '#真实热搜第一条#',
        note: '真实热搜第一条',
        num: 1234567,
      },
      {
        word: '广告位',
        note: '广告位',
        num: 999999,
        is_ad: 1,
      },
      {
        word: '真实热搜第二条',
        word_scheme: '真实热搜第二条',
        num: 9800,
      },
      {
        word: '',
        note: '',
        num: 1,
      },
    ],
  },
};

describe('weibo provider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('normalizes valid weibo hot search items', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(validWeiboResponse), { status: 200 })),
    );

    const platform = await createWeiboProvider().fetchHot(10);

    expect(platform.status).toBe('success');
    expect(platform.items).toHaveLength(2);
    expect(platform.items[0]).toMatchObject({
      rank: 1,
      title: '真实热搜第一条',
      heat: '123万热度',
    });
    expect(platform.items[0].url).toContain('https://s.weibo.com/weibo?q=');
    expect(platform.items[1]).toMatchObject({
      rank: 2,
      title: '真实热搜第二条',
      heat: '9800 热度',
    });
  });

  it('throws when the upstream response shape changes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ ok: 0 }), { status: 200 })),
    );

    await expect(createWeiboProvider().fetchHot(10)).rejects.toThrow(
      'Weibo hot API response shape changed',
    );
  });
});

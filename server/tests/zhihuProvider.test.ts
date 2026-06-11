import { afterEach, describe, expect, it, vi } from 'vitest';
import { createZhihuProvider } from '../src/providers/zhihu';

const validZhihuResponse = {
  data: [
    {
      question: {
        id: '123',
        title: '真实知乎热榜第一条',
        url: 'https://www.zhihu.com/question/123',
      },
      reaction: {
        new_pv: 123456,
      },
    },
    {
      question: {
        id: '456',
        title: '真实知乎热榜第二条',
      },
      reaction: {
        pv: 9800,
      },
    },
    {
      question: {
        id: '789',
        title: '',
        url: 'https://www.zhihu.com/question/789',
      },
      reaction: {
        new_pv: 1,
      },
    },
  ],
};

describe('zhihu provider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('normalizes valid zhihu hot question items', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(validZhihuResponse), { status: 200 })),
    );

    const platform = await createZhihuProvider().fetchHot(10);

    expect(platform.status).toBe('success');
    expect(platform.items).toHaveLength(2);
    expect(platform.items[0]).toMatchObject({
      rank: 1,
      title: '真实知乎热榜第一条',
      url: 'https://www.zhihu.com/question/123',
      heat: '12 万浏览',
    });
    expect(platform.items[1]).toMatchObject({
      rank: 2,
      title: '真实知乎热榜第二条',
      url: 'https://www.zhihu.com/question/456',
      heat: '9800 浏览',
    });
  });

  it('throws when the upstream response shape changes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error: 'changed' }), { status: 200 })),
    );

    await expect(createZhihuProvider().fetchHot(10)).rejects.toThrow(
      'Zhihu hot API response shape changed',
    );
  });
});

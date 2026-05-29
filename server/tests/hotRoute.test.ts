import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app';

describe('hot routes', () => {
  it('returns health status', async () => {
    const response = await request(app).get('/api/health').expect(200);

    expect(response.body).toEqual({ ok: true });
  });

  it('returns aggregated mock platforms', async () => {
    const response = await request(app).get('/api/hot?limit=10').expect(200);

    expect(response.body.platforms).toHaveLength(3);
    expect(response.body.platforms[0].items).toHaveLength(10);
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

import { Router } from 'express';
import { isSourceKey } from '../config/platforms';
import { hotQuerySchema } from '../schemas/hot';
import { getAllHotPlatforms, getHotPlatform } from '../services/hotService';
import { env } from '../utils/env';

export const hotRouter = Router();

function parseQuery(query: unknown) {
  return hotQuerySchema.safeParse(query);
}

function shouldRefresh(refresh: string | undefined): boolean {
  return refresh === '1' && env.NODE_ENV !== 'production';
}

hotRouter.get('/', async (request, response) => {
  const parsed = parseQuery(request.query);

  if (!parsed.success) {
    response.status(400).json({ message: '请求参数不正确' });
    return;
  }

  const hotResponse = await getAllHotPlatforms(
    parsed.data.limit,
    shouldRefresh(parsed.data.refresh),
  );
  const allFailed = hotResponse.platforms.every((platform) => platform.status === 'error');

  response.status(allFailed ? 503 : 200).json(hotResponse);
});

hotRouter.get('/:source', async (request, response) => {
  const { source } = request.params;
  const parsed = parseQuery(request.query);

  if (!source || !isSourceKey(source)) {
    response.status(404).json({ message: '不支持的平台' });
    return;
  }

  if (!parsed.success) {
    response.status(400).json({ message: '请求参数不正确' });
    return;
  }

  const platform = await getHotPlatform(source, parsed.data.limit, shouldRefresh(parsed.data.refresh));
  response.status(platform.status === 'error' ? 502 : 200).json(platform);
});

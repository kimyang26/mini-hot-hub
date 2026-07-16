import { clampLimit, getAllHotPlatforms, getHotPlatform, json, sources } from '../_shared';

function getSourceParam(params) {
  const value = params.source;

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export async function onRequestGet({ params, request }) {
  const url = new URL(request.url);
  const limit = clampLimit(url.searchParams.get('limit'));
  const source = getSourceParam(params);

  if (!source) {
    const response = await getAllHotPlatforms(limit);
    const hasSuccess = response.platforms.some((platform) => platform.status !== 'error');

    return json(response, { status: hasSuccess ? 200 : 503 });
  }

  if (!sources.includes(source)) {
    return json({ message: '不支持的平台' }, { status: 404 });
  }

  const platform = await getHotPlatform(source, limit);

  return json(platform, { status: platform.status === 'error' ? 502 : 200 });
}

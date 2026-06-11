# mini-hot-hub

今日热搜榜 MVP，采用 `client/` + `server/` 前后端分离结构。

## 本地开发

需要同时开启两个终端，一个运行后端，一个运行前端。

终端 1，启动后端：

```bash
cd server
npm install
npm run dev
```

终端 2，启动前端：

```bash
cd client
npm install
npm run dev
```

默认地址：

- 前端：`http://localhost:5173`
- 后端：`http://localhost:3001`
- 健康检查：`http://localhost:3001/api/health`
- 聚合接口：`http://localhost:3001/api/hot`
- 单平台接口：`http://localhost:3001/api/hot/weibo`

开发环境前端通过 Vite proxy 请求 `/api/*`，会转发到 `http://localhost:3001`。

## 当前阶段

- `client/` 已初始化为 React + TypeScript + Vite + CSS Modules。
- `server/` 已初始化为 Express + TypeScript。
- 当前微博、知乎卡片已接入真实热榜 JSON 数据，B站仍为 Express Mock API。
- 首页数据已全部来自后端 `/api/hot` 聚合接口。
- 真实 B站 Provider 将在后续阶段接入。

## 常用验证

```bash
cd client && npm run build
cd client && npm run lint

cd server && npm run build
cd server && npm run test
```

## 缓存验证

当前 Express Mock API 使用服务端内存 `Map` 缓存成功结果，缓存 key 按平台隔离，例如 `hot:weibo`、`hot:zhihu`、`hot:bilibili`。

默认 TTL 为 600 秒，可通过 `server/.env` 中的 `CACHE_TTL` 调整。选择 600 秒是因为当前 PRD 要求页面约 10 分钟更新一次：这个时间既能减少重复请求，也能保持热榜数据对 MVP 足够新鲜。

验证步骤：

```bash
cd server
npm run dev
```

另开一个终端，连续请求同一个接口：

```bash
curl "http://localhost:3001/api/hot/weibo?limit=10"
curl "http://localhost:3001/api/hot/weibo?limit=10"
```

第一次请求后，后端终端应看到 `[cache miss] hot:weibo`；第二次请求后，应看到 `[cache hit] hot:weibo`。缓存命中期间，该平台响应里的 `updatedAt` 会保持不变，前端卡片底部展示的更新时间也会随之保持一致。

## 微博真实数据排查

微博 Provider 位于 `server/src/providers/weibo.ts`，当前使用固定 JSON 数据源 `https://weibo.com/ajax/statuses/hot_band`。后端只设置普通 `User-Agent` 与 `Referer`，不使用 Cookie、登录态或规避限制的请求头。

若微博卡片显示失败，可按顺序检查：

```bash
cd server
npm run dev
curl "http://localhost:3001/api/hot/weibo?limit=10&refresh=1"
```

- 返回 `success` 且 `items` 不少于 10 条：微博真实数据正常。
- 返回 `error`：查看后端终端中的 `[provider error] weibo ...` 日志，通常是上游网络不可达、HTTP 状态异常或字段结构变化。
- 聚合接口 `/api/hot` 中微博失败但知乎、B站仍显示：这是预期的单平台失败隔离。

## 知乎真实数据排查

知乎 Provider 位于 `server/src/providers/zhihu.ts`，当前使用固定 JSON 数据源 `https://www.zhihu.com/api/v4/creators/rank/hot?domain=0&period=hour`。这个接口返回真实知乎热门问题；常见的 `topstory/hot-lists` 接口在无登录环境会返回 401，所以当前阶段选择无需 Cookie 的公开 JSON 数据源。

若知乎卡片显示失败，可按顺序检查：

```bash
cd server
npm run dev
curl "http://localhost:3001/api/hot/zhihu?limit=10&refresh=1"
curl "http://localhost:3001/api/hot?limit=10&refresh=1"
```

- 单平台接口返回 `success` 且 `items` 不少于 10 条：知乎真实数据正常。
- 聚合接口中微博与知乎均为 `success`：Day 14 并行验证通过。
- 返回 `error`：查看后端终端中的 `[provider error] zhihu ...` 日志，通常是上游网络不可达、HTTP 状态异常或字段结构变化。

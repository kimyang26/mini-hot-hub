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
- 当前数据仍为 Express Mock API，用于 Day 10-12 的页面、接口与缓存联调。
- 首页数据已全部来自后端 `/api/hot` 聚合接口。
- 真实微博、知乎、B站 Provider 将在后续阶段逐一接入。

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

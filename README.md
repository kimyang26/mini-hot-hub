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
- 当前微博、知乎、B站卡片均已接入真实热榜 JSON 数据。
- 首页数据已全部来自后端 `/api/hot` 聚合接口。

## 数据来源说明

所有外部数据都只在 Express 后端 `server/src/providers/` 中请求和转换，浏览器只请求本站 `/api/hot*` 接口。

| 平台 | 数据源 | 当前说明 |
|---|---|---|
| 微博 | `https://weibo.com/ajax/statuses/hot_band` | 微博实时热搜 JSON；不使用 Cookie 或登录态 |
| 知乎 | `https://www.zhihu.com/api/v4/creators/rank/hot?domain=0&period=hour` | 知乎热门问题 JSON；常见 `topstory/hot-lists` 无登录会返回 401 |
| B站 | `https://api.bilibili.com/x/web-interface/popular?ps=20&pn=1` | B站热门视频 JSON；使用 BV 号生成原站视频链接 |

三平台响应都会经过 Zod 校验和统一模型转换；空标题、非法链接或无效条目会被过滤。若单个平台上游失败，其余平台仍可正常展示。

## 常用验证

```bash
cd client && npm run build
cd client && npm run lint

cd server && npm run build
cd server && npm run test
```

## Deploy 部署说明草稿

本项目采用前后端分离部署：

- 前端 `client/` 部署到 Vercel，产物目录为 `dist/`。
- 后端 `server/` 部署到 Railway，运行 Express API。
- 浏览器只请求本站后端 API；生产环境由 `VITE_API_BASE` 指向 Railway 后端地址。

### 部署顺序

1. 先部署后端 `server/` 到 Railway。
2. 验证 Railway 后端地址的 `/api/health` 和 `/api/hot?limit=10`。
3. 将 Railway 后端 HTTPS 地址填入 Vercel 前端环境变量 `VITE_API_BASE`。
4. 部署前端 `client/` 到 Vercel。
5. 打开 Vercel 前端页面，确认 Network 中 `/api/hot` 请求指向 Railway 后端。

### 前端部署准备

在 `client/` 目录执行：

```bash
npm run build
```

构建成功后应生成 `client/dist/`，Vercel 配置如下：

| 配置项 | 值 |
|---|---|
| Root Directory | `client` |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| 环境变量 | `VITE_API_BASE=https://<railway-backend-domain>` |

`VITE_API_BASE` 的含义：生产环境前端访问的后端 API 根地址。例如 Railway 后端域名是 `https://mini-hot-hub-api.up.railway.app`，则前端会请求 `https://mini-hot-hub-api.up.railway.app/api/hot`。该变量会进入浏览器构建产物，只能放公开后端地址，不能放 token、Cookie 或密钥。

本地开发时 `client/.env.example` 中的 `VITE_API_BASE=` 可以留空，前端会通过 Vite proxy 请求本机 `http://localhost:3001`。

### 后端部署准备

在 `server/` 目录执行：

```bash
npm run build
npm run start
```

Railway 配置如下：

| 配置项 | 值 |
|---|---|
| Root Directory / 服务目录 | `server` |
| Build Command | `npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

### 环境变量清单

| 变量 | 说明 |
|---|---|
| `PORT` | 后端端口，本地可用 `3001`；Railway 通常会自动注入生产端口。 |
| `CACHE_TTL` | 缓存秒数，默认 `600`，表示约 10 分钟缓存。 |
| `CLIENT_ORIGIN` | 生产前端域名，用于 CORS，例如 `https://<vercel-client-domain>`。 |
| `NODE_ENV` | 运行环境；生产部署设置为 `production`。 |

### 本地端口

- 前端 Vite 默认端口：`5173`，本地访问 `http://localhost:5173`。
- 后端 Express 默认端口：`3001`，本地访问 `http://localhost:3001`。
- 本地开发时确认两个终端同时运行：`client npm run dev` 与 `server npm run dev`。
- 若端口被占用，先停止旧进程或同步调整 Vite proxy、后端 `PORT` 与文档中的访问地址。

### 环境变量

前端部署到 Vercel 前确认：

- Root Directory：`client`
- Build Command：`npm run build`
- Output Directory：`dist`
- `VITE_API_BASE=https://<railway-backend-domain>`，只填写公开后端 API 域名，不放 token、Cookie 或密钥。

后端部署到 Railway 前确认：

- Root Directory / 服务目录：`server`
- Build Command：`npm run build`
- Start Command：`npm start`
- `NODE_ENV=production`
- `CACHE_TTL=600`
- `CLIENT_ORIGIN=https://<vercel-client-domain>`，用于限制生产 CORS 来源。
- 如需自定义端口，使用平台提供的 `PORT`；本地默认仍为 `3001`。

### API 地址

部署前逐项检查：

- 后端健康检查：`https://<railway-backend-domain>/api/health` 返回 `{ "ok": true }`。
- 聚合接口：`https://<railway-backend-domain>/api/hot?limit=10` 返回微博、知乎、B站三组平台数据。
- 单平台接口：`/api/hot/weibo`、`/api/hot/zhihu`、`/api/hot/bilibili` 均可单独访问。
- Vercel 前端 Network 面板中的 `/api/hot` 请求应指向 Railway 后端域名。
- 三平台任一失败时，页面应显示该平台错误态，其他平台仍可浏览。

## 缓存验证

当前 Express API 使用服务端内存 `Map` 缓存成功结果，缓存 key 按平台隔离，例如 `hot:weibo`、`hot:zhihu`、`hot:bilibili`。

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

## B站真实数据排查

B站 Provider 位于 `server/src/providers/bilibili.ts`，当前使用固定 JSON 数据源 `https://api.bilibili.com/x/web-interface/popular?ps=20&pn=1`。该接口返回 B站热门视频列表，Provider 使用 `bvid` 生成原站视频链接，并展示播放量。

若 B站卡片显示失败，可按顺序检查：

```bash
cd server
npm run dev
curl "http://localhost:3001/api/hot/bilibili?limit=10&refresh=1"
curl "http://localhost:3001/api/hot?limit=10&refresh=1"
```

- 单平台接口返回 `success` 且 `items` 不少于 10 条：B站真实数据正常。
- 聚合接口中微博、知乎、B站均为 `success`：Day 15 全站检查通过。
- 返回 `error`：查看后端终端中的 `[provider error] bilibili ...` 日志，通常是上游网络不可达、HTTP 状态异常或字段结构变化。

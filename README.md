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

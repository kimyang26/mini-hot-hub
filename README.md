# mini-hot-hub

今日热搜榜 MVP，采用 `client/` + `server/` 前后端分离结构。

## 本地开发

前端：

```bash
cd client
npm install
npm run dev
```

后端：

```bash
cd server
npm install
npm run dev
```

默认地址：

- 前端：`http://localhost:5173`
- 后端：`http://localhost:3001`
- 健康检查：`http://localhost:3001/api/health`

## 当前阶段

- `client/` 已初始化为 React + TypeScript + Vite + CSS Modules。
- `server/` 已初始化为 Express + TypeScript。
- 当前数据仍为 Mock，用于 Day 7-11 的页面与接口联调。
- 真实微博、知乎、B站 Provider 将在后续阶段逐一接入。

## 常用验证

```bash
cd client && npm run build
cd client && npm run lint

cd server && npm run build
cd server && npm run test
```

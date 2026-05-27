# TECH_DESIGN.md｜今日热搜榜

> 阶段：Step 3 — 技术设计文档（Tech Design）  
> 版本：v0.4（课程兼容架构统一版，已同步 PRD / AGENTS）  
> 日期：2026-05-28  
> 产品发起人：Kim  
> 关联文档：`RESEARCH.md`、`PRD.md v0.4`、`AGENTS.md v0.3`、`CLAUDE.md v0.1`  
> 开发工具：Codex 主开发，Claude Code 辅助审查与排错

---

## 0. 本版修订说明

本版将原先的 Next.js 单项目方案调整为与 21 天教程主路径一致的前后端分离方案，目的是同时满足两件事：

1. 最终可以上线一个真实可访问的三平台热榜网站；
2. Day 7–21 每日任务涉及的项目结构、接口联调、缓存、CORS 与部署过程均可以直接完成和打卡。

### 0.1 最终采用的技术路线

```text
GitHub 仓库 mini-hot-hub/
├── client/   React + TypeScript + Vite + CSS Modules → Vercel
└── server/   Node.js + Express + TypeScript + 内存缓存 → Railway
```

### 0.2 与上一版方案的变化

| 事项 | v0.3 方案 | v0.4 最终方案 | 调整原因 |
|---|---|---|---|
| 应用架构 | Next.js 单项目 | `client/` + `server/` 前后端分离 | 与教程 Day 7–20 的开发和部署任务一致 |
| 前端 | Next.js + Tailwind | React + Vite + CSS Modules | 与课程页面开发、Vite 代理、Vercel 构建路径一致 |
| 后端 | Next.js Route Handler | Express API 服务 | 能完成后端、CORS、缓存与 Railway 部署练习 |
| API | 仅 `GET /api/hot` | `GET /api/hot/:source` + `GET /api/hot` | 支持逐个平台接入与单卡重试 |
| 缓存 | 上游承担缓存 | Express 内存 `Map` 缓存，TTL 600 秒 | 可验证 cache hit，完成教程缓存任务 |
| 真实数据 | 聚合上游为主 | 每个平台独立 Provider，可替换数据源 | 便于 Day 13–15 逐一接入与排错 |
| 部署 | Vercel 单站点 | Vercel 前端 + Railway 后端 | 与线上串联和环境变量练习一致 |

### 0.3 不变的 MVP 产品边界

首版仍然只实现：

- 微博热搜、知乎热榜、B站热门三平台；
- 首页卡片网格与 Top 10 榜单；
- 标题跳转原链接；
- Loading / Empty / Error 状态；
- 单个平台失败不影响其他平台；
- 5–10 分钟缓存；
- 公网 HTTPS 访问。

以下内容不进入首版：更多平台、AI 每日摘要、自动推送、用户系统、历史榜、跨平台总榜、舆情分析。

> 同步状态：`PRD.md v0.4` 与 `AGENTS.md v0.3` 已同步为本架构口径；`CLAUDE.md v0.1` 已补充为 Claude Code 审查与排错规则。

---

## 1. 技术栈选择

### 1.1 技术栈总表

| 模块 | 技术选型 | 用途 | 选择理由 |
|---|---|---|---|
| 前端框架 | React + TypeScript + Vite | 首页 UI、状态渲染、API 请求 | 与课程一致；开发反馈快；适合静态前端部署 |
| 样式 | CSS Modules + 全局基础 CSS | 卡片、Grid、响应式与交互样式 | 页面规模小，无需引入 UI 框架；便于理解和微调 |
| 后端 | Node.js + Express + TypeScript | 热榜聚合 API、数据中转、缓存、CORS | 与课程核心练习一致；服务端可保护数据源与统一格式 |
| 运行时数据校验 | Zod | 校验真实数据源的未知响应 | 外部接口可能变化，避免页面被异常字段拖垮 |
| 缓存 | 服务端内存 `Map` | 按平台缓存成功数据 | 实现简单，可完成 5–10 分钟缓存验证 |
| 测试 | Vitest + Supertest + React Testing Library | 单元测试、API 测试、组件测试 | 覆盖数据转换、缓存、错误隔离与 UI 状态 |
| 代码托管 | GitHub | 版本管理与部署来源 | 教程要求，且可连接部署平台 |
| 前端部署 | Vercel | 发布 Vite 构建产物 | 支持 GitHub 自动部署与 HTTPS |
| 后端部署 | Railway | 发布 Express API | 支持从 GitHub 部署 Express 服务和环境变量配置 |
| AI 开发协作 | Codex + Claude Code | 开发、审查、排错 | Codex 执行任务；Claude 独立检查与故障定位 |

### 1.2 关于 TypeScript 的取舍

教程示例目录中后端文件名使用 `.js`，同时开发规范又要求前后端类型与技术设计一致。本项目采用 **前后端均使用 TypeScript**：

- 前后端共享同一套核心数据模型，减少接口字段漂移；
- Codex 与 Claude Code 均可处理 TypeScript 工程；
- 不改变教程要练习的 Express、缓存、CORS、接口与部署流程；
- 后端开发模式使用 `tsx`，生产构建使用 `tsc`。

### 1.3 为什么不再采用 Next.js 单项目

Next.js 对长期产品化很省事，本课程阶段的目标还包括理解前端、后端、代理、CORS、缓存与双服务部署。采用前后端分离能够直接完成课程要求的每一个验证动作与打卡证据，减少“功能做出来了却不符合学习任务路径”的额外解释成本。

---

## 2. 系统架构

### 2.1 总体架构图

```text
开发环境：
浏览器 http://localhost:5173
        │
        │ 前端请求 /api/*，Vite proxy 转发
        ▼
Express API http://localhost:3001
        │
        ├── routes/hot.ts          接口路由
        ├── services/hotService.ts 聚合与失败隔离
        ├── providers/*.ts         平台数据转换
        └── utils/cache.ts         按平台内存缓存（TTL 600s）
                        │
                        ▼
              微博 / 知乎 / B站可用 JSON 数据源

生产环境：
访客浏览器
   │
   ▼
Vercel: client 静态站点 ── HTTPS fetch(VITE_API_BASE) ──► Railway: Express API
                                                               │
                                                               ▼
                                                      外部热榜 JSON 数据源
```

### 2.2 为什么需要后端

> 后端负责请求与转换真实热榜数据、控制缓存和错误隔离，使浏览器无需直接访问外部平台，也便于统一处理 CORS、接口变化与安全边界。

### 2.3 请求主流程

```text
1. 用户打开首页
2. client 调用 GET /api/hot
3. server 并发获取 weibo / zhihu / bilibili
4. 每个平台先读取缓存：
   - 命中且未过期：直接返回缓存结果
   - 未命中：请求 Provider，转换为统一模型，成功后写入缓存
5. 单个平台失败时返回该平台 error 状态，其余平台继续返回
6. client 根据 status 分别渲染三张 HotCard
```

---

## 3. 项目结构

```text
mini-hot-hub/
├── PRD.md
├── TECH_DESIGN.md
├── AGENTS.md
├── CLAUDE.md                         # 后续创建：让 Claude 遵守相同范围
├── README.md
├── .gitignore
│
├── client/                            # React + TypeScript + Vite 前端
│   ├── src/
│   │   ├── api/
│   │   │   └── hot.ts                # fetchHotPlatform / fetchAllHot
│   │   ├── components/
│   │   │   ├── Layout.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── HotGrid.tsx
│   │   │   ├── HotCard.tsx
│   │   │   ├── HotList.tsx
│   │   │   └── Footer.tsx
│   │   ├── types/
│   │   │   └── hot.ts                # 前端共享数据模型
│   │   ├── utils/
│   │   │   └── formatRelativeTime.ts
│   │   ├── mock/
│   │   │   └── hot.json              # Day 7–9 使用，生产不得依赖
│   │   ├── styles/
│   │   │   └── variables.css
│   │   ├── App.tsx
│   │   ├── App.module.css
│   │   └── main.tsx
│   ├── .env.example
│   ├── vite.config.ts                # 开发环境 /api 代理到 server
│   ├── package.json
│   └── tsconfig.json
│
└── server/                            # Node.js + Express + TypeScript 后端
    ├── src/
    │   ├── routes/
    │   │   └── hot.ts                # /api/hot 与 /api/hot/:source
    │   ├── providers/
    │   │   ├── types.ts
    │   │   ├── mock.ts               # Day 10–12 API Mock
    │   │   ├── weibo.ts              # Day 13 替换真实数据
    │   │   ├── zhihu.ts              # Day 14 替换真实数据
    │   │   └── bilibili.ts           # Day 15 替换真实数据
    │   ├── services/
    │   │   └── hotService.ts         # provider 注册、并行聚合、失败隔离
    │   ├── utils/
    │   │   ├── cache.ts              # 内存 Map + TTL
    │   │   └── env.ts                # 环境变量读取与校验
    │   ├── schemas/
    │   │   └── hot.ts                # Zod 校验与统一输出
    │   ├── types/
    │   │   └── hot.ts                # 与 client 类型保持同构
    │   └── index.ts                  # Express 入口、CORS、health 路由
    ├── tests/
    │   ├── cache.test.ts
    │   ├── hotService.test.ts
    │   └── hotRoute.test.ts
    ├── .env.example
    ├── package.json
    └── tsconfig.json
```

### 3.1 目录职责边界

| 目录/模块 | 负责什么 | 不负责什么 |
|---|---|---|
| `client/src/components/` | 显示统一模型、页面状态与交互 | 不直接访问外部热榜源 |
| `client/src/api/` | 请求本站后端 API | 不解析第三方响应 |
| `client/src/mock/` | Day 7–9 UI 开发数据、测试辅助 | 不作为上线数据 |
| `server/src/routes/` | 接收请求、校验 source/query、组织 HTTP 响应 | 不编写平台解析细节 |
| `server/src/services/` | 并行聚合、错误隔离、调用缓存与 Provider | 不渲染前端文案 |
| `server/src/providers/` | 获取指定平台数据并转换统一格式 | 不跨平台聚合 |
| `server/src/utils/cache.ts` | 内存缓存读写、TTL 过期处理 | 不持久化历史数据 |
| `server/src/schemas/` | 运行时校验外部数据与输出模型 | 不处理页面样式 |

---

## 4. 数据模型与前后端契约

### 4.1 核心 TypeScript 类型

`client/src/types/hot.ts` 与 `server/src/types/hot.ts` 必须保持一致；开发后续可升级为根目录共享包，MVP 先避免增加工程复杂度。

```ts
export type SourceKey = 'weibo' | 'zhihu' | 'bilibili';
export type PlatformStatus = 'success' | 'empty' | 'error';

export interface HotItem {
  rank: number;
  title: string;
  url: string;
  heat?: string;
}

export interface HotPlatform {
  source: SourceKey;
  sourceName: string;
  listName: string;
  status: PlatformStatus;
  updatedAt?: string;
  items: HotItem[];
  message?: string;
}

export interface HotResponse {
  platforms: HotPlatform[];
  generatedAt: string;
  cacheTtlSeconds: number;
}
```

### 4.2 字段规则

| 字段 | 规则 |
|---|---|
| `rank` | 正整数；平台没有提供明确名次时，按有效条目顺序生成 |
| `title` | 去除首尾空格后不能为空，空标题过滤 |
| `url` | 必须为可解析的 `http` / `https` 链接；非法链接过滤 |
| `heat` | 可选；仅原样展示，不跨平台比较 |
| `items` | 首页默认显示每个平台前 10 条；API 可允许上限 20 条 |
| `updatedAt` | 可选；仅在成功取得数据或有效空结果时返回其 ISO 8601 时间，错误状态不伪造更新时间 |
| `status` | `success`、`empty`、`error` 三类数据状态；loading 属于前端请求状态 |
| `message` | 仅用于空状态或失败提示，不返回内部异常栈 |

### 4.3 前端 Loading 状态说明

`loading` 是页面在等待 API 返回时的 UI 状态，不属于后端 `PlatformStatus`。这样后端契约保持简单，前端仍能完成 Day 9 的骨架屏或加载提示。

---

## 5. API 设计

### 5.1 健康检查

```http
GET /api/health
```

成功响应：

```json
{
  "ok": true
}
```

用途：本地确认后端启动、Railway 部署后确认服务在线。

### 5.2 单平台接口

```http
GET /api/hot/:source
```

合法 `source`：

```text
weibo | zhihu | bilibili
```

可选 query：

| 参数 | 示例 | 规则 |
|---|---|---|
| `limit` | `?limit=10` | 默认 10；允许 1–20 |
| `refresh` | `?refresh=1` | 仅开发环境允许跳过缓存；生产环境忽略或拒绝 |

成功响应示例：

```json
{
  "source": "weibo",
  "sourceName": "微博",
  "listName": "热搜榜",
  "status": "success",
  "updatedAt": "2026-05-28T09:00:00.000Z",
  "items": [
    {
      "rank": 1,
      "title": "示例热点标题",
      "url": "https://s.weibo.com/top/summary",
      "heat": "1234567"
    }
  ]
}
```

上游失败响应示例：

```json
{
  "source": "weibo",
  "sourceName": "微博",
  "listName": "热搜榜",
  "status": "error",
  "updatedAt": "2026-05-28T09:00:00.000Z",
  "items": [],
  "message": "暂时获取失败，请稍后再试"
}
```

HTTP 状态约定：

| 场景 | 状态码 | 说明 |
|---|---:|---|
| 合法 source，成功或有效空数据 | `200` | 前端正常渲染卡片 |
| source 不合法 | `404` | 返回可读错误信息 |
| 合法 source，但上游获取失败 | `502` | 响应体仍返回标准 `HotPlatform` 错误结构 |

### 5.3 聚合接口

```http
GET /api/hot?limit=10
```

成功或部分失败响应示例：

```json
{
  "generatedAt": "2026-05-28T09:00:00.000Z",
  "cacheTtlSeconds": 600,
  "platforms": [
    {
      "source": "weibo",
      "sourceName": "微博",
      "listName": "热搜榜",
      "status": "success",
      "updatedAt": "2026-05-28T09:00:00.000Z",
      "items": [
        {
          "rank": 1,
          "title": "示例微博热点",
          "url": "https://s.weibo.com/top/summary",
          "heat": "1234567"
        }
      ]
    },
    {
      "source": "zhihu",
      "sourceName": "知乎",
      "listName": "热榜",
      "status": "error",
      "items": [],
      "message": "暂时获取失败，请稍后再试"
    },
    {
      "source": "bilibili",
      "sourceName": "B站",
      "listName": "热门",
      "status": "success",
      "updatedAt": "2026-05-28T09:00:00.000Z",
      "items": []
    }
  ]
}
```

聚合接口状态码约定：

| 场景 | 状态码 |
|---|---:|
| 至少一个平台获取成功或返回有效空数据 | `200` |
| 三个平台均失败 | `503` |
| query 参数非法 | `400` |

---

## 6. 数据源与 Provider 策略

### 6.1 接入原则

- 浏览器只能请求本站 Express API，不得直接请求微博、知乎、B站数据地址；
- 真实平台数据仅在 `server/src/providers/` 中处理；
- Provider 输出必须转换成统一 `HotPlatform` / `HotItem` 数据模型；
- 外部响应一律视为不可信输入，使用 Zod 或明确字段检查后再返回；
- 每个平台独立失败，聚合接口不可因一个来源失败而整体白屏；
- 不实现 HTML 页面解析、Cookie 携带、账号模拟登录或绕过反爬策略；
- 若直接 JSON 数据源不稳定，可在 Provider 层更换为经过验证且合规的聚合数据服务，并在 README 标明来源和限制。

### 6.2 分阶段数据切换

| 阶段 | 数据来源 | 目的 |
|---|---|---|
| Day 7–9 | `client/src/mock/hot.json` | 完成首页 UI、响应式、卡片状态 |
| Day 10–12 | Express Mock Provider | 完成 API 联调、代理、缓存验证 |
| Day 13 | `weibo.ts` 真实 Provider | 第一个真实榜单上线 |
| Day 14 | `zhihu.ts` 真实 Provider | 第二个平台上线并验证隔离 |
| Day 15 | `bilibili.ts` 真实 Provider | 三平台真实数据收官 |
| Day 16–21 | 真实 Provider | 测试、修复、部署和公开分享 |

### 6.3 Provider 接口建议

```ts
import type { HotPlatform, SourceKey } from '../types/hot';

export interface HotProvider {
  source: SourceKey;
  fetchHot(limit: number): Promise<HotPlatform>;
}
```

Provider 必须做到：

- 请求超时后抛出可识别错误；
- 对外只返回标准模型；
- 不把第三方原始响应、Cookie 或错误堆栈返回给浏览器；
- 解析字段改变时，只修改对应 Provider，而不影响 UI 或其他平台。

---

## 7. 缓存方案

### 7.1 MVP 缓存规则

缓存位于 Express 后端内存中，每个平台独立缓存：

```text
hot:weibo
hot:zhihu
hot:bilibili
```

| 项目 | 规则 |
|---|---|
| 实现方式 | `Map<string, CacheEntry<HotPlatform>>` |
| 默认 TTL | `600` 秒，可通过 `CACHE_TTL` 设置 |
| 缓存对象 | 成功获取的标准化平台数据 |
| 不缓存内容 | 请求错误结果；避免长时间展示故障状态 |
| 读取逻辑 | 未过期则直接返回，并记录 `[cache hit]` 日志 |
| 写入逻辑 | Provider 获取成功后写入，并记录 `[cache miss]` 日志 |
| 强制刷新 | `?refresh=1` 仅开发环境可用 |
| 多实例限制 | Railway 若存在多实例或重启，内存缓存不会共享或持久化；MVP 可接受 |

### 7.2 缓存工具接口

```ts
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

getCache<T>(key: string): T | undefined;
setCache<T>(key: string, data: T, ttlSeconds: number): void;
deleteCache(key: string): void;
clearCache(): void;
```

### 7.3 缓存验证方式

Day 12 需要完成以下验证：

1. 设置 `CACHE_TTL=600`；
2. 第一次请求 `/api/hot/weibo`，终端打印 `[cache miss]`；
3. 10 分钟内再次请求同一接口，终端打印 `[cache hit]`；
4. 命中缓存时 `updatedAt` 保持不变；
5. 开发环境使用 `?refresh=1` 时重新产生数据；
6. 三个平台使用不同缓存 key，一个平台刷新不影响其他平台。

---

## 8. 前端实现设计

### 8.1 首页组件结构

```text
App
└── Layout
    ├── Header
    ├── HotGrid
    │   ├── HotCard (微博)
    │   │   └── HotList
    │   ├── HotCard (知乎)
    │   │   └── HotList
    │   └── HotCard (B站)
    │       └── HotList
    └── Footer
```

### 8.2 页面状态

| 状态 | 触发时机 | 页面表现 |
|---|---|---|
| Loading | 首次请求进行中 | 三张卡片骨架或“加载中”占位 |
| Success | 平台返回有效数据 | 展示 Top 10 列表、更新时间 |
| Empty | 平台返回成功但 `items=[]` | 展示“暂无数据” |
| Error | 某平台接口错误 | 卡片显示友好错误提示；其他卡片正常 |

Day 17 可添加单卡“重试”按钮，它重新请求该平台接口；Day 18 可按课程任务增加全页刷新按钮。它们属于课程体验完善功能，不扩展产品范围。

### 8.3 视觉与响应式要求

- 页面风格：信息密度适中、干净、轻量；
- 主容器最大宽度居中显示；
- 桌面端：三列卡片；
- 中等屏幕：可降为两列；
- 手机端：单列卡片；
- Top 1–3 排名使用轻度视觉强调；
- 标题 hover 有清晰反馈；
- 卡片错误状态不可导致整页布局塌陷；
- 页脚包含学习项目、非官方来源、非商用与原平台为准说明。

### 8.4 外链安全

标题跳转必须使用：

```tsx
<a href={item.url} target="_blank" rel="noopener noreferrer">
```

不为无效 URL 渲染可点击跳转。

---

## 9. 本地开发与前后端联调

### 9.1 本地端口

| 服务 | 默认地址 |
|---|---|
| Vite 前端 | `http://localhost:5173` |
| Express 后端 | `http://localhost:3001` |

### 9.2 Vite 开发代理

`client/vite.config.ts` 配置 `/api` 代理：

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

开发环境前端只请求相对路径 `/api/hot`，无需处理跨域。

### 9.3 生产 API Base URL

生产环境前端读取公开环境变量：

```env
VITE_API_BASE=https://your-server.up.railway.app
```

前端 API 封装规则：

```ts
const apiBase = import.meta.env.VITE_API_BASE ?? '';
fetch(`${apiBase}/api/hot`);
```

`VITE_` 前缀变量会进入浏览器构建产物，只允许存放公开的后端域名，禁止放 token、Cookie 或密钥。

---

## 10. 后端安全、CORS 与环境变量

### 10.1 后端环境变量

`server/.env.example`：

```env
PORT=3001
CACHE_TTL=600
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

生产环境：

```env
CACHE_TTL=600
CLIENT_ORIGIN=https://your-client.vercel.app
NODE_ENV=production
```

后续若真实数据源需要公开的 base URL，可新增服务端专属变量；任何凭据不得提交 GitHub。

### 10.2 CORS 策略

- 本地开发允许 `http://localhost:5173`；
- 生产环境只允许 `CLIENT_ORIGIN` 配置的 Vercel 前端域名；
- 不使用允许任意来源的生产配置；
- `/api/health` 与 `/api/hot*` 均遵守相同 CORS 策略。

### 10.3 请求安全约束

- 仅请求 Provider 中固定配置的数据源，不接受客户端传入任意外部 URL；
- 如上游文档明确要求，可设置必要 `User-Agent` / `Referer`；
- 禁止硬编码 Cookie、用户凭据或用于规避限制的 Header；
- 请求失败时服务端记录必要错误信息，前端只展示通用提示；
- 对上游请求设置超时，建议 8 秒以内。

---

## 11. 部署方案

### 11.1 前端：Vercel

| 配置项 | 设置 |
|---|---|
| Git 来源 | GitHub 仓库 |
| Root Directory | `client` |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| 环境变量 | `VITE_API_BASE=https://<railway-backend-domain>` |

上线验证：

- 首页可打开；
- Network 请求指向 Railway API；
- 三张卡片可加载；
- 手机宽度布局正常；
- 页脚声明可见。

### 11.2 后端：Railway

| 配置项 | 设置 |
|---|---|
| Git 来源 | 同一 GitHub 仓库 |
| Root Directory / 服务目录 | `server` |
| Build Command | `npm run build` |
| Start Command | `npm start` |
| 环境变量 | `CACHE_TTL=600`、`CLIENT_ORIGIN=<vercel-url>`、`NODE_ENV=production` |
| 健康检查 | `/api/health` |

上线顺序：

```text
1. 部署 server 至 Railway，获得后端 HTTPS 地址
2. 验证 /api/health 与 /api/hot
3. 将 Railway 地址写入 Vercel 的 VITE_API_BASE
4. 部署 client 至 Vercel
5. 用浏览器验证前后端联通及三平台状态
```

### 11.3 部署限制说明

- 内存缓存会在后端重启时清空；对学习项目与低流量 MVP 可接受；
- 若未来需要稳定旧数据回退、历史榜或多个实例共享缓存，再升级为 Redis / KV；
- 部署平台的免费额度或计费规则可能变化，实际发布前在平台控制台确认使用计划。

---

## 12. 测试与验收方案

### 12.1 自动化测试范围

#### Server

| 测试对象 | 必测内容 |
|---|---|
| `cache.ts` | set/get、TTL 过期、不同平台 key 隔离 |
| Provider 转换 | 合法数据转标准模型；空标题/非法 URL 被过滤；异常被捕获 |
| `hotService.ts` | 单平台失败时聚合结果仍包含其他成功平台 |
| API route | `/api/health`、合法 source、非法 source、聚合响应与错误状态 |

#### Client

| 测试对象 | 必测内容 |
|---|---|
| `HotCard` | success / empty / error 显示正确 |
| `HotList` | Top 3 样式类、heat 可选显示、外链安全属性 |
| `App` 或 API hook | loading 后显示数据；部分失败页面不白屏 |

### 12.2 手动验收清单

| 验收项 | 完成标准 |
|---|---|
| Mock 页面 | 三张卡片各显示 10 条 Mock 数据 |
| Mock API | 首页全部数据来自 Express 接口，不直接读取 JSON |
| 真实数据 | 微博、知乎、B站均展示不少于 10 条可点击内容，若某来源当天不稳定需记录错误与替代方案 |
| 缓存 | 10 分钟内重复请求出现 cache hit，不反复请求外部数据源 |
| 错误隔离 | 手动让一个平台失败，其余卡片继续显示 |
| 响应式 | 桌面三列，手机单列且文字可读 |
| 构建 | `client npm run build` 与 `server npm run build` 均成功 |
| 部署 | Vercel 首页可访问，Railway API 可访问，线上前后端联通 |
| 合规 | 页脚声明完整，README 说明数据来源和更新频率 |

---

## 13. 21 天课程开发映射

| 教程阶段 | 本方案对应实现 | 关键输出 |
|---|---|---|
| Day 3–6 | 文档阶段 | `RESEARCH.md`、`PRD.md`、`TECH_DESIGN.md`、`AGENTS.md` |
| Day 7 | 初始化 `client/`，可选初始化 `server/` | Vite 页面可运行、类型和 Mock 数据 |
| Day 8 | HotCard / HotGrid / Layout | 三卡 Mock 首页 |
| Day 9 | loading / empty / error | 三态截图 |
| Day 10 | Express 与微博 Mock API，Vite proxy | Network 请求截图 |
| Day 11 | 三平台 Mock API 与聚合接口 | 首页 100% 来自后端 |
| Day 12 | 内存缓存 | `[cache hit]` 日志 |
| Day 13–15 | 三个平台真实 Provider | 真实数据页面与 README 来源说明 |
| Day 16–18 | 测试、重试/刷新体验、构建 | Bug/优化清单与 build 截图 |
| Day 19–20 | Vercel + Railway 部署 | 公网 HTTPS 链接 |
| Day 21 | 总结、反馈与小修复 | 项目总结与反馈记录 |

---

## 14. Codex 与 Claude Code 协作规则

### 14.1 Codex 负责主开发

每轮任务要求 Codex：

- 先读取 `PRD.md`、`TECH_DESIGN.md`、`AGENTS.md`；
- 只实现当日指定功能，不提前扩展；
- 运行该轮涉及的开发、测试或构建命令；
- 汇报修改文件、验证结果、仍存在的问题。

### 14.2 Claude Code 负责审查与排错

Claude Code 仅在以下情形介入：

- Codex 生成后进行独立代码审查；
- 页面或 API 报错，需要定位原因；
- 真实数据解析失败，需要检查字段转换；
- 部署阶段出现 CORS、环境变量、构建错误。

原则：同一轮只让一个代理进行主要修改，避免两个代理同时重构造成文件冲突。

---

## 15. 技术风险与应对

| 风险 | 影响 | MVP 处理方式 | 后续升级方向 |
|---|---|---|---|
| 平台 JSON 数据源变化或限制访问 | 某卡片无数据 | Provider 独立失败，页面显示错误；记录替代来源 | 更换合规数据源或建立稳定数据层 |
| Express 内存缓存重启丢失 | 重启后首次请求重新拉取 | MVP 接受 | Redis / KV 与旧数据回退 |
| Railway / Vercel 环境变量配置错误 | 线上跨域或接口失败 | README 中列出检查表；健康接口验证 | 自动化部署与环境检查 |
| CORS 配置错误 | 浏览器请求失败 | 本地 proxy + 生产限定 `CLIENT_ORIGIN` | 同域部署重构 |
| 用户访问量上升 | 上游压力或额度问题 | 600 秒缓存与低流量分享 | 限流、监控、持久缓存 |
| 功能膨胀影响课程完成 | 延误上线 | 严守三平台 MVP | 上线后规划 P1 |

---

## 16. MVP 技术验收标准

开发完成时，以下条件必须全部满足：

- [ ] 仓库包含 `client/` 与 `server/`，两者均可本地启动；
- [ ] 前端使用 React + TypeScript + Vite + CSS Modules；
- [ ] 后端使用 Node.js + Express + TypeScript；
- [ ] 三个平台数据遵守统一 `HotPlatform` / `HotItem` 模型；
- [ ] `GET /api/health`、`GET /api/hot/:source`、`GET /api/hot` 可用；
- [ ] 三张卡片最终来自真实数据，不依赖生产 Mock；
- [ ] 单平台失败不会导致其他平台或页面白屏；
- [ ] `CACHE_TTL=600` 生效，并完成缓存命中验证；
- [ ] 页面在桌面与手机宽度下布局正确；
- [ ] 外链使用安全属性；
- [ ] README 包含本地启动、环境变量、数据来源、缓存和部署说明；
- [ ] 前端通过 Vercel 发布，后端通过 Railway 发布，公网 HTTPS 链接可访问；
- [ ] 未引入 AI 摘要、自动推送、用户系统、历史榜等超范围功能。

---

## 17. 下一步执行任务

架构与代理文档已完成同步：

- `PRD.md v0.4`：已统一前后端分离、Mock 阶段、缓存与课程增强范围；
- `AGENTS.md v0.3`：已统一 Codex 的 Vite / Express / CSS Modules / 内存缓存规则；
- `CLAUDE.md v0.1`：已明确 Claude Code 负责审查与排错的协作边界。

下一步可生成 **Day 7 专用 Codex 提示词**，初始化 `client/` 前端项目与可选 `server/` 健康检查空壳，正式进入 Build 阶段。


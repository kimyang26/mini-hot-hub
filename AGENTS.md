# AGENTS.md｜今日热搜榜 · Codex 开发指令

> 版本：v0.3（课程兼容架构同步版）  
> 日期：2026-05-28  
> 适用对象：Codex 及执行代码修改的 AI 代理  
> 关联文档：`PRD.md v0.4`、`TECH_DESIGN.md v0.4`、`CLAUDE.md`

---

## 1. 开发目标

开发一个可公开访问的「今日热搜榜」MVP：用户打开网页即可查看 **微博、知乎、B站** 三个平台的热榜卡片；列表最终来自真实数据；一个平台失败时，其余平台仍可浏览；前端与后端分别部署后可通过 HTTPS 链接分享。

开发过程按 21 天教程的小步路线推进：先 Mock UI，再 Mock API 与缓存，之后逐一接入真实平台数据，最后测试与部署。

---

## 2. 执行前必须读取的文件

开始每轮任务前，先读取并遵守：

1. `PRD.md`：决定做什么、不做什么；
2. `TECH_DESIGN.md`：决定架构、接口、数据模型与部署方式；
3. `AGENTS.md`：决定代码纪律、测试与交付报告方式。

若用户当轮明确要求与文档冲突，以用户最新要求为准，并在交付说明中指出需要同步更新的文档，不要静默改变整体架构。

---

## 3. 固定技术方案

### 3.1 必须采用

| 模块 | 固定方案 |
|---|---|
| 仓库结构 | `client/` + `server/` 前后端分离 |
| 前端 | React + TypeScript + Vite |
| 样式 | CSS Modules + 必要的全局 CSS，不引入 Tailwind 或 UI 框架 |
| 后端 | Node.js + Express + TypeScript |
| 运行时校验 | Zod，用于真实外部响应或环境变量校验 |
| 缓存 | Express 服务端内存 `Map`，默认 TTL 600 秒 |
| 前端部署 | Vercel，Root Directory 为 `client` |
| 后端部署 | Railway，服务目录为 `server` |
| 主开发工具 | Codex |

### 3.2 不得擅自更换

除非用户明确要求，不得将项目改为：

- Next.js 单项目；
- Tailwind、组件库或复杂设计系统；
- Redis / KV / 数据库缓存；
- Serverless API、Cloudflare Worker 或其他部署架构；
- 本期范围外的 AI 摘要、推送、登录、历史榜或新增平台。

---

## 4. MVP 范围与阶段边界

### 4.1 本期最终必须完成

- 首页三张卡片：微博热搜、知乎热榜、B站热门；
- 每卡默认展示 Top 10，条目包含 `rank`、`title`、`url`，`heat` 可选；
- 真实数据接入；
- Loading、Empty、Error 与 Success 页面表现；
- 单平台失败隔离；
- 服务端内存缓存与缓存命中验证；
- 错误卡片的单卡重试；
- 桌面三列、手机单列响应式布局；
- 页脚非官方/学习项目/更新频率声明；
- Vercel 前端与 Railway 后端线上联通。

### 4.2 各开发阶段允许实现的内容

| 阶段 | 允许的数据与功能 | 不要提前做的事情 |
|---|---|---|
| Day 7–9 | `client/src/mock/hot.json`、UI 与三态 | 不请求真实平台、不搭复杂后端 |
| Day 10–11 | Express Mock API、Vite proxy、聚合接口 | 不急于接入真实数据 |
| Day 12 | 内存缓存、日志与开发用 refresh 参数 | 不加入持久化缓存 |
| Day 13–15 | 三个平台真实 Provider | 不扩展第四平台 |
| Day 16–18 | 测试、单卡重试、可选全页刷新与视觉优化 | 不加入 AI 或账号功能 |
| Day 19–21 | 部署、修复、总结 | 不进行大规模重构 |

### 4.3 明确不做

- 抖音、YouTube、小红书、X、Reddit、即刻等更多平台；
- 今日 10 条 AI 摘要、定时任务或自动推送；
- 登录、注册、订阅、收藏或用户偏好；
- 历史榜、总榜、舆情分析、管理后台；
- Redis / KV / 数据库、最近成功数据持久化回退；
- HTML 抓取、Cookie 绕过、模拟登录或规避平台限制的代码。

---

## 5. 推荐项目结构

尽量保持以下结构，确需调整时说明原因：

```text
mini-hot-hub/
├── PRD.md
├── TECH_DESIGN.md
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── client/
│   ├── src/
│   │   ├── api/hot.ts
│   │   ├── components/
│   │   │   ├── Layout.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── HotGrid.tsx
│   │   │   ├── HotCard.tsx
│   │   │   ├── HotList.tsx
│   │   │   └── Footer.tsx
│   │   ├── mock/hot.json
│   │   ├── types/hot.ts
│   │   ├── utils/formatRelativeTime.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── vite.config.ts
│   └── .env.example
└── server/
    ├── src/
    │   ├── routes/hot.ts
    │   ├── providers/
    │   │   ├── mock.ts
    │   │   ├── weibo.ts
    │   │   ├── zhihu.ts
    │   │   └── bilibili.ts
    │   ├── services/hotService.ts
    │   ├── schemas/hot.ts
    │   ├── types/hot.ts
    │   ├── utils/cache.ts
    │   └── index.ts
    ├── tests/
    └── .env.example
```

职责边界：

- `client/src/components/` 只负责展示与交互，不解析外部平台响应；
- `client/src/api/` 只请求本站 Express API；
- `client/src/mock/` 只用于 Day 7–9 或测试，不用于线上数据；
- `server/src/providers/` 只负责单个平台的请求与统一转换；
- `server/src/services/` 负责聚合、缓存调用与失败隔离；
- `server/src/routes/` 只处理 HTTP 参数和响应；
- `server/src/utils/cache.ts` 只负责内存缓存，不扩展持久化能力。

---

## 6. 统一数据模型与 API 规则

### 6.1 类型定义

前后端 `HotItem` 与 `HotPlatform` 必须同构：

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

### 6.2 API 必须实现

```http
GET /api/health
GET /api/hot/:source
GET /api/hot
```

约束：

- `source` 只允许 `weibo`、`zhihu`、`bilibili`；
- `limit` 默认 10，允许 1–20；
- `?refresh=1` 仅开发环境可绕过缓存；生产环境不得提供强制刷新能力；
- 聚合接口中一个平台失败时，仍返回其他平台结果；
- 错误响应只返回友好 `message`，不得返回原始错误栈或第三方响应正文；`error` 状态不得伪造数据更新时间。

### 6.3 外部数据处理

- 外部响应一律按 `unknown` 处理后校验，禁止用 `any` 直接透传；
- 空标题、非法 URL 或无效条目必须过滤；
- `heat` 缺失时正常展示，不制造热度字段；
- 不跨平台比较热度；
- 浏览器不得直接请求任何热榜外部域名。

---

## 7. 请求、缓存与安全规范

### 7.1 缓存

- 缓存使用服务端内存 `Map`；
- 缓存 key 必须按平台隔离：`hot:weibo`、`hot:zhihu`、`hot:bilibili`；
- TTL 从 `CACHE_TTL` 读取，未配置时默认为 `600` 秒；
- 只缓存成功标准化的数据，不缓存错误结果；
- 命中缓存需输出简洁 `[cache hit]` 日志，便于 Day 12 验证；
- 不为本期引入 Redis / KV 或旧数据回退。

### 7.2 网络与环境变量

- 本地前端端口默认 `5173`，后端端口默认 `3001`；
- Vite 将 `/api` 代理到 `http://localhost:3001`；
- 生产前端通过 `VITE_API_BASE` 访问 Railway 后端；
- 后端使用 `CLIENT_ORIGIN` 限定生产 CORS 来源；
- `.env` 文件必须被忽略，不提交 token、Cookie 或密钥；
- 仅在上游明确需要时设置必要 `User-Agent` / `Referer`，不得加入规避限制的 Header 或登录态凭据。

### 7.3 外链安全

所有原平台链接使用：

```tsx
<a href={item.url} target="_blank" rel="noopener noreferrer">
```

---

## 8. UI 与代码风格

### 8.1 设计要求

- 信息清晰、卡片分区明确、页面轻量；
- 桌面三列，中等宽度可两列，手机单列；
- Top 1–3 仅做克制的视觉强调；
- 标题可两行截断；
- 失败卡片保持布局完整并显示重试入口；
- 页脚展示学习项目、非官方来源、版权与约 10 分钟更新说明；
- 只使用 CSS Modules 和必要全局 CSS，不引入 Tailwind、UI 组件库或复杂动效。

### 8.2 代码规则

- React 使用函数式组件与 Hooks；
- 组件名 `PascalCase`，函数、变量与文件工具函数使用 `camelCase`；
- TypeScript 使用严格类型，业务代码不得以 `any` 逃避类型问题；
- 平台请求地址、显示名称和缓存 key 采用集中配置；
- 不在 UI 层复制 Provider 转换逻辑；
- 不保留无用依赖、临时日志、空路由或超范围占位模块；
- 注释解释关键原因与外部字段映射，不重复描述明显代码。

---

## 9. 测试与手动验收

### 9.1 自动化测试最低范围

#### Server

- `cache.ts`：读写、TTL 过期、平台 key 隔离；
- Provider：合法响应转换、异常响应处理、空标题/非法 URL 过滤；
- `hotService.ts`：单平台失败不影响其他结果；
- Route：健康检查、合法/非法 source、聚合接口响应。

#### Client

- `HotCard`：success / empty / error 正确展示；
- `HotList`：Top 3 样式类、heat 可选、外链安全属性；
- 首页：loading 后展示数据，部分失败时页面不白屏。

### 9.2 每日验证要求

| 阶段 | 至少验证的结果 |
|---|---|
| UI Mock | 三张卡片各显示 10 条 Mock 数据，桌面和手机布局正确 |
| Mock API | 前端请求经过 `/api`，不再直接依赖页面内 JSON |
| 缓存 | 两次请求中第二次可看到 `[cache hit]`，缓存期内 `updatedAt` 不变 |
| 真实数据 | 每个平台尽可能显示不少于 10 条有效条目；不足时真实报告原因 |
| 错误隔离 | 模拟某一平台失败，其他平台仍显示 |
| 构建 | `client` 与 `server` 分别通过 build |
| 部署 | Vercel 首页和 Railway API 均可访问，线上联通正常 |

---

## 10. Codex 工作方式与交付格式

### 10.1 每轮任务纪律

- 只完成用户指定的当日/当轮目标；
- 开始修改前先说明会修改哪些模块；
- 尽量小范围改动，避免在一轮中同时重构目录、样式和数据层；
- 遇到真实数据源不可用时，报告错误和备选路线，不伪造成功结果；
- 完成后运行当轮相关命令并如实报告。

### 10.2 适用命令

根据任务所在目录运行适用命令，例如：

```bash
cd client && npm run dev
cd client && npm run build
cd client && npm run test

cd server && npm run dev
cd server && npm run build
cd server && npm run test
```

若脚本尚未在当前阶段创建，明确说明“尚未配置”，不要声称通过。

### 10.3 交付回复必须包含

```text
已完成：
- ...

修改文件：
- ...

验证结果：
- 执行的命令：通过 / 未通过及原因
- 页面或 API 手动验证：已验证 / 未验证及原因

仍需配置或风险：
- ...

本轮未实现（按范围保留至后续）：
- ...
```

---

## 11. 与 Claude Code 协作

Codex 是主开发代理。Claude Code 默认承担独立审查、故障定位与指定范围修复，规则见 `CLAUDE.md`。

同一轮开发中，不要让两个代理同时进行未经协调的大范围修改；完成 Codex 修改并验证后，再由 Claude 针对问题检查或修复。

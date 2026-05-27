# Day 7｜Codex 正式开发提示词：初始化项目与基础框架

请在当前 GitHub 仓库中直接完成本轮开发任务，不要只给出教程、代码片段或伪代码。

## 0. 开始前必须做的事

请先阅读仓库根目录中的以下文件，并严格遵守其中约束：

- `PRD.md`
- `TECH_DESIGN.md`
- `AGENTS.md`

说明：
- `AGENTS.md` 是本项目的执行规则。
- `CLAUDE.md` 仅供 Claude Code 协作审查时使用，不需要据此改变本轮实现。
- 如果仓库中已经存在部分代码，请先检查现状，在不破坏已有文档和正确配置的前提下补全本轮任务。
- 不要修改上述文档，除非你发现阻断开发的明确冲突；如发现冲突，仅在交付报告中说明，不要自行改写产品范围。

## 1. 本轮目标

完成 Day 7「初始化项目与基础框架」：

1. 在 `client/` 创建可运行的 React + TypeScript + Vite 前端项目；
2. 创建前端基础目录、统一类型文件和三平台 Mock 数据；
3. 在 `server/` 创建最小可运行的 Node.js + Express + TypeScript 后端空壳；
4. 后端只实现健康检查接口，暂不实现热榜 API；
5. 确保前后端均可启动，且前端可看到一个简洁的项目初始化成功页面。

本轮目的是把工程骨架搭稳，为 Day 8 的热榜卡片页面和 Day 10 的 Mock API 做准备。

## 2. 固定技术方案

必须使用：

- 前端：React + TypeScript + Vite
- 前端样式：CSS Modules + 必要的全局 CSS
- 后端：Node.js + Express + TypeScript
- 包管理器：npm

禁止引入：

- Next.js
- Tailwind CSS
- UI 组件库
- 数据库、Redis、KV
- 真实热榜数据源
- AI 摘要、自动推送、登录、历史榜或新增平台

## 3. 前端任务：`client/`

### 3.1 初始化与目录

在 `client/` 初始化 Vite React TypeScript 项目，并整理为以下结构：

```text
client/
├── src/
│   ├── api/
│   │   └── .gitkeep
│   ├── components/
│   │   └── .gitkeep
│   ├── mock/
│   │   └── hot.json
│   ├── types/
│   │   └── hot.ts
│   ├── App.tsx
│   ├── App.module.css
│   ├── index.css
│   └── main.tsx
├── .env.example
├── package.json
├── tsconfig.json
└── vite.config.ts
```

要求：

- 清除 Vite 默认演示内容和无用资源；
- `api/` 与 `components/` 本轮可先保留为空目录，用 `.gitkeep` 使其可提交；
- 不在本轮提前创建 `HotCard`、`HotList` 或数据请求逻辑。

### 3.2 类型定义

创建 `client/src/types/hot.ts`，定义以下类型，字段必须与 `TECH_DESIGN.md` 一致：

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

### 3.3 Mock 数据

创建 `client/src/mock/hot.json`，格式符合 `HotResponse`，包含三个平台：

- `weibo`：微博 / 热搜榜
- `zhihu`：知乎 / 热榜
- `bilibili`：B站 / 热门

Mock 数据要求：

- 每个平台 `status` 为 `"success"`；
- 每个平台有 10 条数据；
- 每条包含 `rank`、`title`、`url`，可包含 `heat`；
- 标题要像真实热点标题，但明确属于模拟展示数据，不要声称是真实今日热点；
- 链接可使用安全的占位链接，例如对应平台首页或 `https://example.com/...`；
- `updatedAt` 与 `generatedAt` 使用合法 ISO 8601 字符串；
- `cacheTtlSeconds` 为 `600`。

### 3.4 初始化页面

修改 `App.tsx` 与样式文件，展示一个轻量、干净的初始化成功页即可，内容包含：

- 页面标题：`今日热搜榜`
- 副标题：`多平台热点聚合网站 · 项目初始化完成`
- 一个提示区域：`Day 7：前端与后端基础框架已建立，热榜卡片将在下一轮开发。`
- 页脚：`学习项目 · 当前数据阶段：Mock`

页面要求：

- 不渲染三张热榜卡片；那属于 Day 8；
- 使用 CSS Modules；
- 在桌面与手机宽度下不溢出、不崩坏；
- 不引入图片素材和第三方样式库。

### 3.5 环境变量示例

创建 `client/.env.example`：

```env
VITE_API_BASE=
```

说明：本地开发后续通过 Vite proxy 请求 `/api`，生产环境再配置后端公网地址。本轮不实现 API 请求。

## 4. 后端任务：`server/`

### 4.1 初始化后端项目

创建最小 Express + TypeScript 项目：

```text
server/
├── src/
│   └── index.ts
├── .env.example
├── package.json
├── tsconfig.json
└── .gitignore
```

依赖仅包含完成本轮任务所必需的包，例如：

- 运行依赖：`express`、`cors`、`dotenv`
- 开发依赖：`typescript`、`tsx`、`@types/node`、`@types/express`、`@types/cors`

不要在本轮引入 Zod、测试框架、缓存模块或 Provider 文件，它们在后续任务真正使用时再加入。

### 4.2 健康检查接口

在 `server/src/index.ts` 中实现：

```http
GET /api/health
```

响应：

```json
{
  "ok": true
}
```

后端要求：

- 默认端口为 `3001`，支持通过 `PORT` 环境变量覆盖；
- 配置 CORS，开发环境允许 `http://localhost:5173`；
- 启动时在终端输出可读的服务地址；
- 只实现 `/api/health`，不得提前实现 `/api/hot`、缓存或真实平台请求。

### 4.3 环境变量示例

创建 `server/.env.example`：

```env
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
CACHE_TTL=600
```

说明：`CACHE_TTL` 仅为后续 Day 12 预留，本轮不要实现缓存逻辑。

### 4.4 npm scripts

`server/package.json` 至少提供：

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

确保 TypeScript 编译输出路径与 `start` 命令一致。

## 5. 仓库级处理

仅在必要时创建或更新根目录 `.gitignore`，确保忽略：

```text
node_modules/
dist/
.env
.env.*
!.env.example
```

不要在本轮：

- 初始化部署平台配置；
- 创建 Vercel 或 Railway 的生产配置；
- 添加根目录并行启动脚本；
- 提交密钥或真实环境变量；
- 修改 PRD、TECH_DESIGN、AGENTS 的产品范围。

## 6. 本轮明确不做

停止在以下边界之前：

- 不开发热榜卡片 UI；
- 不渲染 Mock 榜单列表；
- 不创建 `/api/hot` 或 `/api/hot/:source`；
- 不接入微博、知乎、B站真实数据；
- 不实现内存缓存；
- 不实现 loading / error / retry；
- 不部署线上环境；
- 不重构为其他技术栈。

## 7. 验证要求

完成修改后，请实际运行最相关的验证命令。

前端至少执行：

```bash
cd client
npm install
npm run build
```

后端至少执行：

```bash
cd server
npm install
npm run build
```

如执行环境允许，请进一步完成本地冒烟验证：

1. 启动后端 `npm run dev`；
2. 请求 `http://localhost:3001/api/health`；
3. 确认返回 `{ "ok": true }`；
4. 启动前端 `npm run dev`；
5. 确认初始化页面可打开且无明显布局报错。

如果无法保持开发服务器运行或无法打开浏览器，请真实说明未验证项，不要声称已完成。

## 8. 交付报告格式

完成后请按以下格式汇报：

```markdown
## Day 7 完成结果

### 已完成
- ...

### 新增 / 修改文件
- `路径`：用途

### 安装的依赖
- client：...
- server：...

### 执行的验证命令与实际结果
- `命令`：成功 / 失败；关键信息

### 冒烟验证
- `/api/health`：已验证 / 未验证，结果...
- 前端初始化页面：已验证 / 未验证，结果...

### 未实现内容（按计划留给后续）
- 热榜卡片页面
- Mock API
- 真实数据接入
- 缓存
- 部署

### 需要我处理的事项
- 仅列出确实需要用户手动完成或决策的事项；没有则写“无”
```

请现在直接实施本轮任务，并在完成后提供交付报告。

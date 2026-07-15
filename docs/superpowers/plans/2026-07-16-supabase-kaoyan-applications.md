# Supabase 考研信息登记 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将访问登记表单通过 Next.js 后端和 Supabase PostgreSQL Session Pool 持久化到受 RLS 保护的业务表。

**Architecture:** 浏览器向同源 Route Handler 提交 JSON；服务端模块负责字段校验、密钥校验与 scrypt 哈希，数据库模块使用单例 `pg.Pool` 执行参数化插入。Supabase MCP migration 负责建表，Next.js 从静态导出切换为 Node.js 服务端部署。

**Tech Stack:** Next.js 16 App Router、React 19、TypeScript、PostgreSQL、Supabase MCP、`pg`、Node.js `crypto.scrypt`、Vitest、Testing Library

---

## 文件结构

- Create: `src/server/application-input.ts` — 服务端输入解析、字段约束、密钥验证和哈希。
- Create: `src/server/application-input.test.ts` — 输入与哈希单元测试。
- Create: `src/server/application-repository.ts` — Session Pool 单例与参数化插入。
- Create: `src/server/application-repository.test.ts` — SQL 参数和数据库错误测试。
- Create: `src/app/api/kaoyan-applications/route.ts` — HTTP 状态码和模块编排。
- Create: `src/app/api/kaoyan-applications/route.test.ts` — Route Handler 请求测试。
- Modify: `src/lib/core.ts`、`src/lib/core.test.ts` — 客户端只检查必填字段，不再内置密钥真值。
- Modify: `src/components/access-gate.tsx`、`src/components/session-gate.test.tsx` — 异步提交、状态反馈和成功登录。
- Modify: `next.config.ts`、`package.json`、`package-lock.json`、`.env.example` — Node.js 部署、依赖和环境变量样例。
- Create through Supabase MCP: migration `create_kaoyan_applications` — 建表、约束和 RLS。

### Task 1: 创建 Supabase 业务表

**Files:**
- Remote migration: `create_kaoyan_applications`

- [ ] **Step 1: 检查现有 public schema**

调用 Supabase MCP `list_tables`，参数为 `schemas: ["public"]`、`verbose: true`。预期不存在 `public.kaoyan_applications`；如果已存在，先比对字段和约束，不覆盖用户数据。

- [ ] **Step 2: 应用 migration**

通过 Supabase MCP `apply_migration` 执行：

```sql
create table public.kaoyan_applications (
  id bigint generated always as identity primary key,
  name text not null,
  exam_year smallint not null,
  current_school text not null,
  target_school text not null,
  major text not null,
  access_key_hash text not null,
  created_at timestamptz not null default now(),
  constraint kaoyan_applications_name_length check (char_length(btrim(name)) between 1 and 50),
  constraint kaoyan_applications_exam_year_range check (exam_year between 2026 and 2100),
  constraint kaoyan_applications_current_school_length check (char_length(btrim(current_school)) between 1 and 100),
  constraint kaoyan_applications_target_school_length check (char_length(btrim(target_school)) between 1 and 100),
  constraint kaoyan_applications_major_length check (char_length(btrim(major)) between 1 and 100),
  constraint kaoyan_applications_access_key_hash_length check (char_length(access_key_hash) between 32 and 512)
);

alter table public.kaoyan_applications enable row level security;

revoke all on table public.kaoyan_applications from anon, authenticated;
revoke all on sequence public.kaoyan_applications_id_seq from anon, authenticated;
```

预期：migration 成功且表启用 RLS，不创建匿名写入 policy。

- [ ] **Step 3: 验证 schema 和 advisors**

再次调用 `list_tables`（`verbose: true`），然后分别调用 security 和 performance advisors。预期字段、主键和约束存在；记录 advisor 提示，仅修复与本次表直接相关的安全问题。

### Task 2: 切换 Node.js 部署并安装 PostgreSQL 依赖

**Files:**
- Modify: `next.config.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `.env.example`

- [ ] **Step 1: 修改 Next 配置**

将 `next.config.ts` 改为：

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

- [ ] **Step 2: 安装依赖**

Run: `npm.cmd install pg && npm.cmd install --save-dev @types/pg`

Expected: `package.json` 中 `dependencies.pg` 和 `devDependencies.@types/pg` 存在，lockfile 更新。

- [ ] **Step 3: 添加环境变量样例并调整预览脚本**

创建 `.env.example`：

```dotenv
SUPABASE_POSTGRES_SESSION_POOL_URL="postgresql://postgres.PROJECT_REF:DB_PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres?sslmode=require"
KAOYAN_ACCESS_KEY="replace-with-a-server-only-secret"
```

将 `package.json` 的预览脚本改为：

```json
"preview": "next start"
```

- [ ] **Step 4: 验证依赖与配置**

Run: `npm.cmd run lint`

Expected: exit code 0。

- [ ] **Step 5: Commit**

```powershell
git add -- next.config.ts package.json package-lock.json .env.example
git commit -m "build: enable Next server runtime"
```

### Task 3: 服务端输入校验和密钥哈希

**Files:**
- Create: `src/server/application-input.ts`
- Create: `src/server/application-input.test.ts`

- [ ] **Step 1: 写失败测试**

测试应使用合法样例并断言：字段会 trim、年份转换为数字；空字段、超长字段、非法年份返回字段错误；错误密钥返回 `invalid_access_key`；`hashAccessKey("KY2027")` 不含明文且 `verifyAccessKeyHash` 为真。

核心测试代码：

```ts
const valid = {
  name: " 张同学 ", examYear: "2027", currentSchool: " 湖南大学 ",
  targetSchool: "武汉大学", major: "计算机科学与技术", accessKey: "KY2027",
};

expect(parseApplicationInput(valid, "KY2027")).toMatchObject({
  ok: true,
  data: { name: "张同学", examYear: 2027, currentSchool: "湖南大学" },
});
expect(parseApplicationInput({ ...valid, examYear: "2025" }, "KY2027")).toEqual({
  ok: false, code: "invalid_fields", message: "考研年份必须在 2026 到 2100 之间",
});
expect(parseApplicationInput({ ...valid, accessKey: "wrong" }, "KY2027")).toEqual({
  ok: false, code: "invalid_access_key", message: "访问密钥不正确",
});
const hash = await hashAccessKey("KY2027");
expect(hash).not.toContain("KY2027");
expect(await verifyAccessKeyHash("KY2027", hash)).toBe(true);
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm.cmd run test:run -- src/server/application-input.test.ts`

Expected: FAIL，模块尚不存在。

- [ ] **Step 3: 实现最小服务端模块**

导出以下接口：

```ts
export interface ApplicationInsert {
  name: string;
  examYear: number;
  currentSchool: string;
  targetSchool: string;
  major: string;
  accessKeyHash: string;
}

export function parseApplicationInput(
  value: unknown,
  expectedAccessKey: string,
): { ok: true; data: Omit<ApplicationInsert, "accessKeyHash"> & { accessKey: string } }
 | { ok: false; code: "invalid_fields" | "invalid_access_key"; message: string };

export async function hashAccessKey(accessKey: string): Promise<string>;
export async function verifyAccessKeyHash(accessKey: string, encoded: string): Promise<boolean>;
```

使用 `node:crypto` 的 `randomBytes`、`scrypt` 和 `timingSafeEqual`。编码格式固定为 `scrypt$16384$8$1$<salt-base64url>$<digest-base64url>`；哈希摘要为 64 字节。字段错误按 `name`、`examYear`、`currentSchool`、`targetSchool`、`major`、`accessKey` 顺序返回第一条中文提示。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm.cmd run test:run -- src/server/application-input.test.ts`

Expected: PASS。

- [ ] **Step 5: Commit**

```powershell
git add -- src/server/application-input.ts src/server/application-input.test.ts
git commit -m "feat: validate and hash application input"
```

### Task 4: PostgreSQL repository

**Files:**
- Create: `src/server/application-repository.ts`
- Create: `src/server/application-repository.test.ts`

- [ ] **Step 1: 写失败测试**

向 repository 注入 `{ query: vi.fn() }`，断言 `insertApplication` 使用固定 SQL、六个 `$n` 占位符和正确参数，并返回数据库生成的 ID：

```ts
const query = vi.fn().mockResolvedValue({ rows: [{ id: "42" }] });
await expect(insertApplication(input, { query })).resolves.toBe("42");
expect(query).toHaveBeenCalledWith(expect.stringContaining("values ($1, $2, $3, $4, $5, $6)"), [
  input.name, input.examYear, input.currentSchool, input.targetSchool, input.major, input.accessKeyHash,
]);
```

另测 `SUPABASE_POSTGRES_SESSION_POOL_URL` 缺失时，默认数据库获取函数抛出不含凭据的配置错误。

- [ ] **Step 2: 运行测试确认失败**

Run: `npm.cmd run test:run -- src/server/application-repository.test.ts`

Expected: FAIL，模块尚不存在。

- [ ] **Step 3: 实现 repository**

导出：

```ts
interface Queryable {
  query: (text: string, values: unknown[]) => Promise<{ rows: Array<{ id: string | number }> }>;
}

export async function insertApplication(input: ApplicationInsert, database?: Queryable): Promise<string>;
```

模块级 `globalThis` 缓存一个 `pg.Pool`，连接配置使用 `connectionString`，并在生产连接启用符合 Supabase CA 配置的 SSL。SQL 明确列名并以 `returning id` 结束。错误原样抛给 Route Handler，但不得日志输出参数。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm.cmd run test:run -- src/server/application-repository.test.ts`

Expected: PASS。

- [ ] **Step 5: Commit**

```powershell
git add -- src/server/application-repository.ts src/server/application-repository.test.ts
git commit -m "feat: add Session Pool application repository"
```

### Task 5: Route Handler

**Files:**
- Create: `src/app/api/kaoyan-applications/route.ts`
- Create: `src/app/api/kaoyan-applications/route.test.ts`

- [ ] **Step 1: 写失败测试**

mock `parseApplicationInput`、`hashAccessKey` 和 `insertApplication`，覆盖：合法请求返回 `201`；无效 JSON 返回 `400 invalid_json`；字段错误返回 `422`；密钥错误返回 `401`；环境变量缺失或数据库异常返回安全的 `500 internal_error`。

成功断言：

```ts
const response = await POST(new Request("http://localhost/api/kaoyan-applications", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(valid),
}));
expect(response.status).toBe(201);
await expect(response.json()).resolves.toEqual({ ok: true, id: "42" });
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm.cmd run test:run -- src/app/api/kaoyan-applications/route.test.ts`

Expected: FAIL，Route Handler 尚不存在。

- [ ] **Step 3: 实现 POST**

在 `route.ts` 声明：

```ts
export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response>;
```

拒绝非 JSON 内容类型；安全读取 JSON；从 `process.env.KAOYAN_ACCESS_KEY` 获取服务端密钥；调用解析、哈希和 repository；用 `Response.json` 返回稳定结构。捕获异常时只记录固定文本和 `error instanceof Error ? error.name : "UnknownError"`，不记录 message、请求体或连接串。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm.cmd run test:run -- src/app/api/kaoyan-applications/route.test.ts`

Expected: PASS。

- [ ] **Step 5: Commit**

```powershell
git add -- src/app/api/kaoyan-applications/route.ts src/app/api/kaoyan-applications/route.test.ts
git commit -m "feat: add application intake API"
```

### Task 6: 前端异步提交与隐私文案

**Files:**
- Modify: `src/lib/core.ts`
- Modify: `src/lib/core.test.ts`
- Modify: `src/components/access-gate.tsx`
- Modify: `src/components/session-gate.test.tsx`

- [ ] **Step 1: 更新客户端失败测试**

将 `validateAccess` 改名为 `validateAccessFields`，只验证所有字段非空和年份格式，不在浏览器比较正确密钥。更新 core 测试，断言任意非空密钥通过客户端校验。

在 SessionGate 测试中 mock `fetch`：成功返回 `{ ok: true, id: "42" }` 后显示主站；`500` 时保留访问表单并显示“登记失败，请稍后重试”；请求期间按钮禁用且文字为“正在登记…”。继续断言 `localStorage` 不含 `accessKey`。

- [ ] **Step 2: 运行前端测试确认失败**

Run: `npm.cmd run test:run -- src/lib/core.test.ts src/components/session-gate.test.tsx`

Expected: FAIL，旧组件不会请求 API，也没有提交状态。

- [ ] **Step 3: 实现客户端校验**

`src/lib/core.ts` 仅导出：

```ts
export function validateAccessFields(data: AccessFormData): ValidationResult {
  for (const field of Object.keys(accessLabels) as (keyof AccessFormData)[]) {
    if (!String(data[field] ?? "").trim()) return { ok: false, message: `请填写${accessLabels[field]}` };
  }
  if (!/^\d{4}$/.test(data.examYear)) return { ok: false, message: "请选择有效的考研年份" };
  return { ok: true, message: "" };
}
```

删除浏览器端 `DEMO_ACCESS_KEY` 常量及其测试依赖。

- [ ] **Step 4: 实现异步表单**

`AccessGate.handleSubmit` 改为 `async`，增加 `submitting` 状态。向 `/api/kaoyan-applications` 发送 JSON；只有 `response.ok` 才调用 `onLogin(values)`。失败时优先显示 API 的 `message`，无法解析时显示“登记失败，请稍后重试”。使用 `finally` 恢复按钮。

按钮使用：

```tsx
<button disabled={submitting} className="primary-btn access-submit" type="submit">
  {submitting ? "正在登记…" : <>验证并进入题库 <span aria-hidden="true">→</span></>}
</button>
```

密钥提示改为“访问密钥仅用于服务端验证，不会以明文保存”。隐私说明改为“提交后，备考登记信息将保存到服务端数据库；访问密钥仅保存不可逆哈希。非密钥资料仍会保存在当前浏览器，用于恢复本地会话。”

- [ ] **Step 5: 运行前端测试确认通过**

Run: `npm.cmd run test:run -- src/lib/core.test.ts src/components/session-gate.test.tsx`

Expected: PASS。

- [ ] **Step 6: Commit**

```powershell
git add -- src/lib/core.ts src/lib/core.test.ts src/components/access-gate.tsx src/components/session-gate.test.tsx
git commit -m "feat: submit access registration to backend"
```

### Task 7: 集成验证和文档同步

**Files:**
- Modify if present: `README.md`
- Verify: all changed files

- [ ] **Step 1: 更新运行说明**

若项目存在 `README.md`，把静态导出和 `serve out` 说明替换为：复制 `.env.example` 为 `.env.local`、填写两个服务端变量、运行 `npm.cmd run dev`，生产使用 `npm.cmd run build` 与 `npm.cmd run preview`。不写入真实连接串或密钥。

- [ ] **Step 2: 运行完整测试**

Run: `npm.cmd run test:run`

Expected: 所有测试 PASS，exit code 0。

- [ ] **Step 3: 运行 lint**

Run: `npm.cmd run lint`

Expected: exit code 0，无 ESLint errors。

- [ ] **Step 4: 运行生产构建**

Run: `npm.cmd run build`

Expected: exit code 0，构建输出包含动态 Route Handler `/api/kaoyan-applications`，不再生成纯静态 `out/` 作为部署目标。

- [ ] **Step 5: 浏览器检查**

使用本地服务检查 1440px、768px 和 390px：错误密钥显示服务端提示；数据库不可用时保留表单；提交中无重复请求；成功后进入题库；页面无横向溢出。

- [ ] **Step 6: 检查敏感信息和变更范围**

Run: `git diff --check; git status --short; rg -n "postgresql://|KY2027|SUPABASE_POSTGRES_SESSION_POOL_URL" --glob '!package-lock.json' --glob '!.env.example' .`

Expected: 无真实数据库连接串；`KY2027` 只允许出现在测试夹具或既有项目说明中；未提交 `.env.local`、`.next/`、`out/` 或无关用户文件。

- [ ] **Step 7: Commit**

```powershell
git add -- README.md
git commit -m "docs: document server deployment"
```

若 README 无需修改，则跳过此提交；不得创建空 commit。

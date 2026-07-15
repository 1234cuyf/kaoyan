# Supabase 考研信息登记设计

## 背景与目标

研题库当前使用 Next.js 静态导出，访问登记仅保存在浏览器 `localStorage`。本次改造将项目切换为 Next.js Node.js 服务端部署，并把验证通过的考研登记信息通过后端 PostgreSQL Session Pool 写入 Supabase。

数据库凭据只能存在于服务端环境变量中。浏览器不直接连接 PostgreSQL，也不使用 Supabase 匿名密钥写入业务表。

## 架构选择

采用 Next.js Route Handler 作为后端：前端向同源 `POST /api/kaoyan-applications` 提交表单，Route Handler 完成输入校验、访问密钥验证和哈希处理，再使用 `pg` 通过 Supabase Session Pool 执行参数化 `INSERT`。

不采用独立 Node.js 服务，因为用户已确认使用与参考案例一致的 Next.js 后端方案。同源接口也无需额外维护 CORS 和第二套部署配置。

不采用浏览器直连 Supabase Data API，以避免开放匿名写入权限，并满足“从后端使用 PostgreSQL Session Pool 写入”的要求。

## 数据库设计

通过 Supabase MCP migration 创建 `public.kaoyan_applications`：

| 字段 | 类型 | 规则 |
| --- | --- | --- |
| `id` | `bigint generated always as identity` | 主键 |
| `name` | `text` | 必填，去除首尾空白后长度 1–50 |
| `exam_year` | `smallint` | 必填，范围 2026–2100 |
| `current_school` | `text` | 必填，长度 1–100 |
| `target_school` | `text` | 必填，长度 1–100 |
| `major` | `text` | 必填，长度 1–100 |
| `access_key_hash` | `text` | 必填，仅保存不可逆哈希 |
| `created_at` | `timestamptz` | 必填，默认 `now()` |

表启用 RLS，但不向 `anon` 或 `authenticated` 创建写入策略。应用后端通过 Session Pool 数据库连接执行写入。创建后运行 Supabase security 和 performance advisors，检查 RLS、约束及索引提示。

## 后端接口

新增 `POST /api/kaoyan-applications`，仅接受 JSON。请求字段沿用现有 `AccessFormData`：`name`、`examYear`、`currentSchool`、`targetSchool`、`major`、`accessKey`。

处理顺序：

1. 检查请求体格式、字段类型、必填项和长度。
2. 验证考研年份范围以及访问密钥是否等于服务端配置的有效密钥。
3. 使用 Node.js `crypto.scrypt` 配合随机盐生成不可逆哈希，数据库保存包含算法参数、盐和摘要的编码字符串。
4. 使用 `pg.Pool` 和参数化 SQL 插入记录。
5. 成功返回 `201` 和新记录 ID；不返回访问密钥或哈希。

错误响应使用稳定的错误码和中文提示：无效 JSON 返回 `400`，字段校验失败返回 `422`，密钥错误返回 `401`，数据库或内部异常返回 `500`。服务端日志不得输出访问密钥、连接串或完整请求体。

连接池从 `SUPABASE_POSTGRES_SESSION_POOL_URL` 读取连接串。变量缺失时接口明确失败；变量不使用 `NEXT_PUBLIC_` 前缀。Pool 作为服务端模块级单例复用，避免开发热更新或并发请求反复创建连接池。

## 前端数据流

`AccessGate` 的提交处理改为异步。客户端先执行现有快速校验，再提交后端；提交期间按钮禁用并显示处理中状态。后端写入成功后调用现有 `onLogin`，继续恢复当前本地会话和题库体验。

写入失败时不进入题库，并在表单 live region 显示可理解的中文错误。网络错误允许用户保留已填写内容后重试。访问密钥不写入 `localStorage`，现有 `UserProfile` 仍只保存非密钥字段。

页面隐私文案同步更新，明确登记信息会提交到服务端数据库，避免继续声称“仅保存在当前浏览器”。

## 项目配置与部署

移除 `next.config` 中的 `output: "export"`，保留 App Router。安装运行依赖 `pg` 和开发依赖 `@types/pg`。提供不含真实凭据的 `.env.example`，并确认 `.env.local` 被 Git 忽略。

生产环境必须部署到支持 Next.js Node.js Runtime 的平台。Supabase Session Pool 连接串仅配置在部署平台的服务端环境变量中。

## 测试与验证

纯逻辑校验和访问密钥处理放在可独立测试的服务端模块中。测试覆盖：

- 合法请求执行一次参数化写入并返回 `201`；
- 缺失字段、超长字段、非法年份和错误密钥不会写库；
- 哈希结果不包含明文密钥，并可由配套验证函数校验；
- 数据库异常返回安全的 `500`，不泄露连接信息；
- 前端提交成功后进入题库，失败时保留表单并展示状态；
- `localStorage` 中不出现访问密钥。

实施遵循测试驱动流程。交付前运行相关测试、完整 `npm.cmd run test:run`、`npm.cmd run lint` 和 `npm.cmd run build`，并在桌面与移动视口检查表单提交状态。

## 范围边界

本次只实现登记信息的新增写入，不实现后台列表、修改、删除、导出、Supabase Auth 或真实下载权限控制。演示访问密钥仍不是用户认证机制；改为服务端验证只是防止密钥逻辑和数据库凭据暴露在前端，不能替代完整身份系统。

# 研题库 Next.js 应用

这是一个使用 Next.js App Router、React 和 TypeScript 构建的考研真题资料网站。页面包含服务端访问验证、用户信息登记、真题搜索筛选、收藏以及响应式导航。登记信息由 Next.js 后端通过 PostgreSQL Session Pool 写入 Supabase。

## 项目状态

本项目目前处于早期开发阶段。仓库中的试卷记录、浏览量等内容是用于界面和交互演示的示例数据，不代表真实用户量、访问量或资料收录规模；仓库目前也不包含实际试卷文件。

## 本地运行

```powershell
npm.cmd install
Copy-Item .env.example .env.local
npm.cmd run dev
```

编辑 `.env.local`，填写真实的 `SUPABASE_POSTGRES_SESSION_POOL_URL` 和 `KAOYAN_ACCESS_KEY`，然后打开开发服务器显示的本地地址。环境变量只供服务端使用，不要添加 `NEXT_PUBLIC_` 前缀，也不要提交 `.env.local`。

## 测试与构建

```powershell
npm.cmd run test:run
npm.cmd run lint
npm.cmd run build
npm.cmd run preview
```

生产构建需要部署到支持 Next.js Node.js Runtime 的平台。`npm.cmd run preview` 会通过 `next start` 启动生产服务。

## 隐私说明

姓名、考研年份、当前院校、目标院校和报考专业会提交到服务端数据库；访问密钥只保存不可逆 scrypt 哈希。非密钥资料和收藏仍会保存在当前浏览器的 `localStorage` 中，用于恢复本地会话。访问密钥验证不等同于完整的用户身份认证。

## 开源许可

项目代码采用 [MIT License](LICENSE) 开源。

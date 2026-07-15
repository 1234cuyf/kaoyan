# 研题库 Next.js 静态演示

这是一个使用 Next.js App Router、React 和 TypeScript 构建的考研真题资料网站。页面包含本地访问验证、用户信息登记、真题搜索筛选、收藏以及响应式导航。

## 本地运行

```powershell
npm.cmd install
npm.cmd run dev
```

浏览器打开开发服务器显示的本地地址。演示密钥为 `KY2027`。

## 测试与构建

```powershell
npm.cmd run test:run
npm.cmd run lint
npm.cmd run build
npm.cmd run preview
```

生产构建会生成 `out/` 静态目录，可交由任意静态文件服务器托管。

## 隐私说明

本项目不连接后端。用户填写的信息与收藏仅保存在当前浏览器的 `localStorage` 中；演示密钥属于前端代码的一部分，不构成真实安全验证。

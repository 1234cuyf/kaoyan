# 考研真题静态网站 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 制作带静态密钥验证、用户信息登记、真题筛选和收藏功能的单页 HTML 网站。

**Architecture:** 使用一个自包含的 `index.html` 承载语义化结构、响应式 CSS、示例数据与浏览器端交互。使用 `localStorage` 保存静态会话和收藏；Node 测试从 HTML 中提取纯函数核心，验证密钥、过滤和数据结构。

**Tech Stack:** HTML5、CSS3、原生 JavaScript、Node.js 内置 `assert`

---

### Task 1: 行为测试

**Files:**
- Create: `tests/site.test.js`
- Test: `tests/site.test.js`

- [ ] 编写测试，断言页面必须包含访问表单、六个必填字段、主站结构、响应式样式，并验证 `validateAccess`、`filterPapers`、`toggleFavorite` 三个纯函数。
- [ ] 运行 `node tests/site.test.js`，预期因 `index.html` 不存在而失败。

### Task 2: 自包含网页

**Files:**
- Create: `index.html`
- Test: `tests/site.test.js`

- [ ] 编写语义化 HTML：访问验证页、导航、首屏、分类、院校、真题列表、资讯、页脚和提示组件。
- [ ] 编写响应式 CSS：深蓝和暖黄色视觉系统、卡片布局、390px/768px 断点、键盘焦点、减少动画偏好。
- [ ] 编写原生 JavaScript：校验 `KY2027`、本地会话、退出清除、组合筛选、收藏、移动菜单和下载演示反馈。
- [ ] 运行 `node tests/site.test.js`，预期全部断言通过。

### Task 3: 交付验证

**Files:**
- Verify: `index.html`
- Verify: `tests/site.test.js`

- [ ] 运行完整测试并确认零失败。
- [ ] 搜索外部 URL 和占位标记，确认页面无外部依赖、无 `TODO`/`TBD`。
- [ ] 检查文件大小、HTML 关键区域与 JavaScript 语法，确认可直接双击打开。


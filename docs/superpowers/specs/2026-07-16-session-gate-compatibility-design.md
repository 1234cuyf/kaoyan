# SessionGate 浏览器兼容性修复设计

## 问题

内置浏览器访问 `http://127.0.0.1:3000/` 时无法完成 Next.js hydration，页面会永久停留在“正在读取你的备考空间”状态；改用 `http://localhost:3000/` 后 hydration 正常完成。同时，`SessionGate` 直接依赖全局 `queueMicrotask`，在缺少该 API 的浏览器中也会触发同样症状。

## 方案选择

- 采用：本地访问入口使用 `http://localhost:3000/`；将 `queueMicrotask(callback)` 替换为 `Promise.resolve().then(callback)`，保留异步更新和卸载保护逻辑。
- 不采用：直接在 `useEffect` 中同步更新状态，可能触发现有 React Hooks lint 规则。
- 不采用：使用 `setTimeout`，会引入不必要的宏任务延迟，并可能受后台页面节流影响。

## 实现范围

仅修改 `src/components/session-gate.tsx` 的会话就绪调度方式，不调整登录资料、密钥、收藏或存储行为。

在 `src/components/session-gate.test.tsx` 增加回归测试：当 `queueMicrotask` 不存在时，首次访问仍应结束加载并显示访问表单。

## 验证

1. 先运行新增测试并确认其在旧实现下失败。
2. 应用最小实现后运行 SessionGate 测试及完整测试套件。
3. 运行 lint 和生产构建。
4. 重新加载 `http://localhost:3000/`，确认加载状态消失并显示访问表单或已恢复的主站。

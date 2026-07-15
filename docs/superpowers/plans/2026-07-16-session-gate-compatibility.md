# SessionGate Compatibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让不支持 `queueMicrotask` 的浏览器也能完成会话恢复并离开加载页。

**Architecture:** 保留 `SessionGate` 现有的客户端挂载、存储恢复和卸载保护数据流，只替换一次异步调度原语。新增组件级回归测试覆盖缺失 `queueMicrotask` 的浏览器环境。

**Tech Stack:** Next.js 16、React 19、TypeScript、Vitest、React Testing Library

---

### Task 1: 修复会话恢复兼容性

**Files:**
- Modify: `src/components/session-gate.test.tsx`
- Modify: `src/components/session-gate.tsx`

- [x] **Step 1: 写入失败回归测试**

在 Vitest 导入中加入 `afterEach` 和 `vi`，并加入：

```tsx
afterEach(() => vi.unstubAllGlobals());

it("finishes restoring when queueMicrotask is unavailable", async () => {
  vi.stubGlobal("queueMicrotask", undefined);
  render(<SessionGate><div>主站内容</div></SessionGate>);
  expect(await screen.findByRole("heading", { name: "开始你的真题之旅" })).toBeInTheDocument();
});
```

- [x] **Step 2: 验证测试在旧实现下失败**

Run: `npm.cmd run test:run -- src/components/session-gate.test.tsx`

Expected: FAIL，错误指向 `queueMicrotask is not a function` 或访问表单标题未出现。

- [x] **Step 3: 写入最小实现**

在 `SessionGate` 的 `useEffect` 中替换调度调用：

```tsx
Promise.resolve().then(() => {
  if (!cancelled) setSession({ ready: true, user: restoredUser, favorites: restoredFavorites });
});
```

- [x] **Step 4: 验证目标测试通过**

Run: `npm.cmd run test:run -- src/components/session-gate.test.tsx`

Expected: PASS，SessionGate 文件中 6 个测试全部通过。

- [x] **Step 5: 运行完整验证**

Run: `npm.cmd run test:run`

Expected: 所有测试通过，零失败。

Run: `npm.cmd run lint`

Expected: ESLint 退出码 0。

Run: `npm.cmd run build`

Expected: Next.js 构建成功并生成静态导出。

- [x] **Step 6: 浏览器复验**

重新加载 `http://localhost:3000/`，确认“正在读取你的备考空间”消失，并出现访问表单或已恢复的主站。

当前侧会话不执行 Git 提交，因为工作区 `.git` 元数据为只读，并且已有无关的 `next-env.d.ts` 修改需要保留。

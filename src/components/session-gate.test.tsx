import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FAVORITES_STORAGE_KEY, USER_STORAGE_KEY } from "@/lib/core";
import { SessionGate } from "./session-gate";

describe("SessionGate", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, id: "42" }), {
      status: 201,
      headers: { "content-type": "application/json" },
    })));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("shows the access form when no session is stored", async () => {
    render(<SessionGate><div>主站内容</div></SessionGate>);
    expect(await screen.findByRole("heading", { name: "开始你的真题之旅" })).toBeInTheDocument();
    expect(screen.queryByText("主站内容")).not.toBeInTheDocument();
    expect(screen.queryByText("WELCOME ABOARD")).not.toBeInTheDocument();
    expect(screen.queryByText("KAOYAN PAPER ARCHIVE")).not.toBeInTheDocument();
  });

  it("finishes restoring when queueMicrotask is unavailable", async () => {
    vi.stubGlobal("queueMicrotask", undefined);
    render(<StrictMode><SessionGate><div>主站内容</div></SessionGate></StrictMode>);
    expect(await screen.findByRole("heading", { name: "开始你的真题之旅" })).toBeInTheDocument();
  });

  it("stores user information without the access key and enters the site", async () => {
    const user = userEvent.setup();
    render(<SessionGate><div>主站内容</div></SessionGate>);

    await user.type(await screen.findByLabelText("姓名 *"), "张同学");
    await user.selectOptions(screen.getByLabelText("考研年份 *"), "2027");
    await user.type(screen.getByLabelText("当前院校 *"), "湖南大学");
    await user.type(screen.getByLabelText("目标院校 *"), "武汉大学");
    await user.type(screen.getByLabelText("报考专业 *"), "计算机科学与技术");
    await user.type(screen.getByLabelText("访问密钥 *"), "KY2027");
    await user.click(screen.getByRole("button", { name: /验证并进入题库/ }));

    expect(await screen.findByText("主站内容")).toBeInTheDocument();
    const saved = JSON.parse(localStorage.getItem(USER_STORAGE_KEY) ?? "{}");
    expect(saved).toMatchObject({ name: "张同学", targetSchool: "武汉大学" });
    expect(saved).not.toHaveProperty("accessKey");
    expect(fetch).toHaveBeenCalledWith("/api/kaoyan-applications", expect.objectContaining({
      method: "POST",
      headers: { "content-type": "application/json" },
    }));
  });

  it("keeps the form and shows the API error when registration fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      ok: false,
      code: "internal_error",
      message: "登记失败，请稍后重试",
    }), { status: 500, headers: { "content-type": "application/json" } })));
    const user = userEvent.setup();
    render(<SessionGate><div>主站内容</div></SessionGate>);

    await fillAccessForm(user);
    await user.click(screen.getByRole("button", { name: /验证并进入题库/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("登记失败，请稍后重试");
    expect(screen.getByRole("heading", { name: "开始你的真题之旅" })).toBeInTheDocument();
    expect(screen.queryByText("主站内容")).not.toBeInTheDocument();
  });

  it("disables repeated submission while registration is pending", async () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => undefined)));
    const user = userEvent.setup();
    render(<SessionGate><div>主站内容</div></SessionGate>);

    await fillAccessForm(user);
    await user.click(screen.getByRole("button", { name: /验证并进入题库/ }));

    expect(screen.getByRole("button", { name: "正在登记…" })).toBeDisabled();
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("recovers from corrupt storage by returning to the gate", async () => {
    localStorage.setItem(USER_STORAGE_KEY, "not-json");
    render(<SessionGate><div>主站内容</div></SessionGate>);
    expect(await screen.findByRole("heading", { name: "开始你的真题之旅" })).toBeInTheDocument();
    expect(localStorage.getItem(USER_STORAGE_KEY)).toBeNull();
  });

  it("restores an existing session", async () => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({
      name: "李同学", currentSchool: "湖南大学", targetSchool: "浙江大学", major: "自动化", examYear: "2027",
    }));
    render(<SessionGate><div>主站内容</div></SessionGate>);
    expect(await screen.findByText("主站内容")).toBeInTheDocument();
  });

  it("preserves favorites when the user session changes", async () => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([1, 3]));
    render(<SessionGate><div>主站内容</div></SessionGate>);
    await screen.findByRole("heading", { name: "开始你的真题之旅" });
    await waitFor(() => expect(localStorage.getItem(FAVORITES_STORAGE_KEY)).toBe("[1,3]"));
  });
});

async function fillAccessForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText("姓名 *"), "张同学");
  await user.selectOptions(screen.getByLabelText("考研年份 *"), "2027");
  await user.type(screen.getByLabelText("当前院校 *"), "湖南大学");
  await user.type(screen.getByLabelText("目标院校 *"), "武汉大学");
  await user.type(screen.getByLabelText("报考专业 *"), "计算机科学与技术");
  await user.type(screen.getByLabelText("访问密钥 *"), "KY2027");
}

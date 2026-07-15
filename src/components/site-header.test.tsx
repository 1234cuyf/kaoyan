import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { FAVORITES_STORAGE_KEY, USER_STORAGE_KEY } from "@/lib/core";
import { SessionGate } from "./session-gate";
import { SiteHeader } from "./site-header";

const storedUser = {
  name: "李同学", currentSchool: "湖南大学", targetSchool: "浙江大学", major: "自动化", examYear: "2027",
};

describe("SiteHeader", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(storedUser));
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([1, 3]));
  });

  it("opens and closes the mobile navigation", async () => {
    const user = userEvent.setup();
    render(<SessionGate><SiteHeader /></SessionGate>);
    const menu = await screen.findByRole("button", { name: "打开导航菜单" });
    await user.click(menu);
    expect(menu).toHaveAttribute("aria-expanded", "true");
    await user.click(menu);
    expect(menu).toHaveAttribute("aria-expanded", "false");
  });

  it("logs out, clears user information and preserves favorites", async () => {
    const user = userEvent.setup();
    render(<SessionGate><SiteHeader /></SessionGate>);
    await user.click(await screen.findByRole("button", { name: /李同学/ }));
    await user.click(screen.getByRole("button", { name: "退出并清除信息" }));

    expect(await screen.findByRole("heading", { name: "开始你的真题之旅" })).toBeInTheDocument();
    expect(localStorage.getItem(USER_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(FAVORITES_STORAGE_KEY)).toBe("[1,3]");
  });
});

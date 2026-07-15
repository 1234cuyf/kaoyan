import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { FAVORITES_STORAGE_KEY, USER_STORAGE_KEY } from "@/lib/core";
import { PaperExplorer } from "./paper-explorer";
import { SessionGate } from "./session-gate";
import { SiteHeader } from "./site-header";

const storedUser = {
  name: "张同学", currentSchool: "湖南大学", targetSchool: "武汉大学", major: "计算机", examYear: "2027",
};

function renderExplorer() {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(storedUser));
  return render(<SessionGate><SiteHeader /><PaperExplorer /></SessionGate>);
}

describe("PaperExplorer", () => {
  beforeEach(() => localStorage.clear());

  it("filters papers from the search field and can reset the result", async () => {
    const user = userEvent.setup();
    renderExplorer();
    const search = await screen.findByPlaceholderText(/输入院校、专业或科目/);
    expect(screen.getByText("共 8 份资料")).toBeInTheDocument();
    expect(screen.queryByText("PAST PAPERS")).not.toBeInTheDocument();
    expect(screen.queryByText("POPULAR SCHOOLS")).not.toBeInTheDocument();

    await user.type(search, "计算机");
    expect(screen.getByText("共 2 份资料")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "重置筛选" }));
    expect(screen.getByText("共 8 份资料")).toBeInTheDocument();
  });

  it("combines subject and year filters", async () => {
    const user = userEvent.setup();
    renderExplorer();
    await screen.findByText("共 8 份资料");
    await user.selectOptions(screen.getByLabelText("科目分类"), "专业课");
    await user.selectOptions(screen.getByLabelText("年份"), "2024");
    expect(screen.getByText("共 1 份资料")).toBeInTheDocument();
    expect(screen.getByText(/北京大学 经济学综合/)).toBeInTheDocument();
  });

  it("persists favorites and exposes the updated count", async () => {
    const user = userEvent.setup();
    renderExplorer();
    const article = (await screen.findByText(/武汉大学 计算机基础综合/)).closest("article");
    expect(article).not.toBeNull();
    await user.click(within(article as HTMLElement).getByRole("button", { name: /收藏 武汉大学/ }));
    expect(localStorage.getItem(FAVORITES_STORAGE_KEY)).toBe("[1]");
    expect(screen.getByTestId("favorite-count")).toHaveTextContent("1");
  });

  it("shows a static-demo message instead of a broken download", async () => {
    const user = userEvent.setup();
    renderExplorer();
    const [firstDownload] = await screen.findAllByRole("button", { name: "查看资料" });
    await user.click(firstDownload);
    expect(screen.getByRole("status")).toHaveTextContent("真实资料下载功能尚未接入");
  });
});

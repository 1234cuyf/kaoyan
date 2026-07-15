import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { NewsSection, SiteFooter } from "./static-sections";

it("uses only the Chinese section heading", () => {
  render(<NewsSection />);
  expect(screen.getByRole("heading", { name: "备考方法与资讯" })).toBeInTheDocument();
  expect(screen.queryByText("STUDY NOTES")).not.toBeInTheDocument();
});

it("describes server registration without exposing the access key", () => {
  render(<SiteFooter />);
  expect(screen.getByText("登记信息由服务端安全保存")).toBeInTheDocument();
  expect(screen.getByText("访问密钥不以明文存储")).toBeInTheDocument();
  expect(screen.queryByText(/KY2027/)).not.toBeInTheDocument();
  expect(screen.queryByText("信息仅保存于当前浏览器")).not.toBeInTheDocument();
});

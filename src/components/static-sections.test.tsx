import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { NewsSection } from "./static-sections";

it("uses only the Chinese section heading", () => {
  render(<NewsSection />);
  expect(screen.getByRole("heading", { name: "备考方法与资讯" })).toBeInTheDocument();
  expect(screen.queryByText("STUDY NOTES")).not.toBeInTheDocument();
});

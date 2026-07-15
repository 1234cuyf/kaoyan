import { describe, expect, it } from "vitest";
import { filterPapers, toggleFavorite, validateAccess } from "./core";
import type { AccessFormData, Paper } from "./types";

const validAccess: AccessFormData = {
  name: "张同学",
  currentSchool: "湖南大学",
  targetSchool: "武汉大学",
  major: "计算机科学与技术",
  examYear: "2027",
  accessKey: "KY2027",
};

const samplePapers: Paper[] = [
  { id: 1, year: "2025", subject: "专业课", school: "武汉大学", title: "武汉大学 计算机基础综合", type: "回忆版", pages: 12, views: "3.2k" },
  { id: 2, year: "2024", subject: "英语", school: "全国统考", title: "全国硕士研究生 英语一", type: "完整版", pages: 18, views: "8.6k" },
];

describe("validateAccess", () => {
  it("accepts complete information and the demo key", () => {
    expect(validateAccess(validAccess)).toEqual({ ok: true, message: "" });
  });

  it("rejects every blank required field", () => {
    for (const field of Object.keys(validAccess) as (keyof AccessFormData)[]) {
      expect(validateAccess({ ...validAccess, [field]: " " }).ok).toBe(false);
    }
  });

  it("rejects an incorrect key with a helpful message", () => {
    expect(validateAccess({ ...validAccess, accessKey: "wrong" })).toEqual({
      ok: false,
      message: "访问密钥不正确，请使用页面提供的演示密钥",
    });
  });
});

describe("filterPapers", () => {
  it("matches a keyword across searchable fields", () => {
    expect(filterPapers(samplePapers, { query: "计算机", subject: "全部", school: "全部", year: "全部" }).map(({ id }) => id)).toEqual([1]);
  });

  it("combines subject, school and year filters", () => {
    expect(filterPapers(samplePapers, { query: "", subject: "英语", school: "全国统考", year: "2024" }).map(({ id }) => id)).toEqual([2]);
  });
});

describe("toggleFavorite", () => {
  it("adds a new favorite without duplicating ids", () => {
    expect(toggleFavorite([1], 2)).toEqual([1, 2]);
    expect(toggleFavorite([1, 1], 2)).toEqual([1, 2]);
  });

  it("removes an existing favorite", () => {
    expect(toggleFavorite([1, 2], 2)).toEqual([1]);
  });
});

import { describe, expect, it } from "vitest";
import { filterPapers, toggleFavorite, validateAccessFields } from "./core";
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

describe("validateAccessFields", () => {
  it("accepts complete information without deciding whether the key is correct", () => {
    expect(validateAccessFields({ ...validAccess, accessKey: "server-validated" })).toEqual({ ok: true, message: "" });
  });

  it("rejects every blank required field", () => {
    for (const field of Object.keys(validAccess) as (keyof AccessFormData)[]) {
      expect(validateAccessFields({ ...validAccess, [field]: " " }).ok).toBe(false);
    }
  });

  it("rejects an invalid exam year", () => {
    expect(validateAccessFields({ ...validAccess, examYear: "next-year" })).toEqual({
      ok: false,
      message: "请选择有效的考研年份",
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

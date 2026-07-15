import type { AccessFormData, Paper, PaperFilters, ValidationResult } from "./types";

export const USER_STORAGE_KEY = "yantiku_user";
export const FAVORITES_STORAGE_KEY = "yantiku_favorites";

const accessLabels: Record<keyof AccessFormData, string> = {
  name: "姓名",
  currentSchool: "当前院校",
  targetSchool: "目标院校",
  major: "报考专业",
  examYear: "考研年份",
  accessKey: "访问密钥",
};

export function validateAccessFields(data: AccessFormData): ValidationResult {
  for (const field of Object.keys(accessLabels) as (keyof AccessFormData)[]) {
    if (!String(data[field] ?? "").trim()) {
      return { ok: false, message: `请填写${accessLabels[field]}` };
    }
  }

  if (!/^\d{4}$/.test(data.examYear.trim())) {
    return { ok: false, message: "请选择有效的考研年份" };
  }

  return { ok: true, message: "" };
}

export function filterPapers(papers: Paper[], filters: PaperFilters): Paper[] {
  const query = filters.query.trim().toLocaleLowerCase("zh-CN");

  return papers.filter((paper) => {
    const searchable = `${paper.title} ${paper.school} ${paper.subject} ${paper.year}`.toLocaleLowerCase("zh-CN");
    return (!query || searchable.includes(query))
      && (filters.subject === "全部" || paper.subject === filters.subject)
      && (filters.school === "全部" || paper.school === filters.school)
      && (filters.year === "全部" || paper.year === filters.year);
  });
}

export function toggleFavorite(ids: number[], id: number): number[] {
  const next = new Set(ids.map(Number));
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return Array.from(next);
}

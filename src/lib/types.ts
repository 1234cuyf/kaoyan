export type Subject = "政治" | "英语" | "数学" | "专业课";
export type FilterOption<T extends string> = T | "全部";

export interface UserProfile {
  name: string;
  currentSchool: string;
  targetSchool: string;
  major: string;
  examYear: string;
}

export interface AccessFormData extends UserProfile {
  accessKey: string;
}

export interface ValidationResult {
  ok: boolean;
  message: string;
}

export interface Paper {
  id: number;
  year: string;
  subject: Subject;
  school: string;
  title: string;
  type: string;
  pages: number;
  views: string;
}

export interface PaperFilters {
  query: string;
  subject: FilterOption<Subject>;
  school: string;
  year: string;
}

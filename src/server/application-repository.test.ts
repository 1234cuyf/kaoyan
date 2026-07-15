import { afterEach, describe, expect, it, vi } from "vitest";
import { insertApplication } from "./application-repository";
import type { ApplicationInsert } from "./application-input";

const input: ApplicationInsert = {
  name: "张同学",
  examYear: 2027,
  currentSchool: "湖南大学",
  targetSchool: "武汉大学",
  major: "计算机科学与技术",
  accessKeyHash: "scrypt$hash-value-that-is-long-enough",
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("insertApplication", () => {
  it("uses a parameterized insert and returns the generated id", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ id: "42" }] });

    await expect(insertApplication(input, { query })).resolves.toBe("42");

    expect(query).toHaveBeenCalledOnce();
    expect(query).toHaveBeenCalledWith(
      expect.stringMatching(/insert into public\.kaoyan_applications[\s\S]+values \(\$1, \$2, \$3, \$4, \$5, \$6\)[\s\S]+returning id/i),
      [input.name, input.examYear, input.currentSchool, input.targetSchool, input.major, input.accessKeyHash],
    );
  });

  it("fails clearly when the Session Pool URL is missing", async () => {
    vi.stubEnv("SUPABASE_POSTGRES_SESSION_POOL_URL", "");

    await expect(insertApplication(input)).rejects.toThrow("缺少 SUPABASE_POSTGRES_SESSION_POOL_URL 服务端环境变量");
  });

  it("rejects an insert response without an id", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    await expect(insertApplication(input, { query })).rejects.toThrow("数据库未返回登记记录 ID");
  });
});

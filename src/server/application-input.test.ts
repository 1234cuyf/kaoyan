import { describe, expect, it } from "vitest";
import { hashAccessKey, parseApplicationInput, verifyAccessKeyHash } from "./application-input";

const valid = {
  name: " 张同学 ",
  examYear: "2027",
  currentSchool: " 湖南大学 ",
  targetSchool: "武汉大学",
  major: "计算机科学与技术",
  accessKey: "KY2027",
};

describe("parseApplicationInput", () => {
  it("normalizes a valid application", () => {
    expect(parseApplicationInput(valid, "KY2027")).toEqual({
      ok: true,
      data: {
        name: "张同学",
        examYear: 2027,
        currentSchool: "湖南大学",
        targetSchool: "武汉大学",
        major: "计算机科学与技术",
        accessKey: "KY2027",
      },
    });
  });

  it.each([
    ["name", "", "请填写姓名"],
    ["name", "张".repeat(51), "姓名不能超过 50 个字符"],
    ["currentSchool", "", "请填写当前院校"],
    ["currentSchool", "校".repeat(101), "当前院校不能超过 100 个字符"],
    ["targetSchool", "", "请填写目标院校"],
    ["targetSchool", "校".repeat(101), "目标院校不能超过 100 个字符"],
    ["major", "", "请填写报考专业"],
    ["major", "专".repeat(101), "报考专业不能超过 100 个字符"],
    ["accessKey", "", "请填写访问密钥"],
  ])("rejects invalid %s", (field, value, message) => {
    expect(parseApplicationInput({ ...valid, [field]: value }, "KY2027")).toEqual({
      ok: false,
      code: "invalid_fields",
      message,
    });
  });

  it.each(["2025", "2101", "not-a-year", 2027.5])("rejects an invalid exam year", (examYear) => {
    expect(parseApplicationInput({ ...valid, examYear }, "KY2027")).toEqual({
      ok: false,
      code: "invalid_fields",
      message: "考研年份必须在 2026 到 2100 之间",
    });
  });

  it("rejects a non-object request body", () => {
    expect(parseApplicationInput(null, "KY2027")).toEqual({
      ok: false,
      code: "invalid_fields",
      message: "请求数据格式不正确",
    });
  });

  it("rejects an incorrect access key", () => {
    expect(parseApplicationInput({ ...valid, accessKey: "wrong" }, "KY2027")).toEqual({
      ok: false,
      code: "invalid_access_key",
      message: "访问密钥不正确",
    });
  });
});

describe("access key hashing", () => {
  it("stores a salted scrypt digest that can be verified", async () => {
    const hash = await hashAccessKey("KY2027");
    expect(hash).toMatch(/^scrypt\$16384\$8\$1\$[^$]+\$[^$]+$/);
    expect(hash).not.toContain("KY2027");
    await expect(verifyAccessKeyHash("KY2027", hash)).resolves.toBe(true);
    await expect(verifyAccessKeyHash("wrong", hash)).resolves.toBe(false);
  });

  it("rejects malformed encoded hashes", async () => {
    await expect(verifyAccessKeyHash("KY2027", "not-a-hash")).resolves.toBe(false);
  });
});

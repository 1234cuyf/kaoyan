import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  parseApplicationInput: vi.fn(),
  hashAccessKey: vi.fn(),
  insertApplication: vi.fn(),
}));

vi.mock("@/server/application-input", () => ({
  parseApplicationInput: mocks.parseApplicationInput,
  hashAccessKey: mocks.hashAccessKey,
}));
vi.mock("@/server/application-repository", () => ({ insertApplication: mocks.insertApplication }));

import { POST } from "./route";

const valid = {
  name: "张同学",
  examYear: "2027",
  currentSchool: "湖南大学",
  targetSchool: "武汉大学",
  major: "计算机科学与技术",
  accessKey: "KY2027",
};

function request(body: string, contentType = "application/json") {
  return new Request("http://localhost/api/kaoyan-applications", {
    method: "POST",
    headers: { "content-type": contentType },
    body,
  });
}

describe("POST /api/kaoyan-applications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("KAOYAN_ACCESS_KEY", "KY2027");
    mocks.parseApplicationInput.mockReturnValue({
      ok: true,
      data: { ...valid, examYear: 2027 },
    });
    mocks.hashAccessKey.mockResolvedValue("scrypt$encoded-hash");
    mocks.insertApplication.mockResolvedValue("42");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("creates an application and returns its id", async () => {
    const response = await POST(request(JSON.stringify(valid)));
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ ok: true, id: "42" });
    expect(mocks.hashAccessKey).toHaveBeenCalledWith("KY2027");
    expect(mocks.insertApplication).toHaveBeenCalledWith({
      name: "张同学",
      examYear: 2027,
      currentSchool: "湖南大学",
      targetSchool: "武汉大学",
      major: "计算机科学与技术",
      accessKeyHash: "scrypt$encoded-hash",
    });
  });

  it("rejects a non-JSON content type", async () => {
    const response = await POST(request("name=test", "text/plain"));
    expect(response.status).toBe(415);
    await expect(response.json()).resolves.toMatchObject({ ok: false, code: "unsupported_media_type" });
  });

  it("rejects malformed JSON", async () => {
    const response = await POST(request("{"));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ ok: false, code: "invalid_json" });
  });

  it.each([
    ["invalid_fields", 422],
    ["invalid_access_key", 401],
  ])("maps %s to the expected status", async (code, status) => {
    mocks.parseApplicationInput.mockReturnValue({ ok: false, code, message: "输入错误" });
    const response = await POST(request(JSON.stringify(valid)));
    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toEqual({ ok: false, code, message: "输入错误" });
    expect(mocks.insertApplication).not.toHaveBeenCalled();
  });

  it("returns a safe error when server configuration is missing", async () => {
    vi.stubEnv("KAOYAN_ACCESS_KEY", "");
    const response = await POST(request(JSON.stringify(valid)));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      code: "internal_error",
      message: "服务暂时不可用，请稍后重试",
    });
  });

  it("returns a safe error when the database fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.insertApplication.mockRejectedValue(new Error("postgresql://secret"));
    const response = await POST(request(JSON.stringify(valid)));
    expect(response.status).toBe(500);
    const body = await response.text();
    expect(body).not.toContain("postgresql://secret");
    expect(body).toContain("internal_error");
  });
});

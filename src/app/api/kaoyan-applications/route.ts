import { hashAccessKey, parseApplicationInput } from "@/server/application-input";
import { insertApplication } from "@/server/application-repository";

export const runtime = "nodejs";

function errorResponse(status: number, code: string, message: string): Response {
  return Response.json({ ok: false, code, message }, { status });
}

export async function POST(request: Request): Promise<Response> {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return errorResponse(415, "unsupported_media_type", "请使用 JSON 格式提交登记信息");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "invalid_json", "请求内容不是有效的 JSON");
  }

  try {
    const expectedAccessKey = process.env.KAOYAN_ACCESS_KEY;
    if (!expectedAccessKey) throw new Error("MissingAccessKeyConfiguration");

    const parsed = parseApplicationInput(body, expectedAccessKey);
    if (!parsed.ok) {
      return errorResponse(parsed.code === "invalid_access_key" ? 401 : 422, parsed.code, parsed.message);
    }

    const { accessKey, ...profile } = parsed.data;
    const accessKeyHash = await hashAccessKey(accessKey);
    const id = await insertApplication({ ...profile, accessKeyHash });
    return Response.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    console.error("考研登记接口处理失败", error instanceof Error ? error.name : "UnknownError");
    return errorResponse(500, "internal_error", "服务暂时不可用，请稍后重试");
  }
}

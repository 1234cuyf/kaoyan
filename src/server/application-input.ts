import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

const SCRYPT_COST = 16_384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const DIGEST_LENGTH = 64;

function deriveKey(password: string, salt: Buffer, length: number, options: { N: number; r: number; p: number }): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, length, options, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

export interface ApplicationInsert {
  name: string;
  examYear: number;
  currentSchool: string;
  targetSchool: string;
  major: string;
  accessKeyHash: string;
}

interface ParsedApplication extends Omit<ApplicationInsert, "accessKeyHash"> {
  accessKey: string;
}

export type ApplicationInputResult =
  | { ok: true; data: ParsedApplication }
  | { ok: false; code: "invalid_fields" | "invalid_access_key"; message: string };

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function keysMatch(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function parseApplicationInput(value: unknown, expectedAccessKey: string): ApplicationInputResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, code: "invalid_fields", message: "请求数据格式不正确" };
  }

  const input = value as Record<string, unknown>;
  const name = safeString(input.name);
  const currentSchool = safeString(input.currentSchool);
  const targetSchool = safeString(input.targetSchool);
  const major = safeString(input.major);
  const accessKey = safeString(input.accessKey);

  const fields: Array<[string, string, number]> = [
    [name, "姓名", 50],
    [currentSchool, "当前院校", 100],
    [targetSchool, "目标院校", 100],
    [major, "报考专业", 100],
    [accessKey, "访问密钥", 0],
  ];

  for (const [field, label, maximum] of fields) {
    if (!field) return { ok: false, code: "invalid_fields", message: `请填写${label}` };
    if (maximum && field.length > maximum) {
      return { ok: false, code: "invalid_fields", message: `${label}不能超过 ${maximum} 个字符` };
    }
  }

  const rawExamYear = input.examYear;
  const examYear = typeof rawExamYear === "string" && /^\d{4}$/.test(rawExamYear.trim())
    ? Number(rawExamYear.trim())
    : Number.NaN;
  if (!Number.isInteger(examYear) || examYear < 2026 || examYear > 2100) {
    return { ok: false, code: "invalid_fields", message: "考研年份必须在 2026 到 2100 之间" };
  }

  if (!expectedAccessKey || !keysMatch(accessKey, expectedAccessKey)) {
    return { ok: false, code: "invalid_access_key", message: "访问密钥不正确" };
  }

  return { ok: true, data: { name, examYear, currentSchool, targetSchool, major, accessKey } };
}

export async function hashAccessKey(accessKey: string): Promise<string> {
  const salt = randomBytes(16);
  const digest = await deriveKey(accessKey, salt, DIGEST_LENGTH, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELIZATION,
  });
  return [
    "scrypt",
    SCRYPT_COST,
    SCRYPT_BLOCK_SIZE,
    SCRYPT_PARALLELIZATION,
    salt.toString("base64url"),
    digest.toString("base64url"),
  ].join("$");
}

export async function verifyAccessKeyHash(accessKey: string, encoded: string): Promise<boolean> {
  const [algorithm, cost, blockSize, parallelization, saltValue, digestValue, extra] = encoded.split("$");
  if (algorithm !== "scrypt" || extra || !saltValue || !digestValue) return false;

  const N = Number(cost);
  const r = Number(blockSize);
  const p = Number(parallelization);
  if (N !== SCRYPT_COST || r !== SCRYPT_BLOCK_SIZE || p !== SCRYPT_PARALLELIZATION) return false;

  try {
    const expected = Buffer.from(digestValue, "base64url");
    if (expected.length !== DIGEST_LENGTH) return false;
    const actual = await deriveKey(accessKey, Buffer.from(saltValue, "base64url"), expected.length, { N, r, p });
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

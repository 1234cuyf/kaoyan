import { Pool } from "pg";
import type { ApplicationInsert } from "./application-input";

export interface Queryable {
  query: (text: string, values: unknown[]) => Promise<{ rows: Array<{ id: string | number }> }>;
}

const globalForDatabase = globalThis as typeof globalThis & { yantikuPool?: Pool };

export function normalizeSessionPoolUrl(connectionString: string): string {
  if (!connectionString.includes("pooler.supabase.com") || !connectionString.includes("sslmode=require")) {
    return connectionString;
  }
  if (connectionString.includes("uselibpqcompat=true")) {
    return connectionString;
  }

  return `${connectionString}${connectionString.includes("?") ? "&" : "?"}uselibpqcompat=true`;
}

function getDatabase(): Queryable {
  const connectionString = process.env.SUPABASE_POSTGRES_SESSION_POOL_URL;
  if (!connectionString) {
    throw new Error("缺少 SUPABASE_POSTGRES_SESSION_POOL_URL 服务端环境变量");
  }

  if (!globalForDatabase.yantikuPool) {
    globalForDatabase.yantikuPool = new Pool({ connectionString: normalizeSessionPoolUrl(connectionString) });
  }
  return globalForDatabase.yantikuPool as unknown as Queryable;
}

export async function insertApplication(input: ApplicationInsert, database: Queryable = getDatabase()): Promise<string> {
  const result = await database.query(
    `insert into public.kaoyan_applications
      (name, exam_year, current_school, target_school, major, access_key_hash)
     values ($1, $2, $3, $4, $5, $6)
     returning id`,
    [input.name, input.examYear, input.currentSchool, input.targetSchool, input.major, input.accessKeyHash],
  );
  const id = result.rows[0]?.id;
  if (id === undefined || id === null) throw new Error("数据库未返回登记记录 ID");
  return String(id);
}

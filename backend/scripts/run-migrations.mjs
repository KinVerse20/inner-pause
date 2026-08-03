import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const confirmation = process.env.AWS_TEST_MIGRATIONS_CONFIRM;
if (confirmation !== "run-aws-test-migrations") {
  throw new Error("Refusing to run migrations. Set AWS_TEST_MIGRATIONS_CONFIRM=run-aws-test-migrations for the AWS test database.");
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required.");

const parsed = new URL(databaseUrl);
const host = parsed.hostname;
const database = parsed.pathname.replace(/^\//, "");
const productionLooking = /(supabase|prod|production|vercel)/i.test(host) || /(prod|production)/i.test(database);
if (productionLooking && process.env.ALLOW_PRODUCTION_LIKE_DB_HOST !== "true") {
  throw new Error(`Refusing production-looking database target: host=${host}, database=${database}`);
}

console.log(`Running additive migrations against host=${host}, database=${database}`);

const migrationsDir = path.resolve(process.cwd(), "../infrastructure/database/migrations");
const files = (await readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();
const client = new pg.Client({ connectionString: databaseUrl, ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: true } : undefined });

await client.connect();
try {
  await client.query(`
    create table if not exists public.schema_migrations (
      id text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  for (const file of files) {
    const applied = await client.query("select 1 from public.schema_migrations where id = $1", [file]);
    if (applied.rows[0]) {
      console.log(`Skipping already-applied migration ${file}`);
      continue;
    }
    const sql = await readFile(path.join(migrationsDir, file), "utf8");
    console.log(`Applying migration ${file}`);
    await client.query("begin");
    try {
      await client.query(sql);
      await client.query("insert into public.schema_migrations (id) values ($1)", [file]);
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  }
} finally {
  await client.end();
}

console.log("AWS test database migrations completed.");

import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";

export const E2E_DB = process.env.E2E_DATABASE_URL ?? "postgresql://shop:shop@localhost:5432/shop_e2e";
export const ADMIN = { email: "admin-e2e@example.com", password: "e2e-password-123" };

export default async function setup() {
  const env = { ...process.env, DATABASE_URL: E2E_DB, ADMIN_EMAIL: ADMIN.email, ADMIN_PASSWORD: ADMIN.password };
  execSync("npx prisma migrate deploy", { env, stdio: "ignore" });
  const prisma = new PrismaClient({ datasources: { db: { url: E2E_DB } } });
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  await prisma.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(", ")} CASCADE`);
  await prisma.$disconnect();
  execSync("npx tsx prisma/seed.ts", { env, stdio: "ignore" });
}

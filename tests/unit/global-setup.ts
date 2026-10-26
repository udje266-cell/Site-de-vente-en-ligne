import { execSync } from "child_process";

export default function setup() {
  const url = process.env.TEST_DATABASE_URL ?? "postgresql://shop:shop@localhost:5432/shop_test";
  execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: url }, stdio: "ignore" });
}

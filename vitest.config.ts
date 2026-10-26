import { defineConfig } from "vitest/config";
import path from "path";

const TEST_DB = process.env.TEST_DATABASE_URL ?? "postgresql://shop:shop@localhost:5432/shop_test";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    fileParallelism: false,
    globalSetup: ["tests/unit/global-setup.ts"],
    env: {
      DATABASE_URL: TEST_DB,
      NEXTAUTH_SECRET: "test-secret",
      PAYMENT_PROVIDER: "fake",
      MAIL_PROVIDER: "console",
      APP_URL: "http://localhost:3000",
    },
    silent: "passed-only",
  },
});

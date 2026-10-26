import { defineConfig, devices } from "@playwright/test";

/**
 * Tests e2e : utilisent la base E2E_DATABASE_URL (réinitialisée par tests/e2e/global-setup.ts)
 * et PAYMENT_PROVIDER=fake. Lancer : npm run test:e2e
 */
const DB = process.env.E2E_DATABASE_URL ?? "postgresql://shop:shop@localhost:5432/shop_e2e";
const PORT = 3100;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  globalSetup: "./tests/e2e/global-setup.ts",
  use: { baseURL: `http://localhost:${PORT}`, ...devices["Pixel 5"], locale: "fr-FR", timezoneId: "Africa/Abidjan" },
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}/robots.txt`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      DATABASE_URL: DB,
      APP_URL: `http://localhost:${PORT}`,
      NEXTAUTH_URL: `http://localhost:${PORT}`,
      NEXTAUTH_SECRET: "e2e-secret-e2e-secret-e2e-secret",
      PAYMENT_PROVIDER: "fake",
      MAIL_PROVIDER: "console",
      SMS_PROVIDER: "console",
      IMAGE_STORAGE: "local",
      CRON_SECRET: "e2e-cron",
      NEXT_DIST_DIR: ".next-e2e",
    },
  },
});

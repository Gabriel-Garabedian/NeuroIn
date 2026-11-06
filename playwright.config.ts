import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
  (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);
export default defineConfig({
  testDir: "./tests",
  globalSetup: "./tests/global-setup.ts",
  fullyParallel: true,
  use: {
    baseURL: "http://127.0.0.1:5173",
    headless: true,
    launchOptions: { executablePath, args: ["--no-sandbox"] },
    viewport: { width: 390, height: 844 },
  },
  reporter: "list",
});

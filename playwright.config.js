import { defineConfig } from "@playwright/test";
import { tmpdir } from "node:os";
import path from "node:path";

const node = JSON.stringify(process.execPath);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5187",
    viewport: { width: 1440, height: 1000 },
    headless: true,
    launchOptions: process.env.MARU_BROWSER_PATH ? { executablePath: process.env.MARU_BROWSER_PATH } : {},
    screenshot: "only-on-failure",
    trace: "retain-on-failure"
  },
  webServer: [
    {
      command: `${node} ../maru-backend/backend/server.js`,
      url: "http://127.0.0.1:5197/api/health",
      reuseExistingServer: false,
      env: {
        PORT: "5197",
        MARU_PUBLIC_ORIGIN: "http://127.0.0.1:5187",
        MARU_DATA_DIR: path.join(tmpdir(), "maru-e2e-" + process.pid)
      }
    },
    {
      command: `${node} scripts/dev-server.js`,
      url: "http://127.0.0.1:5187",
      reuseExistingServer: false,
      env: { PORT: "5187", MARU_API_ORIGIN: "http://127.0.0.1:5197" }
    }
  ]
});

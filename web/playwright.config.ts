import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  use: { baseURL: "http://127.0.0.1:3117", trace: "retain-on-failure" },
  webServer: {
    command:
      "cd .. && .venv/bin/python -m tests.make_web_fixture && cd work/e2e-web && ../../web/node_modules/.bin/next dev --webpack --hostname 127.0.0.1 --port 3117",
    url: "http://127.0.0.1:3117",
    reuseExistingServer: false,
    timeout: 120000,
  },
});

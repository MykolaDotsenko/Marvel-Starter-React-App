import { defineConfig, devices } from "@playwright/test";

const mobileChromium = devices["Pixel 7"];

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4173",
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    {
      name: "mobile-360",
      use: { ...mobileChromium, viewport: { width: 360, height: 800 } },
    },
    {
      name: "mobile-390",
      use: { ...mobileChromium, viewport: { width: 390, height: 844 } },
    },
    {
      name: "mobile-440",
      use: { ...mobileChromium, viewport: { width: 440, height: 956 } },
    },
  ],
});

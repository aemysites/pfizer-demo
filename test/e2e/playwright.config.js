const { devices } = require("@playwright/test");

/**
 * Additional configuration settings describe is here : https://playwright.dev/
 *
 * @type {import('@playwright/test').PlaywrightTestConfig}
 */
const config = {
  testDir: "./src",
  timeout: 35000,
  workers: 5,
  retries: 0,
  reporter: [
    ['json', {
      outputFile: 'test-results.json',
    }]
  ],
  outputDir: "./test-results",
  use: {
    baseURL: process.env.npm_config_profile_base_url || process.env.PROFILE_BASE_URL || "http://localhost:3000/",
    ignoreHTTPSErrors: true,
    headless: true,
    screenshot: "only-on-failure",
    video: {
      mode: "off",
    },
    acceptDownloads: true,
    bypassCSP: true,
    locale: "en-GB",
    timezoneId: "Europe/London",
    storageState: {
      cookies: [],
      origins: [],
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
};

/**
 * ATTENTION: The next lines should not be changed to avoid troubles with E2E tests execution.
 */
if (process.env.CI) {
  config.use.launchOptions = Object.assign(config.use.launchOptions || { }, { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
}

module.exports = config;

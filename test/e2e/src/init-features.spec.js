const {test, expect} = require("@playwright/test");

test.describe.parallel("General Methods", () => {
  test(`Some Feature`, async ({page}) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(await page.locator('body')).toBeVisible();
  });
});

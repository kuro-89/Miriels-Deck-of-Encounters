import { test, expect } from "@playwright/test";

test("Local Storage bleibt nach einem Reload verfügbar", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("miriels-test-marker", "persistiert"));
  await page.reload();
  const marker = await page.evaluate(() => localStorage.getItem("miriels-test-marker"));
  expect(marker).toBe("persistiert");
});

test("Spielerseite kann in einem zweiten Tab geöffnet werden", async ({ context }) => {
  const dmPage = await context.newPage();
  const playerPage = await context.newPage();
  await dmPage.goto("/");
  await playerPage.goto("/?view=playerSide");
  await expect(dmPage).toHaveTitle("Miriel's Deck of Encounters");
  await expect(playerPage).toHaveTitle("Miriel's Deck of Encounters");
});

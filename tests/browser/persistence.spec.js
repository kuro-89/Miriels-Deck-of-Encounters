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


test("ein leerer App-Speicherwert verursacht beim Reload keinen JSON-Fehler", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem("miriels-deck-game-state-v7", "");
  });

  await page.reload();

  await expect(page).toHaveTitle("Miriel's Deck of Encounters");
  await expect(
    page.getByRole("heading", { name: "Miriel’s Deck of Encounters", level: 1 })
  ).toBeVisible();
});

test("beschädigtes App-JSON wird beim Reload kontrolliert verworfen", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem("miriels-deck-game-state-v7", "{unvollständig");
  });

  await page.reload();

  await expect(
    page.getByRole("heading", { name: "Miriel’s Deck of Encounters", level: 1 })
  ).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("App-Speicher mit Leerzeichen verursacht beim Reload keinen Fehler", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem("miriels-deck-game-state-v7", "   ");
  });

  await page.reload();

  await expect(page).toHaveTitle("Miriel's Deck of Encounters");
  expect(pageErrors).toEqual([]);
});


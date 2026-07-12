import { test, expect } from "@playwright/test";

/**
 * Sammelt JavaScript- und Konsolenfehler, die während eines Tests auftreten.
 * Die Listener müssen vor page.goto() registriert werden.
 */
function collectUnexpectedConsoleErrors(page) {
  const errors = [];

  page.on("console", message => {
    if (message.type() === "error") errors.push(message.text());
  });

  page.on("pageerror", error => errors.push(error.message));
  return errors;
}

test("App startet über HTTP ohne JavaScript- oder Konsolenfehler", async ({ page }) => {
  const errors = collectUnexpectedConsoleErrors(page);
  await page.goto("/");

  await expect(page).toHaveTitle("Miriel's Deck of Encounters");
  await expect(
    page.getByRole("heading", { name: "Miriel’s Deck of Encounters", level: 1 })
  ).toBeVisible();
  await expect(
  page.getByText(/Version \d+\.\d+\.\d+/)
).toBeVisible();
  expect(errors).toEqual([]);
});

test("zentrale Bereiche der Demo-Oberfläche sind vorhanden", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("region", { name: "Encounter-Steuerung" })
  ).toBeVisible();

  const deckArea = page.getByRole("region", {
    name: "Kartendeck und Kartenverwaltung",
  });

  await expect(deckArea).toBeVisible();
  await expect(
    deckArea.getByRole("button", { name: "Kartenschmiede", exact: true })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Rechtliches/ })).toBeVisible();
});

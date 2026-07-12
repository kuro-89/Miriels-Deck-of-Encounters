import { test, expect } from "@playwright/test";

/**
 * Öffnet das Spielleiter-Atelier und gibt zentrale Werkzeugbereiche zurück.
 *
 * @param {import("@playwright/test").Page} page
 */
async function openDmTools(page) {
  await page
    .getByRole("region", { name: "Encounter-Steuerung" })
    .getByRole("button", { name: "Atelier öffnen", exact: true })
    .click();

  const damageRegion = page.getByRole("region", {
    name: "Schaden und Heilung",
  });

  const conditionRegion = page.getByRole("region", {
    name: "Condition",
  });

  await expect(damageRegion).toBeVisible();
  await expect(conditionRegion).toBeVisible();

  return { damageRegion, conditionRegion };
}

/**
 * Wählt Miriel als Ziel für Gruppenaktionen aus.
 *
 * @param {import("@playwright/test").Page} page
 */
async function selectMirielAsTarget(page) {
  const mirielHandCard = page
    .getByRole("article", { name: "Handkarte" })
    .filter({
      has: page.getByText("Miriel", { exact: true }),
    })
    .first();

  await mirielHandCard
    .getByRole("button", { name: "Ziel", exact: true })
    .click();

  await expect(
    mirielHandCard.getByRole("button", { name: /Ziel ✓/ })
  ).toBeVisible();
}

test("Heilung und temporäre HP verändern die Zielkarte korrekt", async ({
  page,
}) => {
  await page.goto("/");

  const { damageRegion } = await openDmTools(page);
  await selectMirielAsTarget(page);

  const focusCard = page.getByRole("region", { name: "Fokuskarte" });
  const amountInput = damageRegion.getByRole("spinbutton", {
    name: "HP-Wert",
    exact: true,
  });

  await amountInput.fill("3");
  await damageRegion
    .getByRole("button", { name: "Temp HP", exact: true })
    .click();

  await expect(focusCard.getByText(/Temp HP 3/)).toBeVisible();

  await amountInput.fill("5");
  await damageRegion
    .getByRole("button", { name: "Schaden", exact: true })
    .click();

  await expect(focusCard.getByText(/HP 53 \/ 55/)).toBeVisible();
  await expect(focusCard.getByText(/Temp HP 0/)).toBeVisible();

  await amountInput.fill("2");
  await damageRegion
    .getByRole("button", { name: "Heilung", exact: true })
    .click();

  await expect(focusCard.getByText(/HP 55 \/ 55/)).toBeVisible();
});

test("eine Condition kann hinzugefügt und wieder entfernt werden", async ({
  page,
}) => {
  await page.goto("/");

  const { conditionRegion } = await openDmTools(page);
  await selectMirielAsTarget(page);

  const conditionSelect = conditionRegion.getByRole("combobox", {
    name: "Condition auswählen",
  });

  await conditionSelect.selectOption("poisoned");

  await conditionRegion
    .getByRole("button", { name: "Hinzufügen", exact: true })
    .click();

  const focusCard = page.getByRole("region", { name: "Fokuskarte" });
  await expect(focusCard.getByText("Poisoned", { exact: true })).toBeVisible();

  await conditionRegion
    .getByRole("button", { name: "Entfernen", exact: true })
    .click();

  await expect(
    focusCard.getByText("Poisoned", { exact: true })
  ).toHaveCount(0);
});

test("Encounterstart wird an eine geöffnete Spielerseite synchronisiert", async ({
  context,
}) => {
  const dmPage = await context.newPage();
  await dmPage.goto("/");

  const playerPagePromise = context.waitForEvent("page");

  await dmPage
    .getByRole("button", {
      name: "Spielerseite öffnen",
      exact: true,
    })
    .click();

  const playerPage = await playerPagePromise;
  await playerPage.waitForLoadState("domcontentloaded");

  const waitingRegion = playerPage.getByRole("region", {
    name: "Encounter wartet auf Start",
  });

  await expect(waitingRegion).toBeVisible();

  await dmPage
    .getByRole("region", { name: "Rundensteuerung" })
    .getByRole("button", { name: "Starten", exact: true })
    .click();

  await expect(waitingRegion).toHaveCount(0);

  await expect(
    playerPage.getByText("Miriel", { exact: true }).first()
  ).toBeVisible();
});
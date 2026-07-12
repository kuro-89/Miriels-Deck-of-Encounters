import { test, expect } from "@playwright/test";

const DECK_AREA_NAME = "Kartendeck und Kartenverwaltung";

/**
 * Öffnet die Kartenschmiede und gibt den sichtbaren Karteneditor zurück.
 *
 * @param {import("@playwright/test").Page} page
 */
async function openCardForge(page) {
  const deckArea = page.getByRole("region", {
    name: DECK_AREA_NAME,
  });

  await deckArea
    .getByRole("button", {
      name: "Kartenschmiede",
      exact: true,
    })
    .click();

  const cardEditor = page.getByRole("complementary", {
    name: "Karteneditor",
  });

  await expect(cardEditor).toBeVisible();

  return cardEditor;
}

/**
 * Öffnet das Spielleiter-Atelier und gibt den Bereich für Schaden und Heilung zurück.
 *
 * @param {import("@playwright/test").Page} page
 */
async function openDmAtelier(page) {
  const encounterControls = page.getByRole("region", {
    name: "Encounter-Steuerung",
  });

  await encounterControls
    .getByRole("button", {
      name: "Atelier öffnen",
      exact: true,
    })
    .click();

  const damageRegion = page.getByRole("region", {
    name: "Schaden und Heilung",
  });

  await expect(damageRegion).toBeVisible();

  return damageRegion;
}

test("eine eigene Karte kann erstellt und nach Reload wiedergefunden werden", async ({
  page,
}) => {
  await page.goto("/");

  const cardEditor = await openCardForge(page);

  await cardEditor
    .getByRole("textbox", {
      name: "Interner Name",
      exact: true,
    })
    .fill("Automatischer Testwächter");

  await cardEditor
    .getByRole("textbox", {
      name: "Öffentlicher Name",
      exact: true,
    })
    .fill("Testwächter");

  await cardEditor
    .getByRole("spinbutton", {
      name: "Aktuelle HP",
      exact: true,
    })
    .fill("23");

  await cardEditor
    .getByRole("spinbutton", {
      name: "Max HP",
      exact: true,
    })
    .fill("23");

  await cardEditor
    .getByRole("button", {
      name: "Karte hinzufügen",
      exact: true,
    })
    .click();

  const deckArea = page.getByRole("region", {
    name: DECK_AREA_NAME,
  });

  await expect(
    deckArea.getByRole("heading", {
      name: "Automatischer Testwächter",
      exact: true,
    })
  ).toBeVisible();

  await page.reload();

  await expect(
    page
      .getByRole("region", {
        name: DECK_AREA_NAME,
      })
      .getByRole("heading", {
        name: "Automatischer Testwächter",
        exact: true,
      })
  ).toBeVisible();
});

test("Encounterstart und Zugwechsel funktionieren", async ({ page }) => {
  await page.goto("/");

  const roundControls = page.getByRole("region", {
    name: "Rundensteuerung",
  });

  await roundControls
    .getByRole("button", {
      name: "Starten",
      exact: true,
    })
    .click();

  await expect(
    roundControls.getByRole("button", {
      name: "Beenden",
      exact: true,
    })
  ).toBeVisible();

  const nextTurnButton = roundControls.getByRole("button", {
    name: "Nächster Zug",
    exact: true,
  });

  const previousTurnButton = roundControls.getByRole("button", {
    name: "Vorheriger Zug",
    exact: true,
  });

  await expect(nextTurnButton).toBeEnabled();

  const activeRound = page.getByRole("region", {
    name: "Aktive Runde",
  });

  const initialTurnText = await activeRound.textContent();

  await nextTurnButton.click();

  await expect
    .poll(async () => activeRound.textContent())
    .not.toBe(initialTurnText);

  await previousTurnButton.click();

  await expect
    .poll(async () => activeRound.textContent())
    .toBe(initialTurnText);
});

test("Schaden auf ein Ziel kann rückgängig gemacht werden", async ({
  page,
}) => {
  await page.goto("/");

  const damageRegion = await openDmAtelier(page);

  const mirielHandCard = page
    .getByRole("article", {
      name: "Handkarte",
    })
    .filter({
      has: page.getByText("Miriel", {
        exact: true,
      }),
    })
    .first();

  await mirielHandCard
    .getByRole("button", {
      name: "Ziel",
      exact: true,
    })
    .click();

  const focusCard = page.getByRole("region", {
    name: "Fokuskarte",
  });

  await expect(focusCard.getByText(/HP 55 \/ 55/)).toBeVisible();
  await expect(focusCard.getByText(/Temp HP 8/)).toBeVisible();

  await damageRegion
    .getByRole("spinbutton", {
      name: "HP-Wert",
      exact: true,
    })
    .fill("7");

  await damageRegion
    .getByRole("button", {
      name: "Schaden",
      exact: true,
    })
    .click();

  /*
   * Miriel besitzt zu Beginn 8 temporäre HP.
   * 7 Schaden reduzieren daher nur die temporären HP von 8 auf 1.
   * Die regulären HP bleiben bei 55.
   */
  await expect(focusCard.getByText(/HP 55 \/ 55/)).toBeVisible();
  await expect(focusCard.getByText(/Temp HP 1/)).toBeVisible();

  const undoButton = page
    .getByRole("button", {
      name: /Rückgängig/,
    })
    .first();

  await expect(undoButton).toBeVisible();
  await undoButton.click();

  await expect(focusCard.getByText(/HP 55 \/ 55/)).toBeVisible();
  await expect(focusCard.getByText(/Temp HP 8/)).toBeVisible();
});

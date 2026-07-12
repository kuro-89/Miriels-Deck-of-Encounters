import { describe, expect, test } from "vitest";
import { readFile } from "node:fs/promises";
import {
  createCardAction,
  createCardTrait,
  createDefaultSpellcasting,
  createInventoryDataFromLegacyText
} from "../../js/card-model.js";
import { isKnownDemoCardData } from "../../js/demo-data.js";

const appSource = await readFile(new URL("../../js/app.js", import.meta.url), "utf8");
const indexSource = await readFile(new URL("../../index.html", import.meta.url), "utf8");
const demoSource = await readFile(new URL("../../js/demo-data.js", import.meta.url), "utf8");
const modelSource = await readFile(new URL("../../js/card-model.js", import.meta.url), "utf8");
const schemaSource = await readFile(new URL("../../js/game-state-schema.js", import.meta.url), "utf8");
const srd51Source = await readFile(new URL("../../js/srd-spell-library.js", import.meta.url), "utf8");
const srd521Source = await readFile(new URL("../../js/srd-5.2.1-spell-library.js", import.meta.url), "utf8");

describe("ES-Modul-Bootstrap", () => {
  test("lädt Demo-Daten als Modul statt als klassisches Skript", () => {
    expect(indexSource).not.toContain('src="js/demo-data.js');
    expect(appSource).toContain('import { createDemoCards, isKnownDemoCardData } from "./demo-data.js";');
    expect(demoSource).toContain("export function createDemoCards()");
  });

  test("verwendet keine globale oder registrierte Demo-Modellbrücke", () => {
    expect(appSource).not.toContain("registerDemoModelApi");
    expect(appSource).not.toContain("Object.assign(globalThis");
    expect(appSource).not.toContain("window.createCardAction");
    expect(demoSource).toContain('from "./card-model.js"');
  });

  test("erkennt eigene Karten ohne globale Demo-Hilfsfunktion", () => {
    expect(isKnownDemoCardData({ name: "Automatischer Testwächter", isDemoCard: false })).toBe(false);
    expect(isKnownDemoCardData({ name: "Miriel Dunkelschön" })).toBe(true);
  });

  test("lädt das Spielstand-Schema als ES-Modul ohne globales window-Objekt", () => {
    expect(indexSource).not.toContain('src="js/game-state-schema.js');
    expect(appSource).toContain('import { gameStateSchema } from "./game-state-schema.js";');
    expect(schemaSource).toContain("export const gameStateSchema");
    expect(schemaSource).not.toContain("MirielsGameStateSchema");
    expect(schemaSource).not.toContain("})(window)");
  });

  test("lädt beide SRD-Bibliotheken als getrennte ES-Module", () => {
    expect(indexSource).not.toContain('src="js/srd-spell-library.js');
    expect(indexSource).not.toContain('src="js/srd-5.2.1-spell-library.js');
    expect(appSource).toContain('import { srd51SpellLibrary } from "./srd-spell-library.js";');
    expect(appSource).toContain('import { srd521SpellLibrary } from "./srd-5.2.1-spell-library.js";');
    expect(srd51Source).toContain("export const srd51SpellLibraryMeta");
    expect(srd51Source).toContain("export const srd51SpellLibrary");
    expect(srd521Source).toContain("export const srd521SpellLibraryMeta");
    expect(srd521Source).toContain("export const srd521SpellLibrary");
  });

  test("verwendet keine Inline-Handler und keine globale UI-Brücke", () => {
    expect(indexSource).not.toMatch(/\s(?:onclick|onchange|oninput|onsubmit)=/);
    expect(appSource).not.toMatch(/\s(?:onclick|onchange|oninput|onsubmit)=/);
    expect(appSource).not.toContain("Object.assign(window");
    expect(appSource).toContain("const uiActionHandlers = Object.freeze");
    expect(appSource).toContain('document.addEventListener(eventType, handleDelegatedUiEvent)');
  });

  test("stellt gemeinsam genutzte Modellfabriken direkt als Modul-Exports bereit", () => {
    expect(modelSource).toContain("export function createCardAction");
    expect(modelSource).toContain("export function createCardTrait");
    expect(modelSource).toContain("export function createDefaultSpellcasting");

    expect(createCardAction({ name: "A" }).name).toBe("A");
    expect(createCardTrait({ name: "B" }).name).toBe("B");
    expect(createDefaultSpellcasting({}).spells).toEqual([]);
    expect(createInventoryDataFromLegacyText("Heiltrank x2").cards[0].quantity).toBe(2);
  });
  test("respektiert stopPropagation vor der Click-away-Logik", () => {
    expect(appSource).toContain('targetElement.closest("[data-ui-click]")');
    expect(appSource).toContain('includes("event.stopPropagation()")');
  });

});

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
const uiEventsSource = await readFile(new URL("../../js/ui-events.js", import.meta.url), "utf8");
const focusStageSource = await readFile(new URL("../../js/focus-stage.js", import.meta.url), "utf8");
const appViewSource = await readFile(new URL("../../js/app-view.js", import.meta.url), "utf8");
const browserStorageSource = await readFile(new URL("../../js/browser-storage.js", import.meta.url), "utf8");
const drawerEventsSource = await readFile(new URL("../../js/drawer-events.js", import.meta.url), "utf8");
const encounterNavigationSource = await readFile(new URL("../../js/encounter-navigation.js", import.meta.url), "utf8");
const renderLifecycleSource = await readFile(new URL("../../js/render-lifecycle.js", import.meta.url), "utf8");
const atelierControllerSource = await readFile(new URL("../../js/atelier-controller.js", import.meta.url), "utf8");
const cardForgeControllerSource = await readFile(new URL("../../js/card-forge-controller.js", import.meta.url), "utf8");

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
    expect(appSource).toContain('registerDelegatedUiEvents({');
    expect(uiEventsSource).toContain('document.addEventListener(eventType');
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
    expect(drawerEventsSource).toContain('targetElement.closest("[data-ui-click]")');
    expect(drawerEventsSource).toContain('includes("event.stopPropagation()")');
  });

  test("dokumentiert die neuen Fachmodule mit Abhängigkeiten und Lieferbeziehungen", () => {
    for (const moduleSource of [uiEventsSource, focusStageSource, appViewSource, browserStorageSource]) {
      expect(moduleSource).toContain("Abhängigkeiten:");
      expect(moduleSource).toContain("Liefert an:");
    }
    expect(appSource).toContain('from "./ui-events.js"');
    expect(appSource).toContain('from "./focus-stage.js"');
    expect(appSource).toContain('from "./app-view.js"');
    expect(appSource).toContain('from "./browser-storage.js"');
    expect(appSource).toContain('from "./drawer-events.js"');
    expect(appSource).toContain('from "./encounter-navigation.js"');
    expect(appSource).toContain('from "./render-lifecycle.js"');
    expect(appSource).toContain('from "./atelier-controller.js"');
    expect(appSource).toContain('from "./card-forge-controller.js"');

    for (const moduleSource of [drawerEventsSource, encounterNavigationSource, renderLifecycleSource, atelierControllerSource, cardForgeControllerSource]) {
      expect(moduleSource).toContain("Abhängigkeiten:");
      expect(moduleSource).toContain("Liefert an:");
    }
  });

  test("delegiert Atelier und Kartenschmiede an eigene Controller", () => {
    expect(appSource).toContain("createAtelierController({");
    expect(appSource).toContain("createCardForgeController({");
    expect(atelierControllerSource).toContain("export function createAtelierController");
    expect(cardForgeControllerSource).toContain("export function createCardForgeController");
    expect(atelierControllerSource).toContain("Abhängigkeiten:");
    expect(cardForgeControllerSource).toContain("Liefert an:");
  });

  test("positioniert beide Geisterkarten explizit links und rechts", async () => {
    const styleSource = await readFile(new URL("../../style.css", import.meta.url), "utf8");
    expect(focusStageSource).toContain('createFocusStagePreviewCardHtml(siblingCards.previousCard, "previous")');
    expect(focusStageSource).toContain('createFocusStagePreviewCardHtml(siblingCards.nextCard, "next")');
    expect(styleSource).toContain('.focus-stage-ghost-card-previous');
    expect(styleSource).toContain('.focus-stage-ghost-card-next');
  });

  test("alle JavaScript-Module erklären Aufgabe, Abhängigkeiten und Lieferbeziehungen", async () => {
    const moduleUrls = [
      "access.js", "app-view.js", "app.js", "atelier-controller.js",
      "browser-storage.js", "card-forge-controller.js", "card-model.js",
      "config.js", "content-metadata.js", "demo-data.js", "drawer-events.js",
      "encounter-navigation.js", "focus-stage.js", "game-state-schema.js",
      "render-lifecycle.js", "srd-5.2.1-spell-library.js",
      "srd-spell-library.js", "state.js", "ui-events.js", "utils.js",
      "encounter-actions.js", "persistence-controller.js", "card-rendering.js",
      "encounter-rendering.js", "app-bootstrap.js"
    ];

    for (const fileName of moduleUrls) {
      const source = await readFile(new URL(`../../js/${fileName}`, import.meta.url), "utf8");
      expect(source, fileName).toContain("Aufgabe:");
      expect(source, fileName).toContain("Abhängigkeiten:");
      expect(source, fileName).toMatch(/Liefert an(?::| app\.js:| andere Module:)/);
    }
  });

});

test("geschlossene Drawer sind per visibility ausgeblendet", async () => {
  const styleSource = await readFile(
    new URL("../../style.css", import.meta.url),
    "utf8"
  );

  expect(styleSource).toMatch(
    /\.card-forge-drawer,\s*\.dm-action-drawer,\s*\.ah-dm-action-drawer\s*\{[\s\S]*?visibility:\s*hidden;/
  );
  expect(styleSource).toMatch(
    /\.card-forge-drawer\.card-forge-drawer-open,[\s\S]*?visibility:\s*visible;/
  );
});

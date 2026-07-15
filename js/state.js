/**
 * Initiale Anwendungs- und UI-Zustände
 * ====================================
 *
 * Aufgabe:
 * Erzeugt die zentralen mutablen Zustandsobjekte mit sicheren Ausgangswerten.
 * Die Datei verändert den Zustand nicht selbst und enthält kein Rendering.
 *
 * Abhängigkeiten:
 * - `config.js` für Demo- und Standardwerte.
 * - `utils.js` für die Spielstand-ID.
 *
 * Liefert an:
 * - `app.js` die Fabriken `createInitialGameState` und `createInitialUiState`.
 */

import { cardLocations, demoEncounterName, mirielBoardAutomationDefaultsVersion, useDemoData } from "./config.js";
import { createUniqueId } from "./utils.js";

/** Erzeugt die zentralen, mutablen Zustandsobjekte ohne DOM- oder Rendering-Abhängigkeit. */
export function createInitialGameState(initialCards = []) {
  return {
    id: createUniqueId(), name: useDemoData ? demoEncounterName : "Unbenannter Spielstand", cards: initialCards,
    encounter: { roundNumber: 1, currentTurnCardId: null, isStarted: false, startGateVersion: 2, activeRun: null, lastCompletedRun: null },
    eventLog: [],
    presentation: { manuallySelectedCardId: null, mirielBoard: { manualImageData: "", manualImageName: "", manualText: "", manualTextSize: "normal", manualTextPosition: "bottom", persistentMode: "off", autoTurnEnabled: false, durationMode: "normal", newRoundCallEnabled: true, triggerId: "", announcement: null } },
    settings: { mirielBoardAutomationDefaultsVersion }
  };
}
export function createInitialUiState() {
  return { focusedCardId: null, activeDetailTab: "values", activeDmFeedTab: "log", expandedSpellDetailKey: null, deck: { searchQuery: "", typeFilter: "all", sortMode: "name", locationView: cardLocations.deck } };
}

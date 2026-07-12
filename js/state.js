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

import { describe, expect, test } from "vitest";
import { createEncounterNavigation } from "../../js/encounter-navigation.js";

function createFixture(roundNumber = 1) {
  const cards = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const gameState = {
    encounter: {
      currentTurnCardId: 1,
      roundNumber
    }
  };
  const navigation = createEncounterNavigation({
    gameState,
    getHandCards: () => cards,
    getInitiativeCards: handCards => handCards
  });
  return { gameState, navigation };
}

describe("Encounter-Navigation", () => {
  test("setzt den aktuellen Zug innerhalb der Initiative-Reihenfolge", () => {
    const { gameState, navigation } = createFixture();
    navigation.setCurrentTurnIndex(2);
    expect(gameState.encounter.currentTurnCardId).toBe(3);
    expect(navigation.getCurrentTurnIndex()).toBe(2);
  });

  test("plant am Listenende den Beginn einer neuen Runde", () => {
    const { gameState, navigation } = createFixture();
    gameState.encounter.currentTurnCardId = 3;
    expect(navigation.getNextTurnPlan()).toMatchObject({
      targetIndex: 0,
      startsNewRound: true
    });
  });

  test("plant am Rundenanfang den vorherigen Zug der vorigen Runde", () => {
    const { navigation } = createFixture(2);
    expect(navigation.getPreviousTurnPlan()).toMatchObject({
      targetIndex: 2,
      crossesRoundBoundary: true
    });
  });
});

/**
 * Encounter-Navigation
 * ====================
 *
 * Aufgabe:
 * Dieses Modul verwaltet ausschließlich die Position des aktuellen Zuges in
 * der Initiative-Reihenfolge. Es kennt keine Darstellung, keine Dialoge und
 * keine Speicherlogik. Dadurch bleibt die Rundennavigation separat testbar.
 *
 * Abhängigkeiten:
 * - gameState: das von app.js bereitgestellte Zustandsobjekt.
 * - getHandCards() und getInitiativeCards(): fachliche Kartenabfragen aus app.js.
 *
 * Liefert an:
 * - getCurrentTurnIndex() und setCurrentTurnIndex().
 * - getNextTurnPlan() und getPreviousTurnPlan() als reine Entscheidungsdaten
 *   für die eigentlichen Encounter-Aktionen in app.js.
 */

export function createEncounterNavigation({ gameState, getHandCards, getInitiativeCards }) {
  function getInitiativeContext() {
    const handCards = getHandCards();
    return {
      handCards,
      initiativeCards: getInitiativeCards(handCards)
    };
  }

  function getCurrentTurnIndex() {
    const { initiativeCards } = getInitiativeContext();
    if (initiativeCards.length === 0 || gameState.encounter.currentTurnCardId === null) return 0;

    const index = initiativeCards.findIndex(card => card.id === gameState.encounter.currentTurnCardId);
    return index >= 0 ? index : 0;
  }

  function setCurrentTurnIndex(value) {
    const { initiativeCards } = getInitiativeContext();
    if (initiativeCards.length === 0) {
      gameState.encounter.currentTurnCardId = null;
      return;
    }

    const numericIndex = Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : 0;
    const safeIndex = Math.min(Math.max(numericIndex, 0), initiativeCards.length - 1);
    gameState.encounter.currentTurnCardId = initiativeCards[safeIndex].id;
  }

  function getNextTurnPlan() {
    const { handCards, initiativeCards } = getInitiativeContext();
    const currentIndex = getCurrentTurnIndex();
    const nextIndex = currentIndex + 1;
    const startsNewRound = initiativeCards.length > 0 && nextIndex >= initiativeCards.length;

    return {
      handCards,
      initiativeCards,
      currentIndex,
      targetIndex: startsNewRound ? 0 : nextIndex,
      startsNewRound
    };
  }

  function getPreviousTurnPlan() {
    const { handCards, initiativeCards } = getInitiativeContext();
    const currentIndex = getCurrentTurnIndex();
    const crossesRoundBoundary = currentIndex === 0 && gameState.encounter.roundNumber > 1;
    const targetIndex = currentIndex > 0
      ? currentIndex - 1
      : (crossesRoundBoundary ? initiativeCards.length - 1 : 0);

    return {
      handCards,
      initiativeCards,
      currentIndex,
      targetIndex,
      crossesRoundBoundary
    };
  }

  return {
    getCurrentTurnIndex,
    setCurrentTurnIndex,
    getNextTurnPlan,
    getPreviousTurnPlan
  };
}

/**
 * Darstellungshelfer für Encounter-Status
 * =======================================
 *
 * Aufgabe:
 * Formatiert kleine, wiederkehrende Encounter-Texte ohne DOM-Zugriff. Größere
 * Karten- und Panel-Renderer verbleiben zunächst in `app.js`, bis ihre
 * Abhängigkeiten weiter reduziert sind.
 *
 * Abhängigkeiten:
 * - Keine.
 *
 * Liefert an:
 * - `app.js` lesbare Beschriftungen für Zielauswahl und Aktionsprotokoll.
 */

export function formatSelectedTargetCount(count) {
  return count === 1 ? "1 Ziel ausgewählt" : `${count} Ziele ausgewählt`;
}

export function formatCurrentTurnText(roundNumber, turnIndex, cardCount) {
  const safeCount = Math.max(0, Number(cardCount) || 0);
  if (safeCount === 0) return `Runde ${roundNumber} · kein aktiver Zug`;
  return `Runde ${roundNumber} · Zug ${Math.min(safeCount, Number(turnIndex) + 1)} von ${safeCount}`;
}

/**
 * Reine Encounter-Aktionen
 * ========================
 *
 * Aufgabe:
 * Enthält zustandsnahe Kampfoperationen, die keine DOM-Elemente, Dialoge oder
 * Renderfunktionen kennen. Dadurch lassen sich Schaden, Heilung, temporäre HP
 * und Conditions unabhängig von der Oberfläche testen und wiederverwenden.
 *
 * Abhängigkeiten:
 * - Keine Projektmodule. Die Funktionen arbeiten ausschließlich auf den ihnen
 *   übergebenen Kartenobjekten und Werten.
 *
 * Liefert an:
 * - `app.js` für Einzel- und Gruppenaktionen im Spielleiter-Atelier.
 * - Unit-Tests für die zentralen Kampfregeln.
 */

export function applyDamageToCard(card, rawAmount) {
  const amount = Number(rawAmount);
  if (card === null || typeof card !== "object" || Number.isFinite(amount) === false || amount < 0) return false;

  const safeTempHp = Math.max(0, Number(card.tempHp) || 0);
  const safeHp = Math.max(0, Number(card.hp) || 0);

  if (amount <= safeTempHp) {
    card.tempHp = safeTempHp - amount;
    return true;
  }

  card.tempHp = 0;
  card.hp = Math.max(0, safeHp - (amount - safeTempHp));
  return true;
}

export function applyHealingToCard(card, rawAmount) {
  const amount = Number(rawAmount);
  if (card === null || typeof card !== "object" || Number.isFinite(amount) === false || amount < 0) return false;

  const maxHp = Math.max(0, Number(card.maxHp) || 0);
  const hp = Math.max(0, Number(card.hp) || 0);
  card.hp = Math.min(maxHp, hp + amount);
  return true;
}

export function applyTemporaryHpToCard(card, rawAmount) {
  const amount = Number(rawAmount);
  if (card === null || typeof card !== "object" || Number.isFinite(amount) === false || amount < 0) return false;

  card.tempHp = amount;
  return true;
}

export function addConditionToCardState(card, conditionName) {
  if (card === null || typeof card !== "object" || typeof conditionName !== "string" || conditionName === "") return false;
  if (Array.isArray(card.conditions) === false) card.conditions = [];
  if (card.conditions.includes(conditionName)) return false;
  card.conditions.push(conditionName);
  return true;
}

export function removeConditionFromCardState(card, conditionName) {
  if (card === null || typeof card !== "object" || Array.isArray(card.conditions) === false) return false;
  const nextConditions = card.conditions.filter(condition => condition !== conditionName);
  const changed = nextConditions.length !== card.conditions.length;
  card.conditions = nextConditions;
  return changed;
}

export function createHpSnapshot(cards) {
  return cards.map(card => ({ cardId: card.id, hp: card.hp, tempHp: card.tempHp }));
}

export function createConditionSnapshot(cards) {
  return cards.map(card => ({ cardId: card.id, conditions: [...(Array.isArray(card.conditions) ? card.conditions : [])] }));
}

export function createTargetNamesText(targets) {
  return targets.map(card => card.name).join(", ");
}

export function createActionTargetLogText(targets) {
  const names = createTargetNamesText(targets);
  return targets.length === 1 ? names : `: ${names}`;
}

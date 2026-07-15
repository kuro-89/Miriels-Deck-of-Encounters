import { describe, expect, test } from "vitest";
import {
  applyDamageToCard,
  applyHealingToCard,
  applyTemporaryHpToCard,
  addConditionToCardState,
  removeConditionFromCardState,
  createHpSnapshot
} from "../../js/encounter-actions.js";

describe("Encounter-Aktionen", () => {
  test("Schaden verbraucht zuerst temporäre HP", () => {
    const card = { id: 1, hp: 20, maxHp: 20, tempHp: 5, conditions: [] };
    applyDamageToCard(card, 8);
    expect(card).toMatchObject({ hp: 17, tempHp: 0 });
  });

  test("Heilung überschreitet die maximalen HP nicht", () => {
    const card = { hp: 18, maxHp: 20, tempHp: 0 };
    applyHealingToCard(card, 9);
    expect(card.hp).toBe(20);
  });

  test("temporäre HP und Conditions werden rein am Kartenmodell geändert", () => {
    const card = { id: 2, hp: 10, maxHp: 10, tempHp: 0, conditions: [] };
    expect(applyTemporaryHpToCard(card, 6)).toBe(true);
    expect(addConditionToCardState(card, "Blessed")).toBe(true);
    expect(addConditionToCardState(card, "Blessed")).toBe(false);
    expect(removeConditionFromCardState(card, "Blessed")).toBe(true);
    expect(createHpSnapshot([card])).toEqual([{ cardId: 2, hp: 10, tempHp: 6 }]);
  });
});

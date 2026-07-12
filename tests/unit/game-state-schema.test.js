import { describe, expect, test } from "vitest";
import { gameStateSchema as schema } from "../../js/game-state-schema.js";

const limits = {
  maxCards: 100,
  maxTraitsPerCard: 20,
  maxActionsPerCard: 20,
  maxInventoryCardsPerCard: 40,
  maxInventoryListItemsPerCard: 80,
  maxSpellsPerCard: 50,
  maxGameEvents: 500
};

describe("Game-State-Schema", () => {
  test("erkennt ungültiges JSON verständlich", () => {
    const result = schema.parseJsonText("{nicht-json}");
    expect(result.valid).toBe(false);
    expect(result.error.code).toBe("INVALID_JSON");
  });

  test("akzeptiert einen minimalen gültigen Export", () => {
    const text = JSON.stringify({
      formatName: schema.formatName,
      schemaVersion: schema.supportedSchemaVersion,
      gameState: { cards: [], encounter: {}, eventLog: [] }
    });
    const result = schema.parseAndPrepareImport(text, limits);
    expect(result.valid).toBe(true);
    expect(result.gameState.cards).toEqual([]);
  });

  test("lehnt einen nicht unterstützten Regelstand des Exportformats ab", () => {
    const result = schema.validateEnvelope({
      formatName: schema.formatName,
      schemaVersion: schema.supportedSchemaVersion + 1,
      gameState: { cards: [] }
    }, limits);
    expect(result.valid).toBe(false);
    expect(result.error.code).toBe("UNSUPPORTED_SCHEMA");
  });

  test("erzwingt Kartenlimits", () => {
    const result = schema.validateGameStateData({
      cards: Array.from({ length: 101 }, (_, id) => ({ id }))
    }, limits);
    expect(result.valid).toBe(false);
    expect(result.error.code).toBe("CARD_LIMIT");
  });
});

import { describe, expect, test } from "vitest";
import { createPersistenceController } from "../../js/persistence-controller.js";

describe("Persistenz-Controller", () => {
  test("speichert und liest den passenden Formatstand", () => {
    const store = new Map();
    const controller = createPersistenceController({
      storageKey: "state",
      formatVersion: 5,
      readItem: key => store.get(key) ?? null,
      writeItem: (key, value) => { store.set(key, value); return true; },
      removeItem: key => store.delete(key)
    });

    expect(controller.save({ formatVersion: 5, gameState: {} }).success).toBe(true);
    expect(controller.read()).toMatchObject({ status: "ok", value: { formatVersion: 5, gameState: {} } });
  });

  test("behandelt leere Speicherwerte ohne JSON-Parserfehler", () => {
    let value = "";
    const controller = createPersistenceController({
      storageKey: "state",
      formatVersion: 5,
      readItem: () => value,
      writeItem: () => true,
      removeItem: () => true
    });

    expect(controller.read()).toMatchObject({ status: "empty", value: null });

    value = "   \n\t";
    expect(controller.read()).toMatchObject({ status: "empty", value: null });
  });

  test("erkennt ungültige und veraltete Daten", () => {
    let value = "kein json";
    const controller = createPersistenceController({
      storageKey: "state",
      formatVersion: 5,
      readItem: () => value,
      writeItem: () => true,
      removeItem: () => true
    });

    expect(controller.read().status).toBe("invalid");
    value = JSON.stringify({ formatVersion: 4 });
    expect(controller.read().status).toBe("outdated");
  });
});

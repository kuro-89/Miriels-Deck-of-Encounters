import { describe, expect, test } from "vitest";
import { runClassicScript } from "../helpers/load-classic-script.js";

const srd51 = runClassicScript(
  "js/srd-spell-library.js",
  "globalThis.__meta = srd51SpellLibraryMeta; globalThis.__library = srd51SpellLibrary;"
);
const srd521 = runClassicScript(
  "js/srd-5.2.1-spell-library.js",
  "globalThis.__meta = srd521SpellLibraryMeta; globalThis.__library = srd521SpellLibrary;"
);

function ids(library) {
  return Array.from(library, entry => entry.id);
}

describe("SRD-Bibliotheken", () => {
  test("führen 5.1 und 5.2.1 als getrennte Quellen", () => {
    expect(srd51.__meta.key).toBe("srd51-de");
    expect(srd521.__meta.key).toBe("srd521-de");
    expect(srd51.__meta.key).not.toBe(srd521.__meta.key);
  });

  test.each([
    ["SRD 5.1", srd51.__library],
    ["SRD 5.2.1", srd521.__library]
  ])("%s enthält keine doppelten IDs", (_label, library) => {
    const libraryIds = ids(library);
    expect(new Set(libraryIds).size).toBe(libraryIds.length);
  });

  test("verwendet keine ID gleichzeitig in beiden Regelständen", () => {
    const overlap = ids(srd51.__library).filter(id => ids(srd521.__library).includes(id));
    expect(overlap).toEqual([]);
  });

  test("jeder Eintrag besitzt die minimal benötigten strukturierten Felder", () => {
    for (const entry of [...srd51.__library, ...srd521.__library]) {
      expect(entry.id).toMatch(/^srd/);
      expect(entry.name.trim().length).toBeGreaterThan(0);
      expect(Number.isInteger(entry.level)).toBe(true);
      expect(entry.description.trim().length).toBeGreaterThan(0);
    }
  });
});

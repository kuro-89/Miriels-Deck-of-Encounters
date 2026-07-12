import { describe, expect, test } from "vitest";
import {
  srd51SpellLibraryMeta,
  srd51SpellLibrary
} from "../../js/srd-spell-library.js";
import {
  srd521SpellLibraryMeta,
  srd521SpellLibrary
} from "../../js/srd-5.2.1-spell-library.js";

function ids(library) {
  return Array.from(library, entry => entry.id);
}

describe("SRD-Bibliotheken", () => {
  test("führen 5.1 und 5.2.1 als getrennte Quellen", () => {
    expect(srd51SpellLibraryMeta.key).toBe("srd51-de");
    expect(srd521SpellLibraryMeta.key).toBe("srd521-de");
    expect(srd51SpellLibraryMeta.key).not.toBe(srd521SpellLibraryMeta.key);
  });

  test.each([
    ["SRD 5.1", srd51SpellLibrary],
    ["SRD 5.2.1", srd521SpellLibrary]
  ])("%s enthält keine doppelten IDs", (_label, library) => {
    const libraryIds = ids(library);
    expect(new Set(libraryIds).size).toBe(libraryIds.length);
  });

  test("verwendet keine ID gleichzeitig in beiden Regelständen", () => {
    const overlap = ids(srd51SpellLibrary).filter(id => ids(srd521SpellLibrary).includes(id));
    expect(overlap).toEqual([]);
  });

  test("jeder Eintrag besitzt die minimal benötigten strukturierten Felder", () => {
    for (const entry of [...srd51SpellLibrary, ...srd521SpellLibrary]) {
      expect(entry.id).toMatch(/^srd/);
      expect(entry.name.trim().length).toBeGreaterThan(0);
      expect(Number.isInteger(entry.level)).toBe(true);
      expect(entry.description.trim().length).toBeGreaterThan(0);
    }
  });
});

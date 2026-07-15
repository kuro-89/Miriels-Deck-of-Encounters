import { describe, expect, test } from "vitest";
import {
  createModuleGraph,
  findImportCycles,
  findMissingModules
} from "../../scripts/check-module-graph.mjs";

describe("ES-Modularchitektur", () => {
  test("alle lokalen Importziele existieren und der Graph enthält keine Zyklen", async () => {
    const graph = await createModuleGraph();

    expect(findMissingModules(graph)).toEqual([]);
    expect(findImportCycles(graph)).toEqual([]);
  });

  test("app.js bleibt der Einstieg und Fachmodule importieren app.js nicht zurück", async () => {
    const graph = await createModuleGraph();

    expect(graph.get("app.js")?.length).toBeGreaterThan(10);
    for (const [moduleName, dependencies] of graph) {
      if (moduleName !== "app.js") {
        expect(dependencies, moduleName).not.toContain("app.js");
      }
    }
  });

  test("SRD 5.1 und SRD 5.2.1 bleiben getrennte Inhaltsmodule", async () => {
    const graph = await createModuleGraph();

    expect(graph.has("srd-spell-library.js")).toBe(true);
    expect(graph.has("srd-5.2.1-spell-library.js")).toBe(true);
    expect(graph.get("srd-spell-library.js")).not.toContain("srd-5.2.1-spell-library.js");
    expect(graph.get("srd-5.2.1-spell-library.js")).not.toContain("srd-spell-library.js");
  });
});

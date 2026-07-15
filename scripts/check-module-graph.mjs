/**
 * Architekturprüfung für die ES-Module
 * ====================================
 *
 * Aufgabe:
 * Liest alle lokalen JavaScript-Importe unter `js/`, prüft auf fehlende Ziele
 * und zyklische Abhängigkeiten und gibt einen kompakten Importgraphen aus.
 *
 * Abhängigkeiten:
 * - Ausschließlich Node.js-Standardmodule (`node:fs`, `node:path`, `node:url`).
 *
 * Liefert an:
 * - `npm run test:architecture` sowie den zugehörigen Unit-Test.
 */

import { readdir, readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const jsRoot = resolve(projectRoot, "js");
const importPattern = /\b(?:import|export)\s+(?:[^"']*?\s+from\s+)?["'](\.\.?\/[^"']+)["']/g;

export async function createModuleGraph() {
  const fileNames = (await readdir(jsRoot))
    .filter(fileName => fileName.endsWith(".js"))
    .sort();
  const graph = new Map();

  for (const fileName of fileNames) {
    const absolutePath = resolve(jsRoot, fileName);
    const source = await readFile(absolutePath, "utf8");
    const dependencies = [];

    for (const match of source.matchAll(importPattern)) {
      const targetPath = resolve(dirname(absolutePath), match[1]);
      const targetName = relative(jsRoot, targetPath).replaceAll("\\", "/");
      if (!targetName.startsWith("../") && targetName.endsWith(".js")) {
        dependencies.push(targetName);
      }
    }

    graph.set(fileName, [...new Set(dependencies)].sort());
  }

  return graph;
}

export function findMissingModules(graph) {
  const knownModules = new Set(graph.keys());
  const missing = [];

  for (const [moduleName, dependencies] of graph) {
    for (const dependency of dependencies) {
      if (!knownModules.has(dependency)) {
        missing.push(`${moduleName} -> ${dependency}`);
      }
    }
  }

  return missing;
}

export function findImportCycles(graph) {
  const visited = new Set();
  const active = new Set();
  const stack = [];
  const cycles = [];

  function visit(moduleName) {
    if (active.has(moduleName)) {
      const cycleStart = stack.indexOf(moduleName);
      cycles.push([...stack.slice(cycleStart), moduleName]);
      return;
    }
    if (visited.has(moduleName)) return;

    visited.add(moduleName);
    active.add(moduleName);
    stack.push(moduleName);

    for (const dependency of graph.get(moduleName) ?? []) {
      if (graph.has(dependency)) visit(dependency);
    }

    stack.pop();
    active.delete(moduleName);
  }

  for (const moduleName of graph.keys()) visit(moduleName);
  return cycles;
}

export function formatModuleGraph(graph) {
  return [...graph.entries()]
    .map(([moduleName, dependencies]) => `${moduleName}: ${dependencies.join(", ") || "—"}`)
    .join("\n");
}

async function run() {
  const graph = await createModuleGraph();
  const missing = findMissingModules(graph);
  const cycles = findImportCycles(graph);

  if (missing.length > 0 || cycles.length > 0) {
    if (missing.length > 0) console.error(`Fehlende Module:\n${missing.join("\n")}`);
    if (cycles.length > 0) console.error(`Importzyklen:\n${cycles.map(cycle => cycle.join(" -> ")).join("\n")}`);
    process.exitCode = 1;
    return;
  }

  console.log(formatModuleGraph(graph));
  console.log(`\nArchitekturprüfung bestanden: ${graph.size} Module, keine fehlenden Ziele, keine Zyklen.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await run();
}

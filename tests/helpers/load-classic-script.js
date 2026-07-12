/**
 * Lädt ein klassisches Browser-Skript isoliert in einen VM-Kontext.
 * Dadurch können bereits ausgelagerte Bibliotheken getestet werden,
 * ohne Test-Hooks in den Produktivcode einzubauen.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

export function runClassicScript(relativePath, exposeExpression = "") {
  const absolutePath = path.resolve(process.cwd(), relativePath);
  const source = fs.readFileSync(absolutePath, "utf8");
  const sandbox = { console, structuredClone, crypto, Date, setTimeout, clearTimeout, createUniqueId: () => crypto.randomUUID() };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(`${source}\n${exposeExpression}`, sandbox, { filename: absolutePath });
  return sandbox;
}

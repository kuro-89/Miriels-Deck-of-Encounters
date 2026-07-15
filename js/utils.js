/**
 * Allgemeine DOM-unabhängige Hilfsfunktionen
 * ==========================================
 *
 * Aufgabe:
 * Stellt kleine, fachübergreifende Hilfen bereit. Aktuell ist dies die robuste
 * Erzeugung eindeutiger IDs mit Browser-/Node-Fallback.
 *
 * Abhängigkeiten:
 * - Standard-API `globalThis.crypto`, sofern verfügbar.
 *
 * Liefert an:
 * - Modell-, Zustands- und Schema-Module eindeutige IDs.
 */

export function createUniqueId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") return globalThis.crypto.randomUUID();
  const randomBytes = new Uint8Array(16);
  if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === "function") globalThis.crypto.getRandomValues(randomBytes);
  else for (let index = 0; index < randomBytes.length; index += 1) randomBytes[index] = Math.floor(Math.random() * 256);
  randomBytes[6] = (randomBytes[6] & 0x0f) | 0x40;
  randomBytes[8] = (randomBytes[8] & 0x3f) | 0x80;
  const hex = Array.from(randomBytes, value => value.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

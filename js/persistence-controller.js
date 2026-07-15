/**
 * Persistenz-Controller
 * =====================
 *
 * Aufgabe:
 * Kapselt das Serialisieren, Lesen, Validieren und Schreiben des lokalen
 * Anwendungszustands. Das Modul kennt weder Kartenmodell noch Rendering;
 * fachliche Migrationen bleiben bewusst in `app.js`.
 *
 * Abhängigkeiten:
 * - Erwartet Storage-Funktionen als Callbacks. Standardmäßig werden die
 *   Adapter aus `browser-storage.js` von `app.js` übergeben.
 *
 * Liefert an:
 * - `app.js` eine kleine API für lokalen Zustand: `serialize`, `save`, `read`
 *   und `remove`.
 */

export function createPersistenceController({ storageKey, readItem, writeItem, removeItem, formatVersion }) {
  if (typeof storageKey !== "string" || storageKey === "") throw new TypeError("storageKey fehlt.");

  function serialize(state) {
    return JSON.stringify(state);
  }

  function save(state) {
    const text = serialize(state);
    return { success: writeItem(storageKey, text), text };
  }

  function read() {
    const storedValue = readItem(storageKey);

    if (storedValue === null || storedValue === undefined) {
      return { status: "empty", text: null, value: null };
    }

    const text = String(storedValue);

    if (text.trim() === "") {
      return { status: "empty", text, value: null };
    }

    try {
      const value = JSON.parse(text);
      if (value === null || typeof value !== "object" || value.formatVersion !== formatVersion) {
        return { status: "outdated", text, value: null };
      }
      return { status: "ok", text, value };
    } catch {
      return { status: "invalid", text, value: null };
    }
  }

  function remove() {
    return removeItem(storageKey);
  }

  return Object.freeze({ serialize, save, read, remove });
}

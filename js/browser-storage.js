/**
 * Aufgabe:
 * Kapselt den fehlertoleranten Zugriff auf den Browser-Speicher.
 *
 * Abhängigkeiten:
 * - Browser-API: localStorage.
 * - Keine Abhängigkeit zu anderen Projektmodulen.
 *
 * Liefert an:
 * - app.js: sichere Lese-, Schreib- und Löschoperationen. Fehler wie gesperrter
 *   Speicher oder private Browsermodi werden in neutrale Rückgabewerte übersetzt.
 */

export function getBrowserStorageItem(storageKey) {
    try {
        return localStorage.getItem(storageKey);
    } catch {
        return null;
    }
}

export function setBrowserStorageItem(storageKey, storageValue) {
    try {
        localStorage.setItem(storageKey, storageValue);
        return true;
    } catch {
        return false;
    }
}

export function removeBrowserStorageItem(storageKey) {
    try {
        localStorage.removeItem(storageKey);
        return true;
    } catch {
        return false;
    }
}

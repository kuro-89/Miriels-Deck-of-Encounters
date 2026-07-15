/**
 * Kartenschmiede: Drawer und Tab-Navigation
 * =========================================
 *
 * Aufgabe:
 * Dieses Modul steuert den äußeren Karteneditor: Drawer öffnen/schließen und
 * zwischen Basisdaten, Werten, Aktionen, Traits, Notizen, Zaubern und Inventar
 * wechseln. Die eigentlichen Formular- und Kartenmodelldaten verbleiben in
 * `app.js` beziehungsweise `card-model.js`.
 *
 * Abhängigkeiten:
 * - Browser-DOM (`document`, `requestAnimationFrame`).
 * - Von `app.js` injizierte Callbacks für Schließprüfung, Editor-Aufräumen,
 *   Scroll-Erhalt und das Nachrendern tababhängiger Inhalte.
 *
 * Liefert an:
 * - `app.js` einen Controller mit `open`, `close`, `setTab` und `getElement`.
 */

const allowedTabNames = new Set([
  "basis", "values", "actions", "traits", "notes", "spells", "inventory"
]);

export function createCardForgeController({
  closeFloatingDetails,
  lockPageScroll,
  schedulePageScrollUnlock,
  canClose,
  beforeClose,
  getScrollSnapshot,
  restoreScrollSnapshot,
  onTabSelected
}) {
  function getElement() {
    return document.querySelector("#card-forge-drawer");
  }

  function open() {
    const drawerElement = getElement();
    if (drawerElement === null) return;

    closeFloatingDetails?.();
    drawerElement.classList.add("card-forge-drawer-open");
    lockPageScroll?.();
  }

  function close() {
    const drawerElement = getElement();
    if (drawerElement === null) return false;

    if (drawerElement.classList.contains("card-forge-drawer-open") && canClose?.() === false) {
      return false;
    }

    beforeClose?.();
    drawerElement.classList.remove("card-forge-drawer-open");
    schedulePageScrollUnlock?.();
    return true;
  }

  function setTab(tabName) {
    const scrollSnapshot = getScrollSnapshot?.();
    const safeTabName = allowedTabNames.has(tabName) ? tabName : "basis";

    for (const panelElement of document.querySelectorAll(".forge-tab-panel")) {
      panelElement.classList.toggle(
        "forge-tab-active",
        panelElement.classList.contains(`forge-tab-${safeTabName}`)
      );
    }

    for (const buttonElement of document.querySelectorAll(".forge-tab-button")) {
      const isActive = buttonElement.dataset.forgeTab === safeTabName;
      buttonElement.classList.toggle("active-detail-tab", isActive);
      buttonElement.setAttribute("aria-selected", isActive ? "true" : "false");
    }

    onTabSelected?.(safeTabName);

    if (scrollSnapshot !== undefined) {
      restoreScrollSnapshot?.(scrollSnapshot);
      requestAnimationFrame(() => restoreScrollSnapshot?.(scrollSnapshot));
    }
  }

  return { getElement, open, close, setTab };
}

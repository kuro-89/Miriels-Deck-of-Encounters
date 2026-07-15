/**
 * Spielleiter-Atelier: Drawer und Bereichsnavigation
 * ==================================================
 *
 * Aufgabe:
 * Dieses Modul steuert nur den sichtbaren Zustand des Spielleiter-Ateliers:
 * Öffnen, Schließen, Wechsel zwischen Werkzeugkiste/Kartenschmiede/Schautafel/
 * Archiv sowie das kleine Hilfe-Panel. Fachaktionen wie Schaden, Heilung oder
 * Kartenbearbeitung bleiben bewusst in den zuständigen App-Bereichen.
 *
 * Abhängigkeiten:
 * - Browser-DOM (`document`).
 * - Von `app.js` injizierte Callbacks für Scroll-Sperre und schwebende Details.
 *
 * Liefert an:
 * - `app.js` einen Controller mit `open`, `close`, `setPanel`, `closeHelp`,
 *   `toggleHelp` und `getElement`.
 */

const allowedPanelNames = new Set(["toolbox", "forge", "board", "archive"]);

export function createAtelierController({
  closeFloatingDetails,
  lockPageScroll,
  schedulePageScrollUnlock
}) {
  function getElement() {
    return document.querySelector("#dm-action-drawer");
  }

  function setPanel(panelName) {
    const safePanelName = allowedPanelNames.has(panelName) ? panelName : "toolbox";

    for (const panelElement of document.querySelectorAll(".atelier-panel")) {
      panelElement.classList.toggle(
        "atelier-panel-active",
        panelElement.dataset.atelierPanel === safePanelName
      );
    }

    for (const buttonElement of document.querySelectorAll(".atelier-nav-button")) {
      const isActive = buttonElement.getAttribute("aria-controls") === `atelier-panel-${safePanelName}`;
      buttonElement.classList.toggle("atelier-nav-button-active", isActive);
      buttonElement.setAttribute("aria-selected", isActive ? "true" : "false");
    }
  }

  function closeHelp() {
    const helpPanelElement = document.querySelector("#atelier-help-panel");
    const helpButtonElement = document.querySelector(".toolkit-help-toggle");

    helpPanelElement?.classList.add("toolkit-help-panel-hidden");
    helpButtonElement?.setAttribute("aria-expanded", "false");
  }

  function toggleHelp() {
    const helpPanelElement = document.querySelector("#atelier-help-panel");
    const helpButtonElement = document.querySelector(".toolkit-help-toggle");

    if (helpPanelElement === null) return;

    const willOpen = helpPanelElement.classList.contains("toolkit-help-panel-hidden");
    helpPanelElement.classList.toggle("toolkit-help-panel-hidden", !willOpen);
    helpButtonElement?.setAttribute("aria-expanded", willOpen ? "true" : "false");
  }

  function open(panelName = "toolbox") {
    const drawerElement = getElement();
    if (drawerElement === null) return;

    closeFloatingDetails?.();
    setPanel(panelName);
    closeHelp();
    drawerElement.classList.add("dm-action-drawer-open");
    lockPageScroll?.();
  }

  function close() {
    const drawerElement = getElement();
    if (drawerElement === null) return;

    drawerElement.classList.remove("dm-action-drawer-open");
    schedulePageScrollUnlock?.();
  }

  return { getElement, open, close, setPanel, closeHelp, toggleHelp };
}

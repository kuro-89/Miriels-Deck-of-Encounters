/**
 * Drawer- und Click-away-Ereignisse
 * =================================
 *
 * Aufgabe:
 * Dieses Modul bündelt die globalen Eingabeereignisse für Atelier,
 * Kartenschmiede, schwebende Menüs und Inline-Editoren. Es entscheidet nur,
 * welcher Bereich auf einen Außenklick oder Escape reagieren soll; die
 * eigentlichen Fachaktionen werden als Callbacks von app.js geliefert.
 *
 * Abhängigkeiten:
 * - Browser-DOM und splitUiActionStatements() aus ui-events.js.
 * - Von app.js injizierte Getter, Zustandsabfragen und Schließfunktionen.
 *
 * Liefert an:
 * - registerDrawerAndClickAwayEvents(): registriert pointerdown-, click- und
 *   keydown-Listener und gibt eine Cleanup-Funktion zurück.
 */

import { splitUiActionStatements } from "./ui-events.js";

function actionPreservesOpenDrawer(targetElement) {
  const actionElement = targetElement.closest("[data-ui-click]");
  const expression = actionElement instanceof HTMLElement
    ? actionElement.getAttribute("data-ui-click") || ""
    : "";
  return splitUiActionStatements(expression).includes("event.stopPropagation()");
}

export function registerDrawerAndClickAwayEvents(dependencies) {
  const {
    getCardForgeDrawerElement,
    getDmActionDrawerElement,
    closeCardForgeDrawer,
    closeDmActionDrawer,
    closeFloatingDetailsExcept,
    closeCombatLogInlinePanelsExcept,
    hasOpenDetailInventoryEditor,
    consumeDetailInventoryClickAwaySuppression,
    cancelDetailInventoryEditor,
    handleOpenForgeEditorClickAway,
    closeHeaderHelp
  } = dependencies;

  function handleDrawerPointerDown(event) {
    const targetElement = event.target;
    if (!(targetElement instanceof Element) || actionPreservesOpenDrawer(targetElement)) return;

    const forgeDrawer = getCardForgeDrawerElement();
    if (forgeDrawer?.classList.contains("card-forge-drawer-open")) {
      const inside = forgeDrawer.contains(targetElement);
      const trigger = targetElement.closest(".card-forge-open-button, .card-forge-edit-button") !== null;
      if (!inside && !trigger) closeCardForgeDrawer();
    }

    const dmDrawer = getDmActionDrawerElement();
    if (dmDrawer?.classList.contains("dm-action-drawer-open")) {
      const inside = dmDrawer.contains(targetElement);
      const trigger = targetElement.closest(".dm-actions-open-button") !== null;
      if (!inside && !trigger) closeDmActionDrawer();
    }
  }

  function handleDocumentClick(event) {
    const targetElement = event.target;
    if (!(targetElement instanceof Element) || actionPreservesOpenDrawer(targetElement)) return;

    closeHeaderHelp(targetElement);

    const activeDetails = targetElement.closest("details.card-menu, details.section-menu, details.inline-details-menu");
    closeFloatingDetailsExcept(activeDetails);

    const activeCombatLogEntry = targetElement.closest(".combat-log-entry");
    closeCombatLogInlinePanelsExcept(activeCombatLogEntry);

    if (hasOpenDetailInventoryEditor()) {
      const insideEditor = targetElement.closest(".inventory-inline-editor") !== null;
      const editorTrigger = targetElement.closest(
        ".inventory-add-menu, .inventory-item-menu, .inventory-list-add-button, .inventory-list-row-actions"
      ) !== null;

      if (!consumeDetailInventoryClickAwaySuppression() && !insideEditor && !editorTrigger) {
        cancelDetailInventoryEditor();
      }
    }

    handleOpenForgeEditorClickAway(targetElement);
  }

  function handleEscape(event) {
    if (event.key !== "Escape") return;

    closeFloatingDetailsExcept(null);
    if (hasOpenDetailInventoryEditor()) cancelDetailInventoryEditor();
    closeCardForgeDrawer();
    closeDmActionDrawer();
  }

  window.addEventListener("pointerdown", handleDrawerPointerDown, { capture: true });
  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("keydown", handleEscape);

  return function removeDrawerAndClickAwayEvents() {
    window.removeEventListener("pointerdown", handleDrawerPointerDown, { capture: true });
    document.removeEventListener("click", handleDocumentClick);
    document.removeEventListener("keydown", handleEscape);
  };
}

/**
 * Startreihenfolge der Anwendung
 * ==============================
 *
 * Aufgabe:
 * Führt die beim Laden nötigen Initialisierungsschritte in einer dokumentierten
 * Reihenfolge aus. Fachfunktionen werden als Callbacks injiziert, sodass dieses
 * Modul weder Zustand noch konkrete DOM-Strukturen kennen muss.
 *
 * Abhängigkeiten:
 * - Keine direkten Projektmodule.
 *
 * Liefert an:
 * - `app.js` die Funktion `bootstrapApplication`.
 */

export function bootstrapApplication({
  applyView,
  setupCrossTabSync,
  loadState,
  initializeFallbackState,
  setupPlayerPolling,
  setupPlayerNavigation,
  setupClickAway,
  setupArcaneSelects,
  setupInstructionalFields,
  render,
  enhanceArcaneSelects
}) {
  applyView();
  setupCrossTabSync();

  const wasStateLoaded = loadState();
  if (wasStateLoaded === false) initializeFallbackState();

  setupPlayerPolling();
  setupPlayerNavigation();
  setupClickAway();
  setupArcaneSelects();
  setupInstructionalFields();
  render();
  enhanceArcaneSelects();

  return { wasStateLoaded };
}

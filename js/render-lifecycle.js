/**
 * Render-Lebenszyklus und Scroll-Erhalt
 * =====================================
 *
 * Aufgabe:
 * Dieses Modul kapselt die browserbezogene Logik, die Scrollpositionen vor
 * einem größeren Renderdurchlauf merkt und danach zuverlässig wiederherstellt.
 * Dadurch können Fachmodule rendern, ohne selbst DOM-Timing, Animation Frames
 * und verzögerte Layout-Korrekturen kennen zu müssen.
 *
 * Abhängigkeiten:
 * - Browser-APIs: window, document, requestAnimationFrame und setTimeout.
 * - Keine Abhängigkeit von app.js oder vom Spielzustand.
 *
 * Liefert an:
 * - createRenderLifecycle(): erzeugt die Funktionen zum Erfassen,
 *   Wiederherstellen und scrollstabilen Ausführen eines Renderdurchlaufs.
 */

const defaultScrollSelectors = [
  ".card-forge-panel",
  ".forge-tab-grid",
  ".ah-drawer-panel",
  "#card-detail-panel .active-hand-detail-scroll",
  ".dm-action-drawer-content",
  ".card-forge-scroll",
  "#deck-card-list"
];

export function createRenderLifecycle(options = {}) {
  const scrollSelectors = Array.isArray(options.scrollSelectors)
    ? options.scrollSelectors
    : defaultScrollSelectors;

  function getViewportScrollSnapshot() {
    const scrollElements = [
      document.scrollingElement,
      document.documentElement,
      document.body,
      ...scrollSelectors.map(selector => document.querySelector(selector))
    ].filter((element, index, list) => element !== null && list.indexOf(element) === index);

    return {
      windowX: window.scrollX || window.pageXOffset || 0,
      windowY: window.scrollY || window.pageYOffset || 0,
      elements: scrollElements.map(element => ({
        element,
        scrollLeft: element.scrollLeft,
        scrollTop: element.scrollTop
      }))
    };
  }

  function restoreViewportScrollSnapshot(snapshot) {
    if (snapshot == null) return;

    window.scrollTo(snapshot.windowX, snapshot.windowY);

    for (const item of snapshot.elements) {
      if (item.element != null) {
        item.element.scrollLeft = item.scrollLeft;
        item.element.scrollTop = item.scrollTop;
      }
    }
  }

  function restoreViewportScrollSnapshotRobustly(snapshot) {
    restoreViewportScrollSnapshot(snapshot);

    requestAnimationFrame(() => {
      restoreViewportScrollSnapshot(snapshot);
      requestAnimationFrame(() => restoreViewportScrollSnapshot(snapshot));
    });

    for (const delay of [40, 120, 260, 520]) {
      setTimeout(() => restoreViewportScrollSnapshot(snapshot), delay);
    }
  }

  function preserveViewportWhileRendering(renderCallback) {
    const snapshot = getViewportScrollSnapshot();
    renderCallback();
    restoreViewportScrollSnapshot(snapshot);

    requestAnimationFrame(() => {
      restoreViewportScrollSnapshot(snapshot);
      requestAnimationFrame(() => restoreViewportScrollSnapshot(snapshot));
    });

    setTimeout(() => restoreViewportScrollSnapshot(snapshot), 40);
  }

  function renderPreservingViewport(renderCallback) {
    const snapshot = getViewportScrollSnapshot();
    renderCallback();
    restoreViewportScrollSnapshotRobustly(snapshot);
  }

  return {
    getViewportScrollSnapshot,
    restoreViewportScrollSnapshot,
    restoreViewportScrollSnapshotRobustly,
    preserveViewportWhileRendering,
    renderPreservingViewport
  };
}

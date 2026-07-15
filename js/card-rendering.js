/**
 * Kleine Rendering-Bausteine für Kartenlisten
 * ===========================================
 *
 * Aufgabe:
 * Bündelt wiederkehrende DOM-Schritte beim Rendern von Kartenlisten. Die
 * fachlichen HTML-Erzeuger bleiben vorerst in `app.js`, während dieses Modul
 * das sichere Auffinden, Leeren und Befüllen der Zielbereiche übernimmt.
 *
 * Abhängigkeiten:
 * - Browser-DOM.
 *
 * Liefert an:
 * - `app.js` mit `renderHtmlCollection` einen einheitlichen Listen-Renderer.
 */

export function renderHtmlCollection({ selector, items, createHtml, emptyHtml = "" }) {
  const element = document.querySelector(selector);
  if (element === null) return false;

  if (items.length === 0) {
    element.innerHTML = emptyHtml;
    return true;
  }

  element.innerHTML = items.map(createHtml).join("");
  return true;
}

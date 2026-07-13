/**
 * Steuert ausschließlich die Auswahl zwischen Spielleiter- und Spielerseite.
 *
 * Abhängigkeiten:
 * - Browser-APIs: window.location, window.open und document.
 * - Keine Abhängigkeit zu anderen Projektmodulen.
 *
 * Liefert an:
 * - app.js: Ermittlung des aktuellen Ansichtsmodus, Öffnen einer zweiten Ansicht
 *   und Anpassung der statischen Seitenelemente an die aktive Ansicht.
 */

export function getAppViewFromUrl() {
    const urlParameters = new URLSearchParams(window.location.search);
    return urlParameters.get("view") === "player-side" ? "playerSide" : "dm";
}

export function openAppView(viewName) {
    const targetUrl = new URL(window.location.href);
    targetUrl.searchParams.set("view", viewName === "playerSide" ? "player-side" : "dm");
    window.open(targetUrl.toString(), "_blank");
}

export function applyAppViewToPage(appView) {
    document.body.classList.toggle("player-side-view", appView === "playerSide");
    document.body.classList.toggle("dm-side-view", appView !== "playerSide");

    const kickerElement = document.querySelector("#app-view-kicker");
    if (kickerElement !== null) {
        kickerElement.textContent = appView === "playerSide" ? "Spielerseite" : "Spielleiterseite";
    }

    const dmButtonElement = document.querySelector("#open-dm-side-view-button");
    const playerSideButtonElement = document.querySelector("#open-player-side-view-button");

    if (dmButtonElement !== null) {
        dmButtonElement.hidden = appView === "dm";
        dmButtonElement.classList.toggle("active-view-button", appView === "dm");
        dmButtonElement.textContent = "Spielleiterseite öffnen";
    }

    if (playerSideButtonElement !== null) {
        playerSideButtonElement.hidden = appView === "playerSide";
        playerSideButtonElement.classList.toggle("active-view-button", appView === "playerSide");
        playerSideButtonElement.textContent = "Spielerseite öffnen";
    }
}

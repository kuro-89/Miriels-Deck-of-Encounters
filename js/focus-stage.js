/**
 * Rendert die Fokuskarte und ihre beiden kleinen Nachbarkarten („Geisterkarten“).
 *
 * Abhängigkeiten:
 * - Werden von app.js über createFocusStageController(...) injiziert:
 *   getHandCards, createCardImageHtml, createFocusedCardHtml und escapeHtml.
 * - Browser-API: document für das Zielpanel und die Navigationspfeile.
 *
 * Liefert an:
 * - app.js: renderFocusedCard(...), die zentrale Renderfunktion der Fokusstage.
 * - style.css: stabile Klassen für linke und rechte Geisterkarte.
 */

export function createFocusStageController({
    getHandCards,
    createCardImageHtml,
    createFocusedCardHtml,
    escapeHtml
}) {
    function getFocusStageSiblingCards(focusedCard) {
        const handCards = getHandCards();

        if (handCards.length === 0 || focusedCard === null) {
            return { previousCard: null, nextCard: null };
        }

        const focusedIndex = handCards.findIndex(card => card.id === focusedCard.id);
        if (focusedIndex === -1 || handCards.length < 2) {
            return { previousCard: null, nextCard: null };
        }

        return {
            previousCard: handCards[(focusedIndex - 1 + handCards.length) % handCards.length],
            nextCard: handCards[(focusedIndex + 1) % handCards.length]
        };
    }

    function createFocusStagePreviewCardHtml(card, positionLabel) {
        if (card === null) {
            return `<div class="focus-stage-ghost-card focus-stage-ghost-card-empty" aria-hidden="true"></div>`;
        }

        return `
            <div
                class="focus-stage-ghost-card focus-stage-ghost-card-${positionLabel}"
                aria-hidden="true"
            >
                <span class="focus-stage-ghost-image">${createCardImageHtml(card)}</span>
                <span class="focus-stage-ghost-title">${escapeHtml(card.name)}</span>
                <span class="focus-stage-ghost-meta">Ini ${card.initiative} · HP ${card.hp}/${card.maxHp}</span>
            </div>
        `;
    }

    function renderFocusedCard(focusedCard, activeCard) {
        const focusedCardElement = document.querySelector("#focused-card-panel");
        if (focusedCardElement === null) return;

        const siblingCards = getFocusStageSiblingCards(focusedCard);
        const hasFocusedCard = focusedCard !== null;

        focusedCardElement.innerHTML = `
            <div class="focus-stage-card-stack ${hasFocusedCard ? "" : "focus-stage-card-stack-empty"}">
                ${createFocusStagePreviewCardHtml(siblingCards.previousCard, "previous")}
                <div class="focus-stage-main-card">${createFocusedCardHtml(focusedCard, activeCard)}</div>
                ${createFocusStagePreviewCardHtml(siblingCards.nextCard, "next")}
            </div>
        `;

        document.querySelectorAll(".focus-stage-arrow").forEach(buttonElement => {
            buttonElement.disabled = hasFocusedCard !== true;
            buttonElement.setAttribute("aria-disabled", hasFocusedCard ? "false" : "true");
        });
    }

    return Object.freeze({ renderFocusedCard });
}

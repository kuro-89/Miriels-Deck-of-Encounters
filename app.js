let creatures = [];

const availableConditions = [
    "blinded",
    "charmed",
    "deafened",
    "frightened",
    "grappled",
    "incapacitated",
    "invisible",
    "paralyzed",
    "petrified",
    "poisoned",
    "prone",
    "restrained",
    "stunned",
    "unconscious",
    "concentrating"
];

let currentTurnIndex = 0;
let roundNumber = 1;

function getTypeSortValue(type) {
    if (type === "player") {
        return 1;
    }

    if (type === "npc") {
        return 2;
    }

    if (type === "monster") {
        return 3;
    }

    return 4;
}

function getHandCards() {
    const handCards = creatures.filter(function(creature) {
        return creature.isInCombat === true;
    });

    handCards.sort(function(a, b) {
        if (a.initiative !== b.initiative) {
            return b.initiative - a.initiative;
        }

        const typeDifference = getTypeSortValue(a.type) - getTypeSortValue(b.type);

        if (typeDifference !== 0) {
            return typeDifference;
        }

        return a.name.localeCompare(b.name);
    });

    return handCards;
}

function getDeckCards() {
    const deckCards = creatures.filter(function(creature) {
        return creature.isInCombat === false;
    });

    deckCards.sort(function(a, b) {
        const typeDifference = getTypeSortValue(a.type) - getTypeSortValue(b.type);

        if (typeDifference !== 0) {
            return typeDifference;
        }

        return a.name.localeCompare(b.name);
    });

    return deckCards;
}

function ensureCurrentTurnIndexIsValid(handCards) {
    if (handCards.length === 0) {
        currentTurnIndex = 0;
        roundNumber = 1;
        return;
    }

    if (currentTurnIndex < 0) {
        currentTurnIndex = 0;
    }

    if (currentTurnIndex >= handCards.length) {
        currentTurnIndex = handCards.length - 1;
    }
}

function getActiveCard(handCards) {
    ensureCurrentTurnIndexIsValid(handCards);

    if (handCards.length === 0) {
        return null;
    }

    return handCards[currentTurnIndex];
}

function nextTurn() {
    const handCards = getHandCards();

    if (handCards.length === 0) {
        return;
    }

    currentTurnIndex = currentTurnIndex + 1;

    if (currentTurnIndex >= handCards.length) {
        currentTurnIndex = 0;
        roundNumber = roundNumber + 1;
    }

    renderCards();
}

function previousTurn() {
    const handCards = getHandCards();

    if (handCards.length === 0) {
        return;
    }

    currentTurnIndex = currentTurnIndex - 1;

    if (currentTurnIndex < 0) {
        currentTurnIndex = handCards.length - 1;

        if (roundNumber > 1) {
            roundNumber = roundNumber - 1;
        }
    }

    renderCards();
}

function scrollCardRow(rowElementId, direction) {
    const rowElement = document.querySelector(`#${rowElementId}`);

    if (rowElement === null) {
        return;
    }

    const maximumScrollLeft = rowElement.scrollWidth - rowElement.clientWidth;
    const scrollTolerance = 4;
    const scrollAmount = rowElement.clientWidth * 0.85;

    if (maximumScrollLeft <= 0) {
        return;
    }

    if (direction === "right") {
        const isAtRightEnd = rowElement.scrollLeft >= maximumScrollLeft - scrollTolerance;

        if (isAtRightEnd) {
            rowElement.scrollTo({
                left: 0,
                behavior: "smooth"
            });

            return;
        }

        rowElement.scrollBy({
            left: scrollAmount,
            behavior: "smooth"
        });

        return;
    }

    if (direction === "left") {
        const isAtLeftEnd = rowElement.scrollLeft <= scrollTolerance;

        if (isAtLeftEnd) {
            rowElement.scrollTo({
                left: maximumScrollLeft,
                behavior: "smooth"
            });

            return;
        }

        rowElement.scrollBy({
            left: -scrollAmount,
            behavior: "smooth"
        });
    }
}

function getElementCenterScrollLeft(rowElement, childElement) {
    const rowVisibleWidth = rowElement.clientWidth;
    const childLeft = childElement.offsetLeft;
    const childWidth = childElement.offsetWidth;

    return childLeft - (rowVisibleWidth / 2) + (childWidth / 2);
}

function centerActivePublicPreviewCard() {
    const previewElement = document.querySelector("#public-preview-list");

    if (previewElement === null) {
        return;
    }

    const activePreviewCard = previewElement.querySelector(".public-preview-card.active");

    if (activePreviewCard === null) {
        return;
    }

    const targetScrollLeft = getElementCenterScrollLeft(previewElement, activePreviewCard);

    previewElement.scrollTo({
        left: targetScrollLeft,
        behavior: "smooth"
    });
}

function scrollPublicPreview(direction) {
    scrollCardRow("public-preview-list", direction);
}

function applyDamage(creature, amount) {
    if (creature === null) {
        return;
    }

    if (amount < 0) {
        return;
    }

    if (amount <= creature.tempHp) {
        creature.tempHp = creature.tempHp - amount;
        return;
    }

    const remainingDamage = amount - creature.tempHp;

    creature.tempHp = 0;
    creature.hp = Math.max(0, creature.hp - remainingDamage);
}

function applyHealing(creature, amount) {
    if (creature === null) {
        return;
    }

    if (amount < 0) {
        return;
    }

    creature.hp = Math.min(creature.maxHp, creature.hp + amount);
}

function applyTempHp(creature, amount) {
    if (creature === null) {
        return;
    }

    if (amount < 0) {
        return;
    }

    creature.tempHp = amount;
}

function findCreatureById(id) {
    for (const creature of creatures) {
        if (creature.id === id) {
            return creature;
        }
    }

    return null;
}

function getNextCreatureId() {
    let highestId = 0;

    for (const creature of creatures) {
        if (creature.id > highestId) {
            highestId = creature.id;
        }
    }

    return highestId + 1;
}

function removeCreatureById(id) {
    creatures = creatures.filter(function(creature) {
        return creature.id !== id;
    });

    const handCards = getHandCards();
    ensureCurrentTurnIndexIsValid(handCards);

    renderCards();
}

function moveCardToHand(creatureId) {
    const creature = findCreatureById(creatureId);

    if (creature === null) {
        return;
    }

    creature.isInCombat = true;

    const handCards = getHandCards();
    ensureCurrentTurnIndexIsValid(handCards);

    renderCards();
}

function moveCardToDeck(creatureId) {
    const creature = findCreatureById(creatureId);

    if (creature === null) {
        return;
    }

    creature.isInCombat = false;

    const handCards = getHandCards();
    ensureCurrentTurnIndexIsValid(handCards);

    renderCards();
}

function getHpChangeAmount(creatureId) {
    const inputElement = document.querySelector(`#hp-change-amount-${creatureId}`);

    if (inputElement === null) {
        return 0;
    }

    return Number(inputElement.value);
}

function handleDamageButtonClick(creatureId) {
    const creature = findCreatureById(creatureId);
    const amount = getHpChangeAmount(creatureId);

    applyDamage(creature, amount);
    renderCards();
}

function handleHealingButtonClick(creatureId) {
    const creature = findCreatureById(creatureId);
    const amount = getHpChangeAmount(creatureId);

    applyHealing(creature, amount);
    renderCards();
}

function handleTempHpButtonClick(creatureId) {
    const creature = findCreatureById(creatureId);
    const amount = getHpChangeAmount(creatureId);

    applyTempHp(creature, amount);
    renderCards();
}

function getHpPercent(creature) {
    const rawPercent = Math.round((creature.hp / creature.maxHp) * 100);

    if (rawPercent < 0) {
        return 0;
    }

    if (rawPercent > 100) {
        return 100;
    }

    return rawPercent;
}

function getHpDescription(creature) {
    const hpPercent = getHpPercent(creature);

    if (creature.hp === 0) {
        return "besiegt / bewusstlos";
    }

    if (hpPercent === 100) {
        return "unverletzt";
    }

    if (hpPercent > 50) {
        return "leicht verletzt";
    }

    if (hpPercent > 25) {
        return "schwer verletzt";
    }

    return "fast besiegt";
}

function getHpVisibilityLabel(creature) {
    if (creature.hpVisibility === "full") {
        return "full";
    }

    if (creature.hpVisibility === "bar") {
        return "bar";
    }

    if (creature.hpVisibility === "descriptive") {
        return "Zustand";
    }

    if (creature.hpVisibility === "hidden") {
        return "verborgen";
    }

    return "unbekannt";
}

function createDmHpBarHtml(creature) {
    const hpPercent = getHpPercent(creature);

    return `
        <div class="hp-display">

            <div class="hp-bar-outer">
                <div
                    class="hp-bar-inner"
                    style="width: ${hpPercent}%;"
                ></div>
            </div>
        </div>
    `;
}

function getPublicHpDisplayHtml(creature) {
    return `
        <div class="hp-display">
            <p>Spieler sehen: ${getHpVisibilityLabel(creature)}</p>
        </div>
    `;
}

function createConditionOptionsHtml() {
    let html = "";

    for (const condition of availableConditions) {
        html += `
            <option value="${condition}">
                ${condition}
            </option>
        `;
    }

    return html;
}

function getSelectedCondition(creatureId) {
    const selectElement = document.querySelector(`#condition-select-${creatureId}`);

    if (selectElement === null) {
        return "";
    }

    return selectElement.value;
}

function creatureHasCondition(creature, conditionName) {
    return creature.conditions.includes(conditionName);
}

function addConditionToCreature(creatureId) {
    const creature = findCreatureById(creatureId);

    if (creature === null) {
        return;
    }

    const conditionName = getSelectedCondition(creatureId);

    if (conditionName === "") {
        return;
    }

    if (creatureHasCondition(creature, conditionName)) {
        return;
    }

    creature.conditions.push(conditionName);

    renderCards();
}

function removeConditionFromCreature(creatureId, conditionName) {
    const creature = findCreatureById(creatureId);

    if (creature === null) {
        return;
    }

    creature.conditions = creature.conditions.filter(function(condition) {
        return condition !== conditionName;
    });

    renderCards();
}

function getConditionClassName(conditionName) {
    return `condition-${conditionName}`;
}

function createConditionChipsHtml(creature) {
    if (creature.conditions.length === 0) {
        return `
            <p class="condition-empty">
                Keine Conditions.
            </p>
        `;
    }

    let html = "";

    for (const condition of creature.conditions) {
        html += `
            <span class="condition-chip ${getConditionClassName(condition)}">
                <span class="condition-chip-name">
                    ${condition}
                </span>

                <button
                    class="condition-chip-remove"
                    onclick="removeConditionFromCreature(${creature.id}, '${condition}')"
                    title="${condition} entfernen"
                    aria-label="${condition} entfernen"
                >
                    ×
                </button>
            </span>
        `;
    }

    return html;
}

function getPublicHpPreviewHtml(creature) {
    const hpPercent = getHpPercent(creature);

    if (creature.hpVisibility === "full") {
        return `
            <div class="public-preview-section-box">
                <h4>HP</h4>
                <p>${creature.hp} / ${creature.maxHp} HP</p>

                <div class="hp-bar-outer">
                    <div
                        class="hp-bar-inner"
                        style="width: ${hpPercent}%;"
                    ></div>
                </div>
            </div>
        `;
    }

    if (creature.hpVisibility === "bar") {
        return `
            <div class="public-preview-section-box">
                <h4>HP</h4>
                <p>${hpPercent}%</p>

                <div class="hp-bar-outer">
                    <div
                        class="hp-bar-inner"
                        style="width: ${hpPercent}%;"
                    ></div>
                </div>
            </div>
        `;
    }

    if (creature.hpVisibility === "descriptive") {
        return `
            <div class="public-preview-section-box">
                <h4>HP</h4>
                <p>${getHpDescription(creature)}</p>
            </div>
        `;
    }

    return `
        <div class="public-preview-section-box">
            <h4>HP</h4>
            <p>HP verborgen</p>
        </div>
    `;
}

function createPublicConditionChipsHtml(creature) {
    if (creature.conditions.length === 0) {
        return `
            <p class="condition-empty">
                Keine Conditions sichtbar.
            </p>
        `;
    }

    let html = "";

    for (const condition of creature.conditions) {
        html += `
            <span class="condition-chip ${getConditionClassName(condition)}">
                <span class="condition-chip-name">
                    ${condition}
                </span>
            </span>
        `;
    }

    return html;
}

function createPublicPreviewCardHtml(creature, isActive) {
    return `
        <article class="public-preview-card ${isActive ? "active" : ""}" data-creature-id="${creature.id}">
            <div class="public-preview-card-inner">
                <h3 class="public-preview-title">
                    ${creature.publicName}
                </h3>

                <div class="public-preview-image-placeholder">
                    Bild folgt
                </div>

                <p class="public-preview-type">
                    ${creature.type}
                </p>

                ${getPublicHpPreviewHtml(creature)}

                <div class="public-preview-section-box">
                    <h4>Conditions</h4>

                    <div class="condition-chip-list">
                        ${createPublicConditionChipsHtml(creature)}
                    </div>
                </div>
            </div>
        </article>
    `;
}

function renderPublicPreview(handCards, activeCard) {
    const previewElement = document.querySelector("#public-preview-list");

    if (previewElement === null) {
        return;
    }

    if (handCards.length === 0) {
        previewElement.innerHTML = `
            <p class="empty-list-message">
                Keine Karten auf der Hand. Die öffentliche Vorschau ist leer.
            </p>
        `;
        return;
    }

    let html = "";

    for (const card of handCards) {
        const isActive = activeCard !== null && card.id === activeCard.id;

        html += createPublicPreviewCardHtml(card, isActive);
    }

    previewElement.innerHTML = html;
}

function showAddCreatureError(message) {
    const errorElement = document.querySelector("#add-creature-error");

    if (errorElement === null) {
        return;
    }

    errorElement.textContent = message;
}

function clearAddCreatureError() {
    showAddCreatureError("");
}

function getNumberedCreatureName(baseName, index, quantity) {
    if (quantity === 1) {
        return baseName;
    }

    return `${baseName} ${index + 1}`;
}

function handleAddCreatureButtonClick() {
    clearAddCreatureError();

    const nameInputElement = document.querySelector("#new-creature-name");
    const publicNameInputElement = document.querySelector("#new-creature-public-name");
    const typeSelectElement = document.querySelector("#new-creature-type");
    const quantityInputElement = document.querySelector("#new-creature-quantity");
    const initiativeInputElement = document.querySelector("#new-creature-initiative");
    const hpInputElement = document.querySelector("#new-creature-hp");
    const maxHpInputElement = document.querySelector("#new-creature-max-hp");
    const hpVisibilitySelectElement = document.querySelector("#new-creature-hp-visibility");
    const acInputElement = document.querySelector("#new-creature-ac");
    const passivePerceptionInputElement = document.querySelector("#new-creature-passive-perception");
    const passiveInsightInputElement = document.querySelector("#new-creature-passive-insight");
    const isInCombatInputElement = document.querySelector("#new-creature-is-in-combat");

    if (
        nameInputElement === null ||
        publicNameInputElement === null ||
        typeSelectElement === null ||
        quantityInputElement === null ||
        initiativeInputElement === null ||
        hpInputElement === null ||
        maxHpInputElement === null ||
        hpVisibilitySelectElement === null ||
        acInputElement === null ||
        passivePerceptionInputElement === null ||
        passiveInsightInputElement === null ||
        isInCombatInputElement === null
    ) {
        showAddCreatureError("Ein Formularfeld wurde nicht gefunden. Bitte prüfe die IDs in index.html.");
        return;
    }

    const name = nameInputElement.value.trim();
    const publicName = publicNameInputElement.value.trim();

    const quantity = Number(quantityInputElement.value);
    const initiative = Number(initiativeInputElement.value);
    const hp = Number(hpInputElement.value);
    const maxHp = Number(maxHpInputElement.value);
    const armorClass = Number(acInputElement.value);
    const passivePerception = Number(passivePerceptionInputElement.value);
    const passiveInsight = Number(passiveInsightInputElement.value);

    if (name === "") {
        showAddCreatureError("Bitte gib einen internen Namen ein.");
        return;
    }

    if (publicName === "") {
        showAddCreatureError("Bitte gib einen öffentlichen Namen ein.");
        return;
    }

    if (!Number.isFinite(quantity) || quantity < 1) {
        showAddCreatureError("Die Anzahl muss mindestens 1 sein.");
        return;
    }

    if (quantity > 20) {
        showAddCreatureError("Die Anzahl darf höchstens 20 sein.");
        return;
    }

    if (hp < 0) {
        showAddCreatureError("HP dürfen nicht negativ sein.");
        return;
    }

    if (maxHp <= 0) {
        showAddCreatureError("Max HP müssen größer als 0 sein.");
        return;
    }

    if (hp > maxHp) {
        showAddCreatureError("Aktuelle HP dürfen nicht größer als Max HP sein.");
        return;
    }

    if (armorClass < 0) {
        showAddCreatureError("AC darf nicht negativ sein.");
        return;
    }

    if (passivePerception < 0) {
        showAddCreatureError("Passive Perception darf nicht negativ sein.");
        return;
    }

    if (passiveInsight < 0) {
        showAddCreatureError("Passive Insight darf nicht negativ sein.");
        return;
    }

    for (let index = 0; index < quantity; index = index + 1) {
        const newCreature = {
            id: getNextCreatureId(),
            name: getNumberedCreatureName(name, index, quantity),
            publicName: getNumberedCreatureName(publicName, index, quantity),
            type: typeSelectElement.value,
            initiative: initiative,
            hp: hp,
            maxHp: maxHp,
            tempHp: 0,
            armorClass: armorClass,
            passivePerception: passivePerception,
            passiveInsight: passiveInsight,
            hpVisibility: hpVisibilitySelectElement.value,
            conditions: [],
            isInCombat: isInCombatInputElement.checked
        };

        creatures.push(newCreature);
    }

    const handCards = getHandCards();
    ensureCurrentTurnIndexIsValid(handCards);

    renderCards();
}

function createCardMenuHtml(creature) {
    const isOnHand = creature.isInCombat === true;

    const moveToHandDisabled = isOnHand ? "disabled" : "";
    const moveToDeckDisabled = isOnHand ? "" : "disabled";

    return `
        <details class="card-menu">
            <summary
                class="card-menu-summary"
                title="Kartenmenü öffnen"
                aria-label="Kartenmenü öffnen"
            >
                ☰
            </summary>

            <div class="card-menu-panel">
                <button
                    class="card-menu-danger"
                    onclick="removeCreatureById(${creature.id})"
                >
                    Karte entfernen
                </button>

                <button
                    onclick="moveCardToHand(${creature.id})"
                    ${moveToHandDisabled}
                >
                    Karte auf die Hand nehmen
                </button>

                <button
                    onclick="moveCardToDeck(${creature.id})"
                    ${moveToDeckDisabled}
                >
                    Karte ins Deck verschieben
                </button>
            </div>
        </details>
    `;
}

function createCreatureCardHtml(creature, isActive) {
    return `
        <article class="creature-card ${isActive ? "active" : ""}">
            <div class="creature-card-inner">
                <div class="creature-card-title-row">
                    <div class="creature-card-header">
                        <h3>
                            ${creature.name}
                            <span class="creature-public-alias">
                                aka "${creature.publicName}"
                            </span>
                        </h3>
                    </div>

                    ${createCardMenuHtml(creature)}
                </div>

                <div class="creature-image-placeholder">
                    Bild folgt
                </div>

                <div class="creature-type-line">
                    <p>
                        ${creature.type} · ${creature.isInCombat ? "auf der Hand" : "im Deck"}
                    </p>
                </div>

                <div class="creature-card-section">
                    <h4>HP</h4>

                    <div class="creature-stat-grid">
                        <p>Aktuell: ${creature.hp} / ${creature.maxHp}</p>
                        <p>Temp: ${creature.tempHp}</p>
                    </div>

                    ${createDmHpBarHtml(creature)}
                    ${getPublicHpDisplayHtml(creature)}
                </div>

                <div class="creature-card-section">
                    <h4>Kampfwerte</h4>

                    <div class="creature-stat-grid">
                        <p>Ini: ${creature.initiative}</p>
                        <p>AC: ${creature.armorClass}</p>
                    </div>
                </div>

                <div class="creature-card-section">
                    <h4>Passive Werte</h4>

                    <div class="creature-stat-grid">
                        <p>Perception: ${creature.passivePerception}</p>
                        <p>Insight: ${creature.passiveInsight}</p>
                    </div>
                </div>

                <div class="creature-card-section">
                    <h4>Conditions</h4>

                    <div class="condition-chip-list">
                        ${createConditionChipsHtml(creature)}
                    </div>

                    <div class="condition-controls">
                        <select id="condition-select-${creature.id}">
                            ${createConditionOptionsHtml()}
                        </select>

                        <button onclick="addConditionToCreature(${creature.id})">
                            Condition hinzufügen
                        </button>
                    </div>
                </div>

                <div class="creature-card-section">
                    <h4>Kampfaktionen</h4>

                    <div class="creature-actions">
                        <input
                            id="hp-change-amount-${creature.id}"
                            type="number"
                            min="0"
                            value="0"
                        >

                        <button onclick="handleDamageButtonClick(${creature.id})">
                            Schaden
                        </button>

                        <button onclick="handleHealingButtonClick(${creature.id})">
                            Heilung
                        </button>

                        <button onclick="handleTempHpButtonClick(${creature.id})">
                            Temp HP
                        </button>
                    </div>
                </div>
            </div>
        </article>
    `;
}

function renderTurnInfo(handCards) {
    const turnInfoElement = document.querySelector("#turn-info");

    if (turnInfoElement === null) {
        return;
    }

    const activeCard = getActiveCard(handCards);

    if (activeCard === null) {
        turnInfoElement.innerHTML = `
            <h2>Runde ${roundNumber}</h2>
            <p>Keine Karten auf der Hand.</p>
        `;

        return;
    }

    turnInfoElement.innerHTML = `
        <h2>Runde ${roundNumber}</h2>

        <p class="turn-label">
            Turn ${currentTurnIndex + 1} von ${handCards.length}
        </p>

        <p class="active-creature-name">
            Aktiv: ${activeCard.publicName}
        </p>
    `;
}

function renderCardList(elementId, listCards, activeCard) {
    const listElement = document.querySelector(elementId);

    if (listElement === null) {
        return;
    }

    if (listCards.length === 0) {
        listElement.innerHTML = `
            <p class="empty-list-message">
                Keine Karten vorhanden.
            </p>
        `;
        return;
    }

    let html = "";

    for (const card of listCards) {
        const isActive = activeCard !== null && card.id === activeCard.id;

        html += createCreatureCardHtml(card, isActive);
    }

    listElement.innerHTML = html;
}

function renderCards() {
    const handCards = getHandCards();
    const deckCards = getDeckCards();

    ensureCurrentTurnIndexIsValid(handCards);

    const activeCard = getActiveCard(handCards);

    renderTurnInfo(handCards);
    renderPublicPreview(handCards, activeCard);
    centerActivePublicPreviewCard();
    renderCardList("#hand-card-list", handCards, activeCard);
    renderCardList("#deck-card-list", deckCards, activeCard);
}

renderCards();
// ============================================================
// 1. Globale Daten und Konstanten
// ============================================================

const useDemoData = true;

function createUniqueId() {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
        return globalThis.crypto.randomUUID();
    }

    const randomBytes = new Uint8Array(16);
    if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === "function") {
        globalThis.crypto.getRandomValues(randomBytes);
    } else {
        for (let index = 0; index < randomBytes.length; index += 1) {
            randomBytes[index] = Math.floor(Math.random() * 256);
        }
    }

    randomBytes[6] = (randomBytes[6] & 0x0f) | 0x40;
    randomBytes[8] = (randomBytes[8] & 0x3f) | 0x80;
    const hex = Array.from(randomBytes, value => value.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
const appVersion = "0.23.2";

const cardKinds = Object.freeze({
    character: "character",
    item: "item",
    custom: "custom"
});

const characterRoles = Object.freeze({
    player: "player",
    npc: "npc",
    monster: "monster"
});

const cardLocations = Object.freeze({
    deck: "deck",
    hand: "hand",
    trash: "trash"
});

const encounterStatuses = Object.freeze({
    active: "active",
    eliminated: "eliminated"
});

const effectDurationModes = Object.freeze({
    manual: "manual",
    rounds: "rounds",
    turnStart: "turn_start",
    turnEnd: "turn_end",
    encounterEnd: "encounter_end",
    freeText: "free_text"
});

const effectVisibilityModes = Object.freeze({
    public: "public",
    controller: "controller",
    dm: "dm"
});

const accessRoles = Object.freeze({
    dm: "dm",
    controller: "controller",
    viewer: "viewer",
    publicDisplay: "public_display"
});

const cardPublicProfiles = Object.freeze({
    standard: "standard",
    minimal: "minimal",
    full: "full"
});

const cardFieldVisibility = Object.freeze({
    publicName: "public_name",
    image: "image",
    initiative: "initiative",
    hp: "hp",
    conditions: "conditions",
    effects: "effects",
    combatStats: "combat_stats",
    notes: "notes",
    inventory: "inventory",
    actions: "actions",
    traits: "traits",
    spells: "spells"
});

const gameActionPermissions = Object.freeze({
    damage: "damage",
    healing: "healing",
    temporaryHp: "temporary_hp",
    condition: "condition",
    effect: "effect",
    itemUse: "item_use",
    itemTransfer: "item_transfer",
    editCard: "edit_card",
    moveCard: "move_card",
    manageEncounter: "manage_encounter"
});

function createAccessContext(role = accessRoles.dm, participantId = null, controlledCardIds = []) {
    return {
        role: Object.values(accessRoles).includes(role) ? role : accessRoles.viewer,
        participantId,
        controlledCardIds: Array.isArray(controlledCardIds) ? controlledCardIds.slice() : []
    };
}

function getSafeCardAccessPolicy(rawPolicy) {
    const policy = rawPolicy !== null && typeof rawPolicy === "object" ? rawPolicy : {};
    const publicProfile = Object.values(cardPublicProfiles).includes(policy.publicProfile)
        ? policy.publicProfile
        : cardPublicProfiles.standard;

    return {
        publicProfile,
        controllerCanEdit: policy.controllerCanEdit === true,
        controllerCanUseItems: policy.controllerCanUseItems !== false,
        controllerCanTransferItems: policy.controllerCanTransferItems === true,
        publicOverrides: policy.publicOverrides !== null && typeof policy.publicOverrides === "object"
            ? { ...policy.publicOverrides }
            : {}
    };
}

function isCardControlledByContext(card, context) {
    return context.role === accessRoles.controller
        && context.controlledCardIds.includes(card.id);
}

function canViewCardField(card, fieldName, context = createAccessContext(accessRoles.dm)) {
    if (context.role === accessRoles.dm) {
        return true;
    }

    if (isCardControlledByContext(card, context)) {
        if ([cardFieldVisibility.notes, cardFieldVisibility.inventory, cardFieldVisibility.actions, cardFieldVisibility.traits, cardFieldVisibility.spells].includes(fieldName)) {
            return true;
        }
    }

    const policy = getSafeCardAccessPolicy(card.accessPolicy);
    if (typeof policy.publicOverrides[fieldName] === "boolean") {
        return policy.publicOverrides[fieldName];
    }

    if (fieldName === cardFieldVisibility.publicName || fieldName === cardFieldVisibility.image) {
        return true;
    }

    if (policy.publicProfile === cardPublicProfiles.minimal) {
        return false;
    }

    if ([cardFieldVisibility.initiative, cardFieldVisibility.hp, cardFieldVisibility.conditions, cardFieldVisibility.effects].includes(fieldName)) {
        return true;
    }

    return policy.publicProfile === cardPublicProfiles.full
        && [cardFieldVisibility.combatStats, cardFieldVisibility.actions, cardFieldVisibility.traits, cardFieldVisibility.spells].includes(fieldName);
}

function canEditCardField(card, fieldName, context = createAccessContext(accessRoles.dm)) {
    if (context.role === accessRoles.dm) {
        return true;
    }

    const policy = getSafeCardAccessPolicy(card.accessPolicy);
    return isCardControlledByContext(card, context) && policy.controllerCanEdit === true;
}

function canPerformAction(actionName, context = createAccessContext(accessRoles.dm), sourceCard = null, targetCard = null) {
    if (context.role === accessRoles.dm) {
        return true;
    }

    if (context.role !== accessRoles.controller || sourceCard === null || isCardControlledByContext(sourceCard, context) === false) {
        return false;
    }

    if ([gameActionPermissions.damage, gameActionPermissions.healing, gameActionPermissions.temporaryHp, gameActionPermissions.condition, gameActionPermissions.effect].includes(actionName)) {
        return targetCard !== null;
    }

    if (actionName === gameActionPermissions.itemUse) {
        return getSafeCardAccessPolicy(sourceCard.accessPolicy).controllerCanUseItems;
    }

    if (actionName === gameActionPermissions.itemTransfer) {
        return getSafeCardAccessPolicy(sourceCard.accessPolicy).controllerCanTransferItems;
    }

    return false;
}

const dmAccessContext = createAccessContext(accessRoles.dm);
const publicDisplayAccessContext = createAccessContext(accessRoles.publicDisplay);

const itemExecutableEffectTypes = Object.freeze({
    none: "none",
    healing: "healing",
    damage: "damage",
    temporaryHp: "temporary_hp",
    condition: "condition",
    customEffect: "custom_effect"
});

const itemExecutableEffectLabels = Object.freeze({
    none: "Nur Beschreibung",
    healing: "Heilung",
    damage: "Schaden",
    temporary_hp: "Temporäre HP",
    condition: "Condition",
    custom_effect: "Eigener Effekt"
});

const availableConditions = [
    "blessed",
    "blinded",
    "charmed",
    "concentrating",
    "cursed",
    "deafened",
    "enlarged",
    "exhausted",
    "frightened",
    "grappled",
    "hasted",
    "hexed",
    "hunters-mark",
    "incapacitated",
    "invisible",
    "magical-effect",
    "paralyzed",
    "petrified",
    "physical-effect",
    "poisoned",
    "prone",
    "raging",
    "restrained",
    "stunned",
    "unconscious"
];

const importSecurityLimits = Object.freeze({
    maxFileBytesWithoutEmbeddedImages: 20 * 1024 * 1024,
    maxFileBytesWithEmbeddedImages: 100 * 1024 * 1024,
    maxCards: 1000,
    maxShortTextLength: 160,
    maxMediumTextLength: 2000,
    maxLongTextLength: 20000,
    maxTraitsPerCard: 150,
    maxActionsPerCard: 150,
    maxSpellsPerCard: 500,
    maxInventoryCardsPerCard: 500,
    maxInventoryListItemsPerCard: 1000
});
const appOperatingMode = "Statisch gehostete Browser-Version";

const appStorageKey = "miriels-deck-game-state-v7";
const appChannelName = "miriels-deck-game-state-channel-v2";
const demoCardsAutoloadStorageKey = `${appStorageKey}-demo-autoload-enabled`;
const demoEncounterName = "Miriels Demo-Spielstand";
const mirielBoardAutomationDefaultsVersion = 2;

let appView = getAppViewFromUrl();
let appBroadcastChannel = null;
let isApplyingExternalState = false;
let lastAppliedStateText = "";
let expandedActionDetailKey = "";
let activeForgeInventoryEditor = null;
let inventoryStageStartIndexes = {};
let activeDetailInventoryCardEditor = null;
let activeDetailInventoryListEditor = null;
let suppressDetailInventoryClickAwayOnce = false;
let pendingDeckImportData = null;
let pendingDeckImportFileName = "";
let demoCardsAutoloadEnabled = getDemoCardsAutoloadEnabled();

const demoCardNameSignatures = [
    "miriel dunkelschön",
    "suica",
    "animierter besen",
    "nebelzahn-mandrake",
    "glimmerkrähe",
    "liora veyth",
    "moosgruft-koloss",
    "veyra mondfaden",
    "spiegelmolch"
];

const inventoryCategoryLabels = {
    equipment: "Ausrüstung",
    weapon: "Waffe",
    armor: "Rüstung",
    tool: "Werkzeug",
    consumable: "Verbrauchsgegenstand",
    potion: "Trank",
    scroll: "Schriftrolle",
    magicItem: "Magisches Item",
    quest: "Questitem",
    treasure: "Schatz",
    ammunition: "Munition",
    misc: "Sonstiges"
};

const inventoryCardTemplates = {
    healing: {
        name: "Heiltrank",
        category: "potion",
        effect: "2d4 + 2 HP",
        healingFormula: "2d4+2",
        description: "Stellt 2W4 + 2 Trefferpunkte wieder her.",
        image: "assets/items/potion_healing.jpg",
        showAsAction: true,
        actionType: "action"
    },
    greaterHealing: {
        name: "Starker Heiltrank",
        category: "potion",
        effect: "4d4 + 4 HP",
        healingFormula: "4d4+4",
        description: "Stellt 4W4 + 4 Trefferpunkte wieder her.",
        image: "assets/items/potion_greater_healing.jpg",
        showAsAction: true,
        actionType: "action"
    },
    superiorHealing: {
        name: "Großer Heiltrank",
        category: "potion",
        effect: "8d4 + 8 HP",
        healingFormula: "8d4+8",
        description: "Stellt 8W4 + 8 Trefferpunkte wieder her.",
        image: "assets/items/potion_superior_healing.jpg",
        showAsAction: true,
        actionType: "action"
    },
    supremeHealing: {
        name: "Meisterlicher Heiltrank",
        category: "potion",
        effect: "10d4 + 20 HP",
        healingFormula: "10d4+20",
        description: "Stellt 10W4 + 20 Trefferpunkte wieder her.",
        image: "assets/items/potion_supreme_healing.jpg",
        showAsAction: true,
        actionType: "action"
    },
    customPotion: {
        name: "Eigene Potion",
        category: "potion",
        effect: "Eigener Trankeffekt",
        healingFormula: "",
        description: "",
        image: "assets/items/potion_custom.jpg",
        showAsAction: true,
        actionType: "action"
    },
    customScroll: {
        name: "Eigene Scroll",
        category: "scroll",
        effect: "Eigener Zaubereffekt",
        healingFormula: "",
        description: "",
        image: "assets/items/scroll_custom.jpg",
        showAsAction: true,
        actionType: "action"
    }
};



// Zentrale Zustandsobjekte. Sämtliche Spiel- und UI-Funktionen greifen
// direkt auf gameState beziehungsweise uiState zu. Es gibt keine globalen
// Kompatibilitätsvariablen mehr.
const gameState = {
    id: createUniqueId(),
    name: useDemoData ? demoEncounterName : "Unbenannter Spielstand",
    cards: (useDemoData ? createDemoCards() : []).map(normalizeCardModel),
    encounter: {
        roundNumber: 1,
        currentTurnCardId: null,
        isStarted: false,
        startGateVersion: 2,
        activeRun: null,
        lastCompletedRun: null
    },
    eventLog: [],
    presentation: {
        manuallySelectedCardId: null,
        mirielBoard: {
            manualImageData: "",
            manualImageName: "",
            manualText: "",
            manualTextSize: "normal",
            manualTextPosition: "bottom",
            persistentMode: "off",
            autoTurnEnabled: false,
            durationMode: "normal",
            newRoundCallEnabled: true,
            triggerId: "",
            announcement: null
        }
    },
    settings: {
        mirielBoardAutomationDefaultsVersion: mirielBoardAutomationDefaultsVersion
    }
};

const uiState = {
    focusedCardId: null,
    activeDetailTab: "values",
    activeDmFeedTab: "log",
    expandedSpellDetailKey: null,
    deck: {
        searchQuery: "",
        typeFilter: "all",
        sortMode: "name",
        locationView: cardLocations.deck
    }
};

function getCurrentTurnIndex() {
    const initiativeCards = getInitiativeCards(getHandCards());
    if (initiativeCards.length === 0 || gameState.encounter.currentTurnCardId === null) {
        return 0;
    }
    const index = initiativeCards.findIndex(card => card.id === gameState.encounter.currentTurnCardId);
    return index >= 0 ? index : 0;
}

function setCurrentTurnIndex(value) {
    const initiativeCards = getInitiativeCards(getHandCards());
    if (initiativeCards.length === 0) {
        gameState.encounter.currentTurnCardId = null;
        return;
    }
    const numericIndex = Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : 0;
    const safeIndex = Math.min(Math.max(numericIndex, 0), initiativeCards.length - 1);
    gameState.encounter.currentTurnCardId = initiativeCards[safeIndex].id;
}





let playerSideTouchStartX = null;
let playerSideTouchStartY = null;

let playerSideWheelIsCoolingDown = false;


let editingCardId = null;
let pendingDmFocusTransition = null;
let activeDmFocusTransitionCleanup = null;
let activeForgeSpellEditor = null;
let activeForgeActionEditor = null;
let activeForgeTraitEditor = null;
let suppressCardForgeClickAwayOnce = false;
let lastRenderedMirielBoardTriggerId = "";
let mirielBoardAutoHideTimer = null;
let shouldAnimateMirielBoardOnNextRender = false;
let lastRenderedMirielBoardPersistentMode = null;
let publicStageAccentTimer = null;
let publicStageSequenceTimer = null;
let publicStagePresentedCardId = null;
let publicStagePendingCardId = null;
let publicRibbonPresentedFirstCardId = null;

// ============================================================
// 2. Ansichtsmodus, Browser-Speicher und Tab-Synchronisation
// ============================================================

function getAppViewFromUrl() {
    const urlParameters = new URLSearchParams(window.location.search);
    const viewParameter = urlParameters.get("view");

    if (viewParameter === "player-side") {
        return "playerSide";
    }

    return "dm";
}

function openAppView(viewName) {
    const targetUrl = new URL(window.location.href);

    if (viewName === "playerSide") {
        targetUrl.searchParams.set("view", "player-side");
    } else {
        targetUrl.searchParams.set("view", "dm");
    }

    window.open(targetUrl.toString(), "_blank");
}

function applyAppViewToPage() {
    if (appView === "playerSide") {
        document.body.classList.add("player-side-view");
        document.body.classList.remove("dm-side-view");
    } else {
        document.body.classList.add("dm-side-view");
        document.body.classList.remove("player-side-view");
    }

    const kickerElement = document.querySelector("#app-view-kicker");

    if (kickerElement !== null) {
        kickerElement.textContent = appView === "playerSide"
            ? "Spielerseite"
            : "Spielleiterseite";
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

function getBrowserStorageItem(storageKey) {
    try {
        return localStorage.getItem(storageKey);
    } catch (error) {
        return null;
    }
}

function setBrowserStorageItem(storageKey, storageValue) {
    try {
        localStorage.setItem(storageKey, storageValue);
        return true;
    } catch (error) {
        return false;
    }
}

function removeBrowserStorageItem(storageKey) {
    try {
        localStorage.removeItem(storageKey);
        return true;
    } catch (error) {
        return false;
    }
}

function getDemoCardsAutoloadEnabled() {
    return getBrowserStorageItem(demoCardsAutoloadStorageKey) !== "false";
}

function setDemoCardsAutoloadEnabled(isEnabled) {
    demoCardsAutoloadEnabled = isEnabled === true;
    setBrowserStorageItem(demoCardsAutoloadStorageKey, demoCardsAutoloadEnabled ? "true" : "false");
}

function shouldAutoloadDemoCards() {
    return useDemoData === true && demoCardsAutoloadEnabled === true;
}

function getSafeEncounterName(rawName) {
    const safeName = getSafeOptionalString(rawName).trim();
    return safeName !== "" ? safeName : "Unbenannter Encounter";
}

function setEncounterName(rawName, options = {}) {
    gameState.name = getSafeEncounterName(rawName);
    renderEncounterNameDisplay();

    if (options.silent !== true) {
        addCombatLogMessage(`Encounter benannt: ${gameState.name}.`);
        saveAndBroadcastAppState();
    }
}

function renameEncounter() {
    const inputName = prompt(
        "Encounter benennen. Sonderzeichen werden beim Export im Dateinamen automatisch vereinfacht.",
        getSafeEncounterName(gameState.name)
    );

    if (inputName === null) {
        return;
    }

    preserveViewportWhileRendering(function() {
        setEncounterName(inputName);
        renderCards();
    });
}

function renderEncounterNameDisplay() {
    const nameElements = document.querySelectorAll("[data-encounter-name-display]");
    const safeName = getSafeEncounterName(gameState.name);

    for (const nameElement of nameElements) {
        nameElement.textContent = safeName;
    }
}

function createCurrentGameState() {
    return structuredClone(gameState);
}

function createCurrentUiState() {
    return structuredClone(uiState);
}

function createPersistentAppState() {
    return {
        formatName: "Miriel's Deck of Encounters Local State",
        formatVersion: 5,
        savedAt: new Date().toISOString(),
        demoCardsAutoloadEnabled: demoCardsAutoloadEnabled,
        gameState: createCurrentGameState(),
        uiState: createCurrentUiState()
    };
}

function saveAppStateToBrowser() {
    const persistentState = createPersistentAppState();
    const stateText = JSON.stringify(persistentState);
    const wasSaved = setBrowserStorageItem(appStorageKey, stateText);

    if (wasSaved === false) {
        updateStorageStatus("Browser-Speicher: nicht verfügbar");
        return false;
    }

    lastAppliedStateText = stateText;
    updateStorageStatus("Browser-Speicher: gespeichert");

    if (appView === "dm") {
        renderDmFeedPanel();
    }

    return true;
}

function broadcastAppStateChange() {
    if (appBroadcastChannel === null) {
        return;
    }

    appBroadcastChannel.postMessage({
        type: "game-state-changed"
    });
}

function saveAndBroadcastAppState() {
    if (isApplyingExternalState === true) {
        return;
    }

    if (appView !== "dm") {
        return;
    }

    if (saveAppStateToBrowser() === true) {
        broadcastAppStateChange();
    }
}

function loadAppStateFromBrowser() {
    const savedStateText = getBrowserStorageItem(appStorageKey);

    if (savedStateText === null) {
        updateStorageStatus("Browser-Speicher: leer");
        return false;
    }

    try {
        const savedState = JSON.parse(savedStateText);

        if (savedState.formatVersion !== 5) {
            updateStorageStatus("Browser-Speicher: veraltet – bitte zurücksetzen");
            return false;
        }

        if (typeof savedState.demoCardsAutoloadEnabled === "boolean") {
            setDemoCardsAutoloadEnabled(savedState.demoCardsAutoloadEnabled);
        }

        const savedGameState = savedState.gameState;

        if (
            savedGameState === null ||
            typeof savedGameState !== "object" ||
            Array.isArray(savedGameState) ||
            Array.isArray(savedGameState.cards) === false
        ) {
            updateStorageStatus("Browser-Speicher: fehlerhaft");
            return false;
        }

        applyGameStateData(savedGameState);
        applyUiStateData(savedState.uiState);

        if (shouldAutoloadDemoCards() === true && gameState.cards.length === 0) {
            gameState.cards = createDemoCards().map(normalizeCardModel);
            gameState.name = demoEncounterName;
            uiState.focusedCardId = null;
            resetEncounterStartGateState({ clearLog: true });
            gameState.presentation.mirielBoard.autoTurnEnabled = false;
            updateStorageStatus("Browser-Speicher: leer, Demo-Karten geladen");
            return false;
        }

        lastAppliedStateText = savedStateText;
        updateStorageStatus("Browser-Speicher: geladen");
        return true;
    } catch (error) {
        updateStorageStatus("Browser-Speicher: fehlerhaft");
        return false;
    }
}

function getSafeObject(value) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
        return {};
    }

    return value;
}

function applyGameStateData(gameStateData) {
    const encounterState = getSafeObject(gameStateData.encounter);
    const presentationState = getSafeObject(gameStateData.presentation);
    const mirielBoardState = getSafeObject(presentationState.mirielBoard);

    gameState.id = getSafeOptionalString(gameStateData.id) || createUniqueId();
    gameState.name = getSafeEncounterName(gameStateData.name);
    gameState.cards = createImportedCards(gameStateData.cards);
    gameState.encounter.roundNumber = getSafePositiveInteger(encounterState.roundNumber, 1);
    gameState.encounter.isStarted = encounterState.isStarted === true;

    const importedCurrentTurnCardId = Number(encounterState.currentTurnCardId);
    if (Number.isFinite(importedCurrentTurnCardId) && gameState.cards.some(card => card.id === importedCurrentTurnCardId)) {
        gameState.encounter.currentTurnCardId = importedCurrentTurnCardId;
    } else {
        setCurrentTurnIndex(getSafeNonNegativeInteger(encounterState.currentTurnIndex, 0));
    }

    if (isImportedPublicSelectionValid(presentationState.manuallySelectedCardId, gameState.cards)) {
        gameState.presentation.manuallySelectedCardId = Number(presentationState.manuallySelectedCardId);
    } else {
        clearManualPublicSelection();
    }

    gameState.eventLog = getSafeCombatLogMessages(gameStateData.eventLog);
    gameState.presentation.mirielBoard.manualImageData = getSafeString(mirielBoardState.manualImageData, "");
    gameState.presentation.mirielBoard.manualImageName = getSafeString(mirielBoardState.manualImageName, "");
    gameState.presentation.mirielBoard.manualText = getSafeString(mirielBoardState.manualText, "");
    gameState.presentation.mirielBoard.manualTextSize = getSafeMirielBoardManualTextSize(mirielBoardState.manualTextSize);
    gameState.presentation.mirielBoard.manualTextPosition = getSafeMirielBoardManualTextPosition(mirielBoardState.manualTextPosition);
    gameState.presentation.mirielBoard.persistentMode = getSafeMirielBoardPersistentMode(mirielBoardState.persistentMode);
    gameState.presentation.mirielBoard.autoTurnEnabled = mirielBoardState.autoTurnEnabled === true;
    gameState.presentation.mirielBoard.durationMode = getSafeMirielBoardDurationMode(mirielBoardState.durationMode);
    gameState.presentation.mirielBoard.newRoundCallEnabled = mirielBoardState.newRoundCallEnabled !== false;
    gameState.presentation.mirielBoard.triggerId = getSafeOptionalString(mirielBoardState.triggerId);
    gameState.presentation.mirielBoard.announcement = getSafeMirielBoardAnnouncement(mirielBoardState.announcement);
    gameState.settings = { ...gameState.settings, ...getSafeObject(gameStateData.settings) };

    const handCards = getHandCards();
    ensureCurrentTurnIndexIsValid(handCards);
}

function applyUiStateData(rawUiState) {
    const incomingUiState = getSafeObject(rawUiState);

    if (isImportedPublicSelectionValid(incomingUiState.focusedCardId, gameState.cards)) {
        uiState.focusedCardId = Number(incomingUiState.focusedCardId);
    } else {
        uiState.focusedCardId = null;
    }

    uiState.activeDetailTab = getSafeDetailTab(incomingUiState.activeDetailTab);
    uiState.activeDmFeedTab = getSafeDmFeedTab(incomingUiState.activeDmFeedTab);
    uiState.expandedSpellDetailKey = getSafeOptionalString(incomingUiState.expandedSpellDetailKey);

    const deckUiState = getSafeObject(incomingUiState.deck);
    uiState.deck.searchQuery = getSafeString(deckUiState.searchQuery, "");
    uiState.deck.typeFilter = ["all", "player", "npc", "monster"].includes(deckUiState.typeFilter) ? deckUiState.typeFilter : "all";
    uiState.deck.sortMode = ["name", "initiative", "type"].includes(deckUiState.sortMode) ? deckUiState.sortMode : "name";
    uiState.deck.locationView = deckUiState.locationView === cardLocations.trash ? cardLocations.trash : cardLocations.deck;
}

function applyExternalAppStateAndRender() {
    const savedStateText = getBrowserStorageItem(appStorageKey);

    if (savedStateText === null) {
        return;
    }

    if (savedStateText === lastAppliedStateText) {
        return;
    }

    lastAppliedStateText = savedStateText;

    isApplyingExternalState = true;

    const wasStateLoaded = loadAppStateFromBrowser();

    if (wasStateLoaded === true) {
        renderCards();
    }

    isApplyingExternalState = false;
}

function setupCrossTabSync() {
    if ("BroadcastChannel" in window) {
        appBroadcastChannel = new BroadcastChannel(appChannelName);

        appBroadcastChannel.addEventListener("message", function(event) {
            if (event.data === null || event.data.type !== "game-state-changed") {
                return;
            }

            if (appView === "playerSide") {
                applyExternalAppStateAndRender();
            }
        });
    }

    window.addEventListener("storage", function(event) {
        if (event.key !== appStorageKey) {
            return;
        }

        if (appView === "playerSide") {
            applyExternalAppStateAndRender();
        }
    });
}

function setupPlayerSidePolling() {
    if (appView !== "playerSide") {
        return;
    }

    setInterval(function() {
        applyExternalAppStateAndRender();
    }, 500);
}

function updateStorageStatus(message) {
    const storageStatusElement = document.querySelector("#storage-status");

    if (storageStatusElement === null) {
        return;
    }

    const now = new Date();
    const timeText = now.toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });

    storageStatusElement.textContent = `${message} · ${timeText}`;
}

function saveCurrentStateManually() {
    addCombatLogMessage("Zustand im Browser gespeichert.");

    if (saveAppStateToBrowser() === true) {
        broadcastAppStateChange();
        alert("Der aktuelle Zustand wurde im Browser dieses Geräts gespeichert. Für Backups oder den Wechsel auf ein anderes Gerät nutze „Spielstand exportieren“.");
        return;
    }

    alert("Der aktuelle Zustand konnte nicht im Browser gespeichert werden. Für Backups nutze bitte „Spielstand exportieren“.");
}

function reloadDemoCards() {
    const shouldReloadDemoCards = confirm(
        "Demo-Karten laden? Der aktuelle Zustand wird durch die Demo-Karten ersetzt."
    );

    if (shouldReloadDemoCards === false) {
        return;
    }

    setDemoCardsAutoloadEnabled(true);
    gameState.cards = createDemoCards().map(normalizeCardModel);
    gameState.name = demoEncounterName;
    uiState.focusedCardId = null;
    resetEncounterStartGateState({ clearLog: true });
    gameState.presentation.mirielBoard.autoTurnEnabled = false;
    addCombatLogMessage("Demo-Karten geladen.");

    renderCards();
    saveAndBroadcastAppState();

    alert("Die Demo-Karten wurden geladen.");
}

function isDemoCard(card) {
    return card !== null && typeof card === "object" && (card.isDemoCard === true || isKnownDemoCardData(card) === true);
}

function removeDemoCards() {
    const demoCards = gameState.cards.filter(isDemoCard);

    if (demoCards.length === 0) {
        alert("Es sind keine Demo-Karten vorhanden.");
        return;
    }

    const shouldRemoveDemoCards = confirm(
        `${demoCards.length} Demo-Karte(n) entfernen? Eigene Karten bleiben erhalten.`
    );

    if (shouldRemoveDemoCards === false) {
        return;
    }

    const removedIds = demoCards.map(function(card) {
        return card.id;
    });

    setDemoCardsAutoloadEnabled(false);
    gameState.cards = gameState.cards.filter(function(card) {
        return isDemoCard(card) === false;
    });

    if (uiState.focusedCardId !== null && removedIds.includes(uiState.focusedCardId) === true) {
        uiState.focusedCardId = null;
    }

    if (gameState.presentation.manuallySelectedCardId !== null && removedIds.includes(gameState.presentation.manuallySelectedCardId) === true) {
        clearManualPublicSelection();
    }

    resetEncounterStartGateState({ resetTurn: true });
    uiState.focusedCardId = null;
    ensureCurrentTurnIndexIsValid(getHandCards());
    addCombatLogMessage(`${demoCards.length} Demo-Karte(n) entfernt.`);

    renderCards();
    saveAndBroadcastAppState();
}

function clearSavedBrowserState() {
    const shouldClearSavedState = confirm(
        "Lokale Browserdaten löschen? Dadurch wird der auf diesem Gerät gespeicherte Zustand entfernt. Exportierte Encounter-Dateien bleiben davon unberührt."
    );

    if (shouldClearSavedState === false) {
        return;
    }

    const wasRemoved = removeBrowserStorageItem(appStorageKey);
    lastAppliedStateText = "";

    if (wasRemoved === true) {
        updateStorageStatus("Browser-Speicher: gelöscht");
        alert("Lokale Browserdaten wurden gelöscht. Exportierte Dateien auf deinem Computer wurden nicht verändert.");
        return;
    }

    updateStorageStatus("Browser-Speicher: nicht verfügbar");
    alert("Lokale Browserdaten konnten nicht gelöscht werden, weil der Browser-Speicher nicht verfügbar ist.");
}

function getCardKind(card) {
    if (cardKinds[card?.cardKind] !== undefined) {
        return card.cardKind;
    }

    return cardKinds.character;
}

function getCharacterRole(card) {
    const role = getSafeOptionalString(card?.characterRole || card?.type);
    return Object.values(characterRoles).includes(role) ? role : characterRoles.npc;
}

function getCardLocation(card) {
    const location = getSafeOptionalString(card?.location);

    if (Object.values(cardLocations).includes(location)) {
        return location;
    }

    return card?.isInCombat === true ? cardLocations.hand : cardLocations.deck;
}

function setCardLocation(card, location) {
    if (card === null || card === undefined || Object.values(cardLocations).includes(location) === false) {
        return;
    }

    card.location = location;
    card.isInCombat = location === cardLocations.hand;
    card.isSelected = false;
    card.updatedAt = new Date().toISOString();
    card.version = getSafePositiveInteger(card.version, 1) + 1;
}

function getEncounterStatus(card) {
    if (getCardLocation(card) !== cardLocations.hand) {
        return null;
    }

    if (card?.encounterStatus === encounterStatuses.eliminated || card?.isInitiativeActive === false) {
        return encounterStatuses.eliminated;
    }

    return encounterStatuses.active;
}

function setEncounterStatus(card, status) {
    if (card === null || card === undefined || getCardLocation(card) !== cardLocations.hand) {
        return;
    }

    card.encounterStatus = status === encounterStatuses.eliminated
        ? encounterStatuses.eliminated
        : encounterStatuses.active;
    card.isInitiativeActive = card.encounterStatus === encounterStatuses.active;
    card.updatedAt = new Date().toISOString();
    card.version = getSafePositiveInteger(card.version, 1) + 1;
}

function normalizeCardModel(rawCard) {
    const card = rawCard ?? {};
    const now = new Date().toISOString();
    const location = getCardLocation(card);
    const role = getCharacterRole(card);

    card.cardKind = getCardKind(card);
    card.characterRole = role;
    card.type = role;
    card.location = location;
    card.isInCombat = location === cardLocations.hand;
    card.encounterStatus = location === cardLocations.hand
        ? getEncounterStatus(card)
        : null;
    card.isInitiativeActive = card.encounterStatus !== encounterStatuses.eliminated;
    card.version = getSafePositiveInteger(card.version, 1);
    card.createdAt = getSafeOptionalString(card.createdAt) || now;
    card.updatedAt = getSafeOptionalString(card.updatedAt) || card.createdAt;
    card.deletedAt = location === cardLocations.trash
        ? getSafeOptionalString(card.deletedAt) || now
        : null;
    card.conditions = getSafeConditions(card.conditions);
    card.effects = getSafeEffects(card.effects);
    card.inventoryCards = isDemoCard(card)
        ? mergeStackableInventoryCards(getSafeInventoryCards(card.inventoryCards))
        : getSafeInventoryCards(card.inventoryCards);
    card.inventoryList = getSafeInventoryList(card.inventoryList);

    return card;
}

// ============================================================
// 2. Grundlegende Karten-Abfragen und Sortierung
// ============================================================

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

function isCardInTurnOrder(card) {
    return card !== null
        && card !== undefined
        && getCardLocation(card) === cardLocations.hand
        && getEncounterStatus(card) !== encounterStatuses.eliminated;
}

function getInitiativeCards(handCards = getHandCards()) {
    return handCards.filter(function(card) {
        return isCardInTurnOrder(card);
    });
}

function isCardOutOfAction(card) {
    return card !== null
        && card !== undefined
        && (getSafeNonNegativeInteger(card.hp, 0) === 0 || getEncounterStatus(card) === encounterStatuses.eliminated);
}

function createOutOfActionStampHtml(entity) {
    if (entity === null || entity === undefined || entity.isOutOfAction === false) {
        return "";
    }

    const isOutOfAction = entity.isOutOfAction === true || isCardOutOfAction(entity);

    if (isOutOfAction !== true) {
        return "";
    }

    return `
        <span class="out-of-action-stamp" aria-label="Außer Gefecht">
            <span>Außer Gefecht</span>
        </span>
    `;
}

function getHandCards() {
    const handCards = gameState.cards.filter(function(card) {
        return getCardLocation(card) === cardLocations.hand;
    });

    handCards.sort(function(a, b) {
        if (a.initiative !== b.initiative) {
            return b.initiative - a.initiative;
        }

        const typeDifference = getTypeSortValue(getCharacterRole(a)) - getTypeSortValue(getCharacterRole(b));

        if (typeDifference !== 0) {
            return typeDifference;
        }

        return a.name.localeCompare(b.name);
    });

    return handCards;
}

function getDeckCards() {
    const deckCards = gameState.cards.filter(function(card) {
        return getCardLocation(card) === cardLocations.deck;
    });

    deckCards.sort(function(a, b) {
        const typeDifference = getTypeSortValue(getCharacterRole(a)) - getTypeSortValue(getCharacterRole(b));

        if (typeDifference !== 0) {
            return typeDifference;
        }

        return a.name.localeCompare(b.name);
    });

    return deckCards;
}

function getTrashCards() {
    return gameState.cards
        .filter(function(card) {
            return getCardLocation(card) === cardLocations.trash;
        })
        .sort(function(a, b) {
            return getSafeOptionalString(b.deletedAt).localeCompare(getSafeOptionalString(a.deletedAt));
        });
}

function normalizeDeckSearchText(value) {
    return getSafeOptionalString(value).toLocaleLowerCase("de-DE");
}

function getCardDeckSearchText(card) {
    const traitText = getCardTraits(card).map(function(trait) {
        return `${trait.name} ${trait.description}`;
    }).join(" ");
    const actionText = getCardActions(card).map(function(action) {
        return `${action.name} ${action.description} ${action.attack} ${action.save} ${action.range} ${action.damage}`;
    }).join(" ");
    const spellText = getCardSpellcasting(card).spells.map(function(spell) {
        return `${spell.name} ${spell.description} ${spell.notes}`;
    }).join(" ");
    const inventory = getInventoryData(card);
    const inventoryText = [
        ...inventory.cards.map(function(item) { return `${item.name} ${item.description} ${item.effect}`; }),
        ...inventory.list.map(function(item) { return `${item.name} ${item.description} ${item.notes}`; })
    ].join(" ");
    const searchableParts = [
        card.name,
        card.publicName,
        card.type,
        traitText,
        actionText,
        spellText,
        card.notes,
        inventoryText
    ];

    return normalizeDeckSearchText(searchableParts.join(" "));
}

function doesCardMatchDeckSearch(card) {
    const normalizedQuery = normalizeDeckSearchText(uiState.deck.searchQuery);

    if (normalizedQuery === "") {
        return true;
    }

    const queryTokens = normalizedQuery.split(/\s+/).filter(function(token) {
        return token !== "";
    });

    const searchableText = getCardDeckSearchText(card);

    return queryTokens.every(function(token) {
        return searchableText.includes(token);
    });
}

function doesCardMatchDeckTypeFilter(card) {
    if (uiState.deck.typeFilter === "all") {
        return true;
    }

    return card.type === uiState.deck.typeFilter;
}

function sortDeckCardsForWorkbench(deckCards) {
    deckCards.sort(function(a, b) {
        if (uiState.deck.sortMode === "type") {
            const typeDifference = getTypeSortValue(a.type) - getTypeSortValue(b.type);

            if (typeDifference !== 0) {
                return typeDifference;
            }
        }

        if (uiState.deck.sortMode === "initiativeModifier") {
            const modifierDifference = getCardInitiativeModifier(b) - getCardInitiativeModifier(a);

            if (modifierDifference !== 0) {
                return modifierDifference;
            }
        }

        if (uiState.deck.sortMode === "hp") {
            const hpDifference = Number(b.maxHp || 0) - Number(a.maxHp || 0);

            if (hpDifference !== 0) {
                return hpDifference;
            }
        }

        return getSafeOptionalString(a.name).localeCompare(getSafeOptionalString(b.name), "de-DE");
    });

    return deckCards;
}

function getVisibleDeckCards(deckCards = getDeckCards()) {
    const visibleDeckCards = deckCards.filter(function(card) {
        return doesCardMatchDeckTypeFilter(card) && doesCardMatchDeckSearch(card);
    });

    return sortDeckCardsForWorkbench(visibleDeckCards);
}


// ============================================================
// 3. Fokuskarte und Detail-Tabs
// ============================================================

function getFocusedCard(handCards, activeCard) {
    if (uiState.focusedCardId !== null) {
        const focusedCard = findCardById(uiState.focusedCardId);

        if (focusedCard !== null) {
            return focusedCard;
        }

        uiState.focusedCardId = null;
    }

    if (activeCard !== null) {
        uiState.focusedCardId = activeCard.id;
        return activeCard;
    }

    if (handCards.length > 0) {
        uiState.focusedCardId = handCards[0].id;
        return handCards[0];
    }

    return null;
}

function getViewportScrollSnapshot() {
    const scrollElements = [
        document.scrollingElement,
        document.documentElement,
        document.body,
        document.querySelector(".card-forge-panel"),
        document.querySelector(".forge-tab-grid"),
        document.querySelector(".ah-drawer-panel"),
        document.querySelector("#card-detail-panel .active-hand-detail-scroll"),
        document.querySelector(".dm-action-drawer-content"),
        document.querySelector(".card-forge-scroll"),
        document.querySelector("#deck-card-list")
    ].filter(function(element, index, list) {
        return element !== null && list.indexOf(element) === index;
    });

    return {
        windowX: window.scrollX || window.pageXOffset || 0,
        windowY: window.scrollY || window.pageYOffset || 0,
        elements: scrollElements.map(function(element) {
            return {
                element: element,
                scrollLeft: element.scrollLeft,
                scrollTop: element.scrollTop
            };
        })
    };
}

function restoreViewportScrollSnapshot(snapshot) {
    if (snapshot === null || snapshot === undefined) {
        return;
    }

    window.scrollTo(snapshot.windowX, snapshot.windowY);

    for (const item of snapshot.elements) {
        if (item.element !== null && item.element !== undefined) {
            item.element.scrollLeft = item.scrollLeft;
            item.element.scrollTop = item.scrollTop;
        }
    }
}

function preserveViewportWhileRendering(renderCallback) {
    const snapshot = getViewportScrollSnapshot();

    renderCallback();

    restoreViewportScrollSnapshot(snapshot);

    requestAnimationFrame(function() {
        restoreViewportScrollSnapshot(snapshot);

        requestAnimationFrame(function() {
            restoreViewportScrollSnapshot(snapshot);
        });
    });

    setTimeout(function() {
        restoreViewportScrollSnapshot(snapshot);
    }, 40);
}

function renderCardsPreservingViewport() {
    const snapshot = getViewportScrollSnapshot();

    renderCards();

    restoreViewportScrollSnapshotRobustly(snapshot);
}

function restoreViewportScrollSnapshotRobustly(snapshot) {
    restoreViewportScrollSnapshot(snapshot);

    requestAnimationFrame(function() {
        restoreViewportScrollSnapshot(snapshot);

        requestAnimationFrame(function() {
            restoreViewportScrollSnapshot(snapshot);
        });
    });

    for (const delay of [40, 120, 260, 520]) {
        setTimeout(function() {
            restoreViewportScrollSnapshot(snapshot);
        }, delay);
    }
}


function getCurrentDmFocusedHandCard() {
    const handCards = getHandCards();
    const activeCard = getActiveCard(handCards);

    return getFocusedCard(handCards, activeCard);
}

function getDmFocusTransitionDirection(previousCardId, nextCardId, explicitDirection = null) {
    if (explicitDirection === "next") {
        return 1;
    }

    if (explicitDirection === "previous") {
        return -1;
    }

    const handCards = getHandCards();

    if (handCards.length < 2 || previousCardId === null || nextCardId === null || previousCardId === nextCardId) {
        return 1;
    }

    const previousIndex = handCards.findIndex(function(card) {
        return card.id === previousCardId;
    });
    const nextIndex = handCards.findIndex(function(card) {
        return card.id === nextCardId;
    });

    if (previousIndex === -1 || nextIndex === -1) {
        return 1;
    }

    const forwardDistance = (nextIndex - previousIndex + handCards.length) % handCards.length;
    const backwardDistance = (previousIndex - nextIndex + handCards.length) % handCards.length;

    return forwardDistance <= backwardDistance ? 1 : -1;
}

function cancelActiveDmFocusTransition() {
    if (typeof activeDmFocusTransitionCleanup === "function") {
        activeDmFocusTransitionCleanup();
    }

    activeDmFocusTransitionCleanup = null;
}

function prepareDmFocusTransition(nextCardId, explicitDirection = null) {
    if (appView !== "dm" || isApplyingExternalState === true) {
        pendingDmFocusTransition = null;
        return;
    }

    if (typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches === true) {
        pendingDmFocusTransition = null;
        return;
    }

    const previousFocusedCard = getCurrentDmFocusedHandCard();

    if (previousFocusedCard === null || previousFocusedCard.id === nextCardId) {
        pendingDmFocusTransition = null;
        return;
    }

    const oldMainCardElement = document.querySelector("#focused-card-panel .focus-stage-main-card");

    if (!(oldMainCardElement instanceof HTMLElement)) {
        pendingDmFocusTransition = null;
        return;
    }

    const oldRect = oldMainCardElement.getBoundingClientRect();

    if (oldRect.width <= 0 || oldRect.height <= 0) {
        pendingDmFocusTransition = null;
        return;
    }

    cancelActiveDmFocusTransition();

    pendingDmFocusTransition = {
        previousCardId: previousFocusedCard.id,
        nextCardId: nextCardId,
        direction: getDmFocusTransitionDirection(previousFocusedCard.id, nextCardId, explicitDirection),
        oldRect: {
            left: oldRect.left,
            top: oldRect.top,
            width: oldRect.width,
            height: oldRect.height
        },
        oldCardClone: oldMainCardElement.cloneNode(true)
    };
}

function runPendingDmFocusTransition() {
    if (appView !== "dm" || pendingDmFocusTransition === null) {
        pendingDmFocusTransition = null;
        return;
    }

    const transition = pendingDmFocusTransition;
    pendingDmFocusTransition = null;

    if (typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches === true) {
        return;
    }

    const newMainCardElement = document.querySelector("#focused-card-panel .focus-stage-main-card");
    const focusCardElement = document.querySelector("#focused-card-panel .active-hand-focus-card");
    const detailPanelElement = document.querySelector("#card-detail-panel .active-hand-details-card");

    if (!(newMainCardElement instanceof HTMLElement) || !(transition.oldCardClone instanceof HTMLElement)) {
        return;
    }

    cancelActiveDmFocusTransition();

    const direction = transition.direction === -1 ? -1 : 1;
    const exitDistance = direction * -74;
    const enterDistance = direction * 74;
    const duration = 620;
    const easing = "cubic-bezier(.2,.8,.2,1)";

    const transitionLayer = document.createElement("div");
    transitionLayer.className = "dm-focus-transition-layer";

    const exitClone = transition.oldCardClone;
    exitClone.classList.add("dm-focus-exit-clone");
    exitClone.style.left = `${transition.oldRect.left}px`;
    exitClone.style.top = `${transition.oldRect.top}px`;
    exitClone.style.width = `${transition.oldRect.width}px`;
    exitClone.style.height = `${transition.oldRect.height}px`;

    transitionLayer.appendChild(exitClone);
    document.body.appendChild(transitionLayer);

    newMainCardElement.classList.add("dm-focus-enter-card");

    const animations = [];

    animations.push(exitClone.animate(
        [
            { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)", filter: "brightness(1)" },
            { opacity: 0, transform: `translate3d(${exitDistance}px, 0, 0) scale(.965)`, filter: "brightness(.72)" }
        ],
        { duration: duration, easing: easing, fill: "forwards" }
    ));

    animations.push(newMainCardElement.animate(
        [
            { opacity: .28, transform: `translate3d(${enterDistance}px, 0, 0) scale(.965)`, filter: "brightness(.76)" },
            { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)", filter: "brightness(1)" }
        ],
        { duration: duration, easing: easing, fill: "both" }
    ));

    if (detailPanelElement instanceof HTMLElement) {
        animations.push(detailPanelElement.animate(
            [
                { opacity: .78, transform: "translate3d(0, 4px, 0)" },
                { opacity: 1, transform: "translate3d(0, 0, 0)" }
            ],
            { duration: 360, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" }
        ));
    }

    let cleanupWasRun = false;

    function cleanup() {
        if (cleanupWasRun === true) {
            return;
        }

        cleanupWasRun = true;
        newMainCardElement.classList.remove("dm-focus-enter-card");

        if (transitionLayer.parentNode !== null) {
            transitionLayer.parentNode.removeChild(transitionLayer);
        }

        if (focusCardElement instanceof HTMLElement) {
            focusCardElement.classList.add("dm-focus-card-magic-accent");
            window.setTimeout(function() {
                focusCardElement.classList.remove("dm-focus-card-magic-accent");
            }, 860);
        }

        if (activeDmFocusTransitionCleanup === cleanup) {
            activeDmFocusTransitionCleanup = null;
        }
    }

    activeDmFocusTransitionCleanup = cleanup;

    Promise.all(animations.map(function(animation) {
        return animation.finished.catch(function() {});
    })).then(cleanup);

    window.setTimeout(cleanup, duration + 140);
}

function setFocusedCard(cardId) {
    const card = findCardById(cardId);

    if (card === null || card.isInCombat !== true) {
        return;
    }

    prepareDmFocusTransition(cardId);
    uiState.focusedCardId = cardId;
    preserveViewportWhileRendering(function() {
        renderCards();
    });
}

function scrollToActiveHandView() {
    const activeHandViewElement = document.querySelector(".active-hand-view");

    if (activeHandViewElement instanceof HTMLElement) {
        activeHandViewElement.scrollIntoView({ block: "start", inline: "nearest" });
        return;
    }

    window.scrollTo(0, 0);
}

function setFocusedDeckCard(cardId) {
    const card = findCardById(cardId);

    if (card === null || card.isInCombat === true) {
        return;
    }

    uiState.focusedCardId = cardId;
    renderCards();

    requestAnimationFrame(function() {
        scrollToActiveHandView();
    });
}

function getDefaultFocusedHandCardId() {
    const activeCard = getActiveCard(getHandCards());

    if (activeCard !== null) {
        return activeCard.id;
    }

    const handCards = getHandCards();

    if (handCards.length > 0) {
        return handCards[0].id;
    }

    return null;
}

function showDeckCardFromFocus(cardId) {
    const card = findCardById(cardId);

    if (card === null || card.isInCombat === true) {
        return;
    }

    if (uiState.focusedCardId === cardId) {
        uiState.focusedCardId = getDefaultFocusedHandCardId();
    }

    renderCards();

    requestAnimationFrame(function() {
        scrollToDeckCard(cardId, true);
    });
}

function scrollToDeckCard(cardId, highlightCard) {
    const deckElement = document.querySelector(".deck-workbench");
    const cardElement = document.querySelector(`[data-deck-card-id="${cardId}"]`);

    if (deckElement instanceof HTMLElement) {
        deckElement.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
    }

    if (cardElement instanceof HTMLElement) {
        cardElement.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });

        if (highlightCard === true) {
            cardElement.classList.add("deck-card-return-highlight");

            setTimeout(function() {
                cardElement.classList.remove("deck-card-return-highlight");
            }, 1500);
        }
    }
}

function focusActiveCard() {
    const activeCard = getActiveCard(getHandCards());

    if (activeCard === null) {
        return;
    }

    prepareDmFocusTransition(activeCard.id);
    uiState.focusedCardId = activeCard.id;
    renderCardsPreservingViewport();
}

function setActiveDetailTab(tabName) {
    uiState.activeDetailTab = getSafeDetailTab(tabName);

    if (uiState.activeDetailTab !== "spells") {
        uiState.expandedSpellDetailKey = null;
    }

    preserveViewportWhileRendering(function() {
        renderCards();
    });
}

function setActiveDmFeedTab(tabName) {
    uiState.activeDmFeedTab = getSafeDmFeedTab(tabName);
    renderCards();
}

function focusAdjacentHandCard(direction) {
    const handCards = getHandCards();

    if (handCards.length === 0) {
        return;
    }

    const activeCard = getActiveCard(handCards);
    const focusedCard = getFocusedCard(handCards, activeCard);

    let focusedIndex = handCards.findIndex(function(card) {
        return focusedCard !== null && card.id === focusedCard.id;
    });

    if (focusedIndex === -1) {
        focusedIndex = 0;
    }

    if (direction === "next") {
        focusedIndex = focusedIndex + 1;

        if (focusedIndex >= handCards.length) {
            focusedIndex = 0;
        }
    } else {
        focusedIndex = focusedIndex - 1;

        if (focusedIndex < 0) {
            focusedIndex = handCards.length - 1;
        }
    }

    const nextFocusedCardId = handCards[focusedIndex].id;
    prepareDmFocusTransition(nextFocusedCardId, direction);
    uiState.focusedCardId = nextFocusedCardId;
    preserveViewportWhileRendering(function() {
        renderCards();
    });
}

// ============================================================
// 3. Öffentliche Auswahl-Helfer
// ============================================================

function hasManualPublicSelection() {
    return gameState.presentation.manuallySelectedCardId !== null;
}

function shouldPlayerSideFollowActiveCard() {
    return gameState.presentation.manuallySelectedCardId === null;
}

function isCardManuallySelected(card) {
    return hasManualPublicSelection() && card.id === gameState.presentation.manuallySelectedCardId;
}

function isPublicCardManuallySelected(publicCard) {
    return hasManualPublicSelection() && publicCard.id === gameState.presentation.manuallySelectedCardId;
}

function clearManualPublicSelection() {
    gameState.presentation.manuallySelectedCardId = null;
}

function toggleCardTurnOrder(cardId) {
    const card = findCardById(cardId);

    if (card === null || card.isInCombat !== true) {
        return;
    }

    const wasInTurnOrder = card.isInitiativeActive !== false;
    const activeCardBeforeChange = getActiveCard(getHandCards());
    const activeCardIdBeforeChange = activeCardBeforeChange !== null ? activeCardBeforeChange.id : null;

    setEncounterStatus(card, wasInTurnOrder === true ? encounterStatuses.eliminated : encounterStatuses.active);

    if (card.isInitiativeActive === false) {
        card.isSelected = false;
        addCombatLogMessage(`${card.name} wurde aus der Zugfolge genommen.`);
    } else {
        addCombatLogMessage(`${card.name} wurde wieder in die Zugfolge aufgenommen.`);
    }

    const initiativeCards = getInitiativeCards();

    if (initiativeCards.length === 0) {
        setCurrentTurnIndex(0);
    } else if (activeCardIdBeforeChange !== null && activeCardIdBeforeChange !== card.id) {
        const retainedActiveIndex = initiativeCards.findIndex(function(card) {
            return card.id === activeCardIdBeforeChange;
        });
        setCurrentTurnIndex(retainedActiveIndex >= 0 ? retainedActiveIndex : Math.min(getCurrentTurnIndex(), initiativeCards.length - 1));
    } else {
        setCurrentTurnIndex(Math.min(getCurrentTurnIndex(), initiativeCards.length - 1));
    }

    clearManualPublicSelection();
    saveAndBroadcastAppState();
    renderCardsPreservingViewport();
}

// ============================================================
// 3b. DM-Zielauswahl für spätere AOE-Aktionen
// ============================================================

function getSelectedHandCards() {
    return getHandCards().filter(function(card) {
        return card.isSelected === true;
    });
}

function getSelectedDeckCards() {
    return getDeckCards().filter(function(card) {
        return card.isSelected === true;
    });
}

function getSelectedHandCardCount() {
    return getSelectedHandCards().length;
}

function getSelectedDeckCardCount() {
    return getSelectedDeckCards().length;
}

function toggleCardSelection(cardId) {
    const card = findCardById(cardId);

    if (card === null) {
        return;
    }

    card.isSelected = card.isSelected !== true;

    preserveViewportWhileRendering(function() {
        renderCards();
    });
}

function clearCardSelection() {
    for (const card of gameState.cards) {
        card.isSelected = false;
    }

    renderCards();
}

function clearDeckSelection() {
    for (const card of gameState.cards) {
        if (card.isInCombat === false) {
            card.isSelected = false;
        }
    }

    preserveViewportWhileRendering(function() {
        renderCards();
    });
}

function selectAllHandCards() {
    for (const card of gameState.cards) {
        if (card.isInCombat === true) {
            card.isSelected = true;
        }
    }

    renderCards();
}

function selectAllDeckCards() {
    for (const card of gameState.cards) {
        if (card.isInCombat === false) {
            card.isSelected = true;
        }
    }

    renderCards();
}

function selectVisibleDeckCards() {
    const visibleDeckCards = getVisibleDeckCards();

    for (const card of visibleDeckCards) {
        card.isSelected = true;
    }

    preserveViewportWhileRendering(function() {
        renderCards();
    });
}

function updateSelectionStatus() {
    const selectionStatusElement = document.querySelector("#selection-status");
    const selectionTargetNamesElement = document.querySelector("#selection-target-names");

    if (selectionStatusElement === null) {
        return;
    }

    const selectedTargets = getSelectedHandCards();
    const selectedCount = selectedTargets.length;

    if (selectedCount === 1) {
        selectionStatusElement.textContent = "1 Ziel ausgewählt";
    } else {
        selectionStatusElement.textContent = `${selectedCount} Ziele ausgewählt`;
    }

    if (selectionTargetNamesElement === null) {
        return;
    }

    if (selectedCount === 0) {
        selectionTargetNamesElement.textContent = "Keine Ziele ausgewählt.";
        updateToolkitHeaderStatus();
        return;
    }

    selectionTargetNamesElement.textContent = createTargetNamesText(selectedTargets);
    updateToolkitHeaderStatus();
}

function updateDeckSelectionStatus() {
    const deckSelectionStatusElement = document.querySelector("#deck-selection-status");
    const deckSelectionNamesElement = document.querySelector("#deck-selection-names");

    if (deckSelectionStatusElement === null) {
        return;
    }

    const deckCards = getPreparationLocationCards();
    const visibleDeckCards = getVisibleDeckCards(deckCards);
    const selectedDeckCards = getSelectedDeckCards();
    const selectedCount = selectedDeckCards.length;

    deckSelectionStatusElement.textContent = `Auswahl: ${selectedCount} · Sichtbar: ${visibleDeckCards.length} / ${deckCards.length}`;

    if (deckSelectionNamesElement === null) {
        return;
    }

    if (selectedCount === 0) {
        deckSelectionNamesElement.textContent = "Keine Deck-Karten ausgewählt.";
        return;
    }

    deckSelectionNamesElement.textContent = createTargetNamesText(selectedDeckCards);
}

// ============================================================
// 4. Turn-Logik
// ============================================================

function ensureCurrentTurnIndexIsValid(handCards) {
    const initiativeCards = getInitiativeCards(handCards);

    if (initiativeCards.length === 0) {
        setCurrentTurnIndex(0);
        clearManualPublicSelection();
        return;
    }

    if (getCurrentTurnIndex() < 0) {
        setCurrentTurnIndex(0);
    }

    if (getCurrentTurnIndex() >= initiativeCards.length) {
        setCurrentTurnIndex(initiativeCards.length - 1);
    }
}

function getActiveCard(handCards) {
    const initiativeCards = getInitiativeCards(handCards);
    ensureCurrentTurnIndexIsValid(handCards);

    if (initiativeCards.length === 0) {
        return null;
    }

    return initiativeCards[getCurrentTurnIndex()];
}


function createEncounterRunId() {
    return typeof crypto?.randomUUID === "function"
        ? createUniqueId()
        : `encounter-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createEncounterSnapshot(snapshotType) {
    const handCards = getHandCards();
    const activeCard = getActiveCard(handCards);
    return {
        snapshotType,
        createdAt: new Date().toISOString(),
        gameStateId: gameState.id,
        gameStateName: gameState.name,
        roundNumber: gameState.encounter.roundNumber,
        currentTurnCardId: gameState.encounter.currentTurnCardId,
        activeCardName: activeCard?.name ?? null,
        cards: structuredClone(handCards),
        presentation: structuredClone(gameState.presentation)
    };
}

function getCurrentEncounterRunForExport() {
    if (gameState.encounter.isStarted === true && gameState.encounter.activeRun !== null) {
        return {
            ...structuredClone(gameState.encounter.activeRun),
            endedAt: null,
            endSnapshot: createEncounterSnapshot("current"),
            status: "active"
        };
    }
    if (gameState.encounter.lastCompletedRun !== null) {
        return {
            ...structuredClone(gameState.encounter.lastCompletedRun),
            status: "completed"
        };
    }
    return null;
}

function getEventsForEncounterRun(run) {
    if (run === null) {
        return [];
    }
    return gameState.eventLog
        .filter(event => event?.metadata?.encounterRunId === run.id)
        .slice()
        .reverse();
}

function createEncounterChronicleExportData() {
    const run = getCurrentEncounterRunForExport();
    if (run === null) {
        return null;
    }
    return {
        formatName: "Miriel's Deck of Encounters Encounter Chronicle",
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        metadata: {
            appVersion,
            gameStateId: gameState.id,
            gameStateName: gameState.name
        },
        encounter: run,
        events: getEventsForEncounterRun(run)
    };
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatReportDate(value) {
    const parsed = Date.parse(value || "");
    return Number.isNaN(parsed) ? "—" : new Date(parsed).toLocaleString("de-DE");
}

function createEncounterReportHtml() {
    const data = createEncounterChronicleExportData();
    if (data === null) {
        return null;
    }
    const run = data.encounter;
    const startCards = Array.isArray(run.startSnapshot?.cards) ? run.startSnapshot.cards : [];
    const endCards = Array.isArray(run.endSnapshot?.cards) ? run.endSnapshot.cards : [];
    const cardRows = endCards.map(card => `
        <tr>
            <td>${escapeHtml(card.name)}</td>
            <td>${escapeHtml(card.characterRole || card.type || card.cardKind || "Karte")}</td>
            <td>${escapeHtml(card.hp)} / ${escapeHtml(card.maxHp)}</td>
            <td>${escapeHtml(card.tempHp ?? 0)}</td>
            <td>${escapeHtml(Array.isArray(card.conditions) && card.conditions.length ? card.conditions.join(", ") : "—")}</td>
        </tr>`).join("");
    const eventRows = data.events.map(event => `
        <li>
            <time>${escapeHtml(formatReportDate(event.createdAt))}</time>
            <span>${escapeHtml(event.message || event.text || "Ereignis")}</span>
            ${event.metadata?.undoneByEventId ? '<strong class="undone">Rückgängig gemacht</strong>' : ''}
        </li>`).join("");
    return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Encounter-Bericht – ${escapeHtml(gameState.name)}</title>
<style>
body{font-family:system-ui,sans-serif;max-width:1000px;margin:0 auto;padding:32px;color:#21182f;background:#faf8fc}h1,h2{color:#4b2e5b}header{border-bottom:2px solid #8d6be8;margin-bottom:24px}.meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px}.meta div,section{background:#fff;border:1px solid #ded5e8;border-radius:12px;padding:16px}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:8px;border-bottom:1px solid #e9e2ef}ol{padding-left:24px}li{margin:0 0 10px;display:grid;grid-template-columns:170px 1fr auto;gap:12px}.undone{color:#7a2f46}@media print{body{background:#fff;padding:0}section,.meta div{break-inside:avoid}}
</style>
</head>
<body>
<header><h1>Encounter-Bericht</h1><p>${escapeHtml(gameState.name)}</p></header>
<div class="meta">
<div><strong>Status</strong><br>${run.status === "active" ? "Laufender Encounter" : "Abgeschlossener Encounter"}</div>
<div><strong>Beginn</strong><br>${escapeHtml(formatReportDate(run.startedAt))}</div>
<div><strong>Ende</strong><br>${escapeHtml(run.endedAt ? formatReportDate(run.endedAt) : "noch nicht beendet")}</div>
<div><strong>Ereignisse</strong><br>${data.events.length}</div>
</div>
<section><h2>Zusammenfassung</h2><p>Start: ${startCards.length} Karten auf der Hand. Ende/aktueller Stand: ${endCards.length} Karten.</p></section>
<section><h2>Karten am Ende</h2><table><thead><tr><th>Name</th><th>Rolle</th><th>HP</th><th>Temp HP</th><th>Conditions</th></tr></thead><tbody>${cardRows || '<tr><td colspan="5">Keine Karten vorhanden.</td></tr>'}</tbody></table></section>
<section><h2>Chronik</h2><ol>${eventRows || '<li>Keine Ereignisse vorhanden.</li>'}</ol></section>
</body></html>`;
}

function createEncounterExportBaseName() {
    return `miriels-deck-encounter-${createSafeFileNameSegment(gameState.name)}-${createExportTimestampText()}`;
}

function exportEncounterChronicleJson() {
    const data = createEncounterChronicleExportData();
    if (data === null) {
        alert("Es gibt noch keinen laufenden oder abgeschlossenen Encounter, der exportiert werden kann.");
        return;
    }
    downloadTextFile(`${createEncounterExportBaseName()}-chronik.json`, JSON.stringify(data, null, 4), "application/json");
}

function exportEncounterReportHtml() {
    const html = createEncounterReportHtml();
    if (html === null) {
        alert("Es gibt noch keinen laufenden oder abgeschlossenen Encounter, der exportiert werden kann.");
        return;
    }
    downloadTextFile(`${createEncounterExportBaseName()}-bericht.html`, html, "text/html;charset=utf-8");
}

function triggerMirielBoardForEncounterStart() {
    const activeCard = getActiveCard(getHandCards());

    gameState.presentation.mirielBoard.triggerId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    gameState.presentation.mirielBoard.announcement = {
        roundNumber: gameState.encounter.roundNumber,
        activeName: activeCard !== null ? activeCard.publicName || activeCard.name : "",
        isNewRound: true,
        type: "encounter-start",
        createdAt: new Date().toISOString()
    };
}

function startEncounter() {
    const handCards = getHandCards();
    const initiativeCards = getInitiativeCards(handCards);

    if (handCards.length === 0) {
        alert("Lege zuerst Karten auf die Hand, bevor du den Encounter startest.");
        return;
    }

    if (initiativeCards.length === 0) {
        alert("Nimm mindestens eine Karte wieder in die Zugfolge auf, bevor du den Encounter startest.");
        return;
    }

    setCurrentTurnIndex(0);
    gameState.encounter.roundNumber = 1;
    gameState.encounter.isStarted = true;
    clearManualPublicSelection();

    const activeCard = getActiveCard(handCards);

    if (activeCard !== null) {
        uiState.focusedCardId = activeCard.id;
        resetUsageCountersForCard(activeCard, ["turn"]);
        for (const card of handCards) {
            resetUsageCountersForCard(card, ["round"]);
        }
    }

    const startedAt = new Date().toISOString();
    gameState.encounter.activeRun = {
        id: createEncounterRunId(),
        startedAt,
        endedAt: null,
        startSnapshot: createEncounterSnapshot("start"),
        endSnapshot: null
    };

    triggerMirielBoardForEncounterStart();
    recordGameEvent({
        type: "encounter_started",
        targetCardId: activeCard?.id ?? null,
        after: {
            roundNumber: gameState.encounter.roundNumber,
            currentTurnCardId: gameState.encounter.currentTurnCardId,
            isStarted: true
        },
        message: "Encounter gestartet. Runde 1 beginnt."
    });
    saveAndBroadcastAppState();
    renderCardsPreservingViewport();
}

function nextTurn() {
    const handCards = getHandCards();
    const initiativeCards = getInitiativeCards(handCards);

    if (gameState.encounter.isStarted !== true || initiativeCards.length === 0) {
        return;
    }

    const activeTurnIndex = getCurrentTurnIndex();
    const previousActiveCardId = gameState.encounter.currentTurnCardId;
    expireEffectsForTrigger("turn_end", previousActiveCardId);
    const nextTurnIndex = activeTurnIndex + 1;
    const startsNewRound = nextTurnIndex >= initiativeCards.length;
    setCurrentTurnIndex(startsNewRound ? 0 : nextTurnIndex);
    clearManualPublicSelection();

    if (startsNewRound) {
        gameState.encounter.roundNumber = gameState.encounter.roundNumber + 1;
        expireEffectsForTrigger("round");
    }

    const newActiveCard = getActiveCard(handCards);

    if (newActiveCard !== null) {
        expireEffectsForTrigger("turn_start", newActiveCard.id);
        prepareDmFocusTransition(newActiveCard.id, "next");
        uiState.focusedCardId = newActiveCard.id;
        resetUsageCountersForCard(newActiveCard, ["turn"]);
        if (getCurrentTurnIndex() === 0) {
            for (const card of getHandCards()) {
                resetUsageCountersForCard(card, ["round"]);
            }
        }
        triggerMirielBoardForTurn(getCurrentTurnIndex() === 0);
        recordGameEvent({
            type: startsNewRound ? "round_changed" : "turn_changed",
            targetCardId: newActiveCard.id,
            after: {
                roundNumber: gameState.encounter.roundNumber,
                currentTurnCardId: newActiveCard.id
            },
            metadata: { direction: "next", startsNewRound },
            message: `Nächster Zug: ${newActiveCard.name}.`
        });
    }

    renderCardsPreservingViewport();
}

function previousTurn() {
    const handCards = getHandCards();
    const initiativeCards = getInitiativeCards(handCards);

    if (gameState.encounter.isStarted !== true || initiativeCards.length === 0) {
        return;
    }

    const activeTurnIndex = getCurrentTurnIndex();
    const crossesRoundBoundary = activeTurnIndex === 0 && gameState.encounter.roundNumber > 1;
    const previousTurnIndex = activeTurnIndex > 0
        ? activeTurnIndex - 1
        : (crossesRoundBoundary ? initiativeCards.length - 1 : 0);

    if (crossesRoundBoundary) {
        gameState.encounter.roundNumber = gameState.encounter.roundNumber - 1;
    }

    setCurrentTurnIndex(previousTurnIndex);
    clearManualPublicSelection();

    const newActiveCard = getActiveCard(getHandCards());

    if (newActiveCard !== null) {
        prepareDmFocusTransition(newActiveCard.id, "previous");
        uiState.focusedCardId = newActiveCard.id;
        triggerMirielBoardForTurn(false);
        recordGameEvent({
            type: crossesRoundBoundary ? "round_changed" : "turn_changed",
            targetCardId: newActiveCard.id,
            after: {
                roundNumber: gameState.encounter.roundNumber,
                currentTurnCardId: newActiveCard.id
            },
            metadata: { direction: "previous", crossesRoundBoundary },
            message: `Vorheriger Zug: ${newActiveCard.name}.`
        });
    }

    renderCardsPreservingViewport();
}

function resetCombatTurnCounter() {
    setCurrentTurnIndex(0);
    gameState.encounter.roundNumber = 1;
    clearManualPublicSelection();
    uiState.focusedCardId = null;

    for (const card of getHandCards()) {
        resetUsageCountersForCard(card, ["turn", "round"]);
    }

    addCombatLogMessage("Zähler zurückgesetzt.");
    renderCardsPreservingViewport();
}

// ============================================================
// 5. Scroll- und Fokus-Logik
// ============================================================

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

function scrollPlayerSide(direction) {
    scrollCardRow("player-side-ribbon", direction);
}

function focusPublicCard(publicCardId) {
    gameState.presentation.manuallySelectedCardId = publicCardId;
    renderCards();
}

function resetPublicFocusToActiveCard() {
    clearManualPublicSelection();
    renderCards();
}

function navigatePlayerSide(direction) {
    const handCards = getHandCards();

    if (handCards.length === 0) {
        return;
    }

    const activeCard = getActiveCard(handCards);
    const publicCards = createPublicEncounterState(handCards, activeCard);

    if (publicCards.length === 0) {
        return;
    }

    const focusedIndex = getFocusedPublicCardIndex(publicCards);
    let nextFocusedIndex = focusedIndex;

    if (direction === "right") {
        nextFocusedIndex = focusedIndex + 1;

        if (nextFocusedIndex >= publicCards.length) {
            nextFocusedIndex = 0;
        }
    }

    if (direction === "left") {
        nextFocusedIndex = focusedIndex - 1;

        if (nextFocusedIndex < 0) {
            nextFocusedIndex = publicCards.length - 1;
        }
    }

    gameState.presentation.manuallySelectedCardId = publicCards[nextFocusedIndex].id;

    renderCards();
}

function handlePlayerSideWheel(event) {
    const absoluteDeltaX = Math.abs(event.deltaX);
    const absoluteDeltaY = Math.abs(event.deltaY);

    const isHorizontalScroll = absoluteDeltaX > absoluteDeltaY * 1.6;
    const isShiftWheelScroll = event.shiftKey === true && absoluteDeltaY > 0;

    if (isHorizontalScroll === false && isShiftWheelScroll === false) {
        return;
    }

    event.preventDefault();

    if (playerSideWheelIsCoolingDown === true) {
        return;
    }

    playerSideWheelIsCoolingDown = true;

    const scrollValue = isHorizontalScroll ? event.deltaX : event.deltaY;

    if (scrollValue > 0) {
        navigatePlayerSide("right");
    } else {
        navigatePlayerSide("left");
    }

    setTimeout(function() {
        playerSideWheelIsCoolingDown = false;
    }, 700);
}

function handlePlayerSideTouchStart(event) {
    if (event.touches.length === 0) {
        return;
    }

    playerSideTouchStartX = event.touches[0].clientX;
    playerSideTouchStartY = event.touches[0].clientY;
}

function handlePlayerSideTouchEnd(event) {
    if (
        playerSideTouchStartX === null ||
        playerSideTouchStartY === null ||
        event.changedTouches.length === 0
    ) {
        playerSideTouchStartX = null;
        playerSideTouchStartY = null;
        return;
    }

    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;

    const deltaX = touchEndX - playerSideTouchStartX;
    const deltaY = touchEndY - playerSideTouchStartY;

    const absoluteDeltaX = Math.abs(deltaX);
    const absoluteDeltaY = Math.abs(deltaY);

    playerSideTouchStartX = null;
    playerSideTouchStartY = null;

    const minimumSwipeDistance = 50;
    const isMostlyHorizontalSwipe = absoluteDeltaX > absoluteDeltaY * 1.4;

    if (absoluteDeltaX < minimumSwipeDistance || isMostlyHorizontalSwipe === false) {
        return;
    }

    if (deltaX < 0) {
        navigatePlayerSide("right");
    } else {
        navigatePlayerSide("left");
    }
}

function setupPlayerSideNavigation() {
    const playerSideElement = document.querySelector("#player-side-list");

    if (playerSideElement === null) {
        return;
    }

    playerSideElement.addEventListener("wheel", handlePlayerSideWheel, {
        passive: false
    });

    playerSideElement.addEventListener("touchstart", handlePlayerSideTouchStart);
    playerSideElement.addEventListener("touchend", handlePlayerSideTouchEnd);
}

function closeFloatingDetailsExcept(keptDetailsElement) {
    const openDetailsElements = document.querySelectorAll("details.card-menu[open], details.section-menu[open], details.inline-details-menu[open]");

    for (const detailsElement of openDetailsElements) {
        if (keptDetailsElement !== null && detailsElement === keptDetailsElement) {
            continue;
        }

        detailsElement.open = false;
    }
}

function setupClickAwayBehavior() {
    document.addEventListener("click", function(event) {
        const targetElement = event.target;

        if (!(targetElement instanceof Element)) {
            return;
        }

        const headerHelpElement = document.querySelector(".app-header-help");

        if (headerHelpElement instanceof HTMLDetailsElement && headerHelpElement.open === true && targetElement.closest(".app-header-help") === null) {
            headerHelpElement.open = false;
        }

        const activeFloatingDetails = targetElement.closest("details.card-menu, details.section-menu, details.inline-details-menu");

        if (activeFloatingDetails === null) {
            closeFloatingDetailsExcept(null);
        } else {
            closeFloatingDetailsExcept(activeFloatingDetails);
        }

        const activeCombatLogEntry = targetElement.closest(".combat-log-entry");
        if (activeCombatLogEntry === null) {
            closeCombatLogInlinePanelsExcept(null);
        } else {
            closeCombatLogInlinePanelsExcept(activeCombatLogEntry);
        }

        if (activeDetailInventoryCardEditor !== null || activeDetailInventoryListEditor !== null) {
            const clickedInsideDetailEditor = targetElement.closest(".inventory-inline-editor") !== null;
            const clickedDetailEditorTrigger = targetElement.closest(".inventory-add-menu, .inventory-item-menu, .inventory-list-add-button, .inventory-list-row-actions") !== null;

            if (suppressDetailInventoryClickAwayOnce === true) {
                suppressDetailInventoryClickAwayOnce = false;
            } else if (clickedInsideDetailEditor === false && clickedDetailEditorTrigger === false) {
                cancelDetailInventoryEditor();
            }
        }

        const clickPath = typeof event.composedPath === "function" ? event.composedPath() : [];
        const drawerElement = getCardForgeDrawerElement();

        if (drawerElement !== null && drawerElement.classList.contains("card-forge-drawer-open") === true) {
            const clickedInsideDrawer = drawerElement.contains(targetElement) || clickPath.includes(drawerElement);
            const clickedDrawerTrigger = targetElement.closest(".card-forge-open-button, .card-forge-edit-button") !== null;
            const clickedForgeSpellAction = targetElement.closest(".forge-spell-add-button, .forge-spell-edit-button, .forge-spell-delete-button, .forge-spell-prepared-toggle, .forge-spell-editor, .forge-spell-editor-actions") !== null;
            const clickedForgeActionAction = targetElement.closest(".forge-action-add-button, .forge-action-edit-button, .forge-action-delete-button, .forge-action-editor, .forge-action-editor-actions") !== null;
            const clickedForgeTraitAction = targetElement.closest(".forge-trait-add-button, .forge-trait-edit-button, .forge-trait-delete-button, .forge-trait-editor, .forge-trait-editor-actions") !== null;
            const clickedForgeInventoryAction = targetElement.closest(".forge-inventory-add-button, .forge-inventory-edit-button, .forge-inventory-delete-button, .forge-inventory-editor, .forge-inventory-editor-actions") !== null;

            if (suppressCardForgeClickAwayOnce === true || clickedForgeSpellAction === true || clickedForgeActionAction === true || clickedForgeTraitAction === true || clickedForgeInventoryAction === true) {
                suppressCardForgeClickAwayOnce = false;
            } else if (clickedInsideDrawer === false && clickedDrawerTrigger === false) {
                closeCardForgeDrawer();
            } else if (clickedInsideDrawer === true && hasOpenForgeSpellEditor() === true) {
                cancelForgeSpellEditor(getVisibleForgePrefix(), { keepDrawerOpen: true, skipClickAwayGuard: true });
            } else if (clickedInsideDrawer === true && hasOpenForgeActionEditor() === true) {
                cancelForgeActionEditor(getVisibleForgePrefix(), { keepDrawerOpen: true, skipClickAwayGuard: true });
            } else if (clickedInsideDrawer === true && hasOpenForgeTraitEditor() === true) {
                cancelForgeTraitEditor(getVisibleForgePrefix(), { keepDrawerOpen: true, skipClickAwayGuard: true });
            } else if (clickedInsideDrawer === true && hasOpenForgeInventoryEditor() === true) {
                cancelForgeInventoryEditor(getVisibleForgePrefix(), { keepDrawerOpen: true, skipClickAwayGuard: true });
            }
        }

        const dmActionDrawerElement = getDmActionDrawerElement();

        if (dmActionDrawerElement !== null && dmActionDrawerElement.classList.contains("dm-action-drawer-open") === true) {
            const clickedInsideDmDrawer = dmActionDrawerElement.contains(targetElement) || clickPath.includes(dmActionDrawerElement);
            const clickedDmDrawerTrigger = targetElement.closest(".dm-actions-open-button") !== null;

            if (clickedInsideDmDrawer === false && clickedDmDrawerTrigger === false) {
                closeDmActionDrawer();
            }
        }
    });

    document.addEventListener("keydown", function(event) {
        if (event.key !== "Escape") {
            return;
        }

        closeFloatingDetailsExcept(null);
        if (activeDetailInventoryCardEditor !== null || activeDetailInventoryListEditor !== null) {
            cancelDetailInventoryEditor();
        }
        closeCardForgeDrawer();
        closeDmActionDrawer();
    });
}

// ============================================================
// 6. Karten finden, verschieben, entfernen und Combat-Aufräumen
// ============================================================

function findCardById(id) {
    for (const card of gameState.cards) {
        if (card.id === id) {
            return card;
        }
    }

    return null;
}

function getNextCardId() {
    let highestId = 0;

    for (const card of gameState.cards) {
        if (card.id > highestId) {
            highestId = card.id;
        }
    }

    return highestId + 1;
}

function createCardCopyName(baseName) {
    const cleanBaseName = getSafeOptionalString(baseName) || "Karte";
    const copyBaseName = `${cleanBaseName} Kopie`;
    let copyName = copyBaseName;
    let counter = 2;

    while (gameState.cards.some(function(card) { return card.name === copyName; }) === true) {
        copyName = `${copyBaseName} ${counter}`;
        counter += 1;
    }

    return copyName;
}

function clonePlainData(value) {
    if (typeof structuredClone === "function") {
        try {
            return structuredClone(value);
        } catch (error) {
            // Fallback für ältere Browser oder nicht klonbare Werte.
        }
    }

    return JSON.parse(JSON.stringify(value));
}

function cloneCardData(card) {
    return clonePlainData(card);
}

function copyCardToDeck(cardId) {
    const sourceCard = findCardById(cardId);

    if (sourceCard === null) {
        return;
    }

    const cardCopy = cloneCardData(sourceCard);
    cardCopy.id = getNextCardId();
    cardCopy.name = createCardCopyName(sourceCard.name);
    cardCopy.publicName = getSafeOptionalString(sourceCard.publicName) || sourceCard.publicName;
    setCardLocation(cardCopy, cardLocations.deck);
    cardCopy.encounterStatus = null;
    cardCopy.deletedAt = null;
    cardCopy.isDemoCard = false;

    gameState.cards.push(cardCopy);
    addCombatLogMessage(`Karte kopiert und ins Deck gelegt: ${cardCopy.name}.`);

    preserveViewportWhileRendering(function() {
        renderCards();
    });
}

function moveCardToTrash(id) {
    const card = findCardById(id);

    if (card === null) {
        return;
    }

    if (confirm(`„${card.name}“ in den Papierkorb verschieben?`) !== true) {
        return;
    }

    setCardLocation(card, cardLocations.trash);
    card.encounterStatus = null;
    card.deletedAt = new Date().toISOString();
    addCombatLogMessage(`Karte in den Papierkorb verschoben: ${card.name}.`);

    if (gameState.presentation.manuallySelectedCardId === id) {
        clearManualPublicSelection();
    }

    if (uiState.focusedCardId === id) {
        uiState.focusedCardId = null;
    }

    const handCards = getHandCards();
    ensureCurrentTurnIndexIsValid(handCards);

    if (handCards.length === 0) {
        resetEncounterStartGateState({ resetTurn: true });
    }

    preserveViewportWhileRendering(function() {
        renderCards();
    });
}

function restoreCardFromTrash(cardId) {
    const card = findCardById(cardId);

    if (card === null || getCardLocation(card) !== cardLocations.trash) {
        return;
    }

    setCardLocation(card, cardLocations.deck);
    card.deletedAt = null;
    addCombatLogMessage(`Karte aus dem Papierkorb wiederhergestellt: ${card.name}.`);
    renderCards();
}

function permanentlyDeleteCard(cardId) {
    const card = findCardById(cardId);

    if (card === null || getCardLocation(card) !== cardLocations.trash) {
        return;
    }

    if (confirm(`„${card.name}“ endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden.`) !== true) {
        return;
    }

    gameState.cards = gameState.cards.filter(function(existingCard) {
        return existingCard.id !== cardId;
    });

    if (uiState.focusedCardId === cardId) {
        uiState.focusedCardId = null;
    }

    addCombatLogMessage(`Karte endgültig gelöscht: ${card.name}.`);
    renderCards();
}

function moveCardToHand(cardId) {
    const card = findCardById(cardId);

    if (card === null) {
        return;
    }

    setCardLocation(card, cardLocations.hand);
    setEncounterStatus(card, encounterStatuses.active);

    const handCards = getHandCards();
    ensureCurrentTurnIndexIsValid(handCards);

    preserveViewportWhileRendering(function() {
        renderCards();
    });
}

function moveCardToDeck(cardId) {
    const card = findCardById(cardId);

    if (card === null) {
        return;
    }

    setCardLocation(card, cardLocations.deck);
    card.encounterStatus = null;

    if (gameState.presentation.manuallySelectedCardId === cardId) {
        clearManualPublicSelection();
    }

    if (uiState.focusedCardId === cardId) {
        uiState.focusedCardId = null;
    }

    const handCards = getHandCards();
    ensureCurrentTurnIndexIsValid(handCards);

    if (handCards.length === 0) {
        resetEncounterStartGateState({ resetTurn: true });
    }

    preserveViewportWhileRendering(function() {
        renderCards();
    });
}

function moveAllHandCardsToDeck() {
    for (const card of gameState.cards) {
        if (getCardLocation(card) === cardLocations.hand) {
            setCardLocation(card, cardLocations.deck);
            card.encounterStatus = null;
        }
    }

    resetEncounterStartGateState({ resetTurn: true });
    uiState.focusedCardId = null;

    renderCards();
}

function moveAllDeckCardsToHand() {
    for (const card of gameState.cards) {
        if (getCardLocation(card) === cardLocations.deck) {
            setCardLocation(card, cardLocations.hand);
            setEncounterStatus(card, encounterStatuses.active);
        }
    }

    const handCards = getHandCards();
    ensureCurrentTurnIndexIsValid(handCards);

    renderCards();
}

function moveSelectedDeckCardsToHand() {
    const selectedDeckCards = getSelectedDeckCards();

    if (selectedDeckCards.length === 0) {
        alert("Bitte wähle zuerst mindestens eine Deck-Karte aus.");
        return;
    }

    const selectedNamesText = createTargetNamesText(selectedDeckCards);

    for (const card of selectedDeckCards) {
        card.isInCombat = true;
        card.isSelected = false;
    }

    const handCards = getHandCards();
    ensureCurrentTurnIndexIsValid(handCards);

    addCombatLogMessage(`${selectedDeckCards.length} Deck-Karte(n) auf die Hand genommen: ${selectedNamesText}.`);
    preserveViewportWhileRendering(function() {
        renderCards();
    });
}

function moveHandCardsOfTypeToDeck(type) {
    for (const card of gameState.cards) {
        if (card.isInCombat === true && card.type === type) {
            card.isInCombat = false;
            card.isSelected = false;
        }
    }

    clearManualPublicSelection();

    const handCards = getHandCards();
    ensureCurrentTurnIndexIsValid(handCards);

    renderCards();
}

function moveDeckCardsOfTypeToHand(type) {
    for (const card of gameState.cards) {
        if (card.isInCombat === false && card.type === type) {
            card.isInCombat = true;
            card.isSelected = false;
        }
    }

    const handCards = getHandCards();
    ensureCurrentTurnIndexIsValid(handCards);

    renderCards();
}

function clearAllTempHp() {
    const shouldClearTempHp = confirm("Alle Temp HP aller Karten entfernen?");

    if (shouldClearTempHp === false) {
        return;
    }

    for (const card of gameState.cards) {
        card.tempHp = 0;
    }

    addCombatLogMessage("Alle Temp HP entfernt.");
    renderCards();
}

function clearConditionsFromHandCards() {
    const shouldClearConditions = confirm("Alle Conditions von Karten auf der Hand entfernen?");

    if (shouldClearConditions === false) {
        return;
    }

    for (const card of gameState.cards) {
        if (card.isInCombat === true) {
            card.conditions = [];
        }
    }

    addCombatLogMessage("Alle Conditions von Handkarten entfernt.");
    renderCards();
}

function endCombat() {
    const shouldEndCombat = confirm(
        "Kampf beenden? Alle Karten auf der Hand werden ins Deck verschoben. Temp HP und Conditions bleiben erhalten."
    );

    if (shouldEndCombat === false) {
        return;
    }

    const handCardsBeforeEnd = getHandCards();
    const movedCardCount = handCardsBeforeEnd.length;
    const endSnapshotBeforeMove = createEncounterSnapshot("end");

    for (const card of handCardsBeforeEnd) {
        resetUsageCountersForCard(card, ["encounter", "turn", "round"]);
    }

    let movedCardNamesText = "keine Karten";

    if (movedCardCount > 0) {
        movedCardNamesText = createTargetNamesText(handCardsBeforeEnd);
    }

    for (const card of gameState.cards) {
        if (card.isInCombat === true) {
            card.isInCombat = false;
        }

        card.isSelected = false;
    }

    const completedRun = gameState.encounter.activeRun !== null
        ? {
            ...structuredClone(gameState.encounter.activeRun),
            endedAt: new Date().toISOString(),
            endSnapshot: endSnapshotBeforeMove
        }
        : null;

    recordGameEvent({
        type: "encounter_ended",
        before: {
            roundNumber: gameState.encounter.roundNumber,
            currentTurnCardId: gameState.encounter.currentTurnCardId,
            isStarted: true
        },
        after: {
            movedCardCount,
            isStarted: false
        },
        message: `Encounter beendet. ${movedCardCount} Karte(n) ins Deck verschoben: ${movedCardNamesText}.`
    });

    if (completedRun !== null) {
        gameState.encounter.lastCompletedRun = completedRun;
    }
    gameState.encounter.activeRun = null;
    resetEncounterStartGateState({ resetTurn: true });

    if (editingCardId !== null) {
        const editedCard = getEditFormCard();

        if (editedCard !== null) {
            setCheckboxValue("edit-card-is-in-combat", editedCard.isInCombat === true);
        }
    }

    saveAndBroadcastAppState();
    renderCardsPreservingViewport();
}

function longRestPlayerCards() {
    const playerCards = gameState.cards.filter(function(card) {
        return card.type === "player";
    });

    if (playerCards.length === 0) {
        alert("Es gibt keine Player-Karten für eine Lange Rast.");
        return;
    }

    const shouldLongRest = confirm(
        "Lange Rast durchführen? Alle Player-Karten werden auf Max HP gesetzt. Temp HP und Conditions werden entfernt."
    );

    if (shouldLongRest === false) {
        return;
    }

    for (const card of playerCards) {
        card.hp = card.maxHp;
        card.tempHp = 0;
        card.conditions = [];
        resetSpellSlotsForCard(card);
        resetUsageCountersForCard(card, ["shortRest", "longRest", "encounter", "turn", "round"]);
        card.isSelected = false;
    }

    setCurrentTurnIndex(0);
    gameState.encounter.roundNumber = 1;
    clearManualPublicSelection();

    addCombatLogMessage(
        `Lange Rast: ${playerCards.length} Player-Karte(n) vollständig erholt: ${createTargetNamesText(playerCards)}.`
    );

    renderCards();
}

function deleteAllCards() {
    const shouldDeleteAllCards = confirm("Aktuellen Spielstand leeren? Alle Karten auf der Hand und im Deck werden entfernt. Exportierte Dateien und lokale Browserdaten bleiben davon unberührt, bis du erneut speicherst.");

    if (shouldDeleteAllCards === false) {
        return;
    }

    setDemoCardsAutoloadEnabled(false);
    gameState.name = "Unbenannter Encounter";
    gameState.cards = [];
    uiState.focusedCardId = null;
    setCurrentTurnIndex(0);
    gameState.encounter.roundNumber = 1;
    gameState.eventLog = [];
    clearManualPublicSelection();
    addCombatLogMessage("Spielstand geleert. Alle Karten wurden gelöscht.");

    renderCards();
}


// ============================================================
// 6b. Initiative-Werkzeuge für den aktuellen Encounter
// ============================================================

function getInitiativeActionValue() {
    const inputElement = document.querySelector("#initiative-action-value");

    if (inputElement === null) {
        return 0;
    }

    return Number(inputElement.value);
}

function getValidatedInitiativeActionValue() {
    const initiativeValue = getInitiativeActionValue();

    if (Number.isFinite(initiativeValue) === false) {
        alert("Bitte gib einen gültigen Initiative-Wert ein.");
        return null;
    }

    return Math.floor(initiativeValue);
}

function rollD20() {
    return Math.floor(Math.random() * 20) + 1;
}

function parseSignedModifier(value) {
    const modifierText = getSafeOptionalString(value)
        .replace(/[^0-9+\-]/g, "")
        .trim();

    if (modifierText === "") {
        return 0;
    }

    const parsedModifier = Number(modifierText);

    if (Number.isFinite(parsedModifier) === false) {
        return 0;
    }

    return Math.floor(parsedModifier);
}

function formatSignedModifier(value) {
    const numericValue = Number(value);

    if (Number.isFinite(numericValue) === false || numericValue === 0) {
        return "+0";
    }

    if (numericValue > 0) {
        return `+${numericValue}`;
    }

    return String(numericValue);
}

function getCardInitiativeModifier(card) {
    if (card === null || card === undefined) {
        return 0;
    }

    const explicitModifier = getSafeOptionalString(card.initiativeModifier);

    if (explicitModifier !== "") {
        return parseSignedModifier(explicitModifier);
    }

    return parseSignedModifier(card.dexterityModifier);
}

function getSelectedHandCardsForInitiativeOrWarn() {
    const selectedCards = getSelectedHandCards();

    if (selectedCards.length === 0) {
        alert("Bitte wähle zuerst mindestens eine Karte auf der Hand aus.");
        return [];
    }

    return selectedCards;
}

function rememberActiveCardId() {
    const activeCard = getActiveCard(getHandCards());

    if (activeCard === null) {
        return null;
    }

    return activeCard.id;
}

function restoreActiveTurnAfterInitiativeChange(activeCardId) {
    const handCards = getHandCards();
    const initiativeCards = getInitiativeCards(handCards);

    if (activeCardId === null) {
        ensureCurrentTurnIndexIsValid(handCards);
        return;
    }

    const newActiveIndex = initiativeCards.findIndex(function(card) {
        return card.id === activeCardId;
    });

    if (newActiveIndex === -1) {
        ensureCurrentTurnIndexIsValid(handCards);
        return;
    }

    setCurrentTurnIndex(newActiveIndex);
}

function applyInitiativeToSelectedCards() {
    const selectedCards = getSelectedHandCardsForInitiativeOrWarn();

    if (selectedCards.length === 0) {
        return;
    }

    const initiativeValue = getValidatedInitiativeActionValue();

    if (initiativeValue === null) {
        return;
    }

    const activeCardId = rememberActiveCardId();

    for (const card of selectedCards) {
        card.initiative = initiativeValue;
    }

    restoreActiveTurnAfterInitiativeChange(activeCardId);

    addCombatLogMessage(`Initiative ${initiativeValue} gesetzt für ${selectedCards.length} Karte(n): ${createTargetNamesText(selectedCards)}.`);
    renderCards();
}

function rollInitiativeForCards(cardsToRoll, logLabel) {
    if (cardsToRoll.length === 0) {
        alert("Es gibt keine passenden Karten auf der Hand.");
        return;
    }

    const activeCardId = rememberActiveCardId();
    const rollResults = [];

    for (const card of cardsToRoll) {
        const rolledInitiative = rollD20();
        const initiativeModifier = getCardInitiativeModifier(card);
        const finalInitiative = rolledInitiative + initiativeModifier;
        card.initiative = finalInitiative;
        rollResults.push(`${card.name}: ${finalInitiative} (${rolledInitiative}${formatSignedModifier(initiativeModifier)})`);
    }

    restoreActiveTurnAfterInitiativeChange(activeCardId);

    addCombatLogMessage(`${logLabel}: ${rollResults.join(", ")}.`);
    renderCards();
}

function rollInitiativeForSelectedCards() {
    const selectedCards = getSelectedHandCardsForInitiativeOrWarn();

    if (selectedCards.length === 0) {
        return;
    }

    rollInitiativeForCards(selectedCards, "Initiative gewürfelt");
}

function rollInitiativeForHandMonsters() {
    const monsterCards = getHandCards().filter(function(card) {
        return card.type === "monster";
    });

    rollInitiativeForCards(monsterCards, "Monster-Initiative gewürfelt");
}

function rollInitiativeForHandEnemies() {
    const enemyCards = getHandCards().filter(function(card) {
        return card.type === "monster" || card.type === "npc";
    });

    rollInitiativeForCards(enemyCards, "Gegner-Initiative gewürfelt (NPCs und Monster)");
}

function updateInitiativeToolStatus() {
    const inputElement = document.querySelector("#initiative-action-value");
    const hintElement = document.querySelector("#initiative-tool-hint");

    if (inputElement === null && hintElement === null) {
        return;
    }

    const selectedCards = getSelectedHandCards();

    if (selectedCards.length === 1) {
        if (inputElement !== null && document.activeElement !== inputElement) {
            inputElement.value = selectedCards[0].initiative;
        }

        if (hintElement !== null) {
            hintElement.textContent = `${selectedCards[0].name}: aktuelle Initiative ${selectedCards[0].initiative}.`;
        }

        return;
    }

    if (selectedCards.length > 1) {
        if (hintElement !== null) {
            hintElement.textContent = `${selectedCards.length} Handkarten ausgewählt. Setzen betrifft alle ausgewählten Karten.`;
        }

        return;
    }

    if (hintElement !== null) {
        hintElement.textContent = "Wähle eine oder mehrere Handkarten aus, um Initiative zu setzen oder zu würfeln.";
    }
}

// ============================================================
// 7. HP und Kampfaktionen
// ============================================================

function getHpChangeAmount(cardId) {
    const inputElement = document.querySelector(`#hp-change-amount-${cardId}`);

    if (inputElement === null) {
        return 0;
    }

    return Number(inputElement.value);
}

function applyDamage(card, amount) {
    if (card === null) {
        return;
    }

    if (amount < 0) {
        return;
    }

    if (amount <= card.tempHp) {
        card.tempHp = card.tempHp - amount;
        return;
    }

    const remainingDamage = amount - card.tempHp;

    card.tempHp = 0;
    card.hp = Math.max(0, card.hp - remainingDamage);
}

function applyHealing(card, amount) {
    if (card === null) {
        return;
    }

    if (amount < 0) {
        return;
    }

    card.hp = Math.min(card.maxHp, card.hp + amount);
}

function applyTempHp(card, amount) {
    if (card === null) {
        return;
    }

    if (amount < 0) {
        return;
    }

    card.tempHp = amount;
}

function handleDamageButtonClick(cardId) {
    const card = findCardById(cardId);
    const amount = getHpChangeAmount(cardId);

    applyDamage(card, amount);
    renderCards();
}

function handleHealingButtonClick(cardId) {
    const card = findCardById(cardId);
    const amount = getHpChangeAmount(cardId);

    applyHealing(card, amount);
    renderCards();
}

function handleTempHpButtonClick(cardId) {
    const card = findCardById(cardId);
    const amount = getHpChangeAmount(cardId);

    applyTempHp(card, amount);
    renderCards();
}

function getGroupActionAmount() {
    const inputElement = document.querySelector("#group-action-amount");

    if (inputElement === null) {
        return 0;
    }

    return Number(inputElement.value);
}

function getSelectedGroupCondition() {
    const selectElement = document.querySelector("#group-condition-select");

    if (selectElement === null) {
        return "";
    }

    return selectElement.value;
}

function getCurrentTimeText() {
    const now = new Date();

    return now.toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}

function createTargetNamesText(targets) {
    return targets.map(function(card) {
        return card.name;
    }).join(", ");
}

function createActionTargetLogText(targets) {
    const targetNamesText = createTargetNamesText(targets);

    if (targets.length === 1) {
        return targetNamesText;
    }

    return `: ${targetNamesText}`;
}

const eventLogRetention = Object.freeze({
    maximumEvents: 5000,
    maximumAgeDays: 30
});

const undoConfiguration = Object.freeze({
    immediateUndoWindowMs: 30 * 1000,
    undoableEventTypes: new Set([
        "damage",
        "healing",
        "temporary_hp",
        "condition_added",
        "condition_removed",
        "item_used",
        "item_transferred"
    ])
});

let recentUndoOffer = null;
let recentUndoTimerId = null;
let recentUndoCountdownId = null;

function createGameEventId() {
    return typeof crypto?.randomUUID === "function"
        ? createUniqueId()
        : `event-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function pruneGameEventLog() {
    const maximumAgeMs = eventLogRetention.maximumAgeDays * 24 * 60 * 60 * 1000;
    const oldestAllowedTimestamp = Date.now() - maximumAgeMs;

    gameState.eventLog = gameState.eventLog.filter(function(event) {
        const timestamp = Date.parse(event.createdAt || "");
        return Number.isNaN(timestamp) || timestamp >= oldestAllowedTimestamp;
    }).slice(0, eventLogRetention.maximumEvents);
}

function recordGameEvent(eventData = {}) {
    const createdAt = typeof eventData.createdAt === "string"
        ? eventData.createdAt
        : new Date().toISOString();
    const message = typeof eventData.message === "string"
        ? eventData.message
        : "Ereignis protokolliert.";

    const event = {
        id: typeof eventData.id === "string" && eventData.id !== ""
            ? eventData.id
            : createGameEventId(),
        type: typeof eventData.type === "string" && eventData.type !== ""
            ? eventData.type
            : "system",
        actorParticipantId: eventData.actorParticipantId ?? null,
        sourceCardId: eventData.sourceCardId ?? null,
        targetCardId: eventData.targetCardId ?? null,
        targetCardIds: Array.isArray(eventData.targetCardIds)
            ? [...eventData.targetCardIds]
            : (eventData.targetCardId !== undefined && eventData.targetCardId !== null ? [eventData.targetCardId] : []),
        amount: Number.isFinite(eventData.amount) ? eventData.amount : null,
        condition: typeof eventData.condition === "string" ? eventData.condition : null,
        before: eventData.before === undefined ? null : structuredClone(eventData.before),
        after: eventData.after === undefined ? null : structuredClone(eventData.after),
        metadata: {
            ...(eventData.metadata && typeof eventData.metadata === "object"
                ? structuredClone(eventData.metadata)
                : {}),
            ...(gameState.encounter.activeRun?.id
                ? { encounterRunId: gameState.encounter.activeRun.id }
                : {})
        },
        createdAt,
        message,
        // Kompatible Darstellungsfelder für die bestehende Chronik-UI.
        time: new Date(createdAt).toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }),
        text: message
    };

    gameState.eventLog.unshift(event);
    pruneGameEventLog();
    window.setTimeout(function() {
        showRecentUndoOffer(event);
    }, 0);
    return event;
}

function getGameEventById(eventId) {
    return gameState.eventLog.find(function(event) {
        return event.id === eventId;
    }) ?? null;
}

function getEventStateFields(event) {
    if (event.type === "damage" || event.type === "healing") {
        return ["hp", "tempHp"];
    }
    if (event.type === "temporary_hp") {
        return ["tempHp"];
    }
    if (event.type === "condition_added" || event.type === "condition_removed") {
        return ["conditions"];
    }
    if (event.type === "effect_added" || event.type === "effect_removed" || event.type === "effect_expired") {
        return ["effects"];
    }
    if (event.type === "item_used") {
        return ["inventoryCards", "inventoryList", "hp", "tempHp", "conditions", "effects"];
    }
    if (event.type === "item_transferred") {
        return ["inventoryCards"];
    }
    return [];
}

function isGameEventUndoable(event) {
    return event !== null
        && undoConfiguration.undoableEventTypes.has(event.type)
        && Array.isArray(event.before)
        && Array.isArray(event.after)
        && event.before.length > 0
        && event.metadata?.undoneByEventId === undefined;
}

function getSnapshotValue(card, fieldName) {
    if (fieldName === "conditions") {
        return Array.isArray(card.conditions) ? [...card.conditions] : [];
    }
    if (fieldName === "effects") {
        return structuredClone(Array.isArray(card.effects) ? card.effects : []);
    }
    return card[fieldName];
}

function valuesMatchForUndo(currentValue, expectedValue) {
    return JSON.stringify(currentValue) === JSON.stringify(expectedValue);
}

function getUndoConflictMessage(event) {
    if (isGameEventUndoable(event) === false) {
        return "Dieses Ereignis kann nicht rückgängig gemacht werden.";
    }

    const fields = getEventStateFields(event);
    for (const afterSnapshot of event.after) {
        const card = findCardById(afterSnapshot.cardId);
        if (card === null) {
            return "Eine betroffene Karte ist nicht mehr vorhanden.";
        }
        for (const fieldName of fields) {
            if (Object.prototype.hasOwnProperty.call(afterSnapshot, fieldName) === false) {
                continue;
            }
            const currentValue = getSnapshotValue(card, fieldName);
            if (valuesMatchForUndo(currentValue, afterSnapshot[fieldName]) === false) {
                return "Diese Aktion kann nicht sicher rückgängig gemacht werden, weil der betroffene Zustand danach erneut verändert wurde.";
            }
        }
    }

    return "";
}

function restoreEventBeforeState(event) {
    const fields = getEventStateFields(event);
    for (const beforeSnapshot of event.before) {
        const card = findCardById(beforeSnapshot.cardId);
        if (card === null) {
            continue;
        }
        for (const fieldName of fields) {
            if (Object.prototype.hasOwnProperty.call(beforeSnapshot, fieldName) === false) {
                continue;
            }
            card[fieldName] = ["conditions", "effects", "inventoryCards", "inventoryList"].includes(fieldName)
                ? structuredClone(beforeSnapshot[fieldName])
                : beforeSnapshot[fieldName];
        }
        card.version = Number.isInteger(card.version) ? card.version + 1 : 1;
        card.updatedAt = new Date().toISOString();
    }
}

function clearRecentUndoOffer() {
    recentUndoOffer = null;
    if (recentUndoTimerId !== null) {
        window.clearTimeout(recentUndoTimerId);
        recentUndoTimerId = null;
    }
    if (recentUndoCountdownId !== null) {
        window.clearInterval(recentUndoCountdownId);
        recentUndoCountdownId = null;
    }
    document.querySelector("#recent-undo-toast")?.remove();
}

function updateRecentUndoCountdown() {
    const countdownElement = document.querySelector("#recent-undo-countdown");
    if (countdownElement === null || recentUndoOffer === null) {
        return;
    }
    const remainingMs = Math.max(0, recentUndoOffer.expiresAt - Date.now());
    countdownElement.textContent = `${Math.ceil(remainingMs / 1000)} s`;
}

function showRecentUndoOffer(event) {
    if (appView !== "dm" || isGameEventUndoable(event) === false) {
        return;
    }

    clearRecentUndoOffer();
    recentUndoOffer = {
        eventId: event.id,
        expiresAt: Date.now() + undoConfiguration.immediateUndoWindowMs
    };

    const toast = document.createElement("aside");
    toast.id = "recent-undo-toast";
    toast.className = "recent-undo-toast";
    toast.setAttribute("role", "status");
    toast.innerHTML = `
        <div class="recent-undo-toast-copy">
            <strong>Aktion ausgeführt</strong>
            <span>${escapeHtml(event.message)}</span>
        </div>
        <button type="button" onclick="undoRecentGameEvent()">
            Rückgängig <span id="recent-undo-countdown">30 s</span>
        </button>
        <button class="recent-undo-toast-close" type="button" onclick="clearRecentUndoOffer()" aria-label="Hinweis schließen">×</button>
    `;
    document.body.appendChild(toast);
    updateRecentUndoCountdown();
    recentUndoCountdownId = window.setInterval(updateRecentUndoCountdown, 1000);
    recentUndoTimerId = window.setTimeout(clearRecentUndoOffer, undoConfiguration.immediateUndoWindowMs);
}

function undoRecentGameEvent() {
    if (recentUndoOffer === null || Date.now() > recentUndoOffer.expiresAt) {
        clearRecentUndoOffer();
        alert("Das Zeitfenster für das direkte Rückgängig ist abgelaufen.");
        return;
    }
    const eventId = recentUndoOffer.eventId;
    clearRecentUndoOffer();
    undoGameEvent(eventId);
}

function undoGameEvent(eventId) {
    const event = getGameEventById(eventId);
    const conflictMessage = getUndoConflictMessage(event);
    if (conflictMessage !== "") {
        alert(conflictMessage);
        return false;
    }

    restoreEventBeforeState(event);
    const undoEvent = recordGameEvent({
        type: "undo",
        targetCardIds: [...event.targetCardIds],
        metadata: {
            revertedEventId: event.id,
            revertedEventType: event.type
        },
        message: `„${event.message}“ wurde rückgängig gemacht.`
    });
    event.metadata = {
        ...(event.metadata ?? {}),
        undoneByEventId: undoEvent.id,
        undoneAt: undoEvent.createdAt
    };
    clearRecentUndoOffer();
    renderCardsPreservingViewport();
    return true;
}

function getGameEventTypeLabel(eventType) {
    const labels = {
        damage: "Schaden",
        healing: "Heilung",
        temporary_hp: "Temporäre Trefferpunkte",
        condition_added: "Condition hinzugefügt",
        condition_removed: "Condition entfernt",
        effect_added: "Effekt hinzugefügt",
        effect_removed: "Effekt entfernt",
        effect_expired: "Effekt abgelaufen",
        encounter_started: "Encounter gestartet",
        encounter_ended: "Encounter beendet",
        turn_changed: "Zug gewechselt",
        round_changed: "Runde gewechselt",
        card_moved: "Karte verschoben",
        item_used: "Item verwendet",
        item_transferred: "Item übertragen",
        undo: "Rückgängig",
        system: "Systemmeldung"
    };
    return labels[eventType] ?? "Ereignis";
}

function getGameEventTargetNames(event) {
    const targetIds = Array.isArray(event.targetCardIds) ? event.targetCardIds : [];
    const names = targetIds.map(function(cardId) {
        return findCardById(cardId)?.name ?? `Unbekannte Karte (${cardId})`;
    });
    return names.length > 0 ? names.join(", ") : "Kein Kartenziel";
}

function createGameEventStateChangeLines(event) {
    if (!Array.isArray(event.before) || !Array.isArray(event.after)) {
        return [];
    }

    const lines = [];
    for (const beforeState of event.before) {
        const afterState = event.after.find(function(candidate) {
            return candidate.cardId === beforeState.cardId;
        });
        if (afterState === undefined) {
            continue;
        }
        const cardName = findCardById(beforeState.cardId)?.name ?? "Unbekannte Karte";
        const changes = [];

        if (Object.prototype.hasOwnProperty.call(beforeState, "hp") && Object.prototype.hasOwnProperty.call(afterState, "hp")) {
            changes.push(`HP ${beforeState.hp} → ${afterState.hp}`);
        }
        if (Object.prototype.hasOwnProperty.call(beforeState, "tempHp") && Object.prototype.hasOwnProperty.call(afterState, "tempHp")) {
            changes.push(`Temp HP ${beforeState.tempHp} → ${afterState.tempHp}`);
        }
        if (Array.isArray(beforeState.conditions) && Array.isArray(afterState.conditions)) {
            const beforeText = beforeState.conditions.length > 0 ? beforeState.conditions.join(", ") : "keine";
            const afterText = afterState.conditions.length > 0 ? afterState.conditions.join(", ") : "keine";
            changes.push(`Conditions: ${beforeText} → ${afterText}`);
        }

        if (changes.length > 0) {
            lines.push(`${cardName}: ${changes.join(" · ")}`);
        }
    }
    return lines;
}

function createGameEventDetailsText(event) {
    const createdDate = new Date(event.createdAt);
    const dateText = Number.isNaN(createdDate.getTime())
        ? "Unbekannt"
        : createdDate.toLocaleString("de-DE");
    const lines = [
        getGameEventTypeLabel(event.type),
        "",
        event.message,
        "",
        `Zeitpunkt: ${dateText}`,
        `Betroffene Karten: ${getGameEventTargetNames(event)}`
    ];

    if (Number.isFinite(event.amount)) {
        lines.push(`Wert: ${event.amount}`);
    }
    if (typeof event.condition === "string" && event.condition !== "") {
        lines.push(`Condition: ${event.condition}`);
    }

    const changeLines = createGameEventStateChangeLines(event);
    if (changeLines.length > 0) {
        lines.push("", "Änderung:", ...changeLines);
    }

    if (event.metadata?.undoneByEventId !== undefined) {
        lines.push("", "Status: Rückgängig gemacht");
    } else if (isGameEventUndoable(event)) {
        lines.push("", "Status: Kann rückgängig gemacht werden");
    } else {
        lines.push("", "Status: Nur zur Information");
    }

    return lines.join("\n");
}

function showGameEventDetails(eventId) {
    const event = getGameEventById(eventId);
    if (event === null) {
        alert("Das Ereignis wurde nicht gefunden.");
        return;
    }
    alert(createGameEventDetailsText(event));
}

function addCombatLogMessage(message, eventData = {}) {
    return recordGameEvent({
        ...eventData,
        message
    });
}

function getDmFeedTabButtonHtml(tabName, label) {
    const activeClass = uiState.activeDmFeedTab === tabName ? "active-feed-tab" : "";

    return `
        <button
            class="dm-feed-tab-button ${activeClass}"
            onclick="setActiveDmFeedTab('${tabName}')"
        >
            ${label}
        </button>
    `;
}

function getVisibleCombatLogMessages() {
    const visibleMessages = [];
    let hasShownBrowserSaveMessage = false;

    for (const logMessage of gameState.eventLog) {
        // Undo wird im Datenmodell als eigenes Ereignis behalten. In der kompakten
        // Chronik genügt aber die Markierung am ursprünglichen Eintrag.
        if (logMessage.type === "undo") {
            continue;
        }

        if (logMessage.text === "Browser-Zustand gespeichert.") {
            if (hasShownBrowserSaveMessage === true) {
                continue;
            }

            hasShownBrowserSaveMessage = true;
        }

        visibleMessages.push(logMessage);

        if (visibleMessages.length >= 8) {
            break;
        }
    }

    return visibleMessages;
}

function resetCombatLogInlineDetails(entryElement) {
    if (!(entryElement instanceof HTMLElement)) {
        return;
    }

    const detailsElement = entryElement.querySelector(".combat-log-inline-details");
    const detailsButton = entryElement.querySelector(".combat-log-details-toggle");

    if (detailsElement instanceof HTMLElement) {
        detailsElement.hidden = true;
    }
    if (detailsButton instanceof HTMLButtonElement) {
        detailsButton.setAttribute("aria-expanded", "false");
        detailsButton.textContent = "Details anzeigen";
    }
}

function closeCombatLogInlinePanelsExcept(keptEntryElement = null) {
    const openEntries = document.querySelectorAll(".combat-log-entry.combat-log-entry-expanded");

    for (const entryElement of openEntries) {
        if (keptEntryElement !== null && entryElement === keptEntryElement) {
            continue;
        }

        entryElement.classList.remove("combat-log-entry-expanded");
        const panelElement = entryElement.querySelector(".combat-log-inline-panel");
        const toggleButton = entryElement.querySelector(".combat-log-inline-toggle");

        if (panelElement instanceof HTMLElement) {
            panelElement.hidden = true;
        }
        if (toggleButton instanceof HTMLButtonElement) {
            toggleButton.setAttribute("aria-expanded", "false");
        }
        resetCombatLogInlineDetails(entryElement);
    }
}

function toggleCombatLogInlinePanel(eventId, buttonElement) {
    if (!(buttonElement instanceof HTMLButtonElement)) {
        return;
    }

    const entryElement = buttonElement.closest(".combat-log-entry");
    const panelElement = entryElement?.querySelector(".combat-log-inline-panel");

    if (!(entryElement instanceof HTMLElement) || !(panelElement instanceof HTMLElement)) {
        return;
    }

    const shouldOpen = entryElement.classList.contains("combat-log-entry-expanded") === false;
    closeCombatLogInlinePanelsExcept(shouldOpen ? entryElement : null);

    entryElement.classList.toggle("combat-log-entry-expanded", shouldOpen);
    panelElement.hidden = shouldOpen === false;
    buttonElement.setAttribute("aria-expanded", shouldOpen ? "true" : "false");

    // Das Drei-Punkte-Menü öffnet nur die Aktionen. Die ausführlichen
    // Ereignisdetails bleiben bis zu einem eigenen Klick geschlossen.
    resetCombatLogInlineDetails(entryElement);

    if (shouldOpen) {
        window.requestAnimationFrame(function() {
            entryElement.scrollIntoView({
                block: "nearest",
                inline: "nearest",
                behavior: "smooth"
            });
        });
    }
}

function toggleCombatLogEventDetails(buttonElement) {
    if (!(buttonElement instanceof HTMLButtonElement)) {
        return;
    }

    const entryElement = buttonElement.closest(".combat-log-entry");
    const detailsElement = entryElement?.querySelector(".combat-log-inline-details");

    if (!(entryElement instanceof HTMLElement) || !(detailsElement instanceof HTMLElement)) {
        return;
    }

    const shouldOpen = detailsElement.hidden === true;
    detailsElement.hidden = shouldOpen === false;
    buttonElement.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
    buttonElement.textContent = shouldOpen ? "Details ausblenden" : "Details anzeigen";

    if (shouldOpen) {
        window.requestAnimationFrame(function() {
            entryElement.scrollIntoView({
                block: "nearest",
                inline: "nearest",
                behavior: "smooth"
            });
        });
    }
}

function createGameEventDetailsHtml(event) {
    const createdDate = new Date(event.createdAt);
    const dateText = Number.isNaN(createdDate.getTime())
        ? "Unbekannt"
        : createdDate.toLocaleString("de-DE");
    const changeLines = createGameEventStateChangeLines(event);
    const statusText = event.metadata?.undoneByEventId !== undefined
        ? "Rückgängig gemacht"
        : isGameEventUndoable(event)
            ? "Kann rückgängig gemacht werden"
            : "Nur zur Information";

    const detailRows = [
        ["Ereignis", getGameEventTypeLabel(event.type)],
        ["Zeitpunkt", dateText],
        ["Betroffene Karten", getGameEventTargetNames(event)]
    ];

    if (Number.isFinite(event.amount)) {
        detailRows.push(["Wert", String(event.amount)]);
    }
    if (typeof event.condition === "string" && event.condition !== "") {
        detailRows.push(["Condition", event.condition]);
    }

    const rowsHtml = detailRows.map(([label, value]) => `
        <div class="combat-log-detail-row">
            <span>${escapeHtml(label)}</span>
            <strong>${escapeHtml(value)}</strong>
        </div>
    `).join("");
    const changesHtml = changeLines.length > 0
        ? `
            <div class="combat-log-detail-changes">
                <span>Änderung</span>
                ${changeLines.map(line => `<p>${escapeHtml(line)}</p>`).join("")}
            </div>
        `
        : "";

    return `
        <div class="combat-log-detail-summary">${escapeHtml(event.message)}</div>
        <div class="combat-log-detail-grid">${rowsHtml}</div>
        ${changesHtml}
        <div class="combat-log-detail-status">${escapeHtml(statusText)}</div>
    `;
}

function createCombatLogHtml() {
    const visibleMessages = getVisibleCombatLogMessages();

    if (visibleMessages.length === 0) {
        return `
            <div class="combat-log-list">
                <p class="combat-log-empty">
                    Noch keine Aktionen.
                </p>
            </div>
        `;
    }

    let html = "";
    const messagesInDisplayOrder = [...visibleMessages].reverse();

    for (const logMessage of messagesInDisplayOrder) {
        const wasUndone = logMessage.metadata?.undoneByEventId !== undefined;
        const undoable = isGameEventUndoable(logMessage);
        const statusHtml = wasUndone
            ? `<span class="combat-log-status">Rückgängig gemacht</span>`
            : "";
        const actionsHtml = undoable
            ? `<button type="button" onclick="undoGameEvent('${escapeHtml(logMessage.id)}')">Rückgängig</button>`
            : "";

        html += `
            <article class="combat-log-entry ${wasUndone ? "combat-log-entry-undone" : ""}" data-event-id="${escapeHtml(logMessage.id)}">
                <div class="combat-log-entry-main">
                    <span class="combat-log-time">${escapeHtml(logMessage.time)}</span>
                    <span class="combat-log-text">${escapeHtml(logMessage.text)}</span>
                    ${statusHtml}
                </div>
                <button
                    type="button"
                    class="combat-log-inline-toggle"
                    aria-label="Ereignisaktionen und Details öffnen"
                    aria-expanded="false"
                    title="Ereignisaktionen und Details"
                    onclick="toggleCombatLogInlinePanel('${escapeHtml(logMessage.id)}', this)"
                >⋯</button>
                <div class="combat-log-inline-panel" hidden>
                    <div class="combat-log-inline-actions">
                        ${actionsHtml}
                        <button
                            type="button"
                            class="combat-log-details-toggle"
                            aria-expanded="false"
                            onclick="toggleCombatLogEventDetails(this)"
                        >Details anzeigen</button>
                    </div>
                    <div class="combat-log-inline-details" hidden>
                        ${createGameEventDetailsHtml(logMessage)}
                    </div>
                </div>
            </article>
        `;
    }

    return `<div class="combat-log-list">${html}</div>`;
}

function createDmChatPlaceholderHtml() {
    return `
        <div class="dm-chat-placeholder">
            <div class="dm-chat-message dm-chat-message-player">
                <span class="dm-chat-speaker">Miriel</span>
                <p>Kann ich dem Wirt unauffällig ein Zeichen geben, ohne dass die Wachen es merken?</p>
            </div>

            <div class="dm-chat-message dm-chat-message-dm">
                <span class="dm-chat-speaker">DM</span>
                <p>Ja. Mach einen Sleight-of-Hand-Check gegen die passive Wahrnehmung der nächsten Wache.</p>
            </div>

            <div class="dm-chat-message dm-chat-message-player">
                <span class="dm-chat-speaker">Miriel</span>
                <p>Ich tue so, als würde ich nur meinen Hut richten, und lasse dabei die Münze aufblitzen.</p>
            </div>

            <div class="dm-chat-message dm-chat-message-dm">
                <span class="dm-chat-speaker">DM</span>
                <p>Der Wirt bemerkt es. Er nickt kaum sichtbar in Richtung Hinterzimmer.</p>
            </div>

            <div class="dm-chat-message dm-chat-message-player">
                <span class="dm-chat-speaker">Miriel</span>
                <p>Dann flüstere ich: „Wir brauchen zwei Minuten und keine Fragen.“</p>
            </div>

            <div class="dm-chat-message dm-chat-message-dm">
                <span class="dm-chat-speaker">DM</span>
                <p>Er schiebt dir wortlos einen Schlüssel zu. Die Wache schaut gerade zur Tür.</p>
            </div>
        </div>
    `;
}

function createUnifiedDmFeedHtml() {
    return `
        <div class="dm-console-window">
            <section class="dm-console-section dm-console-log-section">
                <div class="dm-console-section-title-row">
                    <p class="dm-console-section-title">Encounter Chronik</p>
                    <span>Letzte Ereignisse</span>
                </div>
                ${createCombatLogHtml()}
            </section>

            <section class="dm-console-section dm-console-chat-section">
                <div class="dm-console-section-title-row">
                    <p class="dm-console-section-title">Tischgeflüster</p>
                    <span>Preview</span>
                </div>
                ${createDmChatPlaceholderHtml()}
            </section>
        </div>
    `;
}

function createDmConsoleComposeHtml() {
    return `
        <div class="dm-console-compose-stack">
            <section class="dm-console-section dm-chat-input-shell" aria-label="Spätere DM-Chat-Eingabe">
                <div class="dm-console-section-title-row">
                    <p class="dm-console-section-title">Tischgeflüster Eingabe</p>
                    <span>Preview</span>
                </div>
                <div class="dm-chat-input-row">
                    <input
                        id="dm-chat-draft-input"
                        type="text"
                        value="Chat-Eingabe folgt"
                        disabled
                    >
                    <button type="button" disabled>Senden</button>
                </div>
            </section>
        </div>
    `;
}

function scrollDmChatToLatest() {
    window.requestAnimationFrame(function() {
        window.requestAnimationFrame(function() {
            const chatScrollElements = document.querySelectorAll("#dm-console-chat-content, #dm-console-chat-content .dm-chat-placeholder");
            chatScrollElements.forEach(function(element) {
                element.scrollTop = element.scrollHeight;
            });

            const latestChatMessages = document.querySelectorAll("#dm-console-chat-content .dm-chat-message:last-child");
            latestChatMessages.forEach(function(messageElement) {
                messageElement.scrollIntoView({ block: "end", inline: "nearest" });
            });

            chatScrollElements.forEach(function(element) {
                element.scrollTop = element.scrollHeight;
            });
        });
    });
}

function scrollCombatLogToLatest() {
    window.requestAnimationFrame(function() {
        window.requestAnimationFrame(function() {
            const logScrollElements = document.querySelectorAll("#dm-console-log-content, #dm-console-log-content .combat-log-list");
            logScrollElements.forEach(function(element) {
                element.scrollTop = element.scrollHeight;
            });

            const latestLogEntries = document.querySelectorAll("#dm-console-log-content .combat-log-entry:last-child");
            latestLogEntries.forEach(function(logElement) {
                logElement.scrollIntoView({ block: "end", inline: "nearest" });
            });

            logScrollElements.forEach(function(element) {
                element.scrollTop = element.scrollHeight;
            });
        });
    });
}

function renderDmFeedPanel() {
    const logContentElement = document.querySelector("#dm-console-log-content");
    const chatContentElement = document.querySelector("#dm-console-chat-content");
    const composeElement = document.querySelector("#dm-console-compose");


    if (logContentElement !== null) {
        logContentElement.innerHTML = createCombatLogHtml();
    }

    if (chatContentElement !== null) {
        chatContentElement.innerHTML = createDmChatPlaceholderHtml();
    }

    if (composeElement !== null) {
        composeElement.innerHTML = createDmConsoleComposeHtml();
    }

    scrollDmChatToLatest();
    scrollCombatLogToLatest();
}

function renderCombatLog() {
    renderDmFeedPanel();
}

function getValidatedGroupActionAmount() {
    const amount = getGroupActionAmount();

    if (Number.isFinite(amount) === false || amount < 0) {
        alert("Bitte gib einen gültigen Betrag ab 0 ein.");
        return null;
    }

    return Math.floor(amount);
}

function getSelectedTargetsOrWarn() {
    const selectedTargets = getSelectedHandCards();

    if (selectedTargets.length === 0) {
        alert("Bitte wähle zuerst mindestens eine Karte auf der Hand aus.");
        return [];
    }

    return selectedTargets;
}

function applyDamageToSelectedCards() {
    const selectedTargets = getSelectedTargetsOrWarn();

    if (selectedTargets.length === 0) {
        return;
    }

    const amount = getValidatedGroupActionAmount();

    if (amount === null) {
        return;
    }

    const before = selectedTargets.map(function(card) {
        return { cardId: card.id, hp: card.hp, tempHp: card.tempHp };
    });

    for (const card of selectedTargets) {
        applyDamage(card, amount);
    }

    const after = selectedTargets.map(function(card) {
        return { cardId: card.id, hp: card.hp, tempHp: card.tempHp };
    });

    recordGameEvent({
        type: "damage",
        targetCardIds: selectedTargets.map(card => card.id),
        amount,
        before,
        after,
        message: `${amount} Schaden auf ${createActionTargetLogText(selectedTargets)}.`
    });
    renderCardsPreservingViewport();
}

function applyHealingToSelectedCards() {
    const selectedTargets = getSelectedTargetsOrWarn();

    if (selectedTargets.length === 0) {
        return;
    }

    const amount = getValidatedGroupActionAmount();

    if (amount === null) {
        return;
    }

    const before = selectedTargets.map(function(card) {
        return { cardId: card.id, hp: card.hp, tempHp: card.tempHp };
    });

    for (const card of selectedTargets) {
        applyHealing(card, amount);
    }

    const after = selectedTargets.map(function(card) {
        return { cardId: card.id, hp: card.hp, tempHp: card.tempHp };
    });

    recordGameEvent({
        type: "healing",
        targetCardIds: selectedTargets.map(card => card.id),
        amount,
        before,
        after,
        message: `${amount} Heilung auf ${createActionTargetLogText(selectedTargets)}.`
    });
    renderCardsPreservingViewport();
}

function applyTempHpToSelectedCards() {
    const selectedTargets = getSelectedTargetsOrWarn();

    if (selectedTargets.length === 0) {
        return;
    }

    const amount = getValidatedGroupActionAmount();

    if (amount === null) {
        return;
    }

    const before = selectedTargets.map(function(card) {
        return { cardId: card.id, tempHp: card.tempHp };
    });

    for (const card of selectedTargets) {
        applyTempHp(card, amount);
    }

    const after = selectedTargets.map(function(card) {
        return { cardId: card.id, tempHp: card.tempHp };
    });

    recordGameEvent({
        type: "temporary_hp",
        targetCardIds: selectedTargets.map(card => card.id),
        amount,
        before,
        after,
        message: `${amount} Temp HP auf ${createActionTargetLogText(selectedTargets)} gesetzt.`
    });
    renderCardsPreservingViewport();
}

function addConditionToSelectedCards() {
    const selectedTargets = getSelectedTargetsOrWarn();

    if (selectedTargets.length === 0) {
        return;
    }

    const conditionName = getSelectedGroupCondition();

    if (conditionName === "") {
        alert("Bitte wähle eine Condition aus.");
        return;
    }

    const before = selectedTargets.map(card => ({ cardId: card.id, conditions: [...card.conditions] }));

    for (const card of selectedTargets) {
        if (cardHasCondition(card, conditionName) === false) {
            card.conditions.push(conditionName);
        }
    }

    recordGameEvent({
        type: "condition_added",
        targetCardIds: selectedTargets.map(card => card.id),
        condition: conditionName,
        before,
        after: selectedTargets.map(card => ({ cardId: card.id, conditions: [...card.conditions] })),
        message: `Condition ${conditionName} auf ${selectedTargets.length} Ziel(e) angewendet: ${createTargetNamesText(selectedTargets)}.`
    });
    renderCardsPreservingViewport();
}

function removeConditionFromSelectedCards() {
    const selectedTargets = getSelectedTargetsOrWarn();

    if (selectedTargets.length === 0) {
        return;
    }

    const conditionName = getSelectedGroupCondition();

    if (conditionName === "") {
        alert("Bitte wähle eine Condition aus.");
        return;
    }

    const before = selectedTargets.map(card => ({ cardId: card.id, conditions: [...card.conditions] }));

    for (const card of selectedTargets) {
        card.conditions = card.conditions.filter(function(condition) {
            return condition !== conditionName;
        });
    }

    recordGameEvent({
        type: "condition_removed",
        targetCardIds: selectedTargets.map(card => card.id),
        condition: conditionName,
        before,
        after: selectedTargets.map(card => ({ cardId: card.id, conditions: [...card.conditions] })),
        message: `Condition ${conditionName} von ${selectedTargets.length} Ziel(e) entfernt: ${createTargetNamesText(selectedTargets)}.`
    });
    renderCardsPreservingViewport();
}

function getHpPercent(card) {
    const rawPercent = Math.round((card.hp / card.maxHp) * 100);

    if (rawPercent < 0) {
        return 0;
    }

    if (rawPercent > 100) {
        return 100;
    }

    return rawPercent;
}

function getTempHpPercent(card) {
    if (card.maxHp <= 0) {
        return 0;
    }

    const rawPercent = Math.round((card.tempHp / card.maxHp) * 100);

    if (rawPercent < 0) {
        return 0;
    }

    if (rawPercent > 100) {
        return 100;
    }

    return rawPercent;
}

function getHpDescription(card) {
    const hpPercent = getHpPercent(card);

    if (card.hp === 0) {
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

function getHpVisibilityLabel(card) {
    if (card.hpVisibility === "full") {
        return "volle HP";
    }

    if (card.hpVisibility === "bar") {
        return "Balken";
    }

    if (card.hpVisibility === "descriptive") {
        return "Zustandsschleier";
    }

    if (card.hpVisibility === "hidden") {
        return "verborgen";
    }

    return "unbekannt";
}

function getHealthStateLabel(state) {
    if (state === "stable") {
        return "stabil";
    }

    if (state === "bruised") {
        return "angeschlagen";
    }

    if (state === "wounded") {
        return "verletzt";
    }

    if (state === "severe") {
        return "schwer verletzt";
    }

    if (state === "critical") {
        return "kritisch";
    }

    if (state === "down") {
        return "außer Gefecht";
    }

    if (state === "hidden") {
        return "verborgen";
    }

    return "unbekannt";
}

function getPublicVisibilitySummary(card) {
    const healthPresentation = getHealthPresentation(card, true);
    return `${getHpVisibilityLabel(card)} · ${getHealthStateLabel(healthPresentation.state)}`;
}


// ============================================================
// 8. Conditions und benutzerdefinierte Effekte
// ============================================================

function createEffectId() {
    return createUniqueId();
}

function getEffectDurationLabel(effect) {
    if (effect.durationMode === effectDurationModes.rounds) {
        return `${getSafePositiveInteger(effect.remainingRounds, 1)} Runde(n)`;
    }
    if (effect.durationMode === effectDurationModes.turnStart) {
        return "bis zum Beginn des festgelegten Zuges";
    }
    if (effect.durationMode === effectDurationModes.turnEnd) {
        return "bis zum Ende des festgelegten Zuges";
    }
    if (effect.durationMode === effectDurationModes.encounterEnd) {
        return "bis Encounter-Ende";
    }
    if (effect.durationMode === effectDurationModes.freeText) {
        return getSafeOptionalString(effect.endCondition) || "freie Endbedingung";
    }
    return "manuell";
}

function getSafeEffectDurationMode(value) {
    return Object.values(effectDurationModes).includes(value) ? value : effectDurationModes.manual;
}

function getSafeEffectVisibility(value) {
    return Object.values(effectVisibilityModes).includes(value) ? value : effectVisibilityModes.public;
}

function getSafeEffectColorKey(value) {
    return availableConditions.includes(value) ? value : "magical-effect";
}

function getSafeEffects(value) {
    if (Array.isArray(value) === false) return [];
    const safeEffects = [];
    for (const rawEffect of value) {
        if (rawEffect === null || typeof rawEffect !== "object") continue;
        const name = getSafeOptionalString(rawEffect.name).trim();
        if (name === "") continue;
        const durationMode = getSafeEffectDurationMode(rawEffect.durationMode);
        safeEffects.push({
            id: getSafeOptionalString(rawEffect.id) || createEffectId(),
            kind: "custom",
            name: name.slice(0, 80),
            sourceCardId: rawEffect.sourceCardId ?? null,
            durationMode,
            remainingRounds: durationMode === effectDurationModes.rounds ? getSafePositiveInteger(rawEffect.remainingRounds, 1) : null,
            triggerCardId: rawEffect.triggerCardId ?? null,
            endCondition: getSafeOptionalString(rawEffect.endCondition).slice(0, 240),
            visibility: getSafeEffectVisibility(rawEffect.visibility),
            colorKey: getSafeEffectColorKey(rawEffect.colorKey),
            value: getSafeOptionalString(rawEffect.value).slice(0, 80),
            note: getSafeOptionalString(rawEffect.note).slice(0, 500),
            createdAt: getSafeOptionalString(rawEffect.createdAt) || new Date().toISOString()
        });
    }
    return safeEffects;
}

function createEffectChipHtml(effect, cardId, isPublic = false) {
    const duration = getEffectDurationLabel(effect);
    const colorClassName = getConditionClassName(getSafeEffectColorKey(effect.colorKey));
    const removeButton = isPublic ? "" : `<button class="effect-chip-remove" type="button" title="Effekt entfernen" aria-label="${escapeHtml(effect.name)} entfernen" onclick="event.stopPropagation(); removeCustomEffectFromCard(${JSON.stringify(cardId)}, '${escapeHtml(effect.id)}')">×</button>`;
    const tooltipParts = [duration, effect.note].filter(Boolean);
    return `<span class="condition-chip custom-effect-chip ${colorClassName}" title="${escapeHtml(tooltipParts.join(" · "))}"><span class="condition-chip-name">${escapeHtml(effect.name)}</span>${removeButton}</span>`;
}

function createEffectChipsHtml(card, isPublic = false) {
    const effects = Array.isArray(card.effects) ? card.effects : [];
    const visibleEffects = isPublic
        ? effects.filter(function(effect) {
            return getSafeEffectVisibility(effect.visibility) === effectVisibilityModes.public;
        })
        : effects;
    return visibleEffects.map(effect => createEffectChipHtml(effect, card.id, isPublic)).join("");
}

function getSelectedCustomEffectDurationMode() {
    return document.querySelector("#custom-effect-duration")?.value || effectDurationModes.manual;
}

function updateCustomEffectDurationFields() {
    const mode = getSelectedCustomEffectDurationMode();
    const rounds = document.querySelector("#custom-effect-rounds-field");
    const freeText = document.querySelector("#custom-effect-end-condition-field");
    if (rounds) rounds.hidden = mode !== effectDurationModes.rounds;
    if (freeText) freeText.hidden = mode !== effectDurationModes.freeText;
}

function addCustomEffectToSelectedCards() {
    const targets = getSelectedTargetsOrWarn();
    if (targets.length === 0) return;
    const nameInput = document.querySelector("#custom-effect-name");
    const name = nameInput?.value.trim() || "";
    if (name === "") { alert("Bitte gib einen Namen für den Effekt ein."); return; }
    const durationMode = getSelectedCustomEffectDurationMode();
    const currentTurnCardId = gameState.encounter.currentTurnCardId;
    const rounds = getSafePositiveInteger(document.querySelector("#custom-effect-rounds")?.value, 1);
    const endCondition = document.querySelector("#custom-effect-end-condition")?.value.trim() || "";
    const visibility = getSafeEffectVisibility(document.querySelector("#custom-effect-visibility")?.value);
    const colorKey = getSafeEffectColorKey(document.querySelector("#custom-effect-color")?.value);
    const note = document.querySelector("#custom-effect-note")?.value.trim() || "";
    const before = targets.map(card => ({ cardId: card.id, effects: structuredClone(card.effects || []) }));
    for (const card of targets) {
        card.effects ??= [];
        card.effects.push({
            id: createEffectId(), kind: "custom", name,
            sourceCardId: uiState.focusedCardId,
            durationMode,
            remainingRounds: durationMode === effectDurationModes.rounds ? rounds : null,
            triggerCardId: (durationMode === effectDurationModes.turnStart || durationMode === effectDurationModes.turnEnd) ? currentTurnCardId : null,
            endCondition: durationMode === effectDurationModes.freeText ? endCondition : "",
            visibility, colorKey, value: "", note,
            createdAt: new Date().toISOString()
        });
        card.updatedAt = new Date().toISOString();
    }
    recordGameEvent({
        type: "effect_added",
        targetCardIds: targets.map(card => card.id),
        before,
        after: targets.map(card => ({ cardId: card.id, effects: structuredClone(card.effects) })),
        metadata: { effectName: name, durationMode, colorKey },
        message: `Effekt „${name}“ auf ${targets.length} Ziel(e) angewendet: ${createTargetNamesText(targets)}.`
    });
    if (nameInput) nameInput.value = "";
    saveAndBroadcastAppState();
    renderCardsPreservingViewport();
}

function removeCustomEffectFromCard(cardId, effectId, reason = "manual") {
    const card = findCardById(cardId);
    if (!card || !Array.isArray(card.effects)) return;
    const effect = card.effects.find(item => item.id === effectId);
    if (!effect) return;
    const before = [{ cardId: card.id, effects: structuredClone(card.effects) }];
    card.effects = card.effects.filter(item => item.id !== effectId);
    card.updatedAt = new Date().toISOString();
    recordGameEvent({
        type: reason === "expired" ? "effect_expired" : "effect_removed",
        targetCardId: card.id,
        before,
        after: [{ cardId: card.id, effects: structuredClone(card.effects) }],
        metadata: { effectName: effect.name, reason },
        message: reason === "expired" ? `Effekt „${effect.name}“ auf ${card.name} ist abgelaufen.` : `Effekt „${effect.name}“ von ${card.name} entfernt.`
    });
    if (reason !== "batch") renderCardsPreservingViewport();
}

function expireEffectsForTrigger(trigger, triggerCardId = null) {
    const expired = [];
    for (const card of getHandCards()) {
        for (const effect of [...(card.effects || [])]) {
            let shouldExpire = false;
            if (trigger === "round") {
                if (effect.durationMode === effectDurationModes.rounds) {
                    effect.remainingRounds = getSafePositiveInteger(effect.remainingRounds, 1) - 1;
                    shouldExpire = effect.remainingRounds <= 0;
                }
            } else if (trigger === "turn_start") {
                shouldExpire = effect.durationMode === effectDurationModes.turnStart && effect.triggerCardId === triggerCardId;
            } else if (trigger === "turn_end") {
                shouldExpire = effect.durationMode === effectDurationModes.turnEnd && effect.triggerCardId === triggerCardId;
            } else if (trigger === "encounter_end") {
                shouldExpire = effect.durationMode === effectDurationModes.encounterEnd;
            }
            if (shouldExpire) expired.push({ cardId: card.id, effectId: effect.id });
        }
    }
    for (const item of expired) removeCustomEffectFromCard(item.cardId, item.effectId, "expired");
}



function getConditionLabel(conditionName) {
    const conditionLabels = {
        "blessed": "Blessed",
        "blinded": "Blinded",
        "charmed": "Charmed",
        "concentrating": "Concentrating",
        "cursed": "Cursed",
        "deafened": "Deafened",
        "enlarged": "Enlarged",
        "exhausted": "Exhausted",
        "frightened": "Frightened",
        "grappled": "Grappled",
        "hasted": "Hasted",
        "hexed": "Hexed",
        "hunters-mark": "Hunter's Mark",
        "incapacitated": "Incapacitated",
        "invisible": "Invisible",
        "magical-effect": "Magical Effect",
        "paralyzed": "Paralyzed",
        "petrified": "Petrified",
        "physical-effect": "Physical Effect",
        "poisoned": "Poisoned",
        "prone": "Prone",
        "raging": "Raging",
        "restrained": "Restrained",
        "stunned": "Stunned",
        "unconscious": "Unconscious"
    };

    if (conditionLabels[conditionName] !== undefined) {
        return conditionLabels[conditionName];
    }

    return conditionName;
}

function createConditionOptionsHtml() {
    let html = "";

    for (const condition of availableConditions) {
        html += `
            <option value="${condition}">
                ${getConditionLabel(condition)}
            </option>
        `;
    }

    return html;
}

function createConditionCheckboxesHtml(checkboxClassName) {
    let html = "";

    for (const condition of availableConditions) {
        html += `
            <label class="condition-checkbox-field ${getConditionClassName(condition)}">
                <input
                    class="${checkboxClassName}"
                    type="checkbox"
                    value="${condition}"
                >
                <span>${getConditionLabel(condition)}</span>
            </label>
        `;
    }

    return html;
}

function createEditConditionCheckboxesHtml() {
    return createConditionCheckboxesHtml("edit-condition-checkbox");
}

function createNewConditionCheckboxesHtml() {
    return createConditionCheckboxesHtml("new-condition-checkbox");
}

function renderEditConditionCheckboxes() {
    const conditionListElement = document.querySelector("#edit-card-condition-list");

    if (conditionListElement === null) {
        return;
    }

    conditionListElement.innerHTML = createEditConditionCheckboxesHtml();
}

function renderNewConditionCheckboxes() {
    const conditionListElement = document.querySelector("#new-card-condition-list");

    if (conditionListElement === null) {
        return;
    }

    conditionListElement.innerHTML = createNewConditionCheckboxesHtml();
}

function clearNewConditionCheckboxes() {
    const checkboxElements = document.querySelectorAll(".new-condition-checkbox");

    for (const checkboxElement of checkboxElements) {
        checkboxElement.checked = false;
    }
}

function setEditConditionCheckboxes(card) {
    const checkboxElements = document.querySelectorAll(".edit-condition-checkbox");
    const conditionValues = Array.isArray(card.conditions) ? card.conditions : [];

    for (const checkboxElement of checkboxElements) {
        checkboxElement.checked = conditionValues.includes(checkboxElement.value);
    }
}

function getConditionValuesFromCheckboxes(selector) {
    const selectedConditions = [];
    const checkboxElements = document.querySelectorAll(selector);

    for (const checkboxElement of checkboxElements) {
        if (checkboxElement.checked === true) {
            selectedConditions.push(checkboxElement.value);
        }
    }

    return selectedConditions;
}

function getEditConditionValues() {
    return getConditionValuesFromCheckboxes(".edit-condition-checkbox");
}

function getNewConditionValues() {
    return getConditionValuesFromCheckboxes(".new-condition-checkbox");
}

function getSelectedCondition(cardId) {
    const selectElement = document.querySelector(`#condition-select-${cardId}`);

    if (selectElement === null) {
        return "";
    }

    return selectElement.value;
}

function cardHasCondition(card, conditionName) {
    return card.conditions.includes(conditionName);
}

function addConditionToCard(cardId) {
    const card = findCardById(cardId);

    if (card === null) {
        return;
    }

    const conditionName = getSelectedCondition(cardId);

    if (conditionName === "") {
        return;
    }

    if (cardHasCondition(card, conditionName)) {
        return;
    }

    card.conditions.push(conditionName);

    renderCards();
}

function removeConditionFromCard(cardId, conditionName) {
    const card = findCardById(cardId);

    if (card === null) {
        return;
    }

    card.conditions = card.conditions.filter(function(condition) {
        return condition !== conditionName;
    });

    renderCards();
}

function getCanonicalConditionName(conditionName) {
    if (conditionName === "hunter's mark" || conditionName === "hunters mark") {
        return "hunters-mark";
    }

    if (conditionName === "magical effect") {
        return "magical-effect";
    }

    if (conditionName === "physical effect") {
        return "physical-effect";
    }

    return conditionName;
}

function getConditionClassName(conditionName) {
    const canonicalConditionName = getCanonicalConditionName(conditionName.toLowerCase().trim());

    return `condition-${canonicalConditionName.replace(/[^a-z0-9-]/g, "-")}`;
}

// ============================================================
// 9. Bilder lokal einlesen
// ============================================================


async function handleMirielBoardManualImageInput(event) {
    const inputElement = event.target;

    if (inputElement === null || inputElement.files === null || inputElement.files.length === 0) {
        return;
    }

    const imageFile = inputElement.files[0];

    if (imageFile.type.startsWith("image/") === false) {
        alert("Bitte wähle eine Bilddatei aus.");
        inputElement.value = "";
        return;
    }

    const previousImageData = gameState.presentation.mirielBoard.manualImageData;
    const previousImageName = gameState.presentation.mirielBoard.manualImageName;

    try {
        gameState.presentation.mirielBoard.manualImageData = await readAndOptimizeImageFileAsDataUrl(imageFile);
        gameState.presentation.mirielBoard.manualImageName = imageFile.name || "Eigene Schautafel";
        renderMirielBoardManualPreview();
        updateMirielBoardControls();
        addCombatLogMessage(`Bild für Miriels Schautafel vorbereitet: ${gameState.presentation.mirielBoard.manualImageName}.`);
        saveAndBroadcastAppState();
        renderCards();
    } catch (error) {
        gameState.presentation.mirielBoard.manualImageData = previousImageData;
        gameState.presentation.mirielBoard.manualImageName = previousImageName;

        if (error instanceof DOMException && error.name === "QuotaExceededError") {
            alert("Das Bild ist zu groß für den Browser-Speicher. Bitte wähle ein kleineres Bild.");
        } else if (error !== null && typeof error === "object" && error.message === "storage-quota") {
            alert("Das Bild ist zu groß für den Browser-Speicher. Bitte wähle ein kleineres Bild.");
        } else {
            alert("Das Bild konnte nicht gelesen werden.");
        }

        renderMirielBoardManualPreview();
        updateMirielBoardControls();
    } finally {
        inputElement.value = "";
    }
}

function clearMirielBoardManualImage() {
    gameState.presentation.mirielBoard.manualImageData = "";
    gameState.presentation.mirielBoard.manualImageName = "";

    ensureMirielBoardPersistentModeIsValid();

    saveAndBroadcastAppState();
    renderCards();
}

function setMirielBoardManualText(value) {
    gameState.presentation.mirielBoard.manualText = typeof value === "string" ? value.slice(0, 700) : "";
    ensureMirielBoardPersistentModeIsValid();
    renderMirielBoardManualPreview();
    updateMirielBoardControls();

    try {
        saveAndBroadcastAppState();
    } catch (error) {
        console.error("Miriels Schautafel konnte nicht gespeichert werden.", error);
        updateStorageStatus("Browser-Speicher: Schautafel konnte nicht gespeichert werden");
    }
}

function setMirielBoardManualTextSize(size) {
    gameState.presentation.mirielBoard.manualTextSize = getSafeMirielBoardManualTextSize(size);
    renderMirielBoardManualPreview();
    updateMirielBoardControls();
    saveAndBroadcastAppState();
    renderCards();
}

function setMirielBoardManualTextPosition(position) {
    gameState.presentation.mirielBoard.manualTextPosition = getSafeMirielBoardManualTextPosition(position);
    renderMirielBoardManualPreview();
    updateMirielBoardControls();
    saveAndBroadcastAppState();
    renderCards();
}

function clearMirielBoardManualText() {
    gameState.presentation.mirielBoard.manualText = "";

    ensureMirielBoardPersistentModeIsValid();

    saveAndBroadcastAppState();
    renderCards();
}

function readImageFileAsDataUrl(file) {
    return new Promise(function(resolve, reject) {
        const reader = new FileReader();

        reader.addEventListener("load", function() {
            resolve(reader.result);
        });

        reader.addEventListener("error", function() {
            reject(new Error("Das Bild konnte nicht gelesen werden."));
        });

        reader.readAsDataURL(file);
    });
}

function loadImageFromDataUrl(dataUrl) {
    return new Promise(function(resolve, reject) {
        const imageElement = new Image();

        imageElement.addEventListener("load", function() {
            resolve(imageElement);
        });

        imageElement.addEventListener("error", function() {
            reject(new Error("Das Bild konnte nicht geladen werden."));
        });

        imageElement.src = dataUrl;
    });
}

async function readAndOptimizeImageFileAsDataUrl(file) {
    const originalDataUrl = await readImageFileAsDataUrl(file);
    const imageElement = await loadImageFromDataUrl(originalDataUrl);
    const maxWidth = 1920;
    const maxHeight = 1080;
    const originalWidth = Math.max(1, imageElement.naturalWidth || imageElement.width || 1);
    const originalHeight = Math.max(1, imageElement.naturalHeight || imageElement.height || 1);
    const scale = Math.min(1, maxWidth / originalWidth, maxHeight / originalHeight);
    const targetWidth = Math.max(1, Math.round(originalWidth * scale));
    const targetHeight = Math.max(1, Math.round(originalHeight * scale));
    const canvasElement = document.createElement("canvas");
    const canvasContext = canvasElement.getContext("2d");

    if (canvasContext === null) {
        return originalDataUrl;
    }

    canvasElement.width = targetWidth;
    canvasElement.height = targetHeight;
    canvasContext.fillStyle = "#07060b";
    canvasContext.fillRect(0, 0, targetWidth, targetHeight);
    canvasContext.drawImage(imageElement, 0, 0, targetWidth, targetHeight);

    try {
        return canvasElement.toDataURL("image/jpeg", 0.84);
    } catch (error) {
        return originalDataUrl;
    }
}

// ============================================================
// 10. Spielstand exportieren und importieren
// ============================================================

function createGameStateExportData() {
    return {
        formatName: MirielsGameStateSchema.formatName,
        schemaVersion: MirielsGameStateSchema.supportedSchemaVersion,
        exportedAt: new Date().toISOString(),
        metadata: {
            appVersion: appVersion,
            operatingMode: appOperatingMode,
            licenseNotice: "Enthält bearbeitetes Material aus dem SRD 5.1 unter CC BY 4.0.",
            legalDocument: "legal.html"
        },
        gameState: createCurrentGameState()
    };
}

function createExportTimestampText() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}-${hours}-${minutes}`;
}

function createSafeFileNameSegment(rawName) {
    const fallbackName = "unbenannter-spielstand";
    const normalizedName = getSafeOptionalString(rawName)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/ä/g, "ae")
        .replace(/ö/g, "oe")
        .replace(/ü/g, "ue")
        .replace(/ß/g, "ss")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/-{2,}/g, "-");

    return normalizedName || fallbackName;
}

function gameStateNameNeedsFileNameWarning(rawName) {
    return /[^a-zA-Z0-9äöüÄÖÜß _.-]/.test(getSafeOptionalString(rawName));
}

function createExportFileName(nameForExport = gameState.name) {
    const safeNameSegment = createSafeFileNameSegment(nameForExport);
    return `miriels-deck-spielstand-${safeNameSegment}-${createExportTimestampText()}.json`;
}

function downloadTextFile(fileName, textContent, mimeType = "application/json") {
    const fileBlob = new Blob([textContent], {
        type: mimeType
    });

    const temporaryUrl = URL.createObjectURL(fileBlob);

    const downloadLink = document.createElement("a");
    downloadLink.href = temporaryUrl;
    downloadLink.download = fileName;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    URL.revokeObjectURL(temporaryUrl);
}

function exportGameState() {
    const proposedName = getSafeEncounterName(gameState.name);
    const inputName = prompt(
        "Spielstand vor dem Export benennen.\nSonderzeichen werden im Dateinamen automatisch vereinfacht.",
        proposedName
    );

    if (inputName === null) {
        return;
    }

    const safeName = getSafeEncounterName(inputName);

    if (gameStateNameNeedsFileNameWarning(safeName) === true) {
        alert("Der Dateiname wird vereinfacht, weil einige Sonderzeichen auf Dateisystemen problematisch sein können.");
    }

    setEncounterName(safeName, { silent: true });

    const exportData = createGameStateExportData();
    const jsonText = JSON.stringify(exportData, null, 4);
    const fileName = createExportFileName(safeName);

    downloadTextFile(fileName, jsonText);
}

function triggerGameStateImport() {
    const mayImport = confirm("Importiere nur Inhalte, die du rechtmäßig verwenden darfst. Importierte Texte und Bilder werden vom Projekt nicht geprüft oder lizenziert. Fortfahren?");

    if (mayImport !== true) {
        return;
    }

    const fileInputElement = document.querySelector("#game-state-import-file");

    if (fileInputElement === null) {
        alert("Das Import-Dateifeld wurde nicht gefunden.");
        return;
    }

    fileInputElement.value = "";
    fileInputElement.click();
}

function readTextFile(file) {
    return new Promise(function(resolve, reject) {
        const reader = new FileReader();

        reader.addEventListener("load", function() {
            resolve(reader.result);
        });

        reader.addEventListener("error", function() {
            reject(new Error("Die Datei konnte nicht gelesen werden."));
        });

        reader.readAsText(file);
    });
}

async function handleGameStateImportFileChange(event) {
    const fileInputElement = event.target;

    if (fileInputElement.files.length === 0) {
        return;
    }

    const importFile = fileInputElement.files[0];

    if (importFile.size > importSecurityLimits.maxFileBytesWithEmbeddedImages) {
        alert("Die Importdatei ist zu groß. Erlaubt sind höchstens 100 MB bei Exporten mit eingebetteten Bildern.");
        fileInputElement.value = "";
        return;
    }

    try {
        const fileText = await readTextFile(importFile);
        const containsEmbeddedImages = /data:image\/(?:png|jpe?g|webp);base64,/i.test(fileText);
        const applicableFileLimit = containsEmbeddedImages
            ? importSecurityLimits.maxFileBytesWithEmbeddedImages
            : importSecurityLimits.maxFileBytesWithoutEmbeddedImages;

        if (importFile.size > applicableFileLimit) {
            const limitLabel = containsEmbeddedImages ? "100 MB" : "20 MB";
            alert(`Die Importdatei ist zu groß. Für diesen Exporttyp sind höchstens ${limitLabel} erlaubt.`);
            fileInputElement.value = "";
            return;
        }

        const preparationResult = MirielsGameStateSchema.parseAndPrepareImport(fileText, importSecurityLimits);

        if (preparationResult.valid !== true) {
            const errorPath = preparationResult.error.path ? ` (${preparationResult.error.path})` : "";
            alert(`Die Datei konnte nicht importiert werden: ${preparationResult.error.message}${errorPath}`);
            return;
        }

        showGameStateImportPreview(preparationResult.gameState, importFile.name);
    } catch (error) {
        console.error("Spielstand-Import fehlgeschlagen.", error);
        alert("Die Spielstand-Datei konnte nicht importiert werden.");
    }
}

function showGameStateImportPreview(gameStateData, fileName) {
    pendingDeckImportData = gameStateData;
    pendingDeckImportFileName = getSafeOptionalString(fileName) || "Importdatei";

    openDmActionDrawer("archive");

    const previewElement = document.querySelector("#deck-import-preview");
    const fileNameElement = document.querySelector("#deck-import-preview-file");
    const nameElement = document.querySelector("#deck-import-preview-name");
    const summaryElement = document.querySelector("#deck-import-preview-summary");

    if (previewElement === null || fileNameElement === null || summaryElement === null) {
        importGameStateData(gameStateData);
        return;
    }

    const importCount = Array.isArray(gameStateData.cards) ? gameStateData.cards.length : 0;
    const currentDeckCount = getDeckCards().length;
    const currentTotalCount = gameState.cards.length;
    const importedGameStateName = getSafeEncounterName(gameStateData.name || gameStateData.encounterName || gameStateData.deckName);

    fileNameElement.textContent = `Datei: ${pendingDeckImportFileName}`;

    if (nameElement !== null) {
        nameElement.textContent = `Spielstand: ${importedGameStateName}`;
    }

    summaryElement.textContent = `${importCount} Karte(n) gefunden. Aktuell: ${currentDeckCount} Karten im Deck, ${currentTotalCount} Karten insgesamt.`;

    previewElement.classList.remove("deck-import-preview-hidden");
}

function closeDeckImportPreview() {
    pendingDeckImportData = null;
    pendingDeckImportFileName = "";

    const previewElement = document.querySelector("#deck-import-preview");

    if (previewElement !== null) {
        previewElement.classList.add("deck-import-preview-hidden");
    }
}

function confirmDeckImportReplace() {
    if (pendingDeckImportData === null) {
        closeDeckImportPreview();
        return;
    }

    const importData = pendingDeckImportData;
    closeDeckImportPreview();
    importGameStateData(importData);
}

function confirmDeckImportAppend() {
    if (pendingDeckImportData === null || Array.isArray(pendingDeckImportData.cards) === false) {
        closeDeckImportPreview();
        return;
    }

    const importedCards = createImportedCardsForDeckAppend(pendingDeckImportData.cards);
    const importCount = importedCards.length;

    for (const importedCard of importedCards) {
        gameState.cards.push(importedCard);
    }

    addCombatLogMessage(`${importCount} Karte(n) aus ${pendingDeckImportFileName} zum Deck hinzugefügt. Laufender Spielstand bleibt erhalten.`);
    closeDeckImportPreview();

    preserveViewportWhileRendering(function() {
        renderCards();
    });
}

function createImportedCardsForDeckAppend(rawCards) {
    const importedCards = [];
    const usedIds = gameState.cards.map(function(card) {
        return card.id;
    });

    for (const rawCard of rawCards) {
        if (rawCard !== null && typeof rawCard === "object") {
            const importedCard = createImportedCard(rawCard, usedIds);

            importedCard.isInCombat = false;
            importedCard.isSelected = false;
            importedCards.push(importedCard);
            usedIds.push(importedCard.id);
        }
    }

    return importedCards;
}

function importGameStateData(gameStateData) {
    const validationResult = MirielsGameStateSchema.validateGameStateData(gameStateData, importSecurityLimits);

    if (validationResult.valid !== true) {
        const errorPath = validationResult.error.path ? ` (${validationResult.error.path})` : "";
        alert(`Die Datei enthält keinen gültigen Spielstand: ${validationResult.error.message}${errorPath}`);
        return;
    }

    const normalizedGameState = MirielsGameStateSchema.normalizeGameStateData(gameStateData);

    // Ein vollständiger Import ersetzt den laufenden Spielstand. Die Demo darf
    // danach auch bei einem absichtlich leeren Import nicht automatisch zurückkehren.
    setDemoCardsAutoloadEnabled(false);
    applyGameStateData(normalizedGameState);
    applyUiStateData({});
    renderCards();
}

function validateGameStateImport(importData) {
    const validationResult = MirielsGameStateSchema.validateEnvelope(importData, importSecurityLimits);

    if (validationResult.valid === true) {
        return { valid: true, gameState: validationResult.gameState };
    }

    return {
        valid: false,
        message: validationResult.error.message,
        path: validationResult.error.path,
        code: validationResult.error.code
    };
}

function getGameStateDataFromImport(importData) {
    const validationResult = validateGameStateImport(importData);
    return validationResult.valid === true ? validationResult.gameState : null;
}

function createImportedCards(rawCards) {
    const importedCards = [];
    const usedIds = [];

    for (const rawCard of rawCards) {
        if (rawCard !== null && typeof rawCard === "object") {
            const importedCard = createImportedCard(rawCard, usedIds);

            importedCards.push(importedCard);
            usedIds.push(importedCard.id);
        }
    }

    return importedCards.map(normalizeCardModel);
}

function createImportedCard(rawCard, usedIds) {
    const id = createImportedCardId(rawCard.id, usedIds);

    const maxHp = getSafePositiveInteger(rawCard.maxHp, 1);
    const hp = clampNumber(
        getSafeNonNegativeInteger(rawCard.hp, maxHp),
        0,
        maxHp
    );

    return {
        id: id,
        name: getSafeString(rawCard.name, `Karte ${id}`, importSecurityLimits.maxShortTextLength),
        publicName: getSafeString(rawCard.publicName, `Karte ${id}`, importSecurityLimits.maxShortTextLength),
        cardKind: Object.values(cardKinds).includes(rawCard.cardKind) ? rawCard.cardKind : cardKinds.character,
        characterRole: getSafeCardType(rawCard.characterRole || rawCard.type),
        type: getSafeCardType(rawCard.characterRole || rawCard.type),
        initiative: getSafeInteger(rawCard.initiative, 0),
        initiativeModifier: getSafeOptionalString(rawCard.initiativeModifier) || getSafeOptionalString(rawCard.dexterityModifier) || "+0",
        hp: hp,
        maxHp: maxHp,
        tempHp: getSafeNonNegativeInteger(rawCard.tempHp, 0),
        armorClass: getSafeNonNegativeInteger(rawCard.armorClass, 10),
        passivePerception: getSafeNonNegativeInteger(rawCard.passivePerception, 10),
        passiveInsight: getSafeNonNegativeInteger(rawCard.passiveInsight, 10),
        passiveInvestigation: getSafeNonNegativeInteger(rawCard.passiveInvestigation, 10),
        strengthScore: getSafeNonNegativeInteger(rawCard.strengthScore, 10),
        strengthModifier: getSafeOptionalString(rawCard.strengthModifier) || "+0",
        dexterityScore: getSafeNonNegativeInteger(rawCard.dexterityScore, 10),
        dexterityModifier: getSafeOptionalString(rawCard.dexterityModifier) || "+0",
        constitutionScore: getSafeNonNegativeInteger(rawCard.constitutionScore, 10),
        constitutionModifier: getSafeOptionalString(rawCard.constitutionModifier) || "+0",
        intelligenceScore: getSafeNonNegativeInteger(rawCard.intelligenceScore, 10),
        intelligenceModifier: getSafeOptionalString(rawCard.intelligenceModifier) || "+0",
        wisdomScore: getSafeNonNegativeInteger(rawCard.wisdomScore, 10),
        wisdomModifier: getSafeOptionalString(rawCard.wisdomModifier) || "+0",
        charismaScore: getSafeNonNegativeInteger(rawCard.charismaScore, 10),
        charismaModifier: getSafeOptionalString(rawCard.charismaModifier) || "+0",
        speed: getSafeOptionalString(rawCard.speed),
        savingThrows: getSafeOptionalString(rawCard.savingThrows),
        resistances: getSafeOptionalString(rawCard.resistances),
        immunities: getSafeOptionalString(rawCard.immunities),
        vulnerabilities: getSafeOptionalString(rawCard.vulnerabilities),
        senses: getSafeOptionalString(rawCard.senses),
        spellSaveDc: getSafeOptionalString(rawCard.spellSaveDc),
        specialResources: getSafeOptionalString(rawCard.specialResources),
        traits: getSafeCardTraits(rawCard.traits),
        actions: getSafeCardActions(rawCard.actions),
        notes: getSafeOptionalString(rawCard.notes, importSecurityLimits.maxLongTextLength),
        spellcasting: getSafeSpellcasting(rawCard.spellcasting, rawCard),
        currency: getSafeCurrency(rawCard.currency),
        inventoryCards: getSafeInventoryCards(rawCard.inventoryCards),
        inventoryList: getSafeInventoryList(rawCard.inventoryList),
        hpVisibility: getSafeHpVisibility(rawCard.hpVisibility),
        accessPolicy: getSafeCardAccessPolicy(rawCard.accessPolicy || {
            publicProfile: rawCard.publicProfile
        }),
        controllerParticipantId: getSafeOptionalString(rawCard.controllerParticipantId) || null,
        imageData: getSafeImageSource(rawCard.imageData),
        conditions: getSafeConditions(rawCard.conditions),
        effects: getSafeEffects(rawCard.effects),
        isDemoCard: rawCard.isDemoCard === true || isKnownDemoCardData(rawCard) === true,
        location: Object.values(cardLocations).includes(rawCard.location)
            ? rawCard.location
            : rawCard.isInCombat === true ? cardLocations.hand : cardLocations.deck,
        encounterStatus: rawCard.encounterStatus === encounterStatuses.eliminated
            ? encounterStatuses.eliminated
            : rawCard.isInitiativeActive === false ? encounterStatuses.eliminated : encounterStatuses.active,
        isInCombat: rawCard.location === cardLocations.hand || rawCard.isInCombat === true,
        isInitiativeActive: rawCard.encounterStatus !== encounterStatuses.eliminated && rawCard.isInitiativeActive !== false,
        isSelected: rawCard.isSelected === true,
        version: getSafePositiveInteger(rawCard.version, 1),
        createdAt: getSafeOptionalString(rawCard.createdAt) || new Date().toISOString(),
        updatedAt: getSafeOptionalString(rawCard.updatedAt) || getSafeOptionalString(rawCard.createdAt) || new Date().toISOString(),
        deletedAt: getSafeOptionalString(rawCard.deletedAt) || null
    };
}

function createImportedCardId(rawId, usedIds) {
    const numericId = Number(rawId);

    if (
        Number.isInteger(numericId) &&
        numericId > 0 &&
        usedIds.includes(numericId) === false
    ) {
        return numericId;
    }

    let nextId = 1;

    while (usedIds.includes(nextId)) {
        nextId = nextId + 1;
    }

    return nextId;
}

function isImportedPublicSelectionValid(importedSelectionId, importedCards) {
    if (importedSelectionId === null) {
        return false;
    }

    const numericSelectionId = Number(importedSelectionId);

    if (Number.isInteger(numericSelectionId) === false) {
        return false;
    }

    for (const card of importedCards) {
        if (card.id === numericSelectionId) {
            return true;
        }
    }

    return false;
}

function getSafeString(value, fallbackValue, maximumLength = importSecurityLimits.maxLongTextLength) {
    if (typeof value !== "string") {
        return fallbackValue;
    }

    const trimmedValue = value.trim().slice(0, maximumLength);

    if (trimmedValue === "") {
        return fallbackValue;
    }

    return trimmedValue;
}

function getSafeOptionalString(value, maximumLength = importSecurityLimits.maxLongTextLength) {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim().slice(0, maximumLength);
}

function getSafeImageSource(value) {
    const source = getSafeOptionalString(value, 4 * 1024 * 1024);

    if (source === "") {
        return "";
    }

    if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(source)) {
        return source;
    }

    if (/^blob:[a-z0-9.+-]+:/i.test(source)) {
        return source;
    }

    if (/^(Images|assets)\/[a-z0-9_./ -]+\.(png|jpe?g|webp|gif)$/i.test(source) && source.includes("..") === false) {
        return source;
    }

    return "";
}

function getTextAreaValue(elementId) {
    const textAreaElement = document.querySelector(`#${elementId}`);

    if (textAreaElement === null) {
        return "";
    }

    return textAreaElement.value.trim();
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
    return escapeHtml(value).replaceAll("`", "&#096;");
}

function createDetailTextHtml(value, emptyText) {
    const safeValue = getSafeOptionalString(value);

    if (safeValue === "") {
        return `<p class="detail-placeholder-text">${emptyText}</p>`;
    }

    return `<p class="detail-text-block">${escapeHtml(safeValue).replaceAll("\n", "<br>")}</p>`;
}

function createDetailNotesHtml(value, emptyText) {
    const safeValue = getSafeOptionalString(value).trim();

    if (safeValue === "") {
        return `<p class="detail-placeholder-text">${emptyText}</p>`;
    }

    const paragraphs = safeValue
        .split(/\n{2,}/)
        .map(function(paragraph) {
            return paragraph.trim();
        })
        .filter(Boolean);

    return paragraphs.map(function(paragraph) {
        const escapedParagraph = escapeHtml(paragraph).replaceAll("\n", "<br>");
        const headingMatch = paragraph.match(/^([^:\n]{2,46}):\s*(.+)$/s);

        if (headingMatch !== null) {
            const heading = escapeHtml(normalizeNoteTitle(headingMatch[1].trim()));
            const body = escapeHtml(headingMatch[2].trim()).replaceAll("\n", "<br>");
            return `
                <article class="detail-note-paragraph detail-note-paragraph-keyed">
                    <h4>${heading}</h4>
                    <p>${body}</p>
                </article>
            `;
        }

        return `
            <article class="detail-note-paragraph">
                <p>${escapedParagraph}</p>
            </article>
        `;
    }).join("");
}


const defaultForgeNoteTitles = [
    "Klasse, Hintergrund & Alignment",
    "Persönlichkeit",
    "Ideal",
    "Bindung",
    "Makel",
    "Aussehen",
    "Backstory",
    "Taktik",
    "Geheimnisse",
    "Sonstiges"
];

function normalizeNoteTitle(title) {
    const safeTitle = getSafeOptionalString(title).trim();

    if (safeTitle === "Charakterbogen") {
        return "Klasse, Hintergrund & Alignment";
    }

    return safeTitle;
}

function parseNoteSectionsFromText(value) {
    const safeValue = getSafeOptionalString(value).trim();

    if (safeValue === "") {
        return [];
    }

    return safeValue
        .split(/\n{2,}/)
        .map(function(paragraph) {
            return paragraph.trim();
        })
        .filter(Boolean)
        .map(function(paragraph) {
            const headingMatch = paragraph.match(/^([^:\n]{2,46}):\s*(.*)$/s);

            if (headingMatch !== null) {
                return {
                    title: normalizeNoteTitle(headingMatch[1].trim()),
                    body: headingMatch[2].trim()
                };
            }

            return {
                title: "Notiz",
                body: paragraph
            };
        });
}

function createTextFromNoteSections(sections) {
    return sections
        .map(function(section) {
            const title = normalizeNoteTitle(section.title);
            const body = getSafeOptionalString(section.body).trim();

            if (title === "" && body === "") {
                return "";
            }

            if (title === "" || title === "Notiz") {
                return body;
            }

            if (body === "") {
                return `${title}:`;
            }

            return `${title}: ${body}`;
        })
        .filter(function(entry) {
            return entry.trim() !== "";
        })
        .join("\n\n");
}

function getForgeNoteManagerElement(prefix) {
    return document.querySelector(`#${prefix}-note-manager`);
}

function getForgeNotesTextareaElement(prefix) {
    return document.querySelector(`#${prefix}-notes`);
}

function createForgeNoteTitleOptionsHtml(selectedTitle) {
    const safeSelectedTitle = getSafeOptionalString(selectedTitle).trim() || "Notiz";
    const defaultOption = `<option value="Notiz" ${safeSelectedTitle === "Notiz" ? "selected" : ""}>Freie Notiz</option>`;
    const titleOptions = defaultForgeNoteTitles.map(function(title) {
        const selected = title === safeSelectedTitle ? "selected" : "";
        return `<option value="${escapeHtml(title)}" ${selected}>${escapeHtml(title)}</option>`;
    }).join("");

    return `${defaultOption}${titleOptions}`;
}

function setForgeNotes(prefix, notesText) {
    const textareaElement = getForgeNotesTextareaElement(prefix);

    if (textareaElement !== null) {
        textareaElement.value = getSafeOptionalString(notesText);
    }

    renderForgeNoteManager(prefix);
}

function getForgeNoteSectionsFromDom(prefix) {
    const managerElement = getForgeNoteManagerElement(prefix);

    if (managerElement === null) {
        const textareaElement = getForgeNotesTextareaElement(prefix);
        return parseNoteSectionsFromText(textareaElement === null ? "" : textareaElement.value);
    }

    return Array.from(managerElement.querySelectorAll(".forge-note-row"))
        .map(function(rowElement) {
            const titleSelectElement = rowElement.querySelector(".forge-note-title-select");
            const customTitleElement = rowElement.querySelector(".forge-note-custom-title");
            const bodyElement = rowElement.querySelector(".forge-note-body");
            const selectedTitle = titleSelectElement === null ? "Notiz" : titleSelectElement.value;
            const customTitle = customTitleElement === null ? "" : customTitleElement.value.trim();
            const title = selectedTitle === "custom" ? customTitle : selectedTitle;

            return {
                title: title,
                body: bodyElement === null ? "" : bodyElement.value.trim()
            };
        })
        .filter(function(section) {
            return getSafeOptionalString(section.title).trim() !== "" || getSafeOptionalString(section.body).trim() !== "";
        });
}

function syncForgeNotesTextarea(prefix) {
    const textareaElement = getForgeNotesTextareaElement(prefix);

    if (textareaElement === null) {
        return;
    }

    textareaElement.value = createTextFromNoteSections(getForgeNoteSectionsFromDom(prefix));
}

function getForgeNotesText(prefix) {
    syncForgeNotesTextarea(prefix);
    const textareaElement = getForgeNotesTextareaElement(prefix);
    return textareaElement === null ? "" : textareaElement.value.trim();
}

function renderForgeNoteManager(prefix) {
    const managerElement = getForgeNoteManagerElement(prefix);
    const textareaElement = getForgeNotesTextareaElement(prefix);

    if (managerElement === null || textareaElement === null) {
        return;
    }

    const sections = parseNoteSectionsFromText(textareaElement.value);

    if (sections.length === 0) {
        managerElement.innerHTML = `
            <div class="forge-note-empty">
                <p>Noch keine Notizabschnitte. Lege einen Abschnitt an oder nutze die freie Notiz.</p>
            </div>
        `;
        return;
    }

    managerElement.innerHTML = sections.map(function(section, index) {
        const title = normalizeNoteTitle(section.title) || "Notiz";
        const isKnownTitle = title === "Notiz" || defaultForgeNoteTitles.includes(title);
        const selectedTitle = isKnownTitle ? title : "custom";
        const customTitleValue = isKnownTitle ? "" : title;
        const customTitleClass = selectedTitle === "custom" ? "" : "forge-note-custom-title-hidden";
        const optionsHtml = `${createForgeNoteTitleOptionsHtml(selectedTitle)}<option value="custom" ${selectedTitle === "custom" ? "selected" : ""}>Eigene Überschrift</option>`;

        return `
            <article class="forge-note-row" data-note-index="${index}">
                <div class="forge-note-row-head">
                    <div class="forge-note-title-controls">
                        <label class="form-field forge-note-title-field">
                            <span>Abschnitt</span>
                            <select class="forge-note-title-select" onchange="handleForgeNoteTitleChange('${prefix}', ${index})">${optionsHtml}</select>
                        </label>
                        <label class="form-field forge-note-custom-title-field ${customTitleClass}">
                            <span>Eigene Überschrift</span>
                            <input class="forge-note-custom-title" type="text" value="${escapeHtml(customTitleValue)}" placeholder="z. B. Verbündete" oninput="syncForgeNotesTextarea('${prefix}')">
                        </label>
                    </div>
                    <button class="forge-note-delete-button" type="button" onclick="deleteForgeNoteSection('${prefix}', ${index})" title="Abschnitt löschen" aria-label="Notizabschnitt löschen">×</button>
                </div>
                <label class="form-field forge-note-body-field">
                    <span>Text</span>
                    <textarea class="forge-note-body" rows="4" oninput="syncForgeNotesTextarea('${prefix}')">${escapeHtml(section.body)}</textarea>
                </label>
            </article>
        `;
    }).join("");
}

function handleForgeNoteTitleChange(prefix, index) {
    const rowElement = document.querySelector(`#${prefix}-note-manager .forge-note-row[data-note-index="${index}"]`);

    if (rowElement !== null) {
        const selectElement = rowElement.querySelector(".forge-note-title-select");
        const customFieldElement = rowElement.querySelector(".forge-note-custom-title-field");

        if (customFieldElement !== null && selectElement !== null) {
            customFieldElement.classList.toggle("forge-note-custom-title-hidden", selectElement.value !== "custom");
        }
    }

    syncForgeNotesTextarea(prefix);
}

function addForgeNoteSection(prefix) {
    const sections = getForgeNoteSectionsFromDom(prefix);
    sections.unshift({ title: "Sonstiges", body: "" });

    const textareaElement = getForgeNotesTextareaElement(prefix);
    if (textareaElement !== null) {
        textareaElement.value = createTextFromNoteSections(sections);
    }

    renderForgeNoteManager(prefix);

    const firstNewRowElement = document.querySelector(`#${prefix}-note-manager .forge-note-row[data-note-index="0"]`);
    if (firstNewRowElement !== null) {
        firstNewRowElement.scrollIntoView({ block: "nearest" });
        const selectElement = firstNewRowElement.querySelector(".forge-note-title-select");
        if (selectElement !== null) {
            selectElement.focus();
        }
    }
}

function deleteForgeNoteSection(prefix, index) {
    const sections = getForgeNoteSectionsFromDom(prefix);
    sections.splice(index, 1);

    const textareaElement = getForgeNotesTextareaElement(prefix);
    if (textareaElement !== null) {
        textareaElement.value = createTextFromNoteSections(sections);
    }

    renderForgeNoteManager(prefix);
}

function getDetailValue(value) {
    const safeValue = getSafeOptionalString(value);

    if (safeValue === "") {
        return "—";
    }

    return escapeHtml(safeValue);
}

function createAbilityScoreHtml(card, shortName, scorePropertyName, modifierPropertyName) {
    const scoreValue = Number.isFinite(Number(card[scorePropertyName]))
        ? String(card[scorePropertyName])
        : "10";
    const modifierValue = getDetailValue(card[modifierPropertyName] || "+0");

    return `
        <p class="active-hand-ability-tile">
            <span class="active-hand-ability-label">${shortName}</span>
            <span class="active-hand-ability-score">${escapeHtml(scoreValue)}</span>
            <span class="active-hand-ability-modifier">(${modifierValue})</span>
        </p>
    `;
}

function createDetailStatCardHtml(label, value, extraClassName = "") {
    return `
        <p class="detail-stat-card ${extraClassName}">
            <span>${label}</span>
            <strong>${getDetailValue(value)}</strong>
        </p>
    `;
}

function createDetailLongTextCardHtml(label, value, emptyText) {
    const safeValue = getSafeOptionalString(value);
    const contentHtml = safeValue === ""
        ? `<span class="detail-long-empty">${escapeHtml(emptyText)}</span>`
        : escapeHtml(safeValue).replaceAll("\n", "<br>");

    return `
        <section class="detail-long-card">
            <h5>${label}</h5>
            <p>${contentHtml}</p>
        </section>
    `;
}

function getSafeInteger(value, fallbackValue) {
    const numberValue = Number(value);

    if (Number.isInteger(numberValue)) {
        return numberValue;
    }

    return fallbackValue;
}

function getSafePositiveInteger(value, fallbackValue) {
    const numberValue = Number(value);

    if (Number.isInteger(numberValue) && numberValue > 0) {
        return numberValue;
    }

    return fallbackValue;
}

function getSafeNonNegativeInteger(value, fallbackValue) {
    const numberValue = Number(value);

    if (Number.isInteger(numberValue) && numberValue >= 0) {
        return numberValue;
    }

    return fallbackValue;
}

// ============================================================
// Spellcasting-Modell, Spell-Slot-Tracker und Forge-Parser
// ============================================================

const spellLevelLabels = {
    0: "Cantrips",
    1: "1st Level",
    2: "2nd Level",
    3: "3rd Level",
    4: "4th Level",
    5: "5th Level",
    6: "6th Level",
    7: "7th Level",
    8: "8th Level",
    9: "9th Level"
};


function createEmptySpellSlots() {
    const slots = {};

    for (let level = 1; level <= 9; level += 1) {
        slots[String(level)] = { max: 0, used: 0 };
    }

    return slots;
}

function createDefaultSpellcasting(rawCard = {}) {
    const saveDcText = getSafeOptionalString(rawCard.spellSaveDc);
    const parsedSaveDc = parseSpellSaveDcText(saveDcText);

    return {
        ability: parsedSaveDc.ability,
        saveDc: parsedSaveDc.saveDc,
        attackBonus: parsedSaveDc.attackBonus,
        slots: createEmptySpellSlots(),
        spells: []
    };
}

function parseSpellSaveDcText(value) {
    const text = getSafeOptionalString(value);
    const dcMatch = text.match(/DC\s*(\d+)/i);
    const attackMatch = text.match(/(?:Spell\s*)?Attack\s*([+\-]?\d+)/i);
    const abilityMatch = text.match(/\b(STR|DEX|CON|INT|WIS|CHA)\b/i);

    return {
        ability: abilityMatch ? abilityMatch[1].toUpperCase() : "",
        saveDc: dcMatch ? Number(dcMatch[1]) : 0,
        attackBonus: attackMatch ? attackMatch[1] : ""
    };
}

function getSafeSpellcasting(rawSpellcasting, rawCard = {}) {
    const spellcasting = createDefaultSpellcasting(rawCard);

    if (rawSpellcasting !== null && typeof rawSpellcasting === "object") {
        const safeAbility = getSafeOptionalString(rawSpellcasting.ability).toUpperCase();
        const safeSaveDc = getSafeNonNegativeInteger(rawSpellcasting.saveDc, 0);

        spellcasting.ability = safeAbility || spellcasting.ability;
        spellcasting.saveDc = safeSaveDc > 0 ? safeSaveDc : spellcasting.saveDc;
        spellcasting.attackBonus = getSafeOptionalString(rawSpellcasting.attackBonus) || spellcasting.attackBonus;
        spellcasting.slots = getSafeSpellSlots(rawSpellcasting.slots);
        spellcasting.spells = getSafeSpellList(rawSpellcasting.spells);
    }

    return spellcasting;
}

function getSafeSpellSlots(rawSlots) {
    const slots = createEmptySpellSlots();

    if (rawSlots === null || typeof rawSlots !== "object") {
        return slots;
    }

    for (let level = 1; level <= 9; level += 1) {
        const key = String(level);
        const rawSlot = rawSlots[key] || rawSlots[level];

        if (rawSlot !== null && typeof rawSlot === "object") {
            const max = clampNumber(getSafeNonNegativeInteger(rawSlot.max, 0), 0, 9);
            const used = clampNumber(getSafeNonNegativeInteger(rawSlot.used, 0), 0, max);
            slots[key] = { max: max, used: used };
        } else if (Number.isInteger(Number(rawSlot))) {
            const max = clampNumber(Number(rawSlot), 0, 9);
            slots[key] = { max: max, used: 0 };
        }
    }

    return slots;
}

function getSafeSpellList(rawSpells) {
    if (Array.isArray(rawSpells) === false) {
        return [];
    }

    return rawSpells
        .map(function(rawSpell, index) {
            return getSafeSpell(rawSpell, index);
        })
        .filter(function(spell) {
            return spell.name !== "";
        });
}

function getSafeSpell(rawSpell, index) {
    if (rawSpell === null || typeof rawSpell !== "object") {
        return createSpellObject({ name: "", level: 0 }, index);
    }

    return createSpellObject({
        id: getSafeOptionalString(rawSpell.id),
        name: getSafeOptionalString(rawSpell.name),
        level: getSafeSpellLevel(rawSpell.level),
        prepared: rawSpell.prepared !== false,
        ritual: rawSpell.ritual === true,
        concentration: rawSpell.concentration === true,
        castingTime: getSafeOptionalString(rawSpell.castingTime),
        range: getSafeOptionalString(rawSpell.range),
        components: getSafeOptionalString(rawSpell.components),
        duration: getSafeOptionalString(rawSpell.duration),
        saveOrAttack: getSafeOptionalString(rawSpell.saveOrAttack),
        source: getSafeOptionalString(rawSpell.source),
        pageRef: getSafeOptionalString(rawSpell.pageRef),
        notes: getSafeOptionalString(rawSpell.notes),
        description: getSafeOptionalString(rawSpell.description),
        showAsAction: rawSpell.showAsAction === true,
        actionType: getSafeCardActionType(rawSpell.actionType),
        usageMax: getSafeNonNegativeInteger(rawSpell.usageMax, 0),
        usageReset: getSafeUsageReset(rawSpell.usageReset),
        used: getSafeNonNegativeInteger(rawSpell.used, 0)
    }, index);
}

function getSafeSpellLevel(value) {
    const numericLevel = Number(value);

    if (Number.isInteger(numericLevel) && numericLevel >= 0 && numericLevel <= 9) {
        return numericLevel;
    }

    const text = getSafeOptionalString(value).toLowerCase();

    if (text.includes("cantrip")) {
        return 0;
    }

    const match = text.match(/(\d+)/);

    if (match !== null) {
        return clampNumber(Number(match[1]), 0, 9);
    }

    return 0;
}

function createSpellObject(rawSpell, index) {
    const name = getSafeOptionalString(rawSpell.name);
    const level = getSafeSpellLevel(rawSpell.level);
    const generatedId = createSpellId(name, level, index);

    return {
        id: getSafeOptionalString(rawSpell.id) || generatedId,
        name: name,
        level: level,
        prepared: rawSpell.prepared !== false,
        ritual: rawSpell.ritual === true,
        concentration: rawSpell.concentration === true,
        castingTime: getSafeOptionalString(rawSpell.castingTime),
        range: getSafeOptionalString(rawSpell.range),
        components: getSafeOptionalString(rawSpell.components),
        duration: getSafeOptionalString(rawSpell.duration),
        saveOrAttack: getSafeOptionalString(rawSpell.saveOrAttack),
        source: getSafeOptionalString(rawSpell.source),
        pageRef: getSafeOptionalString(rawSpell.pageRef),
        notes: getSafeOptionalString(rawSpell.notes),
        description: getSafeOptionalString(rawSpell.description),
        showAsAction: rawSpell.showAsAction === true,
        actionType: getSafeCardActionType(rawSpell.actionType),
        usageMax: getSafeNonNegativeInteger(rawSpell.usageMax, 0),
        usageReset: getSafeUsageReset(rawSpell.usageReset),
        used: getSafeNonNegativeInteger(rawSpell.used, 0)
    };
}

function createSpellId(name, level, index) {
    const slug = getSafeOptionalString(name)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    return `${level}-${slug || "spell"}-${index}`;
}

function parseLegacySpellsText(spellsText) {
    const text = getSafeOptionalString(spellsText);

    if (text === "") {
        return [];
    }

    const sections = [];
    const sectionRegex = /(Cantrips?|(?:\d+)(?:st|nd|rd|th)?\s*Level|Spellcasting Notes?)\s*:\s*/gi;
    const matches = Array.from(text.matchAll(sectionRegex));

    if (matches.length === 0) {
        return splitDetailEntries(text).map(function(entry, index) {
            return createSpellObject({
                name: getDetailEntryTitle(entry, "Spell", index),
                level: 0,
                description: getDetailEntryBody(entry),
                prepared: true
            }, index);
        });
    }

    for (let matchIndex = 0; matchIndex < matches.length; matchIndex += 1) {
        const match = matches[matchIndex];
        const label = match[1];
        const startIndex = match.index + match[0].length;
        const endIndex = matchIndex + 1 < matches.length ? matches[matchIndex + 1].index : text.length;
        const body = text.slice(startIndex, endIndex).trim();
        sections.push({ label: label, body: body });
    }

    const spells = [];

    for (const section of sections) {
        if (/Spellcasting Notes?/i.test(section.label)) {
            continue;
        }

        const level = getSafeSpellLevel(section.label);
        const names = section.body
            .split(/[;\n]+/)
            .map(function(name) {
                return name.trim().replace(/[.]$/, "");
            })
            .filter(function(name) {
                return name !== "";
            });

        for (const name of names) {
            const ritual = /\[R\]|\(R\)|\bRitual\b/i.test(name);
            const concentration = /\[C\]|\(C\)|\bConcentration\b/i.test(name);
            const cleanName = name
                .replace(/\[R\]|\(R\)|\bRitual\b/gi, "")
                .replace(/\[C\]|\(C\)|\bConcentration\b/gi, "")
                .trim();

            spells.push(createSpellObject({
                name: cleanName,
                level: level,
                prepared: true,
                ritual: ritual,
                concentration: concentration,
                description: ""
            }, spells.length));
        }
    }

    return spells;
}

function applyLegacySlotHints(spellcasting, rawCard = {}) {
    const hintsText = `${getSafeOptionalString(rawCard.specialResources)} ${getSafeOptionalString(rawCard.spellsText)}`;

    for (let level = 1; level <= 9; level += 1) {
        const key = String(level);
        const levelLabelPattern = level === 1 ? "1st" : level === 2 ? "2nd" : level === 3 ? "3rd" : `${level}th`;
        const regex = new RegExp(`${levelLabelPattern}\\s*:?\\s*(\\d+)`, "gi");
        let match = regex.exec(hintsText);

        while (match !== null) {
            const slotCount = clampNumber(Number(match[1]), 0, 9);
            spellcasting.slots[key].max = Math.max(spellcasting.slots[key].max, slotCount);
            match = regex.exec(hintsText);
        }
    }

    const spellsByLevel = groupSpellsByLevel(spellcasting.spells);

    if ((spellsByLevel[1] || []).length > 0 && spellcasting.slots["1"].max === 0) {
        spellcasting.slots["1"].max = 4;
    }

    if ((spellsByLevel[2] || []).length > 0 && spellcasting.slots["2"].max === 0) {
        spellcasting.slots["2"].max = 2;
    }

    for (let level = 1; level <= 9; level += 1) {
        const key = String(level);
        spellcasting.slots[key].used = clampNumber(spellcasting.slots[key].used, 0, spellcasting.slots[key].max);
    }
}

function groupSpellsByLevel(spells) {
    const groups = {};

    for (let level = 0; level <= 9; level += 1) {
        groups[level] = [];
    }

    for (const spell of spells) {
        const level = getSafeSpellLevel(spell.level);
        groups[level].push(spell);
    }

    return groups;
}

function getCardSpellcasting(card) {
    if (card === null) {
        return createDefaultSpellcasting();
    }

    card.spellcasting = getSafeSpellcasting(card.spellcasting, card);

    return card.spellcasting;
}

function getAvailableSpellSlotCount(slotData) {
    return Math.max(0, slotData.max - slotData.used);
}

function getActiveDetailScrollElement() {
    return document.querySelector("#card-detail-panel .active-hand-detail-scroll");
}

function captureActiveDetailScrollTop() {
    const scrollElement = getActiveDetailScrollElement();

    if (scrollElement === null) {
        return 0;
    }

    return scrollElement.scrollTop;
}

function findSpellRowByKey(spellKey) {
    const spellRows = document.querySelectorAll("#card-detail-panel [data-spell-key]");

    for (const spellRow of spellRows) {
        if (spellRow.dataset.spellKey === spellKey) {
            return spellRow;
        }
    }

    return null;
}

function keepElementVisibleInsideScrollContainer(scrollElement, targetElement, padding = 10) {
    const containerRect = scrollElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    const upperOverflow = targetRect.top - containerRect.top - padding;
    const lowerOverflow = targetRect.bottom - containerRect.bottom + padding;

    if (upperOverflow < 0) {
        scrollElement.scrollTop += upperOverflow;
        return;
    }

    if (lowerOverflow > 0) {
        scrollElement.scrollTop += lowerOverflow;
    }
}

function restoreDetailScrollAfterRender(scrollTop, spellKeyToReveal = "") {
    window.requestAnimationFrame(function() {
        const scrollElement = getActiveDetailScrollElement();

        if (scrollElement === null) {
            return;
        }

        scrollElement.scrollTop = scrollTop;

        if (spellKeyToReveal === "") {
            return;
        }

        const spellRow = findSpellRowByKey(spellKeyToReveal);

        if (spellRow !== null) {
            keepElementVisibleInsideScrollContainer(scrollElement, spellRow);
        }
    });
}

function renderCardDetailPanelPreservingScroll(focusedCard) {
    const detailScrollTop = captureActiveDetailScrollTop();
    renderCardDetailPanel(focusedCard);
    restoreDetailScrollAfterRender(detailScrollTop);
}

function renderCardsPreservingDetailScroll() {
    const detailScrollTop = captureActiveDetailScrollTop();
    renderCardsPreservingViewport();
    restoreDetailScrollAfterRender(detailScrollTop);
}

function toggleSpellSlot(cardId, spellLevel, slotIndex) {
    const detailScrollTop = captureActiveDetailScrollTop();
    const card = findCardById(cardId);

    if (card === null) {
        return;
    }

    const spellcasting = getCardSpellcasting(card);
    const level = clampNumber(Number(spellLevel), 1, 9);
    const key = String(level);
    const slotData = spellcasting.slots[key];

    if (slotData.max <= 0) {
        return;
    }

    const index = clampNumber(Number(slotIndex), 0, slotData.max - 1);
    const available = getAvailableSpellSlotCount(slotData);
    const clickedSlotIsAvailable = index < available;
    const newAvailable = clickedSlotIsAvailable ? index : index + 1;

    slotData.used = clampNumber(slotData.max - newAvailable, 0, slotData.max);

    addCombatLogMessage(`${card.publicName || card.name}: Spell Slots ${spellLevelLabels[level]} ${getAvailableSpellSlotCount(slotData)} / ${slotData.max}.`);
    renderCards();
    restoreDetailScrollAfterRender(detailScrollTop);
}

function toggleSpellPrepared(cardId, spellId) {
    const detailScrollTop = captureActiveDetailScrollTop();
    const card = findCardById(cardId);

    if (card === null) {
        return;
    }

    const spell = getCardSpellcasting(card).spells.find(function(candidate) {
        return candidate.id === spellId;
    });

    if (spell === undefined) {
        return;
    }

    spell.prepared = spell.prepared !== true;
    renderCards();
    restoreDetailScrollAfterRender(detailScrollTop);
}

function toggleSpellDetail(cardId, spellId) {
    const detailScrollTop = captureActiveDetailScrollTop();
    const key = `${cardId}:${spellId}`;
    const shouldExpandSpell = uiState.expandedSpellDetailKey !== key;

    uiState.expandedSpellDetailKey = shouldExpandSpell ? key : null;
    renderCards();
    restoreDetailScrollAfterRender(detailScrollTop, shouldExpandSpell ? key : "");
}

function resetSpellSlotsForCard(card) {
    const spellcasting = getCardSpellcasting(card);

    for (let level = 1; level <= 9; level += 1) {
        spellcasting.slots[String(level)].used = 0;
    }
}

function createSpellcastingSummaryText(spellcasting) {
    const parts = [];

    if (spellcasting.ability !== "") {
        parts.push(spellcasting.ability);
    }

    if (spellcasting.saveDc > 0) {
        parts.push(`Save DC ${spellcasting.saveDc}`);
    }

    if (spellcasting.attackBonus !== "") {
        parts.push(`Spell Attack ${spellcasting.attackBonus}`);
    }

    return parts.length > 0 ? parts.join(" · ") : "Keine Spellcasting-Basis eingetragen.";
}

function createCardSpellSaveDcText(spellcasting) {
    const parts = [];

    if (spellcasting.saveDc > 0) {
        parts.push(`DC ${spellcasting.saveDc}`);
    }

    if (spellcasting.attackBonus !== "") {
        parts.push(`Spell Attack ${spellcasting.attackBonus}`);
    }

    return parts.join(" · ");
}

function createSpellcastingSummaryHtml(spellcasting) {
    const abilityText = spellcasting.ability !== "" ? spellcasting.ability : "—";
    const saveDcText = spellcasting.saveDc > 0 ? String(spellcasting.saveDc) : "—";
    const attackText = spellcasting.attackBonus !== "" ? spellcasting.attackBonus : "—";
    const hasAnyValue = abilityText !== "—" || saveDcText !== "—" || attackText !== "—";

    if (hasAnyValue === false) {
        return `
            <section class="spellcasting-summary-card spellcasting-summary-empty">
                <p class="section-eyebrow">Spellcasting</p>
                <p class="spellcasting-empty-text">Keine Spellcasting-Basis eingetragen.</p>
            </section>
        `;
    }

    return `
        <section class="spellcasting-summary-card">
            <div class="spellcasting-summary-header">
                <p class="section-eyebrow">Spellcasting</p>
                <span>Basiswerte</span>
            </div>
            <div class="spellcasting-stat-grid" aria-label="Spellcasting Basiswerte">
                <div class="spellcasting-stat-tile">
                    <span>Ability</span>
                    <strong>${escapeHtml(abilityText)}</strong>
                </div>
                <div class="spellcasting-stat-tile">
                    <span>Save DC</span>
                    <strong>${escapeHtml(saveDcText)}</strong>
                </div>
                <div class="spellcasting-stat-tile">
                    <span>Spell Attack</span>
                    <strong>${escapeHtml(attackText)}</strong>
                </div>
            </div>
        </section>
    `;
}

function createSpellFlagsHtml(spell) {
    const flags = [];

    if (spell.ritual === true) {
        flags.push("R");
    }

    if (spell.concentration === true) {
        flags.push("C");
    }

    if (/reaction|\b1R\b/i.test(spell.castingTime)) {
        flags.push("REA");
    }

    if (/bonus|\bBA\b/i.test(spell.castingTime)) {
        flags.push("BON");
    }

    if (flags.length === 0) {
        return "";
    }

    return `<span class="spell-row-flags">${flags.map(function(flag) {
        return `<span class="spell-row-flag">${flag}</span>`;
    }).join("")}</span>`;
}

function createSpellSlotButtonsHtml(cardId, level, slotData) {
    if (level === 0 || slotData.max <= 0) {
        return "";
    }

    const available = getAvailableSpellSlotCount(slotData);
    const buttons = [];

    for (let index = 0; index < slotData.max; index += 1) {
        const isAvailable = index < available;
        buttons.push(`
            <button
                class="spell-slot-orb ${isAvailable ? "spell-slot-orb-available" : "spell-slot-orb-used"}"
                type="button"
                onclick="toggleSpellSlot(${cardId}, ${level}, ${index})"
                title="Spell Slot ${index + 1} umschalten"
                aria-label="Spell Slot ${index + 1} von ${spellLevelLabels[level]} umschalten"
            >
                <span></span>
            </button>
        `);
    }

    return `
        <div class="spell-level-slots" aria-label="Spell Slots ${spellLevelLabels[level]}">
            <span>Slots ${available} / ${slotData.max}</span>
            <div class="spell-slot-orb-row">${buttons.join("")}</div>
        </div>
    `;
}

function createSpellDetailHtml(cardId, spell) {
    const isReaction = /reaction|\b1R\b/i.test(spell.castingTime);
    const isBonusAction = /bonus|\bBA\b/i.test(spell.castingTime);
    const detailRows = [
        ["Level", spellLevelLabels[spell.level] || "Spell"],
        ["Prepared", spell.prepared === true ? "Ja" : "Nein"],
        ["Ritual", spell.ritual === true ? "Ja" : "Nein"],
        ["Concentration", spell.concentration === true ? "Ja" : "Nein"],
        ["Reaction", isReaction ? "Ja" : "Nein"],
        ["Bonus Action", isBonusAction ? "Ja" : "Nein"],
        ["Casting Time", spell.castingTime],
        ["Range", spell.range],
        ["Components", spell.components],
        ["Duration", spell.duration],
        ["Save / Attack", spell.saveOrAttack],
        ["Source", spell.source],
        ["Page", spell.pageRef]
    ];

    const rowsHtml = detailRows
        .filter(function(row) {
            return getSafeOptionalString(row[1]) !== "";
        })
        .map(function(row) {
            return `<p><span>${escapeHtml(row[0])}</span><strong>${escapeHtml(row[1])}</strong></p>`;
        })
        .join("");

    const text = getSafeOptionalString(spell.description || spell.notes);

    return `
        <div class="spell-detail-card">
            ${rowsHtml !== "" ? `<div class="spell-detail-grid">${rowsHtml}</div>` : ""}
            ${text !== "" ? `<p class="spell-detail-description">${escapeHtml(text).replace(/\n/g, "<br>")}</p>` : `<p class="spell-detail-description spell-detail-empty">Keine Kartendetails eingetragen.</p>`}
            <div class="spell-detail-actions">
                ${spell.level > 0 && getCardSpellcasting(findCardById(cardId)).slots[String(spell.level)].max > 0 ? `<button type="button" onclick="toggleSpellSlot(${cardId}, ${spell.level}, ${Math.max(0, getAvailableSpellSlotCount(getCardSpellcasting(findCardById(cardId)).slots[String(spell.level)]) - 1)})">Slot verwenden</button>` : ""}
            </div>
        </div>
    `;
}

function createSpellRowHtml(cardId, spell) {
    const isExpanded = uiState.expandedSpellDetailKey === `${cardId}:${spell.id}`;
    const preparedSymbol = spell.prepared === true ? "✓" : "○";

    return `
        <article class="spell-row-card ${spell.prepared === true ? "spell-prepared" : "spell-unprepared"} ${isExpanded ? "spell-row-expanded" : ""}" data-spell-key="${escapeHtml(`${cardId}:${spell.id}`)}">
            <div class="spell-row-shell">
                <button class="spell-prepared-toggle" type="button" onclick="toggleSpellPrepared(${cardId}, '${spell.id}')" title="Prepared umschalten" aria-label="Prepared für ${escapeHtml(spell.name)} umschalten">
                    ${preparedSymbol}
                </button>
                <button class="spell-row-button" type="button" onclick="toggleSpellDetail(${cardId}, '${spell.id}')" aria-expanded="${isExpanded ? "true" : "false"}">
                    <span class="spell-row-chevron" aria-hidden="true">›</span>
                    <span class="spell-row-name">${escapeHtml(spell.name)}</span>
                </button>
            </div>
            ${isExpanded ? createSpellDetailHtml(cardId, spell) : ""}
        </article>
    `;
}

function createSpellLevelCardHtml(cardId, level, spells, slotData) {
    if (spells.length === 0 && (slotData === undefined || slotData.max === 0)) {
        return "";
    }

    const slotHtml = level === 0 ? "" : createSpellSlotButtonsHtml(cardId, level, slotData);
    const spellRowsHtml = spells.length === 0
        ? `<p class="detail-placeholder-text">Keine Spells auf diesem Level eingetragen.</p>`
        : spells.map(function(spell) {
            return createSpellRowHtml(cardId, spell);
        }).join("");

    return `
        <section class="spell-level-card spell-level-${level}">
            <header class="spell-level-header">
                <h5>${spellLevelLabels[level]}</h5>
                ${slotHtml}
            </header>
            <div class="spell-level-list">
                ${spellRowsHtml}
            </div>
        </section>
    `;
}

function createSpellTrackerHtml(card) {
    const spellcasting = getCardSpellcasting(card);
    const groupedSpells = groupSpellsByLevel(spellcasting.spells);
    const levelCards = [];

    for (let level = 0; level <= 9; level += 1) {
        const slotData = level === 0 ? { max: 0, used: 0 } : spellcasting.slots[String(level)];
        const levelHtml = createSpellLevelCardHtml(card.id, level, groupedSpells[level], slotData);

        if (levelHtml !== "") {
            levelCards.push(levelHtml);
        }
    }

    if (levelCards.length === 0) {
        return `<p class="detail-placeholder-text">Noch keine Zauber eingetragen.</p>`;
    }

    return `
        <div class="spell-tracker-panel">
            ${createSpellcastingSummaryHtml(spellcasting)}
            <div class="spell-level-stack">
                ${levelCards.join("")}
            </div>
        </div>
    `;
}

function createSpellLineFromSpell(spell) {
    return [
        spell.level,
        spell.prepared === true ? "prepared" : "unprepared",
        spell.name,
        [spell.ritual === true ? "R" : "", spell.concentration === true ? "C" : ""].filter(Boolean).join(","),
        spell.castingTime,
        spell.range,
        spell.components,
        spell.duration,
        spell.saveOrAttack,
        spell.source,
        spell.pageRef,
        spell.description || spell.notes,
        spell.showAsAction === true ? "action-visible" : "",
        spell.actionType || "",
        spell.usageMax || 0,
        spell.usageReset || "none",
        spell.used || 0
    ].map(function(value) {
        return String(value || "").replace(/\|/g, "/");
    }).join(" | ");
}

function createSpellListTextFromSpellcasting(spellcasting) {
    return spellcasting.spells.map(createSpellLineFromSpell).join("\n");
}

function parseSpellListText(spellListText) {
    const text = getSafeOptionalString(spellListText);

    if (text === "") {
        return [];
    }

    return text
        .split(/\n+/)
        .map(function(line, index) {
            const parts = line.split("|").map(function(part) {
                return part.trim();
            });

            const level = getSafeSpellLevel(parts[0]);
            const prepared = !/^(unprepared|false|0|no|nein|○)$/i.test(parts[1] || "prepared");
            const name = parts[2] || "";
            const flags = parts[3] || "";

            return createSpellObject({
                name: name,
                level: level,
                prepared: prepared,
                ritual: /\bR\b|ritual/i.test(flags),
                concentration: /\bC\b|concentration/i.test(flags),
                castingTime: parts[4] || "",
                range: parts[5] || "",
                components: parts[6] || "",
                duration: parts[7] || "",
                saveOrAttack: parts[8] || "",
                source: parts[9] || "",
                pageRef: parts[10] || "",
                description: parts[11] || "",
                showAsAction: parts[12] === "action-visible",
                actionType: getSafeCardActionType(parts[13]),
                usageMax: getSafeNonNegativeInteger(parts[14], 0),
                usageReset: getSafeUsageReset(parts[15]),
                used: getSafeNonNegativeInteger(parts[16], 0)
            }, index);
        })
        .filter(function(spell) {
            return spell.name !== "";
        });
}

function readSpellcastingFromForge(prefix) {
    const base = createDefaultSpellcasting();
    const abilityElement = document.querySelector(`#${prefix}-spellcasting-ability`);
    const saveDcElement = document.querySelector(`#${prefix}-spellcasting-save-dc`);
    const attackElement = document.querySelector(`#${prefix}-spellcasting-attack`);
    const spellListElement = document.querySelector(`#${prefix}-structured-spells`);

    base.ability = abilityElement !== null ? abilityElement.value.trim().toUpperCase() : base.ability;
    base.saveDc = saveDcElement !== null ? getSafeNonNegativeInteger(saveDcElement.value, base.saveDc) : base.saveDc;
    base.attackBonus = attackElement !== null ? attackElement.value.trim() : base.attackBonus;
    base.slots = createEmptySpellSlots();

    for (let level = 1; level <= 9; level += 1) {
        const slotElement = document.querySelector(`#${prefix}-spell-slots-${level}`);
        const max = slotElement !== null ? clampNumber(getSafeNonNegativeInteger(slotElement.value, 0), 0, 9) : 0;
        base.slots[String(level)] = { max: max, used: 0 };
    }

    base.spells = parseSpellListText(spellListElement !== null ? spellListElement.value : "");
    return base;
}

function writeSpellcastingToForge(prefix, card) {
    const spellcasting = getCardSpellcasting(card);

    setInputValue(`${prefix}-spellcasting-ability`, spellcasting.ability || "");
    setInputValue(`${prefix}-spellcasting-save-dc`, spellcasting.saveDc || 0);
    setInputValue(`${prefix}-spellcasting-attack`, spellcasting.attackBonus || "");

    for (let level = 1; level <= 9; level += 1) {
        setInputValue(`${prefix}-spell-slots-${level}`, spellcasting.slots[String(level)].max || 0);
    }

    setInputValue(`${prefix}-structured-spells`, createSpellListTextFromSpellcasting(spellcasting));
}


function getVisibleForgePrefix() {
    const editSectionElement = document.querySelector("#edit-card-section");

    if (editSectionElement !== null && editSectionElement.classList.contains("card-forge-panel-hidden") === false) {
        return "edit-card";
    }

    return "new-card";
}

function renderVisibleForgeSpellManager() {
    renderForgeSpellManager(getVisibleForgePrefix());
}

function getForgeSpellcastingDraft(prefix) {
    return readSpellcastingFromForge(prefix);
}

function setForgeSpellList(prefix, spells) {
    const spellListElement = document.querySelector(`#${prefix}-structured-spells`);

    if (spellListElement === null) {
        return;
    }

    const draft = getForgeSpellcastingDraft(prefix);
    draft.spells = spells.map(function(spell, index) {
        return createSpellObject(spell, index);
    });
    spellListElement.value = createSpellListTextFromSpellcasting(draft);
}

function keepCardForgeOpenForInternalAction() {
    suppressCardForgeClickAwayOnce = true;
}

function commitForgeSpellcastingIfEditing(prefix) {
    if (prefix !== "edit-card") {
        return;
    }

    const card = getEditFormCard();

    if (card === null) {
        return;
    }

    card.spellcasting = readSpellcastingFromForge(prefix);
    card.spellSaveDc = createCardSpellSaveDcText(card.spellcasting);

    saveAndBroadcastAppState();
    renderCardDetailPanel(getFocusedCard(getHandCards(), getActiveCard(getHandCards())));
}

function hasOpenForgeSpellEditor() {
    return activeForgeSpellEditor !== null;
}

function confirmCloseCardForgeWithOpenSpellEditor() {
    if (hasOpenForgeSpellEditor() === false && hasOpenForgeActionEditor() === false && hasOpenForgeTraitEditor() === false) {
        return true;
    }

    return window.confirm("In der Kartenschmiede ist noch ein Editor geöffnet. Ungespeicherte Änderungen verwerfen und schließen?");
}

function scrollActiveForgeSpellEditorIntoView(prefix) {
    window.setTimeout(function() {
        const editorElement = document.querySelector(`#${prefix}-spell-manager .forge-spell-editor`);

        if (editorElement !== null) {
            editorElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }

        const nameElement = document.querySelector(`#${prefix}-forge-spell-name`);

        if (nameElement !== null) {
            nameElement.focus({ preventScroll: true });
            nameElement.select();
        }
    }, 0);
}

function openForgeSpellEditor(prefix, spellId) {
    keepCardForgeOpenForInternalAction();
    activeForgeSpellEditor = {
        prefix: prefix,
        spellId: spellId || "",
        isNewDraft: false
    };
    renderForgeSpellManager(prefix);
    renderForgeTraitManager(prefix);
    scrollActiveForgeSpellEditorIntoView(prefix);
}

function addForgeSpell(prefix) {
    keepCardForgeOpenForInternalAction();
    const spell = createSpellObject({
        name: "Neuer Spell",
        level: 0,
        prepared: true
    }, Date.now());

    activeForgeSpellEditor = {
        prefix: prefix,
        spellId: spell.id,
        isNewDraft: true,
        draftSpell: spell
    };
    renderForgeSpellManager(prefix);
    renderForgeTraitManager(prefix);
    scrollActiveForgeSpellEditorIntoView(prefix);
}

function cancelForgeSpellEditor(prefix, options = {}) {
    if (options.skipClickAwayGuard !== true) {
        keepCardForgeOpenForInternalAction();
    }

    activeForgeSpellEditor = null;
    renderForgeSpellManager(prefix);
    renderForgeTraitManager(prefix);
}

function deleteForgeSpell(prefix, spellId) {
    keepCardForgeOpenForInternalAction();
    const draft = getForgeSpellcastingDraft(prefix);
    const spellToDelete = draft.spells.find(function(spell) {
        return spell.id === spellId;
    });
    const spellName = spellToDelete !== undefined ? spellToDelete.name : "diesen Spell";

    if (window.confirm(`Spell „${spellName}“ löschen?`) === false) {
        return;
    }

    const filteredSpells = draft.spells.filter(function(spell) {
        return spell.id !== spellId;
    });

    setForgeSpellList(prefix, filteredSpells);
    activeForgeSpellEditor = null;
    renderForgeSpellManager(prefix);
    renderForgeTraitManager(prefix);
    commitForgeSpellcastingIfEditing(prefix);
}

function saveForgeSpell(prefix, spellId) {
    keepCardForgeOpenForInternalAction();
    const draft = getForgeSpellcastingDraft(prefix);
    const nameElement = document.querySelector(`#${prefix}-forge-spell-name`);
    const levelElement = document.querySelector(`#${prefix}-forge-spell-level`);
    const preparedElement = document.querySelector(`#${prefix}-forge-spell-prepared`);
    const ritualElement = document.querySelector(`#${prefix}-forge-spell-ritual`);
    const concentrationElement = document.querySelector(`#${prefix}-forge-spell-concentration`);
    const reactionElement = document.querySelector(`#${prefix}-forge-spell-reaction`);
    const bonusElement = document.querySelector(`#${prefix}-forge-spell-bonus`);
    const castingTimeElement = document.querySelector(`#${prefix}-forge-spell-casting-time`);
    const rangeElement = document.querySelector(`#${prefix}-forge-spell-range`);
    const componentsElement = document.querySelector(`#${prefix}-forge-spell-components`);
    const durationElement = document.querySelector(`#${prefix}-forge-spell-duration`);
    const saveAttackElement = document.querySelector(`#${prefix}-forge-spell-save-attack`);
    const sourceElement = document.querySelector(`#${prefix}-forge-spell-source`);
    const pageElement = document.querySelector(`#${prefix}-forge-spell-page`);
    const descriptionElement = document.querySelector(`#${prefix}-forge-spell-description`);
    const showActionElement = document.querySelector(`#${prefix}-forge-spell-show-action`);
    const actionTypeElement = document.querySelector(`#${prefix}-forge-spell-action-type`);
    const usageMaxElement = document.querySelector(`#${prefix}-forge-spell-usage-max`);
    const usageResetElement = document.querySelector(`#${prefix}-forge-spell-usage-reset`);

    if (nameElement === null || levelElement === null) {
        return;
    }

    const name = nameElement.value.trim();

    if (name === "") {
        nameElement.focus();
        return;
    }

    const existingIndex = draft.spells.findIndex(function(spell) {
        return spell.id === spellId;
    });
    const previousSpell = existingIndex >= 0
        ? draft.spells[existingIndex]
        : activeForgeSpellEditor !== null && activeForgeSpellEditor.prefix === prefix && activeForgeSpellEditor.spellId === spellId && activeForgeSpellEditor.draftSpell !== undefined
            ? activeForgeSpellEditor.draftSpell
            : {};
    const castingTimeValue = castingTimeElement !== null ? castingTimeElement.value.trim() : "";
    const finalCastingTime = reactionElement !== null && reactionElement.checked === true && castingTimeValue === ""
        ? "1 Reaktion"
        : bonusElement !== null && bonusElement.checked === true && castingTimeValue === ""
            ? "1 Bonusaktion"
            : castingTimeValue;
    const nextSpell = createSpellObject({
        id: previousSpell.id || spellId,
        name: name,
        level: getSafeSpellLevel(levelElement.value),
        prepared: preparedElement !== null ? preparedElement.checked : true,
        ritual: ritualElement !== null && ritualElement.checked === true,
        concentration: concentrationElement !== null && concentrationElement.checked === true,
        castingTime: finalCastingTime,
        range: rangeElement !== null ? rangeElement.value.trim() : "",
        components: componentsElement !== null ? componentsElement.value.trim() : "",
        duration: durationElement !== null ? durationElement.value.trim() : "",
        saveOrAttack: saveAttackElement !== null ? saveAttackElement.value.trim() : "",
        source: sourceElement !== null ? sourceElement.value.trim() : "",
        pageRef: pageElement !== null ? pageElement.value.trim() : "",
        description: descriptionElement !== null ? descriptionElement.value.trim() : "",
        showAsAction: showActionElement !== null && showActionElement.checked === true,
        actionType: actionTypeElement !== null ? actionTypeElement.value : inferSpellActionType({ castingTime: finalCastingTime }),
        usageMax: usageMaxElement !== null ? getSafeNonNegativeInteger(usageMaxElement.value, 0) : 0,
        usageReset: usageResetElement !== null ? getSafeUsageReset(usageResetElement.value) : "none",
        used: previousSpell.used || 0
    }, existingIndex >= 0 ? existingIndex : draft.spells.length);

    if (existingIndex >= 0) {
        draft.spells[existingIndex] = nextSpell;
    } else {
        draft.spells.push(nextSpell);
    }

    setForgeSpellList(prefix, draft.spells);
    activeForgeSpellEditor = null;
    renderForgeSpellManager(prefix);
    renderForgeTraitManager(prefix);
    commitForgeSpellcastingIfEditing(prefix);
}

function toggleForgeSpellPrepared(prefix, spellId) {
    keepCardForgeOpenForInternalAction();
    const draft = getForgeSpellcastingDraft(prefix);

    for (const spell of draft.spells) {
        if (spell.id === spellId) {
            spell.prepared = spell.prepared !== true;
            break;
        }
    }

    setForgeSpellList(prefix, draft.spells);
    renderForgeSpellManager(prefix);
    renderForgeTraitManager(prefix);
    commitForgeSpellcastingIfEditing(prefix);
}

function createForgeSpellRowHtml(prefix, spell) {
    const preparedSymbol = spell.prepared === true ? "✓" : "○";
    const editorIsOpen = activeForgeSpellEditor !== null && activeForgeSpellEditor.prefix === prefix && activeForgeSpellEditor.spellId === spell.id;

    return `
        <div class="forge-spell-row ${spell.prepared === true ? "forge-spell-prepared" : "forge-spell-unprepared"} ${editorIsOpen ? "forge-spell-row-active" : ""}">
            <button class="forge-spell-prepared-toggle" type="button" onclick="toggleForgeSpellPrepared('${prefix}', '${spell.id}')" title="Prepared umschalten" aria-label="Prepared für ${escapeHtml(spell.name)} umschalten">${preparedSymbol}</button>
            <span class="forge-spell-name">${escapeHtml(spell.name)}</span>
            <div class="forge-spell-row-actions">
                <button class="forge-spell-edit-button" type="button" onclick="openForgeSpellEditor('${prefix}', '${spell.id}')">Edit</button>
                <button class="forge-spell-delete-button" type="button" onclick="deleteForgeSpell('${prefix}', '${spell.id}')" title="Spell löschen" aria-label="${escapeHtml(spell.name)} löschen">×</button>
            </div>
        </div>
        ${editorIsOpen ? createForgeSpellEditorHtml(prefix, spell) : ""}
    `;
}

function createForgeSpellDraftGroupHtml(prefix, spell) {
    if (spell === undefined || spell === null) {
        return "";
    }

    return `
        <section class="forge-spell-draft-group" aria-label="Neuer Spell">
            <div class="forge-spell-draft-header">
                <p class="section-eyebrow">Neuer Spell</p>
                <span>Entwurf wird erst nach „Spell speichern“ einsortiert.</span>
            </div>
            ${createForgeSpellEditorHtml(prefix, spell)}
        </section>
    `;
}

function createForgeSpellLevelGroupHtml(prefix, level, spells) {
    if (spells.length === 0) {
        return "";
    }

    return `
        <section class="forge-spell-level-group">
            <h5>${spellLevelLabels[level]}</h5>
            <div class="forge-spell-row-list">
                ${spells.map(function(spell) { return createForgeSpellRowHtml(prefix, spell); }).join("")}
            </div>
        </section>
    `;
}

function createForgeSpellEditorHtml(prefix, spell) {
    const safeSpell = spell || createSpellObject({ name: "", level: 0, prepared: true }, 0);
    const isReaction = /reaction|\b1R\b/i.test(safeSpell.castingTime);
    const isBonusAction = /bonus|\bBA\b/i.test(safeSpell.castingTime);
    const levelOptions = Object.keys(spellLevelLabels).map(function(key) {
        const selected = Number(key) === safeSpell.level ? " selected" : "";
        return `<option value="${key}"${selected}>${spellLevelLabels[key]}</option>`;
    }).join("");

    return `
        <section class="forge-spell-editor forge-spell-inline-editor" aria-label="Spell bearbeiten">
            <div class="forge-spell-editor-header">
                <p class="section-eyebrow">${activeForgeSpellEditor !== null && activeForgeSpellEditor.isNewDraft === true ? "Neuer Spell" : "Spell bearbeiten"}</p>
                <h5>${activeForgeSpellEditor !== null && activeForgeSpellEditor.isNewDraft === true ? "Neuen Spell anlegen" : escapeHtml(safeSpell.name)}</h5>
            </div>
            <div class="forge-spell-editor-grid">
                <label class="form-field forge-spell-editor-wide"><span>Name</span><input id="${prefix}-forge-spell-name" type="text" value="${escapeHtml(safeSpell.name)}"></label>
                <label class="form-field"><span>Level</span><select id="${prefix}-forge-spell-level">${levelOptions}</select></label>
                <label class="checkbox-field forge-checkbox-card"><input id="${prefix}-forge-spell-prepared" type="checkbox" ${safeSpell.prepared === true ? "checked" : ""}><span>Prepared</span></label>
                <div class="forge-spell-property-grid forge-spell-editor-wide">
                    <label class="checkbox-field forge-checkbox-card"><input id="${prefix}-forge-spell-ritual" type="checkbox" ${safeSpell.ritual === true ? "checked" : ""}><span>Ritual</span></label>
                    <label class="checkbox-field forge-checkbox-card"><input id="${prefix}-forge-spell-concentration" type="checkbox" ${safeSpell.concentration === true ? "checked" : ""}><span>Concentration</span></label>
                    <label class="checkbox-field forge-checkbox-card"><input id="${prefix}-forge-spell-reaction" type="checkbox" ${isReaction ? "checked" : ""}><span>Reaction</span></label>
                    <label class="checkbox-field forge-checkbox-card"><input id="${prefix}-forge-spell-bonus" type="checkbox" ${isBonusAction ? "checked" : ""}><span>Bonus Action</span></label>
                </div>
                <label class="form-field"><span>Casting Time</span><input id="${prefix}-forge-spell-casting-time" type="text" value="${escapeHtml(safeSpell.castingTime)}"></label>
                <label class="form-field"><span>Range</span><input id="${prefix}-forge-spell-range" type="text" value="${escapeHtml(safeSpell.range)}"></label>
                <label class="form-field"><span>Components</span><input id="${prefix}-forge-spell-components" type="text" value="${escapeHtml(safeSpell.components)}"></label>
                <label class="form-field"><span>Duration</span><input id="${prefix}-forge-spell-duration" type="text" value="${escapeHtml(safeSpell.duration)}"></label>
                <label class="form-field"><span>Save / Attack</span><input id="${prefix}-forge-spell-save-attack" type="text" value="${escapeHtml(safeSpell.saveOrAttack)}"></label>
                <label class="form-field"><span>Source</span><input id="${prefix}-forge-spell-source" type="text" value="${escapeHtml(safeSpell.source)}"></label>
                <label class="form-field forge-spell-editor-wide"><span>Page Ref</span><input id="${prefix}-forge-spell-page" type="text" value="${escapeHtml(safeSpell.pageRef)}"></label>

                <label class="checkbox-field forge-checkbox-card forge-spell-editor-wide"><input id="${prefix}-forge-spell-show-action" type="checkbox" ${safeSpell.showAsAction === true ? "checked" : ""}><span>Im Aktionen-Tab anzeigen</span></label>
                <label class="form-field"><span>Aktionstyp</span><select id="${prefix}-forge-spell-action-type">
                    <option value="action"${inferSpellActionType(safeSpell) === "action" ? " selected" : ""}>Aktion</option>
                    <option value="bonus"${inferSpellActionType(safeSpell) === "bonus" ? " selected" : ""}>Bonusaktion</option>
                    <option value="reaction"${inferSpellActionType(safeSpell) === "reaction" ? " selected" : ""}>Reaktion</option>
                    <option value="special"${inferSpellActionType(safeSpell) === "special" ? " selected" : ""}>Sonstiges</option>
                </select></label>
                ${createUsageEditorFieldsHtml(prefix, safeSpell, "spell", "forge-spell-editor-wide")}
                <label class="form-field forge-spell-editor-wide"><span>Description</span><textarea id="${prefix}-forge-spell-description" rows="5">${escapeHtml(safeSpell.description || safeSpell.notes)}</textarea></label>
            </div>
            <div class="forge-spell-editor-actions">
                <button type="button" onclick="saveForgeSpell('${prefix}', '${safeSpell.id}')">Spell speichern</button>
                <button type="button" onclick="cancelForgeSpellEditor('${prefix}')">Abbrechen</button>
            </div>
        </section>
    `;
}

function renderForgeSpellManager(prefix) {
    const managerElement = document.querySelector(`#${prefix}-spell-manager`);

    if (managerElement === null) {
        return;
    }

    const draft = getForgeSpellcastingDraft(prefix);
    const newDraftSpellId = activeForgeSpellEditor !== null && activeForgeSpellEditor.prefix === prefix && activeForgeSpellEditor.isNewDraft === true
        ? activeForgeSpellEditor.spellId
        : null;
    const newDraftSpell = newDraftSpellId !== null && activeForgeSpellEditor !== null && activeForgeSpellEditor.draftSpell !== undefined
        ? activeForgeSpellEditor.draftSpell
        : null;
    const listedSpells = draft.spells;
    const groupedSpells = groupSpellsByLevel(listedSpells);
    const levelGroups = [];

    for (let level = 0; level <= 9; level += 1) {
        const html = createForgeSpellLevelGroupHtml(prefix, level, groupedSpells[level] || []);

        if (html !== "") {
            levelGroups.push(html);
        }
    }

    managerElement.innerHTML = `
        <div class="forge-spell-manager-header">
            <div>
                <p class="section-eyebrow">Zauberliste</p>

            </div>
            <button type="button" class="forge-spell-add-button forge-add-button" onclick="addForgeSpell('${prefix}')">Spell hinzufügen</button>
        </div>
        <div class="forge-spell-list">
            ${createForgeSpellDraftGroupHtml(prefix, newDraftSpell)}
            ${levelGroups.length > 0 ? levelGroups.join("") : `<p class="detail-placeholder-text">Noch keine strukturierten Spells eingetragen.</p>`}
        </div>
    `;
}



// ============================================================
// Gemeinsame Nutzungs-/Verbrauchslogik
// ============================================================

const usageResetLabels = {
    none: "Keine begrenzte Nutzung",
    shortRest: "Kurze Rast",
    longRest: "Lange Rast",
    encounter: "Encounter",
    round: "Runde",
    turn: "Zug",
    charges: "Aufladungen / Charges",
    manual: "Manuell"
};

const usageResetShortLabels = {
    none: "",
    shortRest: "pro KR",
    longRest: "pro LR",
    encounter: "pro Enc.",
    round: "pro Runde",
    turn: "pro Zug",
    charges: "Ladungen",
    manual: "manuell"
};

function getSafeUsageReset(value) {
    if (value === "shortRest" || value === "longRest" || value === "encounter" || value === "round" || value === "turn" || value === "charges" || value === "manual") {
        return value;
    }

    const text = getSafeOptionalString(value).toLowerCase();

    if (text.includes("long rest") || text.includes("lange rast") || text.includes("per day") || text.includes("/day") || text.includes("once per day") || text.includes("daily") || text === "lr") {
        return "longRest";
    }

    if (text.includes("short rest") || text.includes("kurze rast") || text === "kr" || text === "sr") {
        return "shortRest";
    }

    if (text.includes("encounter") || text.includes("begegnung") || text.includes("scene") || text.includes("szene")) {
        return "encounter";
    }

    if (text.includes("round") || text.includes("runde")) {
        return "round";
    }

    if (text.includes("turn") || text.includes("zug")) {
        return "turn";
    }

    if (text.includes("charge") || text.includes("ladung")) {
        return "charges";
    }

    if (text.includes("recharge") || text.includes("auflad") || text.includes("manual") || text.includes("manuell")) {
        return "manual";
    }

    return "none";
}

function inferUsageResetFromText(usageText) {
    return getSafeUsageReset(usageText);
}

function inferUsageMaxFromText(usageText) {
    const text = getSafeOptionalString(usageText);
    const match = text.match(/^\s*(\d+)\s*(?:\/|per\b|x\b|charges?\b|ladungen?\b)/i);

    if (match === null) {
        return 0;
    }

    return clampNumber(Number(match[1]), 0, 12);
}

function getUsageMax(item) {
    const explicitMax = getSafeNonNegativeInteger(item.usageMax, 0);

    if (explicitMax > 0) {
        return clampNumber(explicitMax, 0, 12);
    }

    return inferUsageMaxFromText(item.usage);
}

function getUsageReset(item) {
    const explicitReset = getSafeUsageReset(item.usageReset);

    if (explicitReset !== "none") {
        return explicitReset;
    }

    return inferUsageResetFromText(item.usage);
}

function getAvailableUsageCount(item) {
    const max = getUsageMax(item);

    if (max <= 0) {
        return 0;
    }

    return Math.max(0, max - clampNumber(Number(item.used || 0), 0, max));
}

function createUsageResetOptionsHtml(selectedValue) {
    const safeSelected = getSafeUsageReset(selectedValue);

    return Object.keys(usageResetLabels).map(function(key) {
        return `<option value="${key}"${key === safeSelected ? " selected" : ""}>${usageResetLabels[key]}</option>`;
    }).join("");
}

function createUsageEditorFieldsHtml(prefix, item, baseId, extraClassName = "") {
    const max = getUsageMax(item);
    const reset = getUsageReset(item);

    return `
        <div class="forge-usage-editor ${extraClassName}">
            <label class="form-field"><span>Nutzungen</span><input id="${prefix}-forge-${baseId}-usage-max" type="number" min="0" max="12" value="${max}"></label>
            <label class="form-field"><span>Erneuert sich</span><select id="${prefix}-forge-${baseId}-usage-reset">${createUsageResetOptionsHtml(reset)}</select></label>
        </div>
    `;
}

function createUsageTextFromFields(max, reset) {
    const count = clampNumber(Number(max || 0), 0, 12);
    const safeReset = getSafeUsageReset(reset);

    if (count <= 0 || safeReset === "none") {
        return "";
    }

    if (safeReset === "shortRest") {
        return `${count} / Short Rest`;
    }

    if (safeReset === "longRest") {
        return `${count} / Long Rest`;
    }

    if (safeReset === "encounter") {
        return `${count} / Encounter`;
    }

    if (safeReset === "round") {
        return `${count} / Round`;
    }

    if (safeReset === "turn") {
        return `${count} / Turn`;
    }

    if (safeReset === "charges") {
        return `${count} Charges`;
    }

    if (safeReset === "manual") {
        return `${count} / Manual`;
    }

    return "";
}


function resetUsageCountersForCard(card, resetTypes) {
    if (card === null || Array.isArray(resetTypes) === false || resetTypes.length === 0) {
        return;
    }

    const shouldReset = function(item) {
        return resetTypes.includes(getUsageReset(item));
    };

    const actions = getCardActions(card).map(function(action) {
        return shouldReset(action) ? createCardAction({ ...action, used: 0 }, 0) : action;
    });
    card.actions = actions;

    const traits = getCardTraits(card).map(function(trait) {
        return shouldReset(trait) ? createCardTrait({ ...trait, used: 0 }, 0) : trait;
    });
    card.traits = traits;

    const spellcasting = getCardSpellcasting(card);
    spellcasting.spells = spellcasting.spells.map(function(spell) {
        return shouldReset(spell) ? createSpellObject({ ...spell, used: 0 }, 0) : spell;
    });
    card.spellcasting = spellcasting;
}

const cardActionTypeLabels = {
    action: "Aktionen",
    bonus: "Bonusaktionen",
    reaction: "Reaktionen",
    special: "Sonstiges"
};

const cardActionTypeSingularLabels = {
    action: "Aktion",
    bonus: "Bonusaktion",
    reaction: "Reaktion",
    special: "Sonstiges"
};

function getSafeCardActionType(value) {
    if (value === "action" || value === "bonus" || value === "reaction" || value === "special") {
        return value;
    }

    return "action";
}

function createCardAction(rawAction = {}, fallbackIndex = 0) {
    return {
        id: getSafeOptionalString(rawAction.id) || `action-${Date.now()}-${fallbackIndex}-${Math.random().toString(36).slice(2, 8)}`,
        name: getSafeOptionalString(rawAction.name) || "Neue Aktion",
        type: getSafeCardActionType(rawAction.type),
        usage: getSafeOptionalString(rawAction.usage),
        usageMax: getSafeNonNegativeInteger(rawAction.usageMax, inferUsageMaxFromText(rawAction.usage)),
        usageReset: getSafeUsageReset(rawAction.usageReset) !== "none" ? getSafeUsageReset(rawAction.usageReset) : inferUsageResetFromText(rawAction.usage),
        sourceType: getSafeOptionalString(rawAction.sourceType) || "action",
        sourceId: getSafeOptionalString(rawAction.sourceId),
        sourceLabel: getSafeOptionalString(rawAction.sourceLabel),
        attack: getSafeOptionalString(rawAction.attack),
        save: getSafeOptionalString(rawAction.save),
        range: getSafeOptionalString(rawAction.range),
        damage: getSafeOptionalString(rawAction.damage),
        trigger: getSafeOptionalString(rawAction.trigger),
        description: getSafeOptionalString(rawAction.description),
        used: clampNumber(Number(rawAction.used || 0), 0, 20)
    };
}

function getActionTextFromStructuredAction(action) {
    const details = [];

    if (action.usage !== "") {
        details.push(action.usage);
    }

    if (action.attack !== "") {
        details.push(action.attack);
    }

    if (action.save !== "") {
        details.push(action.save);
    }

    if (action.range !== "") {
        details.push(action.range);
    }

    if (action.damage !== "") {
        details.push(`Hit: ${action.damage}`);
    }

    if (action.trigger !== "") {
        details.push(`Trigger: ${action.trigger}`);
    }

    if (action.description !== "") {
        details.push(action.description);
    }

    return `${action.name}. ${details.join("; ")}`.trim();
}

function getSafeCardActions(value) {
    if (Array.isArray(value) === false) {
        return [];
    }

    return value
        .slice(0, importSecurityLimits.maxActionsPerCard)
        .filter(function(action) { return action !== null && typeof action === "object"; })
        .map(function(action, index) { return createCardAction(action, index); })
        .filter(function(action) { return action.name.trim() !== ""; });
}

function getCardActions(card) {
    if (card === null) {
        return [];
    }

    return getSafeCardActions(card.actions);
}


function createActionFromTrait(trait) {
    return createCardAction({
        id: `trait-${trait.id}`,
        name: trait.name,
        type: trait.actionType,
        usage: trait.usage,
        usageMax: trait.usageMax,
        usageReset: trait.usageReset,
        used: trait.used,
        attack: trait.attack,
        save: trait.save,
        range: trait.range,
        damage: trait.damage,
        trigger: trait.trigger,
        description: trait.actionSummary || trait.description,
        sourceType: "trait",
        sourceId: trait.id,
        sourceLabel: "Trait"
    });
}

function inferSpellActionType(spell) {
    const timeText = getSafeOptionalString(spell.castingTime).toLowerCase();

    if (timeText.includes("reaction")) {
        return "reaction";
    }

    if (timeText.includes("bonus")) {
        return "bonus";
    }

    if (timeText.includes("action")) {
        return "action";
    }

    return getSafeCardActionType(spell.actionType);
}

function createActionFromSpell(spell) {
    return createCardAction({
        id: `spell-${spell.id}`,
        name: spell.name,
        type: inferSpellActionType(spell),
        usageMax: spell.usageMax,
        usageReset: spell.usageReset,
        used: spell.used,
        usage: createUsageTextFromFields(spell.usageMax, spell.usageReset),
        save: spell.saveOrAttack,
        range: spell.range,
        trigger: /reaction/i.test(spell.castingTime) ? spell.castingTime : "",
        description: spell.description || spell.notes,
        sourceType: "spell",
        sourceId: spell.id,
        sourceLabel: "Spell"
    });
}

function getCardActionReferences(card) {
    const directActions = getCardActions(card).map(function(action) {
        return createCardAction({ ...action, sourceType: action.sourceType || "action", sourceId: action.sourceId || action.id }, 0);
    });
    const traitActions = getCardTraits(card)
        .filter(function(trait) { return trait.showAsAction === true; })
        .map(createActionFromTrait);
    const spellActions = getCardSpellcasting(card).spells
        .filter(function(spell) { return spell.showAsAction === true; })
        .map(createActionFromSpell);
    const itemActions = getInventoryCards(card)
        .filter(function(item) { return item.showAsAction === true; })
        .map(createActionFromInventoryItem);

    return directActions.concat(traitActions, spellActions, itemActions);
}

function parseJsonValue(textValue, fallbackValue) {
    try {
        return JSON.parse(textValue);
    } catch (error) {
        return fallbackValue;
    }
}

function getForgeActionsDraft(prefix) {
    const actionsElement = document.querySelector(`#${prefix}-actions-text`);

    if (actionsElement === null || actionsElement.value.trim() === "") {
        return [];
    }

    return getSafeCardActions(parseJsonValue(actionsElement.value.trim(), []), "");
}

function setForgeActions(prefix, actions) {
    const actionsElement = document.querySelector(`#${prefix}-actions-text`);

    if (actionsElement === null) {
        return;
    }

    const safeActions = getSafeCardActions(actions, "");
    actionsElement.value = JSON.stringify(safeActions);
}

function writeActionsToForge(prefix, card) {
    setForgeActions(prefix, getCardActions(card));
    renderForgeActionManager(prefix);
}

function commitForgeActionsIfEditing(prefix) {
    if (prefix !== "edit-card") {
        return;
    }

    const card = getEditFormCard();

    if (card === null) {
        return;
    }

    card.actions = getForgeActionsDraft(prefix);

    saveAndBroadcastAppState();
    renderCardDetailPanel(getFocusedCard(getHandCards(), getActiveCard(getHandCards())));
}

function hasOpenForgeActionEditor() {
    return activeForgeActionEditor !== null;
}

function scrollActiveForgeActionEditorIntoView(prefix) {
    window.setTimeout(function() {
        const editorElement = document.querySelector(`#${prefix}-action-manager .forge-action-editor`);

        if (editorElement !== null) {
            editorElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }

        const nameElement = document.querySelector(`#${prefix}-forge-action-name`);

        if (nameElement !== null) {
            nameElement.focus({ preventScroll: true });
            nameElement.select();
        }
    }, 0);
}

function openForgeActionEditor(prefix, actionId) {
    keepCardForgeOpenForInternalAction();
    activeForgeActionEditor = {
        prefix: prefix,
        actionId: actionId || "",
        isNewDraft: false
    };
    renderForgeActionManager(prefix);
    scrollActiveForgeActionEditorIntoView(prefix);
}

function addForgeAction(prefix) {
    keepCardForgeOpenForInternalAction();
    const action = createCardAction({
        name: "Neue Aktion",
        type: "action"
    }, Date.now());

    activeForgeActionEditor = {
        prefix: prefix,
        actionId: action.id,
        isNewDraft: true,
        draftAction: action
    };
    renderForgeActionManager(prefix);
    scrollActiveForgeActionEditorIntoView(prefix);
}

function cancelForgeActionEditor(prefix, options = {}) {
    if (options.skipClickAwayGuard !== true) {
        keepCardForgeOpenForInternalAction();
    }

    activeForgeActionEditor = null;
    renderForgeActionManager(prefix);
}

function deleteForgeAction(prefix, actionId) {
    keepCardForgeOpenForInternalAction();
    const actions = getForgeActionsDraft(prefix);
    const actionToDelete = actions.find(function(action) { return action.id === actionId; });
    const actionName = actionToDelete !== undefined ? actionToDelete.name : "diese Aktion";

    if (window.confirm(`Aktion „${actionName}“ löschen?`) === false) {
        return;
    }

    setForgeActions(prefix, actions.filter(function(action) { return action.id !== actionId; }));
    activeForgeActionEditor = null;
    renderForgeActionManager(prefix);
    commitForgeActionsIfEditing(prefix);
}

function saveForgeAction(prefix, actionId) {
    keepCardForgeOpenForInternalAction();
    const actions = getForgeActionsDraft(prefix);
    const nameElement = document.querySelector(`#${prefix}-forge-action-name`);
    const typeElement = document.querySelector(`#${prefix}-forge-action-type`);
    const usageMaxElement = document.querySelector(`#${prefix}-forge-action-usage-max`);
    const usageResetElement = document.querySelector(`#${prefix}-forge-action-usage-reset`);
    const attackElement = document.querySelector(`#${prefix}-forge-action-attack`);
    const saveElement = document.querySelector(`#${prefix}-forge-action-save`);
    const rangeElement = document.querySelector(`#${prefix}-forge-action-range`);
    const damageElement = document.querySelector(`#${prefix}-forge-action-damage`);
    const triggerElement = document.querySelector(`#${prefix}-forge-action-trigger`);
    const descriptionElement = document.querySelector(`#${prefix}-forge-action-description`);

    if (nameElement === null || typeElement === null) {
        return;
    }

    const name = nameElement.value.trim();

    if (name === "") {
        nameElement.focus();
        return;
    }

    const existingIndex = actions.findIndex(function(action) { return action.id === actionId; });
    const previousAction = existingIndex >= 0
        ? actions[existingIndex]
        : activeForgeActionEditor !== null && activeForgeActionEditor.prefix === prefix && activeForgeActionEditor.actionId === actionId && activeForgeActionEditor.draftAction !== undefined
            ? activeForgeActionEditor.draftAction
            : {};
    const nextAction = createCardAction({
        id: previousAction.id || actionId,
        name: name,
        type: typeElement.value,
        usageMax: usageMaxElement !== null ? getSafeNonNegativeInteger(usageMaxElement.value, 0) : 0,
        usageReset: usageResetElement !== null ? getSafeUsageReset(usageResetElement.value) : "none",
        usage: createUsageTextFromFields(usageMaxElement !== null ? usageMaxElement.value : 0, usageResetElement !== null ? usageResetElement.value : "none"),
        attack: attackElement !== null ? attackElement.value.trim() : "",
        save: saveElement !== null ? saveElement.value.trim() : "",
        range: rangeElement !== null ? rangeElement.value.trim() : "",
        damage: damageElement !== null ? damageElement.value.trim() : "",
        trigger: triggerElement !== null ? triggerElement.value.trim() : "",
        description: descriptionElement !== null ? descriptionElement.value.trim() : "",
        used: previousAction.used || 0
    }, existingIndex >= 0 ? existingIndex : actions.length);

    if (existingIndex >= 0) {
        actions[existingIndex] = nextAction;
    } else {
        actions.push(nextAction);
    }

    setForgeActions(prefix, actions);
    activeForgeActionEditor = null;
    renderForgeActionManager(prefix);
    commitForgeActionsIfEditing(prefix);
}

function createForgeActionRowHtml(prefix, action) {
    const editorIsOpen = activeForgeActionEditor !== null && activeForgeActionEditor.prefix === prefix && activeForgeActionEditor.actionId === action.id;
    const label = cardActionTypeSingularLabels[action.type] || "Aktion";

    return `
        <div class="forge-action-row ${editorIsOpen ? "forge-action-row-active" : ""}">
            <span class="forge-action-type-pill forge-action-type-${escapeHtml(action.type)}">${label}</span>
            <span class="forge-action-name">${escapeHtml(action.name)}</span>
            <div class="forge-action-row-actions">
                <button class="forge-action-edit-button" type="button" onclick="openForgeActionEditor('${prefix}', '${action.id}')">Edit</button>
                <button class="forge-action-delete-button" type="button" onclick="deleteForgeAction('${prefix}', '${action.id}')" title="Aktion löschen" aria-label="${escapeHtml(action.name)} löschen">×</button>
            </div>
        </div>
        ${editorIsOpen ? createForgeActionEditorHtml(prefix, action) : ""}
    `;
}

function createForgeActionDraftGroupHtml(prefix, action) {
    if (action === undefined || action === null) {
        return "";
    }

    return `
        <section class="forge-action-draft-group" aria-label="Neue Aktion">
            <div class="forge-action-draft-header">
                <p class="section-eyebrow">Neue Aktion</p>
                <span>Entwurf wird erst nach „Aktion speichern“ einsortiert.</span>
            </div>
            ${createForgeActionEditorHtml(prefix, action)}
        </section>
    `;
}

function createForgeActionGroupHtml(prefix, type, actions) {
    if (actions.length === 0) {
        return "";
    }

    return `
        <section class="forge-action-group">
            <h5>${cardActionTypeLabels[type]}</h5>
            <div class="forge-action-row-list">
                ${actions.map(function(action) { return createForgeActionRowHtml(prefix, action); }).join("")}
            </div>
        </section>
    `;
}

function createForgeActionEditorHtml(prefix, action) {
    const safeAction = action || createCardAction({ name: "", type: "action" }, 0);

    return `
        <section class="forge-action-editor forge-action-inline-editor" aria-label="Aktion bearbeiten">
            <div class="forge-action-editor-header">
                <p class="section-eyebrow">${activeForgeActionEditor !== null && activeForgeActionEditor.isNewDraft === true ? "Neue Aktion" : "Aktion bearbeiten"}</p>
                <h5>${activeForgeActionEditor !== null && activeForgeActionEditor.isNewDraft === true ? "Neue Aktion anlegen" : escapeHtml(safeAction.name)}</h5>
            </div>
            <div class="forge-action-editor-grid">
                <label class="form-field forge-action-editor-wide"><span>Name</span><input id="${prefix}-forge-action-name" type="text" value="${escapeHtml(safeAction.name)}"></label>
                <label class="form-field"><span>Typ</span><select id="${prefix}-forge-action-type">
                    <option value="action"${safeAction.type === "action" ? " selected" : ""}>Aktion</option>
                    <option value="bonus"${safeAction.type === "bonus" ? " selected" : ""}>Bonusaktion</option>
                    <option value="reaction"${safeAction.type === "reaction" ? " selected" : ""}>Reaktion</option>
                    <option value="special"${safeAction.type === "special" ? " selected" : ""}>Sonstiges</option>
                </select></label>
                ${createUsageEditorFieldsHtml(prefix, safeAction, "action", "forge-action-editor-wide")}
                <label class="form-field"><span>Attack</span><input id="${prefix}-forge-action-attack" type="text" placeholder="+5 to hit" value="${escapeHtml(safeAction.attack)}"></label>
                <label class="form-field"><span>Save</span><input id="${prefix}-forge-action-save" type="text" placeholder="DC 13 WIS" value="${escapeHtml(safeAction.save)}"></label>
                <label class="form-field"><span>Reichweite / Ziel</span><input id="${prefix}-forge-action-range" type="text" placeholder="Reach 5 ft., 30 ft., one target …" value="${escapeHtml(safeAction.range)}"></label>
                <label class="form-field"><span>Schaden / Effekt</span><input id="${prefix}-forge-action-damage" type="text" placeholder="1d8+3 piercing …" value="${escapeHtml(safeAction.damage)}"></label>
                <label class="form-field forge-action-editor-wide"><span>Trigger</span><input id="${prefix}-forge-action-trigger" type="text" placeholder="Nur für Reaktionen, falls relevant" value="${escapeHtml(safeAction.trigger)}"></label>
                <label class="form-field forge-action-editor-wide"><span>Beschreibung</span><textarea id="${prefix}-forge-action-description" rows="5">${escapeHtml(safeAction.description)}</textarea></label>
            </div>
            <div class="forge-action-editor-actions">
                <button type="button" onclick="saveForgeAction('${prefix}', '${safeAction.id}')">Aktion speichern</button>
                <button type="button" onclick="cancelForgeActionEditor('${prefix}')">Abbrechen</button>
            </div>
        </section>
    `;
}

function renderForgeActionManager(prefix) {
    const managerElement = document.querySelector(`#${prefix}-action-manager`);

    if (managerElement === null) {
        return;
    }

    const actions = getForgeActionsDraft(prefix);
    const newDraftActionId = activeForgeActionEditor !== null && activeForgeActionEditor.prefix === prefix && activeForgeActionEditor.isNewDraft === true
        ? activeForgeActionEditor.actionId
        : null;
    const newDraftAction = newDraftActionId !== null && activeForgeActionEditor !== null && activeForgeActionEditor.draftAction !== undefined
        ? activeForgeActionEditor.draftAction
        : null;
    const actionTypes = ["action", "bonus", "reaction", "special"];
    const groups = actionTypes.map(function(type) {
        return createForgeActionGroupHtml(prefix, type, actions.filter(function(action) { return action.type === type; }));
    }).filter(function(html) { return html !== ""; });

    managerElement.innerHTML = `
        <div class="forge-action-manager-header">
            <div>
                <p class="section-eyebrow">Aktionsliste</p>
                
            </div>
            <button type="button" class="forge-action-add-button forge-add-button" onclick="addForgeAction('${prefix}')">Aktion hinzufügen</button>
        </div>
        <div class="forge-action-list">
            ${createForgeActionDraftGroupHtml(prefix, newDraftAction)}
            ${groups.length > 0 ? groups.join("") : `<p class="detail-placeholder-text">Noch keine strukturierten Aktionen eingetragen.</p>`}
        </div>
    `;
}

function getSafeCardType(value) {
    if (value === "player" || value === "npc" || value === "monster") {
        return value;
    }

    return "monster";
}

function getSafeHpVisibility(value) {
    if (
        value === "full" ||
        value === "bar" ||
        value === "descriptive" ||
        value === "hidden"
    ) {
        return value;
    }

    return "full";
}

function getSafeDetailTab(value) {
    if (
        value === "values" ||
        value === "actions" ||
        value === "traits" ||
        value === "spells" ||
        value === "notes" ||
        value === "inventory"
    ) {
        return value;
    }

    return "values";
}

function getSafeDmFeedTab(value) {
    if (value === "chat") {
        return "chat";
    }

    return "log";
}

function getSafeConditions(value) {
    if (Array.isArray(value) === false) {
        return [];
    }

    const safeConditions = [];

    for (const condition of value) {
        if (typeof condition !== "string") {
            continue;
        }

        const canonicalCondition = getCanonicalConditionName(condition.toLowerCase().trim());

        if (
            availableConditions.includes(canonicalCondition) &&
            safeConditions.includes(canonicalCondition) === false
        ) {
            safeConditions.push(canonicalCondition);
        }
    }

    return safeConditions;
}

function getSafeCombatLogMessages(value) {
    if (Array.isArray(value) === false) {
        return [];
    }

    const safeEvents = [];

    for (const rawEvent of value) {
        if (rawEvent === null || typeof rawEvent !== "object") {
            continue;
        }

        const createdAt = getSafeString(rawEvent.createdAt, new Date().toISOString());
        const message = getSafeString(rawEvent.message, getSafeString(rawEvent.text, "Unbekannte Aktion."));
        const safeCreatedAt = Number.isNaN(Date.parse(createdAt)) ? new Date().toISOString() : createdAt;

        safeEvents.push({
            id: getSafeString(rawEvent.id, createGameEventId()),
            type: getSafeString(rawEvent.type, "system"),
            actorParticipantId: rawEvent.actorParticipantId ?? null,
            sourceCardId: rawEvent.sourceCardId ?? null,
            targetCardId: rawEvent.targetCardId ?? null,
            targetCardIds: Array.isArray(rawEvent.targetCardIds) ? [...rawEvent.targetCardIds] : [],
            amount: Number.isFinite(rawEvent.amount) ? rawEvent.amount : null,
            condition: typeof rawEvent.condition === "string" ? rawEvent.condition : null,
            before: rawEvent.before ?? null,
            after: rawEvent.after ?? null,
            metadata: rawEvent.metadata && typeof rawEvent.metadata === "object" ? rawEvent.metadata : {},
            createdAt: safeCreatedAt,
            message,
            time: getSafeString(rawEvent.time, new Date(safeCreatedAt).toLocaleTimeString("de-DE", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            })),
            text: message
        });
    }

    const maximumAgeMs = eventLogRetention.maximumAgeDays * 24 * 60 * 60 * 1000;
    const oldestAllowedTimestamp = Date.now() - maximumAgeMs;

    return safeEvents.filter(function(event) {
        const timestamp = Date.parse(event.createdAt);
        return Number.isNaN(timestamp) || timestamp >= oldestAllowedTimestamp;
    }).slice(0, eventLogRetention.maximumEvents);
}


function getSafeMirielBoardDurationMode(value) {
    if (value === "short" || value === "normal" || value === "long") {
        return value;
    }

    return "normal";
}

function getSafeMirielBoardContentMode(value) {
    if (value === "manual" || value === "overview") {
        return value;
    }

    return "overview";
}

function getSafeMirielBoardManualTextSize(value) {
    if (value === "small" || value === "normal" || value === "large" || value === "dramatic") {
        return value;
    }

    return "normal";
}

function getSafeMirielBoardManualTextPosition(value) {
    if (value === "top" || value === "middle" || value === "bottom") {
        return value;
    }

    return "bottom";
}

function getSafeMirielBoardAnnouncement(value) {
    if (value === null || typeof value !== "object") {
        return null;
    }

    return {
        roundNumber: getSafePositiveInteger(value.roundNumber, 1),
        activeName: getSafeString(value.activeName, ""),
        isNewRound: value.isNewRound === true,
        type: getSafeOptionalString(value.type),
        createdAt: getSafeOptionalString(value.createdAt)
    };
}

function getVisibleHealthAlertsForPublicBoard(publicCards) {
    const priority = {
        critical: 1,
        severe: 2,
        wounded: 3,
        bruised: 4
    };

    return publicCards
        .filter(function(publicCard) {
            const state = publicCard.hp.health.state;
            return publicCard.hp.mode !== "hidden" && Object.prototype.hasOwnProperty.call(priority, state) === true;
        })
        .sort(function(a, b) {
            return priority[a.hp.health.state] - priority[b.hp.health.state];
        })
        .slice(0, 3);
}

function getSafeMirielBoardPersistentMode(value) {
    if (value === "manual" || value === "initiative" || value === "off") {
        return value;
    }

    return "off";
}

function getSafeMirielBoardPersistentModeFromEncounter(encounterData) {
    if (encounterData === null || typeof encounterData !== "object") {
        return "off";
    }

    const mode = getSafeMirielBoardPersistentMode(encounterData.mirielBoardPersistentMode);

    if (mode === "manual" && hasEncounterManualBoardContent(encounterData) !== true) {
        return "off";
    }

    return mode;
}

function hasEncounterManualBoardContent(encounterData) {
    if (encounterData === null || typeof encounterData !== "object") {
        return false;
    }

    const imageData = getSafeString(encounterData.mirielBoardManualImageData, "");
    const manualText = getSafeString(encounterData.mirielBoardManualText, "");

    return imageData !== "" || manualText.trim() !== "";
}

function clearMirielBoardTransientAnnouncement() {
    gameState.presentation.mirielBoard.triggerId = "";
    gameState.presentation.mirielBoard.announcement = null;
    lastRenderedMirielBoardTriggerId = "";

    if (mirielBoardAutoHideTimer !== null) {
        window.clearTimeout(mirielBoardAutoHideTimer);
        mirielBoardAutoHideTimer = null;
    }
}


function hasPreparedEncounterCards() {
    return Array.isArray(gameState.cards) === true && gameState.cards.length > 0;
}

function hasEncounterHandCards() {
    return getHandCards().length > 0;
}

function resetEncounterStartGateState(options = {}) {
    const shouldResetTurn = options.resetTurn !== false;
    const shouldClearLog = options.clearLog === true;

    gameState.encounter.isStarted = false;

    if (shouldResetTurn === true) {
        setCurrentTurnIndex(0);
        gameState.encounter.roundNumber = 1;
    }

    clearManualPublicSelection();
    clearMirielBoardTransientAnnouncement();

    if (shouldClearLog === true) {
        gameState.eventLog = [];
    }
}

function ensureEncounterStartGateConsistency() {
    const handCards = getHandCards();

    if (handCards.length === 0 && gameState.encounter.isStarted === true) {
        resetEncounterStartGateState({ resetTurn: true });
    }

    if (gameState.encounter.isStarted !== true) {
        setCurrentTurnIndex(0);
        gameState.encounter.roundNumber = 1;
    }
}

function getCurrentMirielBoardAnnouncement(activeCard) {
    return {
        roundNumber: gameState.encounter.roundNumber,
        activeName: activeCard !== null ? activeCard.publicName || activeCard.name : "",
        isNewRound: false,
        createdAt: new Date().toISOString()
    };
}

function triggerMirielBoardForTurn(isNewRound) {
    if (gameState.presentation.mirielBoard.persistentMode === "manual" && hasMirielBoardManualContent() === true) {
        return;
    }

    const shouldShowNewRoundCall = isNewRound === true && gameState.presentation.mirielBoard.newRoundCallEnabled === true;
    const shouldShowTurnPreview = gameState.presentation.mirielBoard.autoTurnEnabled === true;

    if (shouldShowNewRoundCall !== true && shouldShowTurnPreview !== true) {
        return;
    }

    const activeCard = getActiveCard(getHandCards());

    gameState.presentation.mirielBoard.triggerId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    gameState.presentation.mirielBoard.announcement = {
        roundNumber: gameState.encounter.roundNumber,
        activeName: activeCard !== null ? activeCard.publicName || activeCard.name : "",
        isNewRound: shouldShowNewRoundCall,
        createdAt: new Date().toISOString()
    };
}

function setMirielBoardPersistentMode(mode) {
    const safeMode = getSafeMirielBoardPersistentMode(mode);

    if (safeMode === "manual" && hasMirielBoardManualContent() !== true) {
        alert("Wähle zuerst ein Bild oder schreibe Text für die eigene Tafel.");
        return;
    }

    gameState.presentation.mirielBoard.persistentMode = safeMode;
    shouldAnimateMirielBoardOnNextRender = safeMode !== "off";
    clearMirielBoardTransientAnnouncement();
    saveAndBroadcastAppState();
    renderCards();
}

function hasMirielBoardManualContent() {
    return gameState.presentation.mirielBoard.manualImageData !== "" || gameState.presentation.mirielBoard.manualText.trim() !== "";
}

function ensureMirielBoardPersistentModeIsValid() {
    if (gameState.presentation.mirielBoard.persistentMode === "manual" && hasMirielBoardManualContent() !== true) {
        gameState.presentation.mirielBoard.persistentMode = "off";
        clearMirielBoardTransientAnnouncement();
    }
}

function toggleMirielBoardAutoTurn(isEnabled) {
    gameState.presentation.mirielBoard.autoTurnEnabled = isEnabled === true;
    saveAndBroadcastAppState();
    renderCards();
}

function setMirielBoardDurationMode(mode) {
    gameState.presentation.mirielBoard.durationMode = getSafeMirielBoardDurationMode(mode);
    saveAndBroadcastAppState();
    renderCards();
}

function toggleMirielBoardNewRoundCall(isEnabled) {
    gameState.presentation.mirielBoard.newRoundCallEnabled = isEnabled === true;
    saveAndBroadcastAppState();
    renderCards();
}

function getMirielBoardCurrentStatusText() {
    const renderState = getMirielBoardRenderState();

    if (renderState.hasNewAutoTrigger === true) {
        return renderState.announcement.isNewRound === true
            ? "Automatischer Rundenruf"
            : "Automatische Initiativefolge";
    }

    if (gameState.presentation.mirielBoard.persistentMode === "manual" && hasMirielBoardManualContent() === true) {
        return "Eigene Tafel";
    }

    if (gameState.presentation.mirielBoard.persistentMode === "initiative") {
        return "Initiativefolge";
    }

    return "Nichts";
}

function updateMirielBoardControls() {
    const modeButtonElements = document.querySelectorAll("[data-miriel-board-persistent-mode]");
    const currentStatusElement = document.querySelector("#miriel-board-current-status");
    const autoCheckboxElement = document.querySelector("#miriel-board-auto-turn-checkbox");
    const durationSelectElement = document.querySelector("#miriel-board-duration-select");
    const newRoundCheckboxElement = document.querySelector("#miriel-board-new-round-checkbox");
    const textElement = document.querySelector("#miriel-board-manual-text");
    const textSizeElement = document.querySelector("#miriel-board-manual-text-size");
    const textPositionElement = document.querySelector("#miriel-board-manual-text-position");
    const hasManualContent = hasMirielBoardManualContent() === true;

    if (currentStatusElement !== null) {
        currentStatusElement.textContent = getMirielBoardCurrentStatusText();
    }

    for (const modeButtonElement of modeButtonElements) {
        const mode = getSafeMirielBoardPersistentMode(modeButtonElement.dataset.mirielBoardPersistentMode);
        const isActive = gameState.presentation.mirielBoard.persistentMode === mode;
        const isManualButton = mode === "manual";

        modeButtonElement.classList.toggle("miriel-board-mode-button-active", isActive);
        modeButtonElement.disabled = isManualButton === true && hasManualContent !== true;
        modeButtonElement.setAttribute("aria-pressed", isActive === true ? "true" : "false");
    }

    if (autoCheckboxElement !== null) {
        autoCheckboxElement.checked = gameState.presentation.mirielBoard.autoTurnEnabled === true;
    }

    if (durationSelectElement !== null) {
        durationSelectElement.value = gameState.presentation.mirielBoard.durationMode;
    }

    if (newRoundCheckboxElement !== null) {
        newRoundCheckboxElement.checked = gameState.presentation.mirielBoard.newRoundCallEnabled === true;
    }

    if (textElement !== null && textElement.value !== gameState.presentation.mirielBoard.manualText) {
        textElement.value = gameState.presentation.mirielBoard.manualText;
    }

    if (textSizeElement !== null) {
        textSizeElement.value = gameState.presentation.mirielBoard.manualTextSize;
    }

    if (textPositionElement !== null) {
        textPositionElement.value = gameState.presentation.mirielBoard.manualTextPosition;
    }

    renderMirielBoardManualPreview();
}

function renderMirielBoardManualPreview() {
    const previewElement = document.querySelector("#miriel-board-manual-preview");

    if (previewElement === null) {
        return;
    }

    previewElement.innerHTML = createMirielBoardManualPreviewHtml();
}

function createMirielBoardManualPreviewHtml() {
    const hasImage = gameState.presentation.mirielBoard.manualImageData !== "";
    const hasText = gameState.presentation.mirielBoard.manualText.trim() !== "";
    const statusText = getMirielBoardCurrentStatusText();

    if (hasImage !== true && hasText !== true) {
        return `
            <div class="miriel-board-manual-preview-empty">
                <span>✧</span>
                <strong>Keine eigene Tafel vorbereitet</strong>
                <small>Wähle ein Bild oder schreibe Text.</small>
                <em>Aktuell sichtbar: ${escapeHtml(statusText)}</em>
            </div>
        `;
    }

    const imageHtml = hasImage === true
        ? `<img src="${escapeHtml(gameState.presentation.mirielBoard.manualImageData)}" alt="${escapeHtml(gameState.presentation.mirielBoard.manualImageName || "Eigene Tafel")}">`
        : "";
    const textHtml = hasText === true
        ? `<div class="miriel-board-manual-preview-text miriel-board-manual-text-${gameState.presentation.mirielBoard.manualTextSize} miriel-board-text-position-${gameState.presentation.mirielBoard.manualTextPosition}">${escapeHtml(gameState.presentation.mirielBoard.manualText).replace(/\n/g, "<br>")}</div>`
        : "";
    const fileHtml = hasImage === true
        ? `<small>Datei: ${escapeHtml(gameState.presentation.mirielBoard.manualImageName || "Eigenes Bild")}</small>`
        : "<small>Nur Text</small>";

    return `
        <div class="miriel-board-manual-preview-stage ${hasImage === true ? "has-image" : "text-only"}">
            ${imageHtml}
            ${textHtml}
        </div>
        <div class="miriel-board-manual-preview-meta">
            <strong>Aktuell sichtbar: ${escapeHtml(statusText)}</strong>
            ${fileHtml}
        </div>
    `;
}

function clearPublicStageSequenceTimer() {
    if (publicStageSequenceTimer !== null) {
        window.clearTimeout(publicStageSequenceTimer);
        publicStageSequenceTimer = null;
    }
}

function getMirielBoardRenderState() {
    ensureMirielBoardPersistentModeIsValid();

    const isEncounterStartAnnouncement = gameState.presentation.mirielBoard.announcement !== null
        && typeof gameState.presentation.mirielBoard.announcement === "object"
        && gameState.presentation.mirielBoard.announcement.type === "encounter-start";
    const blocksAutoTrigger = isEncounterStartAnnouncement !== true
        && gameState.presentation.mirielBoard.persistentMode === "manual"
        && hasMirielBoardManualContent() === true;
    const hasNewAutoTrigger = blocksAutoTrigger !== true
        && gameState.presentation.mirielBoard.triggerId !== ""
        && gameState.presentation.mirielBoard.triggerId !== lastRenderedMirielBoardTriggerId
        && isMirielBoardTriggerFresh() === true;
    const shouldShowBoard = gameState.presentation.mirielBoard.persistentMode !== "off" || hasNewAutoTrigger === true;
    const activeCard = getActiveCard(getHandCards());
    const announcement = hasNewAutoTrigger === true && gameState.presentation.mirielBoard.announcement !== null
        ? gameState.presentation.mirielBoard.announcement
        : getCurrentMirielBoardAnnouncement(activeCard);
    const contentMode = hasNewAutoTrigger === true
        ? "overview"
        : (gameState.presentation.mirielBoard.persistentMode === "manual" && hasMirielBoardManualContent() === true ? "manual" : "overview");
    const persistentModeChangedSinceLastRender = gameState.presentation.mirielBoard.persistentMode !== "off"
        && lastRenderedMirielBoardPersistentMode !== null
        && lastRenderedMirielBoardPersistentMode !== gameState.presentation.mirielBoard.persistentMode;
    const shouldAnimateExit = shouldShowBoard !== true
        && lastRenderedMirielBoardPersistentMode !== null
        && lastRenderedMirielBoardPersistentMode !== "off";

    return {
        hasNewAutoTrigger: hasNewAutoTrigger,
        shouldShowBoard: shouldShowBoard,
        announcement: announcement,
        contentMode: contentMode,
        shouldAnimateEntry: hasNewAutoTrigger === true || shouldAnimateMirielBoardOnNextRender === true || persistentModeChangedSinceLastRender === true,
        shouldAnimateExit: shouldAnimateExit
    };
}

function commitPendingPublicStageAfterMirielBoard() {
    if (publicStagePendingCardId === null) {
        return;
    }

    const stageRailState = capturePublicStageRailState();

    publicStagePresentedCardId = publicStagePendingCardId;
    publicStagePendingCardId = null;

    renderCards();
    playPublicStageRailTransition(stageRailState);
}

function hideMirielBoardAfterAutoPreview() {
    const boardElement = document.querySelector("#miriel-board-overlay");

    if (boardElement === null) {
        return;
    }

    lastRenderedMirielBoardTriggerId = gameState.presentation.mirielBoard.triggerId;
    gameState.presentation.mirielBoard.announcement = null;

    if (gameState.presentation.mirielBoard.persistentMode !== "off") {
        renderCards();
        return;
    }

    boardElement.classList.remove("miriel-board-visible");
    boardElement.classList.add("miriel-board-hiding");

    clearPublicStageSequenceTimer();
    publicStageSequenceTimer = window.setTimeout(function() {
        publicStageSequenceTimer = null;
        commitPendingPublicStageAfterMirielBoard();
    }, 980);
}

function getMirielBoardAutoDisplayDuration(cardCount, isNewRound) {
    const safeCardCount = Math.max(0, Number(cardCount) || 0);
    const newRoundBonus = isNewRound === true ? 1 : 0;

    if (gameState.presentation.mirielBoard.durationMode === "short") {
        return Math.round(clampNumber(2600 + (safeCardCount * 40) + (newRoundBonus * 250), 2600, 3600));
    }

    if (gameState.presentation.mirielBoard.durationMode === "long") {
        return Math.round(clampNumber(5600 + (safeCardCount * 75) + (newRoundBonus * 500), 5600, 7600));
    }

    return Math.round(clampNumber(3900 + (safeCardCount * 55) + (newRoundBonus * 350), 3900, 5200));
}


function isMirielBoardTriggerFresh() {
    if (gameState.presentation.mirielBoard.triggerId === "") {
        return false;
    }

    const announcement = gameState.presentation.mirielBoard.announcement !== null && typeof gameState.presentation.mirielBoard.announcement === "object"
        ? gameState.presentation.mirielBoard.announcement
        : null;
    const createdAtText = announcement !== null ? getSafeOptionalString(announcement.createdAt) : "";

    if (createdAtText === "") {
        return false;
    }

    const createdAtTime = Date.parse(createdAtText);

    if (Number.isFinite(createdAtTime) === false) {
        return false;
    }

    const age = Date.now() - createdAtTime;

    if (age < 0) {
        return true;
    }

    const cardCount = getHandCards().length;
    const isNewRound = announcement !== null && announcement.isNewRound === true;
    const readableDuration = getMirielBoardAutoDisplayDuration(cardCount, isNewRound);
    const tolerance = 900;

    return age <= readableDuration + tolerance;
}

function scheduleMirielBoardAutoHide(shouldAutoShow, cardCount, isNewRound) {
    if (mirielBoardAutoHideTimer !== null) {
        window.clearTimeout(mirielBoardAutoHideTimer);
        mirielBoardAutoHideTimer = null;
    }

    if (shouldAutoShow !== true) {
        clearPublicStageSequenceTimer();
        publicStagePendingCardId = null;
        return;
    }

    mirielBoardAutoHideTimer = window.setTimeout(function() {
        mirielBoardAutoHideTimer = null;
        hideMirielBoardAfterAutoPreview();
    }, getMirielBoardAutoDisplayDuration(cardCount, isNewRound));
}

function activateMirielBoardAfterRender() {
    const boardElement = document.querySelector("#miriel-board-overlay");

    if (boardElement === null) {
        return;
    }

    const shouldShow = boardElement.dataset.shouldShow === "true";
    const shouldAutoShow = boardElement.dataset.autoShow === "true";
    const shouldAnimateExit = boardElement.dataset.animateExit === "true";
    const contentMode = getSafeMirielBoardContentMode(boardElement.dataset.contentMode);
    const cardCount = Number(boardElement.dataset.cardCount) || 0;
    const isNewRound = boardElement.dataset.newRound === "true";

    if (shouldShow !== true) {
        if (shouldAnimateExit === true) {
            boardElement.classList.add("miriel-board-visible");
            boardElement.classList.remove("miriel-board-hiding");

            window.requestAnimationFrame(function() {
                boardElement.classList.remove("miriel-board-visible");
                boardElement.classList.add("miriel-board-hiding");
            });
        } else {
            boardElement.classList.remove("miriel-board-visible");
            boardElement.classList.add("miriel-board-hiding");
        }

        shouldAnimateMirielBoardOnNextRender = false;
        lastRenderedMirielBoardPersistentMode = gameState.presentation.mirielBoard.persistentMode;
        scheduleMirielBoardAutoHide(false, cardCount, isNewRound);
        return;
    }

    boardElement.classList.remove("miriel-board-hiding");

    if (boardElement.classList.contains("miriel-board-visible") !== true) {
        window.requestAnimationFrame(function() {
            boardElement.classList.add("miriel-board-visible");
        });
    } else {
        boardElement.classList.add("miriel-board-visible");
    }

    shouldAnimateMirielBoardOnNextRender = false;
    lastRenderedMirielBoardPersistentMode = gameState.presentation.mirielBoard.persistentMode;
    lastRenderedMirielBoardContentMode = contentMode;
    scheduleMirielBoardAutoHide(shouldAutoShow, cardCount, isNewRound);
}

function createMirielBoardNoticeHtml(publicCards, activeCard, announcementOverride) {
    const announcement = announcementOverride !== null && typeof announcementOverride === "object"
        ? announcementOverride
        : getCurrentMirielBoardAnnouncement(activeCard);
    const activeName = announcement.activeName !== "" ? announcement.activeName : "—";

    return `
        <div class="miriel-board-notice-copy">
            <span>Runde ${announcement.roundNumber}</span>
            <strong>${activeName} ist am Zug</strong>
        </div>
    `;
}

function createMirielBoardAlertHtml(publicCards, announcementOverride) {
    const announcement = announcementOverride !== null && typeof announcementOverride === "object"
        ? announcementOverride
        : { isNewRound: false, roundNumber: gameState.encounter.roundNumber };

    if (announcement.isNewRound !== true) {
        return "";
    }

    const alertCards = getVisibleHealthAlertsForPublicBoard(publicCards);
    const safeRoundNumber = getSafePositiveInteger(announcement.roundNumber, gameState.encounter.roundNumber);

    if (alertCards.length === 0) {
        return `
            <section class="miriel-board-alerts miriel-board-alerts-calm" aria-label="Rundenruf">
                <div class="miriel-board-alerts-copy">
                    <p class="section-eyebrow">Rundenruf</p>
                    <strong>Runde ${safeRoundNumber} beginnt</strong>
                    <span>Die Tafel bleibt ruhig.</span>
                </div>
            </section>
        `;
    }

    const alertCardsHtml = alertCards.map(function(publicCard, index) {
        const alertRank = index + 1;

        return `
            <article class="miriel-board-alert-card ${publicCard.hp.health.stateClass}" style="${publicCard.hp.health.style}">
                <span class="miriel-board-alert-rank">${alertRank}</span>
                <div class="miriel-board-alert-image health-wound-frame public-wound-frame-ribbon ${publicCard.hp.health.stateClass}" style="${publicCard.hp.health.style}">
                    ${publicCard.imageData !== "" ? `<img src="${escapeHtml(publicCard.imageData)}" alt="Bild von ${escapeHtml(publicCard.publicName)}">` : `<span>✦</span>`}
                </div>
                <div class="miriel-board-alert-copy">
                    ${createLoopingNameHtml(publicCard.publicName, "miriel-board-alert-name")}
                    <span>${escapeHtml(getHealthStateLabel(publicCard.hp.health.state))}</span>
                </div>
            </article>
        `;
    }).join("");

    return `
        <section class="miriel-board-alerts" aria-label="Rundenruf: Dringendste Zustände">
            <div class="miriel-board-alerts-copy">
                <p class="section-eyebrow">Rundenruf</p>
                <strong>Runde ${safeRoundNumber} beginnt</strong>
                <span>Dringendste Zustände</span>
            </div>
            <div class="miriel-board-alert-list">
                ${alertCardsHtml}
            </div>
        </section>
    `;
}

function getMirielBoardTurnLabel(turnOffset) {
    if (turnOffset === 0) {
        return "JETZT";
    }

    return `+${turnOffset}`;
}

function getMirielBoardPublicStateText(publicCard) {
    const publicHp = publicCard !== null && typeof publicCard === "object" ? publicCard.hp : null;

    if (publicHp === null || typeof publicHp !== "object" || publicHp.mode === "hidden") {
        return "Zustand verborgen";
    }

    const publicHealth = publicHp.health !== null && typeof publicHp.health === "object" ? publicHp.health : null;
    const healthState = publicHealth !== null ? getSafeOptionalString(publicHealth.state) : "hidden";

    return getHealthStateLabel(healthState);
}

function createMirielBoardEntryHtml(publicCard, turnOffset) {
    const activeClass = turnOffset === 0 ? "miriel-board-rune-active" : "";
    const nearClass = turnOffset > 0 && turnOffset < 3 ? "miriel-board-rune-near" : "";
    const publicHp = publicCard !== null && typeof publicCard === "object" && publicCard.hp !== null && typeof publicCard.hp === "object"
        ? publicCard.hp
        : { mode: "hidden", health: getHealthPresentation({ hp: 0, maxHp: 1 }, false) };
    const publicHealth = publicHp.health !== null && typeof publicHp.health === "object"
        ? publicHp.health
        : getHealthPresentation({ hp: 0, maxHp: 1 }, false);
    const stateClass = getSafeOptionalString(publicHealth.stateClass) || "health-state-hidden";
    const healthStyle = getSafeOptionalString(publicHealth.style);
    const publicName = getSafeOptionalString(publicCard.publicName) || "Unbenannte Karte";
    const imageData = getSafeOptionalString(publicCard.imageData);
    const imageHtml = imageData !== ""
        ? `<img src="${escapeHtml(imageData)}" alt="Bild von ${escapeHtml(publicName)}">`
        : `<span>✦</span>`;

    return `
        <article class="miriel-board-rune ${activeClass} ${nearClass} ${stateClass}" style="${healthStyle}">
            <span class="miriel-board-rune-turn">${getMirielBoardTurnLabel(turnOffset)}</span>
            <div class="miriel-board-rune-image health-wound-frame public-wound-frame-ribbon ${stateClass}" style="${healthStyle}">
                ${imageHtml}
            </div>
            <div class="miriel-board-rune-copy">
                <strong>${escapeHtml(publicName)}</strong>
                <span>${escapeHtml(getMirielBoardPublicStateText(publicCard))}</span>
            </div>
        </article>
    `;
}

function createMirielBoardManualHtml() {
    const hasImage = gameState.presentation.mirielBoard.manualImageData !== "";
    const hasText = gameState.presentation.mirielBoard.manualText.trim() !== "";
    const textSizeClass = `miriel-board-manual-text-${gameState.presentation.mirielBoard.manualTextSize}`;
    const textPositionClass = `miriel-board-text-position-${gameState.presentation.mirielBoard.manualTextPosition}`;
    const mediaClass = hasImage === true ? "has-image" : "text-only";
    const imageHtml = hasImage === true
        ? `<img src="${escapeHtml(gameState.presentation.mirielBoard.manualImageData)}" alt="${escapeHtml(gameState.presentation.mirielBoard.manualImageName || "Eigene Tafel")}">`
        : "";
    const textHtml = hasText === true
        ? `<div class="miriel-board-manual-text ${textSizeClass} ${textPositionClass}">${escapeHtml(gameState.presentation.mirielBoard.manualText).replace(/\n/g, "<br>")}</div>`
        : "";

    return `
        <section class="miriel-board-manual-section ${mediaClass}" aria-label="Eigene Tafel">
            <div class="miriel-board-manual-stage">
                ${imageHtml}
                ${textHtml}
            </div>
        </section>
    `;
}

function createMirielBoardHtml(publicCards, handCards, activeCard, renderState) {
    const activeIndex = Math.max(0, publicCards.findIndex(function(publicCard) {
        return activeCard !== null && publicCard.id === activeCard.id;
    }));
    const orderedCards = [];

    for (let index = 0; index < publicCards.length; index += 1) {
        orderedCards.push(publicCards[(activeIndex + index) % publicCards.length]);
    }

    const safeRenderState = renderState !== null && typeof renderState === "object"
        ? renderState
        : getMirielBoardRenderState();
    const hasNewAutoTrigger = safeRenderState.hasNewAutoTrigger === true;
    const shouldShowBoard = safeRenderState.shouldShowBoard === true;
    const announcement = safeRenderState.announcement !== null ? safeRenderState.announcement : { isNewRound: false };
    const shouldAnimateExit = safeRenderState.shouldAnimateExit === true;
    const renderContentMode = shouldAnimateExit === true
        ? getSafeMirielBoardContentMode(lastRenderedMirielBoardContentMode)
        : getSafeMirielBoardContentMode(safeRenderState.contentMode);
    const isManualMode = renderContentMode === "manual" && hasNewAutoTrigger !== true && hasMirielBoardManualContent() === true;

    const entriesHtml = orderedCards.map(function(publicCard, index) {
        return createMirielBoardEntryHtml(publicCard, index);
    }).join("");

    const shouldShowDataValue = shouldShowBoard === true ? "true" : "false";
    const autoShowDataValue = hasNewAutoTrigger === true ? "true" : "false";
    const newRoundDataValue = announcement.isNewRound === true ? "true" : "false";
    const shouldAnimateEntry = safeRenderState.shouldAnimateEntry === true;
    const visibleClass = shouldAnimateExit === true || (shouldShowBoard === true && shouldAnimateEntry !== true) ? " miriel-board-visible" : "";

    return `
        <section
            id="miriel-board-overlay"
            class="miriel-board-overlay ${isManualMode === true ? "miriel-board-overlay-manual" : "miriel-board-overlay-overview"}${visibleClass}"
            data-should-show="${shouldShowDataValue}"
            data-auto-show="${autoShowDataValue}"
            data-card-count="${orderedCards.length}"
            data-new-round="${newRoundDataValue}"
            data-animate-exit="${shouldAnimateExit === true ? "true" : "false"}"
            data-content-mode="${isManualMode === true ? "manual" : "overview"}"
            aria-label="Miriels Schautafel"
        >
            <div class="miriel-board-panel">
                <div class="miriel-board-content">
                    <header class="miriel-board-header">
                        <div>
                            <h3>Miriels Schautafel</h3>
                        </div>
                        ${isManualMode === true ? "" : createMirielBoardNoticeHtml(publicCards, activeCard, announcement)}
                    </header>
                    ${isManualMode === true ? createMirielBoardManualHtml() : `
                        ${createMirielBoardAlertHtml(publicCards, announcement)}
                        <section class="miriel-board-initiative-section" aria-label="Initiative-Folge">
                            <div class="miriel-board-section-title-row">
                                <p class="section-eyebrow">Initiative-Folge</p>
                                <span>Alle Züge sichtbar</span>
                            </div>
                            <div class="miriel-board-rune-grid" aria-label="Vollständige Initiative-Folge">
                                ${entriesHtml}
                            </div>
                        </section>
                    `}
                </div>
            </div>
        </section>
    `;
}

// ============================================================
// 11. Öffentliche Spieler-Daten
// ============================================================

function clampNumber(value, minValue, maxValue) {
    return Math.max(minValue, Math.min(maxValue, value));
}

function getHealthPresentation(card, shouldRevealHealth) {
    const safeMaxHp = Number(card.maxHp) > 0 ? Number(card.maxHp) : 0;
    const safeHp = Number(card.hp);

    if (shouldRevealHealth !== true || safeMaxHp <= 0 || Number.isFinite(safeHp) === false) {
        return {
            ratio: 1,
            intensity: 0,
            state: "hidden",
            stateClass: "health-state-hidden",
            style: "--wound-intensity:0; --wound-drift:0; --wound-edge:0; --wound-pulse:0;"
        };
    }

    const ratio = clampNumber(safeHp / safeMaxHp, 0, 1);
    const rawIntensity = 1 - ratio;
    let state = "stable";

    if (safeHp <= 0) {
        state = "down";
    } else if (ratio <= 0.10) {
        state = "critical";
    } else if (ratio <= 0.25) {
        state = "severe";
    } else if (ratio <= 0.50) {
        state = "wounded";
    } else if (ratio <= 0.75) {
        state = "bruised";
    }

    const stateIntensityMinimums = {
        stable: 0,
        bruised: 0.44,
        wounded: 0.58,
        severe: 0.82,
        critical: 0.98,
        down: 1
    };
    const stateDriftValues = {
        stable: 0,
        bruised: 0.64,
        wounded: 0.76,
        severe: 0.94,
        critical: 1,
        down: 0
    };
    const stateEdgeValues = {
        stable: 0,
        bruised: 0.56,
        wounded: 0.74,
        severe: 0.94,
        critical: 1,
        down: 1
    };
    const statePulseValues = {
        stable: 0,
        bruised: 0,
        wounded: 0,
        severe: 0.58,
        critical: 1,
        down: 0
    };

    const intensity = state === "stable"
        ? clampNumber(rawIntensity * 0.28, 0, 0.08)
        : clampNumber(rawIntensity, stateIntensityMinimums[state], 1);
    const drift = stateDriftValues[state];
    const edge = stateEdgeValues[state];
    const pulse = statePulseValues[state];

    return {
        ratio: ratio,
        intensity: intensity,
        state: state,
        stateClass: `health-state-${state}`,
        style: `--wound-intensity:${intensity.toFixed(3)}; --wound-drift:${drift.toFixed(3)}; --wound-edge:${edge.toFixed(3)}; --wound-pulse:${pulse.toFixed(3)};`
    };
}

function getHealthPresentationForCard(card) {
    return getHealthPresentation(card, card.hpVisibility !== "hidden");
}

function createPublicHpData(card) {
    const hasTempHp = card.tempHp > 0;
    const shouldRevealHealth = card.hpVisibility !== "hidden";
    const healthPresentation = getHealthPresentation(card, shouldRevealHealth);

    if (card.hpVisibility === "full") {
        return {
            mode: "full",
            hp: card.hp,
            maxHp: card.maxHp,
            percent: getHpPercent(card),
            tempHp: card.tempHp,
            hasTempHp: hasTempHp,
            tempHpPercent: getTempHpPercent(card),
            health: healthPresentation
        };
    }

    if (card.hpVisibility === "bar") {
        return {
            mode: "bar",
            percent: getHpPercent(card),
            hasTempHp: hasTempHp,
            tempHpPercent: getTempHpPercent(card),
            health: healthPresentation
        };
    }

    if (card.hpVisibility === "descriptive") {
        return {
            mode: "descriptive",
            hasTempHp: false,
            health: healthPresentation
        };
    }

    return {
        mode: "hidden",
        health: healthPresentation
    };
}

function createPublicCardData(card, isActive, isFocused) {
    const context = publicDisplayAccessContext;
    const mayShowName = canViewCardField(card, cardFieldVisibility.publicName, context);
    const mayShowImage = canViewCardField(card, cardFieldVisibility.image, context);
    const mayShowInitiative = canViewCardField(card, cardFieldVisibility.initiative, context);
    const mayShowHp = canViewCardField(card, cardFieldVisibility.hp, context);
    const mayShowConditions = canViewCardField(card, cardFieldVisibility.conditions, context);
    const mayShowEffects = canViewCardField(card, cardFieldVisibility.effects, context);
    const publicName = mayShowName
        ? (getSafeOptionalString(card.publicName) || getSafeOptionalString(card.name) || "Unbenannte Karte")
        : "Unbekannte Karte";

    return {
        id: card.id,
        publicName,
        type: getSafeCardType(card.type),
        initiative: mayShowInitiative ? getSafeInteger(card.initiative, 0) : null,
        imageData: mayShowImage ? getSafeOptionalString(card.imageData) : "",
        hp: mayShowHp ? createPublicHpData(card) : {
            mode: "hidden",
            health: getHealthPresentation(card, false)
        },
        conditions: mayShowConditions && Array.isArray(card.conditions) ? card.conditions.slice() : [],
        effects: mayShowEffects
            ? getSafeEffects(card.effects).filter(function(effect) {
                return effect.visibility === effectVisibilityModes.public;
            })
            : [],
        isActive,
        isFocused,
        isInTurnOrder: card.isInitiativeActive !== false,
        isOutOfAction: isCardOutOfAction(card),
        accessProfile: getSafeCardAccessPolicy(card.accessPolicy).publicProfile
    };
}

function shouldPublicCardBeFocused(card, activeCard) {
    const isActive = activeCard !== null && card.id === activeCard.id;

    if (shouldPlayerSideFollowActiveCard()) {
        return isActive;
    }

    return isCardManuallySelected(card);
}

function createPublicEncounterState(handCards, activeCard) {
    const publicCards = [];

    for (const card of handCards) {
        const isActive = activeCard !== null && card.id === activeCard.id;
        const isFocused = shouldPublicCardBeFocused(card, activeCard);

        const publicCard = createPublicCardData(card, isActive, isFocused);

        publicCards.push(publicCard);
    }

    return publicCards;
}

function getFocusedPublicCardIndex(publicCards) {
    let focusedIndex = publicCards.findIndex(function(publicCard) {
        return publicCard.isFocused === true;
    });

    if (focusedIndex !== -1) {
        return focusedIndex;
    }

    focusedIndex = publicCards.findIndex(function(publicCard) {
        return publicCard.isActive === true;
    });

    if (focusedIndex !== -1) {
        return focusedIndex;
    }

    return 0;
}

function getPublicTurnWindow(publicCards) {
    if (publicCards.length === 0) {
        return {
            ghostPreviousCard: null,
            previousCard: null,
            focusedCard: null,
            nextCard: null,
            ghostNextCard: null
        };
    }

    const focusedIndex = getFocusedPublicCardIndex(publicCards);

    if (publicCards.length === 1) {
        return {
            ghostPreviousCard: null,
            previousCard: null,
            focusedCard: publicCards[focusedIndex],
            nextCard: null,
            ghostNextCard: null
        };
    }

    const previousIndex = (focusedIndex - 1 + publicCards.length) % publicCards.length;
    const nextIndex = (focusedIndex + 1) % publicCards.length;

    if (publicCards.length === 2) {
        return {
            ghostPreviousCard: null,
            previousCard: null,
            focusedCard: publicCards[focusedIndex],
            nextCard: publicCards[nextIndex],
            ghostNextCard: null
        };
    }

    if (publicCards.length === 3) {
        return {
            ghostPreviousCard: null,
            previousCard: publicCards[previousIndex],
            focusedCard: publicCards[focusedIndex],
            nextCard: publicCards[nextIndex],
            ghostNextCard: null
        };
    }

    if (publicCards.length === 4) {
        const afterNextIndex = (focusedIndex + 2) % publicCards.length;

        return {
            ghostPreviousCard: null,
            previousCard: publicCards[previousIndex],
            focusedCard: publicCards[focusedIndex],
            nextCard: publicCards[nextIndex],
            ghostNextCard: publicCards[afterNextIndex]
        };
    }

    const ghostPreviousIndex = (focusedIndex - 2 + publicCards.length) % publicCards.length;
    const ghostNextIndex = (focusedIndex + 2) % publicCards.length;

    return {
        ghostPreviousCard: publicCards[ghostPreviousIndex],
        previousCard: publicCards[previousIndex],
        focusedCard: publicCards[focusedIndex],
        nextCard: publicCards[nextIndex],
        ghostNextCard: publicCards[ghostNextIndex]
    };
}

// ============================================================
// 12. HTML-Erzeugung: Bilder, HP und Conditions
// ============================================================

function createCardImageHtml(card) {
    const healthPresentation = getHealthPresentationForCard(card);

    if (card.imageData === "") {
        return `
            <div
                class="card-image-box card-image-placeholder health-wound-frame dm-wound-frame ${healthPresentation.stateClass}"
                style="${healthPresentation.style}"
            >
                Bild folgt
            </div>
        `;
    }

    return `
        <div
            class="card-image-box health-wound-frame dm-wound-frame ${healthPresentation.stateClass}"
            style="${healthPresentation.style}"
        >
            <img
                class="card-image"
                src="${escapeAttribute(getSafeImageSource(card.imageData))}"
                alt="Bild von ${escapeAttribute(card.publicName)}"
            >
        </div>
    `;
}

function createPublicImageHtml(publicCard, imageContext = "stage") {
    const health = publicCard.hp.health || {
        stateClass: "health-state-hidden",
        style: "--wound-intensity:0; --wound-drift:0; --wound-edge:0; --wound-pulse:0;"
    };
    const contextClass = imageContext === "ribbon" ? "public-wound-frame-ribbon" : "public-wound-frame-stage";

    if (publicCard.imageData === "") {
        return `
            <div
                class="player-side-image-box player-side-image-placeholder health-wound-frame ${contextClass} ${health.stateClass}"
                style="${health.style}"
            >
                Bild folgt
            </div>
        `;
    }

    return `
        <div
            class="player-side-image-box health-wound-frame ${contextClass} ${health.stateClass}"
            style="${health.style}"
        >
            <img
                class="player-side-image"
                src="${publicCard.imageData}"
                alt="Bild von ${publicCard.publicName}"
            >
        </div>
    `;
}

function createDmHpBarHtml(card) {
    const hpPercent = getHpPercent(card);

    return `
        <div class="dm-resource-meter dm-hp-meter" title="HP ${card.hp} von ${card.maxHp}">
            <div
                class="dm-resource-meter-fill dm-hp-meter-fill"
                style="width: ${hpPercent}%;"
            ></div>
            <span class="dm-resource-meter-label">${card.hp <= 0 ? "0 HP · Initiative prüfen" : `HP ${card.hp} / ${card.maxHp}`}</span>
            ${card.hp <= 0 ? '<span class="dm-zero-hp-overlay" aria-hidden="true"></span>' : ""}
        </div>
    `;
}

function createDmTempHpBarHtml(card) {
    const tempHpPercent = getTempHpPercent(card);

    return `
        <div class="dm-resource-meter dm-temp-hp-meter" title="Temporary HP ${card.tempHp}">
            <div
                class="dm-resource-meter-fill dm-temp-hp-meter-fill"
                style="width: ${tempHpPercent}%;"
            ></div>
            <span class="dm-resource-meter-label">Temp HP ${card.tempHp}</span>
        </div>
    `;
}

function getPublicHpDisplayHtml(card) {
    return `
        <div class="hp-display">
            <p>Spieler sehen: ${getHpVisibilityLabel(card)}</p>
        </div>
    `;
}

function getPublicTempHpTextHtml(publicCard) {
    if (publicCard.hp.hasTempHp !== true) {
        return "";
    }

    if (publicCard.hp.mode === "full") {
        return `
            <p class="public-temp-hp-text">
                Temp HP: ${publicCard.hp.tempHp}
            </p>
        `;
    }

    if (publicCard.hp.mode === "descriptive") {
        return `
            <p class="public-temp-hp-text">
                Temp HP vorhanden
            </p>
        `;
    }

    return "";
}

function getPublicTempHpBarHtml(publicCard) {
    if (publicCard.hp.hasTempHp !== true) {
        return "";
    }

    if (publicCard.hp.mode !== "full" && publicCard.hp.mode !== "bar") {
        return "";
    }

    return `
        <div class="temp-hp-bar-outer" title="Temp HP">
            <div
                class="temp-hp-bar-inner"
                style="width: ${publicCard.hp.tempHpPercent}%;"
            ></div>
        </div>
    `;
}

function getPublicHpPreviewHtml(publicCard) {
    if (publicCard.hp.mode === "full") {
        const tempHpHtml = publicCard.hp.hasTempHp === true
            ? `<span><b>Temp HP</b> ${publicCard.hp.tempHp}</span>`
            : `<span class="public-vital-empty"><b>Temp HP</b> —</span>`;

        return `
            <div class="player-side-section-box public-vital-box public-vital-box-full">
                <div class="public-vital-values">
                    <span><b>HP</b> ${publicCard.hp.hp} / ${publicCard.hp.maxHp}</span>
                    ${tempHpHtml}
                </div>
                <div class="hp-bar-outer" aria-hidden="true">
                    <div class="hp-bar-inner" style="width: ${publicCard.hp.percent}%;"></div>
                </div>
                ${getPublicTempHpBarHtml(publicCard)}
            </div>
        `;
    }

    if (publicCard.hp.mode === "bar") {
        return `
            <div class="player-side-section-box public-vital-box public-vital-box-bar" aria-label="Öffentlicher HP-Balken">
                <div class="hp-bar-outer" aria-hidden="true">
                    <div class="hp-bar-inner" style="width: ${publicCard.hp.percent}%;"></div>
                </div>
                ${getPublicTempHpBarHtml(publicCard)}
            </div>
        `;
    }

    if (publicCard.hp.mode === "descriptive") {
        return `
            <div class="public-vital-box public-vital-box-aura" aria-label="Zustandsschleier"></div>
        `;
    }

    return `
        <div class="public-vital-box public-vital-box-hidden" aria-label="HP verborgen"></div>
    `;
}

function createConditionChipsHtml(card) {
    let html = "";
    for (const condition of (card.conditions || [])) {
        html += `<span class="condition-chip ${getConditionClassName(condition)}"><span class="condition-chip-name">${getConditionLabel(condition)}</span></span>`;
    }
    html += createEffectChipsHtml(card, false);
    return html || `<p class="condition-empty">Keine Conditions oder Effekte.</p>`;
}

function createPublicConditionChipsHtml(publicCard) {
    let html = "";
    for (const condition of (publicCard.conditions || [])) {
        html += `<span class="condition-chip ${getConditionClassName(condition)}"><span class="condition-chip-name">${getConditionLabel(condition)}</span></span>`;
    }
    html += createEffectChipsHtml(publicCard, true);
    return html || `<p class="condition-empty">Keine Conditions oder Effekte sichtbar.</p>`;
}


function getForgeTraitsDraft(prefix) {
    const traitsElement = document.querySelector(`#${prefix}-traits-text`);

    if (traitsElement === null || traitsElement.value.trim() === "") {
        return [];
    }

    return getSafeCardTraits(parseJsonValue(traitsElement.value.trim(), []), "");
}

function setForgeTraits(prefix, traits) {
    const traitsElement = document.querySelector(`#${prefix}-traits-text`);

    if (traitsElement === null) {
        return;
    }

    traitsElement.value = JSON.stringify(getSafeCardTraits(traits, ""));
}

function writeTraitsToForge(prefix, card) {
    setForgeTraits(prefix, getCardTraits(card));
    renderForgeTraitManager(prefix);
}

function commitForgeTraitsIfEditing(prefix) {
    if (prefix !== "edit-card") {
        return;
    }

    const card = getEditFormCard();

    if (card === null) {
        return;
    }

    card.traits = getForgeTraitsDraft(prefix);

    saveAndBroadcastAppState();
    renderCardDetailPanel(getFocusedCard(getHandCards(), getActiveCard(getHandCards())));
}

function hasOpenForgeTraitEditor() {
    return activeForgeTraitEditor !== null;
}

function scrollActiveForgeTraitEditorIntoView(prefix) {
    window.setTimeout(function() {
        const editorElement = document.querySelector(`#${prefix}-trait-manager .forge-trait-editor`);

        if (editorElement !== null) {
            editorElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }

        const nameElement = document.querySelector(`#${prefix}-forge-trait-name`);

        if (nameElement !== null) {
            nameElement.focus({ preventScroll: true });
            nameElement.select();
        }
    }, 0);
}

function openForgeTraitEditor(prefix, traitId) {
    keepCardForgeOpenForInternalAction();
    activeForgeTraitEditor = { prefix: prefix, traitId: traitId || "", isNewDraft: false };
    renderForgeTraitManager(prefix);
    scrollActiveForgeTraitEditorIntoView(prefix);
}

function addForgeTrait(prefix) {
    keepCardForgeOpenForInternalAction();
    const trait = createCardTrait({ name: "Neuer Trait", category: "other" }, Date.now());
    activeForgeTraitEditor = { prefix: prefix, traitId: trait.id, isNewDraft: true, draftTrait: trait };
    renderForgeTraitManager(prefix);
    scrollActiveForgeTraitEditorIntoView(prefix);
}

function cancelForgeTraitEditor(prefix, options = {}) {
    if (options.skipClickAwayGuard !== true) {
        keepCardForgeOpenForInternalAction();
    }

    activeForgeTraitEditor = null;
    renderForgeTraitManager(prefix);
}

function deleteForgeTrait(prefix, traitId) {
    keepCardForgeOpenForInternalAction();
    const traits = getForgeTraitsDraft(prefix);
    const traitToDelete = traits.find(function(trait) { return trait.id === traitId; });
    const traitName = traitToDelete !== undefined ? traitToDelete.name : "diesen Trait";

    if (window.confirm(`Trait „${traitName}“ löschen?`) === false) {
        return;
    }

    setForgeTraits(prefix, traits.filter(function(trait) { return trait.id !== traitId; }));
    activeForgeTraitEditor = null;
    renderForgeTraitManager(prefix);
    commitForgeTraitsIfEditing(prefix);
}

function saveForgeTrait(prefix, traitId) {
    keepCardForgeOpenForInternalAction();
    const traits = getForgeTraitsDraft(prefix);
    const nameElement = document.querySelector(`#${prefix}-forge-trait-name`);
    const categoryElement = document.querySelector(`#${prefix}-forge-trait-category`);
    const descriptionElement = document.querySelector(`#${prefix}-forge-trait-description`);
    const usageMaxElement = document.querySelector(`#${prefix}-forge-trait-usage-max`);
    const usageResetElement = document.querySelector(`#${prefix}-forge-trait-usage-reset`);
    const showActionElement = document.querySelector(`#${prefix}-forge-trait-show-action`);
    const actionTypeElement = document.querySelector(`#${prefix}-forge-trait-action-type`);
    const actionSummaryElement = document.querySelector(`#${prefix}-forge-trait-action-summary`);
    const attackElement = document.querySelector(`#${prefix}-forge-trait-attack`);
    const saveElement = document.querySelector(`#${prefix}-forge-trait-save`);
    const rangeElement = document.querySelector(`#${prefix}-forge-trait-range`);
    const damageElement = document.querySelector(`#${prefix}-forge-trait-damage`);
    const triggerElement = document.querySelector(`#${prefix}-forge-trait-trigger`);

    if (nameElement === null) {
        return;
    }

    const name = nameElement.value.trim();

    if (name === "") {
        nameElement.focus();
        return;
    }

    const existingIndex = traits.findIndex(function(trait) { return trait.id === traitId; });
    const previousTrait = existingIndex >= 0
        ? traits[existingIndex]
        : activeForgeTraitEditor !== null && activeForgeTraitEditor.prefix === prefix && activeForgeTraitEditor.traitId === traitId && activeForgeTraitEditor.draftTrait !== undefined
            ? activeForgeTraitEditor.draftTrait
            : {};
    const nextTrait = createCardTrait({
        id: previousTrait.id || traitId,
        name: name,
        category: categoryElement !== null ? categoryElement.value : "other",
        description: descriptionElement !== null ? descriptionElement.value.trim() : "",
        usageMax: usageMaxElement !== null ? getSafeNonNegativeInteger(usageMaxElement.value, 0) : 0,
        usageReset: usageResetElement !== null ? getSafeUsageReset(usageResetElement.value) : "none",
        usage: createUsageTextFromFields(usageMaxElement !== null ? usageMaxElement.value : 0, usageResetElement !== null ? usageResetElement.value : "none"),
        used: previousTrait.used || 0,
        showAsAction: showActionElement !== null && showActionElement.checked === true,
        actionType: actionTypeElement !== null ? actionTypeElement.value : "action",
        actionSummary: actionSummaryElement !== null ? actionSummaryElement.value.trim() : "",
        attack: attackElement !== null ? attackElement.value.trim() : "",
        save: saveElement !== null ? saveElement.value.trim() : "",
        range: rangeElement !== null ? rangeElement.value.trim() : "",
        damage: damageElement !== null ? damageElement.value.trim() : "",
        trigger: triggerElement !== null ? triggerElement.value.trim() : ""
    }, existingIndex >= 0 ? existingIndex : traits.length);

    if (existingIndex >= 0) {
        traits[existingIndex] = nextTrait;
    } else {
        traits.push(nextTrait);
    }

    setForgeTraits(prefix, traits);
    activeForgeTraitEditor = null;
    renderForgeTraitManager(prefix);
    commitForgeTraitsIfEditing(prefix);
}

function createForgeTraitRowHtml(prefix, trait) {
    const editorIsOpen = activeForgeTraitEditor !== null && activeForgeTraitEditor.prefix === prefix && activeForgeTraitEditor.traitId === trait.id;
    const actionHint = trait.showAsAction === true ? ` · ${cardActionTypeSingularLabels[trait.actionType] || "Aktion"}` : "";

    return `
        <div class="forge-trait-row ${editorIsOpen ? "forge-trait-row-active" : ""}">
            <span class="forge-action-type-pill">${escapeHtml(cardTraitCategoryLabels[trait.category] || "Trait")}</span>
            <span class="forge-action-name">${escapeHtml(trait.name)}${escapeHtml(actionHint)}</span>
            <div class="forge-action-row-actions">
                <button class="forge-trait-edit-button" type="button" onclick="openForgeTraitEditor('${prefix}', '${trait.id}')">Edit</button>
                <button class="forge-trait-delete-button" type="button" onclick="deleteForgeTrait('${prefix}', '${trait.id}')" title="Trait löschen" aria-label="${escapeHtml(trait.name)} löschen">×</button>
            </div>
        </div>
        ${editorIsOpen ? createForgeTraitEditorHtml(prefix, trait) : ""}
    `;
}

function createForgeTraitDraftGroupHtml(prefix, trait) {
    if (trait === undefined || trait === null) {
        return "";
    }

    return `
        <section class="forge-action-draft-group" aria-label="Neuer Trait">
            <div class="forge-action-draft-header">
                <p class="section-eyebrow">Neuer Trait</p>
                <span>Entwurf wird erst nach „Trait speichern“ einsortiert.</span>
            </div>
            ${createForgeTraitEditorHtml(prefix, trait)}
        </section>
    `;
}

function createForgeTraitEditorHtml(prefix, trait) {
    const safeTrait = trait || createCardTrait({ name: "", category: "other" }, 0);
    const categoryOptions = Object.keys(cardTraitCategoryLabels).map(function(key) {
        return `<option value="${key}"${safeTrait.category === key ? " selected" : ""}>${cardTraitCategoryLabels[key]}</option>`;
    }).join("");

    return `
        <section class="forge-trait-editor forge-action-inline-editor" aria-label="Trait bearbeiten">
            <div class="forge-action-editor-header">
                <p class="section-eyebrow">${activeForgeTraitEditor !== null && activeForgeTraitEditor.isNewDraft === true ? "Neuer Trait" : "Trait bearbeiten"}</p>
                <h5>${activeForgeTraitEditor !== null && activeForgeTraitEditor.isNewDraft === true ? "Neuen Trait anlegen" : escapeHtml(safeTrait.name)}</h5>
            </div>
            <div class="forge-action-editor-grid">
                <label class="form-field forge-action-editor-wide"><span>Name</span><input id="${prefix}-forge-trait-name" type="text" value="${escapeHtml(safeTrait.name)}"></label>
                <label class="form-field"><span>Kategorie</span><select id="${prefix}-forge-trait-category">${categoryOptions}</select></label>
                ${createUsageEditorFieldsHtml(prefix, safeTrait, "trait", "forge-action-editor-wide")}
                <label class="checkbox-field forge-checkbox-card forge-action-editor-wide"><input id="${prefix}-forge-trait-show-action" type="checkbox" ${safeTrait.showAsAction === true ? "checked" : ""}><span>Auch im Aktionen-Tab anzeigen</span></label>
                <label class="form-field"><span>Aktionstyp</span><select id="${prefix}-forge-trait-action-type">
                    <option value="action"${safeTrait.actionType === "action" ? " selected" : ""}>Aktion</option>
                    <option value="bonus"${safeTrait.actionType === "bonus" ? " selected" : ""}>Bonusaktion</option>
                    <option value="reaction"${safeTrait.actionType === "reaction" ? " selected" : ""}>Reaktion</option>
                    <option value="special"${safeTrait.actionType === "special" ? " selected" : ""}>Sonstiges</option>
                </select></label>
                <label class="form-field"><span>Attack</span><input id="${prefix}-forge-trait-attack" type="text" value="${escapeHtml(safeTrait.attack)}"></label>
                <label class="form-field"><span>Save</span><input id="${prefix}-forge-trait-save" type="text" value="${escapeHtml(safeTrait.save)}"></label>
                <label class="form-field"><span>Reichweite / Ziel</span><input id="${prefix}-forge-trait-range" type="text" value="${escapeHtml(safeTrait.range)}"></label>
                <label class="form-field"><span>Schaden / Effekt</span><input id="${prefix}-forge-trait-damage" type="text" value="${escapeHtml(safeTrait.damage)}"></label>
                <label class="form-field forge-action-editor-wide"><span>Trigger</span><input id="${prefix}-forge-trait-trigger" type="text" value="${escapeHtml(safeTrait.trigger)}"></label>
                <label class="form-field forge-action-editor-wide"><span>Kurztext für Aktionen</span><textarea id="${prefix}-forge-trait-action-summary" rows="3">${escapeHtml(safeTrait.actionSummary)}</textarea></label>
                <label class="form-field forge-action-editor-wide"><span>Beschreibung</span><textarea id="${prefix}-forge-trait-description" rows="5">${escapeHtml(safeTrait.description)}</textarea></label>
            </div>
            <div class="forge-action-editor-actions">
                <button type="button" onclick="saveForgeTrait('${prefix}', '${safeTrait.id}')">Trait speichern</button>
                <button type="button" onclick="cancelForgeTraitEditor('${prefix}')">Abbrechen</button>
            </div>
        </section>
    `;
}

function renderForgeTraitManager(prefix) {
    const managerElement = document.querySelector(`#${prefix}-trait-manager`);

    if (managerElement === null) {
        return;
    }

    const traits = getForgeTraitsDraft(prefix);
    const newDraftTraitId = activeForgeTraitEditor !== null && activeForgeTraitEditor.prefix === prefix && activeForgeTraitEditor.isNewDraft === true
        ? activeForgeTraitEditor.traitId
        : null;
    const newDraftTrait = newDraftTraitId !== null && activeForgeTraitEditor !== null && activeForgeTraitEditor.draftTrait !== undefined
        ? activeForgeTraitEditor.draftTrait
        : null;

    managerElement.innerHTML = `
        <div class="forge-action-manager-header forge-trait-manager-header">
            <div>
                <p class="section-eyebrow">Traitliste</p>
                
            </div>
            <button type="button" class="forge-trait-add-button forge-add-button" onclick="addForgeTrait('${prefix}')">Trait hinzufügen</button>
        </div>
        <div class="forge-action-row-list">
            ${createForgeTraitDraftGroupHtml(prefix, newDraftTrait)}
            ${traits.length > 0 ? traits.map(function(trait) { return createForgeTraitRowHtml(prefix, trait); }).join("") : `<p class="detail-placeholder-text">Noch keine strukturierten Traits eingetragen.</p>`}
        </div>
    `;
}

// ============================================================
// 13. HTML-Erzeugung: Öffentliche Spieler-Vorschau
// ============================================================

function getPublicStageLabel(slotName) {
    if (slotName === "ghost-previous") {
        return "Davor";
    }

    if (slotName === "previous") {
        return "Vorher";
    }

    if (slotName === "next") {
        return "Als Nächstes";
    }

    if (slotName === "ghost-next") {
        return "Danach";
    }

    if (shouldPlayerSideFollowActiveCard()) {
        return "Am Zug";
    }

    return "Ausgewählt";
}

function getPublicStageFocusClass(slotName) {
    if (slotName !== "focused") {
        return "";
    }

    if (shouldPlayerSideFollowActiveCard()) {
        return "auto-active-focus";
    }

    return "manual-selected-focus";
}

function createEmptyPublicStageCardHtml(slotName) {
    const label = getPublicStageLabel(slotName);

    return `
        <div class="public-stage-slot ${slotName}">
            <p class="public-stage-slot-label">
                ${label}
            </p>

            <article class="public-stage-card">
                <div class="public-stage-card-inner">
                    <h3 class="public-stage-title">
                        Keine Karte
                    </h3>

                    <div class="player-side-image-box player-side-image-placeholder">
                        -
                    </div>
                </div>
            </article>
        </div>
    `;
}

function createPublicStageCardHtml(publicCard, slotName) {
    if (publicCard === null) {
        return createEmptyPublicStageCardHtml(slotName);
    }

    const label = getPublicStageLabel(slotName);
    const isFocusedSlot = slotName === "focused";
    const isGhostSlot = slotName === "ghost-previous" || slotName === "ghost-next";
    const sideClass = isFocusedSlot ? "focused" : isGhostSlot ? "ghost" : "side";
    const focusColorClass = getPublicStageFocusClass(slotName);
    const mayShowEmptyConditionBlock = publicCard.accessProfile !== cardPublicProfiles.minimal;
    const shouldShowConditionBlock = isGhostSlot !== true && (
        (isFocusedSlot === true && mayShowEmptyConditionBlock)
        || publicCard.conditions.length > 0
        || (publicCard.effects || []).some(function(effect) {
            return effect.visibility === effectVisibilityModes.public;
        })
    );
    const conditionBlock = shouldShowConditionBlock ? `
        <div class="player-side-section-box public-condition-box">
            <h4>Conditions &amp; Effekte</h4>

            <div class="condition-chip-list">
                ${createPublicConditionChipsHtml(publicCard)}
            </div>
        </div>
    ` : "";

    return `
        <div class="public-stage-slot ${slotName} ${sideClass} ${focusColorClass}">
            <p class="public-stage-slot-label">
                ${label}
            </p>

            <article
                class="public-stage-card ${publicCard.hp.health.stateClass} hp-mode-${publicCard.hp.mode} ${publicCard.isOutOfAction ? "is-out-of-action" : ""}"
                data-card-id="${publicCard.id}"
                data-public-stage-card-id="${publicCard.id}"
                onclick="focusPublicCard(${publicCard.id})"
                title="Diese Karte groß anzeigen"
            >
                ${createOutOfActionStampHtml(publicCard)}
                <div class="public-stage-card-inner">
                    <h3 class="public-stage-title">
                        ${publicCard.publicName}
                    </h3>

                    ${createPublicImageHtml(publicCard, "stage")}

                    <p class="player-side-type">
                        ${publicCard.type}
                    </p>

                    ${isGhostSlot ? "" : getPublicHpPreviewHtml(publicCard)}
                    ${conditionBlock}
                </div>
            </article>
        </div>
    `;
}

function getPublicRibbonHealthHtml(publicCard) {
    if (publicCard.hp.mode === "full") {
        return `
            <div class="public-ribbon-health public-ribbon-health-full">
                <span>HP ${publicCard.hp.hp} / ${publicCard.hp.maxHp}</span>
                <div class="public-ribbon-health-bar" aria-hidden="true">
                    <span style="width:${publicCard.hp.percent}%;"></span>
                </div>
            </div>
        `;
    }

    if (publicCard.hp.mode === "bar") {
        return `
            <div class="public-ribbon-health public-ribbon-health-bar-only" aria-label="HP-Balken">
                <div class="public-ribbon-health-bar" aria-hidden="true">
                    <span style="width:${publicCard.hp.percent}%;"></span>
                </div>
            </div>
        `;
    }

    if (publicCard.hp.mode === "descriptive") {
        return `
            <div class="public-ribbon-health public-ribbon-health-visual" aria-label="Zustandsschleier"></div>
        `;
    }

    return `
        <div class="public-ribbon-health public-ribbon-health-hidden" aria-label="HP verborgen"></div>
    `;
}

function getPublicRibbonTurnLabel(publicCard) {
    const turnOffset = Number.isFinite(publicCard.publicTurnOffset) ? publicCard.publicTurnOffset : null;

    if (turnOffset === 0) {
        return "am Zug";
    }

    if (turnOffset !== null && turnOffset > 0) {
        return `+${turnOffset}`;
    }

    return publicCard.isActive ? "am Zug" : publicCard.type;
}

function createPublicRibbonCardHtml(publicCard) {
    const activeTurnClass = publicCard.isActive === true
        ? "active-turn-card"
        : "";

    const selectedCardClass = isPublicCardManuallySelected(publicCard)
        ? "selected-card"
        : "";

    const turnLabel = getPublicRibbonTurnLabel(publicCard);
    const ribbonIndex = Number.isFinite(publicCard.publicTurnOffset) ? publicCard.publicTurnOffset : 0;

    return `
        <article
            class="public-ribbon-card ${activeTurnClass} ${selectedCardClass} ${publicCard.hp.health.stateClass} hp-mode-${publicCard.hp.mode} ${publicCard.isOutOfAction ? "is-out-of-action" : ""}"
            data-card-id="${publicCard.id}"
            data-public-ribbon-card-id="${publicCard.id}"
            onclick="focusPublicCard(${publicCard.id})"
            title="Diese Karte groß anzeigen"
            style="${publicCard.hp.health.style} --ribbon-index: ${ribbonIndex};"
        >
            ${createOutOfActionStampHtml(publicCard)}
            <div class="public-ribbon-marker"></div>

            <div class="public-ribbon-image-crop">
                ${createPublicImageHtml(publicCard, "ribbon")}
            </div>

            <div class="public-ribbon-text">
                <strong>${publicCard.publicName}</strong>
                <span class="public-ribbon-meta">${turnLabel} · INI ${publicCard.initiative}</span>
                ${getPublicRibbonHealthHtml(publicCard)}
            </div>
        </article>
    `;
}

function getPublicRibbonCardsForRender(publicCards, activeCard) {
    if (publicCards.length === 0) {
        return [];
    }

    let activeIndex = activeCard !== null
        ? publicCards.findIndex(function(publicCard) { return publicCard.id === activeCard.id; })
        : -1;

    if (activeIndex < 0) {
        activeIndex = getFocusedPublicCardIndex(publicCards);
    }

    const orderedCards = [];

    for (let index = 0; index < publicCards.length; index += 1) {
        const sourceCard = publicCards[(activeIndex + index) % publicCards.length];
        orderedCards.push(Object.assign({}, sourceCard, {
            publicTurnOffset: index,
            isActive: index === 0
        }));
    }

    return orderedCards;
}

function createPublicTurnStatusHtml(handCards, activeCard) {
    const activeName = activeCard !== null ? activeCard.publicName || activeCard.name : "Niemand";
    const initiativeCards = getInitiativeCards(handCards);
    const turnText = activeCard !== null ? `${getCurrentTurnIndex() + 1} / ${initiativeCards.length}` : "—";
    const roundText = activeCard !== null ? `${gameState.encounter.roundNumber}` : "—";

    return `
        <div class="public-turn-status">
            <div class="public-turn-status-item">
                <span>Runde</span>
                <strong>${roundText}</strong>
            </div>

            <div class="public-turn-status-item">
                <span>Turn</span>
                <strong>${turnText}</strong>
            </div>

            <div class="public-turn-status-item public-turn-status-active">
                <span>Am Zug</span>
                <strong>${escapeHtml(activeName)}</strong>
            </div>
        </div>
    `;
}

// ============================================================
// 14. HTML-Erzeugung: DM-Karten
// ============================================================

function createCardMenuHtml(card) {
    const location = getCardLocation(card);
    const isOnHand = location === cardLocations.hand;
    const isInTrash = location === cardLocations.trash;

    if (isInTrash) {
        return `
            <details class="card-menu" onclick="event.stopPropagation()">
                <summary class="card-menu-summary" title="Kartenmenü öffnen" aria-label="Kartenmenü öffnen">☰</summary>
                <div class="card-menu-panel">
                    <button type="button" onclick="restoreCardFromTrash(${card.id})">Ins Deck wiederherstellen</button>
                    <button class="card-menu-danger" type="button" onclick="permanentlyDeleteCard(${card.id})">Endgültig löschen</button>
                </div>
            </details>
        `;
    }

    const isFocusedDeckCard = location === cardLocations.deck && uiState.focusedCardId === card.id;
    const deckFocusButtonHtml = isFocusedDeckCard
        ? `<button type="button" onclick="showDeckCardFromFocus(${card.id})">Aus Fokus entfernen</button>`
        : `<button type="button" onclick="setFocusedDeckCard(${card.id})">In den Fokus nehmen</button>`;
    const turnOrderButtonHtml = isOnHand
        ? `<button type="button" onclick="toggleCardTurnOrder(${card.id})">${getEncounterStatus(card) === encounterStatuses.eliminated ? "Wieder in die Zugfolge aufnehmen" : "Aus der Zugfolge nehmen"}</button>`
        : "";
    const movementButtonHtml = isOnHand
        ? `${turnOrderButtonHtml}<button type="button" onclick="moveCardToDeck(${card.id})">Karte ins Deck verschieben</button>`
        : `${deckFocusButtonHtml}<button type="button" onclick="moveCardToHand(${card.id})">Karte auf die Hand nehmen</button>`;

    return `
        <details class="card-menu" onclick="event.stopPropagation()">
            <summary class="card-menu-summary" title="Kartenmenü öffnen" aria-label="Kartenmenü öffnen">☰</summary>
            <div class="card-menu-panel">
                <button type="button" onclick="openEditCardForm(${card.id})">Karte bearbeiten</button>
                <button type="button" onclick="copyCardToDeck(${card.id})">Karte kopieren</button>
                ${movementButtonHtml}
                <button class="card-menu-danger" onclick="moveCardToTrash(${card.id})" type="button">In den Papierkorb</button>
            </div>
        </details>
    `;
}

function createCardHtml(card, isActive) {
    const isCompactDeckCard = getCardLocation(card) !== cardLocations.hand;

    const selectableCardClass = "selectable-card";

    const selectedTargetCardClass = card.isInCombat === true && card.isSelected === true
        ? "selected-target-card"
        : "";

    const selectedDeckCardClass = card.isInCombat === false && card.isSelected === true
        ? "selected-deck-card"
        : "";

    const selectionClickAttribute = `onclick="toggleCardSelection(${card.id})"`;

    let selectedTargetLabelHtml = "";

    if (card.isInCombat === true && card.isSelected === true) {
        selectedTargetLabelHtml = `<span class="selected-target-label">Ziel</span>`;
    }

    if (card.isInCombat === false && card.isSelected === true) {
        selectedTargetLabelHtml = `<span class="selected-deck-label">Deck-Auswahl</span>`;
    }

    const conditionsSectionHtml = card.isInCombat === true
        ? `
            <div class="card-section">
                <h4>Conditions &amp; Effekte</h4>

                <div class="condition-chip-list">
                    ${createConditionChipsHtml(card)}
                </div>
            </div>
        `
        : "";

    return `
        <article
            class="card ${isActive ? "active" : ""} ${isCompactDeckCard ? "deck-card-compact" : ""} ${selectableCardClass} ${selectedTargetCardClass} ${selectedDeckCardClass}"
            ${selectionClickAttribute}
        >
            <div class="card-inner">
                <div class="card-title-row">
                    <div class="card-header">
                        <h3>
                            ${escapeHtml(card.name)}
                            <span class="card-public-alias">
                                aka "${escapeHtml(card.publicName)}"
                            </span>
                        </h3>
                    </div>

                    ${createCardMenuHtml(card)}
                </div>

                ${createCardImageHtml(card)}

                <div class="card-type-line">
                    <p>
                        ${escapeHtml(getDeckTypeLabel(getCharacterRole(card)))} · ${getCardLocation(card) === cardLocations.hand ? "auf der Hand" : getCardLocation(card) === cardLocations.trash ? "im Papierkorb" : "im Deck"}
                    </p>

                    ${selectedTargetLabelHtml}
                </div>

                <div class="card-section">
                    <h4>HP</h4>

                    <div class="card-stat-grid">
                        <p>Aktuell: ${card.hp} / ${card.maxHp}</p>
                        <p>Temp: ${card.tempHp}</p>
                    </div>

                    ${createDmHpBarHtml(card)}
                    ${createDmTempHpBarHtml(card)}
                    ${getPublicHpDisplayHtml(card)}
                </div>

                <div class="card-section">
                    <h4>Kampfwerte</h4>

                    <div class="card-stat-grid">
                        <p>Initiative: ${card.initiative}</p>
                        <p>AC: ${card.armorClass}</p>
                    </div>
                </div>

                <div class="card-section">
                    <h4>Passive Werte</h4>

                    <div class="card-stat-grid">
                        <p>Perception: ${card.passivePerception}</p>
                        <p>Insight: ${card.passiveInsight}</p>
                        <p>Investigation: ${card.passiveInvestigation}</p>
                    </div>
                </div>

                ${conditionsSectionHtml}
            </div>
        </article>
    `;
}

// ============================================================
// 15. Formular: Karte bearbeiten
// ============================================================

function showEditCardError(message) {
    const errorElement = document.querySelector("#edit-card-error");

    if (errorElement === null) {
        return;
    }

    errorElement.textContent = message;
}

function clearEditCardError() {
    showEditCardError("");
}

function setInputValue(elementId, value) {
    const inputElement = document.querySelector(`#${elementId}`);

    if (inputElement !== null) {
        inputElement.value = value;

        if (inputElement instanceof HTMLSelectElement) {
            updateArcaneSelectForElement(inputElement);
        }
    }
}

function setCheckboxValue(elementId, value) {
    const inputElement = document.querySelector(`#${elementId}`);

    if (inputElement !== null) {
        inputElement.checked = value;
    }
}

function getEditFormCard() {
    if (editingCardId === null) {
        return null;
    }

    return findCardById(editingCardId);
}


function getCardForgeDrawerElement() {
    return document.querySelector("#card-forge-drawer");
}

function openCardForgeDrawer() {
    const drawerElement = getCardForgeDrawerElement();

    if (drawerElement === null) {
        return;
    }

    closeFloatingDetailsExcept(null);
    drawerElement.classList.add("card-forge-drawer-open");
    lockTabletPageScroll();
}

function closeCardForgeDrawer() {
    const drawerElement = getCardForgeDrawerElement();

    if (drawerElement === null) {
        return false;
    }

    if (drawerElement.classList.contains("card-forge-drawer-open") === true && confirmCloseCardForgeWithOpenSpellEditor() === false) {
        return false;
    }

    activeForgeSpellEditor = null;
    activeForgeActionEditor = null;
    activeForgeTraitEditor = null;
    activeForgeInventoryEditor = null;
    drawerElement.classList.remove("card-forge-drawer-open");
    scheduleTabletPageScrollLockSync();
    return true;
}

let tabletConsoleUnreadCount = 0;
let tabletOverlayScrollLockY = 0;
let tabletOverlayScrollSyncFrame = 0;

function hasOpenTabletOverlay() {
    if (isExperimentalTabletLayout() === false) return false;

    const actionDrawerElement = getDmActionDrawerElement();
    const forgeDrawerElement = getCardForgeDrawerElement();

    return document.body.classList.contains("tablet-console-open")
        || (actionDrawerElement !== null && actionDrawerElement.classList.contains("dm-action-drawer-open"))
        || (forgeDrawerElement !== null && forgeDrawerElement.classList.contains("card-forge-drawer-open"));
}

function lockTabletPageScroll() {
    if (isExperimentalTabletLayout() === false || document.body.classList.contains("tablet-scroll-locked")) return;

    tabletOverlayScrollLockY = window.scrollY;
    document.body.classList.add("tablet-scroll-locked");
    document.body.style.top = `-${tabletOverlayScrollLockY}px`;
}

function syncTabletPageScrollLock() {
    tabletOverlayScrollSyncFrame = 0;

    if (hasOpenTabletOverlay()) {
        lockTabletPageScroll();
        return;
    }

    if (document.body.classList.contains("tablet-scroll-locked") === false) return;

    document.body.classList.remove("tablet-scroll-locked");
    document.body.style.top = "";
    window.scrollTo(0, tabletOverlayScrollLockY);
}

function scheduleTabletPageScrollLockSync() {
    if (tabletOverlayScrollSyncFrame !== 0) cancelAnimationFrame(tabletOverlayScrollSyncFrame);
    tabletOverlayScrollSyncFrame = requestAnimationFrame(syncTabletPageScrollLock);
}

function isExperimentalTabletLayout() {
    return window.matchMedia("(min-width: 761px) and (max-width: 1112px) and (min-height: 600px) and (orientation: landscape)").matches;
}

function updateTabletConsoleUnreadBadge() {
    const badgeElement = document.querySelector("#tablet-chat-unread-badge");
    if (badgeElement === null) return;
    badgeElement.textContent = String(tabletConsoleUnreadCount);
    badgeElement.hidden = tabletConsoleUnreadCount < 1;
}

function setTabletConsoleUnreadCount(count) {
    tabletConsoleUnreadCount = Math.max(0, Number.isFinite(Number(count)) ? Math.floor(Number(count)) : 0);
    updateTabletConsoleUnreadBadge();
}

function incrementTabletConsoleUnreadCount(amount = 1) {
    if (document.body.classList.contains("tablet-console-open")) return;
    setTabletConsoleUnreadCount(tabletConsoleUnreadCount + Math.max(1, Number(amount) || 1));
}

function openTabletConsole() {
    if (isExperimentalTabletLayout() === false) return;
    closeFloatingDetailsExcept(null);
    closeDmActionDrawer();
    closeCardForgeDrawer();
    document.body.classList.add("tablet-console-open");
    lockTabletPageScroll();
    const buttonElement = document.querySelector("#tablet-console-open-button");
    if (buttonElement !== null) buttonElement.setAttribute("aria-expanded", "true");
    setTabletConsoleUnreadCount(0);
    scrollDmChatToLatest();
}

function closeTabletConsole() {
    const wasOpen = document.body.classList.contains("tablet-console-open");
    document.body.classList.remove("tablet-console-open");
    const buttonElement = document.querySelector("#tablet-console-open-button");
    if (buttonElement !== null) buttonElement.setAttribute("aria-expanded", "false");
    if (wasOpen) scheduleTabletPageScrollLockSync();
}

function getDmActionDrawerElement() {
    return document.querySelector("#dm-action-drawer");
}

function openDmActionDrawer(panelName = "toolbox") {
    const drawerElement = getDmActionDrawerElement();

    if (drawerElement === null) {
        return;
    }

    setAtelierPanel(panelName);
    closeAtelierHelp();
    drawerElement.classList.add("dm-action-drawer-open");
    lockTabletPageScroll();
}

function closeDmActionDrawer() {
    const drawerElement = getDmActionDrawerElement();

    if (drawerElement === null) {
        return;
    }

    drawerElement.classList.remove("dm-action-drawer-open");
    scheduleTabletPageScrollLockSync();
}

function setAtelierPanel(panelName) {
    const safePanelName = ["toolbox", "forge", "board", "archive"].includes(panelName) ? panelName : "toolbox";
    const panelElements = document.querySelectorAll(".atelier-panel");
    const buttonElements = document.querySelectorAll(".atelier-nav-button");

    for (const panelElement of panelElements) {
        panelElement.classList.toggle("atelier-panel-active", panelElement.dataset.atelierPanel === safePanelName);
    }

    for (const buttonElement of buttonElements) {
        const isActive = buttonElement.getAttribute("aria-controls") === `atelier-panel-${safePanelName}`;
        buttonElement.classList.toggle("atelier-nav-button-active", isActive);
        buttonElement.setAttribute("aria-selected", isActive ? "true" : "false");
    }
}

function closeAtelierHelp() {
    const helpPanelElement = document.querySelector("#atelier-help-panel");
    const helpButtonElement = document.querySelector(".toolkit-help-toggle");

    if (helpPanelElement !== null) {
        helpPanelElement.classList.add("toolkit-help-panel-hidden");
    }

    if (helpButtonElement !== null) {
        helpButtonElement.setAttribute("aria-expanded", "false");
    }
}

function toggleAtelierHelp() {
    const helpPanelElement = document.querySelector("#atelier-help-panel");
    const helpButtonElement = document.querySelector(".toolkit-help-toggle");

    if (helpPanelElement === null) {
        return;
    }

    const willOpen = helpPanelElement.classList.contains("toolkit-help-panel-hidden") === true;
    helpPanelElement.classList.toggle("toolkit-help-panel-hidden", willOpen === false);

    if (helpButtonElement !== null) {
        helpButtonElement.setAttribute("aria-expanded", willOpen ? "true" : "false");
    }
}


function updateToolkitHeaderStatus() {
    const statusElement = document.querySelector("#toolkit-header-status");

    if (statusElement === null) {
        return;
    }

    const handCards = getHandCards();
    const activeCard = getActiveCard(handCards);
    const selectedTargets = getSelectedHandCards();
    const activeText = activeCard !== null ? `${activeCard.publicName || activeCard.name} aktiv` : "Keine Handkarte aktiv";
    const targetText = selectedTargets.length === 1 ? "1 Ziel" : `${selectedTargets.length} Ziele`;
    const initiativeCards = getInitiativeCards(handCards);
    const turnText = initiativeCards.length > 0 ? `Turn ${getCurrentTurnIndex() + 1} von ${initiativeCards.length}` : "keine aktive Zugfolge";

    statusElement.textContent = `${activeText} · ${targetText} · ${turnText}`;
}

function openFocusedCardForgeFromToolkit() {
    const handCards = getHandCards();
    const activeCard = getActiveCard(handCards);
    const focusedCard = getFocusedCard(handCards, activeCard);

    if (focusedCard === null) {
        alert("Keine Fokuskarte zum Bearbeiten ausgewählt.");
        return;
    }

    suppressCardForgeClickAwayOnce = true;
    closeDmActionDrawer();
    openEditCardForm(focusedCard.id);
}

function openNewCardForgeFromToolkit() {
    suppressCardForgeClickAwayOnce = true;
    closeDmActionDrawer();
    openNewCardForge();
}

function openDeckLibraryFromToolkit() {
    closeDmActionDrawer();
    closeCardForgeDrawer();
    const deckElement = document.querySelector(".deck-workbench");

    if (deckElement !== null) {
        deckElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function setForgeTab(tabName) {
    const scrollSnapshot = getViewportScrollSnapshot();
    const safeTabName = ["basis", "values", "actions", "traits", "notes", "spells", "inventory"].includes(tabName)
        ? tabName
        : "basis";

    const panelElements = document.querySelectorAll(".forge-tab-panel");
    const buttonElements = document.querySelectorAll(".forge-tab-button");

    for (const panelElement of panelElements) {
        panelElement.classList.toggle("forge-tab-active", panelElement.classList.contains(`forge-tab-${safeTabName}`));
    }

    for (const buttonElement of buttonElements) {
        const isActive = buttonElement.dataset.forgeTab === safeTabName;
        buttonElement.classList.toggle("active-detail-tab", isActive);
        buttonElement.setAttribute("aria-selected", isActive ? "true" : "false");
    }

    if (safeTabName === "actions") {
        renderForgeActionManager(getVisibleForgePrefix());
    }

    if (safeTabName === "traits") {
        renderForgeTraitManager(getVisibleForgePrefix());
    }

    if (safeTabName === "spells") {
        renderVisibleForgeSpellManager();
    }

    if (safeTabName === "notes") {
        renderForgeNoteManager(getVisibleForgePrefix());
    }

    if (safeTabName === "inventory") {
        renderForgeInventoryManager(getVisibleForgePrefix());
    }

    restoreViewportScrollSnapshot(scrollSnapshot);
    requestAnimationFrame(function() {
        restoreViewportScrollSnapshot(scrollSnapshot);
    });
}

function openNewCardForge() {
    const editSectionElement = document.querySelector("#edit-card-section");
    const addSectionElement = document.querySelector(".card-forge .add-card-section");
    const editImageInputElement = document.querySelector("#edit-card-image");

    editingCardId = null;
    clearEditCardError();
    clearAddCardError();

    if (editImageInputElement !== null) {
        editImageInputElement.value = "";
    }

    if (editSectionElement !== null) {
        editSectionElement.classList.add("edit-card-section-hidden");
        editSectionElement.classList.add("card-forge-panel-hidden");
    }

    if (addSectionElement !== null) {
        addSectionElement.classList.remove("card-forge-panel-hidden");
    }

    activeForgeSpellEditor = null;
    activeForgeActionEditor = null;
    activeForgeTraitEditor = null;
    activeForgeInventoryEditor = null;
    setForgeActions("new-card", []);
    setForgeTraits("new-card", []);
    setForgeInventory("new-card", createEmptyInventoryData());
    renderForgeActionManager("new-card");
    renderForgeTraitManager("new-card");
    renderForgeSpellManager("new-card");
    setForgeNotes("new-card", "");
    renderForgeInventoryManager("new-card");
    renderNewConditionCheckboxes();
    clearNewConditionCheckboxes();
    openCardForgeDrawer();
    setForgeTab("basis");
}

function openEditCardForm(cardId) {
    const card = findCardById(cardId);
    const editSectionElement = document.querySelector("#edit-card-section");
    const editTitleElement = document.querySelector("#edit-card-title");
    const imageInputElement = document.querySelector("#edit-card-image");

    if (card === null || editSectionElement === null) {
        return;
    }

    editingCardId = cardId;
    clearEditCardError();

    if (editTitleElement !== null) {
        editTitleElement.textContent = `Karte bearbeiten: ${card.name}`;
    }

    setInputValue("edit-card-name", card.name);
    setInputValue("edit-card-public-name", card.publicName);
    setInputValue("edit-card-type", card.type);
    setInputValue("edit-card-image-path", card.imageData);
    setInputValue("edit-card-initiative", card.initiative);
    setInputValue("edit-card-initiative-modifier", card.initiativeModifier || card.dexterityModifier || "+0");
    setInputValue("edit-card-hp", card.hp);
    setInputValue("edit-card-max-hp", card.maxHp);
    setInputValue("edit-card-temp-hp", card.tempHp);
    setInputValue("edit-card-ac", card.armorClass);
    setInputValue("edit-card-passive-perception", card.passivePerception);
    setInputValue("edit-card-passive-insight", card.passiveInsight);
    setInputValue("edit-card-passive-investigation", card.passiveInvestigation);
    setInputValue("edit-card-strength-score", card.strengthScore || 10);
    setInputValue("edit-card-strength-modifier", card.strengthModifier || "+0");
    setInputValue("edit-card-dexterity-score", card.dexterityScore || 10);
    setInputValue("edit-card-dexterity-modifier", card.dexterityModifier || "+0");
    setInputValue("edit-card-constitution-score", card.constitutionScore || 10);
    setInputValue("edit-card-constitution-modifier", card.constitutionModifier || "+0");
    setInputValue("edit-card-intelligence-score", card.intelligenceScore || 10);
    setInputValue("edit-card-intelligence-modifier", card.intelligenceModifier || "+0");
    setInputValue("edit-card-wisdom-score", card.wisdomScore || 10);
    setInputValue("edit-card-wisdom-modifier", card.wisdomModifier || "+0");
    setInputValue("edit-card-charisma-score", card.charismaScore || 10);
    setInputValue("edit-card-charisma-modifier", card.charismaModifier || "+0");
    setInputValue("edit-card-speed", card.speed || "");
    setInputValue("edit-card-saving-throws", card.savingThrows || "");
    setInputValue("edit-card-resistances", card.resistances || "");
    setInputValue("edit-card-immunities", card.immunities || "");
    setInputValue("edit-card-vulnerabilities", card.vulnerabilities || "");
    setInputValue("edit-card-senses", card.senses || "");
    setInputValue("edit-card-special-resources", card.specialResources || "");
    writeTraitsToForge("edit-card", card);
    writeActionsToForge("edit-card", card);
    setForgeNotes("edit-card", card.notes || "");
    writeSpellcastingToForge("edit-card", card);
    renderForgeSpellManager("edit-card");
    writeInventoryToForge("edit-card", card);
    renderForgeInventoryManager("edit-card");
    setInputValue("edit-card-hp-visibility", card.hpVisibility);
    setInputValue("edit-card-public-profile", getSafeCardAccessPolicy(card.accessPolicy).publicProfile);
    setCheckboxValue("edit-card-is-in-combat", card.isInCombat === true);

    renderEditConditionCheckboxes();
    setEditConditionCheckboxes(card);

    if (imageInputElement !== null) {
        imageInputElement.value = "";
    }

    const addSectionElement = document.querySelector(".card-forge .add-card-section");

    if (addSectionElement !== null) {
        addSectionElement.classList.add("card-forge-panel-hidden");
    }

    editSectionElement.classList.remove("edit-card-section-hidden");
    editSectionElement.classList.remove("card-forge-panel-hidden");

    openCardForgeDrawer();
    setForgeTab("basis");
}

function closeEditCardForm() {
    const editSectionElement = document.querySelector("#edit-card-section");
    const imageInputElement = document.querySelector("#edit-card-image");

    editingCardId = null;
    activeForgeSpellEditor = null;
    activeForgeActionEditor = null;
    activeForgeTraitEditor = null;
    activeForgeInventoryEditor = null;
    clearEditCardError();

    if (imageInputElement !== null) {
        imageInputElement.value = "";
    }

    if (editSectionElement !== null) {
        editSectionElement.classList.add("edit-card-section-hidden");
        editSectionElement.classList.add("card-forge-panel-hidden");
    }

    const addSectionElement = document.querySelector(".card-forge .add-card-section");

    if (addSectionElement !== null) {
        addSectionElement.classList.remove("card-forge-panel-hidden");
    }

    closeCardForgeDrawer();
}

async function handleEditCardSaveButtonClick() {
    clearEditCardError();
    const scrollSnapshot = getViewportScrollSnapshot();

    const card = getEditFormCard();

    if (card === null) {
        showEditCardError("Es ist keine Karte zum Bearbeiten geöffnet.");
        return;
    }

    const nameInputElement = document.querySelector("#edit-card-name");
    const publicNameInputElement = document.querySelector("#edit-card-public-name");
    const typeSelectElement = document.querySelector("#edit-card-type");
    const imagePathInputElement = document.querySelector("#edit-card-image-path");
    const imageInputElement = document.querySelector("#edit-card-image");
    const initiativeInputElement = document.querySelector("#edit-card-initiative");
    const initiativeModifierInputElement = document.querySelector("#edit-card-initiative-modifier");
    const hpInputElement = document.querySelector("#edit-card-hp");
    const maxHpInputElement = document.querySelector("#edit-card-max-hp");
    const tempHpInputElement = document.querySelector("#edit-card-temp-hp");
    const acInputElement = document.querySelector("#edit-card-ac");
    const passivePerceptionInputElement = document.querySelector("#edit-card-passive-perception");
    const passiveInsightInputElement = document.querySelector("#edit-card-passive-insight");
    const passiveInvestigationInputElement = document.querySelector("#edit-card-passive-investigation");
    const strengthScoreInputElement = document.querySelector("#edit-card-strength-score");
    const strengthModifierInputElement = document.querySelector("#edit-card-strength-modifier");
    const dexterityScoreInputElement = document.querySelector("#edit-card-dexterity-score");
    const dexterityModifierInputElement = document.querySelector("#edit-card-dexterity-modifier");
    const constitutionScoreInputElement = document.querySelector("#edit-card-constitution-score");
    const constitutionModifierInputElement = document.querySelector("#edit-card-constitution-modifier");
    const intelligenceScoreInputElement = document.querySelector("#edit-card-intelligence-score");
    const intelligenceModifierInputElement = document.querySelector("#edit-card-intelligence-modifier");
    const wisdomScoreInputElement = document.querySelector("#edit-card-wisdom-score");
    const wisdomModifierInputElement = document.querySelector("#edit-card-wisdom-modifier");
    const charismaScoreInputElement = document.querySelector("#edit-card-charisma-score");
    const charismaModifierInputElement = document.querySelector("#edit-card-charisma-modifier");
    const speedInputElement = document.querySelector("#edit-card-speed");
    const savingThrowsInputElement = document.querySelector("#edit-card-saving-throws");
    const resistancesInputElement = document.querySelector("#edit-card-resistances");
    const immunitiesInputElement = document.querySelector("#edit-card-immunities");
    const vulnerabilitiesInputElement = document.querySelector("#edit-card-vulnerabilities");
    const sensesInputElement = document.querySelector("#edit-card-senses");
    const specialResourcesInputElement = document.querySelector("#edit-card-special-resources");
    const notesInputElement = document.querySelector("#edit-card-notes");
    const hpVisibilitySelectElement = document.querySelector("#edit-card-hp-visibility");
    const publicProfileSelectElement = document.querySelector("#edit-card-public-profile");
    const isInCombatInputElement = document.querySelector("#edit-card-is-in-combat");
    const conditionListElement = document.querySelector("#edit-card-condition-list");

    if (
        nameInputElement === null ||
        publicNameInputElement === null ||
        typeSelectElement === null ||
        imagePathInputElement === null ||
        imageInputElement === null ||
        initiativeInputElement === null ||
        initiativeModifierInputElement === null ||
        hpInputElement === null ||
        maxHpInputElement === null ||
        tempHpInputElement === null ||
        acInputElement === null ||
        passivePerceptionInputElement === null ||
        passiveInsightInputElement === null ||
        passiveInvestigationInputElement === null ||
        strengthScoreInputElement === null ||
        strengthModifierInputElement === null ||
        dexterityScoreInputElement === null ||
        dexterityModifierInputElement === null ||
        constitutionScoreInputElement === null ||
        constitutionModifierInputElement === null ||
        intelligenceScoreInputElement === null ||
        intelligenceModifierInputElement === null ||
        wisdomScoreInputElement === null ||
        wisdomModifierInputElement === null ||
        charismaScoreInputElement === null ||
        charismaModifierInputElement === null ||
        speedInputElement === null ||
        savingThrowsInputElement === null ||
        resistancesInputElement === null ||
        immunitiesInputElement === null ||
        vulnerabilitiesInputElement === null ||
        sensesInputElement === null ||
        specialResourcesInputElement === null ||
        notesInputElement === null ||
        hpVisibilitySelectElement === null ||
        publicProfileSelectElement === null ||
        isInCombatInputElement === null ||
        conditionListElement === null
    ) {
        showEditCardError("Ein Bearbeitungsfeld wurde nicht gefunden. Bitte prüfe die IDs in index.html.");
        return;
    }

    const name = nameInputElement.value.trim();
    const publicName = publicNameInputElement.value.trim();

    const initiative = initiativeInputElement.value.trim() === "" ? 0 : Number(initiativeInputElement.value);
    const hp = Number(hpInputElement.value);
    const maxHp = Number(maxHpInputElement.value);
    const tempHp = Number(tempHpInputElement.value);
    const armorClass = Number(acInputElement.value);
    const passivePerception = Number(passivePerceptionInputElement.value);
    const passiveInsight = Number(passiveInsightInputElement.value);
    const passiveInvestigation = Number(passiveInvestigationInputElement.value);
    const strengthScore = Number(strengthScoreInputElement.value);
    const dexterityScore = Number(dexterityScoreInputElement.value);
    const constitutionScore = Number(constitutionScoreInputElement.value);
    const intelligenceScore = Number(intelligenceScoreInputElement.value);
    const wisdomScore = Number(wisdomScoreInputElement.value);
    const charismaScore = Number(charismaScoreInputElement.value);

    if (name === "") {
        showEditCardError("Bitte gib einen internen Namen ein.");
        return;
    }

    if (publicName === "") {
        showEditCardError("Bitte gib einen öffentlichen Namen ein.");
        return;
    }

    if (Number.isFinite(initiative) === false) {
        showEditCardError("Initiative muss eine Zahl sein.");
        return;
    }

    if (Number.isFinite(hp) === false || hp < 0) {
        showEditCardError("HP müssen eine Zahl ab 0 sein.");
        return;
    }

    if (Number.isFinite(maxHp) === false || maxHp <= 0) {
        showEditCardError("Max HP müssen größer als 0 sein.");
        return;
    }

    if (hp > maxHp) {
        showEditCardError("Aktuelle HP dürfen nicht größer als Max HP sein.");
        return;
    }

    if (Number.isFinite(tempHp) === false || tempHp < 0) {
        showEditCardError("Temp HP müssen eine Zahl ab 0 sein.");
        return;
    }

    if (Number.isFinite(armorClass) === false || armorClass < 0) {
        showEditCardError("AC muss eine Zahl ab 0 sein.");
        return;
    }

    if (Number.isFinite(passivePerception) === false || passivePerception < 0) {
        showEditCardError("Passive Perception muss eine Zahl ab 0 sein.");
        return;
    }

    if (Number.isFinite(passiveInsight) === false || passiveInsight < 0) {
        showEditCardError("Passive Insight muss eine Zahl ab 0 sein.");
        return;
    }

    if (Number.isFinite(passiveInvestigation) === false || passiveInvestigation < 0) {
        showEditCardError("Passive Investigation muss eine Zahl ab 0 sein.");
        return;
    }

    if (
        Number.isFinite(strengthScore) === false ||
        Number.isFinite(dexterityScore) === false ||
        Number.isFinite(constitutionScore) === false ||
        Number.isFinite(intelligenceScore) === false ||
        Number.isFinite(wisdomScore) === false ||
        Number.isFinite(charismaScore) === false
    ) {
        showEditCardError("Attribute müssen Zahlen sein.");
        return;
    }

    let imageData = imagePathInputElement.value.trim();

    if (imageInputElement.files.length > 0) {
        const imageFile = imageInputElement.files[0];

        try {
            imageData = await readImageFileAsDataUrl(imageFile);
        } catch (error) {
            showEditCardError("Das Bild konnte nicht gelesen werden.");
            return;
        }
    }

    const oldName = card.name;

    card.name = name;
    card.publicName = publicName;
    card.type = typeSelectElement.value;
    card.initiative = Math.floor(initiative);
    card.initiativeModifier = initiativeModifierInputElement.value.trim() || dexterityModifierInputElement.value.trim() || "+0";
    card.hp = Math.floor(hp);
    card.maxHp = Math.floor(maxHp);
    card.tempHp = Math.floor(tempHp);
    card.armorClass = Math.floor(armorClass);
    card.passivePerception = Math.floor(passivePerception);
    card.passiveInsight = Math.floor(passiveInsight);
    card.passiveInvestigation = Math.floor(passiveInvestigation);
    card.strengthScore = Math.floor(strengthScore);
    card.strengthModifier = strengthModifierInputElement.value.trim() || "+0";
    card.dexterityScore = Math.floor(dexterityScore);
    card.dexterityModifier = dexterityModifierInputElement.value.trim() || "+0";
    card.constitutionScore = Math.floor(constitutionScore);
    card.constitutionModifier = constitutionModifierInputElement.value.trim() || "+0";
    card.intelligenceScore = Math.floor(intelligenceScore);
    card.intelligenceModifier = intelligenceModifierInputElement.value.trim() || "+0";
    card.wisdomScore = Math.floor(wisdomScore);
    card.wisdomModifier = wisdomModifierInputElement.value.trim() || "+0";
    card.charismaScore = Math.floor(charismaScore);
    card.charismaModifier = charismaModifierInputElement.value.trim() || "+0";
    card.speed = speedInputElement.value.trim();
    card.savingThrows = savingThrowsInputElement.value.trim();
    card.resistances = resistancesInputElement.value.trim();
    card.immunities = immunitiesInputElement.value.trim();
    card.vulnerabilities = vulnerabilitiesInputElement.value.trim();
    card.senses = sensesInputElement.value.trim();
    card.spellcasting = readSpellcastingFromForge("edit-card");
    card.spellSaveDc = createCardSpellSaveDcText(card.spellcasting);
    card.specialResources = specialResourcesInputElement.value.trim();
    card.traits = getForgeTraitsDraft("edit-card");
    card.actions = getForgeActionsDraft("edit-card");
    card.notes = getForgeNotesText("edit-card");
    const nextInventory = readInventoryFromForge("edit-card");
    card.currency = nextInventory.currency;
    card.inventoryCards = nextInventory.cards;
    card.inventoryList = nextInventory.list;
    card.hpVisibility = hpVisibilitySelectElement.value;
    card.accessPolicy = getSafeCardAccessPolicy({
        ...card.accessPolicy,
        publicProfile: publicProfileSelectElement.value
    });
    card.imageData = imageData;
    card.conditions = getEditConditionValues();
    setCardLocation(card, isInCombatInputElement.checked ? cardLocations.hand : cardLocations.deck);
    card.encounterStatus = isInCombatInputElement.checked ? encounterStatuses.active : null;

    if (gameState.presentation.manuallySelectedCardId === card.id && card.isInCombat === false) {
        clearManualPublicSelection();
    }

    const handCards = getHandCards();
    ensureCurrentTurnIndexIsValid(handCards);

    addCombatLogMessage(`Karte bearbeitet: ${oldName} → ${card.name}.`);
    closeEditCardForm();
    renderCards();
    restoreViewportScrollSnapshotRobustly(scrollSnapshot);
}

// ============================================================
// 16. Formular: Neue Karte hinzufügen
// ============================================================

function showAddCardError(message) {
    const errorElement = document.querySelector("#add-card-error");

    if (errorElement === null) {
        return;
    }

    errorElement.textContent = message;
}

function clearAddCardError() {
    showAddCardError("");
}

function getNumberedCardName(baseName, index, quantity) {
    if (quantity === 1) {
        return baseName;
    }

    return `${baseName} ${index + 1}`;
}

async function handleAddCardButtonClick() {
    clearAddCardError();

    const nameInputElement = document.querySelector("#new-card-name");
    const publicNameInputElement = document.querySelector("#new-card-public-name");
    const typeSelectElement = document.querySelector("#new-card-type");
    const quantityInputElement = document.querySelector("#new-card-quantity");
    const imageInputElement = document.querySelector("#new-card-image");
    const initiativeInputElement = document.querySelector("#new-card-initiative");
    const initiativeModifierInputElement = document.querySelector("#new-card-initiative-modifier");
    const hpInputElement = document.querySelector("#new-card-hp");
    const maxHpInputElement = document.querySelector("#new-card-max-hp");
    const tempHpInputElement = document.querySelector("#new-card-temp-hp");
    const hpVisibilitySelectElement = document.querySelector("#new-card-hp-visibility");
    const publicProfileSelectElement = document.querySelector("#new-card-public-profile");
    const acInputElement = document.querySelector("#new-card-ac");
    const passivePerceptionInputElement = document.querySelector("#new-card-passive-perception");
    const passiveInsightInputElement = document.querySelector("#new-card-passive-insight");
    const passiveInvestigationInputElement = document.querySelector("#new-card-passive-investigation");
    const strengthScoreInputElement = document.querySelector("#new-card-strength-score");
    const strengthModifierInputElement = document.querySelector("#new-card-strength-modifier");
    const dexterityScoreInputElement = document.querySelector("#new-card-dexterity-score");
    const dexterityModifierInputElement = document.querySelector("#new-card-dexterity-modifier");
    const constitutionScoreInputElement = document.querySelector("#new-card-constitution-score");
    const constitutionModifierInputElement = document.querySelector("#new-card-constitution-modifier");
    const intelligenceScoreInputElement = document.querySelector("#new-card-intelligence-score");
    const intelligenceModifierInputElement = document.querySelector("#new-card-intelligence-modifier");
    const wisdomScoreInputElement = document.querySelector("#new-card-wisdom-score");
    const wisdomModifierInputElement = document.querySelector("#new-card-wisdom-modifier");
    const charismaScoreInputElement = document.querySelector("#new-card-charisma-score");
    const charismaModifierInputElement = document.querySelector("#new-card-charisma-modifier");
    const speedInputElement = document.querySelector("#new-card-speed");
    const savingThrowsInputElement = document.querySelector("#new-card-saving-throws");
    const resistancesInputElement = document.querySelector("#new-card-resistances");
    const immunitiesInputElement = document.querySelector("#new-card-immunities");
    const vulnerabilitiesInputElement = document.querySelector("#new-card-vulnerabilities");
    const sensesInputElement = document.querySelector("#new-card-senses");
    const specialResourcesInputElement = document.querySelector("#new-card-special-resources");
    const notesInputElement = document.querySelector("#new-card-notes");
    const isInCombatInputElement = document.querySelector("#new-card-is-in-combat");
    const conditionListElement = document.querySelector("#new-card-condition-list");

    if (
        nameInputElement === null ||
        publicNameInputElement === null ||
        typeSelectElement === null ||
        quantityInputElement === null ||
        imageInputElement === null ||
        initiativeInputElement === null ||
        initiativeModifierInputElement === null ||
        hpInputElement === null ||
        maxHpInputElement === null ||
        tempHpInputElement === null ||
        hpVisibilitySelectElement === null ||
        publicProfileSelectElement === null ||
        acInputElement === null ||
        passivePerceptionInputElement === null ||
        passiveInsightInputElement === null ||
        passiveInvestigationInputElement === null ||
        strengthScoreInputElement === null ||
        strengthModifierInputElement === null ||
        dexterityScoreInputElement === null ||
        dexterityModifierInputElement === null ||
        constitutionScoreInputElement === null ||
        constitutionModifierInputElement === null ||
        intelligenceScoreInputElement === null ||
        intelligenceModifierInputElement === null ||
        wisdomScoreInputElement === null ||
        wisdomModifierInputElement === null ||
        charismaScoreInputElement === null ||
        charismaModifierInputElement === null ||
        speedInputElement === null ||
        savingThrowsInputElement === null ||
        resistancesInputElement === null ||
        immunitiesInputElement === null ||
        vulnerabilitiesInputElement === null ||
        sensesInputElement === null ||
        specialResourcesInputElement === null ||
        notesInputElement === null ||
        isInCombatInputElement === null ||
        conditionListElement === null
    ) {
        showAddCardError("Ein Formularfeld wurde nicht gefunden. Bitte prüfe die IDs in index.html.");
        return;
    }

    const name = nameInputElement.value.trim();
    const publicName = publicNameInputElement.value.trim();

    const quantity = Number(quantityInputElement.value);
    const initiative = initiativeInputElement.value.trim() === "" ? 0 : Number(initiativeInputElement.value);
    const hp = Number(hpInputElement.value);
    const maxHp = Number(maxHpInputElement.value);
    const tempHp = Number(tempHpInputElement.value);
    const armorClass = Number(acInputElement.value);
    const passivePerception = Number(passivePerceptionInputElement.value);
    const passiveInsight = Number(passiveInsightInputElement.value);
    const passiveInvestigation = Number(passiveInvestigationInputElement.value);
    const strengthScore = Number(strengthScoreInputElement.value);
    const dexterityScore = Number(dexterityScoreInputElement.value);
    const constitutionScore = Number(constitutionScoreInputElement.value);
    const intelligenceScore = Number(intelligenceScoreInputElement.value);
    const wisdomScore = Number(wisdomScoreInputElement.value);
    const charismaScore = Number(charismaScoreInputElement.value);

    if (name === "") {
        showAddCardError("Bitte gib einen internen Namen ein.");
        return;
    }

    if (publicName === "") {
        showAddCardError("Bitte gib einen öffentlichen Namen ein.");
        return;
    }

    if (!Number.isFinite(quantity) || quantity < 1) {
        showAddCardError("Die Anzahl muss mindestens 1 sein.");
        return;
    }

    if (quantity > 20) {
        showAddCardError("Die Anzahl darf höchstens 20 sein.");
        return;
    }

    if (hp < 0) {
        showAddCardError("HP dürfen nicht negativ sein.");
        return;
    }

    if (maxHp <= 0) {
        showAddCardError("Max HP müssen größer als 0 sein.");
        return;
    }

    if (hp > maxHp) {
        showAddCardError("Aktuelle HP dürfen nicht größer als Max HP sein.");
        return;
    }

    if (Number.isFinite(tempHp) === false || tempHp < 0) {
        showAddCardError("Temp HP müssen eine Zahl ab 0 sein.");
        return;
    }

    if (armorClass < 0) {
        showAddCardError("AC darf nicht negativ sein.");
        return;
    }

    if (passivePerception < 0) {
        showAddCardError("Passive Perception darf nicht negativ sein.");
        return;
    }

    if (passiveInsight < 0) {
        showAddCardError("Passive Insight darf nicht negativ sein.");
        return;
    }

    if (passiveInvestigation < 0) {
        showAddCardError("Passive Investigation darf nicht negativ sein.");
        return;
    }

    if (
        Number.isFinite(strengthScore) === false ||
        Number.isFinite(dexterityScore) === false ||
        Number.isFinite(constitutionScore) === false ||
        Number.isFinite(intelligenceScore) === false ||
        Number.isFinite(wisdomScore) === false ||
        Number.isFinite(charismaScore) === false
    ) {
        showAddCardError("Attribute müssen Zahlen sein.");
        return;
    }

    let imageData = "";

    if (imageInputElement.files.length > 0) {
        const imageFile = imageInputElement.files[0];

        try {
            imageData = await readImageFileAsDataUrl(imageFile);
        } catch (error) {
            showAddCardError("Das Bild konnte nicht gelesen werden.");
            return;
        }
    }

    const startConditions = getNewConditionValues();
    const createdDeckCardIds = [];

    for (let index = 0; index < quantity; index = index + 1) {
        const newCardId = getNextCardId();
        const newCard = {
            id: newCardId,
            name: getNumberedCardName(name, index, quantity),
            publicName: getNumberedCardName(publicName, index, quantity),
            cardKind: cardKinds.character,
            characterRole: typeSelectElement.value,
            type: typeSelectElement.value,
            initiative: initiative,
            initiativeModifier: initiativeModifierInputElement.value.trim() || dexterityModifierInputElement.value.trim() || "+0",
            hp: hp,
            maxHp: maxHp,
            tempHp: Math.floor(tempHp),
            armorClass: armorClass,
            passivePerception: passivePerception,
            passiveInsight: passiveInsight,
            passiveInvestigation: passiveInvestigation,
            strengthScore: Math.floor(strengthScore),
            strengthModifier: strengthModifierInputElement.value.trim() || "+0",
            dexterityScore: Math.floor(dexterityScore),
            dexterityModifier: dexterityModifierInputElement.value.trim() || "+0",
            constitutionScore: Math.floor(constitutionScore),
            constitutionModifier: constitutionModifierInputElement.value.trim() || "+0",
            intelligenceScore: Math.floor(intelligenceScore),
            intelligenceModifier: intelligenceModifierInputElement.value.trim() || "+0",
            wisdomScore: Math.floor(wisdomScore),
            wisdomModifier: wisdomModifierInputElement.value.trim() || "+0",
            charismaScore: Math.floor(charismaScore),
            charismaModifier: charismaModifierInputElement.value.trim() || "+0",
            speed: speedInputElement.value.trim(),
            savingThrows: savingThrowsInputElement.value.trim(),
            resistances: resistancesInputElement.value.trim(),
            immunities: immunitiesInputElement.value.trim(),
            vulnerabilities: vulnerabilitiesInputElement.value.trim(),
            senses: sensesInputElement.value.trim(),
            spellSaveDc: createCardSpellSaveDcText(readSpellcastingFromForge("new-card")),
            specialResources: specialResourcesInputElement.value.trim(),
            traits: getForgeTraitsDraft("new-card"),
            actions: getForgeActionsDraft("new-card"),
            notes: getForgeNotesText("new-card"),
            spellcasting: readSpellcastingFromForge("new-card"),
            ...createInventoryFieldsFromForge("new-card"),
            hpVisibility: hpVisibilitySelectElement.value,
            accessPolicy: getSafeCardAccessPolicy({ publicProfile: publicProfileSelectElement.value }),
            controllerParticipantId: null,
            imageData: imageData,
            conditions: startConditions.slice(),
            isDemoCard: false,
            location: isInCombatInputElement.checked ? cardLocations.hand : cardLocations.deck,
            encounterStatus: isInCombatInputElement.checked ? encounterStatuses.active : null,
            isInCombat: isInCombatInputElement.checked,
            isInitiativeActive: true,
            isSelected: false,
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: null
        };

        gameState.cards.push(normalizeCardModel(newCard));

        if (newCard.isInCombat === false) {
            createdDeckCardIds.push(newCardId);
        }
    }

    const handCards = getHandCards();
    ensureCurrentTurnIndexIsValid(handCards);

    renderCards();

    if (createdDeckCardIds.length > 0) {
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                scrollToDeckCard(createdDeckCardIds[0], true);
            });
        });
    }
}

// ============================================================
// 16. Rendering
// ============================================================

function createLoopingNameHtml(name, className) {
    const safeName = escapeHtml(name);
    const isLongName = name.length > 12;

    if (isLongName === false) {
        return `<span class="${className} ${className}-static"><span>${safeName}</span></span>`;
    }

    return `
        <span class="${className} ${className}-marquee">
            <span class="name-marquee-track">
                <span>${safeName}</span>
                <span aria-hidden="true">${safeName}</span>
            </span>
        </span>
    `;
}

function createInventoryItemTitleHtml(name) {
    const safeName = escapeHtml(name);
    const isLongName = name.length > 18;

    if (isLongName === false) {
        return `<span class="inventory-item-title-text inventory-item-title-text-static"><span>${safeName}</span></span>`;
    }

    return `
        <span class="inventory-item-title-text inventory-item-title-text-marquee">
            <span class="name-marquee-track">
                <span>${safeName}</span>
                <span aria-hidden="true">${safeName}</span>
            </span>
        </span>
    `;
}

function createInventoryDescriptionHtml(descriptionText) {
    const safeText = escapeHtml(descriptionText);
    if (descriptionText === "") {
        return `<p class="detail-placeholder-text">Keine Beschreibung.</p>`;
    }

    if (descriptionText.length <= 74) {
        return `<p>${safeText}</p>`;
    }

    return `
        <div class="inventory-copy-marquee" tabindex="0">
            <div class="inventory-copy-marquee-track">
                <p>${safeText}</p>
                <p aria-hidden="true">${safeText}</p>
            </div>
        </div>
    `;
}

function createTurnActionButtonsHtml() {
    const handCards = getHandCards();
    const turnDisabledAttribute = gameState.encounter.isStarted === true && handCards.length > 0 ? "" : " disabled";
    const stateActionButtonHtml = gameState.encounter.isStarted === true
        ? `<button class="round-control-button end-combat-button" onclick="endCombat()" type="button">Beenden</button>`
        : `<button class="round-control-button start-encounter-button" onclick="startEncounter()"${handCards.length > 0 ? "" : " disabled"} title="Encounter starten und den öffentlichen Spieltisch freigeben" type="button">Starten</button>`;

    return `
        <button class="round-control-button" onclick="previousTurn()"${turnDisabledAttribute} type="button" aria-label="Vorheriger Zug"><span class="round-control-label-long">Vorheriger Zug</span><span class="round-control-label-tablet" aria-hidden="true">‹ Zug</span></button>
        <button class="round-control-button" onclick="nextTurn()"${turnDisabledAttribute} type="button" aria-label="Nächster Zug"><span class="round-control-label-long">Nächster Zug</span><span class="round-control-label-tablet" aria-hidden="true">Zug ›</span></button>
        <button class="round-control-button" onclick="resetCombatTurnCounter()" type="button"><span class="round-control-label-long">Zähler reset</span><span class="round-control-label-tablet" aria-hidden="true">Reset</span></button>
        ${stateActionButtonHtml}
    `;
}

function renderTurnInfo(handCards) {
    const turnInfoElement = document.querySelector("#turn-info");
    const turnActionsElement = document.querySelector("#turn-actions");

    if (turnActionsElement !== null) {
        turnActionsElement.innerHTML = createTurnActionButtonsHtml();
    }

    if (turnInfoElement === null) {
        return;
    }

    const activeCard = getActiveCard(handCards);

    if (activeCard === null) {
        turnInfoElement.innerHTML = `
            <div class="active-round-summary-card">
                <strong>Runde ${gameState.encounter.roundNumber}</strong>
                <span>Keine Handkarten</span>
            </div>
            <button class="active-round-card active-round-card-empty" type="button" disabled>
                <span class="active-round-portrait active-round-portrait-placeholder">✦</span>
                <span class="active-round-copy">
                    <span>Aktiv</span>
                    <span class="active-round-name active-round-name-static"><span>—</span></span>
                </span>
            </button>
        `;
        return;
    }

    const activePortraitHtml = activeCard.imageData
        ? `<span class="active-round-portrait"><img src="${escapeHtml(activeCard.imageData)}" alt=""></span>`
        : `<span class="active-round-portrait active-round-portrait-placeholder">✦</span>`;
    const activeDisplayName = activeCard.publicName || activeCard.name;
    const activeNameHtml = createLoopingNameHtml(activeDisplayName, "active-round-name");

    turnInfoElement.innerHTML = `
        <div class="active-round-summary-card">
            <strong>Runde ${gameState.encounter.roundNumber}</strong>
            <span>Turn ${getCurrentTurnIndex() + 1} von ${getInitiativeCards(handCards).length}</span>
        </div>

        <button
            class="active-round-card"
            type="button"
            onclick="focusActiveCard()"
            title="Aktive Karte als Fokuskarte anzeigen: ${escapeHtml(activeDisplayName)}"
            aria-label="Aktive Karte als Fokuskarte anzeigen: ${escapeHtml(activeDisplayName)}"
        >
            ${activePortraitHtml}
            <span class="active-round-copy">
                <span>Aktiv</span>
                ${activeNameHtml}
            </span>
        </button>
    `;
}

function prefersReducedPublicMotion() {
    return window.matchMedia !== undefined && window.matchMedia("(prefers-reduced-motion: reduce)").matches === true;
}

function capturePublicStageRailState() {
    if (document.body.classList.contains("player-side-view") === false || prefersReducedPublicMotion() === true) {
        return null;
    }

    const stageElement = document.querySelector(".public-stage-card-row-five");

    if (stageElement === null) {
        return null;
    }

    const cardStates = new Map();
    const slotElements = stageElement.querySelectorAll(".public-stage-slot");

    slotElements.forEach(function(slotElement, index) {
        const stageCard = slotElement.querySelector("[data-public-stage-card-id]");

        if (stageCard === null) {
            return;
        }

        cardStates.set(stageCard.dataset.publicStageCardId, {
            cardId: stageCard.dataset.publicStageCardId,
            rect: slotElement.getBoundingClientRect(),
            cardRect: stageCard.getBoundingClientRect(),
            index,
            slotClassName: slotElement.className,
            html: slotElement.outerHTML,
            cardHtml: stageCard.outerHTML
        });
    });

    return {
        stageRect: stageElement.getBoundingClientRect(),
        cardStates,
        count: cardStates.size
    };
}

function resetPublicStageRailAnimationState() {
    document.querySelectorAll(".public-stage-card-row-five.public-stage-transitioning").forEach(function(stageElement) {
        stageElement.classList.remove("public-stage-transitioning");
    });

    document.querySelectorAll("[data-public-stage-card-id]").forEach(function(stageCard) {
        stageCard.style.removeProperty("transform");
        stageCard.style.removeProperty("transition");
        stageCard.style.removeProperty("opacity");
        stageCard.style.removeProperty("transform-origin");
        stageCard.style.removeProperty("will-change");
    });
}

function playPublicStageFocusAccent() {
    const focusedCard = document.querySelector(".public-stage-slot.focused [data-public-stage-card-id]");

    if (focusedCard === null) {
        return;
    }

    if (publicStageAccentTimer !== null) {
        window.clearTimeout(publicStageAccentTimer);
        publicStageAccentTimer = null;
    }

    focusedCard.classList.remove("public-stage-focus-accent");
    void focusedCard.offsetWidth;
    focusedCard.classList.add("public-stage-focus-accent");

    publicStageAccentTimer = window.setTimeout(function() {
        focusedCard.classList.remove("public-stage-focus-accent");
        publicStageAccentTimer = null;
    }, 1850);
}

function getPublicStageEnterTransform(currentState, stageRect) {
    const cardCenter = currentState.cardRect.left + (currentState.cardRect.width / 2);
    const stageCenter = stageRect.left + (stageRect.width / 2);
    const direction = cardCenter >= stageCenter ? 1 : -1;
    const distance = Math.max(36, Math.min(72, stageRect.width * .045));

    return {
        transform: `translate3d(${direction * distance}px, 0, 0) scale(.94, .94)`,
        opacity: "0"
    };
}

function preparePublicStageCardForRailAnimation(stageCard, transform, opacity) {
    stageCard.style.transition = "none";
    stageCard.style.transformOrigin = "top left";
    stageCard.style.willChange = "transform, opacity";
    stageCard.style.transform = transform;
    stageCard.style.opacity = opacity;
}

function releasePublicStageRailAnimationCard(stageCard, duration, easing, delay) {
    stageCard.style.transition = `transform ${duration}ms ${easing} ${delay}ms, opacity ${Math.max(520, duration - 220)}ms ease-out ${delay}ms`;
    stageCard.style.transform = "translate3d(0, 0, 0) scale(1, 1)";
    stageCard.style.opacity = "1";
}

function cleanupPublicStageRailAnimationCards(stageCards) {
    stageCards.forEach(function(stageCard) {
        stageCard.style.removeProperty("transform");
        stageCard.style.removeProperty("transition");
        stageCard.style.removeProperty("opacity");
        stageCard.style.removeProperty("transform-origin");
        stageCard.style.removeProperty("will-change");
    });
}

function playPublicStageRailTransition(previousStageState) {
    const stageElement = document.querySelector(".public-stage-card-row-five");

    if (
        stageElement === null
        || previousStageState === null
        || previousStageState.cardStates.size === 0
        || typeof window.requestAnimationFrame !== "function"
    ) {
        return;
    }

    resetPublicStageRailAnimationState();

    const currentSlots = Array.from(stageElement.querySelectorAll(".public-stage-slot"));
    const currentStageRect = stageElement.getBoundingClientRect();
    const currentStates = new Map();

    currentSlots.forEach(function(slotElement, index) {
        const stageCard = slotElement.querySelector("[data-public-stage-card-id]");

        if (stageCard === null) {
            return;
        }

        currentStates.set(stageCard.dataset.publicStageCardId, {
            cardId: stageCard.dataset.publicStageCardId,
            rect: slotElement.getBoundingClientRect(),
            cardRect: stageCard.getBoundingClientRect(),
            index,
            element: stageCard
        });
    });

    if (currentStates.size === 0) {
        return;
    }

    const animatedCards = [];
    let hasMeaningfulMovement = false;

    currentStates.forEach(function(currentState, cardId) {
        const previousState = previousStageState.cardStates.get(cardId);
        const stageCard = currentState.element;
        let initialTransform = "translate3d(0, 0, 0) scale(1, 1)";
        let initialOpacity = "1";

        if (previousState !== undefined) {
            const deltaX = previousState.cardRect.left - currentState.cardRect.left;
            const deltaY = previousState.cardRect.top - currentState.cardRect.top;
            const scaleX = currentState.cardRect.width > 0 ? previousState.cardRect.width / currentState.cardRect.width : 1;
            const scaleY = currentState.cardRect.height > 0 ? previousState.cardRect.height / currentState.cardRect.height : 1;
            const moved = Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1 || Math.abs(scaleX - 1) > .01 || Math.abs(scaleY - 1) > .01 || previousState.index !== currentState.index;

            if (moved === false) {
                return;
            }

            initialTransform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scaleX}, ${scaleY})`;
            hasMeaningfulMovement = true;
        } else {
            const enterState = getPublicStageEnterTransform(currentState, currentStageRect);
            initialTransform = enterState.transform;
            initialOpacity = enterState.opacity;
            hasMeaningfulMovement = true;
        }

        preparePublicStageCardForRailAnimation(stageCard, initialTransform, initialOpacity);
        animatedCards.push({ element: stageCard, index: currentState.index });
    });

    if (hasMeaningfulMovement === false || animatedCards.length === 0) {
        return;
    }

    stageElement.classList.add("public-stage-transitioning");

    // Force style application before releasing the gameState.cards onto the rail.
    void stageElement.offsetHeight;

    const duration = 1460;
    const easing = "cubic-bezier(.16,.84,.20,1)";
    let maxDelay = 0;

    window.requestAnimationFrame(function() {
        animatedCards.forEach(function(animatedCard) {
            const delay = Math.min(animatedCard.index, 4) * 26;
            maxDelay = Math.max(maxDelay, delay);
            releasePublicStageRailAnimationCard(animatedCard.element, duration, easing, delay);
        });

        window.setTimeout(function() {
            stageElement.classList.remove("public-stage-transitioning");
            cleanupPublicStageRailAnimationCards(animatedCards.map(function(animatedCard) {
                return animatedCard.element;
            }));
            playPublicStageFocusAccent();
        }, duration + maxDelay + 80);
    });
}

function scrollPublicInitiativeToActiveCard() {
    if (document.body.classList.contains("player-side-view") === false) {
        return;
    }

    window.requestAnimationFrame(function() {
        const ribbonElement = document.querySelector("#player-side-ribbon");

        if (ribbonElement === null) {
            return;
        }

        if (typeof ribbonElement.scrollTo === "function") {
            ribbonElement.scrollTo({
                left: 0,
                behavior: "auto"
            });
        } else {
            ribbonElement.scrollLeft = 0;
        }
    });
}

function capturePublicRibbonRollState() {
    if (document.body.classList.contains("player-side-view") === false) {
        return null;
    }

    if (window.matchMedia !== undefined && window.matchMedia("(prefers-reduced-motion: reduce)").matches === true) {
        return null;
    }

    const ribbonElement = document.querySelector("#player-side-ribbon");

    if (ribbonElement === null) {
        return null;
    }

    const cardStates = new Map();
    const ribbonCards = ribbonElement.querySelectorAll("[data-public-ribbon-card-id]");

    ribbonCards.forEach(function(ribbonCard, index) {
        cardStates.set(ribbonCard.dataset.publicRibbonCardId, {
            rect: ribbonCard.getBoundingClientRect(),
            index
        });
    });

    return {
        cardStates,
        count: ribbonCards.length
    };
}

function playPublicRibbonRollAnimation(previousRibbonState) {
    if (previousRibbonState === null || previousRibbonState.cardStates.size === 0 || typeof window.requestAnimationFrame !== "function") {
        return;
    }

    window.requestAnimationFrame(function() {
        const ribbonCards = document.querySelectorAll("[data-public-ribbon-card-id]");
        const previousCount = previousRibbonState.count;
        const wrapThreshold = Math.max(0, previousCount - 2);

        ribbonCards.forEach(function(ribbonCard, newIndex) {
            if (typeof ribbonCard.animate !== "function") {
                return;
            }

            const previousState = previousRibbonState.cardStates.get(ribbonCard.dataset.publicRibbonCardId);
            const delay = Math.min(newIndex, 5) * 34;

            if (previousState === undefined) {
                ribbonCard.animate(
                    [
                        { opacity: 0, transform: "translate3d(34px, 0, 0)" },
                        { opacity: 1, transform: "translate3d(0, 0, 0)" }
                    ],
                    { duration: 980, delay, easing: "cubic-bezier(.16,.82,.24,1)", fill: "both" }
                );
                return;
            }

            const lastRect = ribbonCard.getBoundingClientRect();
            const deltaX = previousState.rect.left - lastRect.left;
            const isWrappedCard = previousState.index === 0 && newIndex >= wrapThreshold;
            const isNormalAdvance = deltaX > 0;

            if (isWrappedCard === true) {
                ribbonCard.animate(
                    [
                        { opacity: 0, transform: "translate3d(42px, 0, 0)" },
                        { opacity: .88, transform: "translate3d(10px, 0, 0)" },
                        { opacity: 1, transform: "translate3d(0, 0, 0)" }
                    ],
                    { duration: 1120, delay: delay + 80, easing: "cubic-bezier(.16,.82,.24,1)", fill: "both" }
                );
                return;
            }

            if (Math.abs(deltaX) < 1) {
                return;
            }

            ribbonCard.animate(
                [
                    { transform: `translate3d(${deltaX}px, 0, 0)`, opacity: isNormalAdvance ? .92 : .76 },
                    { transform: "translate3d(0, 0, 0)", opacity: 1 }
                ],
                {
                    duration: 1120,
                    delay,
                    easing: "cubic-bezier(.16,.82,.24,1)",
                    fill: "both"
                }
            );
        });
    });
}

function createPlayerSideFallbackHtml(error) {
    const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler";

    return `
        <div class="player-side-error-card">
            <p class="section-eyebrow">Spielerseite</p>
            <h3>Die öffentliche Anzeige konnte nicht vollständig aufgebaut werden.</h3>
            <p>${escapeHtml(errorMessage)}</p>
        </div>
    `;
}

function getPublicStageCardsForRender(publicCards, activeCard, shouldHoldStage) {
    if (publicCards.length === 0) {
        publicStagePresentedCardId = null;
        publicStagePendingCardId = null;
        return publicCards;
    }

    const activeCardId = activeCard !== null ? activeCard.id : publicCards[0].id;
    const presentedCardExists = publicCards.some(function(publicCard) {
        return publicCard.id === publicStagePresentedCardId;
    });

    if (publicStagePresentedCardId === null || presentedCardExists === false || shouldPlayerSideFollowActiveCard() === false) {
        publicStagePresentedCardId = activeCardId;
    }

    if (shouldHoldStage === true && publicStagePresentedCardId !== activeCardId) {
        publicStagePendingCardId = activeCardId;
    } else {
        publicStagePresentedCardId = activeCardId;
        publicStagePendingCardId = null;
    }

    if (shouldPlayerSideFollowActiveCard() === false) {
        return publicCards;
    }

    return publicCards.map(function(publicCard) {
        return Object.assign({}, publicCard, {
            isFocused: publicCard.id === publicStagePresentedCardId
        });
    });
}

function createPublicEncounterWaitingHtml() {
    return `
        <div class="public-three-card-stage public-encounter-stage public-encounter-waiting-stage">
            <section class="miriel-board-overlay miriel-board-visible miriel-board-waiting-overlay" aria-label="Miriels Schautafel">
                <div class="miriel-board-panel miriel-board-waiting-panel">
                    <div class="miriel-board-content miriel-board-waiting-content">
                        <header class="miriel-board-header miriel-board-waiting-header">
                            <div>
                                <h3>Miriels Schautafel</h3>
                            </div>
                        </header>
                        <section class="miriel-board-waiting-copy" aria-label="Encounter wartet auf Start">
                            <span aria-hidden="true">✦</span>
                            <strong>Die Karten wurden gelegt</strong>
                            <p>Der Encounter beginnt,<br>sobald der Spielleiter den Ruf gibt.</p>
                        </section>
                    </div>
                </div>
            </section>
        </div>
    `;
}

function renderPlayerSide(publicCards, handCards) {
    const previewElement = document.querySelector("#player-side-list");
    const ribbonElement = document.querySelector("#player-side-ribbon");
    const activeCard = getActiveCard(handCards);

    if (previewElement === null || ribbonElement === null) {
        return;
    }

    document.body.classList.toggle("encounter-not-started", gameState.encounter.isStarted !== true);

    if (gameState.encounter.isStarted !== true) {
        if (hasPreparedEncounterCards() === true) {
            previewElement.innerHTML = createPublicEncounterWaitingHtml();
        } else {
            previewElement.innerHTML = `
                <p class="empty-list-message">
                    Noch keine Karten vorbereitet. Der öffentliche Spieltisch ist leer.
                </p>
            `;
        }

        ribbonElement.innerHTML = "";
        lastRenderedMirielBoardPersistentMode = "off";
        return;
    }

    try {
        const publicStageRailState = capturePublicStageRailState();
        const publicRibbonRollState = capturePublicRibbonRollState();

        if (publicCards.length === 0) {
            previewElement.innerHTML = `
                <p class="empty-list-message">
                    Keine Karten auf der Hand. Der öffentliche Spieltisch ist leer.
                </p>
            `;

            ribbonElement.innerHTML = "";
            return;
        }

        const mirielBoardRenderState = getMirielBoardRenderState();
        const stageCards = getPublicStageCardsForRender(publicCards, activeCard, mirielBoardRenderState.hasNewAutoTrigger === true);
        const turnWindow = getPublicTurnWindow(stageCards);
        let mirielBoardHtml = "";
        let ribbonHtml = "";

        try {
            mirielBoardHtml = createMirielBoardHtml(publicCards, handCards, activeCard, mirielBoardRenderState);
        } catch (error) {
            console.error("Miriels Schautafel konnte nicht gerendert werden.", error);
            mirielBoardHtml = "";
        }

        const ribbonCards = getPublicRibbonCardsForRender(publicCards, activeCard);
        const ribbonFirstCardId = ribbonCards.length > 0 ? ribbonCards[0].id : null;
        const shouldAnimateRibbonAdvance = publicRibbonPresentedFirstCardId !== null
            && ribbonFirstCardId !== null
            && publicRibbonPresentedFirstCardId !== ribbonFirstCardId;

        for (const publicCard of ribbonCards) {
            ribbonHtml += createPublicRibbonCardHtml(publicCard);
        }

        publicRibbonPresentedFirstCardId = ribbonFirstCardId;

        previewElement.innerHTML = `
            <div class="public-three-card-stage public-encounter-stage">
                ${mirielBoardHtml}
                ${createPublicTurnStatusHtml(handCards, activeCard)}

                <div class="public-stage-card-row public-stage-card-row-five" aria-label="Öffentliche Fokusstage">
                    ${createPublicStageCardHtml(turnWindow.ghostPreviousCard, "ghost-previous")}
                    ${createPublicStageCardHtml(turnWindow.previousCard, "previous")}
                    ${createPublicStageCardHtml(turnWindow.focusedCard, "focused")}
                    ${createPublicStageCardHtml(turnWindow.nextCard, "next")}
                    ${createPublicStageCardHtml(turnWindow.ghostNextCard, "ghost-next")}
                </div>

                <button
                    class="public-focus-reset-button"
                    onclick="resetPublicFocusToActiveCard()"
                >
                    Aktive Karte anzeigen
                </button>
            </div>
        `;

        ribbonElement.innerHTML = ribbonHtml;

        if (shouldAnimateRibbonAdvance === true) {
            playPublicRibbonRollAnimation(publicRibbonRollState);
        }

        if (mirielBoardRenderState.hasNewAutoTrigger === true) {
            lastRenderedMirielBoardTriggerId = gameState.presentation.mirielBoard.triggerId;
        }

        activateMirielBoardAfterRender();

        if (mirielBoardRenderState.hasNewAutoTrigger !== true) {
            playPublicStageRailTransition(publicStageRailState);
        }

        scrollPublicInitiativeToActiveCard();
    } catch (error) {
        console.error("Der öffentliche Spieltisch konnte nicht gerendert werden.", error);
        previewElement.innerHTML = createPlayerSideFallbackHtml(error);
        ribbonElement.innerHTML = "";
    }
}


function createFocusedCardHtml(card, activeCard) {
    if (card === null) {
        return `
            <article class="focused-card-empty focused-card-empty-stage">
                <div class="focused-empty-ghost-stack" aria-hidden="true">
                    <span class="focused-empty-ghost-card focused-empty-ghost-card-left"></span>
                    <span class="focused-empty-ghost-card focused-empty-ghost-card-center"></span>
                    <span class="focused-empty-ghost-card focused-empty-ghost-card-right"></span>
                </div>
                <div class="focused-empty-copy">
                    <h3>Keine Karte auf der Hand</h3>
                    <p>Nimm Karten aus der Vorbereitung auf die Hand, um einen Encounter zu starten.</p>
                </div>
            </article>
        `;
    }

    const isActive = activeCard !== null && card.id === activeCard.id;
    const isDeckFocus = card.isInCombat !== true;
    const activeLabelHtml = isActive ? `<span class="focused-status-badge active-focus-badge">Am Zug</span>` : "";
    const deckFocusLabelHtml = isDeckFocus ? `<span class="focused-status-badge deck-focus-badge">Deckkarte · nicht aktiv</span>` : "";
    const selectedLabelHtml = card.isSelected === true
        ? (isDeckFocus ? `<span class="selected-deck-label">Deck-Auswahl</span>` : `<span class="focused-status-badge target-focus-badge">Ziel</span>`)
        : "";
    const targetButtonText = card.isSelected === true ? "Ziel entfernen" : "Ziel setzen";
    const targetButtonStateClass = card.isSelected === true ? "focus-target-toggle-button-selected" : "";
    const focusActionButtonHtml = isDeckFocus
        ? `<button class="focus-target-toggle-button deck-focus-hand-button" onclick="event.stopPropagation(); moveCardToHand(${card.id})" type="button">Auf die Hand</button>`
        : `<button class="focus-target-toggle-button ${targetButtonStateClass}" onclick="event.stopPropagation(); toggleCardSelection(${card.id})" type="button">${targetButtonText}</button>`;
    const conditionCount = Array.isArray(card.conditions) ? card.conditions.length : 0;
    const conditionChipsHtml = createConditionChipsHtml(card);
    const conditionMarqueeClass = conditionCount > 3 ? "focus-condition-marquee is-scrolling" : "focus-condition-marquee";
    const repeatedConditionChipsHtml = conditionCount > 3
        ? `<span class="focus-condition-track-copy" aria-hidden="true">${conditionChipsHtml}</span>`
        : "";

    return `
        <article class="active-hand-focus-card ${isActive ? "active" : ""} ${card.isSelected ? "selected-target-card" : ""} ${isCardOutOfAction(card) ? "is-out-of-action" : ""}">
            ${createOutOfActionStampHtml(card)}
            <div class="active-hand-focus-card-inner">
                <header class="active-hand-focus-header">
                    <div class="active-hand-focus-title">
                        <h3>${escapeHtml(card.name)}</h3>
                        <p class="card-public-alias">aka "${escapeHtml(card.publicName)}"</p>
                    </div>

                    ${createCardMenuHtml(card)}
                </header>

                <div class="active-hand-focus-image">
                    ${createCardImageHtml(card)}
                </div>

                <div class="active-hand-focus-action-row">
                    <div class="focused-status-row" aria-label="Kartenstatus">
                        ${activeLabelHtml}
                        ${deckFocusLabelHtml}
                        ${selectedLabelHtml}
                    </div>

                    ${focusActionButtonHtml}
                </div>

                <div class="active-hand-focus-section active-hand-focus-resource-section">
                    <div class="active-hand-focus-resource-header">
                        <h4 class="active-hand-focus-section-title">HP</h4>
                        <span class="hp-visibility-inline">Spieler sehen: ${getPublicVisibilitySummary(card)}</span>
                    </div>
                    <div class="active-hand-focus-resource-stack">
                        ${createDmHpBarHtml(card)}
                        ${createDmTempHpBarHtml(card)}
                    </div>
                </div>

                <div class="active-hand-focus-section">
                    <h4 class="active-hand-focus-section-title">Kampfwerte</h4>
                    <div class="active-hand-focus-stat-grid active-hand-focus-stat-grid-two">
                        <p class="active-hand-focus-stat-tile"><span class="active-hand-focus-stat-label">Initiative</span><strong class="active-hand-focus-stat-value">${card.initiative}</strong></p>
                        <p class="active-hand-focus-stat-tile"><span class="active-hand-focus-stat-label">Armor Class</span><strong class="active-hand-focus-stat-value">${card.armorClass}</strong></p>
                    </div>
                </div>

                <div class="active-hand-focus-section active-hand-focus-passive-section">
                    <h4 class="active-hand-focus-section-title">Passive Werte</h4>
                    <div class="active-hand-focus-stat-grid active-hand-focus-stat-grid-three">
                        <p class="active-hand-focus-stat-tile"><span class="active-hand-focus-stat-label">Perception</span><strong class="active-hand-focus-stat-value">${card.passivePerception}</strong></p>
                        <p class="active-hand-focus-stat-tile"><span class="active-hand-focus-stat-label">Insight</span><strong class="active-hand-focus-stat-value">${card.passiveInsight}</strong></p>
                        <p class="active-hand-focus-stat-tile"><span class="active-hand-focus-stat-label">Investigation</span><strong class="active-hand-focus-stat-value">${card.passiveInvestigation}</strong></p>
                    </div>
                </div>

                <div class="active-hand-focus-section active-hand-focus-conditions">
                    <h4 class="active-hand-focus-section-title">Conditions</h4>
                    <div class="${conditionMarqueeClass}" aria-label="Aktive Conditions">
                        <div class="condition-chip-list focus-condition-track">
                            ${conditionChipsHtml}
                            ${repeatedConditionChipsHtml}
                        </div>
                    </div>
                </div>
            </div>
        </article>
    `;
}

function getFocusStageSiblingCards(focusedCard) {
    const handCards = getHandCards();

    if (handCards.length === 0 || focusedCard === null) {
        return {
            previousCard: null,
            nextCard: null
        };
    }

    const focusedIndex = handCards.findIndex(function(card) {
        return card.id === focusedCard.id;
    });

    if (focusedIndex === -1 || handCards.length < 2) {
        return {
            previousCard: null,
            nextCard: null
        };
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
            <span class="focus-stage-ghost-image">
                ${createCardImageHtml(card)}
            </span>
            <span class="focus-stage-ghost-title">${escapeHtml(card.name)}</span>
            <span class="focus-stage-ghost-meta">Ini ${card.initiative} · HP ${card.hp}/${card.maxHp}</span>
        </div>
    `;
}

function renderFocusedCard(focusedCard, activeCard) {
    const focusedCardElement = document.querySelector("#focused-card-panel");

    if (focusedCardElement === null) {
        return;
    }

    const siblingCards = getFocusStageSiblingCards(focusedCard);
    const hasFocusedCard = focusedCard !== null;

    focusedCardElement.innerHTML = `
        <div class="focus-stage-card-stack ${hasFocusedCard ? "" : "focus-stage-card-stack-empty"}">
            ${createFocusStagePreviewCardHtml(siblingCards.previousCard, "previous")}
            <div class="focus-stage-main-card">
                ${createFocusedCardHtml(focusedCard, activeCard)}
            </div>
            ${createFocusStagePreviewCardHtml(siblingCards.nextCard, "next")}
        </div>
    `;

    const focusArrowElements = document.querySelectorAll(".focus-stage-arrow");
    focusArrowElements.forEach(function(buttonElement) {
        buttonElement.disabled = hasFocusedCard !== true;
        buttonElement.setAttribute("aria-disabled", hasFocusedCard === true ? "false" : "true");
    });
}

function getDetailTabButtonHtml(tabName, label) {
    const activeClass = uiState.activeDetailTab === tabName ? "active-detail-tab" : "";

    return `
        <button
            class="detail-tab-button ${activeClass}"
            onclick="setActiveDetailTab('${tabName}')"
            type="button"
        >
            ${label}
        </button>
    `;
}

function createDetailPanelHeaderHtml(card) {
    const cardName = card === null
        ? "Keine Karte"
        : (card.publicName || card.name);

    return `
        <header class="active-hand-details-header">
            <p class="section-eyebrow">Kartendetails</p>
            <span class="active-hand-details-subtitle">${escapeHtml(cardName)}</span>
        </header>
    `;
}

function createDetailTextPanelHtml(label, value, emptyText) {
    const isNotesPanel = label === "Notizen";
    const sectionClassName = isNotesPanel
        ? "active-hand-detail-section active-hand-text-section active-hand-notes-section"
        : "active-hand-detail-section active-hand-text-section";
    const panelClassName = isNotesPanel
        ? "active-hand-text-panel active-hand-notes-panel"
        : "active-hand-text-panel";
    const contentHtml = isNotesPanel
        ? createDetailNotesHtml(value, emptyText)
        : createDetailTextHtml(value, emptyText);

    return `
        <section class="${sectionClassName}">
            <p class="section-eyebrow">${label}</p>
            <div class="${panelClassName}">
                ${contentHtml}
            </div>
        </section>
    `;
}

function splitDetailEntries(value, splitCommaList = false) {
    const normalizedText = getSafeOptionalString(value).trim();

    if (normalizedText === "") {
        return [];
    }

    const lineEntries = normalizedText
        .split(/\n+/)
        .map(function(entry) {
            return entry.trim();
        })
        .filter(function(entry) {
            return entry !== "";
        });

    if (lineEntries.length > 1 || splitCommaList === false) {
        return lineEntries;
    }

    return normalizedText
        .split(/[,;]+/)
        .map(function(entry) {
            return entry.trim();
        })
        .filter(function(entry) {
            return entry !== "";
        });
}

function getDetailEntryTitle(entry, fallbackLabel, index) {
    const dotIndex = entry.indexOf(".");
    const colonIndex = entry.indexOf(":");
    const candidates = [dotIndex, colonIndex].filter(function(position) {
        return position > 0 && position <= 42;
    });

    if (candidates.length === 0) {
        return `${fallbackLabel} ${index + 1}`;
    }

    const splitIndex = Math.min(...candidates);
    return entry.slice(0, splitIndex).trim();
}

function getDetailEntryBody(entry) {
    const dotIndex = entry.indexOf(".");
    const colonIndex = entry.indexOf(":");
    const candidates = [dotIndex, colonIndex].filter(function(position) {
        return position > 0 && position <= 42;
    });

    if (candidates.length === 0) {
        return entry;
    }

    const splitIndex = Math.min(...candidates);
    return entry.slice(splitIndex + 1).trim() || entry;
}


// ============================================================
// Trait-Modell und Trait-Editor
// ============================================================

const cardTraitCategoryLabels = {
    resource: "Ressource",
    classFeature: "Klassenfeature",
    species: "Spezies",
    feat: "Feat",
    monsterTrait: "Monstertrait",
    npc: "NPC",
    passive: "Passiv",
    other: "Sonstiges"
};

function getSafeCardTraitCategory(value) {
    if (value === "resource" || value === "classFeature" || value === "species" || value === "feat" || value === "monsterTrait" || value === "npc" || value === "passive" || value === "other") {
        return value;
    }

    return "other";
}

function createCardTrait(rawTrait = {}, fallbackIndex = 0) {
    return {
        id: getSafeOptionalString(rawTrait.id) || `trait-${Date.now()}-${fallbackIndex}-${Math.random().toString(36).slice(2, 8)}`,
        name: getSafeOptionalString(rawTrait.name) || "Neuer Trait",
        category: getSafeCardTraitCategory(rawTrait.category),
        description: getSafeOptionalString(rawTrait.description),
        usage: getSafeOptionalString(rawTrait.usage),
        usageMax: getSafeNonNegativeInteger(rawTrait.usageMax, inferUsageMaxFromText(rawTrait.usage)),
        usageReset: getSafeUsageReset(rawTrait.usageReset) !== "none" ? getSafeUsageReset(rawTrait.usageReset) : inferUsageResetFromText(rawTrait.usage),
        used: getSafeNonNegativeInteger(rawTrait.used, 0),
        showAsAction: rawTrait.showAsAction === true,
        actionType: getSafeCardActionType(rawTrait.actionType),
        actionSummary: getSafeOptionalString(rawTrait.actionSummary),
        attack: getSafeOptionalString(rawTrait.attack),
        save: getSafeOptionalString(rawTrait.save),
        range: getSafeOptionalString(rawTrait.range),
        damage: getSafeOptionalString(rawTrait.damage),
        trigger: getSafeOptionalString(rawTrait.trigger)
    };
}

function getSafeCardTraits(value) {
    if (Array.isArray(value) === false) {
        return [];
    }

    return value
        .slice(0, importSecurityLimits.maxTraitsPerCard)
        .filter(function(trait) { return trait !== null && typeof trait === "object"; })
        .map(function(trait, index) { return createCardTrait(trait, index); })
        .filter(function(trait) { return trait.name.trim() !== ""; });
}

function getCardTraits(card) {
    if (card === null) {
        return [];
    }

    return getSafeCardTraits(card.traits);
}

function getTraitTextFromStructuredTrait(trait) {
    const parts = [];

    if (trait.usage !== "") {
        parts.push(trait.usage);
    }

    if (trait.description !== "") {
        parts.push(trait.description);
    }

    return `${trait.name}. ${parts.join("; ")}`.trim();
}

function createDetailEntryCardsHtml(value, emptyText, fallbackLabel, splitCommaList = false) {
    const entries = splitDetailEntries(value, splitCommaList);

    if (entries.length === 0) {
        return `<p class="detail-placeholder-text">${emptyText}</p>`;
    }

    return entries.map(function(entry, index) {
        const title = getDetailEntryTitle(entry, fallbackLabel, index);
        const body = getDetailEntryBody(entry);

        return `
            <article class="active-hand-entry-card">
                <h5>${escapeHtml(title)}</h5>
                <p>${escapeHtml(body).replace(/\n/g, "<br>")}</p>
            </article>
        `;
    }).join("");
}



function getActionUsageMax(action) {
    return getUsageMax(action);
}

function getAvailableActionUsageCount(action) {
    return getAvailableUsageCount(action);
}

function setExpandedActionDetail(cardId, actionId, isOpen) {
    expandedActionDetailKey = isOpen === true ? `${cardId}:${actionId}` : "";
}


function findUsageActionReference(card, actionId) {
    const directAction = getCardActions(card).find(function(item) { return item.id === actionId; });

    if (directAction !== undefined) {
        return directAction;
    }

    if (actionId.startsWith("trait-")) {
        const traitId = actionId.replace(/^trait-/, "");
        const trait = getCardTraits(card).find(function(item) { return item.id === traitId || item.id === actionId; });
        return trait !== undefined ? createActionFromTrait(trait) : null;
    }

    if (actionId.startsWith("spell-")) {
        const spellId = actionId.replace(/^spell-/, "");
        const spell = getCardSpellcasting(card).spells.find(function(item) { return item.id === spellId || item.id === actionId; });
        return spell !== undefined ? createActionFromSpell(spell) : null;
    }

    return null;
}

function saveUsageActionReference(card, actionReference) {
    if (actionReference.sourceType === "trait") {
        const traits = getCardTraits(card);
        const trait = traits.find(function(item) { return item.id === actionReference.sourceId; });
        if (trait !== undefined) {
            trait.used = actionReference.used;
            card.traits = traits;
        }
        return;
    }

    if (actionReference.sourceType === "spell") {
        const spellcasting = getCardSpellcasting(card);
        const spell = spellcasting.spells.find(function(item) { return item.id === actionReference.sourceId; });
        if (spell !== undefined) {
            spell.used = actionReference.used;
            card.spellcasting = spellcasting;
        }
        return;
    }

    const actions = getCardActions(card);
    const action = actions.find(function(item) { return item.id === actionReference.id; });
    if (action !== undefined) {
        action.used = actionReference.used;
        card.actions = actions;
    }
}

function toggleActionUsage(cardId, actionId, usageIndex) {
    const detailScrollTop = captureActiveDetailScrollTop();
    const card = findCardById(cardId);

    if (card === null) {
        return;
    }

    const action = findUsageActionReference(card, actionId);

    if (action === null) {
        return;
    }

    const max = getActionUsageMax(action);

    if (max <= 0) {
        return;
    }

    const index = clampNumber(Number(usageIndex), 0, max - 1);
    const available = getAvailableActionUsageCount(action);
    const clickedUseIsAvailable = index < available;
    const newAvailable = clickedUseIsAvailable ? index : index + 1;
    action.used = clampNumber(max - newAvailable, 0, max);

    saveUsageActionReference(card, action);
    expandedActionDetailKey = `${cardId}:${action.id}`;

    addCombatLogMessage(`${card.publicName || card.name}: ${action.name} Nutzung ${getAvailableActionUsageCount(action)} / ${max}.`);
    saveAndBroadcastAppState();
    renderCards();
    restoreDetailScrollAfterRender(detailScrollTop);
}

function getActionUsageResetLabel(action) {
    return usageResetShortLabels[getUsageReset(action)] || "";
}

function getActionUsageResetTitle(action) {
    const reset = getUsageReset(action);
    return usageResetLabels[reset] || getSafeOptionalString(action.usage);
}

function createActionUsageButtonsHtml(cardId, action) {
    const max = getActionUsageMax(action);

    if (max <= 0) {
        return "";
    }

    const available = getAvailableActionUsageCount(action);
    const resetLabel = getActionUsageResetLabel(action);
    const resetTitle = getActionUsageResetTitle(action);
    const usageLabel = `${available}/${max}${resetLabel !== "" ? ` ${resetLabel}` : ""}`;
    const buttons = [];

    for (let index = 0; index < max; index += 1) {
        const isAvailable = index < available;
        buttons.push(`
            <button
                class="action-use-orb ${isAvailable ? "action-use-orb-available" : "action-use-orb-used"}"
                type="button"
                onclick="event.preventDefault(); event.stopPropagation(); toggleActionUsage(${cardId}, '${action.id}', ${index})"
                title="${escapeHtml(action.name)}: Nutzung ${index + 1} umschalten${resetTitle !== "" ? ` (${escapeHtml(resetTitle)})` : ""}"
                aria-label="Nutzung ${index + 1} von ${escapeHtml(action.name)} umschalten${resetTitle !== "" ? `, ${escapeHtml(resetTitle)}` : ""}"
            >
                <span></span>
            </button>
        `);
    }

    return `
        <span class="active-hand-action-usage" aria-label="Nutzung ${available} von ${max}${resetTitle !== "" ? `, ${escapeHtml(resetTitle)}` : ""}">
            <span title="${escapeHtml(resetTitle)}">${escapeHtml(usageLabel)}</span>
            <span class="action-use-orb-row">${buttons.join("")}</span>
        </span>
    `;
}

function createActionDetailCardHtml(cardId, action) {
    const usageControlsHtml = createActionUsageButtonsHtml(cardId, action);
    const rows = [];

    if (action.usage !== "" && usageControlsHtml === "") {
        rows.push(["Nutzung", action.usage]);
    }
    if (action.attack !== "") {
        rows.push(["Attack", action.attack]);
    }
    if (action.save !== "") {
        rows.push(["Save", action.save]);
    }
    if (action.range !== "") {
        rows.push(["Reichweite", action.range]);
    }
    if (action.damage !== "") {
        rows.push(["Schaden", action.damage]);
    }
    if (action.trigger !== "") {
        rows.push(["Trigger", action.trigger]);
    }

    const isOpen = expandedActionDetailKey === `${cardId}:${action.id}`;
    const metaParts = [];
    if (action.sourceLabel !== "") {
        metaParts.push(action.sourceLabel);
    }
    metaParts.push(cardActionTypeSingularLabels[action.type] || "Aktion");

    return `
        <details class="active-hand-entry-card active-hand-action-card active-hand-action-card-${escapeHtml(action.type)} ${isOpen ? "active-hand-action-expanded" : ""}" ${isOpen ? "open" : ""} ontoggle="setExpandedActionDetail(${cardId}, '${action.id}', this.open)">
            <summary class="active-hand-action-summary">
                <span class="active-hand-action-summary-main">
                    <span class="active-hand-action-chevron" aria-hidden="true">›</span>
                    <span class="active-hand-action-copy">
                        <span class="active-hand-action-name">${escapeHtml(action.name)}</span>
                        <span class="active-hand-action-meta-line">${metaParts.map(escapeHtml).join(" · ")}</span>
                    </span>
                </span>
                <span class="active-hand-action-summary-tools">
                    ${usageControlsHtml}
                </span>
            </summary>
            <div class="active-hand-action-body">
                ${rows.length > 0 ? `<dl class="active-hand-action-meta">${rows.map(function(row) { return `<div><dt>${escapeHtml(row[0])}</dt><dd>${escapeHtml(row[1])}</dd></div>`; }).join("")}</dl>` : ""}
                ${action.description !== "" ? `<div class="active-hand-action-description"><span>Beschreibung</span><p>${escapeHtml(action.description).replace(/\n/g, "<br>")}</p></div>` : ""}
            </div>
        </details>
    `;
}

function createActionDetailGroupHtml(cardId, type, actions) {
    if (actions.length === 0) {
        return "";
    }

    return `
        <section class="active-hand-detail-section active-hand-action-group">
            <p class="section-eyebrow">${cardActionTypeLabels[type]}</p>
            <div class="active-hand-entry-list">
                ${actions.map(function(action) { return createActionDetailCardHtml(cardId, action); }).join("")}
            </div>
        </section>
    `;
}


function createTraitUsageButtonsHtml(cardId, trait) {
    return createActionUsageButtonsHtml(cardId, createCardAction({
        id: `trait-${trait.id}`,
        name: trait.name,
        usage: trait.usage,
        usageMax: trait.usageMax,
        usageReset: trait.usageReset,
        used: trait.used,
        sourceType: "trait",
        sourceId: trait.id
    }));
}

function createTraitDetailCardHtml(cardId, trait) {
    const usageHtml = createTraitUsageButtonsHtml(cardId, trait);
    const metaParts = [cardTraitCategoryLabels[trait.category] || "Trait"];

    if (trait.showAsAction === true) {
        metaParts.push(cardActionTypeSingularLabels[trait.actionType] || "Aktion");
    }

    return `
        <article class="active-hand-entry-card active-hand-trait-card">
            <header class="active-hand-trait-card-header">
                <span class="active-hand-trait-title-block">
                    <h5>${escapeHtml(trait.name)}</h5>
                    <span class="active-hand-action-meta-line">${metaParts.map(escapeHtml).join(" · ")}</span>
                </span>
                <span class="active-hand-trait-tools">
                    ${usageHtml}
                </span>
            </header>
            ${trait.description !== "" ? `<p>${escapeHtml(trait.description).replace(/\n/g, "<br>")}</p>` : `<p class="detail-placeholder-text">Keine Beschreibung eingetragen.</p>`}
        </article>
    `;
}

function createTraitDetailTabHtml(card) {
    const traits = getCardTraits(card);

    return `
        <div class="active-hand-detail-content active-hand-detail-scroll active-hand-action-reference detail-tab-surface">
            <section class="active-hand-detail-section active-hand-long-section">
                <p class="section-eyebrow">Traits</p>
                <div class="active-hand-entry-list">
                    ${traits.length > 0 ? traits.map(function(trait) { return createTraitDetailCardHtml(card.id, trait); }).join("") : `<p class="detail-placeholder-text">Keine Traits eingetragen.</p>`}
                </div>
            </section>
        </div>
    `;
}

function createActionDetailTabHtml(card) {
    const actions = getCardActionReferences(card);
    const groups = ["action", "bonus", "reaction", "special"].map(function(type) {
        return createActionDetailGroupHtml(card.id, type, actions.filter(function(action) { return action.type === type; }));
    }).filter(function(html) { return html !== ""; });

    return `
        <div class="active-hand-detail-content active-hand-detail-scroll active-hand-action-reference detail-tab-surface">
            ${groups.length > 0 ? groups.join("") : `<p class="detail-placeholder-text">Keine Aktionen eingetragen.</p>`}
        </div>
    `;
}



// ============================================================
// Inventar-Modell, Itemkarten und direkter Inventar-Editor
// ============================================================

function createEmptyInventoryData() {
    return {
        currency: { gp: 0, sp: 0, cp: 0 },
        cards: [],
        list: []
    };
}

function normalizeInventoryImagePath(value, category = "potion") {
    const source = getSafeOptionalString(value);
    if (source === "") {
        return category === "scroll" ? "assets/items/scroll_custom.jpg" : "assets/items/potion_custom.jpg";
    }

    const normalizedSource = source.replace(/\.(?:svg|png|jpeg)$/i, ".jpg");
    const knownLegacyItemPaths = new Set([
        "assets/items/potion_healing.jpg",
        "assets/items/potion_greater_healing.jpg",
        "assets/items/potion_superior_healing.jpg",
        "assets/items/potion_supreme_healing.jpg",
        "assets/items/potion_custom.jpg",
        "assets/items/scroll_custom.jpg",
        "assets/items/coin_purse.jpg"
    ]);

    return knownLegacyItemPaths.has(normalizedSource) ? normalizedSource : source;
}

function createInventoryCardFromTemplate(templateName) {
    const template = inventoryCardTemplates[templateName] || inventoryCardTemplates.customPotion;
    return createInventoryCard({
        ...template,
        template: templateName
    });
}

function getSafeInventoryCategory(value) {
    if (Object.prototype.hasOwnProperty.call(inventoryCategoryLabels, value)) {
        return value;
    }
    return "misc";
}

function createInventoryCard(rawItem = {}, fallbackIndex = 0) {
    const category = getSafeInventoryCategory(rawItem.category);
    const quantity = getSafeNonNegativeInteger(rawItem.quantity, 1);
    const legacyHealingFormula = getSafeOptionalString(rawItem.healingFormula);
    const rawEffectType = getSafeOptionalString(rawItem.executableEffect?.type || rawItem.executableEffectType);
    const executableEffectType = Object.values(itemExecutableEffectTypes).includes(rawEffectType)
        ? rawEffectType
        : (legacyHealingFormula !== "" ? itemExecutableEffectTypes.healing : itemExecutableEffectTypes.none);
    const executableEffectValue = getSafeOptionalString(
        rawItem.executableEffect?.value
        || rawItem.executableEffectValue
        || (executableEffectType === itemExecutableEffectTypes.healing ? legacyHealingFormula : "")
    );

    return {
        id: getSafeOptionalString(rawItem.id) || createUniqueId(),
        template: getSafeOptionalString(rawItem.template),
        name: getSafeOptionalString(rawItem.name) || "Neue Itemkarte",
        category: category,
        effect: getSafeOptionalString(rawItem.effect),
        description: getSafeOptionalString(rawItem.description),
        healingFormula: legacyHealingFormula,
        image: normalizeInventoryImagePath(rawItem.image, category),
        showAsAction: rawItem.showAsAction === true,
        actionType: getSafeCardActionType(rawItem.actionType),
        quantity: quantity,
        status: quantity > 0 ? "available" : "consumed",
        executableEffect: {
            type: executableEffectType,
            value: executableEffectValue,
            visibility: getSafeEffectVisibility(rawItem.executableEffect?.visibility || effectVisibilityModes.public)
        },
        controllerCanTransfer: rawItem.controllerCanTransfer === true,
        used: getSafeNonNegativeInteger(rawItem.used, 0)
    };
}

function getInventoryItemSuggestion(name) {
    const rawName = getSafeOptionalString(name);
    const lower = rawName.toLowerCase();

    const suggestions = [
        { test: /cloak of displacement/, category: "magicItem", description: "Magischer Umhang. Solange du ihn trägst, sehen Angreifer deine Position verschwommen; Angriffe gegen dich haben Nachteil, bis du Schaden erleidest." },
        { test: /goggles of night/, category: "magicItem", description: "Dunkle Linsen. Während du sie trägst, erhältst du Darkvision 60 ft.; vorhandene Darkvision erhöht sich um 60 ft." },
        { test: /cloak of protection/, category: "magicItem", description: "Magischer Schutzumhang. Gewährt +1 auf AC und Rettungswürfe, solange er getragen wird." },
        { test: /ring of protection/, category: "magicItem", description: "Magischer Schutzring. Gewährt +1 auf AC und Rettungswürfe, solange er getragen wird." },
        { test: /studded leather/, category: "armor", description: "Leichte Rüstung. AC 12 + DEX-Modifikator." },
        { test: /scale mail/, category: "armor", description: "Mittlere Rüstung. AC 14 + DEX-Modifikator bis maximal +2; Nachteil auf Stealth." },
        { test: /^shield$/, category: "armor", description: "Schild. Gewährt +2 AC, solange er geführt wird." },
        { test: /rapier/, category: "weapon", description: "Finesse-Nahkampfwaffe. 1d8 piercing; ideal für Sneak Attack und DEX-basierte Angriffe." },
        { test: /dagger/, category: "weapon", description: "Leichte Finesse-Waffe. 1d4 piercing, thrown 20/60 ft." },
        { test: /shortbow/, category: "weapon", description: "Fernkampfwaffe. 1d6 piercing, range 80/320 ft.; nutzt DEX." },
        { test: /longsword/, category: "weapon", description: "Kriegsnahkampfwaffe: 1W8 Hiebschaden, vielseitig 1W10; bei Liora für die Schattenklingen-Bindung relevant." },
        { test: /quarterstaff/, category: "weapon", description: "Einfache Nahkampfwaffe: 1W6 Wuchtschaden, vielseitig 1W8; kann als arkaner Stab beschrieben werden." },
        { test: /arrows?/, category: "ammunition", description: "Munition für den Shortbow." },
        { test: /caltrops/, category: "consumable", description: "Ausstreubare Metallspitzen. Können Boden gefährlich machen und Bewegung verlangsamen." },
        { test: /^oil$/, category: "consumable", description: "Ölflasche. Kann als Brennstoff, Brandbeschleuniger oder improvisierter Verbrauchsgegenstand genutzt werden." },
        { test: /torch|torches/, category: "equipment", description: "Lichtquelle für dunkle Bereiche; brennt etwa 1 Stunde." },
        { test: /thieves' tools/, category: "tool", description: "Diebeswerkzeug zum Öffnen von Schlössern und Entschärfen von Fallen; für Miriel besonders relevant." },
        { test: /disguise kit/, category: "tool", description: "Verkleidungsset für Maskierungen, Bühnenrollen und Täuschungsmanöver." },
        { test: /forgery kit/, category: "tool", description: "Fälscherwerkzeug für Dokumente, Siegel und Schriftproben." },
        { test: /flute/, category: "tool", description: "Musikinstrument; kann auch als sozialer oder atmosphärischer Gegenstand genutzt werden." },
        { test: /spellbook/, category: "magicItem", description: "Zauberbuch. Enthält Suicas bekannte Wizard-Spells und ist zentral für Vorbereitung, Ritual Casting und Erwachtes Zauberbuch." },
        { test: /crystal/, category: "equipment", description: "Arkaner Fokus oder wertvoller Kristall, je nach Szene nutzbar." },
        { test: /ink|parchment|book|pen/, category: "equipment", description: "Schreib- und Studienmaterial für Notizen, Forschung, Zauberformeln oder Dokumente." },
        { test: /rope/, category: "equipment", description: "Hempen rope, 50 ft.; Standardausrüstung für Klettern, Sichern und Improvisation." },
        { test: /rations|waterskin|bedroll|backpack|pouch|clothes|robe|tinderbox|hammer|pitons|crowbar|candles?/, category: "equipment", description: "Normale Reise- oder Abenteuerausrüstung. Meist nur relevant, wenn die Szene danach fragt." },
        { test: /blue mushrooms|brass bowl|powdered iron|fleece pieces|pieces of fleece/, category: "equipment", description: "Zauberkomponente oder kurioser Vorratsgegenstand aus Miriels Ausrüstung." },
        { test: /versiegelte nachricht|coded street tokens|black ribbon|versteckter dolch/, category: "quest", description: "Story- oder Spionagegegenstand. Details können vom DM je nach Szene ergänzt werden." },
        { test: /coin|pearl|ring|scale|feather|shard|root|fang|sap|seed|leaves|borsten|silbernägelchen|staubflocken|nameplate|moss|stone heart|membrane/, category: "treasure", description: "Loot oder Trophäe. Kann als Hinweis, Materialkomponente oder verkaufbarer Fund verwendet werden." }
    ];

    for (const suggestion of suggestions) {
        if (suggestion.test.test(lower) === true) {
            return { category: suggestion.category, description: suggestion.description };
        }
    }

    return { category: "misc", description: "Kurze Beschreibung nach Bedarf ergänzen." };
}

function createInventoryListItem(rawItem = {}, fallbackIndex = 0) {
    if (typeof rawItem === "string") {
        const suggestion = getInventoryItemSuggestion(rawItem);
        return {
            id: `legacy-list-${fallbackIndex}`,
            name: rawItem.trim(),
            category: suggestion.category,
            quantity: 1,
            description: suggestion.description,
            notes: ""
        };
    }

    const name = getSafeOptionalString(rawItem.name) || "Neuer Gegenstand";
    const suggestion = getInventoryItemSuggestion(name);

    return {
        id: getSafeOptionalString(rawItem.id) || `list-${Date.now()}-${fallbackIndex}-${Math.random().toString(36).slice(2, 8)}`,
        name: name,
        category: getSafeInventoryCategory(rawItem.category || suggestion.category),
        quantity: getSafeNonNegativeInteger(rawItem.quantity, 1),
        consumable: rawItem.consumable === true,
        description: getSafeOptionalString(rawItem.description) || getSafeOptionalString(rawItem.notes) || suggestion.description,
        notes: getSafeOptionalString(rawItem.notes),
        status: getSafeNonNegativeInteger(rawItem.quantity, 1) > 0 ? "available" : "consumed"
    };
}

function getSafeCurrency(value) {
    if (value === null || typeof value !== "object") {
        return { gp: 0, sp: 0, cp: 0 };
    }

    return {
        gp: getSafeNonNegativeInteger(value.gp, 0),
        sp: getSafeNonNegativeInteger(value.sp, 0),
        cp: getSafeNonNegativeInteger(value.cp, 0)
    };
}

function parseCurrencyFromInventoryText(text) {
    const source = getSafeOptionalString(text);
    const gpMatch = source.match(/(\d+)\s*(?:gp|gold|g)/i);
    const spMatch = source.match(/(\d+)\s*(?:sp|silber|s)/i);
    const cpMatch = source.match(/(\d+)\s*(?:cp|kupfer|c)/i);
    return {
        gp: gpMatch ? Number(gpMatch[1]) : 0,
        sp: spMatch ? Number(spMatch[1]) : 0,
        cp: cpMatch ? Number(cpMatch[1]) : 0
    };
}

function splitInventoryEntries(text) {
    return getSafeOptionalString(text)
        .replace(/coins?:[^;\n]+[.;]?/ig, "")
        .split(/[;\n]+/)
        .map(function(entry) { return entry.trim().replace(/[.]$/, ""); })
        .filter(function(entry) { return entry !== ""; });
}

function getInventoryEntryCountAndName(entry) {
    const amountMatch = entry.match(/x\s*(\d+)$/i) || entry.match(/^(\d+)\s*x\s*/i);
    const count = amountMatch ? Math.max(1, Number(amountMatch[1])) : 1;
    const cleanName = entry.replace(/x\s*\d+$/i, "").replace(/^\d+\s*x\s*/i, "").trim();
    return { count: count, name: cleanName };
}

function createCustomConsumableCardFromEntry(entry, fallbackIndex) {
    const parsed = getInventoryEntryCountAndName(entry);
    const lower = parsed.name.toLowerCase();
    const item = createInventoryCard({
        id: `legacy-card-${fallbackIndex}-${Math.random().toString(36).slice(2, 8)}`,
        template: "customPotion",
        name: lower.includes("shrieker") ? "Billiger Trank gegen Shrieker-Sporen" : parsed.name,
        category: lower.includes("scroll") ? "scroll" : "potion",
        effect: lower.includes("shrieker") ? "Gegen Shrieker-Sporen" : "Eigener Itemeffekt",
        healingFormula: "",
        description: lower.includes("shrieker")
            ? "Billiger Spezialtrank gegen Shrieker-Sporen. Genaue Wirkung je nach Szene vom DM festlegen."
            : "Eigene Itemkarte. Effekt im Spiel festlegen oder in der Kartenschmiede verfeinern.",
        image: lower.includes("scroll") ? "assets/items/scroll_custom.jpg" : "assets/items/potion_custom.jpg",
        showAsAction: true,
        actionType: lower.includes("scroll") ? "action" : "action"
    }, fallbackIndex);
    return { item: item, count: parsed.count };
}

function createInventoryDataFromLegacyText(text) {
    const entries = splitInventoryEntries(text);
    const cards = [];
    const list = [];

    for (const entry of entries) {
        const lower = entry.toLowerCase();
        const parsed = getInventoryEntryCountAndName(entry);

        if (lower.includes("meisterlicher heiltrank") || lower.includes("potion of supreme healing") || (lower.includes("potion of healing") && lower.includes("supreme"))) {
            cards.push(createInventoryCard({
                ...createInventoryCardFromTemplate("supremeHealing"),
                id: "",
                quantity: parsed.count
            }, cards.length));
        } else if (lower.includes("großer heiltrank") || lower.includes("grosser heiltrank") || lower.includes("potion of superior healing") || (lower.includes("potion of healing") && lower.includes("superior"))) {
            cards.push(createInventoryCard({
                ...createInventoryCardFromTemplate("superiorHealing"),
                id: "",
                quantity: parsed.count
            }, cards.length));
        } else if (lower.includes("starker heiltrank") || lower.includes("potion of greater healing") || (lower.includes("potion of healing") && lower.includes("greater"))) {
            cards.push(createInventoryCard({
                ...createInventoryCardFromTemplate("greaterHealing"),
                id: "",
                quantity: parsed.count
            }, cards.length));
        } else if (lower.includes("heiltrank") || lower.includes("potion of healing")) {
            cards.push(createInventoryCard({
                ...createInventoryCardFromTemplate("healing"),
                id: "",
                quantity: parsed.count
            }, cards.length));
        } else if ((lower.includes("potion") || lower.includes("trank")) && (lower.includes("shrieker") || lower.includes("sporen") || lower.includes("custom"))) {
            const customCard = createCustomConsumableCardFromEntry(entry, cards.length);
            cards.push(createInventoryCard({
                ...customCard.item,
                id: "",
                quantity: customCard.count
            }, cards.length));
        } else {
            const suggestion = getInventoryItemSuggestion(parsed.name);
            list.push(createInventoryListItem({
                name: parsed.name,
                category: suggestion.category,
                quantity: parsed.count,
                description: suggestion.description
            }, list.length));
        }
    }

    return {
        currency: parseCurrencyFromInventoryText(text),
        cards: cards,
        list: list
    };
}

function getInventoryStackKey(item) {
    return JSON.stringify({
        template: item.template,
        name: item.name,
        category: item.category,
        effect: item.effect,
        description: item.description,
        healingFormula: item.healingFormula,
        image: item.image,
        showAsAction: item.showAsAction,
        actionType: item.actionType,
        executableEffect: item.executableEffect,
        controllerCanTransfer: item.controllerCanTransfer
    });
}

function mergeStackableInventoryCards(cards) {
    const mergedCards = [];
    const stackIndexes = new Map();

    for (const rawItem of cards) {
        const item = createInventoryCard(rawItem, mergedCards.length);
        const stackKey = getInventoryStackKey(item);
        const existingIndex = stackIndexes.get(stackKey);

        if (existingIndex === undefined) {
            stackIndexes.set(stackKey, mergedCards.length);
            mergedCards.push(item);
            continue;
        }

        const existingItem = mergedCards[existingIndex];
        existingItem.quantity = getSafeNonNegativeInteger(existingItem.quantity, 0)
            + getSafeNonNegativeInteger(item.quantity, 0);
        existingItem.used = getSafeNonNegativeInteger(existingItem.used, 0)
            + getSafeNonNegativeInteger(item.used, 0);
        existingItem.status = existingItem.quantity > 0 ? "available" : "consumed";
    }

    return mergedCards;
}

function getSafeInventoryCards(value) {
    if (Array.isArray(value) === false) {
        return [];
    }

    return value
        .slice(0, importSecurityLimits.maxInventoryCardsPerCard)
        .filter(function(item) { return item !== null && typeof item === "object"; })
        .map(function(item, index) { return createInventoryCard(item, index); })
        .filter(function(item) { return item.name.trim() !== ""; });
}

function getSafeInventoryList(value) {
    if (Array.isArray(value) === false) {
        return [];
    }

    return value
        .slice(0, importSecurityLimits.maxInventoryListItemsPerCard)
        .map(function(item, index) { return createInventoryListItem(item, index); })
        .filter(function(item) { return item.name.trim() !== ""; });
}

function sortInventoryListByName(list) {
    return [...list].sort(function(a, b) {
        return a.name.localeCompare(b.name, "de", { sensitivity: "base", numeric: true });
    });
}

function getInventoryCardSortRank(item) {
    const template = getSafeOptionalString(item.template);
    const lowerName = getSafeOptionalString(item.name).toLowerCase();
    const formula = getSafeOptionalString(item.healingFormula).replace(/\s+/g, "").toLowerCase();

    if (template === "supremeHealing" || lowerName.includes("supreme") || formula === "10d4+20") { return 10; }
    if (template === "superiorHealing" || lowerName.includes("superior") || formula === "8d4+8") { return 20; }
    if (template === "greaterHealing" || lowerName.includes("greater") || formula === "4d4+4") { return 30; }
    if (template === "healing" || lowerName === "potion of healing" || formula === "2d4+2") { return 40; }
    if (item.category === "potion") { return 50; }
    if (item.category === "scroll") { return 70; }
    return 60;
}

function sortInventoryCardsForDisplay(cards) {
    return [...cards].sort(function(a, b) {
        const rankDifference = getInventoryCardSortRank(a) - getInventoryCardSortRank(b);
        if (rankDifference !== 0) { return rankDifference; }
        return a.name.localeCompare(b.name, "de", { sensitivity: "base", numeric: true });
    });
}

function getInventoryData(card) {
    if (card === null) {
        return createEmptyInventoryData();
    }

    return {
        currency: getSafeCurrency(card.currency),
        cards: sortInventoryCardsForDisplay(getSafeInventoryCards(card.inventoryCards)),
        list: sortInventoryListByName(getSafeInventoryList(card.inventoryList))
    };
}

function getInventoryCards(card) {
    return getInventoryData(card).cards;
}

function syncCardInventoryData(card) {
    const inventoryData = getInventoryData(card);
    card.currency = inventoryData.currency;
    card.inventoryCards = inventoryData.cards;
    card.inventoryList = inventoryData.list;
}

function createActionFromInventoryItem(item) {
    return createCardAction({
        id: `item-${item.id}`,
        name: item.name,
        type: item.actionType,
        range: item.category === "potion" ? "Touch / Selbst" : "",
        damage: item.effect,
        description: item.description,
        sourceType: "item",
        sourceId: item.id,
        sourceLabel: "Item"
    });
}

function rollDiceFormula(formula) {
    const cleanFormula = getSafeOptionalString(formula).replace(/\s+/g, "");
    const match = cleanFormula.match(/^(\d+)d(\d+)([+-]\d+)?$/i);

    if (match === null) {
        return { total: 0, rolls: [], formula: cleanFormula };
    }

    const count = clampNumber(Number(match[1]), 1, 20);
    const sides = clampNumber(Number(match[2]), 1, 100);
    const modifier = match[3] !== undefined ? Number(match[3]) : 0;
    const rolls = [];
    let total = modifier;

    for (let index = 0; index < count; index = index + 1) {
        const roll = Math.floor(Math.random() * sides) + 1;
        rolls.push(roll);
        total = total + roll;
    }

    return { total: Math.max(0, total), rolls: rolls, formula: cleanFormula };
}

function removeInventoryCardById(card, itemId) {
    const cards = getSafeInventoryCards(card.inventoryCards);
    card.inventoryCards = cards.filter(function(item) { return item.id !== itemId; });
    syncCardInventoryData(card);
}

function getInventoryStateSnapshot(card) {
    return {
        cardId: card.id,
        inventoryCards: structuredClone(getSafeInventoryCards(card.inventoryCards)),
        inventoryList: structuredClone(getSafeInventoryList(card.inventoryList)),
        hp: card.hp,
        tempHp: card.tempHp,
        conditions: structuredClone(Array.isArray(card.conditions) ? card.conditions : []),
        effects: structuredClone(Array.isArray(card.effects) ? card.effects : [])
    };
}

function resolveItemEffectAmount(value) {
    const source = getSafeOptionalString(value);
    if (/^\d+d\d+(?:[+-]\d+)?$/i.test(source.replace(/\s+/g, ""))) {
        return rollDiceFormula(source);
    }
    const numericValue = Math.max(0, Number(source) || 0);
    return { total: numericValue, rolls: [], formula: source || String(numericValue) };
}

function applyExecutableItemEffect(item, target) {
    const effectType = item.executableEffect?.type || itemExecutableEffectTypes.none;
    const effectValue = getSafeOptionalString(item.executableEffect?.value);
    const result = resolveItemEffectAmount(effectValue);
    let summary = "";

    if (effectType === itemExecutableEffectTypes.healing) {
        applyHealing(target, result.total);
        summary = `${result.total} HP Heilung`;
    } else if (effectType === itemExecutableEffectTypes.damage) {
        applyDamage(target, result.total);
        summary = `${result.total} Schaden`;
    } else if (effectType === itemExecutableEffectTypes.temporaryHp) {
        applyTempHp(target, result.total);
        summary = `${result.total} temporäre HP`;
    } else if (effectType === itemExecutableEffectTypes.condition) {
        const conditionKey = effectValue.trim();
        if (conditionKey !== "" && target.conditions.includes(conditionKey) === false) {
            target.conditions.push(conditionKey);
        }
        summary = conditionKey !== "" ? `Condition ${conditionKey}` : "Condition";
    } else if (effectType === itemExecutableEffectTypes.customEffect) {
        const effectName = effectValue.trim() || item.name;
        target.effects = getSafeEffects([
            ...(Array.isArray(target.effects) ? target.effects : []),
            {
                id: createEffectId(),
                kind: "custom",
                name: effectName,
                colorKey: "violet",
                durationMode: effectDurationModes.manual,
                visibility: item.executableEffect?.visibility || effectVisibilityModes.public,
                sourceCardId: null,
                createdAt: new Date().toISOString()
            }
        ]);
        summary = `Effekt „${effectName}“`;
    }

    return summary;
}

function useInventoryCard(cardId, itemId, mode) {
    const card = findCardById(cardId);
    if (card === null) { return; }

    const cards = getSafeInventoryCards(card.inventoryCards);
    const itemIndex = cards.findIndex(function(candidate) { return candidate.id === itemId; });
    if (itemIndex < 0) { return; }
    const item = cards[itemIndex];

    if (item.quantity <= 0) {
        alert("Diese Itemkarte ist aufgebraucht.");
        return;
    }

    let target = card;
    if (mode === "target") {
        const selectedTargets = getSelectedHandCards();
        if (selectedTargets.length === 0) {
            alert("Bitte wähle zuerst eine Zielkarte auf der Hand aus.");
            return;
        }
        target = selectedTargets[0];
    }

    const affectedCards = target.id === card.id ? [card] : [card, target];
    const before = affectedCards.map(getInventoryStateSnapshot);
    const effectSummary = applyExecutableItemEffect(item, target);

    item.quantity = Math.max(0, item.quantity - 1);
    item.status = item.quantity > 0 ? "available" : "consumed";
    item.used = getSafeNonNegativeInteger(item.used, 0) + 1;
    cards[itemIndex] = createInventoryCard(item, itemIndex);
    card.inventoryCards = cards;
    syncCardInventoryData(card);

    const after = affectedCards.map(getInventoryStateSnapshot);
    const targetName = target.publicName || target.name;
    const message = `${card.publicName || card.name} verwendet ${item.name}${target.id !== card.id ? ` auf ${targetName}` : ""}${effectSummary !== "" ? `: ${effectSummary}` : ""}. Menge ${item.quantity}.`;

    recordGameEvent({
        type: "item_used",
        sourceCardId: card.id,
        targetCardId: target.id,
        targetCardIds: affectedCards.map(function(entry) { return entry.id; }),
        before,
        after,
        metadata: {
            itemId: item.id,
            itemName: item.name,
            quantityAfter: item.quantity,
            effectType: item.executableEffect?.type || itemExecutableEffectTypes.none
        },
        message
    });

    saveAndBroadcastAppState();
    renderCardsPreservingViewport();
}

function transferInventoryCard(cardId, itemId) {
    const sourceCard = findCardById(cardId);
    if (sourceCard === null) { return; }
    const sourceCards = getSafeInventoryCards(sourceCard.inventoryCards);
    const sourceIndex = sourceCards.findIndex(function(item) { return item.id === itemId; });
    if (sourceIndex < 0) { return; }
    const item = sourceCards[sourceIndex];
    if (item.quantity <= 0) {
        alert("Aufgebrauchte Itemkarten können nicht übertragen werden.");
        return;
    }

    const targets = gameState.cards.filter(function(card) {
        return card.id !== sourceCard.id && card.location !== cardLocations.trash && card.cardKind === cardKinds.character;
    });
    if (targets.length === 0) {
        alert("Es ist keine andere Charakterkarte als Empfänger verfügbar.");
        return;
    }

    const targetList = targets.map(function(card, index) {
        return `${index + 1}: ${card.publicName || card.name}`;
    }).join("\n");
    const targetChoice = Number(prompt(`An welche Karte soll „${item.name}“ übertragen werden?\n\n${targetList}`, "1"));
    if (!Number.isInteger(targetChoice) || targetChoice < 1 || targetChoice > targets.length) { return; }
    const targetCard = targets[targetChoice - 1];

    const quantity = Number(prompt(`Wie viele Exemplare übertragen? Verfügbar: ${item.quantity}`, String(item.quantity)));
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > item.quantity) {
        alert("Bitte gib eine gültige Menge an.");
        return;
    }

    const before = [getInventoryStateSnapshot(sourceCard), getInventoryStateSnapshot(targetCard)];

    item.quantity -= quantity;
    item.status = item.quantity > 0 ? "available" : "consumed";
    sourceCards[sourceIndex] = createInventoryCard(item, sourceIndex);
    sourceCard.inventoryCards = sourceCards;

    const targetCards = getSafeInventoryCards(targetCard.inventoryCards);
    const transferredItem = createInventoryCard({
        ...structuredClone(item),
        id: createUniqueId(),
        quantity,
        status: "available",
        used: 0
    }, targetCards.length);
    targetCards.push(transferredItem);
    targetCard.inventoryCards = targetCards;
    syncCardInventoryData(sourceCard);
    syncCardInventoryData(targetCard);

    const after = [getInventoryStateSnapshot(sourceCard), getInventoryStateSnapshot(targetCard)];
    recordGameEvent({
        type: "item_transferred",
        sourceCardId: sourceCard.id,
        targetCardId: targetCard.id,
        targetCardIds: [sourceCard.id, targetCard.id],
        amount: quantity,
        before,
        after,
        metadata: {
            itemId: item.id,
            newItemId: transferredItem.id,
            itemName: item.name
        },
        message: `${quantity}× ${item.name} von ${sourceCard.publicName || sourceCard.name} an ${targetCard.publicName || targetCard.name} übertragen.`
    });

    saveAndBroadcastAppState();
    renderCardsPreservingViewport();
}

function useInventoryListItem(cardId, itemId) {
    const card = findCardById(cardId);
    if (card === null) { return; }
    const list = getSafeInventoryList(card.inventoryList);
    const index = list.findIndex(function(item) { return item.id === itemId; });
    if (index < 0 || list[index].consumable !== true) { return; }
    if (list[index].quantity <= 0) {
        alert("Dieser Gegenstand ist aufgebraucht.");
        return;
    }

    const before = [getInventoryStateSnapshot(card)];
    list[index].quantity -= 1;
    list[index].status = list[index].quantity > 0 ? "available" : "consumed";
    card.inventoryList = list;
    syncCardInventoryData(card);
    const after = [getInventoryStateSnapshot(card)];

    recordGameEvent({
        type: "item_used",
        sourceCardId: card.id,
        targetCardId: card.id,
        targetCardIds: [card.id],
        before,
        after,
        metadata: { inventoryListItemId: itemId, itemName: list[index].name },
        message: `${card.publicName || card.name} verwendet ${list[index].name}. Menge ${list[index].quantity}.`
    });

    saveAndBroadcastAppState();
    renderCardsPreservingViewport();
}

function addInventoryTemplateToCard(cardId, templateName) {
    const card = findCardById(cardId);
    if (card === null) { return; }

    const cards = getInventoryCards(card);
    cards.push(createInventoryCardFromTemplate(templateName));
    card.inventoryCards = cards;
    syncCardInventoryData(card);
    addCombatLogMessage(`${card.publicName || card.name}: ${inventoryCardTemplates[templateName]?.name || "Item"} ins Inventar gelegt.`);
    saveAndBroadcastAppState();
    renderCardsPreservingDetailScroll();
}

function updateInventoryCurrency(cardId) {
    const card = findCardById(cardId);
    if (card === null) { return; }

    const previousCurrency = getSafeCurrency(card.currency);
    const nextCurrency = {
        gp: getSafeNonNegativeInteger(document.querySelector(`#inventory-gp-${cardId}`)?.value, 0),
        sp: getSafeNonNegativeInteger(document.querySelector(`#inventory-sp-${cardId}`)?.value, 0),
        cp: getSafeNonNegativeInteger(document.querySelector(`#inventory-cp-${cardId}`)?.value, 0)
    };

    card.currency = nextCurrency;
    syncCardInventoryData(card);

    const currencyChanges = [];
    if (previousCurrency.gp !== nextCurrency.gp) { currencyChanges.push(`Gold ${previousCurrency.gp} → ${nextCurrency.gp}`); }
    if (previousCurrency.sp !== nextCurrency.sp) { currencyChanges.push(`Silber ${previousCurrency.sp} → ${nextCurrency.sp}`); }
    if (previousCurrency.cp !== nextCurrency.cp) { currencyChanges.push(`Kupfer ${previousCurrency.cp} → ${nextCurrency.cp}`); }
    if (currencyChanges.length > 0) {
        addCombatLogMessage(`${card.publicName || card.name}: Geldbeutel geändert (${currencyChanges.join(", ")}).`);
    }

    saveAndBroadcastAppState();
    renderCardDetailPanelPreservingScroll(getFocusedCard(getHandCards(), getActiveCard(getHandCards())));
}

function openDetailInventoryCardEditor(cardId, itemId = "", templateName = "customPotion") {
    const card = findCardById(cardId);
    if (card === null) { return; }
    suppressDetailInventoryClickAwayOnce = true;
    activeDetailInventoryListEditor = null;
    activeDetailInventoryCardEditor = { cardId: cardId, itemId: itemId, templateName: templateName };
    renderCardDetailPanelPreservingScroll(getFocusedCard(getHandCards(), getActiveCard(getHandCards())));
}

function cancelDetailInventoryEditor() {
    activeDetailInventoryCardEditor = null;
    activeDetailInventoryListEditor = null;
    renderCardDetailPanelPreservingScroll(getFocusedCard(getHandCards(), getActiveCard(getHandCards())));
}

function getDetailCardEditorItem(card, editor) {
    if (editor === null || card === null) { return null; }
    if (editor.itemId !== "") {
        return getInventoryCards(card).find(function(item) { return item.id === editor.itemId; }) || null;
    }
    return createInventoryCardFromTemplate(editor.templateName || "customPotion");
}

function readDetailInventoryCardEditor(cardId, existingId = "") {
    const category = document.querySelector(`#detail-item-category-${cardId}`)?.value || "potion";
    return createInventoryCard({
        id: existingId,
        name: document.querySelector(`#detail-item-name-${cardId}`)?.value.trim() || "Eigene Itemkarte",
        category: category,
        effect: document.querySelector(`#detail-item-effect-${cardId}`)?.value.trim() || "",
        healingFormula: document.querySelector(`#detail-item-healing-${cardId}`)?.value.trim() || "",
        quantity: document.querySelector(`#detail-item-quantity-${cardId}`)?.value || 1,
        executableEffect: {
            type: document.querySelector(`#detail-item-executable-type-${cardId}`)?.value || itemExecutableEffectTypes.none,
            value: document.querySelector(`#detail-item-executable-value-${cardId}`)?.value.trim() || "",
            visibility: effectVisibilityModes.public
        },
        controllerCanTransfer: document.querySelector(`#detail-item-controller-transfer-${cardId}`)?.checked === true,
        description: document.querySelector(`#detail-item-description-${cardId}`)?.value.trim() || "",
        image: document.querySelector(`#detail-item-image-${cardId}`)?.value.trim() || (category === "scroll" ? "assets/items/scroll_custom.jpg" : "assets/items/potion_custom.jpg"),
        showAsAction: document.querySelector(`#detail-item-show-action-${cardId}`)?.checked === true,
        actionType: document.querySelector(`#detail-item-action-type-${cardId}`)?.value || "action"
    });
}

function saveDetailInventoryCardEditor(cardId, openForgeAfterSave = false) {
    const card = findCardById(cardId);
    if (card === null || activeDetailInventoryCardEditor === null) { return; }

    const cards = getInventoryCards(card);
    const editor = activeDetailInventoryCardEditor;
    const existingIndex = cards.findIndex(function(item) { return item.id === editor.itemId; });
    const nextItem = readDetailInventoryCardEditor(cardId, existingIndex >= 0 ? cards[existingIndex].id : "");

    if (existingIndex >= 0) {
        cards[existingIndex] = nextItem;
    } else {
        cards.push(nextItem);
    }

    card.inventoryCards = cards;
    syncCardInventoryData(card);
    activeDetailInventoryCardEditor = null;
    saveAndBroadcastAppState();

    if (openForgeAfterSave === true) {
        openInventoryCardInForge(cardId, nextItem.id);
        return;
    }

    renderCardsPreservingDetailScroll();
}

function removeInventoryCardFromDetails(cardId, itemId, shouldLog = false) {
    const card = findCardById(cardId);
    if (card === null) { return; }
    const item = getInventoryCards(card).find(function(candidate) { return candidate.id === itemId; });
    removeInventoryCardById(card, itemId);
    activeDetailInventoryCardEditor = null;
    if (shouldLog === true && item !== undefined) {
        addCombatLogMessage(`${card.publicName || card.name}: ${item.name} aus dem Inventar entfernt.`);
    }
    saveAndBroadcastAppState();
    renderCardsPreservingDetailScroll();
}

function openInventoryCardInForge(cardId, itemId) {
    openEditCardForm(cardId);
    activeForgeInventoryEditor = { prefix: "edit-card", itemId: itemId, itemType: "card", isNewDraft: false };
    setForgeTab("inventory");
    renderForgeInventoryManager("edit-card");
}

function openDetailInventoryListEditor(cardId, itemId = "") {
    const card = findCardById(cardId);
    if (card === null) { return; }
    suppressDetailInventoryClickAwayOnce = true;
    activeDetailInventoryCardEditor = null;
    activeDetailInventoryListEditor = { cardId: cardId, itemId: itemId };
    renderCardDetailPanelPreservingScroll(getFocusedCard(getHandCards(), getActiveCard(getHandCards())));
}

function getDetailListEditorItem(card, editor) {
    if (editor === null || card === null) { return null; }
    if (editor.itemId !== "") {
        return getInventoryData(card).list.find(function(item) { return item.id === editor.itemId; }) || null;
    }
    return createInventoryListItem({ name: "", category: "equipment", quantity: 1, description: "" });
}

function saveDetailInventoryListEditor(cardId) {
    const card = findCardById(cardId);
    if (card === null || activeDetailInventoryListEditor === null) { return; }

    const editor = activeDetailInventoryListEditor;
    const list = getInventoryData(card).list;
    const existingIndex = list.findIndex(function(item) { return item.id === editor.itemId; });
    const nextItem = createInventoryListItem({
        id: existingIndex >= 0 ? list[existingIndex].id : "",
        name: document.querySelector(`#detail-list-name-${cardId}`)?.value.trim() || "Neuer Gegenstand",
        category: document.querySelector(`#detail-list-category-${cardId}`)?.value || "equipment",
        quantity: document.querySelector(`#detail-list-quantity-${cardId}`)?.value || 1,
        consumable: document.querySelector(`#detail-list-consumable-${cardId}`)?.checked === true,
        description: document.querySelector(`#detail-list-description-${cardId}`)?.value.trim() || ""
    }, list.length);

    if (existingIndex >= 0) {
        list[existingIndex] = nextItem;
    } else {
        list.push(nextItem);
    }

    card.inventoryList = list;
    syncCardInventoryData(card);
    activeDetailInventoryListEditor = null;
    saveAndBroadcastAppState();
    renderCardsPreservingDetailScroll();
}

function removeInventoryListItem(cardId, itemId) {
    const card = findCardById(cardId);
    if (card === null) { return; }

    card.inventoryList = getInventoryData(card).list.filter(function(item) { return item.id !== itemId; });
    syncCardInventoryData(card);
    activeDetailInventoryListEditor = null;
    saveAndBroadcastAppState();
    renderCardsPreservingDetailScroll();
}

function createInventoryAddMenuHtml(cardId, context = "details", prefix = "") {
    const actionPrefix = context === "forge" ? `addForgeInventoryTemplate('${prefix}',` : `addInventoryTemplateToCard(${cardId},`;
    const customPotionAction = context === "forge" ? `addForgeInventoryTemplate('${prefix}', 'customPotion')` : `openDetailInventoryCardEditor(${cardId}, '', 'customPotion')`;
    const customScrollAction = context === "forge" ? `addForgeInventoryTemplate('${prefix}', 'customScroll')` : `openDetailInventoryCardEditor(${cardId}, '', 'customScroll')`;

    return `
        <details class="section-menu inventory-add-menu">
            <summary class="section-menu-summary">Itemkarte hinzufügen</summary>
            <div class="section-menu-panel inventory-add-menu-panel">
                <button type="button" onclick="${actionPrefix} 'healing')">Heiltrank</button>
                <button type="button" onclick="${actionPrefix} 'greaterHealing')">Starker Heiltrank</button>
                <button type="button" onclick="${actionPrefix} 'superiorHealing')">Großer Heiltrank</button>
                <button type="button" onclick="${actionPrefix} 'supremeHealing')">Meisterlicher Heiltrank</button>
                <button type="button" onclick="${customPotionAction}">Eigene Potion …</button>
                <button type="button" onclick="${customScrollAction}">Eigene Scroll …</button>
            </div>
        </details>
    `;
}

function createInventoryCardHtml(cardId, item) {
    const safeImage = escapeHtml(normalizeInventoryImagePath(item.image, item.category));
    const metaText = inventoryCategoryLabels[item.category] || "Item";
    const isConsumed = item.quantity <= 0;
    const hasExecutableEffect = item.executableEffect?.type !== itemExecutableEffectTypes.none || item.healingFormula !== "";
    const useLabel = item.category === "scroll" ? "Wirken" : "Verbrauchen";
    const descriptionText = item.description !== "" ? item.description : item.effect;
    const descriptionHtml = createInventoryDescriptionHtml(descriptionText);

    return `
        <article class="inventory-item-card inventory-item-card-${escapeHtml(item.category)} ${isConsumed ? "inventory-item-consumed" : ""}">
            <div class="inventory-item-card-header">
                <div class="inventory-item-title-block">
                    <h5>${createInventoryItemTitleHtml(item.name)}</h5>
                    <p class="inventory-item-meta">${escapeHtml(metaText)} · Menge ${item.quantity}${isConsumed ? " · Aufgebraucht" : ""}</p>
                </div>
                <details class="inventory-item-menu">
                    <summary class="inventory-item-menu-summary" aria-label="Aktionen für ${escapeHtml(item.name)}">☰</summary>
                    <div class="inventory-item-menu-panel">
                        ${hasExecutableEffect ? `<button type="button" ${isConsumed ? "disabled" : ""} onclick="useInventoryCard(${cardId}, '${item.id}', 'self')">${item.category === "potion" ? "Selbst verwenden" : useLabel}</button>` : `<button type="button" ${isConsumed ? "disabled" : ""} onclick="useInventoryCard(${cardId}, '${item.id}', 'self')">${useLabel}</button>`}
                        ${hasExecutableEffect ? `<button class="inventory-item-target-menu-button" type="button" ${isConsumed ? "disabled" : ""} onclick="useInventoryCard(${cardId}, '${item.id}', 'target')">Auf Ziel anwenden</button>` : ""}
                        <button type="button" ${isConsumed ? "disabled" : ""} onclick="transferInventoryCard(${cardId}, '${item.id}')">Übertragen …</button>
                        <button type="button" onclick="openDetailInventoryCardEditor(${cardId}, '${item.id}')">Edit</button>
                        <button class="card-menu-danger" type="button" onclick="removeInventoryCardFromDetails(${cardId}, '${item.id}', true)">Entfernen</button>
                    </div>
                </details>
            </div>
            <div class="inventory-item-art">
                <img src="${safeImage}" alt="${escapeHtml(item.name)}">
            </div>
            <div class="inventory-item-copy">
                ${descriptionHtml}
            </div>
        </article>
    `;
}

function createDetailInventoryCardEditorHtml(card) {
    if (activeDetailInventoryCardEditor === null || activeDetailInventoryCardEditor.cardId !== card.id) { return ""; }
    const item = getDetailCardEditorItem(card, activeDetailInventoryCardEditor);
    if (item === null) { return ""; }

    const categoryOptions = Object.keys(inventoryCategoryLabels)
        .filter(function(key) { return ["potion", "scroll", "consumable", "magicItem", "quest", "misc"].includes(key); })
        .map(function(key) { return `<option value="${key}" ${item.category === key ? "selected" : ""}>${inventoryCategoryLabels[key]}</option>`; })
        .join("");
    const typeOptions = Object.keys(cardActionTypeSingularLabels).map(function(key) {
        return `<option value="${key}" ${item.actionType === key ? "selected" : ""}>${cardActionTypeSingularLabels[key]}</option>`;
    }).join("");
    const isNew = activeDetailInventoryCardEditor.itemId === "";

    return `
        <section class="inventory-inline-editor">
            <div class="forge-spell-editor-header"><h5>${isNew ? "Itemkarte hinzufügen" : "Itemkarte bearbeiten"}</h5><span>${escapeHtml(item.name)}</span></div>
            <div class="forge-spell-editor-grid">
                <label class="form-field forge-spell-editor-wide"><span>Name</span><input id="detail-item-name-${card.id}" type="text" value="${escapeHtml(item.name)}"></label>
                <label class="form-field"><span>Kategorie</span><select id="detail-item-category-${card.id}">${categoryOptions}</select></label>
                <label class="form-field"><span>Aktionstyp</span><select id="detail-item-action-type-${card.id}">${typeOptions}</select></label>
                <label class="form-field"><span>Effekt/Kurztext</span><input id="detail-item-effect-${card.id}" type="text" placeholder="Kurzer Effekt oder Nutzen" value="${escapeHtml(item.effect)}"></label>
                <label class="form-field"><span>Heilformel (Legacy)</span><input id="detail-item-healing-${card.id}" type="text" placeholder="2d4+2" value="${escapeHtml(item.healingFormula)}"></label>
                <label class="form-field"><span>Menge</span><input id="detail-item-quantity-${card.id}" type="number" min="0" step="1" value="${item.quantity}"></label>
                <label class="form-field"><span>Ausführbarer Effekt</span><select id="detail-item-executable-type-${card.id}">
                    ${Object.entries(itemExecutableEffectLabels).map(function(entry) { return `<option value="${entry[0]}" ${item.executableEffect?.type === entry[0] ? "selected" : ""}>${entry[1]}</option>`; }).join("")}
                </select></label>
                <label class="form-field"><span>Effektwert</span><input id="detail-item-executable-value-${card.id}" type="text" placeholder="z. B. 2d4+2, poisoned oder Brennt" value="${escapeHtml(item.executableEffect?.value || "")}"></label>
                <label class="checkbox-field forge-checkbox-card forge-spell-editor-wide"><input id="detail-item-controller-transfer-${card.id}" type="checkbox" ${item.controllerCanTransfer === true ? "checked" : ""}><span>Späteren Controller-Transfer erlauben</span></label>
                <label class="form-field forge-spell-editor-wide"><span>Bildpfad</span><input id="detail-item-image-${card.id}" type="text" value="${escapeHtml(item.image)}"></label>
                <label class="checkbox-field forge-checkbox-card forge-spell-editor-wide"><input id="detail-item-show-action-${card.id}" type="checkbox" ${item.showAsAction === true ? "checked" : ""}><span>Im Aktionen-Tab anzeigen</span></label>
                <label class="form-field forge-spell-editor-wide"><span>Beschreibung</span><textarea id="detail-item-description-${card.id}" rows="4" placeholder="Kurze Beschreibung nach Bedarf ergänzen">${escapeHtml(item.description)}</textarea></label>
            </div>
            <div class="inventory-inline-editor-actions">
                <button type="button" onclick="saveDetailInventoryCardEditor(${card.id})">${isNew ? "Hinzufügen" : "Speichern"}</button>
                <button type="button" onclick="saveDetailInventoryCardEditor(${card.id}, true)">In Kartenschmiede verfeinern</button>
                ${isNew ? "" : `<button class="card-menu-danger" type="button" onclick="removeInventoryCardFromDetails(${card.id}, '${item.id}')">Löschen</button>`}
                <button type="button" onclick="cancelDetailInventoryEditor()">Abbrechen</button>
            </div>
        </section>
    `;
}

function createInventoryListHtml(cardId, list) {
    if (list.length === 0) {
        return `<p class="detail-placeholder-text">Keine normalen Inventareinträge.</p>`;
    }

    return `
        <div class="inventory-list-table">
            ${list.map(function(item) {
                const label = inventoryCategoryLabels[item.category] || "Sonstiges";
                const quantityText = item.quantity > 1 ? `x${item.quantity}` : "";
                return `
                    <details class="inventory-list-row-details">
                        <summary>
                            <span class="inventory-list-row-chevron" aria-hidden="true">›</span>
                            <span class="inventory-list-row-name">${escapeHtml(item.name)}${quantityText !== "" ? ` ${escapeHtml(quantityText)}` : ""}</span>
                            <span class="inventory-list-row-meta inventory-category-tag">${escapeHtml(label)}</span>
                        </summary>
                        <div class="inventory-list-row-body">
                            <p>${escapeHtml(item.description || "Keine Beschreibung eingetragen.")}</p>
                            <div class="inventory-list-row-actions">
                                ${item.consumable === true ? `<button type="button" ${item.quantity <= 0 ? "disabled" : ""} onclick="useInventoryListItem(${cardId}, '${item.id}')">Verwenden</button>` : ""}
                                <button type="button" onclick="openDetailInventoryListEditor(${cardId}, '${item.id}')">Edit</button>
                                <button class="card-menu-danger" type="button" onclick="removeInventoryListItem(${cardId}, '${item.id}')" title="Eintrag entfernen" aria-label="${escapeHtml(item.name)} entfernen">Löschen</button>
                            </div>
                        </div>
                    </details>
                `;
            }).join("")}
        </div>
    `;
}

function createDetailInventoryListEditorHtml(card) {
    if (activeDetailInventoryListEditor === null || activeDetailInventoryListEditor.cardId !== card.id) { return ""; }
    const item = getDetailListEditorItem(card, activeDetailInventoryListEditor);
    if (item === null) { return ""; }
    const categoryOptions = Object.keys(inventoryCategoryLabels).map(function(key) {
        return `<option value="${key}" ${item.category === key ? "selected" : ""}>${inventoryCategoryLabels[key]}</option>`;
    }).join("");
    const isNew = activeDetailInventoryListEditor.itemId === "";

    return `
        <section class="inventory-inline-editor inventory-list-inline-editor">
            <div class="forge-spell-editor-header"><h5>${isNew ? "Gegenstand hinzufügen" : "Gegenstand bearbeiten"}</h5><span>${escapeHtml(item.name)}</span></div>
            <div class="forge-spell-editor-grid">
                <label class="form-field forge-spell-editor-wide"><span>Name</span><input id="detail-list-name-${card.id}" type="text" placeholder="Name des Gegenstands" value="${escapeHtml(item.name)}"></label>
                <label class="form-field"><span>Kategorie</span><select id="detail-list-category-${card.id}">${categoryOptions}</select></label>
                <label class="form-field"><span>Menge</span><input id="detail-list-quantity-${card.id}" type="number" min="0" value="${item.quantity}"></label>
                <label class="checkbox-field forge-checkbox-card"><input id="detail-list-consumable-${card.id}" type="checkbox" ${item.consumable === true ? "checked" : ""}><span>Verbrauchbar</span></label>
                <label class="form-field forge-spell-editor-wide"><span>Beschreibung</span><textarea id="detail-list-description-${card.id}" rows="4" placeholder="Kurze Beschreibung nach Bedarf ergänzen">${escapeHtml(item.description)}</textarea></label>
            </div>
            <div class="inventory-inline-editor-actions">
                <button type="button" onclick="saveDetailInventoryListEditor(${card.id})">${isNew ? "Hinzufügen" : "Speichern"}</button>
                ${isNew ? "" : `<button class="card-menu-danger" type="button" onclick="removeInventoryListItem(${card.id}, '${item.id}')">Löschen</button>`}
                <button type="button" onclick="cancelDetailInventoryEditor()">Abbrechen</button>
            </div>
        </section>
    `;
}


function getInventoryStageStartIndex(cardId, cardCount, visibleCount = 2) {
    const maxStart = Math.max(0, cardCount - visibleCount);
    const currentStart = Number(inventoryStageStartIndexes[cardId] || 0);
    const nextStart = Math.max(0, Math.min(maxStart, currentStart));
    inventoryStageStartIndexes[cardId] = nextStart;
    return nextStart;
}

function shiftInventoryStage(cardId, direction) {
    const card = findCardById(cardId);
    if (card === null) { return; }
    const cards = getInventoryData(card).cards;
    const visibleCount = 2;
    const currentStart = getInventoryStageStartIndex(cardId, cards.length, visibleCount);
    const maxStart = Math.max(0, cards.length - visibleCount);
    inventoryStageStartIndexes[cardId] = Math.max(0, Math.min(maxStart, currentStart + direction));
    renderCardDetailPanel(getFocusedCard(getHandCards(), getActiveCard(getHandCards())));
}

function createInventoryGhostCardHtml(item, side) {
    if (item === undefined || item === null) { return ""; }
    const safeImage = escapeHtml(normalizeInventoryImagePath(item.image, item.category));
    return `
        <article class="inventory-ghost-card inventory-ghost-card-${side}" aria-hidden="true">
            <div class="inventory-ghost-card-header">${escapeHtml(item.name)}</div>
            <div class="inventory-ghost-card-art"><img src="${safeImage}" alt=""></div>
        </article>
    `;
}

function createInventoryTabHtml(card) {
    const inventory = getInventoryData(card);
    const visibleInventoryCardCount = 2;
    const stageStartIndex = getInventoryStageStartIndex(card.id, inventory.cards.length, visibleInventoryCardCount);
    const visibleCards = inventory.cards.slice(stageStartIndex, stageStartIndex + visibleInventoryCardCount);
    const leftGhostItem = inventory.cards[stageStartIndex - 1] || (inventory.cards.length > visibleInventoryCardCount ? inventory.cards[stageStartIndex] : null);
    const rightGhostItem = inventory.cards[stageStartIndex + visibleInventoryCardCount] || (inventory.cards.length > visibleInventoryCardCount ? inventory.cards[Math.min(inventory.cards.length - 1, stageStartIndex + visibleCards.length - 1)] : null);
    const leftGhostHtml = createInventoryGhostCardHtml(leftGhostItem, "left");
    const rightGhostHtml = createInventoryGhostCardHtml(rightGhostItem, "right");
    const canMoveLeft = stageStartIndex > 0;
    const canMoveRight = stageStartIndex + visibleInventoryCardCount < inventory.cards.length;
    const hasLeftGhost = leftGhostHtml !== "";
    const hasRightGhost = rightGhostHtml !== "";
    const cardsHtml = inventory.cards.length > 0
        ? visibleCards.map(function(item) { return createInventoryCardHtml(card.id, item); }).join("")
        : `<p class="detail-placeholder-text inventory-empty-ribbon-message">Keine Itemkarten im Schnellzugriff.</p>`;

    const detailCardEditorHtml = createDetailInventoryCardEditorHtml(card);
    const isCardEditorOpen = detailCardEditorHtml !== "";

    return `
        <div class="active-hand-detail-content active-hand-detail-scroll active-hand-inventory-reference detail-tab-surface">
            ${isCardEditorOpen ? `
                <section class="active-hand-detail-section inventory-detail-editor-section">
                    ${detailCardEditorHtml}
                </section>
            ` : ""}
            <section class="active-hand-detail-section inventory-card-section inventory-consumable-stage ${isCardEditorOpen ? "inventory-stage-editor-open" : ""}">
                <div class="active-hand-section-title-row inventory-stage-title-row">
                    <div>
                        <p class="section-eyebrow">Itemkarten</p>
                    </div>
                    ${createInventoryAddMenuHtml(card.id)}
                </div>
                ${isCardEditorOpen ? `
                    <div class="inventory-stage-paused-note">
                        <strong>Itemkarte wird bearbeitet</strong>
                        <span>Speichere oder schließe den Editor, um die Kartenübersicht wieder einzublenden.</span>
                    </div>
                ` : `
                <div class="inventory-consumable-shell">
                    <div class="inventory-stage-rail inventory-stage-rail-left ${hasLeftGhost ? "has-ghost-card" : "is-empty"} ${canMoveLeft ? "can-scroll" : "at-edge"}">
                        ${leftGhostHtml}
                        <button class="inventory-ribbon-scroll inventory-ribbon-scroll-left" type="button" onclick="shiftInventoryStage(${card.id}, -1)" aria-label="Vorherige Itemkarten anzeigen" ${canMoveLeft ? "" : "disabled"}>‹</button>
                    </div>
                    <div class="inventory-card-ribbon-viewport">
                        <div class="inventory-card-ribbon inventory-card-ribbon-static" id="inventory-card-ribbon-${card.id}">${cardsHtml}</div>
                    </div>
                    <div class="inventory-stage-rail inventory-stage-rail-right ${hasRightGhost ? "has-ghost-card" : "is-empty"} ${canMoveRight ? "can-scroll" : "at-edge"}">
                        ${rightGhostHtml}
                        <button class="inventory-ribbon-scroll inventory-ribbon-scroll-right" type="button" onclick="shiftInventoryStage(${card.id}, 1)" aria-label="Weitere Itemkarten anzeigen" ${canMoveRight ? "" : "disabled"}>›</button>
                    </div>
                </div>
                `}
            </section>


            <section class="active-hand-detail-section inventory-list-section">
                <div class="active-hand-section-title-row">
                    <div>
                        <p class="section-eyebrow">Inventarliste</p>
                        <p class="inventory-section-hint">Normale Ausrüstung, Loot und Questgegenstände. Details öffnen sich per Klick.</p>
                    </div>
                    <button class="inventory-list-add-button forge-add-button" type="button" onclick="openDetailInventoryListEditor(${card.id})">Gegenstand hinzufügen</button>
                </div>
                ${createDetailInventoryListEditorHtml(card)}
                ${createInventoryListHtml(card.id, inventory.list)}
            </section>
            <section class="active-hand-detail-section inventory-currency-section">
                <div class="inventory-currency-card">
                    <div class="inventory-currency-title">Geldbeutel</div>
                    <label><span>Gold</span><input id="inventory-gp-${card.id}" type="number" min="0" value="${inventory.currency.gp}" onchange="updateInventoryCurrency(${card.id})"></label>
                    <label><span>Silber</span><input id="inventory-sp-${card.id}" type="number" min="0" value="${inventory.currency.sp}" onchange="updateInventoryCurrency(${card.id})"></label>
                    <label><span>Kupfer</span><input id="inventory-cp-${card.id}" type="number" min="0" value="${inventory.currency.cp}" onchange="updateInventoryCurrency(${card.id})"></label>
                </div>
            </section>

        </div>
    `;
}

function getForgeInventoryDraft(prefix) {
    const cardsElement = document.querySelector(`#${prefix}-inventory-cards`);
    const listElement = document.querySelector(`#${prefix}-inventory-list`);
    const cards = cardsElement !== null && cardsElement.value.trim() !== ""
        ? getSafeInventoryCards(parseJsonValue(cardsElement.value, []), "")
        : [];
    const list = listElement !== null && listElement.value.trim() !== ""
        ? getSafeInventoryList(parseJsonValue(listElement.value, []), "")
        : [];

    return {
        currency: {
            gp: getSafeNonNegativeInteger(document.querySelector(`#${prefix}-currency-gp`)?.value, 0),
            sp: getSafeNonNegativeInteger(document.querySelector(`#${prefix}-currency-sp`)?.value, 0),
            cp: getSafeNonNegativeInteger(document.querySelector(`#${prefix}-currency-cp`)?.value, 0)
        },
        cards: cards,
        list: list
    };
}

function setForgeInventory(prefix, inventoryData) {
    const data = inventoryData || createEmptyInventoryData();
    const cardsElement = document.querySelector(`#${prefix}-inventory-cards`);
    const listElement = document.querySelector(`#${prefix}-inventory-list`);
    if (cardsElement !== null) { cardsElement.value = JSON.stringify(getSafeInventoryCards(data.cards)); }
    if (listElement !== null) { listElement.value = JSON.stringify(getSafeInventoryList(data.list)); }
    setInputValue(`${prefix}-currency-gp`, getSafeCurrency(data.currency).gp);
    setInputValue(`${prefix}-currency-sp`, getSafeCurrency(data.currency).sp);
    setInputValue(`${prefix}-currency-cp`, getSafeCurrency(data.currency).cp);
}

function readInventoryFromForge(prefix) {
    return getForgeInventoryDraft(prefix);
}

function createInventoryFieldsFromForge(prefix) {
    const inventory = readInventoryFromForge(prefix);
    return {
        currency: inventory.currency,
        inventoryCards: inventory.cards,
        inventoryList: inventory.list,
    };
}

function writeInventoryToForge(prefix, card) {
    setForgeInventory(prefix, getInventoryData(card));
}

function commitForgeInventoryIfEditing(prefix) {
    if (prefix !== "edit-card") { return; }
    const card = getEditFormCard();
    if (card === null) { return; }
    const inventory = getForgeInventoryDraft(prefix);
    card.currency = inventory.currency;
    card.inventoryCards = inventory.cards;
    card.inventoryList = inventory.list;
    saveAndBroadcastAppState();
    renderCardDetailPanel(getFocusedCard(getHandCards(), getActiveCard(getHandCards())));
}

function hasOpenForgeInventoryEditor() {
    return activeForgeInventoryEditor !== null;
}

function openForgeInventoryEditor(prefix, itemId, itemType = "card") {
    keepCardForgeOpenForInternalAction();
    activeForgeInventoryEditor = { prefix: prefix, itemId: itemId || "", itemType: itemType, isNewDraft: false };
    renderForgeInventoryManager(prefix);
}

function addForgeInventoryTemplate(prefix, templateName) {
    keepCardForgeOpenForInternalAction();
    const inventory = getForgeInventoryDraft(prefix);
    const item = createInventoryCardFromTemplate(templateName);
    inventory.cards.unshift(item);
    setForgeInventory(prefix, inventory);
    activeForgeInventoryEditor = { prefix: prefix, itemId: item.id, itemType: "card", isNewDraft: false };
    renderForgeInventoryManager(prefix);
    commitForgeInventoryIfEditing(prefix);
}

function addForgeInventoryListItem(prefix) {
    keepCardForgeOpenForInternalAction();
    const inventory = getForgeInventoryDraft(prefix);
    const item = createInventoryListItem({ name: "Neuer Gegenstand", category: "equipment", quantity: 1, description: "" }, inventory.list.length);
    inventory.list.unshift(item);
    setForgeInventory(prefix, inventory);
    activeForgeInventoryEditor = { prefix: prefix, itemId: item.id, itemType: "list", isNewDraft: false };
    renderForgeInventoryManager(prefix);
    commitForgeInventoryIfEditing(prefix);
}

function deleteForgeInventoryCard(prefix, itemId) {
    keepCardForgeOpenForInternalAction();
    const inventory = getForgeInventoryDraft(prefix);
    inventory.cards = inventory.cards.filter(function(item) { return item.id !== itemId; });
    setForgeInventory(prefix, inventory);
    activeForgeInventoryEditor = null;
    renderForgeInventoryManager(prefix);
    commitForgeInventoryIfEditing(prefix);
}

function deleteForgeInventoryListItem(prefix, itemId) {
    keepCardForgeOpenForInternalAction();
    const inventory = getForgeInventoryDraft(prefix);
    inventory.list = inventory.list.filter(function(item) { return item.id !== itemId; });
    setForgeInventory(prefix, inventory);
    activeForgeInventoryEditor = null;
    renderForgeInventoryManager(prefix);
    commitForgeInventoryIfEditing(prefix);
}

function cancelForgeInventoryEditor(prefix, options = {}) {
    if (options.skipClickAwayGuard !== true) { keepCardForgeOpenForInternalAction(); }
    activeForgeInventoryEditor = null;
    renderForgeInventoryManager(prefix);
}

function saveForgeInventoryCard(prefix, itemId) {
    keepCardForgeOpenForInternalAction();
    const inventory = getForgeInventoryDraft(prefix);
    const existingIndex = inventory.cards.findIndex(function(item) { return item.id === itemId; });
    if (existingIndex < 0) { return; }

    const nameElement = document.querySelector(`#${prefix}-forge-item-name`);
    if (nameElement === null || nameElement.value.trim() === "") { return; }

    inventory.cards[existingIndex] = createInventoryCard({
        id: itemId,
        name: nameElement.value.trim(),
        category: document.querySelector(`#${prefix}-forge-item-category`)?.value || "misc",
        effect: document.querySelector(`#${prefix}-forge-item-effect`)?.value.trim() || "",
        healingFormula: document.querySelector(`#${prefix}-forge-item-healing`)?.value.trim() || "",
        description: document.querySelector(`#${prefix}-forge-item-description`)?.value.trim() || "",
        image: document.querySelector(`#${prefix}-forge-item-image`)?.value.trim() || "assets/items/potion_custom.jpg",
        showAsAction: document.querySelector(`#${prefix}-forge-item-show-action`)?.checked === true,
        actionType: document.querySelector(`#${prefix}-forge-item-action-type`)?.value || "action"
    }, existingIndex);

    setForgeInventory(prefix, inventory);
    activeForgeInventoryEditor = null;
    renderForgeInventoryManager(prefix);
    commitForgeInventoryIfEditing(prefix);
}

function saveForgeInventoryListItem(prefix, itemId) {
    keepCardForgeOpenForInternalAction();
    const inventory = getForgeInventoryDraft(prefix);
    const existingIndex = inventory.list.findIndex(function(item) { return item.id === itemId; });
    if (existingIndex < 0) { return; }

    const nameElement = document.querySelector(`#${prefix}-forge-list-name`);
    if (nameElement === null || nameElement.value.trim() === "") { return; }

    inventory.list[existingIndex] = createInventoryListItem({
        id: itemId,
        name: nameElement.value.trim(),
        category: document.querySelector(`#${prefix}-forge-list-category`)?.value || "equipment",
        quantity: document.querySelector(`#${prefix}-forge-list-quantity`)?.value || 1,
        description: document.querySelector(`#${prefix}-forge-list-description`)?.value.trim() || ""
    }, existingIndex);

    setForgeInventory(prefix, inventory);
    activeForgeInventoryEditor = null;
    renderForgeInventoryManager(prefix);
    commitForgeInventoryIfEditing(prefix);
}

function createForgeInventoryCardRowHtml(prefix, item) {
    const isEditing = activeForgeInventoryEditor !== null && activeForgeInventoryEditor.prefix === prefix && activeForgeInventoryEditor.itemId === item.id && (activeForgeInventoryEditor.itemType || "card") === "card";
    if (isEditing === true) {
        const categoryOptions = Object.keys(inventoryCategoryLabels).map(function(key) {
            return `<option value="${key}" ${item.category === key ? "selected" : ""}>${inventoryCategoryLabels[key]}</option>`;
        }).join("");
        const typeOptions = Object.keys(cardActionTypeSingularLabels).map(function(key) {
            return `<option value="${key}" ${item.actionType === key ? "selected" : ""}>${cardActionTypeSingularLabels[key]}</option>`;
        }).join("");
        return `
            <section class="forge-inventory-editor" aria-label="Itemkarte bearbeiten">
                <div class="forge-spell-editor-header"><h5>Itemkarte bearbeiten</h5><span>${escapeHtml(item.name)}</span></div>
                <div class="forge-spell-editor-grid">
                    <label class="form-field forge-spell-editor-wide"><span>Name</span><input id="${prefix}-forge-item-name" type="text" value="${escapeHtml(item.name)}"></label>
                    <label class="form-field"><span>Kategorie</span><select id="${prefix}-forge-item-category">${categoryOptions}</select></label>
                    <label class="form-field"><span>Aktionstyp</span><select id="${prefix}-forge-item-action-type">${typeOptions}</select></label>
                    <label class="form-field"><span>Effekt/Kurztext</span><input id="${prefix}-forge-item-effect" type="text" placeholder="Kurzer Effekt oder Nutzen" value="${escapeHtml(item.effect)}"></label>
                    <label class="form-field"><span>Heilformel</span><input id="${prefix}-forge-item-healing" type="text" placeholder="2d4+2" value="${escapeHtml(item.healingFormula)}"></label>
                    <label class="form-field forge-spell-editor-wide"><span>Bildpfad</span><input id="${prefix}-forge-item-image" type="text" value="${escapeHtml(item.image)}"></label>
                    <label class="checkbox-field forge-checkbox-card forge-spell-editor-wide"><input id="${prefix}-forge-item-show-action" type="checkbox" ${item.showAsAction === true ? "checked" : ""}><span>Im Aktionen-Tab anzeigen</span></label>
                    <label class="form-field forge-spell-editor-wide"><span>Beschreibung</span><textarea id="${prefix}-forge-item-description" rows="4" placeholder="Kurze Beschreibung nach Bedarf ergänzen">${escapeHtml(item.description)}</textarea></label>
                </div>
                <div class="forge-spell-editor-actions forge-inventory-editor-actions">
                    <button type="button" onclick="saveForgeInventoryCard('${prefix}', '${item.id}')">Speichern</button>
                    <button class="card-menu-danger" type="button" onclick="deleteForgeInventoryCard('${prefix}', '${item.id}')">Löschen</button>
                    <button type="button" onclick="cancelForgeInventoryEditor('${prefix}')">Abbrechen</button>
                </div>
            </section>
        `;
    }

    return `
        <div class="forge-spell-row forge-inventory-row">
            <span class="forge-spell-name">${escapeHtml(item.name)}</span>
            <span class="forge-item-meta">${escapeHtml(inventoryCategoryLabels[item.category] || "Item")}</span>
            <div class="forge-spell-row-actions">
                <button class="forge-inventory-edit-button" type="button" onclick="openForgeInventoryEditor('${prefix}', '${item.id}', 'card')">Edit</button>
                <button class="forge-inventory-delete-button" type="button" onclick="deleteForgeInventoryCard('${prefix}', '${item.id}')" title="Item löschen">×</button>
            </div>
        </div>
    `;
}

function createForgeInventoryListRowHtml(prefix, item) {
    const isEditing = activeForgeInventoryEditor !== null && activeForgeInventoryEditor.prefix === prefix && activeForgeInventoryEditor.itemId === item.id && activeForgeInventoryEditor.itemType === "list";
    if (isEditing === true) {
        const categoryOptions = Object.keys(inventoryCategoryLabels).map(function(key) {
            return `<option value="${key}" ${item.category === key ? "selected" : ""}>${inventoryCategoryLabels[key]}</option>`;
        }).join("");
        return `
            <section class="forge-inventory-editor" aria-label="Gegenstand bearbeiten">
                <div class="forge-spell-editor-header"><h5>Gegenstand bearbeiten</h5><span>${escapeHtml(item.name)}</span></div>
                <div class="forge-spell-editor-grid">
                    <label class="form-field forge-spell-editor-wide"><span>Name</span><input id="${prefix}-forge-list-name" type="text" value="${escapeHtml(item.name)}"></label>
                    <label class="form-field"><span>Kategorie</span><select id="${prefix}-forge-list-category">${categoryOptions}</select></label>
                    <label class="form-field"><span>Menge</span><input id="${prefix}-forge-list-quantity" type="number" min="1" value="${item.quantity}"></label>
                    <label class="form-field forge-spell-editor-wide"><span>Beschreibung</span><textarea id="${prefix}-forge-list-description" rows="4">${escapeHtml(item.description)}</textarea></label>
                </div>
                <div class="forge-spell-editor-actions forge-inventory-editor-actions">
                    <button type="button" onclick="saveForgeInventoryListItem('${prefix}', '${item.id}')">Speichern</button>
                    <button class="card-menu-danger" type="button" onclick="deleteForgeInventoryListItem('${prefix}', '${item.id}')">Löschen</button>
                    <button type="button" onclick="cancelForgeInventoryEditor('${prefix}')">Abbrechen</button>
                </div>
            </section>
        `;
    }

    return `
        <div class="forge-spell-row forge-inventory-row">
            <span class="forge-spell-name">${escapeHtml(item.name)}${item.quantity > 1 ? ` x${item.quantity}` : ""}</span>
            <span class="forge-item-meta">${escapeHtml(inventoryCategoryLabels[item.category] || "Sonstiges")}</span>
            <div class="forge-spell-row-actions">
                <button class="forge-inventory-edit-button" type="button" onclick="openForgeInventoryEditor('${prefix}', '${item.id}', 'list')">Edit</button>
                <button class="forge-inventory-delete-button" type="button" onclick="deleteForgeInventoryListItem('${prefix}', '${item.id}')">×</button>
            </div>
        </div>
    `;
}

function renderForgeInventoryManager(prefix) {
    const managerElement = document.querySelector(`#${prefix}-inventory-manager`);
    if (managerElement === null) { return; }

    const inventory = getForgeInventoryDraft(prefix);
    const sortedCards = sortInventoryCardsForDisplay(inventory.cards);
    const sortedList = sortInventoryListByName(inventory.list);

    const activeCard = activeForgeInventoryEditor !== null
        && activeForgeInventoryEditor.prefix === prefix
        && activeForgeInventoryEditor.itemType === "card"
        ? sortedCards.find(function(item) { return item.id === activeForgeInventoryEditor.itemId; })
        : null;

    const activeListItem = activeForgeInventoryEditor !== null
        && activeForgeInventoryEditor.prefix === prefix
        && activeForgeInventoryEditor.itemType === "list"
        ? sortedList.find(function(item) { return item.id === activeForgeInventoryEditor.itemId; })
        : null;

    const editorHtml = activeCard !== null
        ? createForgeInventoryCardRowHtml(prefix, activeCard)
        : activeListItem !== null
            ? createForgeInventoryListRowHtml(prefix, activeListItem)
            : "";

    const cardRows = sortedCards.length > 0
        ? sortedCards.map(function(item) {
            const wasEditorOpen = activeForgeInventoryEditor;
            if (activeCard !== null && item.id === activeCard.id) {
                activeForgeInventoryEditor = null;
                const rowHtml = createForgeInventoryCardRowHtml(prefix, item);
                activeForgeInventoryEditor = wasEditorOpen;
                return rowHtml;
            }
            return createForgeInventoryCardRowHtml(prefix, item);
        }).join("")
        : `<p class="empty-list-message">Keine Itemkarten angelegt.</p>`;

    const listRows = sortedList.length > 0
        ? sortedList.map(function(item) {
            const wasEditorOpen = activeForgeInventoryEditor;
            if (activeListItem !== null && item.id === activeListItem.id) {
                activeForgeInventoryEditor = null;
                const rowHtml = createForgeInventoryListRowHtml(prefix, item);
                activeForgeInventoryEditor = wasEditorOpen;
                return rowHtml;
            }
            return createForgeInventoryListRowHtml(prefix, item);
        }).join("")
        : `<p class="empty-list-message">Keine Inventargegenstände angelegt.</p>`;

    managerElement.innerHTML = `
        ${editorHtml !== "" ? `<div class="forge-inventory-editor-host">${editorHtml}</div>` : ""}
        <div class="forge-input-section inventory-forge-library-section">
            <div class="forge-spell-draft-header"><div><h4>Itemkarten</h4></div>${createInventoryAddMenuHtml(0, "forge", prefix)}</div>
            <div class="forge-spell-row-list forge-inventory-card-list">${cardRows}</div>
        </div>
        <div class="forge-input-section inventory-forge-list-section">
            <div class="forge-spell-draft-header"><div><h4>Inventarliste</h4></div><button class="forge-inventory-add-button forge-add-button" type="button" onclick="addForgeInventoryListItem('${prefix}')">Gegenstand hinzufügen</button></div>
            <div class="forge-spell-row-list forge-inventory-list">${listRows}</div>
        </div>
    `;

    const editorHost = managerElement.querySelector(".forge-inventory-editor-host");
    if (editorHost instanceof HTMLElement) {
        requestAnimationFrame(function() {
            editorHost.scrollIntoView({ block: "nearest", behavior: "smooth" });
        });
    }
}

function createDetailTabContentHtml(card) {
    if (card === null) {
        return `
            <div class="active-hand-detail-content active-hand-detail-empty">
                <p>Keine Karte ausgewählt.</p>
            </div>
        `;
    }

    if (uiState.activeDetailTab === "actions") {
        return createActionDetailTabHtml(card);
    }

    if (uiState.activeDetailTab === "traits") {
        return createTraitDetailTabHtml(card);
    }

    if (uiState.activeDetailTab === "notes") {
        return `
            <div class="active-hand-detail-content active-hand-detail-scroll detail-tab-surface">
                ${createDetailTextPanelHtml("Notizen", card.notes, "Noch keine DM-Notizen eingetragen.")}
            </div>
        `;
    }

    if (uiState.activeDetailTab === "spells") {
        return `
            <div class="active-hand-detail-content active-hand-detail-scroll active-hand-spell-reference detail-tab-surface">
                ${createSpellTrackerHtml(card)}
            </div>
        `;
    }

    if (uiState.activeDetailTab === "inventory") {
        return createInventoryTabHtml(card);
    }

    return `
        <div class="active-hand-detail-content active-hand-detail-scroll active-hand-profile-panel detail-tab-surface">
            <div class="card-profile-content">
                <section class="active-hand-detail-section card-profile-section card-profile-hero-section">
                    <div class="card-profile-heading-row">
                        <div>
                            <p class="section-eyebrow">Kartenprofil</p>
                            <p class="card-profile-subline">Attribute, Bewegung, Sinne und defensive Besonderheiten.</p>
                        </div>
                    </div>
                    <div class="active-hand-ability-grid card-profile-ability-grid card-profile-ability-row">
                        ${createAbilityScoreHtml(card, "STR", "strengthScore", "strengthModifier")}
                        ${createAbilityScoreHtml(card, "DEX", "dexterityScore", "dexterityModifier")}
                        ${createAbilityScoreHtml(card, "CON", "constitutionScore", "constitutionModifier")}
                        ${createAbilityScoreHtml(card, "INT", "intelligenceScore", "intelligenceModifier")}
                        ${createAbilityScoreHtml(card, "WIS", "wisdomScore", "wisdomModifier")}
                        ${createAbilityScoreHtml(card, "CHA", "charismaScore", "charismaModifier")}
                    </div>
                </section>

                <section class="active-hand-detail-section card-profile-section card-profile-reference-section">
                    <p class="section-eyebrow">Bewegung & Wahrnehmung</p>
                    <div class="active-hand-stat-grid card-profile-stat-grid card-profile-stat-grid-two">
                        ${createDetailStatCardHtml("Bewegung", card.speed, "active-hand-stat-card card-profile-stat-card")}
                        ${createDetailStatCardHtml("Sinne", card.senses, "active-hand-stat-card card-profile-stat-card")}
                        ${createDetailStatCardHtml("Passive Perception", card.passivePerception, "active-hand-stat-card card-profile-stat-card tablet-profile-passive-stat")}
                        ${createDetailStatCardHtml("Passive Insight", card.passiveInsight, "active-hand-stat-card card-profile-stat-card tablet-profile-passive-stat")}
                        ${createDetailStatCardHtml("Passive Investigation", card.passiveInvestigation, "active-hand-stat-card card-profile-stat-card tablet-profile-passive-stat")}
                    </div>
                </section>

                <section class="active-hand-detail-section card-profile-section card-profile-defense-section">
                    <p class="section-eyebrow">Verteidigung</p>
                    <div class="active-hand-stat-grid card-profile-stat-grid card-profile-stat-grid-defense">
                        ${createDetailStatCardHtml("Rettungswürfe", card.savingThrows, "active-hand-stat-card card-profile-stat-card card-profile-stat-card-wide")}
                        ${createDetailStatCardHtml("Resistenzen", card.resistances, "active-hand-stat-card card-profile-stat-card")}
                        ${createDetailStatCardHtml("Immunitäten", card.immunities, "active-hand-stat-card card-profile-stat-card")}
                        ${createDetailStatCardHtml("Verwundbarkeiten", card.vulnerabilities, "active-hand-stat-card card-profile-stat-card")}
                    </div>
                </section>
            </div>
        </div>
    `;
}
function renderCardDetailPanel(focusedCard) {
    const detailPanelElement = document.querySelector("#card-detail-panel");

    if (detailPanelElement === null) {
        return;
    }

    const safeActiveDetailTab = getSafeDetailTab(uiState.activeDetailTab);

    detailPanelElement.innerHTML = `
        <article class="active-hand-details-card active-hand-details-card--${safeActiveDetailTab} detail-panel-surface">
            ${createDetailPanelHeaderHtml(focusedCard)}

            <nav class="active-hand-detail-tabs" aria-label="Kartendetails-Navigation">
                ${getDetailTabButtonHtml("values", "Profil")}
                ${getDetailTabButtonHtml("actions", "Aktionen")}
                ${getDetailTabButtonHtml("traits", "Traits")}
                ${getDetailTabButtonHtml("spells", "Spells")}
                ${getDetailTabButtonHtml("notes", "Notizen")}
                ${getDetailTabButtonHtml("inventory", "Inventar")}
            </nav>

            <div class="active-hand-detail-body">
                <div class="detail-panel-content-layer">
                    ${createDetailTabContentHtml(focusedCard)}
                </div>
            </div>
        </article>
    `;
}

function createHandRibbonCardHtml(card, activeCard, focusedCard) {
    const isActive = activeCard !== null && card.id === activeCard.id;
    const isFocused = focusedCard !== null && card.id === focusedCard.id;
    const isSelected = card.isSelected === true;

    const tempHpText = `+${card.tempHp}`;
    const targetButtonText = isSelected ? "Ziel ✓" : "Ziel";

    return `
        <article
            class="active-hand-mini-card ${isActive ? "active-turn-card" : ""} ${isFocused ? "focused-hand-card" : ""} ${isSelected ? "selected-target-card" : ""} ${isCardOutOfAction(card) ? "is-out-of-action" : ""}"
            title="Handkarte"
        >
            ${createOutOfActionStampHtml(card)}
            <button
                class="active-hand-mini-main"
                onclick="setFocusedCard(${card.id})"
                title="Diese Karte groß anzeigen"
            >
                <span class="active-hand-mini-image">
                    ${createCardImageHtml(card)}
                </span>

                <span class="active-hand-mini-copy">
                    <strong class="active-hand-mini-name">${createLoopingNameHtml(card.publicName || card.name, "active-hand-mini-name-text")}</strong>
                    <span class="active-hand-mini-meta"><b>Ini</b> ${card.initiative}</span>
                    <span class="active-hand-mini-meta"><b>HP</b> ${card.hp}/${card.maxHp} · ${tempHpText}</span>
                </span>
            </button>

            <button
                class="active-hand-mini-target"
                onclick="event.stopPropagation(); toggleCardSelection(${card.id});"
                title="Als Ziel markieren oder abwählen"
            >
                ${targetButtonText}
            </button>
        </article>
    `;
}

function renderHandRibbon(handCards, activeCard, focusedCard) {
    const ribbonElement = document.querySelector("#hand-ribbon-list");

    if (ribbonElement === null) {
        return;
    }

    if (handCards.length === 0) {
        ribbonElement.innerHTML = `
            <p class="empty-list-message">
                Keine Karten auf der Hand.
            </p>
        `;
        return;
    }

    let html = "";

    for (const card of handCards) {
        html += createHandRibbonCardHtml(card, activeCard, focusedCard);
    }

    ribbonElement.innerHTML = html;
}

function getDeckTypeLabel(type) {
    if (type === "player") {
        return "Player";
    }

    if (type === "npc") {
        return "NPC";
    }

    if (type === "monster") {
        return "Monster";
    }

    return "Karte";
}

function createDeckConditionSummaryHtml(card) {
    const conditionCount = Array.isArray(card.conditions) ? card.conditions.length : 0;

    if (conditionCount === 0) {
        return `<span class="condition-empty deck-condition-empty">Keine Conditions.</span>`;
    }

    const conditionChipsHtml = createConditionChipsHtml(card);
    const conditionMarqueeClass = conditionCount > 3 ? "deck-condition-marquee is-scrolling" : "deck-condition-marquee";
    const repeatedConditionChipsHtml = conditionCount > 3
        ? `<span class="focus-condition-track-copy deck-condition-track-copy" aria-hidden="true">${conditionChipsHtml}</span>`
        : "";

    return `
        <div class="${conditionMarqueeClass}" aria-label="Deckkarten-Conditions">
            <div class="condition-chip-list focus-condition-track deck-condition-track">
                ${conditionChipsHtml}
                ${repeatedConditionChipsHtml}
            </div>
        </div>
    `;
}

function createPreparationDeckCardHtml(card) {
    const isInTrash = getCardLocation(card) === cardLocations.trash;
    const isSelected = isInTrash !== true && card.isSelected === true;
    const initiativeModifierText = formatSignedModifier(getCardInitiativeModifier(card));
    const publicNameText = getSafeOptionalString(card.publicName) !== "" ? card.publicName : "Öffentlicher Name offen";
    const deckStateLabel = isInTrash ? "Im Papierkorb" : isSelected ? "Gewählt" : "Im Deck";
    const deckStateClass = isInTrash ? "deck-status-trash" : isSelected ? "deck-status-selected" : "deck-status-position";
    const cardClickAttribute = isInTrash ? "" : `onclick="toggleCardSelection(${card.id})"`;
    const cardTitle = isInTrash ? "Gelöschte Karte" : "Deckkarte auswählen";
    const focusButtonHtml = isInTrash
        ? ""
        : `<button class="deck-focus-button" onclick="event.stopPropagation(); setFocusedDeckCard(${card.id});" type="button">Fokus</button>`;
    const deletedAtText = isInTrash && getSafeOptionalString(card.deletedAt) !== ""
        ? `<p class="deck-trash-date">Gelöscht: ${escapeHtml(new Date(card.deletedAt).toLocaleString("de-DE"))}</p>`
        : "";

    return `
        <article class="preparation-deck-card ${isSelected ? "selected-deck-card" : ""} ${isInTrash ? "trash-deck-card" : ""}" data-deck-card-id="${card.id}" ${cardClickAttribute} title="${cardTitle}">
            <div class="preparation-deck-card-inner">
                <div class="deck-card-topline">
                    <div class="deck-card-title-block">
                        <h3>${escapeHtml(card.name)}</h3>
                        <span class="card-public-alias">${escapeHtml(publicNameText)}</span>
                        ${deletedAtText}
                    </div>
                    ${createCardMenuHtml(card)}
                </div>

                <div class="deck-card-image-frame">
                    ${createCardImageHtml(card)}
                </div>

                <div class="deck-card-state-action-row" aria-label="Kartentyp, Kartenort und Fokus">
                    <div class="deck-card-state-list">
                        <span class="deck-status-label deck-status-type deck-status-type-${escapeAttribute(getCharacterRole(card))}">${escapeHtml(getDeckTypeLabel(getCharacterRole(card)))}</span>
                        <span class="deck-status-separator" aria-hidden="true">·</span>
                        <span class="deck-status-label ${deckStateClass}">${deckStateLabel}</span>
                    </div>
                    ${focusButtonHtml}
                </div>

                <div class="deck-card-section deck-card-resource-section" aria-label="HP und temporäre HP">
                    <h4 class="deck-card-section-title">HP</h4>
                    <div class="deck-card-resource-stack">
                        ${createDmHpBarHtml(card)}
                        ${createDmTempHpBarHtml(card)}
                    </div>
                </div>

                <div class="deck-card-section deck-card-combat-section" aria-label="Kampfwerte">
                    <h4 class="deck-card-section-title">Kampfwerte</h4>
                    <div class="deck-card-stat-grid">
                        <p><span>INI-MOD</span><strong>${initiativeModifierText}</strong></p>
                        <p><span>AC</span><strong>${card.armorClass}</strong></p>
                    </div>
                </div>

                <div class="deck-card-section deck-card-conditions-section" aria-label="Conditions">
                    <h4 class="deck-card-section-title">Conditions</h4>
                    <div class="deck-card-condition-row">
                        ${createDeckConditionSummaryHtml(card)}
                    </div>
                </div>
            </div>
        </article>
    `;
}

function renderDeckControlsState() {
    const searchElement = document.querySelector("#deck-search-input");
    const locationViewElement = document.querySelector("#deck-location-view");
    const typeFilterElement = document.querySelector("#deck-type-filter");
    const sortElement = document.querySelector("#deck-sort-mode");

    if (locationViewElement instanceof HTMLSelectElement && locationViewElement.value !== uiState.deck.locationView) {
        locationViewElement.value = uiState.deck.locationView;
        updateArcaneSelectForElement(locationViewElement);
    }

    if (searchElement instanceof HTMLInputElement && searchElement.value !== uiState.deck.searchQuery) {
        searchElement.value = uiState.deck.searchQuery;
    }

    if (typeFilterElement instanceof HTMLSelectElement && typeFilterElement.value !== uiState.deck.typeFilter) {
        typeFilterElement.value = uiState.deck.typeFilter;
        updateArcaneSelectForElement(typeFilterElement);
    }

    if (sortElement instanceof HTMLSelectElement && sortElement.value !== uiState.deck.sortMode) {
        sortElement.value = uiState.deck.sortMode;
        updateArcaneSelectForElement(sortElement);
    }
}

function renderPreparationDeckRibbon(listCards) {
    const listElement = document.querySelector("#deck-card-list");

    if (listElement === null) {
        return;
    }

    renderDeckControlsState();

    if (listCards.length === 0) {
        listElement.innerHTML = `
            <div class="deck-empty-state">
                <p class="empty-list-message">
                    ${uiState.deck.locationView === cardLocations.trash ? "Der Papierkorb ist leer." : "Keine passenden Karten im Deck."}
                </p>
            </div>
        `;
        return;
    }

    let html = "";

    for (const card of listCards) {
        html += createPreparationDeckCardHtml(card);
    }

    listElement.innerHTML = html;
}

function getPreparationLocationCards() {
    return uiState.deck.locationView === cardLocations.trash ? getTrashCards() : getDeckCards();
}

function renderDeckWorkbenchOnly() {
    const deckCards = getPreparationLocationCards();
    const visibleDeckCards = getVisibleDeckCards(deckCards);

    renderPreparationDeckRibbon(visibleDeckCards);
    updateDeckSelectionStatus();
    enhanceArcaneSelects();
}

function setDeckLocationView(value) {
    uiState.deck.locationView = value === cardLocations.trash ? cardLocations.trash : cardLocations.deck;
    clearDeckSelection();
    preserveViewportWhileRendering(function() {
        renderDeckWorkbenchOnly();
    });
}

function setDeckSearchQuery(value) {
    uiState.deck.searchQuery = getSafeOptionalString(value);
    preserveViewportWhileRendering(function() {
        renderDeckWorkbenchOnly();
    });
}

function setDeckTypeFilter(value) {
    uiState.deck.typeFilter = ["all", "player", "npc", "monster"].includes(value) ? value : "all";
    preserveViewportWhileRendering(function() {
        renderDeckWorkbenchOnly();
    });
}

function setDeckSortMode(value) {
    uiState.deck.sortMode = ["name", "type", "initiativeModifier", "hp"].includes(value) ? value : "name";
    preserveViewportWhileRendering(function() {
        renderDeckWorkbenchOnly();
    });
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

        html += createCardHtml(card, isActive);
    }

    listElement.innerHTML = html;
}

function renderCards() {
    if (shouldAutoloadDemoCards() === true && gameState.cards.length === 0) {
        gameState.cards = createDemoCards().map(normalizeCardModel);
        gameState.name = demoEncounterName;
        uiState.focusedCardId = null;
        resetEncounterStartGateState({ clearLog: true });
        gameState.presentation.mirielBoard.autoTurnEnabled = false;
    }

    ensureEncounterStartGateConsistency();

    const handCards = getHandCards();
    const deckCards = getDeckCards();
    const visibleDeckCards = getVisibleDeckCards(deckCards);

    ensureCurrentTurnIndexIsValid(handCards);

    const activeCard = getActiveCard(handCards);
    const publicCards = createPublicEncounterState(handCards, activeCard);

    renderTurnInfo(handCards);

    if (appView === "playerSide") {
        renderPlayerSide(publicCards, handCards);
    }

    if (appView === "dm") {
        const focusedCard = getFocusedCard(handCards, activeCard);

        renderFocusedCard(focusedCard, activeCard);
        renderCardDetailPanel(focusedCard);
        runPendingDmFocusTransition();
        renderHandRibbon(handCards, activeCard, focusedCard);
        renderPreparationDeckRibbon(visibleDeckCards);
        updateSelectionStatus();
        updateDeckSelectionStatus();
        updateInitiativeToolStatus();
        renderCombatLog();
        updateMirielBoardControls();
    }

    renderEncounterNameDisplay();
    enhanceArcaneSelects();

    if (appView === "dm" && isApplyingExternalState !== true) {
        saveAndBroadcastAppState();
    }
}

function longRest() {

    const shouldLongRest = confirm(

        "Lange Rast durchführen?\n\nAlle Player-Karten werden vollständig geheilt, Temp HP und Conditions werden entfernt."

    );

    if (!shouldLongRest) {

        return;

    }

    for (const card of gameState.cards) {

        if (card.type === "player") {

            card.hp = card.maxHp;

            card.tempHp = 0;

            card.conditions = [];

            resetSpellSlotsForCard(card);

            resetUsageCountersForCard(card, ["shortRest", "longRest", "encounter", "turn", "round"]);

            card.isSelected = false;

        }

    }

    resetCombatTurnCounter();

    clearCardSelection();

    addCombatLogMessage("Lange Rast: Alle Player-Karten wurden vollständig wiederhergestellt.");

    renderCards();

}


// ============================================================
// 16b. Arkane Auswahlmenüs
// ============================================================

let activeArcaneSelectId = "";
let arcaneSelectObserver = null;
let arcaneSelectTouchStartY = null;

function getArcaneSelectId(selectElement) {
    if (selectElement.id !== undefined && selectElement.id !== "") {
        return selectElement.id;
    }

    if (selectElement.dataset.arcaneSelectId === undefined || selectElement.dataset.arcaneSelectId === "") {
        selectElement.dataset.arcaneSelectId = `arcane-select-${Math.random().toString(36).slice(2)}`;
    }

    return selectElement.dataset.arcaneSelectId;
}

function getArcaneSelectLabel(selectElement) {
    const selectedOption = selectElement.options[selectElement.selectedIndex];

    if (selectedOption === undefined) {
        return "Auswählen";
    }

    return selectedOption.textContent.trim();
}

function updateArcaneSelectOpenAncestors(wrapperElement, isOpen) {
    if (!(wrapperElement instanceof HTMLElement)) {
        return;
    }

    const ancestorSelectors = [
        ".form-field",
        ".form-group",
        ".forge-note-row",
        ".forge-note-title-field",
        ".forge-note-title-controls",
        ".forge-tab-grid",
        ".spellcasting-summary-card",
        ".toolkit-section",
        ".toolkit-full-field",
        ".deck-control-panel",
        ".deck-filter-field",
        ".deck-search-field",
        ".inventory-editor-field",
        ".spell-editor-field"
    ];

    for (const selector of ancestorSelectors) {
        const ancestorElement = wrapperElement.closest(selector);
        if (ancestorElement instanceof HTMLElement) {
            ancestorElement.classList.toggle("arcane-select-parent-open", isOpen);
        }
    }
}

function closeArcaneSelects(exceptWrapper = null) {
    const wrapperElements = document.querySelectorAll(".arcane-select-wrapper.arcane-select-open");

    for (const wrapperElement of wrapperElements) {
        if (exceptWrapper !== null && wrapperElement === exceptWrapper) {
            continue;
        }

        wrapperElement.classList.remove("arcane-select-open");
        updateArcaneSelectOpenAncestors(wrapperElement, false);

        const buttonElement = wrapperElement.querySelector(".arcane-select-button");
        if (buttonElement !== null) {
            buttonElement.setAttribute("aria-expanded", "false");
        }
    }

    if (exceptWrapper === null) {
        activeArcaneSelectId = "";
    }
}

function updateArcaneSelectForElement(selectElement) {
    if (!(selectElement instanceof HTMLSelectElement)) {
        return;
    }

    const wrapperElement = selectElement.nextElementSibling;

    if (wrapperElement === null || wrapperElement.classList.contains("arcane-select-wrapper") === false) {
        return;
    }

    const labelElement = wrapperElement.querySelector(".arcane-select-current");
    const optionButtons = wrapperElement.querySelectorAll(".arcane-select-option");

    if (labelElement !== null) {
        labelElement.textContent = getArcaneSelectLabel(selectElement);
    }

    for (const optionButton of optionButtons) {
        const isSelected = optionButton.dataset.value === selectElement.value;
        optionButton.classList.toggle("arcane-select-option-selected", isSelected);
        optionButton.setAttribute("aria-selected", isSelected ? "true" : "false");
    }
}

function selectArcaneOption(selectId, value, event) {
    if (event !== undefined && event !== null) {
        event.preventDefault();
        event.stopPropagation();
    }

    const selectElement = document.getElementById(selectId);

    if (!(selectElement instanceof HTMLSelectElement)) {
        return;
    }

    selectElement.value = value;
    updateArcaneSelectForElement(selectElement);
    selectElement.dispatchEvent(new Event("change", { bubbles: true }));
    closeArcaneSelects();
}

function toggleArcaneSelect(selectId, event) {
    if (event !== undefined && event !== null) {
        event.preventDefault();
        event.stopPropagation();
    }

    const selectElement = document.getElementById(selectId);

    if (!(selectElement instanceof HTMLSelectElement)) {
        return;
    }

    const wrapperElement = selectElement.nextElementSibling;

    if (wrapperElement === null || wrapperElement.classList.contains("arcane-select-wrapper") === false) {
        return;
    }

    const willOpen = wrapperElement.classList.contains("arcane-select-open") === false;

    closeArcaneSelects(wrapperElement);
    wrapperElement.classList.toggle("arcane-select-open", willOpen);
    updateArcaneSelectOpenAncestors(wrapperElement, willOpen);
    activeArcaneSelectId = willOpen ? selectId : "";

    const buttonElement = wrapperElement.querySelector(".arcane-select-button");
    if (buttonElement !== null) {
        buttonElement.setAttribute("aria-expanded", willOpen ? "true" : "false");
    }
}

function createArcaneSelectOptionHtml(selectId, optionElement, selectElement) {
    const value = optionElement.value;
    const label = optionElement.textContent.trim();
    const isSelected = value === selectElement.value;

    return `
        <button
            class="arcane-select-option ${isSelected ? "arcane-select-option-selected" : ""}"
            type="button"
            role="option"
            aria-selected="${isSelected ? "true" : "false"}"
            data-value="${escapeHtml(value)}"
            onclick="selectArcaneOption('${escapeAttribute(selectId)}', '${escapeAttribute(value)}', event)"
        >
            <span class="arcane-select-option-label">${escapeHtml(label)}</span>
        </button>
    `;
}

function enhanceArcaneSelect(selectElement) {
    if (!(selectElement instanceof HTMLSelectElement)) {
        return;
    }

    if (selectElement.dataset.nativeSelect === "true" || selectElement.dataset.arcaneEnhanced === "true") {
        updateArcaneSelectForElement(selectElement);
        return;
    }

    const selectId = getArcaneSelectId(selectElement);

    if (selectElement.id === "") {
        selectElement.id = selectId;
    }

    let optionsHtml = "";

    for (const optionElement of selectElement.options) {
        optionsHtml += createArcaneSelectOptionHtml(selectId, optionElement, selectElement);
    }

    const wrapperElement = document.createElement("div");
    wrapperElement.className = "arcane-select-wrapper";

    if (selectElement.closest(".forge-note-title-field") !== null) {
        wrapperElement.classList.add("arcane-select-wrapper-note-title");
    }

    if (selectElement.closest(".form-grid") !== null || selectElement.closest(".form-grid-two") !== null || selectElement.closest(".form-grid-three") !== null || selectElement.closest(".form-grid-four") !== null) {
        wrapperElement.classList.add("arcane-select-wrapper-grid-field");
    }

    wrapperElement.dataset.selectId = selectId;
    wrapperElement.innerHTML = `
        <button class="arcane-select-button" type="button" aria-haspopup="listbox" aria-expanded="false" onclick="toggleArcaneSelect('${escapeAttribute(selectId)}', event)">
            <span class="arcane-select-current">${escapeHtml(getArcaneSelectLabel(selectElement))}</span>
            <span class="arcane-select-chevron" aria-hidden="true">⌄</span>
        </button>
        <div class="arcane-select-menu" role="listbox" aria-label="Auswahl">
            ${optionsHtml}
        </div>
    `;

    selectElement.classList.add("arcane-native-select");
    selectElement.dataset.arcaneEnhanced = "true";
    selectElement.insertAdjacentElement("afterend", wrapperElement);

    const menuElement = wrapperElement.querySelector(".arcane-select-menu");

    if (menuElement !== null) {
        menuElement.addEventListener("wheel", containArcaneSelectMenuWheel, { passive: false });
        menuElement.addEventListener("touchstart", rememberArcaneSelectMenuTouchStart, { passive: true });
        menuElement.addEventListener("touchmove", containArcaneSelectMenuTouchMove, { passive: false });
    }
}

function enhanceArcaneSelects(rootElement = document) {
    const selectElements = rootElement.querySelectorAll("select:not([data-native-select='true'])");

    for (const selectElement of selectElements) {
        enhanceArcaneSelect(selectElement);
    }
}

function containArcaneSelectMenuWheel(event) {
    const menuElement = event.currentTarget;

    if (!(menuElement instanceof HTMLElement)) {
        return;
    }

    event.stopPropagation();

    const maxScrollTop = menuElement.scrollHeight - menuElement.clientHeight;

    if (maxScrollTop <= 0) {
        event.preventDefault();
        return;
    }

    const deltaY = event.deltaY || 0;
    const isAtTop = menuElement.scrollTop <= 0;
    const isAtBottom = menuElement.scrollTop >= maxScrollTop - 1;

    if ((isAtTop === true && deltaY < 0) || (isAtBottom === true && deltaY > 0)) {
        event.preventDefault();
    }
}

function rememberArcaneSelectMenuTouchStart(event) {
    if (event.touches.length > 0) {
        arcaneSelectTouchStartY = event.touches[0].clientY;
    }
}

function containArcaneSelectMenuTouchMove(event) {
    const menuElement = event.currentTarget;

    if (!(menuElement instanceof HTMLElement) || event.touches.length === 0 || arcaneSelectTouchStartY === null) {
        return;
    }

    event.stopPropagation();

    const currentY = event.touches[0].clientY;
    const deltaY = arcaneSelectTouchStartY - currentY;
    const maxScrollTop = menuElement.scrollHeight - menuElement.clientHeight;
    const isAtTop = menuElement.scrollTop <= 0;
    const isAtBottom = menuElement.scrollTop >= maxScrollTop - 1;

    if (maxScrollTop <= 0 || (isAtTop === true && deltaY < 0) || (isAtBottom === true && deltaY > 0)) {
        event.preventDefault();
    }
}

function setupArcaneSelects() {
    enhanceArcaneSelects();

    document.addEventListener("click", function(event) {
        const targetElement = event.target;

        if (targetElement instanceof Element && targetElement.closest(".arcane-select-wrapper") !== null) {
            return;
        }

        closeArcaneSelects();
    });

    document.addEventListener("keydown", function(event) {
        if (event.key === "Escape") {
            closeArcaneSelects();
        }
    });

    if (arcaneSelectObserver === null) {
        arcaneSelectObserver = new MutationObserver(function(mutations) {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node instanceof Element) {
                        enhanceArcaneSelects(node);
                    }
                }
            }
        });

        arcaneSelectObserver.observe(document.body, { childList: true, subtree: true });
    }
}


// ============================================================
// Komfort für leere Texteingaben
// ============================================================

const instructionalTextFieldDefaults = new Map([
    ["Kurze Beschreibung nach Bedarf ergänzen.", "Kurze Beschreibung nach Bedarf ergänzen"],
    ["Kurze Beschreibung nach Bedarf ergänzen", "Kurze Beschreibung nach Bedarf ergänzen"],
    ["Name des Gegenstands", "Name des Gegenstands"],
    ["Neuer Gegenstand", "Name des Gegenstands"],
    ["Neue Itemkarte", "Name der Itemkarte"],
    ["Eigene Itemkarte", "Name der Itemkarte"],
    ["Neuer Spell", "Name des Spells"],
    ["Neue Aktion", "Name der Aktion"],
    ["Neuer Trait", "Name des Traits"],
    ["Eigene Potion", "Name des Tranks"],
    ["Eigene Scroll", "Name der Schriftrolle"],
    ["Eigener Itemeffekt", "Kurzer Effekt oder Nutzen"],
    ["Eigener Trankeffekt", "Kurzer Effekt oder Nutzen"],
    ["Eigener Zaubereffekt", "Kurzer Effekt oder Nutzen"],
    ["Beschreibe hier den Effekt des Tranks.", "Beschreibung des Tranks"],
    ["Beschreibe hier den Zauber oder Schriftrolleneffekt.", "Beschreibung der Schriftrolle"],
    ["Eigene Itemkarte. Effekt im Spiel festlegen oder in der Kartenschmiede verfeinern.", "Beschreibung nach Bedarf ergänzen"]
]);

function isEditableTextControl(element) {
    if (!(element instanceof HTMLInputElement) && !(element instanceof HTMLTextAreaElement)) {
        return false;
    }

    if (element.disabled === true || element.readOnly === true) {
        return false;
    }

    if (element instanceof HTMLTextAreaElement) {
        return true;
    }

    return ["text", "search", "url", "email", "tel"].includes(element.type);
}

function clearInstructionalTextOnFocus(event) {
    const element = event.target;

    if (isEditableTextControl(element) === false) {
        return;
    }

    const currentValue = element.value.trim();
    const placeholder = instructionalTextFieldDefaults.get(currentValue);

    if (placeholder === undefined) {
        return;
    }

    if (element.placeholder.trim() === "") {
        element.placeholder = placeholder;
    }

    element.value = "";
}

function setupInstructionalTextFieldComfort() {
    document.addEventListener("focusin", clearInstructionalTextOnFocus);
}

// ============================================================
// 17. Start der App
// ============================================================

applyAppViewToPage();
setupCrossTabSync();

const wasStateLoaded = loadAppStateFromBrowser();

if (wasStateLoaded === false && shouldAutoloadDemoCards() === true) {
    gameState.cards = createDemoCards().map(normalizeCardModel);
    gameState.name = demoEncounterName;
    uiState.focusedCardId = null;
    resetEncounterStartGateState({ clearLog: true });
    gameState.presentation.mirielBoard.autoTurnEnabled = false;
    updateStorageStatus("Browser-Speicher: leer, Demo-Karten geladen");

    if (appView === "dm") {
        saveAppStateToBrowser();
        broadcastAppStateChange();
    }
}

setupPlayerSidePolling();
setupPlayerSideNavigation();
setupClickAwayBehavior();
setupArcaneSelects();
setupInstructionalTextFieldComfort();
renderCards();
enhanceArcaneSelects();



// Experimenteller Tablet-Modus: sichere Rückkehr aus Drawern und Erhalt der Seitenposition.
window.addEventListener("resize", function() {
    if (isExperimentalTabletLayout() === false) closeTabletConsole();
});

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape" && document.body.classList.contains("tablet-console-open")) {
        closeTabletConsole();
    }
});

document.addEventListener("click", function(event) {
    if (document.body.classList.contains("tablet-console-open") === false) return;
    const consoleElement = document.querySelector("#tablet-dm-console");
    if (consoleElement !== null && event.target instanceof Element && event.target.matches(".dm-console-panel::before") === false) return;
});

updateTabletConsoleUnreadBadge();

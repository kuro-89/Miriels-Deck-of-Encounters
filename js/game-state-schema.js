/**
 * Spielstandschema, Validierung und Migration
 * ===========================================
 *
 * Aufgabe:
 * Prüft importierte Spielstände, migriert ältere Schemafassungen und erzeugt
 * sichere Normalformen. Das Modul kennt weder DOM noch Browser-Speicher.
 *
 * Abhängigkeiten:
 * - `utils.js` für neue IDs während Migrationen.
 *
 * Liefert an:
 * - `app.js` das versionierte Schema für Import, Export und Wiederherstellung.
 */

import { createUniqueId } from "./utils.js";

export const supportedSchemaVersion = 10;
export const formatName = "Miriel's Deck of Encounters Game State";

export function isPlainObject(value) {
    return value !== null && typeof value === "object" && Array.isArray(value) === false;
}

function createError(code, message, path = "") {
    return { code, message, path };
}

export function parseJsonText(fileText) {
    if (typeof fileText !== "string") {
        return { valid: false, error: createError("INVALID_TEXT", "Die Datei enthält keinen lesbaren Text.") };
    }

    try {
        return { valid: true, value: JSON.parse(fileText) };
    } catch (error) {
        return { valid: false, error: createError("INVALID_JSON", "Die Datei enthält kein gültiges JSON.") };
    }
}

function validateCollection(value, maximum, label, path) {
    if (value === undefined) {
        return null;
    }
    if (Array.isArray(value) === false) {
        return createError("INVALID_COLLECTION", `${label} müssen als Liste gespeichert sein.`, path);
    }
    if (value.length > maximum) {
        return createError("COLLECTION_LIMIT", `${label} überschreiten das erlaubte Limit von ${maximum}.`, path);
    }
    return null;
}

function validateCard(rawCard, index, limits) {
    const cardNumber = index + 1;
    const basePath = `gameState.cards[${index}]`;

    if (isPlainObject(rawCard) === false) {
        return createError("INVALID_CARD", `Karte ${cardNumber} hat keine gültige Objektstruktur.`, basePath);
    }

    const checks = [
        [rawCard.traits, limits.maxTraitsPerCard, `Merkmale von Karte ${cardNumber}`, `${basePath}.traits`],
        [rawCard.actions, limits.maxActionsPerCard, `Aktionen von Karte ${cardNumber}`, `${basePath}.actions`],
        [rawCard.inventoryCards, limits.maxInventoryCardsPerCard, `Itemkarten von Karte ${cardNumber}`, `${basePath}.inventoryCards`],
        [rawCard.inventoryList, limits.maxInventoryListItemsPerCard, `Inventareinträge von Karte ${cardNumber}`, `${basePath}.inventoryList`]
    ];

    for (const [value, maximum, label, path] of checks) {
        const error = validateCollection(value, maximum, label, path);
        if (error !== null) {
            return error;
        }
    }

    if (rawCard.spellcasting !== undefined && isPlainObject(rawCard.spellcasting) === false) {
        return createError("INVALID_SPELLCASTING", `Zauberdaten von Karte ${cardNumber} sind ungültig.`, `${basePath}.spellcasting`);
    }

    if (Array.isArray(rawCard.spellcasting?.spells) && rawCard.spellcasting.spells.length > limits.maxSpellsPerCard) {
        return createError("SPELL_LIMIT", `Karte ${cardNumber} enthält mehr als ${limits.maxSpellsPerCard} Zauber.`, `${basePath}.spellcasting.spells`);
    }

    return null;
}

export function validateGameStateData(gameState, limits) {
    if (isPlainObject(gameState) === false) {
        return { valid: false, error: createError("INVALID_GAME_STATE", "Spielstand-Daten fehlen oder sind beschädigt.", "gameState") };
    }

    if (Array.isArray(gameState.cards) === false) {
        return { valid: false, error: createError("INVALID_CARDS", "Der Spielstand enthält keine gültige Kartenliste.", "gameState.cards") };
    }

    if (gameState.cards.length > limits.maxCards) {
        return { valid: false, error: createError("CARD_LIMIT", `Es dürfen höchstens ${limits.maxCards} Karten importiert werden.`, "gameState.cards") };
    }

    if (isPlainObject(gameState.encounter) === false) {
        return { valid: false, error: createError("INVALID_ENCOUNTER", "Die Encounter-Daten fehlen oder sind beschädigt.", "gameState.encounter") };
    }

    for (let index = 0; index < gameState.cards.length; index += 1) {
        const cardError = validateCard(gameState.cards[index], index, limits);
        if (cardError !== null) {
            return { valid: false, error: cardError };
        }
    }

    return { valid: true };
}

export function normalizeGameStateData(rawGameState) {
    const normalized = structuredClone(rawGameState);
    normalized.id = typeof normalized.id === "string" && normalized.id.trim() !== ""
        ? normalized.id.trim()
        : createUniqueId();
    normalized.name = typeof normalized.name === "string" ? normalized.name : "Unbenannter Spielstand";
    normalized.cards = Array.isArray(normalized.cards) ? normalized.cards : [];
    normalized.encounter = isPlainObject(normalized.encounter) ? normalized.encounter : {};
    normalized.encounter.activeRun = isPlainObject(normalized.encounter.activeRun) ? normalized.encounter.activeRun : null;
    normalized.encounter.lastCompletedRun = isPlainObject(normalized.encounter.lastCompletedRun) ? normalized.encounter.lastCompletedRun : null;
    normalized.eventLog = Array.isArray(normalized.eventLog)
        ? normalized.eventLog.map(function(rawEvent) {
            if (isPlainObject(rawEvent) === false) {
                return null;
            }
            const createdAt = typeof rawEvent.createdAt === "string"
                ? rawEvent.createdAt
                : new Date().toISOString();
            const message = typeof rawEvent.message === "string"
                ? rawEvent.message
                : (typeof rawEvent.text === "string" ? rawEvent.text : "Ereignis protokolliert.");
            return {
                id: typeof rawEvent.id === "string" && rawEvent.id !== "" ? rawEvent.id : createUniqueId(),
                type: typeof rawEvent.type === "string" && rawEvent.type !== "" ? rawEvent.type : "system",
                actorParticipantId: rawEvent.actorParticipantId ?? null,
                sourceCardId: rawEvent.sourceCardId ?? null,
                targetCardId: rawEvent.targetCardId ?? null,
                targetCardIds: Array.isArray(rawEvent.targetCardIds) ? rawEvent.targetCardIds : [],
                amount: Number.isFinite(rawEvent.amount) ? rawEvent.amount : null,
                condition: typeof rawEvent.condition === "string" ? rawEvent.condition : null,
                before: rawEvent.before ?? null,
                after: rawEvent.after ?? null,
                metadata: isPlainObject(rawEvent.metadata) ? rawEvent.metadata : {},
                createdAt,
                message,
                time: typeof rawEvent.time === "string" ? rawEvent.time : new Date(createdAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                text: message
            };
        }).filter(Boolean)
        : [];
    normalized.presentation = isPlainObject(normalized.presentation) ? normalized.presentation : {};
    normalized.settings = isPlainObject(normalized.settings) ? normalized.settings : {};
    return normalized;
}

export function validateEnvelope(importData, limits) {
    if (isPlainObject(importData) === false) {
        return { valid: false, error: createError("INVALID_ROOT", "Die Hauptstruktur muss ein JSON-Objekt sein.") };
    }

    if (importData.formatName !== formatName) {
        return { valid: false, error: createError("INVALID_FORMAT", "Die Datei ist kein Spielstand von Miriel's Deck of Encounters.", "formatName") };
    }

    if (importData.schemaVersion !== supportedSchemaVersion) {
        return {
            valid: false,
            error: createError(
                "UNSUPPORTED_SCHEMA",
                `Diese Exportversion wird nicht unterstützt. Erwartet wird Schema ${supportedSchemaVersion}.`,
                "schemaVersion"
            )
        };
    }

    const validation = validateGameStateData(importData.gameState, limits);
    if (validation.valid !== true) {
        return validation;
    }

    return {
        valid: true,
        gameState: normalizeGameStateData(importData.gameState)
    };
}

export function parseAndPrepareImport(fileText, limits) {
    const parsed = parseJsonText(fileText);
    if (parsed.valid !== true) {
        return parsed;
    }
    return validateEnvelope(parsed.value, limits);
}

export const gameStateSchema = Object.freeze({
    formatName,
    supportedSchemaVersion,
    isPlainObject,
    parseJsonText,
    validateGameStateData,
    validateEnvelope,
    normalizeGameStateData,
    parseAndPrepareImport
});

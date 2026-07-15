/**
 * Karten-, Zauber- und Inventarmodell
 * ==================================
 *
 * Aufgabe:
 * Enthält die DOM-unabhängigen Fabriken, Normalisierungen und Parser für Karten,
 * Aktionen, Traits, Zauber und Inventar. UI-Rendering und Speicherung gehören
 * ausdrücklich nicht in dieses Modul.
 *
 * Abhängigkeiten:
 * - `config.js` für erlaubte Modi und Sicherheitsgrenzen.
 * - `utils.js` für stabile eindeutige IDs.
 *
 * Liefert an:
 * - `app.js`, `demo-data.js` und Tests die gemeinsamen Datenfabriken und Parser.
 */

import {
  effectVisibilityModes,
  importSecurityLimits,
  itemExecutableEffectTypes
} from "./config.js";
import { createUniqueId } from "./utils.js";

export const inventoryCategoryLabels = {
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

export const inventoryCardTemplates = {
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

export function getSafeEffectVisibility(value) {
    return Object.values(effectVisibilityModes).includes(value) ? value : effectVisibilityModes.public;
}

export function getSafeOptionalString(value, maximumLength = importSecurityLimits.maxLongTextLength) {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim().slice(0, maximumLength);
}

export function getSafeNonNegativeInteger(value, fallbackValue) {
    const numberValue = Number(value);

    if (Number.isInteger(numberValue) && numberValue >= 0) {
        return numberValue;
    }

    return fallbackValue;
}

export function createEmptySpellSlots() {
    const slots = {};

    for (let level = 1; level <= 9; level += 1) {
        slots[String(level)] = { max: 0, used: 0 };
    }

    return slots;
}

export function createDefaultSpellcasting(rawCard = {}) {
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

export function parseSpellSaveDcText(value) {
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

export function getSafeSpellLevel(value) {
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

export function createSpellObject(rawSpell, index) {
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

export function createSpellId(name, level, index) {
    const slug = getSafeOptionalString(name)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    return `${level}-${slug || "spell"}-${index}`;
}

export function parseLegacySpellsText(spellsText) {
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

export function applyLegacySlotHints(spellcasting, rawCard = {}) {
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

export function groupSpellsByLevel(spells) {
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

export function getSafeUsageReset(value) {
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

export function inferUsageResetFromText(usageText) {
    return getSafeUsageReset(usageText);
}

export function inferUsageMaxFromText(usageText) {
    const text = getSafeOptionalString(usageText);
    const match = text.match(/^\s*(\d+)\s*(?:\/|per\b|x\b|charges?\b|ladungen?\b)/i);

    if (match === null) {
        return 0;
    }

    return clampNumber(Number(match[1]), 0, 12);
}

export function getSafeCardActionType(value) {
    if (value === "action" || value === "bonus" || value === "reaction" || value === "special") {
        return value;
    }

    return "action";
}

export function createCardAction(rawAction = {}, fallbackIndex = 0) {
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

export function clampNumber(value, minValue, maxValue) {
    return Math.max(minValue, Math.min(maxValue, value));
}

export function splitDetailEntries(value, splitCommaList = false) {
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

export function getDetailEntryTitle(entry, fallbackLabel, index) {
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

export function getDetailEntryBody(entry) {
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

export function getSafeCardTraitCategory(value) {
    if (value === "resource" || value === "classFeature" || value === "species" || value === "feat" || value === "monsterTrait" || value === "npc" || value === "passive" || value === "other") {
        return value;
    }

    return "other";
}

export function createCardTrait(rawTrait = {}, fallbackIndex = 0) {
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

export function normalizeInventoryImagePath(value, category = "potion") {
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

export function createInventoryCardFromTemplate(templateName) {
    const template = inventoryCardTemplates[templateName] || inventoryCardTemplates.customPotion;
    return createInventoryCard({
        ...template,
        template: templateName
    });
}

export function getSafeInventoryCategory(value) {
    if (Object.prototype.hasOwnProperty.call(inventoryCategoryLabels, value)) {
        return value;
    }
    return "misc";
}

export function createInventoryCard(rawItem = {}, fallbackIndex = 0) {
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

export function getInventoryItemSuggestion(name) {
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
        { test: /longsword/, category: "weapon", description: "Kriegsnahkampfwaffe: 1W8 Hiebschaden, vielseitig 1W10." },
        { test: /quarterstaff/, category: "weapon", description: "Einfache Nahkampfwaffe: 1W6 Wuchtschaden, vielseitig 1W8; kann als arkaner Stab beschrieben werden." },
        { test: /arrows?/, category: "ammunition", description: "Munition für den Shortbow." },
        { test: /caltrops/, category: "consumable", description: "Ausstreubare Metallspitzen. Können Boden gefährlich machen und Bewegung verlangsamen." },
        { test: /^oil$/, category: "consumable", description: "Ölflasche. Kann als Brennstoff, Brandbeschleuniger oder improvisierter Verbrauchsgegenstand genutzt werden." },
        { test: /torch|torches/, category: "equipment", description: "Lichtquelle für dunkle Bereiche; brennt etwa 1 Stunde." },
        { test: /thieves' tools/, category: "tool", description: "Diebeswerkzeug zum Öffnen von Schlössern und Entschärfen von Fallen; für Miriel besonders relevant." },
        { test: /disguise kit/, category: "tool", description: "Verkleidungsset für Maskierungen, Bühnenrollen und Täuschungsmanöver." },
        { test: /forgery kit/, category: "tool", description: "Fälscherwerkzeug für Dokumente, Siegel und Schriftproben." },
        { test: /flute/, category: "tool", description: "Musikinstrument; kann auch als sozialer oder atmosphärischer Gegenstand genutzt werden." },
        { test: /spellbook/, category: "magicItem", description: "Zauberbuch. Enthält Suicas bekannte Zauber und unterstützt Vorbereitung und Ritualwirken." },
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




export function createInventoryListItem(rawItem = {}, fallbackIndex = 0) {
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

export function parseCurrencyFromInventoryText(text) {
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

export function splitInventoryEntries(text) {
    return getSafeOptionalString(text)
        .replace(/coins?:[^;\n]+[.;]?/ig, "")
        .split(/[;\n]+/)
        .map(function(entry) { return entry.trim().replace(/[.]$/, ""); })
        .filter(function(entry) { return entry !== ""; });
}

export function getInventoryEntryCountAndName(entry) {
    const amountMatch = entry.match(/x\s*(\d+)$/i) || entry.match(/^(\d+)\s*x\s*/i);
    const count = amountMatch ? Math.max(1, Number(amountMatch[1])) : 1;
    const cleanName = entry.replace(/x\s*\d+$/i, "").replace(/^\d+\s*x\s*/i, "").trim();
    return { count: count, name: cleanName };
}

export function createCustomConsumableCardFromEntry(entry, fallbackIndex) {
    const parsed = getInventoryEntryCountAndName(entry);
    const lower = parsed.name.toLowerCase();
    const item = createInventoryCard({
        id: `legacy-card-${fallbackIndex}-${Math.random().toString(36).slice(2, 8)}`,
        template: "customPotion",
        name: lower.includes("kreischer") ? "Trank gegen Kreischer-Sporen" : parsed.name,
        category: lower.includes("scroll") ? "scroll" : "potion",
        effect: lower.includes("kreischer") ? "Gegen Kreischer-Sporen" : "Eigener Itemeffekt",
        healingFormula: "",
        description: lower.includes("kreischer")
            ? "Billiger Spezialtrank gegen Kreischer-Sporen. Genaue Wirkung je nach Szene vom DM festlegen."
            : "Eigene Itemkarte. Effekt im Spiel festlegen oder in der Kartenschmiede verfeinern.",
        image: lower.includes("scroll") ? "assets/items/scroll_custom.jpg" : "assets/items/potion_custom.jpg",
        showAsAction: true,
        actionType: lower.includes("scroll") ? "action" : "action"
    }, fallbackIndex);
    return { item: item, count: parsed.count };
}

export function createInventoryDataFromLegacyText(text) {
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
        } else if ((lower.includes("potion") || lower.includes("trank")) && (lower.includes("kreischer") || lower.includes("sporen") || lower.includes("custom"))) {
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

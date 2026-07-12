/**
 * Zentrale, verhaltensneutrale Konfiguration der statischen App.
 * SRD-Inhalte und ihre Regelstände werden hier nicht vermischt.
 */
export const useDemoData = true;
export const appVersion = "0.26.0";

export const cardKinds = Object.freeze({ character: "character", item: "item", custom: "custom" });
export const characterRoles = Object.freeze({ player: "player", npc: "npc", monster: "monster" });
export const cardLocations = Object.freeze({ deck: "deck", hand: "hand", trash: "trash" });
export const encounterStatuses = Object.freeze({ active: "active", eliminated: "eliminated" });
export const effectDurationModes = Object.freeze({
  manual: "manual", rounds: "rounds", turnStart: "turn_start", turnEnd: "turn_end",
  encounterEnd: "encounter_end", freeText: "free_text"
});
export const effectVisibilityModes = Object.freeze({ public: "public", controller: "controller", dm: "dm" });
export const itemExecutableEffectTypes = Object.freeze({
  none: "none", healing: "healing", damage: "damage", temporaryHp: "temporary_hp",
  condition: "condition", customEffect: "custom_effect"
});
export const itemExecutableEffectLabels = Object.freeze({
  none: "Nur Beschreibung", healing: "Heilung", damage: "Schaden", temporary_hp: "Temporäre HP",
  condition: "Condition", custom_effect: "Eigener Effekt"
});
export const availableConditions = Object.freeze([
  "blessed", "blinded", "charmed", "concentrating", "cursed", "deafened", "enlarged",
  "exhausted", "frightened", "grappled", "hasted", "hexed", "hunters-mark", "incapacitated",
  "invisible", "magical-effect", "paralyzed", "petrified", "physical-effect", "poisoned",
  "prone", "raging", "restrained", "stunned", "unconscious"
]);
export const importSecurityLimits = Object.freeze({
  maxFileBytesWithoutEmbeddedImages: 20 * 1024 * 1024, maxFileBytesWithEmbeddedImages: 100 * 1024 * 1024,
  maxCards: 1000, maxShortTextLength: 160, maxMediumTextLength: 2000, maxLongTextLength: 20000,
  maxTraitsPerCard: 150, maxActionsPerCard: 150, maxSpellsPerCard: 500,
  maxInventoryCardsPerCard: 500, maxInventoryListItemsPerCard: 1000
});
export const appOperatingMode = "Statisch gehostete Browser-Version";
export const appStorageKey = "miriels-deck-game-state-v7";
export const appChannelName = "miriels-deck-game-state-channel-v2";
export const demoCardsAutoloadStorageKey = `${appStorageKey}-demo-autoload-enabled`;
export const demoEncounterName = "Miriels Demo-Spielstand";
export const mirielBoardAutomationDefaultsVersion = 2;

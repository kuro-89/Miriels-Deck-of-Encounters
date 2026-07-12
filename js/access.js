/** Rollen, Sichtbarkeit und Aktionsberechtigungen. */
export const accessRoles = Object.freeze({ dm: "dm", controller: "controller", viewer: "viewer", publicDisplay: "public_display" });
export const cardPublicProfiles = Object.freeze({ standard: "standard", minimal: "minimal", full: "full" });
export const cardFieldVisibility = Object.freeze({
  publicName: "public_name", image: "image", initiative: "initiative", hp: "hp", conditions: "conditions",
  effects: "effects", combatStats: "combat_stats", notes: "notes", inventory: "inventory", actions: "actions",
  traits: "traits", spells: "spells"
});
export const gameActionPermissions = Object.freeze({
  damage: "damage", healing: "healing", temporaryHp: "temporary_hp", condition: "condition", effect: "effect",
  itemUse: "item_use", itemTransfer: "item_transfer", editCard: "edit_card", moveCard: "move_card", manageEncounter: "manage_encounter"
});
export function createAccessContext(role = accessRoles.dm, participantId = null, controlledCardIds = []) {
  return { role: Object.values(accessRoles).includes(role) ? role : accessRoles.viewer, participantId, controlledCardIds: Array.isArray(controlledCardIds) ? controlledCardIds.slice() : [] };
}
export function getSafeCardAccessPolicy(rawPolicy) {
  const policy = rawPolicy !== null && typeof rawPolicy === "object" ? rawPolicy : {};
  const publicProfile = Object.values(cardPublicProfiles).includes(policy.publicProfile) ? policy.publicProfile : cardPublicProfiles.standard;
  return { publicProfile, controllerCanEdit: policy.controllerCanEdit === true, controllerCanUseItems: policy.controllerCanUseItems !== false, controllerCanTransferItems: policy.controllerCanTransferItems === true, publicOverrides: policy.publicOverrides !== null && typeof policy.publicOverrides === "object" ? { ...policy.publicOverrides } : {} };
}
export function isCardControlledByContext(card, context) { return context.role === accessRoles.controller && context.controlledCardIds.includes(card.id); }
export function canViewCardField(card, fieldName, context = createAccessContext(accessRoles.dm)) {
  if (context.role === accessRoles.dm) return true;
  if (isCardControlledByContext(card, context) && [cardFieldVisibility.notes, cardFieldVisibility.inventory, cardFieldVisibility.actions, cardFieldVisibility.traits, cardFieldVisibility.spells].includes(fieldName)) return true;
  const policy = getSafeCardAccessPolicy(card.accessPolicy);
  if (typeof policy.publicOverrides[fieldName] === "boolean") return policy.publicOverrides[fieldName];
  if (fieldName === cardFieldVisibility.publicName || fieldName === cardFieldVisibility.image) return true;
  if (policy.publicProfile === cardPublicProfiles.minimal) return false;
  if ([cardFieldVisibility.initiative, cardFieldVisibility.hp, cardFieldVisibility.conditions, cardFieldVisibility.effects].includes(fieldName)) return true;
  return policy.publicProfile === cardPublicProfiles.full && [cardFieldVisibility.combatStats, cardFieldVisibility.actions, cardFieldVisibility.traits, cardFieldVisibility.spells].includes(fieldName);
}
export function canEditCardField(card, fieldName, context = createAccessContext(accessRoles.dm)) {
  if (context.role === accessRoles.dm) return true;
  return isCardControlledByContext(card, context) && getSafeCardAccessPolicy(card.accessPolicy).controllerCanEdit === true;
}
export function canPerformAction(actionName, context = createAccessContext(accessRoles.dm), sourceCard = null, targetCard = null) {
  if (context.role === accessRoles.dm) return true;
  if (context.role !== accessRoles.controller || sourceCard === null || !isCardControlledByContext(sourceCard, context)) return false;
  if ([gameActionPermissions.damage, gameActionPermissions.healing, gameActionPermissions.temporaryHp, gameActionPermissions.condition, gameActionPermissions.effect].includes(actionName)) return targetCard !== null;
  if (actionName === gameActionPermissions.itemUse) return getSafeCardAccessPolicy(sourceCard.accessPolicy).controllerCanUseItems;
  if (actionName === gameActionPermissions.itemTransfer) return getSafeCardAccessPolicy(sourceCard.accessPolicy).controllerCanTransferItems;
  return false;
}
export const dmAccessContext = createAccessContext(accessRoles.dm);
export const publicDisplayAccessContext = createAccessContext(accessRoles.publicDisplay);

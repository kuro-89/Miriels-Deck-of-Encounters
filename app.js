// ============================================================
// 1. Globale Daten und Konstanten
// ============================================================

const useDemoData = true;
const appVersion = "0.8.8";
const appOperatingMode = "Statisch gehostete Browser-Version";

const appStorageKey = "miriels-deck-encounter-state-v18";
const appChannelName = "miriels-deck-encounter-channel";
const demoCardsAutoloadStorageKey = `${appStorageKey}-demo-autoload-enabled`;
const demoEncounterName = "Miriel\'s Demo Encounter";
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
let deckSearchQuery = "";
let deckTypeFilter = "all";
let deckSortMode = "name";
let pendingDeckImportData = null;
let pendingDeckImportFileName = "";
let encounterName = useDemoData ? demoEncounterName : "Unbenannter Encounter";
let demoCardsAutoloadEnabled = getDemoCardsAutoloadEnabled();

const demoCreatureNameSignatures = [
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


let creatures = useDemoData ? createDemoCreatures() : [];

function createDemoCreatures() {
    const demoCreatures = [
        {
            id: 1,
            name: "Miriel Dunkelschön",
            publicName: "Miriel",
            type: "player",
            initiative: 24,
            hp: 55,
            maxHp: 55,
            tempHp: 8,
            armorClass: 17,
            passivePerception: 16,
            passiveInsight: 10,
            passiveInvestigation: 18,
            strengthScore: 8,
            strengthModifier: "-1",
            dexterityScore: 20,
            dexterityModifier: "+5",
            constitutionScore: 14,
            constitutionModifier: "+2",
            intelligenceScore: 14,
            intelligenceModifier: "+2",
            wisdomScore: 10,
            wisdomModifier: "+0",
            charismaScore: 10,
            charismaModifier: "+0",
            speed: "30 ft. Walking, 30 ft. Flying",
            savingThrows: "DEX +8, INT +5",
            resistances: "—",
            immunities: "—",
            vulnerabilities: "—",
            senses: "Darkvision 60 ft.",
            spellSaveDc: "DC 13 · Spell Attack +5",
            specialResources: "Hinterhältiger Angriff 4W6 · Listige Aktion · Unheimliches Ausweichen · Entrinnen · Arkane Kartenmeisterin: 4 Zauberplätze 1. Grades, 2 Zauberplätze 2. Grades",
            notes: "Charakterbogen: Rogue 7 · Chaosfee · Gauklerin · Chaotic Neutral.\n\nPersönlichkeit: \"Die Welt ist meine Bühne und das Chaos ist meine Show.\" Dunkelschön/Miriel ist fasziniert von der Welt der Sterblichen und möchte sie neugierig, verspielt und oft ohne echtes Gespür für Gefahr erkunden.\n\nIdeal: Freiheit. Nichts ist wichtiger als die Freiheit, das eigene Leben so zu leben, wie es einem gefällt. Einschränkungen und Regeln der sterblichen Welt sind für sie Hindernisse, die es zu überwinden gilt.\n\nBindung: Dunkelschön hat sich geschworen, den Namen Miriel zu ehren und ihre Träume zu verwirklichen.\n\nMakel: Naiv im Umgang mit der Realität. Trotz all ihrer magischen Fähigkeiten hat Dunkelschön Schwierigkeiten, Gefahren richtig einzuschätzen. Sobald sie sich ein Ziel gesetzt hat, kann sie stur und kompromisslos sein, selbst wenn das Ziel nicht in ihrem besten Interesse liegt.",
            demoSpellSeed: "Cantrips: Minor Illusion; Mage Hand; Resonanzschnitt; Druidcraft.\n1st Level: Disguise Selbst; Silent Image; Find Familiar; Chaossplitter; Faerie Fire.\n2nd Level: Mirror Image; Enlarge/Reduce.\nSpellcasting Notes: INT spellcasting; Spell Save DC 13; Spell Attack +5.",
            demoInventorySeed: "Trugbildmantel; Nachtsichtgläser; Studded Leather; Absurd großer Hexenhut; Dagger x2; Rapier; Shortbow; Arrows x20; Thieves' Tools; Disguise Kit; Forgery Kit; Backpack; Crowbar; Heiltrank x2; Großer Heiltrank; Meisterlicher Heiltrank; Bedroll; Candles x5; Costume Clothes x2; Rations; Waterskin; Rope; Pitons; Hammer; Tinderbox; Torches; Blue Mushrooms; Brass Bowl; Powdered Iron; Pieces of Fleece; coins: 355 GP, 78 SP.",
            hpVisibility: "full",
            imageData: "Images/miriel_img.png",
            conditions: [],
            isInCombat: true,
            isSelected: false
        },
        {
            id: 2,
            name: "Suica",
            publicName: "Suica",
            type: "player",
            initiative: 12,
            hp: 20,
            maxHp: 20,
            tempHp: 5,
            armorClass: 12,
            passivePerception: 11,
            passiveInsight: 13,
            passiveInvestigation: 17,
            strengthScore: 8,
            strengthModifier: "-1",
            dexterityScore: 14,
            dexterityModifier: "+2",
            constitutionScore: 14,
            constitutionModifier: "+2",
            intelligenceScore: 17,
            intelligenceModifier: "+3",
            wisdomScore: 12,
            wisdomModifier: "+1",
            charismaScore: 10,
            charismaModifier: "+0",
            speed: "30 ft. Walking",
            savingThrows: "INT +5, WIS +3",
            resistances: "Poison",
            immunities: "—",
            vulnerabilities: "—",
            senses: "Darkvision 60 ft.",
            spellSaveDc: "DC 13 · Spell Attack +5",
            specialResources: "Arkane Erholung 1/LR · Arkane Schreibfeder · Erwachtes Zauberbuch · Schlangenmagie",
            notes: "Charakterbogen: Wizard 3 · Schlangenblütige · Arkane Kopfgeldjägerin · Chaotic Neutral.\n\nPersönlichkeit: Suica betrachtet Menschen wie Forschungsobjekte, aber nicht grausam – nur neugierig.\n\nIdeal: Magie ist die höchste Form von Wahrheit. Jede neue Formel ist ein Sieg über das Unbekannte.\n\nBindung: Ein ehemaliger Mentor glaubt, sie sei zu verspielt, um echte arkane Größe zu erreichen; Suica will das Gegenteil beweisen.\n\nMakel: Sie sammelt Wissen, auch wenn es gefährlich oder moralisch fragwürdig ist.",
            demoSpellSeed: "Cantrips: Mage Hand; Gedankensplitter; Minor Illusion; Poison Spray.\n1st Level: Detect Magic; Identify; Shield; Magic Missile; Find Familiar; Mage Armor; Comprehend Languages; Disguise Selbst; Animal Friendship.\n2nd Level: Detect Thoughts; Invisibility; Suggestion.\nSpellcasting Notes: INT spellcasting; Spell Save DC 13; Spell Attack +5.",
            demoInventorySeed: "Dagger x2; Quarterstaff; Spellbook; Backpack; Robe; Book x2; Ink; Ink Pen x2; Parchment; Little Bag of Sand; Small Knife; Oil x10; Tinderbox; Lamp; Flute; Thieves' Tools; coins: 5 GP.",
            hpVisibility: "full",
            imageData: "Images/suica_img.png",
            conditions: [],
            isInCombat: true,
            isSelected: false
        },
        {
            id: 3,
            name: "Animierter Besen",
            publicName: "Borstibald der Aufmüpfige",
            type: "monster",
            initiative: 8,
            hp: 1,
            maxHp: 22,
            tempHp: 0,
            armorClass: 14,
            passivePerception: 9,
            passiveInsight: 6,
            passiveInvestigation: 5,
            strengthScore: 12,
            strengthModifier: "+1",
            dexterityScore: 18,
            dexterityModifier: "+4",
            constitutionScore: 14,
            constitutionModifier: "+2",
            intelligenceScore: 6,
            intelligenceModifier: "-2",
            wisdomScore: 8,
            wisdomModifier: "-1",
            charismaScore: 5,
            charismaModifier: "-3",
            speed: "0 ft., Fly 50 ft. (hover)",
            savingThrows: "DEX +4, CON +2",
            resistances: "Bludgeoning from nonmagical cleanup tools",
            immunities: "Poison, Exhausted",
            vulnerabilities: "Fire",
            senses: "Blindsight 10 ft.",
            spellSaveDc: "DC 12",
            specialResources: "Dust Burst 1/Encounter · Annoying Sweep Recharge 5–6 · False Object",
            notes: "Skurriles Objektmonster für chaotische Innenräume. Im Kampf soll Borstibald nerven, Sichtlinien stören und Ziele aus der Position bringen. Gute Demo-Karte für Conditions, Zielauswahl und kurze Aktionsblöcke.",
            demoSpellSeed: "Dust Cloud. Magical dust briefly obscures a 10 ft. area.\nStartling Sweep. A rattling arcane shove interrupts enemy reactions.\nPetty Poltergeist Effect. Small unattended objects tremble, clatter or slide up to 5 ft.",
            demoInventorySeed: "Lose verzauberte Borsten\nVerbogenes Silbernägelchen\nStaubflocken mit schwacher Illusionsaura\nEin beleidigtes Knarren, das nicht in einen Beutel passt",
            hpVisibility: "bar",
            imageData: "Images/borstibald_img.png",
            conditions: ["prone", "frightened"],
            isInCombat: true,
            isSelected: false
        },
        {
            id: 4,
            name: "Nebelzahn-Mandrake",
            publicName: "Nebelzahn",
            type: "monster",
            initiative: 14,
            hp: 38,
            maxHp: 38,
            tempHp: 0,
            armorClass: 15,
            passivePerception: 13,
            passiveInsight: 9,
            passiveInvestigation: 8,
            strengthScore: 16,
            strengthModifier: "+3",
            dexterityScore: 12,
            dexterityModifier: "+1",
            constitutionScore: 18,
            constitutionModifier: "+4",
            intelligenceScore: 5,
            intelligenceModifier: "-3",
            wisdomScore: 13,
            wisdomModifier: "+1",
            charismaScore: 8,
            charismaModifier: "-1",
            speed: "25 ft., burrow 10 ft.",
            savingThrows: "CON +5, WIS +2",
            resistances: "Poison, Necrotic mist",
            immunities: "—",
            vulnerabilities: "Radiant",
            senses: "Tremorsense 30 ft.",
            spellSaveDc: "DC 13",
            specialResources: "Shriek Bloom 1/Encounter · Fog Sap 3/day · Root Snare Recharge 5–6",
            notes: "Ambusher für Wald, Sumpf und verwilderte Gärten. Beginnt idealerweise verborgen, isoliert ein Ziel mit Root Snare und zwingt die Gruppe, Positionierung ernst zu nehmen.",
            demoSpellSeed: "Fog Sap. Toxic mist condensed into a sticky projectile.\nRoot Snare. Living roots hook around ankles and wrists.\nShriek Bloom. A sudden mandrake scream that weaponizes fear.",
            demoInventorySeed: "Mandrake root fang\nVial of grey sap\nCracked seed pod\nWet black leaves with faint necrotic veins",
            hpVisibility: "descriptive",
            imageData: "Images/nebelzahn_mandrake.png",
            conditions: ["poisoned"],
            isInCombat: false,
            isSelected: false
        },
        {
            id: 5,
            name: "Glimmerkrähe",
            publicName: "Die Glimmerkrähe",
            type: "monster",
            initiative: 18,
            hp: 4,
            maxHp: 19,
            tempHp: 6,
            armorClass: 16,
            passivePerception: 15,
            passiveInsight: 11,
            passiveInvestigation: 12,
            strengthScore: 6,
            strengthModifier: "-2",
            dexterityScore: 20,
            dexterityModifier: "+5",
            constitutionScore: 12,
            constitutionModifier: "+1",
            intelligenceScore: 14,
            intelligenceModifier: "+2",
            wisdomScore: 13,
            wisdomModifier: "+1",
            charismaScore: 16,
            charismaModifier: "+3",
            speed: "10 ft., Fly 60 ft.",
            savingThrows: "DEX +6, CHA +3",
            resistances: "Lightning, Psychic whispers",
            immunities: "—",
            vulnerabilities: "Thunder",
            senses: "Darkvision 60 ft.",
            spellSaveDc: "DC 14",
            specialResources: "Spiegelfeder 2/Begegnung · Funkenraub Aufladung 6 · Gedankenraub",
            notes: "Aktuelle Demo-Handkarte. Schneller arkaner Störer: zuerst Reaktionen brechen, dann aus der Reichweite fliegen. Ideal, um die neue Details-Navigation mit Actions, Traits und Spells zu demonstrieren.",
            demoSpellSeed: "Mirror Feather. A defensive shimmer of broken reflections.\nSteal Spark. Psychic theft shaped like violet lightning.\nFlash Caw. A harsh arcane cry that leaves afterimages.\nGlint Trail. A visible trail of tiny star-like motes marks the crow's movement until initiative count 0.",
            demoInventorySeed: "Iridescent feather\nStolen copper ring\nCracked mirror bead\nTiny thought-splinter that whispers half a name",
            hpVisibility: "descriptive",
            imageData: "Images/glimmerkraehe.png",
            conditions: [],
            isInCombat: true,
            isSelected: false
        },
        {
            id: 6,
            name: "Liora Veyth",
            publicName: "Liora",
            type: "player",
            initiative: 15,
            hp: 42,
            maxHp: 61,
            tempHp: 4,
            armorClass: 20,
            passivePerception: 10,
            passiveInsight: 13,
            passiveInvestigation: 9,
            strengthScore: 8,
            strengthModifier: "-1",
            dexterityScore: 14,
            dexterityModifier: "+2",
            constitutionScore: 16,
            constitutionModifier: "+3",
            intelligenceScore: 8,
            intelligenceModifier: "-1",
            wisdomScore: 10,
            wisdomModifier: "+0",
            charismaScore: 18,
            charismaModifier: "+4",
            speed: "30 ft. Walking",
            savingThrows: "STR +1, DEX +4, CON +8, INT +1, WIS +2, CHA +9",
            resistances: "Necrotic, Radiant",
            immunities: "—",
            vulnerabilities: "—",
            senses: "Darkvision 60 ft.",
            spellSaveDc: "DC 15 · Spell Attack +7",
            specialResources: "Zaubereipunkte 5 · Metamagie: Verstärkt, Beschleunigt · Fluch der Schattenklinge 1/SR · Gunst des Schicksals 1/SR · Heilende Berührung 1/LR · Sternenbrand 1/LR",
            notes: "Charakterbogen: Sorcerer 5 / Warlock 3 · Sternengeborene · Hofübersetzerin · Chaotic Neutral.\n\nPersönlichkeit: Liora folgt eher ihrem Bauchgefühl als klugen Argumenten – oft bringt sie das in Schwierigkeiten, manchmal aber auch zu verborgenen Wahrheiten.\n\nIdeal: Freiheit. Niemand soll sie je wieder kontrollieren – nicht der Hof, nicht ihr Erbe, nicht einmal ihr Patron.\n\nBindung: Die Stimme ihres Patrons verfolgt sie; sie fürchtet sie und kann doch nicht von ihr loslassen.\n\nMakel: Sie gibt oft vor, mehr zu verstehen, als sie wirklich tut, und gerät dadurch in Gefahren, die sie nicht einschätzen kann.\n\nAussehen: Liora wirkt auf den ersten Blick wie eine junge, schöne Frau, doch bei genauerem Hinsehen verrät ihr Aussehen ihre sternengeborene Herkunft und die Schatten, die an ihr nagen. Ihr Gesicht ist fein geschnitten, mit hohen Wangenknochen und vollen Lippen. Dunkle Schatten und verfärbte Stellen ziehen sich über ihre linke Gesichtshälfte und den Hals, wie eine brennende Spur von himmlischer Macht, die in Finsternis übergeht. Ihre Augen leuchten in goldenem Schimmer; ihr tiefviolettes Haar fällt in weichen Wellen über die Schultern. An manchen Stellen schimmert ihre Haut wie mit Sternenstaub überzogen, während andere Bereiche dunkel verfärbt wirken, als hätte sie eine Korrumpierung berührt.",
            demoSpellSeed: "Cantrips: Prestidigitation; Message; Sacred Flame; Minor Illusion; Resonanzschnitt; Eldritch Blast; Grabesklang; Light.\n1st Level: Elementarschild; Shield; Healing Word; Hex; Comprehend Languages; Armor of Agathys; Schicksalstempo; Protection from Evil and Good.\n2nd Level: Suggestion; Mirror Image; Gedankenhieb; Darkness; Misty Step.\n3rd Level: Fireball; Hypnotic Pattern; Counterspell.\nSpellcasting Notes: CHA spellcasting; Spell Save DC 15; Spell Attack +7; Sorcerer slots 1st: 4, 2nd: 3, 3rd: 2; Pact slots 2nd: 2.",
            demoInventorySeed: "Cloak of Protection; Ring of Protection; Starker Heiltrank; Scale Mail; Shield; Billiger Trank gegen Shrieker-Sporen x2; Ink; Common Clothes; Fine Clothes; Pouch; Backpack; Crystal; Longsword; Oil x2; Rations x10; Rope; Tinderbox; Torches x10; Waterskin; Caltrops x20; Crowbar; coins: 95 GP.",
            hpVisibility: "full",
            imageData: "Images/liora_img.png",
            conditions: [],
            isInCombat: true,
            isSelected: false
        },
        {
            id: 7,
            name: "Moosgruft-Koloss",
            publicName: "Moosgruft-Koloss",
            type: "monster",
            initiative: 4,
            hp: 35,
            maxHp: 88,
            tempHp: 0,
            armorClass: 16,
            passivePerception: 14,
            passiveInsight: 7,
            passiveInvestigation: 6,
            strengthScore: 20,
            strengthModifier: "+5",
            dexterityScore: 8,
            dexterityModifier: "-1",
            constitutionScore: 18,
            constitutionModifier: "+4",
            intelligenceScore: 5,
            intelligenceModifier: "-3",
            wisdomScore: 12,
            wisdomModifier: "+1",
            charismaScore: 6,
            charismaModifier: "-2",
            speed: "25 ft.",
            savingThrows: "STR +7, CON +6",
            resistances: "Bludgeoning, Necrotic soil",
            immunities: "Poisoned",
            vulnerabilities: "Fire",
            senses: "Tremorsense 60 ft.",
            spellSaveDc: "DC 15",
            specialResources: "Grabmoos-Regeneration 10 TP · Zermalmende Wurzel Aufladung 5–6 · Grabsog 1/Begegnung",
            notes: "Boss- oder Elite-Demo-Karte. Der Koloss funktioniert als langsamer Raumkontrolleur: zieht Ziele in gefährliche Zonen, überlebt lange und zwingt die Gruppe zu Feuer- oder Mobilitätslösungen.",
            demoSpellSeed: "Root Wall. Roots and grave soil rise as half cover until initiative count 0.\nGrave Pull. Necrotic roots drag creatures through mud and loose stones.\nMoss Regrowth. Green corpse-light knits cracked stone back together.",
            demoInventorySeed: "Moss-covered stone heart\nAncient coin fragments\nGrave-root fiber\nA cracked nameplate from an unknown tomb",
            hpVisibility: "descriptive",
            imageData: "Images/moosgruft_koloss.png",
            conditions: [],
            isInCombat: true,
            isSelected: false
        },
        {
            id: 8,
            name: "Spiegelmolch",
            publicName: "Spiegelmolch",
            type: "monster",
            initiative: 16,
            hp: 27,
            maxHp: 27,
            tempHp: 3,
            armorClass: 15,
            passivePerception: 12,
            passiveInsight: 8,
            passiveInvestigation: 15,
            strengthScore: 8,
            strengthModifier: "-1",
            dexterityScore: 17,
            dexterityModifier: "+3",
            constitutionScore: 12,
            constitutionModifier: "+1",
            intelligenceScore: 16,
            intelligenceModifier: "+3",
            wisdomScore: 10,
            wisdomModifier: "+0",
            charismaScore: 14,
            charismaModifier: "+2",
            speed: "30 ft., swim 30 ft.",
            savingThrows: "DEX +5, INT +4",
            resistances: "Psychic, Illusion backlash",
            immunities: "—",
            vulnerabilities: "Thunder",
            senses: "Darkvision 60 ft., mirror-sense 30 ft.",
            spellSaveDc: "DC 14",
            specialResources: "Reflective Skin 2/Encounter · Duplicate Flicker 1/day · False Step Recharge 5–6",
            notes: "Illusions-Störer für Wasser, Spiegelhallen oder Mondlichtszenen. Nutzt falsche Positionen und kleine Zwangsbewegungen statt roher Gewalt.",
            demoSpellSeed: "Duplicate Flicker. A second silhouette peels out of the reflection.\nGlass Ripple. A ring of mirror-light distorts distance and aim.\nFalse Step. The target follows a reflection that is not really there.\nRipple Swap. The molch trades places with a nearby reflection.",
            demoInventorySeed: "Iridescent scale\nTiny mirror shard\nCold pond pearl\nWet glassy membrane that keeps reflecting the wrong sky",
            hpVisibility: "bar",
            imageData: "Images/spiegelmolch.png",
            conditions: ["invisible"],
            isInCombat: false,
            isSelected: false
        },
        {
            id: 9,
            name: "Veyra Mondfaden",
            publicName: "Veyra",
            type: "npc",
            initiative: 15,
            hp: 31,
            maxHp: 31,
            tempHp: 0,
            armorClass: 15,
            passivePerception: 15,
            passiveInsight: 17,
            passiveInvestigation: 16,
            strengthScore: 9,
            strengthModifier: "-1",
            dexterityScore: 18,
            dexterityModifier: "+4",
            constitutionScore: 12,
            constitutionModifier: "+1",
            intelligenceScore: 16,
            intelligenceModifier: "+3",
            wisdomScore: 17,
            wisdomModifier: "+3",
            charismaScore: 14,
            charismaModifier: "+2",
            speed: "30 ft.",
            savingThrows: "DEX +6, INT +5, WIS +5",
            resistances: "Psychic pressure from interrogation magic",
            immunities: "—",
            vulnerabilities: "Thunderous public attention",
            senses: "Reads street patterns and tailing routes",
            spellSaveDc: "DC 13 · Coded Whispers",
            specialResources: "Dead Drop 2/day · Vanish in Rain 1/Encounter · Blackmail Thread 3",
            notes: "NPC-Demo-Karte für soziale Encounters, Verfolgungen und geheime Übergaben. Veyra ist keine Frontkämpferin; sie kontrolliert Informationen, Fluchtwege und kleine taktische Fenster.",
            demoSpellSeed: "Coded Whisper. A nearly silent phrase carries meaning only to the intended listener.\nRain Veil. Street rain and fog distort her outline for a few seconds.\nMoonfaden Mark. A tiny silver thread marks a door, pocket or package until dawn.\nFalse Trail. Footprints and drips appear to lead down the wrong alley.",
            demoInventorySeed: "Versiegelte Nachricht\nVersteckter Dolch\nWetterfester Kapuzenmantel\nDrei codierte Straßenmarken\nSchwarzes Band mit silbernem Faden",
            hpVisibility: "descriptive",
            imageData: "Images/veyra.png",
            conditions: [],
            isInCombat: false,
            isSelected: false
        }

    ];

    return demoCreatures.map(addDemoStructuredActions);
}

function addDemoStructuredActions(creature) {
    const { demoSpellSeed = "", demoInventorySeed = "", ...baseCreature } = creature;
    const demoActions = getDemoActionsForCreature(creature.id);
    const demoTraits = getDemoTraitsForCreature(creature.id);
    const demoSpellcasting = getDemoSpellcastingForCreature(creature);
    const demoInventory = createInventoryDataFromLegacyText(demoInventorySeed);

    if (creature.id === 1) {
        demoInventory.cards.push(createInventoryCardFromTemplate("greaterHealing"));
    }

    return {
        ...baseCreature,
        actions: demoActions,
        traits: demoTraits,
        spellcasting: demoSpellcasting,
        currency: demoInventory.currency,
        inventoryCards: demoInventory.cards,
        inventoryList: demoInventory.list,
        isDemoCard: true
    };
}

function isKnownDemoCreatureData(rawCreature) {
    if (rawCreature === null || typeof rawCreature !== "object") {
        return false;
    }

    const rawName = typeof rawCreature.name === "string" ? rawCreature.name.trim().toLocaleLowerCase("de-DE") : "";

    if (rawName === "") {
        return false;
    }

    return demoCreatureNameSignatures.includes(rawName);
}

function getDemoActionsForCreature(creatureId) {
    const demoActions = {
        1: [
            createCreatureAction({ name: "Rapier", type: "action", attack: "+8 auf Treffer", range: "Reichweite 5 Fuß", damage: "1W8+5 Stich", description: "Nahkampfangriff mit einer Finessewaffe." }),
            createCreatureAction({ name: "Dolch", type: "action", attack: "+8 auf Treffer", range: "5 Fuß oder 20/60 Fuß", damage: "1W4+5 Stich", description: "Finesse, leicht und geworfen." }),
            createCreatureAction({ name: "Kurzbogen", type: "action", attack: "+8 auf Treffer", range: "80/320 Fuß", damage: "1W6+5 Stich", description: "Fernkampfangriff mit einer Waffe." }),
            createCreatureAction({ name: "Kampf mit zwei Waffen", type: "action", description: "Allgemeine Kampfoption, sobald Waffenwahl und Aktionsökonomie die Nebenhand erlauben." })
        ],
        2: [
            createCreatureAction({ name: "Dolch", type: "action", attack: "+4 auf Treffer", range: "5 Fuß oder 20/60 Fuß", damage: "1W4+2 Stich", description: "Einfach, Finesse, leicht und geworfen." }),
            createCreatureAction({ name: "Kampfstab", type: "action", attack: "+1 auf Treffer", range: "Reichweite 5 Fuß", damage: "1W6-1 Wucht", description: "Einfache, vielseitige Waffe." })
        ],
        3: [
            createCreatureAction({ name: "Lästiger Feger", type: "action", usageMax: 1, usageReset: "manual", usage: "Aufladung 5–6", attack: "+4 auf Treffer", range: "Reichweite 5 Fuß", damage: "1W6+2 Wucht", save: "SG 12 ST", description: "Bei einem misslungenen Rettungswurf stürzt das Ziel zu Boden." }),
            createCreatureAction({ name: "Staubstoß", type: "action", usage: "1 / Begegnung", range: "Kegel 10 Fuß", save: "SG 12 KO", description: "Betroffene Kreaturen sind bei einem misslungenen Rettungswurf bis zum Ende ihres nächsten Zuges blind." }),
            createCreatureAction({ name: "Erschreckendes Klappern", type: "action", range: "30 Fuß", save: "SG 12 WE", description: "Eine hörende Kreatur verliert bei einem misslungenen Rettungswurf ihre Reaktion bis zu Borstibalds nächstem Zug." })
        ],
        4: [
            createCreatureAction({ name: "Wurzelbiss", type: "action", attack: "+5 auf Treffer", range: "Reichweite 5 Fuß", damage: "2W6+3 Stich plus 1W6 Gift" }),
            createCreatureAction({ name: "Nebelsaft", type: "action", usageMax: 3, usageReset: "longRest", usage: "3 / Lange Rast", attack: "+5 auf Treffer", range: "30 Fuß", damage: "2W6 Gift", description: "Die Bewegungsrate des Ziels sinkt bis zum Ende seines nächsten Zuges um 10 Fuß." }),
            createCreatureAction({ name: "Kreischblüte", type: "action", usage: "1 / Begegnung", range: "15 Fuß", save: "SG 13 WE", description: "Betroffene Kreaturen sind bei einem misslungenen Rettungswurf bis zum Ende ihres nächsten Zuges verängstigt." }),
            createCreatureAction({ name: "Wurzelschlinge", type: "action", usageMax: 1, usageReset: "manual", usage: "Aufladung 5–6", range: "20 Fuß", save: "SG 13 ST", description: "Eine Kreatur am Boden ist bei einem misslungenen Rettungswurf bis zum Ende von Nebelzahns nächstem Zug festgesetzt." })
        ],
        5: [
            createCreatureAction({ name: "Funken-Schnabel", type: "action", attack: "+6 auf Treffer", range: "Reichweite 5 Fuß", damage: "1W4+4 Stich plus 1W6 Blitz" }),
            createCreatureAction({ name: "Funkenraub", type: "action", usageMax: 1, usageReset: "manual", usage: "Aufladung 6", attack: "+6 auf Treffer", range: "60 Fuß", damage: "2W6 psychisch", description: "Das Ziel kann bis zum Beginn seines nächsten Zuges keine Reaktionen einsetzen." }),
            createCreatureAction({ name: "Spiegelkrächzen", type: "action", range: "30 Fuß", save: "SG 14 WE", description: "Bei einem misslungenen Rettungswurf hat das Ziel Nachteil auf seinen nächsten Angriff vor Ende seines nächsten Zuges." }),
            createCreatureAction({ name: "Lichtflucht", type: "bonus", description: "Die Glimmerkrähe fliegt bis zur Hälfte ihrer Bewegungsrate. Von Spiegelkrächzen oder Funkenraub betroffene Kreaturen erhalten dabei keinen Gelegenheitsangriff." })
        ],
        6: [
            createCreatureAction({ name: "Eldritch Blast", type: "action", attack: "+7 auf Treffer", range: "120 Fuß", damage: "Zwei Strahlen mit je 1W10+4 Kraft" }),
            createCreatureAction({ name: "Unbewaffneter Schlag", type: "action", attack: "+2 auf Treffer", range: "Reichweite 5 Fuß", damage: "0 Wucht" })
        ],
        7: [
            createCreatureAction({ name: "Zermalmende Wurzel", type: "action", usageMax: 1, usageReset: "manual", usage: "Aufladung 5–6", attack: "+7 auf Treffer", range: "Reichweite 10 Fuß", damage: "2W10+5 Wucht", description: "Das Ziel wird gepackt." }),
            createCreatureAction({ name: "Grabsog", type: "action", usage: "1 / Begegnung", range: "Linie 15 Fuß", save: "SG 15 ST", description: "Betroffene Kreaturen werden bei einem misslungenen Rettungswurf 10 Fuß zum Koloss gezogen und stürzen zu Boden." }),
            createCreatureAction({ name: "Grabsteinschlag", type: "action", attack: "+7 auf Treffer", range: "Reichweite 5 Fuß", damage: "2W8+5 Wucht plus 1W8 nekrotisch" }),
            createCreatureAction({ name: "Moosbedecktes Brüllen", type: "action", range: "30 Fuß", damage: "1W6 psychisch", description: "Jede verängstigte oder am Boden liegende Kreatur in Reichweite erleidet den Schaden." })
        ],
        8: [
            createCreatureAction({ name: "Glasbiss", type: "action", attack: "+5 auf Treffer", range: "Reichweite 5 Fuß", damage: "1W6+3 Stich plus 1W6 psychisch" }),
            createCreatureAction({ name: "Falscher Schritt", type: "action", usageMax: 1, usageReset: "manual", usage: "Aufladung 5–6", range: "30 Fuß", save: "SG 14 IN", description: "Bei einem misslungenen Rettungswurf bewegt sich das Ziel 10 Fuß in eine vom Molch gewählte Richtung." }),
            createCreatureAction({ name: "Schimmerspucke", type: "action", attack: "+5 auf Treffer", range: "30 Fuß", damage: "2W6 psychisch", description: "Das Ziel kann bis zum Ende seines nächsten Zuges nicht von Unsichtbarkeit profitieren." }),
            createCreatureAction({ name: "Wellentausch", type: "bonus", range: "30 Fuß", description: "Der Molch tauscht den Platz mit seinem Doppelbild oder einer Spiegelung." })
        ],
        9: [
            createCreatureAction({ name: "Verborgener Dolch", type: "action", attack: "+6 auf Treffer", range: "Reichweite 5 Fuß", damage: "1W4+4 Stich", description: "Verursacht zusätzlich 1W6 Giftschaden, wenn Veyra Vorteil hatte." }),
            createCreatureAction({ name: "Erpressungsfaden", type: "action", usageMax: 3, usageReset: "charges", usage: "3 Ladungen", range: "30 Fuß", save: "SG 13 WE", description: "Bei einem misslungenen Rettungswurf hat das Ziel Nachteil auf seinen nächsten Angriff gegen Veyra oder einen ihrer Verbündeten." }),
            createCreatureAction({ name: "Im Regen verschwinden", type: "bonus", usage: "1 / Begegnung", description: "Veyra bewegt sich bis zu ihrer Bewegungsrate und versucht sich zu verstecken, selbst bei leichter Verdeckung durch Regen, Nebel oder Straßenschatten." }),
            createCreatureAction({ name: "Codierte Warnung", type: "reaction", range: "60 Fuß", trigger: "Ein sicht- oder hörbarer Verbündeter will seine Position wechseln.", description: "Der Verbündete darf sich sofort bis zu 10 Fuß bewegen, ohne Gelegenheitsangriffe auszulösen." })
        ]
    };

    return demoActions[creatureId] || [];
}

function getDemoTraitsForCreature(creatureId) {
    const demoTraits = {
        1: [
            createCreatureTrait({ name: "Ressourcen", category: "resource", description: "Hinterhältiger Angriff 4W6 · Listige Aktion · Unheimliches Ausweichen · Entrinnen · Arkane Kartenmeisterin: 4 Zauberplätze 1. Grades, 2 Zauberplätze 2. Grades" }),
            createCreatureTrait({ name: "Hinterhältiger Angriff", category: "classFeature", usageMax: 1, usageReset: "turn", usage: "1 / Zug", showAsAction: true, actionType: "special", actionSummary: "Einmal pro Zug zusätzlich 4W6 Schaden verursachen, wenn die Voraussetzungen erfüllt sind.", description: "Einmal pro Zug verursacht Miriel mit einer Finesse- oder Fernkampfwaffe 4W6 zusätzlichen Schaden, wenn sie Vorteil hat oder ein Gegner des Ziels nahe bei ihm steht und Miriel keinen Nachteil hat." }),
            createCreatureTrait({ name: "Listige Aktion", category: "classFeature", showAsAction: true, actionType: "bonus", actionSummary: "Sprinten, Rückzug oder Verstecken als Bonusaktion einsetzen.", description: "Miriel kann in jedem ihrer Züge Sprinten, Rückzug oder Verstecken als Bonusaktion einsetzen." }),
            createCreatureTrait({ name: "Unheimliches Ausweichen", category: "classFeature", showAsAction: true, actionType: "reaction", trigger: "Ein sichtbarer Angreifer trifft Miriel.", actionSummary: "Den Schaden des Angriffs halbieren.", description: "Trifft ein sichtbarer Angreifer Miriel, kann sie ihre Reaktion einsetzen, um den Schaden dieses Angriffs zu halbieren." }),
            createCreatureTrait({ name: "Arkane Fingerfertigkeit", category: "classFeature", description: "Miriel kann ihre magische Hand unsichtbar wirken lassen und damit auf Distanz kleine Gegenstände, Schlösser und Diebeswerkzeug besonders geschickt bedienen." }),
            createCreatureTrait({ name: "Entrinnen", category: "passive", description: "Bei Geschicklichkeitsrettungswürfen gegen halben Schaden erleidet Miriel bei Erfolg keinen und bei Misserfolg nur halben Schaden." }),
            createCreatureTrait({ name: "Chaosfeen-Flug", category: "species", description: "Die Flugbewegungsrate entspricht der Laufbewegungsrate." }),
            createCreatureTrait({ name: "Chaosfeen-Magie", category: "species", description: "Miriels angeborene Feenmagie wird über ihre Zauberliste verwaltet; begrenzte Anwendungen werden dort gesondert erfasst." })
        ],
        2: [
            createCreatureTrait({ name: "Ressourcen", category: "resource", description: "Arkane Erholung 1/LR · Arkane Schreibfeder · Erwachtes Zauberbuch · Schlangenmagie" }),
            createCreatureTrait({ name: "Arkane Schreibfeder", category: "classFeature", showAsAction: true, actionType: "bonus", actionSummary: "Eine magische Schreibfeder in Suicas freier Hand erscheinen lassen.", description: "Suica ruft mit einer Bonusaktion eine tintenlose Feder hervor. Sie erleichtert das Übertragen arkaner Formeln und kann eigene Schriftzeichen in kurzer Entfernung wieder auslöschen." }),
            createCreatureTrait({ name: "Arkane Erholung", category: "classFeature", usageMax: 1, usageReset: "longRest", usage: "1 / Lange Rast", showAsAction: true, actionType: "special", actionSummary: "Nach einer kurzen Rast verbrauchte Zauberplätze mit insgesamt bis zu zwei Zaubergraden zurückgewinnen.", description: "Einmal pro langer Rast kann Suica nach einer kurzen Rast verbrauchte Zauberplätze zurückgewinnen, deren addierte Grade höchstens zwei betragen." }),
            createCreatureTrait({ name: "Erwachtes Zauberbuch: Ritualfokus", category: "classFeature", usageMax: 1, usageReset: "longRest", usage: "1 / Lange Rast", showAsAction: true, actionType: "special", actionSummary: "Ein vorbereitetes Ritual ohne zusätzliche Ritualzeit wirken.", description: "Solange Suica ihr Erwachtes Zauberbuch hält, kann sie einmal pro langer Rast ein vorbereitetes Ritual in dessen normaler Wirkzeit vollenden." }),
            createCreatureTrait({ name: "Magieresistenz", category: "species", description: "Vorteil auf Rettungswürfe gegen Zauber." }),
            createCreatureTrait({ name: "Giftresistenz", category: "species", description: "Resistenz gegen Giftschaden sowie Vorteil auf Rettungswürfe, um Vergiftung zu vermeiden oder zu beenden." }),
            createCreatureTrait({ name: "Gelehrte", category: "classFeature", description: "Suica verdoppelt ihren Übungsbonus bei einer beherrschten Wissensfertigkeit; in der Demo gilt dies für Nachforschungen." }),
            createCreatureTrait({ name: "Schlangenmagie", category: "species", description: "Suicas angeborene Magie wird über ihre Zauberliste verwaltet und umfasst giftige, tierbezogene und beeinflussende Effekte." })
        ],
        3: [
            createCreatureTrait({ name: "Täuschend echter Gegenstand", category: "monsterTrait", description: "Solange Borstibald reglos bleibt, ist er nicht von einem gewöhnlichen Besen zu unterscheiden, bis er sich bewegt oder angreift." }),
            createCreatureTrait({ name: "Staubiger Zorn", category: "monsterTrait", usageMax: 1, usageReset: "encounter", usage: "1 / Begegnung", showAsAction: true, actionType: "special", trigger: "Borstibald erleidet in einer Begegnung zum ersten Mal Schaden.", actionSummary: "Kreaturen im Umkreis von 10 Fuß haben bis zum Rundenende Nachteil auf ihre nächste Wahrnehmungsprobe.", description: "Wenn Borstibald in einer Begegnung erstmals Schaden erleidet, wirbelt er eine Staubwolke auf. Jede Kreatur im Umkreis von 10 Fuß hat bis zum Ende der Runde Nachteil auf ihre nächste Wahrnehmungsprobe." }),
            createCreatureTrait({ name: "Schwebender Hausplagegeist", category: "passive", description: "Borstibald ignoriert schwieriges Gelände, das durch Gerümpel, Möbel, verschüttete Flüssigkeiten oder lose Trümmer entsteht." })
        ],
        4: [
            createCreatureTrait({ name: "Verwurzelter Lauerjäger", category: "monsterTrait", description: "Nebelzahn hat Vorteil auf Heimlichkeitsproben, solange er teilweise in Erde, Nebel oder Laub verborgen ist." }),
            createCreatureTrait({ name: "Nebelgenährte Haut", category: "monsterTrait", description: "In Nebel, dämmrigem Licht oder dichter Vegetation erhält Nebelzahn +2 Rüstungsklasse gegen Fernkampfangriffe." }),
            createCreatureTrait({ name: "Witterung warmen Blutes", category: "monsterTrait", description: "Nebelzahn kennt die Richtung jeder verletzten Kreatur im Umkreis von 30 Fuß, die den Boden berührt." })
        ],
        5: [
            createCreatureTrait({ name: "Spiegelfeder", category: "monsterTrait", usageMax: 2, usageReset: "encounter", usage: "2 / Begegnung", showAsAction: true, actionType: "reaction", trigger: "Eine Kreatur verfehlt die Glimmerkrähe mit einem Angriff.", actionSummary: "Eine falsche Spiegelung aufblitzen lassen und sich 10 Fuß ohne Gelegenheitsangriffe bewegen.", description: "Bis zu zweimal pro Begegnung kann die Glimmerkrähe nach einem verfehlten Angriff eine falsche Spiegelung aufblitzen lassen und sich 10 Fuß bewegen, ohne Gelegenheitsangriffe auszulösen." }),
            createCreatureTrait({ name: "Gedankenraub", category: "monsterTrait", description: "Eine von Funkenraub getroffene Kreatur kann bis zum Beginn ihres nächsten Zuges keine Reaktionen einsetzen." }),
            createCreatureTrait({ name: "Glänzendes Omen", category: "monsterTrait", description: "Die Glimmerkrähe hat Vorteil auf Proben, um magische Gegenstände, spiegelnde Flächen und verborgenen Schmuck zu entdecken." })
        ],
        6: [
            createCreatureTrait({ name: "Ressourcen", category: "resource", description: "Zaubereipunkte 5 · Metamagie: Verstärkt, Beschleunigt · Fluch der Schattenklinge 1/SR · Gunst des Schicksals 1/SR · Heilende Berührung 1/LR · Sternenbrand 1/LR" }),
            createCreatureTrait({ name: "Heilende Berührung", category: "species", usageMax: 1, usageReset: "longRest", usage: "1 / Lange Rast", showAsAction: true, actionType: "action", actionSummary: "Eine berührte Kreatur mit Sternenlicht heilen.", description: "Liora kanalisiert mit einer Aktion sanftes Sternenlicht durch ihre Hände. Die berührte Kreatur erhält eine Anzahl W4 Heilung in Höhe von Lioras Übungsbonus." }),
            createCreatureTrait({ name: "Fluch der Schattenklinge", category: "classFeature", usageMax: 1, usageReset: "shortRest", usage: "1 / Kurze Rast", showAsAction: true, actionType: "bonus", range: "30 Fuß", actionSummary: "Eine sichtbare Kreatur eine Minute lang mit dem Mal der Schattenklinge belegen.", description: "Liora markiert mit einer Bonusaktion eine sichtbare Kreatur in 30 Fuß Reichweite. Gegen das markierte Ziel verursacht sie 3 zusätzlichen Schaden, erzielt bereits bei 19–20 einen kritischen Treffer und gewinnt 7 HP zurück, falls das Ziel fällt." }),
            createCreatureTrait({ name: "Quelle der Magie: Zauberplatz erschaffen", category: "classFeature", showAsAction: true, actionType: "bonus", actionSummary: "Zaubereipunkte ausgeben, um einen Zauberplatz zu erschaffen.", description: "Liora kann als Bonusaktion 2, 3 oder 5 Zaubereipunkte ausgeben, um einen Zauberplatz des 1., 2. oder 3. Grades zu erschaffen." }),
            createCreatureTrait({ name: "Beschleunigter Zauber", category: "classFeature", showAsAction: true, actionType: "bonus", actionSummary: "Zwei Zaubereipunkte ausgeben, um einen geeigneten Zauber als Bonusaktion zu wirken.", description: "Liora gibt zwei Zaubereipunkte aus und ändert die Wirkzeit eines geeigneten Zaubers für diesen Einsatz von einer Aktion zu einer Bonusaktion." }),
            createCreatureTrait({ name: "Gunst des Schicksals", category: "classFeature", usageMax: 1, usageReset: "shortRest", usage: "1 / Kurze Rast", showAsAction: true, actionType: "special", trigger: "Liora verfehlt einen Angriff oder misslingt bei einem Rettungswurf.", actionSummary: "2W4 auf das Ergebnis addieren und das Schicksal möglicherweise wenden.", description: "Einmal pro kurzer Rast kann Liora nach einem verfehlten Angriff oder misslungenen Rettungswurf 2W4 auf das Ergebnis addieren." }),
            createCreatureTrait({ name: "Sternenbrand", category: "species", usageMax: 1, usageReset: "longRest", usage: "1 / Lange Rast", showAsAction: true, actionType: "bonus", actionSummary: "Für eine Minute eine brennende Sternenaura entfesseln.", description: "Einmal pro langer Rast entfesselt Liora mit einer Bonusaktion für eine Minute ihre instabile Sternenkraft." }),
            createCreatureTrait({ name: "Arkane Reserve", category: "classFeature", usageMax: 1, usageReset: "longRest", usage: "1 / Lange Rast", showAsAction: true, actionType: "special", actionSummary: "Ein einminütiges Ritual stellt einen verbrauchten Pakt-Zauberplatz wieder her.", description: "Einmal pro langer Rast kann Liora ein einminütiges Ritual vollziehen und dadurch bis zu einen verbrauchten Pakt-Zauberplatz zurückgewinnen." }),
            createCreatureTrait({ name: "Sternenblut-Resistenz", category: "species", description: "Liora besitzt Resistenz gegen nekrotischen und gleißenden Schaden." }),
            createCreatureTrait({ name: "Unbeugsame Konzentration", category: "classFeature", description: "Liora hat Vorteil auf Konstitutionsrettungswürfe, mit denen sie ihre Konzentration aufrechterhält." }),
            createCreatureTrait({ name: "Gefechtsmagierin", category: "feat", description: "Liora kann Zauber auch mit Waffe oder Schild sicher wirken und geeignete Zauber für Gelegenheitsangriffe einsetzen." }),
            createCreatureTrait({ name: "Schattenklingen-Bindung", category: "classFeature", description: "Nach einer langen Rast bindet Liora eine geeignete Waffe an ihren Pakt und verwendet für Angriffe mit ihr ihr Charisma. Außerdem beherrscht sie mittelschwere Rüstungen, Schilde und Kriegswaffen." }),
            createCreatureTrait({ name: "Qualvoller Strahl", category: "classFeature", description: "Liora addiert ihren Charismamodifikator zum Schaden ihres unheimlichen Strahls." }),
            createCreatureTrait({ name: "Zurückstoßender Strahl", category: "classFeature", description: "Trifft Lioras unheimlicher Strahl eine große oder kleinere Kreatur, kann er sie bis zu 10 Fuß von ihr wegstoßen." })
        ],
        7: [
            createCreatureTrait({ name: "Grabmoos-Regeneration", category: "monsterTrait", showAsAction: true, actionType: "special", actionSummary: "Zu Beginn seines Zuges 10 Trefferpunkte zurückgewinnen, sofern seit dem letzten Zug kein Feuerschaden erlitten wurde.", description: "Steht der Koloss auf Erde oder Stein, gewinnt er zu Beginn seines Zuges 10 Trefferpunkte zurück, sofern er seit seinem letzten Zug keinen Feuerschaden erlitten hat." }),
            createCreatureTrait({ name: "Massiger Körper", category: "monsterTrait", description: "Der Koloss hat Vorteil auf Rettungswürfe dagegen, bewegt, zu Boden geworfen oder von Kreaturen unterhalb der Größenkategorie riesig gepackt zu werden." }),
            createCreatureTrait({ name: "Anker des Gräberfelds", category: "monsterTrait", description: "Schwieriges Gelände aus Wurzeln, Geröll oder Gräbern kostet den Koloss keine zusätzliche Bewegung." })
        ],
        8: [
            createCreatureTrait({ name: "Spiegelnde Haut", category: "monsterTrait", usageMax: 2, usageReset: "encounter", usage: "2 / Begegnung", showAsAction: true, actionType: "reaction", trigger: "Ein Zauberangriff verfehlt den Molch.", actionSummary: "Einen harmlosen Schimmer auf eine Kreatur im Umkreis von 10 Fuß umlenken; sie hat Nachteil auf ihre nächste Wahrnehmungsprobe.", description: "Bis zu zweimal pro Begegnung kann der Molch nach einem verfehlten Zauberangriff einen harmlosen Schimmer auf eine andere Kreatur im Umkreis von 10 Fuß lenken. Diese hat Nachteil auf ihre nächste Wahrnehmungsprobe." }),
            createCreatureTrait({ name: "Flackerndes Doppelbild", category: "monsterTrait", usageMax: 1, usageReset: "longRest", usage: "1 / Lange Rast", showAsAction: true, actionType: "special", actionSummary: "Ein Trugbild erschaffen, das bis zu seinem ersten Treffer bestehen bleibt.", description: "Einmal pro langer Rast erschafft der Molch ein Trugbild seiner selbst. Es verschwindet, sobald es von einem Angriff getroffen wird." }),
            createCreatureTrait({ name: "Spiegelsinn", category: "monsterTrait", description: "Der Molch kennt den Standort von Kreaturen im Umkreis von 30 Fuß, die sich in stillem Wasser, poliertem Metall oder Glas spiegeln." })
        ],
        9: [
            createCreatureTrait({ name: "Netz geheimer Ablagen", category: "npc", usageMax: 2, usageReset: "longRest", usage: "2 / Lange Rast", showAsAction: true, actionType: "special", actionSummary: "Den wahrscheinlichen Ablageort einer Nachricht, eines Schlüssels oder kleiner Schmuggelware in der Nähe kennen.", description: "Zweimal pro langer Rast kann Veyra glaubhaft den Ort kennen, an dem in der Nähe eine Nachricht, ein Schlüssel oder ein kleiner Schmuggelgegenstand verborgen wurde." }),
            createCreatureTrait({ name: "Geist der Menge", category: "npc", description: "Veyra kann versuchen, sich zu verstecken, wenn Regen, Nebel, Menschenmengen oder aufgehängte Wäsche sie leicht verdecken." }),
            createCreatureTrait({ name: "Instinkt der Informantin", category: "npc", description: "Veyra hat Vorteil auf Motiv-erkennen-Proben, um Lügen über Namen, Wege oder Zugehörigkeiten zu durchschauen." })
        ]
    };

    return demoTraits[creatureId] || [];
}

function applySpellOverride(spellcasting, spellName, overrides) {
    const lowerName = getSafeOptionalString(spellName).toLowerCase();
    const spell = spellcasting.spells.find(function(item) { return item.name.toLowerCase() === lowerName; });

    if (spell !== undefined) {
        Object.assign(spell, overrides);
    }
}

function getDemoSpellcastingForCreature(creature) {
    const spellcasting = createDefaultSpellcasting(creature);
    spellcasting.spells = parseLegacySpellsText(creature.demoSpellSeed);
    applyLegacySlotHints(spellcasting, { spellsText: creature.demoSpellSeed, spellSaveDc: creature.spellSaveDc });

    if (creature.id === 1) {
        applySpellOverride(spellcasting, "Chaossplitter", { castingTime: "1 Reaktion", range: "60 ft.", showAsAction: true, actionType: "reaction" });
        applySpellOverride(spellcasting, "Faerie Fire", { castingTime: "1 Aktion", range: "60 ft.", concentration: true, usageMax: 1, usageReset: "longRest", showAsAction: true, actionType: "action" });
        applySpellOverride(spellcasting, "Enlarge/Reduce", { castingTime: "1 Aktion", range: "30 Fuß", concentration: true, usageMax: 1, usageReset: "longRest", showAsAction: true, actionType: "action" });
    }

    if (creature.id === 2) {
        applySpellOverride(spellcasting, "Shield", { castingTime: "1 Reaktion", showAsAction: true, actionType: "reaction" });
        applySpellOverride(spellcasting, "Suggestion", { castingTime: "1 Aktion", range: "30 Fuß", concentration: true, usageMax: 1, usageReset: "longRest", showAsAction: true, actionType: "action" });
    }

    if (creature.id === 6) {
        applySpellOverride(spellcasting, "Elementarschild", { castingTime: "1 Reaktion", showAsAction: true, actionType: "reaction" });
        applySpellOverride(spellcasting, "Shield", { castingTime: "1 Reaktion", showAsAction: true, actionType: "reaction" });
        applySpellOverride(spellcasting, "Healing Word", { castingTime: "1 Bonusaktion", range: "60 ft.", showAsAction: true, actionType: "bonus" });
        applySpellOverride(spellcasting, "Hex", { castingTime: "1 Bonusaktion", range: "90 ft.", concentration: true, showAsAction: true, actionType: "bonus" });
        applySpellOverride(spellcasting, "Misty Step", { castingTime: "1 Bonusaktion", range: "Selbst", showAsAction: true, actionType: "bonus" });
        applySpellOverride(spellcasting, "Counterspell", { castingTime: "1 Reaktion", range: "60 ft.", showAsAction: true, actionType: "reaction" });
    }

    return spellcasting;
}

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

let currentTurnIndex = 0;
let roundNumber = 1;
let isEncounterStarted = false;

let manuallySelectedPublicCardId = null;

let publicPreviewTouchStartX = null;
let publicPreviewTouchStartY = null;

let publicPreviewWheelIsCoolingDown = false;

let combatLogMessages = [];

let editingCreatureId = null;
let focusedCreatureId = null;
let pendingDmFocusTransition = null;
let activeDmFocusTransitionCleanup = null;
let activeDetailTab = "values";
let activeDmFeedTab = "log";
let expandedSpellDetailKey = null;
let activeForgeSpellEditor = null;
let activeForgeActionEditor = null;
let activeForgeTraitEditor = null;
let suppressCardForgeClickAwayOnce = false;
let mirielBoardManualImageData = "";
let mirielBoardManualImageName = "";
let mirielBoardManualText = "";
let mirielBoardManualTextSize = "normal";
let mirielBoardManualTextPosition = "bottom";
let mirielBoardPersistentMode = "off";
let isMirielBoardAutoTurnEnabled = false;
let mirielBoardDurationMode = "normal";
let isMirielBoardNewRoundCallEnabled = true;
let mirielBoardTriggerId = "";
let mirielBoardAnnouncement = null;
let lastRenderedMirielBoardTriggerId = "";
let mirielBoardAutoHideTimer = null;
let shouldAnimateMirielBoardOnNextRender = false;
let lastRenderedMirielBoardPersistentMode = null;
let publicStageAccentTimer = null;
let publicStageSequenceTimer = null;
let publicStagePresentedCreatureId = null;
let publicStagePendingCreatureId = null;
let publicRibbonPresentedFirstCreatureId = null;

// ============================================================
// 2. Ansichtsmodus, Browser-Speicher und Tab-Synchronisation
// ============================================================

function getAppViewFromUrl() {
    const urlParameters = new URLSearchParams(window.location.search);
    const viewParameter = urlParameters.get("view");

    if (viewParameter === "player") {
        return "player";
    }

    return "dm";
}

function openAppView(viewName) {
    const targetUrl = new URL(window.location.href);

    if (viewName === "player") {
        targetUrl.searchParams.set("view", "player");
    } else {
        targetUrl.searchParams.set("view", "dm");
    }

    window.open(targetUrl.toString(), "_blank");
}

function applyAppViewToPage() {
    if (appView === "player") {
        document.body.classList.add("player-view");
        document.body.classList.remove("dm-view");
    } else {
        document.body.classList.add("dm-view");
        document.body.classList.remove("player-view");
    }

    const kickerElement = document.querySelector("#app-view-kicker");

    if (kickerElement !== null) {
        kickerElement.textContent = appView === "player"
            ? "Spieltisch-Anzeige"
            : "Spielleiter-Ansicht";
    }

    const dmButtonElement = document.querySelector("#open-dm-view-button");
    const playerButtonElement = document.querySelector("#open-player-view-button");

    if (dmButtonElement !== null) {
        dmButtonElement.hidden = appView === "dm";
        dmButtonElement.classList.toggle("active-view-button", appView === "dm");
        dmButtonElement.textContent = "Spielleiter-Ansicht öffnen";
    }

    if (playerButtonElement !== null) {
        playerButtonElement.hidden = appView === "player";
        playerButtonElement.classList.toggle("active-view-button", appView === "player");
        playerButtonElement.textContent = "Spieltisch-Anzeige öffnen";
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
    encounterName = getSafeEncounterName(rawName);
    renderEncounterNameDisplay();

    if (options.silent !== true) {
        addCombatLogMessage(`Encounter benannt: ${encounterName}.`);
        saveAndBroadcastAppState();
    }
}

function renameEncounter() {
    const inputName = prompt(
        "Encounter benennen. Sonderzeichen werden beim Export im Dateinamen automatisch vereinfacht.",
        getSafeEncounterName(encounterName)
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
    const safeName = getSafeEncounterName(encounterName);

    for (const nameElement of nameElements) {
        nameElement.textContent = safeName;
    }
}

function createPersistentAppState() {
    return {
        formatName: "Miriel's Deck of Encounters Local State",
        formatVersion: 2,
        savedAt: new Date().toISOString(),
        demoCardsAutoloadEnabled: demoCardsAutoloadEnabled,
        encounter: {
            encounterName: encounterName,
            roundNumber: roundNumber,
            currentTurnIndex: currentTurnIndex,
            isEncounterStarted: isEncounterStarted,
            encounterStartGateVersion: 2,
            mirielBoardAutomationDefaultsVersion: mirielBoardAutomationDefaultsVersion,
            manuallySelectedPublicCardId: manuallySelectedPublicCardId,
            focusedCreatureId: focusedCreatureId,
            activeDetailTab: activeDetailTab,
            activeDmFeedTab: activeDmFeedTab,
            expandedSpellDetailKey: expandedSpellDetailKey,
            combatLogMessages: combatLogMessages,
            mirielBoardManualImageData: mirielBoardManualImageData,
            mirielBoardManualImageName: mirielBoardManualImageName,
            mirielBoardManualText: mirielBoardManualText,
            mirielBoardManualTextSize: mirielBoardManualTextSize,
            mirielBoardManualTextPosition: mirielBoardManualTextPosition,
            mirielBoardPersistentMode: mirielBoardPersistentMode,
            isMirielBoardAutoTurnEnabled: isMirielBoardAutoTurnEnabled,
            mirielBoardDurationMode: mirielBoardDurationMode,
            isMirielBoardNewRoundCallEnabled: isMirielBoardNewRoundCallEnabled,
            mirielBoardTriggerId: mirielBoardTriggerId,
            mirielBoardAnnouncement: mirielBoardAnnouncement,
            creatures: creatures
        }
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
        type: "encounter-state-changed"
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

        if (savedState.formatVersion !== 2) {
            updateStorageStatus("Browser-Speicher: veraltet – bitte zurücksetzen");
            return false;
        }

        if (typeof savedState.demoCardsAutoloadEnabled === "boolean") {
            setDemoCardsAutoloadEnabled(savedState.demoCardsAutoloadEnabled);
        }

        applyImportedEncounterState(savedState);

        if (shouldAutoloadDemoCards() === true && creatures.length === 0) {
            creatures = createDemoCreatures();
            encounterName = demoEncounterName;
            focusedCreatureId = null;
            resetEncounterStartGateState({ clearLog: true });
            isMirielBoardAutoTurnEnabled = false;
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

function applyImportedEncounterState(importData) {
    const encounterData = getEncounterDataFromImport(importData);

    if (encounterData === null) {
        return;
    }

    encounterName = getSafeEncounterName(encounterData.encounterName);

    const importedCreatures = createImportedCreatures(encounterData.creatures);
    creatures = importedCreatures;
    roundNumber = getSafePositiveInteger(encounterData.roundNumber, 1);
    currentTurnIndex = getSafeNonNegativeInteger(encounterData.currentTurnIndex, 0);
    isEncounterStarted = encounterData.isEncounterStarted === true;

    if (isImportedPublicSelectionValid(encounterData.manuallySelectedPublicCardId, creatures)) {
        manuallySelectedPublicCardId = Number(encounterData.manuallySelectedPublicCardId);
    } else {
        clearManualPublicSelection();
    }

    if (isImportedPublicSelectionValid(encounterData.focusedCreatureId, creatures)) {
        focusedCreatureId = Number(encounterData.focusedCreatureId);
    } else {
        focusedCreatureId = null;
    }

    activeDetailTab = getSafeDetailTab(encounterData.activeDetailTab);
    activeDmFeedTab = getSafeDmFeedTab(encounterData.activeDmFeedTab);
    expandedSpellDetailKey = getSafeOptionalString(encounterData.expandedSpellDetailKey);

    combatLogMessages = getSafeCombatLogMessages(encounterData.combatLogMessages);
    mirielBoardManualImageData = getSafeString(encounterData.mirielBoardManualImageData, "");
    mirielBoardManualImageName = getSafeString(encounterData.mirielBoardManualImageName, "");
    mirielBoardManualText = getSafeString(encounterData.mirielBoardManualText, "");
    mirielBoardManualTextSize = getSafeMirielBoardManualTextSize(encounterData.mirielBoardManualTextSize);
    mirielBoardManualTextPosition = getSafeMirielBoardManualTextPosition(encounterData.mirielBoardManualTextPosition);
    mirielBoardPersistentMode = getSafeMirielBoardPersistentModeFromEncounter(encounterData);
    isMirielBoardAutoTurnEnabled = encounterData.isMirielBoardAutoTurnEnabled === true;
    mirielBoardDurationMode = getSafeMirielBoardDurationMode(encounterData.mirielBoardDurationMode);
    isMirielBoardNewRoundCallEnabled = encounterData.isMirielBoardNewRoundCallEnabled !== false;
    mirielBoardTriggerId = getSafeOptionalString(encounterData.mirielBoardTriggerId);
    mirielBoardAnnouncement = getSafeMirielBoardAnnouncement(encounterData.mirielBoardAnnouncement);

    const handCards = getHandCards();
    ensureCurrentTurnIndexIsValid(handCards);
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
            if (event.data === null || event.data.type !== "encounter-state-changed") {
                return;
            }

            if (appView === "player") {
                applyExternalAppStateAndRender();
            }
        });
    }

    window.addEventListener("storage", function(event) {
        if (event.key !== appStorageKey) {
            return;
        }

        if (appView === "player") {
            applyExternalAppStateAndRender();
        }
    });
}

function setupPlayerViewPolling() {
    if (appView !== "player") {
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
        alert("Der aktuelle Zustand wurde im Browser dieses Geräts gespeichert. Für Backups oder den Wechsel auf ein anderes Gerät nutze „Encounter exportieren“.");
        return;
    }

    alert("Der aktuelle Zustand konnte nicht im Browser gespeichert werden. Für Backups nutze bitte „Encounter exportieren“.");
}

function reloadDemoCards() {
    const shouldReloadDemoCards = confirm(
        "Demo-Karten laden? Der aktuelle Zustand wird durch die Demo-Karten ersetzt."
    );

    if (shouldReloadDemoCards === false) {
        return;
    }

    setDemoCardsAutoloadEnabled(true);
    creatures = createDemoCreatures();
    encounterName = demoEncounterName;
    focusedCreatureId = null;
    resetEncounterStartGateState({ clearLog: true });
    isMirielBoardAutoTurnEnabled = false;
    addCombatLogMessage("Demo-Karten geladen.");

    renderCards();
    saveAndBroadcastAppState();

    alert("Die Demo-Karten wurden geladen.");
}

function isDemoCreature(creature) {
    return creature !== null && typeof creature === "object" && (creature.isDemoCard === true || isKnownDemoCreatureData(creature) === true);
}

function removeDemoCards() {
    const demoCards = creatures.filter(isDemoCreature);

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

    const removedIds = demoCards.map(function(creature) {
        return creature.id;
    });

    setDemoCardsAutoloadEnabled(false);
    creatures = creatures.filter(function(creature) {
        return isDemoCreature(creature) === false;
    });

    if (focusedCreatureId !== null && removedIds.includes(focusedCreatureId) === true) {
        focusedCreatureId = null;
    }

    if (manuallySelectedPublicCardId !== null && removedIds.includes(manuallySelectedPublicCardId) === true) {
        clearManualPublicSelection();
    }

    resetEncounterStartGateState({ resetTurn: true });
    focusedCreatureId = null;
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

function isCreatureInTurnOrder(creature) {
    return creature !== null
        && creature !== undefined
        && creature.isInCombat === true
        && creature.isInitiativeActive !== false;
}

function getInitiativeCards(handCards = getHandCards()) {
    return handCards.filter(function(creature) {
        return isCreatureInTurnOrder(creature);
    });
}

function isCreatureOutOfAction(creature) {
    return creature !== null
        && creature !== undefined
        && (getSafeNonNegativeInteger(creature.hp, 0) === 0 || creature.isInitiativeActive === false);
}

function createOutOfActionStampHtml(entity) {
    if (entity === null || entity === undefined || entity.isOutOfAction === false) {
        return "";
    }

    const isOutOfAction = entity.isOutOfAction === true || isCreatureOutOfAction(entity);

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

function normalizeDeckSearchText(value) {
    return getSafeOptionalString(value).toLocaleLowerCase("de-DE");
}

function getCreatureDeckSearchText(creature) {
    const traitText = getCreatureTraits(creature).map(function(trait) {
        return `${trait.name} ${trait.description}`;
    }).join(" ");
    const actionText = getCreatureActions(creature).map(function(action) {
        return `${action.name} ${action.description} ${action.attack} ${action.save} ${action.range} ${action.damage}`;
    }).join(" ");
    const spellText = getCreatureSpellcasting(creature).spells.map(function(spell) {
        return `${spell.name} ${spell.description} ${spell.notes}`;
    }).join(" ");
    const inventory = getInventoryData(creature);
    const inventoryText = [
        ...inventory.cards.map(function(item) { return `${item.name} ${item.description} ${item.effect}`; }),
        ...inventory.list.map(function(item) { return `${item.name} ${item.description} ${item.notes}`; })
    ].join(" ");
    const searchableParts = [
        creature.name,
        creature.publicName,
        creature.type,
        traitText,
        actionText,
        spellText,
        creature.notes,
        inventoryText
    ];

    return normalizeDeckSearchText(searchableParts.join(" "));
}

function doesCreatureMatchDeckSearch(creature) {
    const normalizedQuery = normalizeDeckSearchText(deckSearchQuery);

    if (normalizedQuery === "") {
        return true;
    }

    const queryTokens = normalizedQuery.split(/\s+/).filter(function(token) {
        return token !== "";
    });

    const searchableText = getCreatureDeckSearchText(creature);

    return queryTokens.every(function(token) {
        return searchableText.includes(token);
    });
}

function doesCreatureMatchDeckTypeFilter(creature) {
    if (deckTypeFilter === "all") {
        return true;
    }

    return creature.type === deckTypeFilter;
}

function sortDeckCardsForWorkbench(deckCards) {
    deckCards.sort(function(a, b) {
        if (deckSortMode === "type") {
            const typeDifference = getTypeSortValue(a.type) - getTypeSortValue(b.type);

            if (typeDifference !== 0) {
                return typeDifference;
            }
        }

        if (deckSortMode === "initiativeModifier") {
            const modifierDifference = getCreatureInitiativeModifier(b) - getCreatureInitiativeModifier(a);

            if (modifierDifference !== 0) {
                return modifierDifference;
            }
        }

        if (deckSortMode === "hp") {
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
    const visibleDeckCards = deckCards.filter(function(creature) {
        return doesCreatureMatchDeckTypeFilter(creature) && doesCreatureMatchDeckSearch(creature);
    });

    return sortDeckCardsForWorkbench(visibleDeckCards);
}


// ============================================================
// 3. Fokuskarte und Detail-Tabs
// ============================================================

function getFocusedCard(handCards, activeCard) {
    if (focusedCreatureId !== null) {
        const focusedCard = findCreatureById(focusedCreatureId);

        if (focusedCard !== null) {
            return focusedCard;
        }

        focusedCreatureId = null;
    }

    if (activeCard !== null) {
        focusedCreatureId = activeCard.id;
        return activeCard;
    }

    if (handCards.length > 0) {
        focusedCreatureId = handCards[0].id;
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

function getDmFocusTransitionDirection(previousCreatureId, nextCreatureId, explicitDirection = null) {
    if (explicitDirection === "next") {
        return 1;
    }

    if (explicitDirection === "previous") {
        return -1;
    }

    const handCards = getHandCards();

    if (handCards.length < 2 || previousCreatureId === null || nextCreatureId === null || previousCreatureId === nextCreatureId) {
        return 1;
    }

    const previousIndex = handCards.findIndex(function(card) {
        return card.id === previousCreatureId;
    });
    const nextIndex = handCards.findIndex(function(card) {
        return card.id === nextCreatureId;
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

function prepareDmFocusTransition(nextCreatureId, explicitDirection = null) {
    if (appView !== "dm" || isApplyingExternalState === true) {
        pendingDmFocusTransition = null;
        return;
    }

    if (typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches === true) {
        pendingDmFocusTransition = null;
        return;
    }

    const previousFocusedCard = getCurrentDmFocusedHandCard();

    if (previousFocusedCard === null || previousFocusedCard.id === nextCreatureId) {
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
        previousCreatureId: previousFocusedCard.id,
        nextCreatureId: nextCreatureId,
        direction: getDmFocusTransitionDirection(previousFocusedCard.id, nextCreatureId, explicitDirection),
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

function setFocusedCreature(creatureId) {
    const creature = findCreatureById(creatureId);

    if (creature === null || creature.isInCombat !== true) {
        return;
    }

    prepareDmFocusTransition(creatureId);
    focusedCreatureId = creatureId;
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

function setFocusedDeckCreature(creatureId) {
    const creature = findCreatureById(creatureId);

    if (creature === null || creature.isInCombat === true) {
        return;
    }

    focusedCreatureId = creatureId;
    renderCards();

    requestAnimationFrame(function() {
        scrollToActiveHandView();
    });
}

function getDefaultFocusedHandCreatureId() {
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

function showDeckCardFromFocus(creatureId) {
    const creature = findCreatureById(creatureId);

    if (creature === null || creature.isInCombat === true) {
        return;
    }

    if (focusedCreatureId === creatureId) {
        focusedCreatureId = getDefaultFocusedHandCreatureId();
    }

    renderCards();

    requestAnimationFrame(function() {
        scrollToDeckCard(creatureId, true);
    });
}

function scrollToDeckCard(creatureId, highlightCard) {
    const deckElement = document.querySelector(".deck-workbench");
    const cardElement = document.querySelector(`[data-deck-card-id="${creatureId}"]`);

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

function focusActiveCreature() {
    const activeCard = getActiveCard(getHandCards());

    if (activeCard === null) {
        return;
    }

    prepareDmFocusTransition(activeCard.id);
    focusedCreatureId = activeCard.id;
    renderCardsPreservingViewport();
}

function setActiveDetailTab(tabName) {
    activeDetailTab = getSafeDetailTab(tabName);

    if (activeDetailTab !== "spells") {
        expandedSpellDetailKey = null;
    }

    preserveViewportWhileRendering(function() {
        renderCards();
    });
}

function setActiveDmFeedTab(tabName) {
    activeDmFeedTab = getSafeDmFeedTab(tabName);
    renderCards();
}

function focusAdjacentHandCreature(direction) {
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

    const nextFocusedCreatureId = handCards[focusedIndex].id;
    prepareDmFocusTransition(nextFocusedCreatureId, direction);
    focusedCreatureId = nextFocusedCreatureId;
    preserveViewportWhileRendering(function() {
        renderCards();
    });
}

// ============================================================
// 3. Öffentliche Auswahl-Helfer
// ============================================================

function hasManualPublicSelection() {
    return manuallySelectedPublicCardId !== null;
}

function shouldPublicPreviewFollowActiveCard() {
    return manuallySelectedPublicCardId === null;
}

function isCreatureManuallySelected(creature) {
    return hasManualPublicSelection() && creature.id === manuallySelectedPublicCardId;
}

function isPublicCardManuallySelected(publicCard) {
    return hasManualPublicSelection() && publicCard.id === manuallySelectedPublicCardId;
}

function clearManualPublicSelection() {
    manuallySelectedPublicCardId = null;
}

function toggleCreatureTurnOrder(creatureId) {
    const creature = findCreatureById(creatureId);

    if (creature === null || creature.isInCombat !== true) {
        return;
    }

    const wasInTurnOrder = creature.isInitiativeActive !== false;
    const activeCardBeforeChange = getActiveCard(getHandCards());
    const activeCardIdBeforeChange = activeCardBeforeChange !== null ? activeCardBeforeChange.id : null;

    creature.isInitiativeActive = wasInTurnOrder !== true;

    if (creature.isInitiativeActive === false) {
        creature.isSelected = false;
        addCombatLogMessage(`${creature.name} wurde aus der Zugfolge genommen.`);
    } else {
        addCombatLogMessage(`${creature.name} wurde wieder in die Zugfolge aufgenommen.`);
    }

    const initiativeCards = getInitiativeCards();

    if (initiativeCards.length === 0) {
        currentTurnIndex = 0;
    } else if (activeCardIdBeforeChange !== null && activeCardIdBeforeChange !== creature.id) {
        const retainedActiveIndex = initiativeCards.findIndex(function(card) {
            return card.id === activeCardIdBeforeChange;
        });
        currentTurnIndex = retainedActiveIndex >= 0 ? retainedActiveIndex : Math.min(currentTurnIndex, initiativeCards.length - 1);
    } else {
        currentTurnIndex = Math.min(currentTurnIndex, initiativeCards.length - 1);
    }

    clearManualPublicSelection();
    saveAndBroadcastAppState();
    renderCardsPreservingViewport();
}

// ============================================================
// 3b. DM-Zielauswahl für spätere AOE-Aktionen
// ============================================================

function getSelectedHandCards() {
    return getHandCards().filter(function(creature) {
        return creature.isSelected === true;
    });
}

function getSelectedDeckCards() {
    return getDeckCards().filter(function(creature) {
        return creature.isSelected === true;
    });
}

function getSelectedHandCardCount() {
    return getSelectedHandCards().length;
}

function getSelectedDeckCardCount() {
    return getSelectedDeckCards().length;
}

function toggleCreatureSelection(creatureId) {
    const creature = findCreatureById(creatureId);

    if (creature === null) {
        return;
    }

    creature.isSelected = creature.isSelected !== true;

    preserveViewportWhileRendering(function() {
        renderCards();
    });
}

function clearCardSelection() {
    for (const creature of creatures) {
        creature.isSelected = false;
    }

    renderCards();
}

function clearDeckSelection() {
    for (const creature of creatures) {
        if (creature.isInCombat === false) {
            creature.isSelected = false;
        }
    }

    preserveViewportWhileRendering(function() {
        renderCards();
    });
}

function selectAllHandCards() {
    for (const creature of creatures) {
        if (creature.isInCombat === true) {
            creature.isSelected = true;
        }
    }

    renderCards();
}

function selectAllDeckCards() {
    for (const creature of creatures) {
        if (creature.isInCombat === false) {
            creature.isSelected = true;
        }
    }

    renderCards();
}

function selectVisibleDeckCards() {
    const visibleDeckCards = getVisibleDeckCards();

    for (const creature of visibleDeckCards) {
        creature.isSelected = true;
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

    const deckCards = getDeckCards();
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
        currentTurnIndex = 0;
        clearManualPublicSelection();
        return;
    }

    if (currentTurnIndex < 0) {
        currentTurnIndex = 0;
    }

    if (currentTurnIndex >= initiativeCards.length) {
        currentTurnIndex = initiativeCards.length - 1;
    }
}

function getActiveCard(handCards) {
    const initiativeCards = getInitiativeCards(handCards);
    ensureCurrentTurnIndexIsValid(handCards);

    if (initiativeCards.length === 0) {
        return null;
    }

    return initiativeCards[currentTurnIndex];
}

function triggerMirielBoardForEncounterStart() {
    const activeCard = getActiveCard(getHandCards());

    mirielBoardTriggerId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    mirielBoardAnnouncement = {
        roundNumber: roundNumber,
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

    currentTurnIndex = 0;
    roundNumber = 1;
    isEncounterStarted = true;
    clearManualPublicSelection();

    const activeCard = getActiveCard(handCards);

    if (activeCard !== null) {
        focusedCreatureId = activeCard.id;
        resetUsageCountersForCreature(activeCard, ["turn"]);
        for (const creature of handCards) {
            resetUsageCountersForCreature(creature, ["round"]);
        }
    }

    triggerMirielBoardForEncounterStart();
    addCombatLogMessage("Encounter gestartet. Runde 1 beginnt.");
    saveAndBroadcastAppState();
    renderCardsPreservingViewport();
}

function nextTurn() {
    const handCards = getHandCards();
    const initiativeCards = getInitiativeCards(handCards);

    if (isEncounterStarted !== true || initiativeCards.length === 0) {
        return;
    }

    currentTurnIndex = currentTurnIndex + 1;
    clearManualPublicSelection();

    if (currentTurnIndex >= initiativeCards.length) {
        currentTurnIndex = 0;
        roundNumber = roundNumber + 1;
    }

    const newActiveCard = getActiveCard(handCards);

    if (newActiveCard !== null) {
        prepareDmFocusTransition(newActiveCard.id, "next");
        focusedCreatureId = newActiveCard.id;
        resetUsageCountersForCreature(newActiveCard, ["turn"]);
        if (currentTurnIndex === 0) {
            for (const creature of getHandCards()) {
                resetUsageCountersForCreature(creature, ["round"]);
            }
        }
        triggerMirielBoardForTurn(currentTurnIndex === 0);
        addCombatLogMessage(`Nächster Zug: ${newActiveCard.name}.`);
    }

    renderCardsPreservingViewport();
}

function previousTurn() {
    const handCards = getHandCards();
    const initiativeCards = getInitiativeCards(handCards);

    if (isEncounterStarted !== true || initiativeCards.length === 0) {
        return;
    }

    currentTurnIndex = currentTurnIndex - 1;
    clearManualPublicSelection();

    if (currentTurnIndex < 0) {
        currentTurnIndex = initiativeCards.length - 1;

        if (roundNumber > 1) {
            roundNumber = roundNumber - 1;
        }
    }

    const newActiveCard = getActiveCard(getHandCards());

    if (newActiveCard !== null) {
        prepareDmFocusTransition(newActiveCard.id, "previous");
        focusedCreatureId = newActiveCard.id;
        triggerMirielBoardForTurn(currentTurnIndex === 0);
        addCombatLogMessage(`Vorheriger Zug: ${newActiveCard.name}.`);
    }

    renderCardsPreservingViewport();
}

function resetCombatTurnCounter() {
    currentTurnIndex = 0;
    roundNumber = 1;
    clearManualPublicSelection();
    focusedCreatureId = null;

    for (const creature of getHandCards()) {
        resetUsageCountersForCreature(creature, ["turn", "round"]);
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

function scrollPublicPreview(direction) {
    scrollCardRow("public-preview-ribbon", direction);
}

function focusPublicCard(publicCardId) {
    manuallySelectedPublicCardId = publicCardId;
    renderCards();
}

function resetPublicFocusToActiveCard() {
    clearManualPublicSelection();
    renderCards();
}

function navigatePublicPreview(direction) {
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

    manuallySelectedPublicCardId = publicCards[nextFocusedIndex].id;

    renderCards();
}

function handlePublicPreviewWheel(event) {
    const absoluteDeltaX = Math.abs(event.deltaX);
    const absoluteDeltaY = Math.abs(event.deltaY);

    const isHorizontalScroll = absoluteDeltaX > absoluteDeltaY * 1.6;
    const isShiftWheelScroll = event.shiftKey === true && absoluteDeltaY > 0;

    if (isHorizontalScroll === false && isShiftWheelScroll === false) {
        return;
    }

    event.preventDefault();

    if (publicPreviewWheelIsCoolingDown === true) {
        return;
    }

    publicPreviewWheelIsCoolingDown = true;

    const scrollValue = isHorizontalScroll ? event.deltaX : event.deltaY;

    if (scrollValue > 0) {
        navigatePublicPreview("right");
    } else {
        navigatePublicPreview("left");
    }

    setTimeout(function() {
        publicPreviewWheelIsCoolingDown = false;
    }, 700);
}

function handlePublicPreviewTouchStart(event) {
    if (event.touches.length === 0) {
        return;
    }

    publicPreviewTouchStartX = event.touches[0].clientX;
    publicPreviewTouchStartY = event.touches[0].clientY;
}

function handlePublicPreviewTouchEnd(event) {
    if (
        publicPreviewTouchStartX === null ||
        publicPreviewTouchStartY === null ||
        event.changedTouches.length === 0
    ) {
        publicPreviewTouchStartX = null;
        publicPreviewTouchStartY = null;
        return;
    }

    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;

    const deltaX = touchEndX - publicPreviewTouchStartX;
    const deltaY = touchEndY - publicPreviewTouchStartY;

    const absoluteDeltaX = Math.abs(deltaX);
    const absoluteDeltaY = Math.abs(deltaY);

    publicPreviewTouchStartX = null;
    publicPreviewTouchStartY = null;

    const minimumSwipeDistance = 50;
    const isMostlyHorizontalSwipe = absoluteDeltaX > absoluteDeltaY * 1.4;

    if (absoluteDeltaX < minimumSwipeDistance || isMostlyHorizontalSwipe === false) {
        return;
    }

    if (deltaX < 0) {
        navigatePublicPreview("right");
    } else {
        navigatePublicPreview("left");
    }
}

function setupPublicPreviewNavigation() {
    const publicPreviewElement = document.querySelector("#public-preview-list");

    if (publicPreviewElement === null) {
        return;
    }

    publicPreviewElement.addEventListener("wheel", handlePublicPreviewWheel, {
        passive: false
    });

    publicPreviewElement.addEventListener("touchstart", handlePublicPreviewTouchStart);
    publicPreviewElement.addEventListener("touchend", handlePublicPreviewTouchEnd);
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
        closeCardForgeDrawer();
        closeDmActionDrawer();
    });
}

// ============================================================
// 6. Karten finden, verschieben, entfernen und Combat-Aufräumen
// ============================================================

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

function createCreatureCopyName(baseName) {
    const cleanBaseName = getSafeOptionalString(baseName) || "Karte";
    const copyBaseName = `${cleanBaseName} Kopie`;
    let copyName = copyBaseName;
    let counter = 2;

    while (creatures.some(function(creature) { return creature.name === copyName; }) === true) {
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

function cloneCreatureData(creature) {
    return clonePlainData(creature);
}

function copyCreatureToDeck(creatureId) {
    const sourceCreature = findCreatureById(creatureId);

    if (sourceCreature === null) {
        return;
    }

    const creatureCopy = cloneCreatureData(sourceCreature);
    creatureCopy.id = getNextCreatureId();
    creatureCopy.name = createCreatureCopyName(sourceCreature.name);
    creatureCopy.publicName = getSafeOptionalString(sourceCreature.publicName) || sourceCreature.publicName;
    creatureCopy.isInCombat = false;
    creatureCopy.isSelected = false;
    creatureCopy.isDemoCard = false;

    creatures.push(creatureCopy);
    addCombatLogMessage(`Karte kopiert und ins Deck gelegt: ${creatureCopy.name}.`);

    preserveViewportWhileRendering(function() {
        renderCards();
    });
}

function removeCreatureById(id) {
    creatures = creatures.filter(function(creature) {
        return creature.id !== id;
    });

    if (manuallySelectedPublicCardId === id) {
        clearManualPublicSelection();
    }

    if (focusedCreatureId === id) {
        focusedCreatureId = null;
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

function moveCardToHand(creatureId) {
    const creature = findCreatureById(creatureId);

    if (creature === null) {
        return;
    }

    creature.isInCombat = true;
    creature.isSelected = false;

    const handCards = getHandCards();
    ensureCurrentTurnIndexIsValid(handCards);

    preserveViewportWhileRendering(function() {
        renderCards();
    });
}

function moveCardToDeck(creatureId) {
    const creature = findCreatureById(creatureId);

    if (creature === null) {
        return;
    }

    creature.isInCombat = false;
    creature.isSelected = false;

    if (manuallySelectedPublicCardId === creatureId) {
        clearManualPublicSelection();
    }

    if (focusedCreatureId === creatureId) {
        focusedCreatureId = null;
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
    for (const creature of creatures) {
        if (creature.isInCombat === true) {
            creature.isInCombat = false;
            creature.isSelected = false;
        }
    }

    resetEncounterStartGateState({ resetTurn: true });
    focusedCreatureId = null;

    renderCards();
}

function moveAllDeckCardsToHand() {
    for (const creature of creatures) {
        if (creature.isInCombat === false) {
            creature.isInCombat = true;
            creature.isSelected = false;
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

    for (const creature of selectedDeckCards) {
        creature.isInCombat = true;
        creature.isSelected = false;
    }

    const handCards = getHandCards();
    ensureCurrentTurnIndexIsValid(handCards);

    addCombatLogMessage(`${selectedDeckCards.length} Deck-Karte(n) auf die Hand genommen: ${selectedNamesText}.`);
    preserveViewportWhileRendering(function() {
        renderCards();
    });
}

function moveHandCardsOfTypeToDeck(type) {
    for (const creature of creatures) {
        if (creature.isInCombat === true && creature.type === type) {
            creature.isInCombat = false;
            creature.isSelected = false;
        }
    }

    clearManualPublicSelection();

    const handCards = getHandCards();
    ensureCurrentTurnIndexIsValid(handCards);

    renderCards();
}

function moveDeckCardsOfTypeToHand(type) {
    for (const creature of creatures) {
        if (creature.isInCombat === false && creature.type === type) {
            creature.isInCombat = true;
            creature.isSelected = false;
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

    for (const creature of creatures) {
        creature.tempHp = 0;
    }

    addCombatLogMessage("Alle Temp HP entfernt.");
    renderCards();
}

function clearConditionsFromHandCards() {
    const shouldClearConditions = confirm("Alle Conditions von Karten auf der Hand entfernen?");

    if (shouldClearConditions === false) {
        return;
    }

    for (const creature of creatures) {
        if (creature.isInCombat === true) {
            creature.conditions = [];
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

    for (const creature of handCardsBeforeEnd) {
        resetUsageCountersForCreature(creature, ["encounter", "turn", "round"]);
    }

    let movedCardNamesText = "keine Karten";

    if (movedCardCount > 0) {
        movedCardNamesText = createTargetNamesText(handCardsBeforeEnd);
    }

    for (const creature of creatures) {
        if (creature.isInCombat === true) {
            creature.isInCombat = false;
        }

        creature.isSelected = false;
    }

    resetEncounterStartGateState({ resetTurn: true });

    if (editingCreatureId !== null) {
        const editedCreature = getEditFormCreature();

        if (editedCreature !== null) {
            setCheckboxValue("edit-creature-is-in-combat", editedCreature.isInCombat === true);
        }
    }

    addCombatLogMessage(
        `Kampf beendet. ${movedCardCount} Karte(n) ins Deck verschoben: ${movedCardNamesText}.`
    );

    renderCardsPreservingViewport();
}

function longRestPlayerCards() {
    const playerCards = creatures.filter(function(creature) {
        return creature.type === "player";
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

    for (const creature of playerCards) {
        creature.hp = creature.maxHp;
        creature.tempHp = 0;
        creature.conditions = [];
        resetSpellSlotsForCreature(creature);
        resetUsageCountersForCreature(creature, ["shortRest", "longRest", "encounter", "turn", "round"]);
        creature.isSelected = false;
    }

    currentTurnIndex = 0;
    roundNumber = 1;
    clearManualPublicSelection();

    addCombatLogMessage(
        `Lange Rast: ${playerCards.length} Player-Karte(n) vollständig erholt: ${createTargetNamesText(playerCards)}.`
    );

    renderCards();
}

function deleteAllCards() {
    const shouldDeleteAllCards = confirm("Aktuellen Encounter leeren? Alle Karten auf der Hand und im Deck werden entfernt. Exportierte Dateien und lokale Browserdaten bleiben davon unberührt, bis du erneut speicherst.");

    if (shouldDeleteAllCards === false) {
        return;
    }

    setDemoCardsAutoloadEnabled(false);
    encounterName = "Unbenannter Encounter";
    creatures = [];
    focusedCreatureId = null;
    currentTurnIndex = 0;
    roundNumber = 1;
    combatLogMessages = [];
    clearManualPublicSelection();
    addCombatLogMessage("Encounter geleert. Alle Karten wurden gelöscht.");

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

function getCreatureInitiativeModifier(creature) {
    if (creature === null || creature === undefined) {
        return 0;
    }

    const explicitModifier = getSafeOptionalString(creature.initiativeModifier);

    if (explicitModifier !== "") {
        return parseSignedModifier(explicitModifier);
    }

    return parseSignedModifier(creature.dexterityModifier);
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

    const newActiveIndex = initiativeCards.findIndex(function(creature) {
        return creature.id === activeCardId;
    });

    if (newActiveIndex === -1) {
        ensureCurrentTurnIndexIsValid(handCards);
        return;
    }

    currentTurnIndex = newActiveIndex;
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

    for (const creature of selectedCards) {
        creature.initiative = initiativeValue;
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

    for (const creature of cardsToRoll) {
        const rolledInitiative = rollD20();
        const initiativeModifier = getCreatureInitiativeModifier(creature);
        const finalInitiative = rolledInitiative + initiativeModifier;
        creature.initiative = finalInitiative;
        rollResults.push(`${creature.name}: ${finalInitiative} (${rolledInitiative}${formatSignedModifier(initiativeModifier)})`);
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
    const monsterCards = getHandCards().filter(function(creature) {
        return creature.type === "monster";
    });

    rollInitiativeForCards(monsterCards, "Monster-Initiative gewürfelt");
}

function rollInitiativeForHandEnemies() {
    const enemyCards = getHandCards().filter(function(creature) {
        return creature.type === "monster" || creature.type === "npc";
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

function getHpChangeAmount(creatureId) {
    const inputElement = document.querySelector(`#hp-change-amount-${creatureId}`);

    if (inputElement === null) {
        return 0;
    }

    return Number(inputElement.value);
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
    return targets.map(function(creature) {
        return creature.name;
    }).join(", ");
}

function createActionTargetLogText(targets) {
    const targetNamesText = createTargetNamesText(targets);

    if (targets.length === 1) {
        return targetNamesText;
    }

    return `: ${targetNamesText}`;
}

function addCombatLogMessage(message) {
    combatLogMessages.unshift({
        time: getCurrentTimeText(),
        text: message
    });

    if (combatLogMessages.length > 12) {
        combatLogMessages = combatLogMessages.slice(0, 12);
    }
}

function getDmFeedTabButtonHtml(tabName, label) {
    const activeClass = activeDmFeedTab === tabName ? "active-feed-tab" : "";

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

    for (const logMessage of combatLogMessages) {
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
        html += `
            <article class="combat-log-entry">
                <span class="combat-log-time">${logMessage.time}</span>
                <span class="combat-log-text">${logMessage.text}</span>
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

    for (const creature of selectedTargets) {
        applyDamage(creature, amount);
    }

    addCombatLogMessage(`${amount} Schaden auf ${createActionTargetLogText(selectedTargets)}.`);
    renderCards();
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

    for (const creature of selectedTargets) {
        applyHealing(creature, amount);
    }

    addCombatLogMessage(`${amount} Heilung auf ${createActionTargetLogText(selectedTargets)}.`);
    renderCards();
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

    for (const creature of selectedTargets) {
        applyTempHp(creature, amount);
    }

    addCombatLogMessage(`${amount} Temp HP auf ${createActionTargetLogText(selectedTargets)} gesetzt.`);
    renderCards();
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

    for (const creature of selectedTargets) {
        if (creatureHasCondition(creature, conditionName) === false) {
            creature.conditions.push(conditionName);
        }
    }

    addCombatLogMessage(`Condition ${conditionName} auf ${selectedTargets.length} Ziel(e) angewendet: ${createTargetNamesText(selectedTargets)}.`);
    renderCards();
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

    for (const creature of selectedTargets) {
        creature.conditions = creature.conditions.filter(function(condition) {
            return condition !== conditionName;
        });
    }

    addCombatLogMessage(`Condition ${conditionName} von ${selectedTargets.length} Ziel(e) entfernt: ${createTargetNamesText(selectedTargets)}.`);
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

function getTempHpPercent(creature) {
    if (creature.maxHp <= 0) {
        return 0;
    }

    const rawPercent = Math.round((creature.tempHp / creature.maxHp) * 100);

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
        return "volle HP";
    }

    if (creature.hpVisibility === "bar") {
        return "Balken";
    }

    if (creature.hpVisibility === "descriptive") {
        return "Zustandsschleier";
    }

    if (creature.hpVisibility === "hidden") {
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

function getPublicVisibilitySummary(creature) {
    const healthPresentation = getHealthPresentation(creature, true);
    return `${getHpVisibilityLabel(creature)} · ${getHealthStateLabel(healthPresentation.state)}`;
}

// ============================================================
// 8. Conditions
// ============================================================

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
    const conditionListElement = document.querySelector("#edit-creature-condition-list");

    if (conditionListElement === null) {
        return;
    }

    conditionListElement.innerHTML = createEditConditionCheckboxesHtml();
}

function renderNewConditionCheckboxes() {
    const conditionListElement = document.querySelector("#new-creature-condition-list");

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

function setEditConditionCheckboxes(creature) {
    const checkboxElements = document.querySelectorAll(".edit-condition-checkbox");
    const conditionValues = Array.isArray(creature.conditions) ? creature.conditions : [];

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

    const previousImageData = mirielBoardManualImageData;
    const previousImageName = mirielBoardManualImageName;

    try {
        mirielBoardManualImageData = await readAndOptimizeImageFileAsDataUrl(imageFile);
        mirielBoardManualImageName = imageFile.name || "Eigene Schautafel";
        renderMirielBoardManualPreview();
        updateMirielBoardControls();
        addCombatLogMessage(`Bild für Miriels Schautafel vorbereitet: ${mirielBoardManualImageName}.`);
        saveAndBroadcastAppState();
        renderCards();
    } catch (error) {
        mirielBoardManualImageData = previousImageData;
        mirielBoardManualImageName = previousImageName;

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
    mirielBoardManualImageData = "";
    mirielBoardManualImageName = "";

    ensureMirielBoardPersistentModeIsValid();

    saveAndBroadcastAppState();
    renderCards();
}

function setMirielBoardManualText(value) {
    mirielBoardManualText = typeof value === "string" ? value.slice(0, 700) : "";
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
    mirielBoardManualTextSize = getSafeMirielBoardManualTextSize(size);
    renderMirielBoardManualPreview();
    updateMirielBoardControls();
    saveAndBroadcastAppState();
    renderCards();
}

function setMirielBoardManualTextPosition(position) {
    mirielBoardManualTextPosition = getSafeMirielBoardManualTextPosition(position);
    renderMirielBoardManualPreview();
    updateMirielBoardControls();
    saveAndBroadcastAppState();
    renderCards();
}

function clearMirielBoardManualText() {
    mirielBoardManualText = "";

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
// 10. Encounter exportieren und importieren
// ============================================================

function createEncounterExportData() {
    return {
        formatName: "Miriel\'s Deck of Encounters Encounter",
        formatVersion: 2,
        exportedAt: new Date().toISOString(),
        metadata: {
            appVersion: appVersion,
            operatingMode: appOperatingMode,
            licenseNotice: "Enthält bearbeitetes Material aus dem SRD 5.1 unter CC BY 4.0.",
            legalDocument: "legal.html"
        },
        encounter: {
            encounterName: encounterName,
            roundNumber: roundNumber,
            currentTurnIndex: currentTurnIndex,
            isEncounterStarted: isEncounterStarted,
            encounterStartGateVersion: 2,
            mirielBoardAutomationDefaultsVersion: mirielBoardAutomationDefaultsVersion,
            manuallySelectedPublicCardId: manuallySelectedPublicCardId,
            focusedCreatureId: focusedCreatureId,
            activeDetailTab: activeDetailTab,
            activeDmFeedTab: activeDmFeedTab,
            expandedSpellDetailKey: expandedSpellDetailKey,
            combatLogMessages: combatLogMessages,
            mirielBoardManualImageData: mirielBoardManualImageData,
            mirielBoardManualImageName: mirielBoardManualImageName,
            mirielBoardManualText: mirielBoardManualText,
            mirielBoardManualTextSize: mirielBoardManualTextSize,
            mirielBoardManualTextPosition: mirielBoardManualTextPosition,
            mirielBoardPersistentMode: mirielBoardPersistentMode,
            isMirielBoardAutoTurnEnabled: isMirielBoardAutoTurnEnabled,
            mirielBoardDurationMode: mirielBoardDurationMode,
            isMirielBoardNewRoundCallEnabled: isMirielBoardNewRoundCallEnabled,
            mirielBoardTriggerId: mirielBoardTriggerId,
            mirielBoardAnnouncement: mirielBoardAnnouncement,
            creatures: creatures
        }
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
    const fallbackName = "unbenannter-encounter";
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

function encounterNameNeedsFileNameWarning(rawName) {
    return /[^a-zA-Z0-9äöüÄÖÜß _.-]/.test(getSafeOptionalString(rawName));
}

function createExportFileName(nameForExport = encounterName) {
    const safeNameSegment = createSafeFileNameSegment(nameForExport);
    return `miriels-deck-${safeNameSegment}-${createExportTimestampText()}.json`;
}

function downloadTextFile(fileName, textContent) {
    const fileBlob = new Blob([textContent], {
        type: "application/json"
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

function exportEncounter() {
    const proposedName = getSafeEncounterName(encounterName);
    const inputName = prompt(
        "Encounter vor dem Export benennen.\nSonderzeichen werden im Dateinamen automatisch vereinfacht.",
        proposedName
    );

    if (inputName === null) {
        return;
    }

    const safeName = getSafeEncounterName(inputName);

    if (encounterNameNeedsFileNameWarning(safeName) === true) {
        alert("Der Dateiname wird vereinfacht, weil einige Sonderzeichen auf Dateisystemen problematisch sein können.");
    }

    setEncounterName(safeName, { silent: true });

    const exportData = createEncounterExportData();
    const jsonText = JSON.stringify(exportData, null, 4);
    const fileName = createExportFileName(safeName);

    downloadTextFile(fileName, jsonText);
}

function triggerEncounterImport() {
    const mayImport = confirm("Importiere nur Inhalte, die du rechtmäßig verwenden darfst. Importierte Texte und Bilder werden vom Projekt nicht geprüft oder lizenziert. Fortfahren?");

    if (mayImport !== true) {
        return;
    }

    const fileInputElement = document.querySelector("#encounter-import-file");

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

async function handleEncounterImportFileChange(event) {
    const fileInputElement = event.target;

    if (fileInputElement.files.length === 0) {
        return;
    }

    const importFile = fileInputElement.files[0];

    try {
        const fileText = await readTextFile(importFile);
        const importData = JSON.parse(fileText);
        const encounterData = getEncounterDataFromImport(importData);

        if (encounterData === null) {
            alert("Die Datei enthält keinen gültigen Encounter.");
            return;
        }

        showEncounterImportPreview(encounterData, importFile.name);
    } catch (error) {
        alert("Die Encounter-Datei konnte nicht importiert werden.");
    }
}

function showEncounterImportPreview(encounterData, fileName) {
    pendingDeckImportData = encounterData;
    pendingDeckImportFileName = getSafeOptionalString(fileName) || "Importdatei";

    openDmActionDrawer("archive");

    const previewElement = document.querySelector("#deck-import-preview");
    const fileNameElement = document.querySelector("#deck-import-preview-file");
    const nameElement = document.querySelector("#deck-import-preview-name");
    const summaryElement = document.querySelector("#deck-import-preview-summary");

    if (previewElement === null || fileNameElement === null || summaryElement === null) {
        importEncounterData(encounterData);
        return;
    }

    const importCount = Array.isArray(encounterData.creatures) ? encounterData.creatures.length : 0;
    const currentDeckCount = getDeckCards().length;
    const currentTotalCount = creatures.length;
    const importedEncounterName = getSafeEncounterName(encounterData.encounterName || encounterData.name || encounterData.deckName);

    fileNameElement.textContent = `Datei: ${pendingDeckImportFileName}`;

    if (nameElement !== null) {
        nameElement.textContent = `Encounter: ${importedEncounterName}`;
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
    importEncounterData(importData);
}

function confirmDeckImportAppend() {
    if (pendingDeckImportData === null || Array.isArray(pendingDeckImportData.creatures) === false) {
        closeDeckImportPreview();
        return;
    }

    const importedCards = createImportedCreaturesForDeckAppend(pendingDeckImportData.creatures);
    const importCount = importedCards.length;

    for (const importedCard of importedCards) {
        creatures.push(importedCard);
    }

    addCombatLogMessage(`${importCount} Karte(n) aus ${pendingDeckImportFileName} zum Deck hinzugefügt. Laufender Encounter bleibt erhalten.`);
    closeDeckImportPreview();

    preserveViewportWhileRendering(function() {
        renderCards();
    });
}

function createImportedCreaturesForDeckAppend(rawCreatures) {
    const importedCreatures = [];
    const usedIds = creatures.map(function(creature) {
        return creature.id;
    });

    for (const rawCreature of rawCreatures) {
        if (rawCreature !== null && typeof rawCreature === "object") {
            const importedCreature = createImportedCreature(rawCreature, usedIds);

            importedCreature.isInCombat = false;
            importedCreature.isSelected = false;
            importedCreatures.push(importedCreature);
            usedIds.push(importedCreature.id);
        }
    }

    return importedCreatures;
}

function importEncounterData(encounterData) {
    if (
        encounterData === null ||
        typeof encounterData !== "object" ||
        Array.isArray(encounterData.creatures) === false
    ) {
        alert("Die Datei enthält keinen gültigen Encounter.");
        return;
    }

    const importedCreatures = createImportedCreatures(encounterData.creatures);

    encounterName = getSafeEncounterName(encounterData.encounterName);
    creatures = importedCreatures;
    roundNumber = getSafePositiveInteger(encounterData.roundNumber, 1);
    currentTurnIndex = getSafeNonNegativeInteger(encounterData.currentTurnIndex, 0);
    isEncounterStarted = encounterData.isEncounterStarted === true;

    if (isImportedPublicSelectionValid(encounterData.manuallySelectedPublicCardId, creatures)) {
        manuallySelectedPublicCardId = Number(encounterData.manuallySelectedPublicCardId);
    } else {
        clearManualPublicSelection();
    }

    if (isImportedPublicSelectionValid(encounterData.focusedCreatureId, creatures)) {
        focusedCreatureId = Number(encounterData.focusedCreatureId);
    } else {
        focusedCreatureId = null;
    }

    activeDetailTab = getSafeDetailTab(encounterData.activeDetailTab);
    activeDmFeedTab = getSafeDmFeedTab(encounterData.activeDmFeedTab);
    expandedSpellDetailKey = getSafeOptionalString(encounterData.expandedSpellDetailKey);

    combatLogMessages = getSafeCombatLogMessages(encounterData.combatLogMessages);
    mirielBoardManualImageData = getSafeString(encounterData.mirielBoardManualImageData, "");
    mirielBoardManualImageName = getSafeString(encounterData.mirielBoardManualImageName, "");
    mirielBoardManualText = getSafeString(encounterData.mirielBoardManualText, "");
    mirielBoardManualTextSize = getSafeMirielBoardManualTextSize(encounterData.mirielBoardManualTextSize);
    mirielBoardManualTextPosition = getSafeMirielBoardManualTextPosition(encounterData.mirielBoardManualTextPosition);
    mirielBoardPersistentMode = getSafeMirielBoardPersistentModeFromEncounter(encounterData);
    isMirielBoardAutoTurnEnabled = encounterData.isMirielBoardAutoTurnEnabled === true;
    mirielBoardDurationMode = getSafeMirielBoardDurationMode(encounterData.mirielBoardDurationMode);
    isMirielBoardNewRoundCallEnabled = encounterData.isMirielBoardNewRoundCallEnabled !== false;
    mirielBoardTriggerId = getSafeOptionalString(encounterData.mirielBoardTriggerId);
    mirielBoardAnnouncement = getSafeMirielBoardAnnouncement(encounterData.mirielBoardAnnouncement);

    const handCards = getHandCards();
    ensureCurrentTurnIndexIsValid(handCards);

    renderCards();
}

function getEncounterDataFromImport(importData) {
    if (
        importData === null ||
        typeof importData !== "object" ||
        importData.formatVersion !== 2 ||
        importData.encounter === null ||
        typeof importData.encounter !== "object" ||
        Array.isArray(importData.encounter.creatures) === false
    ) {
        return null;
    }

    return importData.encounter;
}

function createImportedCreatures(rawCreatures) {
    const importedCreatures = [];
    const usedIds = [];

    for (const rawCreature of rawCreatures) {
        if (rawCreature !== null && typeof rawCreature === "object") {
            const importedCreature = createImportedCreature(rawCreature, usedIds);

            importedCreatures.push(importedCreature);
            usedIds.push(importedCreature.id);
        }
    }

    return importedCreatures;
}

function createImportedCreature(rawCreature, usedIds) {
    const id = createImportedCreatureId(rawCreature.id, usedIds);

    const maxHp = getSafePositiveInteger(rawCreature.maxHp, 1);
    const hp = clampNumber(
        getSafeNonNegativeInteger(rawCreature.hp, maxHp),
        0,
        maxHp
    );

    return {
        id: id,
        name: getSafeString(rawCreature.name, `Karte ${id}`),
        publicName: getSafeString(rawCreature.publicName, `Karte ${id}`),
        type: getSafeCreatureType(rawCreature.type),
        initiative: getSafeInteger(rawCreature.initiative, 0),
        initiativeModifier: getSafeOptionalString(rawCreature.initiativeModifier) || getSafeOptionalString(rawCreature.dexterityModifier) || "+0",
        hp: hp,
        maxHp: maxHp,
        tempHp: getSafeNonNegativeInteger(rawCreature.tempHp, 0),
        armorClass: getSafeNonNegativeInteger(rawCreature.armorClass, 10),
        passivePerception: getSafeNonNegativeInteger(rawCreature.passivePerception, 10),
        passiveInsight: getSafeNonNegativeInteger(rawCreature.passiveInsight, 10),
        passiveInvestigation: getSafeNonNegativeInteger(rawCreature.passiveInvestigation, 10),
        strengthScore: getSafeNonNegativeInteger(rawCreature.strengthScore, 10),
        strengthModifier: getSafeOptionalString(rawCreature.strengthModifier) || "+0",
        dexterityScore: getSafeNonNegativeInteger(rawCreature.dexterityScore, 10),
        dexterityModifier: getSafeOptionalString(rawCreature.dexterityModifier) || "+0",
        constitutionScore: getSafeNonNegativeInteger(rawCreature.constitutionScore, 10),
        constitutionModifier: getSafeOptionalString(rawCreature.constitutionModifier) || "+0",
        intelligenceScore: getSafeNonNegativeInteger(rawCreature.intelligenceScore, 10),
        intelligenceModifier: getSafeOptionalString(rawCreature.intelligenceModifier) || "+0",
        wisdomScore: getSafeNonNegativeInteger(rawCreature.wisdomScore, 10),
        wisdomModifier: getSafeOptionalString(rawCreature.wisdomModifier) || "+0",
        charismaScore: getSafeNonNegativeInteger(rawCreature.charismaScore, 10),
        charismaModifier: getSafeOptionalString(rawCreature.charismaModifier) || "+0",
        speed: getSafeOptionalString(rawCreature.speed),
        savingThrows: getSafeOptionalString(rawCreature.savingThrows),
        resistances: getSafeOptionalString(rawCreature.resistances),
        immunities: getSafeOptionalString(rawCreature.immunities),
        vulnerabilities: getSafeOptionalString(rawCreature.vulnerabilities),
        senses: getSafeOptionalString(rawCreature.senses),
        spellSaveDc: getSafeOptionalString(rawCreature.spellSaveDc),
        specialResources: getSafeOptionalString(rawCreature.specialResources),
        traits: getSafeCreatureTraits(rawCreature.traits),
        actions: getSafeCreatureActions(rawCreature.actions),
        notes: getSafeOptionalString(rawCreature.notes),
        spellcasting: getSafeSpellcasting(rawCreature.spellcasting, rawCreature),
        currency: getSafeCurrency(rawCreature.currency),
        inventoryCards: getSafeInventoryCards(rawCreature.inventoryCards),
        inventoryList: getSafeInventoryList(rawCreature.inventoryList),
        hpVisibility: getSafeHpVisibility(rawCreature.hpVisibility),
        imageData: getSafeString(rawCreature.imageData, ""),
        conditions: getSafeConditions(rawCreature.conditions),
        isDemoCard: rawCreature.isDemoCard === true || isKnownDemoCreatureData(rawCreature) === true,
        isInCombat: rawCreature.isInCombat === true,
        isInitiativeActive: rawCreature.isInitiativeActive !== false,
        isSelected: rawCreature.isSelected === true
    };
}

function createImportedCreatureId(rawId, usedIds) {
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

function isImportedPublicSelectionValid(importedSelectionId, importedCreatures) {
    if (importedSelectionId === null) {
        return false;
    }

    const numericSelectionId = Number(importedSelectionId);

    if (Number.isInteger(numericSelectionId) === false) {
        return false;
    }

    for (const creature of importedCreatures) {
        if (creature.id === numericSelectionId) {
            return true;
        }
    }

    return false;
}

function getSafeString(value, fallbackValue) {
    if (typeof value !== "string") {
        return fallbackValue;
    }

    const trimmedValue = value.trim();

    if (trimmedValue === "") {
        return fallbackValue;
    }

    return trimmedValue;
}

function getSafeOptionalString(value) {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim();
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

function createAbilityScoreHtml(creature, shortName, scorePropertyName, modifierPropertyName) {
    const scoreValue = Number.isFinite(Number(creature[scorePropertyName]))
        ? String(creature[scorePropertyName])
        : "10";
    const modifierValue = getDetailValue(creature[modifierPropertyName] || "+0");

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

function createDefaultSpellcasting(rawCreature = {}) {
    const saveDcText = getSafeOptionalString(rawCreature.spellSaveDc);
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

function getSafeSpellcasting(rawSpellcasting, rawCreature = {}) {
    const spellcasting = createDefaultSpellcasting(rawCreature);

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
        actionType: getSafeCreatureActionType(rawSpell.actionType),
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
        actionType: getSafeCreatureActionType(rawSpell.actionType),
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

function applyLegacySlotHints(spellcasting, rawCreature = {}) {
    const hintsText = `${getSafeOptionalString(rawCreature.specialResources)} ${getSafeOptionalString(rawCreature.spellsText)}`;

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

function getCreatureSpellcasting(creature) {
    if (creature === null) {
        return createDefaultSpellcasting();
    }

    creature.spellcasting = getSafeSpellcasting(creature.spellcasting, creature);

    return creature.spellcasting;
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

function toggleSpellSlot(creatureId, spellLevel, slotIndex) {
    const detailScrollTop = captureActiveDetailScrollTop();
    const creature = findCreatureById(creatureId);

    if (creature === null) {
        return;
    }

    const spellcasting = getCreatureSpellcasting(creature);
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

    addCombatLogMessage(`${creature.publicName || creature.name}: Spell Slots ${spellLevelLabels[level]} ${getAvailableSpellSlotCount(slotData)} / ${slotData.max}.`);
    renderCards();
    restoreDetailScrollAfterRender(detailScrollTop);
}

function toggleSpellPrepared(creatureId, spellId) {
    const detailScrollTop = captureActiveDetailScrollTop();
    const creature = findCreatureById(creatureId);

    if (creature === null) {
        return;
    }

    const spell = getCreatureSpellcasting(creature).spells.find(function(candidate) {
        return candidate.id === spellId;
    });

    if (spell === undefined) {
        return;
    }

    spell.prepared = spell.prepared !== true;
    renderCards();
    restoreDetailScrollAfterRender(detailScrollTop);
}

function toggleSpellDetail(creatureId, spellId) {
    const detailScrollTop = captureActiveDetailScrollTop();
    const key = `${creatureId}:${spellId}`;
    const shouldExpandSpell = expandedSpellDetailKey !== key;

    expandedSpellDetailKey = shouldExpandSpell ? key : null;
    renderCards();
    restoreDetailScrollAfterRender(detailScrollTop, shouldExpandSpell ? key : "");
}

function resetSpellSlotsForCreature(creature) {
    const spellcasting = getCreatureSpellcasting(creature);

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

function createCreatureSpellSaveDcText(spellcasting) {
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

function createSpellSlotButtonsHtml(creatureId, level, slotData) {
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
                onclick="toggleSpellSlot(${creatureId}, ${level}, ${index})"
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

function createSpellDetailHtml(creatureId, spell) {
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
                ${spell.level > 0 && getCreatureSpellcasting(findCreatureById(creatureId)).slots[String(spell.level)].max > 0 ? `<button type="button" onclick="toggleSpellSlot(${creatureId}, ${spell.level}, ${Math.max(0, getAvailableSpellSlotCount(getCreatureSpellcasting(findCreatureById(creatureId)).slots[String(spell.level)]) - 1)})">Slot verwenden</button>` : ""}
            </div>
        </div>
    `;
}

function createSpellRowHtml(creatureId, spell) {
    const isExpanded = expandedSpellDetailKey === `${creatureId}:${spell.id}`;
    const preparedSymbol = spell.prepared === true ? "✓" : "○";

    return `
        <article class="spell-row-card ${spell.prepared === true ? "spell-prepared" : "spell-unprepared"} ${isExpanded ? "spell-row-expanded" : ""}" data-spell-key="${escapeHtml(`${creatureId}:${spell.id}`)}">
            <div class="spell-row-shell">
                <button class="spell-prepared-toggle" type="button" onclick="toggleSpellPrepared(${creatureId}, '${spell.id}')" title="Prepared umschalten" aria-label="Prepared für ${escapeHtml(spell.name)} umschalten">
                    ${preparedSymbol}
                </button>
                <button class="spell-row-button" type="button" onclick="toggleSpellDetail(${creatureId}, '${spell.id}')" aria-expanded="${isExpanded ? "true" : "false"}">
                    <span class="spell-row-chevron" aria-hidden="true">›</span>
                    <span class="spell-row-name">${escapeHtml(spell.name)}</span>
                </button>
            </div>
            ${isExpanded ? createSpellDetailHtml(creatureId, spell) : ""}
        </article>
    `;
}

function createSpellLevelCardHtml(creatureId, level, spells, slotData) {
    if (spells.length === 0 && (slotData === undefined || slotData.max === 0)) {
        return "";
    }

    const slotHtml = level === 0 ? "" : createSpellSlotButtonsHtml(creatureId, level, slotData);
    const spellRowsHtml = spells.length === 0
        ? `<p class="detail-placeholder-text">Keine Spells auf diesem Level eingetragen.</p>`
        : spells.map(function(spell) {
            return createSpellRowHtml(creatureId, spell);
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

function createSpellTrackerHtml(creature) {
    const spellcasting = getCreatureSpellcasting(creature);
    const groupedSpells = groupSpellsByLevel(spellcasting.spells);
    const levelCards = [];

    for (let level = 0; level <= 9; level += 1) {
        const slotData = level === 0 ? { max: 0, used: 0 } : spellcasting.slots[String(level)];
        const levelHtml = createSpellLevelCardHtml(creature.id, level, groupedSpells[level], slotData);

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
                actionType: getSafeCreatureActionType(parts[13]),
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

function writeSpellcastingToForge(prefix, creature) {
    const spellcasting = getCreatureSpellcasting(creature);

    setInputValue(`${prefix}-spellcasting-ability`, spellcasting.ability || "");
    setInputValue(`${prefix}-spellcasting-save-dc`, spellcasting.saveDc || 0);
    setInputValue(`${prefix}-spellcasting-attack`, spellcasting.attackBonus || "");

    for (let level = 1; level <= 9; level += 1) {
        setInputValue(`${prefix}-spell-slots-${level}`, spellcasting.slots[String(level)].max || 0);
    }

    setInputValue(`${prefix}-structured-spells`, createSpellListTextFromSpellcasting(spellcasting));
}


function getVisibleForgePrefix() {
    const editSectionElement = document.querySelector("#edit-creature-section");

    if (editSectionElement !== null && editSectionElement.classList.contains("card-forge-panel-hidden") === false) {
        return "edit-creature";
    }

    return "new-creature";
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
    if (prefix !== "edit-creature") {
        return;
    }

    const creature = getEditFormCreature();

    if (creature === null) {
        return;
    }

    creature.spellcasting = readSpellcastingFromForge(prefix);
    creature.spellSaveDc = createCreatureSpellSaveDcText(creature.spellcasting);

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


function resetUsageCountersForCreature(creature, resetTypes) {
    if (creature === null || Array.isArray(resetTypes) === false || resetTypes.length === 0) {
        return;
    }

    const shouldReset = function(item) {
        return resetTypes.includes(getUsageReset(item));
    };

    const actions = getCreatureActions(creature).map(function(action) {
        return shouldReset(action) ? createCreatureAction({ ...action, used: 0 }, 0) : action;
    });
    creature.actions = actions;

    const traits = getCreatureTraits(creature).map(function(trait) {
        return shouldReset(trait) ? createCreatureTrait({ ...trait, used: 0 }, 0) : trait;
    });
    creature.traits = traits;

    const spellcasting = getCreatureSpellcasting(creature);
    spellcasting.spells = spellcasting.spells.map(function(spell) {
        return shouldReset(spell) ? createSpellObject({ ...spell, used: 0 }, 0) : spell;
    });
    creature.spellcasting = spellcasting;
}

const creatureActionTypeLabels = {
    action: "Aktionen",
    bonus: "Bonusaktionen",
    reaction: "Reaktionen",
    special: "Sonstiges"
};

const creatureActionTypeSingularLabels = {
    action: "Aktion",
    bonus: "Bonusaktion",
    reaction: "Reaktion",
    special: "Sonstiges"
};

function getSafeCreatureActionType(value) {
    if (value === "action" || value === "bonus" || value === "reaction" || value === "special") {
        return value;
    }

    return "action";
}

function createCreatureAction(rawAction = {}, fallbackIndex = 0) {
    return {
        id: getSafeOptionalString(rawAction.id) || `action-${Date.now()}-${fallbackIndex}-${Math.random().toString(36).slice(2, 8)}`,
        name: getSafeOptionalString(rawAction.name) || "Neue Aktion",
        type: getSafeCreatureActionType(rawAction.type),
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

function getSafeCreatureActions(value) {
    if (Array.isArray(value) === false) {
        return [];
    }

    return value
        .filter(function(action) { return action !== null && typeof action === "object"; })
        .map(function(action, index) { return createCreatureAction(action, index); })
        .filter(function(action) { return action.name.trim() !== ""; });
}

function getCreatureActions(creature) {
    if (creature === null) {
        return [];
    }

    return getSafeCreatureActions(creature.actions);
}


function createActionFromTrait(trait) {
    return createCreatureAction({
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

    return getSafeCreatureActionType(spell.actionType);
}

function createActionFromSpell(spell) {
    return createCreatureAction({
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

function getCreatureActionReferences(creature) {
    const directActions = getCreatureActions(creature).map(function(action) {
        return createCreatureAction({ ...action, sourceType: action.sourceType || "action", sourceId: action.sourceId || action.id }, 0);
    });
    const traitActions = getCreatureTraits(creature)
        .filter(function(trait) { return trait.showAsAction === true; })
        .map(createActionFromTrait);
    const spellActions = getCreatureSpellcasting(creature).spells
        .filter(function(spell) { return spell.showAsAction === true; })
        .map(createActionFromSpell);
    const itemActions = getInventoryCards(creature)
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

    return getSafeCreatureActions(parseJsonValue(actionsElement.value.trim(), []), "");
}

function setForgeActions(prefix, actions) {
    const actionsElement = document.querySelector(`#${prefix}-actions-text`);

    if (actionsElement === null) {
        return;
    }

    const safeActions = getSafeCreatureActions(actions, "");
    actionsElement.value = JSON.stringify(safeActions);
}

function writeActionsToForge(prefix, creature) {
    setForgeActions(prefix, getCreatureActions(creature));
    renderForgeActionManager(prefix);
}

function commitForgeActionsIfEditing(prefix) {
    if (prefix !== "edit-creature") {
        return;
    }

    const creature = getEditFormCreature();

    if (creature === null) {
        return;
    }

    creature.actions = getForgeActionsDraft(prefix);

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
    const action = createCreatureAction({
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
    const nextAction = createCreatureAction({
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
    const label = creatureActionTypeSingularLabels[action.type] || "Aktion";

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
            <h5>${creatureActionTypeLabels[type]}</h5>
            <div class="forge-action-row-list">
                ${actions.map(function(action) { return createForgeActionRowHtml(prefix, action); }).join("")}
            </div>
        </section>
    `;
}

function createForgeActionEditorHtml(prefix, action) {
    const safeAction = action || createCreatureAction({ name: "", type: "action" }, 0);

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

function getSafeCreatureType(value) {
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

    const safeMessages = [];

    for (const rawMessage of value) {
        if (rawMessage !== null && typeof rawMessage === "object") {
            const safeTime = getSafeString(rawMessage.time, "--:--:--");
            const safeText = getSafeString(rawMessage.text, "Unbekannte Aktion.");

            safeMessages.push({
                time: safeTime,
                text: safeText
            });
        }
    }

    return safeMessages.slice(0, 12);
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
    mirielBoardTriggerId = "";
    mirielBoardAnnouncement = null;
    lastRenderedMirielBoardTriggerId = "";

    if (mirielBoardAutoHideTimer !== null) {
        window.clearTimeout(mirielBoardAutoHideTimer);
        mirielBoardAutoHideTimer = null;
    }
}


function hasPreparedEncounterCards() {
    return Array.isArray(creatures) === true && creatures.length > 0;
}

function hasEncounterHandCards() {
    return getHandCards().length > 0;
}

function resetEncounterStartGateState(options = {}) {
    const shouldResetTurn = options.resetTurn !== false;
    const shouldClearLog = options.clearLog === true;

    isEncounterStarted = false;

    if (shouldResetTurn === true) {
        currentTurnIndex = 0;
        roundNumber = 1;
    }

    clearManualPublicSelection();
    clearMirielBoardTransientAnnouncement();

    if (shouldClearLog === true) {
        combatLogMessages = [];
    }
}

function ensureEncounterStartGateConsistency() {
    const handCards = getHandCards();

    if (handCards.length === 0 && isEncounterStarted === true) {
        resetEncounterStartGateState({ resetTurn: true });
    }

    if (isEncounterStarted !== true) {
        currentTurnIndex = 0;
        roundNumber = 1;
    }
}

function getCurrentMirielBoardAnnouncement(activeCard) {
    return {
        roundNumber: roundNumber,
        activeName: activeCard !== null ? activeCard.publicName || activeCard.name : "",
        isNewRound: false,
        createdAt: new Date().toISOString()
    };
}

function triggerMirielBoardForTurn(isNewRound) {
    if (mirielBoardPersistentMode === "manual" && hasMirielBoardManualContent() === true) {
        return;
    }

    const shouldShowNewRoundCall = isNewRound === true && isMirielBoardNewRoundCallEnabled === true;
    const shouldShowTurnPreview = isMirielBoardAutoTurnEnabled === true;

    if (shouldShowNewRoundCall !== true && shouldShowTurnPreview !== true) {
        return;
    }

    const activeCard = getActiveCard(getHandCards());

    mirielBoardTriggerId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    mirielBoardAnnouncement = {
        roundNumber: roundNumber,
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

    mirielBoardPersistentMode = safeMode;
    shouldAnimateMirielBoardOnNextRender = safeMode !== "off";
    clearMirielBoardTransientAnnouncement();
    saveAndBroadcastAppState();
    renderCards();
}

function hasMirielBoardManualContent() {
    return mirielBoardManualImageData !== "" || mirielBoardManualText.trim() !== "";
}

function ensureMirielBoardPersistentModeIsValid() {
    if (mirielBoardPersistentMode === "manual" && hasMirielBoardManualContent() !== true) {
        mirielBoardPersistentMode = "off";
        clearMirielBoardTransientAnnouncement();
    }
}

function toggleMirielBoardAutoTurn(isEnabled) {
    isMirielBoardAutoTurnEnabled = isEnabled === true;
    saveAndBroadcastAppState();
    renderCards();
}

function setMirielBoardDurationMode(mode) {
    mirielBoardDurationMode = getSafeMirielBoardDurationMode(mode);
    saveAndBroadcastAppState();
    renderCards();
}

function toggleMirielBoardNewRoundCall(isEnabled) {
    isMirielBoardNewRoundCallEnabled = isEnabled === true;
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

    if (mirielBoardPersistentMode === "manual" && hasMirielBoardManualContent() === true) {
        return "Eigene Tafel";
    }

    if (mirielBoardPersistentMode === "initiative") {
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
        const isActive = mirielBoardPersistentMode === mode;
        const isManualButton = mode === "manual";

        modeButtonElement.classList.toggle("miriel-board-mode-button-active", isActive);
        modeButtonElement.disabled = isManualButton === true && hasManualContent !== true;
        modeButtonElement.setAttribute("aria-pressed", isActive === true ? "true" : "false");
    }

    if (autoCheckboxElement !== null) {
        autoCheckboxElement.checked = isMirielBoardAutoTurnEnabled === true;
    }

    if (durationSelectElement !== null) {
        durationSelectElement.value = mirielBoardDurationMode;
    }

    if (newRoundCheckboxElement !== null) {
        newRoundCheckboxElement.checked = isMirielBoardNewRoundCallEnabled === true;
    }

    if (textElement !== null && textElement.value !== mirielBoardManualText) {
        textElement.value = mirielBoardManualText;
    }

    if (textSizeElement !== null) {
        textSizeElement.value = mirielBoardManualTextSize;
    }

    if (textPositionElement !== null) {
        textPositionElement.value = mirielBoardManualTextPosition;
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
    const hasImage = mirielBoardManualImageData !== "";
    const hasText = mirielBoardManualText.trim() !== "";
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
        ? `<img src="${escapeHtml(mirielBoardManualImageData)}" alt="${escapeHtml(mirielBoardManualImageName || "Eigene Tafel")}">`
        : "";
    const textHtml = hasText === true
        ? `<div class="miriel-board-manual-preview-text miriel-board-manual-text-${mirielBoardManualTextSize} miriel-board-text-position-${mirielBoardManualTextPosition}">${escapeHtml(mirielBoardManualText).replace(/\n/g, "<br>")}</div>`
        : "";
    const fileHtml = hasImage === true
        ? `<small>Datei: ${escapeHtml(mirielBoardManualImageName || "Eigenes Bild")}</small>`
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

    const isEncounterStartAnnouncement = mirielBoardAnnouncement !== null
        && typeof mirielBoardAnnouncement === "object"
        && mirielBoardAnnouncement.type === "encounter-start";
    const blocksAutoTrigger = isEncounterStartAnnouncement !== true
        && mirielBoardPersistentMode === "manual"
        && hasMirielBoardManualContent() === true;
    const hasNewAutoTrigger = blocksAutoTrigger !== true
        && mirielBoardTriggerId !== ""
        && mirielBoardTriggerId !== lastRenderedMirielBoardTriggerId
        && isMirielBoardTriggerFresh() === true;
    const shouldShowBoard = mirielBoardPersistentMode !== "off" || hasNewAutoTrigger === true;
    const activeCard = getActiveCard(getHandCards());
    const announcement = hasNewAutoTrigger === true && mirielBoardAnnouncement !== null
        ? mirielBoardAnnouncement
        : getCurrentMirielBoardAnnouncement(activeCard);
    const contentMode = hasNewAutoTrigger === true
        ? "overview"
        : (mirielBoardPersistentMode === "manual" && hasMirielBoardManualContent() === true ? "manual" : "overview");
    const persistentModeChangedSinceLastRender = mirielBoardPersistentMode !== "off"
        && lastRenderedMirielBoardPersistentMode !== null
        && lastRenderedMirielBoardPersistentMode !== mirielBoardPersistentMode;
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
    if (publicStagePendingCreatureId === null) {
        return;
    }

    const stageRailState = capturePublicStageRailState();

    publicStagePresentedCreatureId = publicStagePendingCreatureId;
    publicStagePendingCreatureId = null;

    renderCards();
    playPublicStageRailTransition(stageRailState);
}

function hideMirielBoardAfterAutoPreview() {
    const boardElement = document.querySelector("#miriel-board-overlay");

    if (boardElement === null) {
        return;
    }

    lastRenderedMirielBoardTriggerId = mirielBoardTriggerId;
    mirielBoardAnnouncement = null;

    if (mirielBoardPersistentMode !== "off") {
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

    if (mirielBoardDurationMode === "short") {
        return Math.round(clampNumber(2600 + (safeCardCount * 40) + (newRoundBonus * 250), 2600, 3600));
    }

    if (mirielBoardDurationMode === "long") {
        return Math.round(clampNumber(5600 + (safeCardCount * 75) + (newRoundBonus * 500), 5600, 7600));
    }

    return Math.round(clampNumber(3900 + (safeCardCount * 55) + (newRoundBonus * 350), 3900, 5200));
}


function isMirielBoardTriggerFresh() {
    if (mirielBoardTriggerId === "") {
        return false;
    }

    const announcement = mirielBoardAnnouncement !== null && typeof mirielBoardAnnouncement === "object"
        ? mirielBoardAnnouncement
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
        publicStagePendingCreatureId = null;
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
        lastRenderedMirielBoardPersistentMode = mirielBoardPersistentMode;
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
    lastRenderedMirielBoardPersistentMode = mirielBoardPersistentMode;
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
        : { isNewRound: false, roundNumber: roundNumber };

    if (announcement.isNewRound !== true) {
        return "";
    }

    const alertCards = getVisibleHealthAlertsForPublicBoard(publicCards);
    const safeRoundNumber = getSafePositiveInteger(announcement.roundNumber, roundNumber);

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
    const hasImage = mirielBoardManualImageData !== "";
    const hasText = mirielBoardManualText.trim() !== "";
    const textSizeClass = `miriel-board-manual-text-${mirielBoardManualTextSize}`;
    const textPositionClass = `miriel-board-text-position-${mirielBoardManualTextPosition}`;
    const mediaClass = hasImage === true ? "has-image" : "text-only";
    const imageHtml = hasImage === true
        ? `<img src="${escapeHtml(mirielBoardManualImageData)}" alt="${escapeHtml(mirielBoardManualImageName || "Eigene Tafel")}">`
        : "";
    const textHtml = hasText === true
        ? `<div class="miriel-board-manual-text ${textSizeClass} ${textPositionClass}">${escapeHtml(mirielBoardManualText).replace(/\n/g, "<br>")}</div>`
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

function getHealthPresentation(creature, shouldRevealHealth) {
    const safeMaxHp = Number(creature.maxHp) > 0 ? Number(creature.maxHp) : 0;
    const safeHp = Number(creature.hp);

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

function getHealthPresentationForCreature(creature) {
    return getHealthPresentation(creature, creature.hpVisibility !== "hidden");
}

function createPublicHpData(creature) {
    const hasTempHp = creature.tempHp > 0;
    const shouldRevealHealth = creature.hpVisibility !== "hidden";
    const healthPresentation = getHealthPresentation(creature, shouldRevealHealth);

    if (creature.hpVisibility === "full") {
        return {
            mode: "full",
            hp: creature.hp,
            maxHp: creature.maxHp,
            percent: getHpPercent(creature),
            tempHp: creature.tempHp,
            hasTempHp: hasTempHp,
            tempHpPercent: getTempHpPercent(creature),
            health: healthPresentation
        };
    }

    if (creature.hpVisibility === "bar") {
        return {
            mode: "bar",
            percent: getHpPercent(creature),
            hasTempHp: hasTempHp,
            tempHpPercent: getTempHpPercent(creature),
            health: healthPresentation
        };
    }

    if (creature.hpVisibility === "descriptive") {
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

function createPublicCardData(creature, isActive, isFocused) {
    const publicName = getSafeOptionalString(creature.publicName) || getSafeOptionalString(creature.name) || "Unbenannte Karte";
    const conditionList = Array.isArray(creature.conditions) ? creature.conditions : [];

    return {
        id: creature.id,
        publicName: publicName,
        type: getSafeCreatureType(creature.type),
        initiative: getSafeInteger(creature.initiative, 0),
        imageData: getSafeOptionalString(creature.imageData),
        hp: createPublicHpData(creature),
        conditions: conditionList.slice(),
        isActive: isActive,
        isFocused: isFocused,
        isInTurnOrder: creature.isInitiativeActive !== false,
        isOutOfAction: isCreatureOutOfAction(creature)
    };
}

function shouldPublicCardBeFocused(card, activeCard) {
    const isActive = activeCard !== null && card.id === activeCard.id;

    if (shouldPublicPreviewFollowActiveCard()) {
        return isActive;
    }

    return isCreatureManuallySelected(card);
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

    if (publicCards.length < 5) {
        return {
            ghostPreviousCard: null,
            previousCard: publicCards[previousIndex],
            focusedCard: publicCards[focusedIndex],
            nextCard: publicCards[nextIndex],
            ghostNextCard: null
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

function createCreatureImageHtml(creature) {
    const healthPresentation = getHealthPresentationForCreature(creature);

    if (creature.imageData === "") {
        return `
            <div
                class="creature-image-box creature-image-placeholder health-wound-frame dm-wound-frame ${healthPresentation.stateClass}"
                style="${healthPresentation.style}"
            >
                Bild folgt
            </div>
        `;
    }

    return `
        <div
            class="creature-image-box health-wound-frame dm-wound-frame ${healthPresentation.stateClass}"
            style="${healthPresentation.style}"
        >
            <img
                class="creature-image"
                src="${creature.imageData}"
                alt="Bild von ${creature.publicName}"
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
                class="public-preview-image-box public-preview-image-placeholder health-wound-frame ${contextClass} ${health.stateClass}"
                style="${health.style}"
            >
                Bild folgt
            </div>
        `;
    }

    return `
        <div
            class="public-preview-image-box health-wound-frame ${contextClass} ${health.stateClass}"
            style="${health.style}"
        >
            <img
                class="public-preview-image"
                src="${publicCard.imageData}"
                alt="Bild von ${publicCard.publicName}"
            >
        </div>
    `;
}

function createDmHpBarHtml(creature) {
    const hpPercent = getHpPercent(creature);

    return `
        <div class="dm-resource-meter dm-hp-meter" title="HP ${creature.hp} von ${creature.maxHp}">
            <div
                class="dm-resource-meter-fill dm-hp-meter-fill"
                style="width: ${hpPercent}%;"
            ></div>
            <span class="dm-resource-meter-label">${creature.hp <= 0 ? "0 HP · Initiative prüfen" : `HP ${creature.hp} / ${creature.maxHp}`}</span>
            ${creature.hp <= 0 ? '<span class="dm-zero-hp-overlay" aria-hidden="true"></span>' : ""}
        </div>
    `;
}

function createDmTempHpBarHtml(creature) {
    const tempHpPercent = getTempHpPercent(creature);

    return `
        <div class="dm-resource-meter dm-temp-hp-meter" title="Temporary HP ${creature.tempHp}">
            <div
                class="dm-resource-meter-fill dm-temp-hp-meter-fill"
                style="width: ${tempHpPercent}%;"
            ></div>
            <span class="dm-resource-meter-label">Temp HP ${creature.tempHp}</span>
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
            <div class="public-preview-section-box public-vital-box public-vital-box-full">
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
            <div class="public-preview-section-box public-vital-box public-vital-box-bar" aria-label="Öffentlicher HP-Balken">
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
                    ${getConditionLabel(condition)}
                </span>
            </span>
        `;
    }

    return html;
}

function createPublicConditionChipsHtml(publicCard) {
    if (publicCard.conditions.length === 0) {
        return `
            <p class="condition-empty">
                Keine Conditions sichtbar.
            </p>
        `;
    }

    let html = "";

    for (const condition of publicCard.conditions) {
        html += `
            <span class="condition-chip ${getConditionClassName(condition)}">
                <span class="condition-chip-name">
                    ${getConditionLabel(condition)}
                </span>
            </span>
        `;
    }

    return html;
}


function getForgeTraitsDraft(prefix) {
    const traitsElement = document.querySelector(`#${prefix}-traits-text`);

    if (traitsElement === null || traitsElement.value.trim() === "") {
        return [];
    }

    return getSafeCreatureTraits(parseJsonValue(traitsElement.value.trim(), []), "");
}

function setForgeTraits(prefix, traits) {
    const traitsElement = document.querySelector(`#${prefix}-traits-text`);

    if (traitsElement === null) {
        return;
    }

    traitsElement.value = JSON.stringify(getSafeCreatureTraits(traits, ""));
}

function writeTraitsToForge(prefix, creature) {
    setForgeTraits(prefix, getCreatureTraits(creature));
    renderForgeTraitManager(prefix);
}

function commitForgeTraitsIfEditing(prefix) {
    if (prefix !== "edit-creature") {
        return;
    }

    const creature = getEditFormCreature();

    if (creature === null) {
        return;
    }

    creature.traits = getForgeTraitsDraft(prefix);

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
    const trait = createCreatureTrait({ name: "Neuer Trait", category: "other" }, Date.now());
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
    const nextTrait = createCreatureTrait({
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
    const actionHint = trait.showAsAction === true ? ` · ${creatureActionTypeSingularLabels[trait.actionType] || "Aktion"}` : "";

    return `
        <div class="forge-trait-row ${editorIsOpen ? "forge-trait-row-active" : ""}">
            <span class="forge-action-type-pill">${escapeHtml(creatureTraitCategoryLabels[trait.category] || "Trait")}</span>
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
    const safeTrait = trait || createCreatureTrait({ name: "", category: "other" }, 0);
    const categoryOptions = Object.keys(creatureTraitCategoryLabels).map(function(key) {
        return `<option value="${key}"${safeTrait.category === key ? " selected" : ""}>${creatureTraitCategoryLabels[key]}</option>`;
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

    if (shouldPublicPreviewFollowActiveCard()) {
        return "Am Zug";
    }

    return "Ausgewählt";
}

function getPublicStageFocusClass(slotName) {
    if (slotName !== "focused") {
        return "";
    }

    if (shouldPublicPreviewFollowActiveCard()) {
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

                    <div class="public-preview-image-box public-preview-image-placeholder">
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
    const shouldShowConditionBlock = isGhostSlot !== true && (isFocusedSlot === true || publicCard.conditions.length > 0);
    const conditionBlock = shouldShowConditionBlock ? `
        <div class="public-preview-section-box public-condition-box">
            <h4>Conditions</h4>

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
                data-creature-id="${publicCard.id}"
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

                    <p class="public-preview-type">
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
            data-creature-id="${publicCard.id}"
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
    const turnText = activeCard !== null ? `${currentTurnIndex + 1} / ${initiativeCards.length}` : "—";
    const roundText = activeCard !== null ? `${roundNumber}` : "—";

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

function createCardMenuHtml(creature) {
    const isOnHand = creature.isInCombat === true;
    const isFocusedDeckCard = creature.isInCombat !== true && focusedCreatureId === creature.id;
    const deckFocusButtonHtml = isFocusedDeckCard
        ? `
                <button type="button" onclick="showDeckCardFromFocus(${creature.id})">
                    Aus Fokus entfernen
                </button>
        `
        : `
                <button type="button" onclick="setFocusedDeckCreature(${creature.id})">
                    In den Fokus nehmen
                </button>
        `;
    const turnOrderButtonHtml = isOnHand
        ? `
                <button type="button" onclick="toggleCreatureTurnOrder(${creature.id})">
                    ${creature.isInitiativeActive === false ? "Wieder in die Zugfolge aufnehmen" : "Aus der Zugfolge nehmen"}
                </button>
        `
        : "";
    const movementButtonHtml = isOnHand
        ? `
                ${turnOrderButtonHtml}

                <button type="button" onclick="moveCardToDeck(${creature.id})">
                    Karte ins Deck verschieben
                </button>
        `
        : `
                ${deckFocusButtonHtml}

                <button type="button" onclick="moveCardToHand(${creature.id})">
                    Karte auf die Hand nehmen
                </button>
        `;

    return `
        <details class="card-menu" onclick="event.stopPropagation()">
            <summary
                class="card-menu-summary"
                title="Kartenmenü öffnen"
                aria-label="Kartenmenü öffnen"
            >
                ☰
            </summary>

            <div class="card-menu-panel">
                <button type="button" onclick="openEditCreatureForm(${creature.id})">
                    Karte bearbeiten
                </button>

                <button type="button" onclick="copyCreatureToDeck(${creature.id})">
                    Karte kopieren
                </button>

                ${movementButtonHtml}

                <button
                    class="card-menu-danger"
                    onclick="removeCreatureById(${creature.id})"
                    type="button"
                >
                    Karte entfernen
                </button>
            </div>
        </details>
    `;
}

function createCreatureCardHtml(creature, isActive) {
    const isCompactDeckCard = creature.isInCombat === false;

    const selectableCardClass = "selectable-card";

    const selectedTargetCardClass = creature.isInCombat === true && creature.isSelected === true
        ? "selected-target-card"
        : "";

    const selectedDeckCardClass = creature.isInCombat === false && creature.isSelected === true
        ? "selected-deck-card"
        : "";

    const selectionClickAttribute = `onclick="toggleCreatureSelection(${creature.id})"`;

    let selectedTargetLabelHtml = "";

    if (creature.isInCombat === true && creature.isSelected === true) {
        selectedTargetLabelHtml = `<span class="selected-target-label">Ziel</span>`;
    }

    if (creature.isInCombat === false && creature.isSelected === true) {
        selectedTargetLabelHtml = `<span class="selected-deck-label">Deck-Auswahl</span>`;
    }

    const conditionsSectionHtml = creature.isInCombat === true
        ? `
            <div class="creature-card-section">
                <h4>Conditions</h4>

                <div class="condition-chip-list">
                    ${createConditionChipsHtml(creature)}
                </div>
            </div>
        `
        : "";

    return `
        <article
            class="creature-card ${isActive ? "active" : ""} ${isCompactDeckCard ? "deck-card-compact" : ""} ${selectableCardClass} ${selectedTargetCardClass} ${selectedDeckCardClass}"
            ${selectionClickAttribute}
        >
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

                ${createCreatureImageHtml(creature)}

                <div class="creature-type-line">
                    <p>
                        ${creature.type} · ${creature.isInCombat ? "auf der Hand" : "im Deck"}
                    </p>

                    ${selectedTargetLabelHtml}
                </div>

                <div class="creature-card-section">
                    <h4>HP</h4>

                    <div class="creature-stat-grid">
                        <p>Aktuell: ${creature.hp} / ${creature.maxHp}</p>
                        <p>Temp: ${creature.tempHp}</p>
                    </div>

                    ${createDmHpBarHtml(creature)}
                    ${createDmTempHpBarHtml(creature)}
                    ${getPublicHpDisplayHtml(creature)}
                </div>

                <div class="creature-card-section">
                    <h4>Kampfwerte</h4>

                    <div class="creature-stat-grid">
                        <p>Initiative: ${creature.initiative}</p>
                        <p>AC: ${creature.armorClass}</p>
                    </div>
                </div>

                <div class="creature-card-section">
                    <h4>Passive Werte</h4>

                    <div class="creature-stat-grid">
                        <p>Perception: ${creature.passivePerception}</p>
                        <p>Insight: ${creature.passiveInsight}</p>
                        <p>Investigation: ${creature.passiveInvestigation}</p>
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

function showEditCreatureError(message) {
    const errorElement = document.querySelector("#edit-creature-error");

    if (errorElement === null) {
        return;
    }

    errorElement.textContent = message;
}

function clearEditCreatureError() {
    showEditCreatureError("");
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

function getEditFormCreature() {
    if (editingCreatureId === null) {
        return null;
    }

    return findCreatureById(editingCreatureId);
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
    const turnText = initiativeCards.length > 0 ? `Turn ${currentTurnIndex + 1} von ${initiativeCards.length}` : "keine aktive Zugfolge";

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
    openEditCreatureForm(focusedCard.id);
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
    const editSectionElement = document.querySelector("#edit-creature-section");
    const addSectionElement = document.querySelector(".card-forge .add-creature-section");
    const editImageInputElement = document.querySelector("#edit-creature-image");

    editingCreatureId = null;
    clearEditCreatureError();
    clearAddCreatureError();

    if (editImageInputElement !== null) {
        editImageInputElement.value = "";
    }

    if (editSectionElement !== null) {
        editSectionElement.classList.add("edit-creature-section-hidden");
        editSectionElement.classList.add("card-forge-panel-hidden");
    }

    if (addSectionElement !== null) {
        addSectionElement.classList.remove("card-forge-panel-hidden");
    }

    activeForgeSpellEditor = null;
    activeForgeActionEditor = null;
    activeForgeTraitEditor = null;
    activeForgeInventoryEditor = null;
    setForgeActions("new-creature", []);
    setForgeTraits("new-creature", []);
    setForgeInventory("new-creature", createEmptyInventoryData());
    renderForgeActionManager("new-creature");
    renderForgeTraitManager("new-creature");
    renderForgeSpellManager("new-creature");
    setForgeNotes("new-creature", "");
    renderForgeInventoryManager("new-creature");
    renderNewConditionCheckboxes();
    clearNewConditionCheckboxes();
    openCardForgeDrawer();
    setForgeTab("basis");
}

function openEditCreatureForm(creatureId) {
    const creature = findCreatureById(creatureId);
    const editSectionElement = document.querySelector("#edit-creature-section");
    const editTitleElement = document.querySelector("#edit-creature-title");
    const imageInputElement = document.querySelector("#edit-creature-image");

    if (creature === null || editSectionElement === null) {
        return;
    }

    editingCreatureId = creatureId;
    clearEditCreatureError();

    if (editTitleElement !== null) {
        editTitleElement.textContent = `Karte bearbeiten: ${creature.name}`;
    }

    setInputValue("edit-creature-name", creature.name);
    setInputValue("edit-creature-public-name", creature.publicName);
    setInputValue("edit-creature-type", creature.type);
    setInputValue("edit-creature-image-path", creature.imageData);
    setInputValue("edit-creature-initiative", creature.initiative);
    setInputValue("edit-creature-initiative-modifier", creature.initiativeModifier || creature.dexterityModifier || "+0");
    setInputValue("edit-creature-hp", creature.hp);
    setInputValue("edit-creature-max-hp", creature.maxHp);
    setInputValue("edit-creature-temp-hp", creature.tempHp);
    setInputValue("edit-creature-ac", creature.armorClass);
    setInputValue("edit-creature-passive-perception", creature.passivePerception);
    setInputValue("edit-creature-passive-insight", creature.passiveInsight);
    setInputValue("edit-creature-passive-investigation", creature.passiveInvestigation);
    setInputValue("edit-creature-strength-score", creature.strengthScore || 10);
    setInputValue("edit-creature-strength-modifier", creature.strengthModifier || "+0");
    setInputValue("edit-creature-dexterity-score", creature.dexterityScore || 10);
    setInputValue("edit-creature-dexterity-modifier", creature.dexterityModifier || "+0");
    setInputValue("edit-creature-constitution-score", creature.constitutionScore || 10);
    setInputValue("edit-creature-constitution-modifier", creature.constitutionModifier || "+0");
    setInputValue("edit-creature-intelligence-score", creature.intelligenceScore || 10);
    setInputValue("edit-creature-intelligence-modifier", creature.intelligenceModifier || "+0");
    setInputValue("edit-creature-wisdom-score", creature.wisdomScore || 10);
    setInputValue("edit-creature-wisdom-modifier", creature.wisdomModifier || "+0");
    setInputValue("edit-creature-charisma-score", creature.charismaScore || 10);
    setInputValue("edit-creature-charisma-modifier", creature.charismaModifier || "+0");
    setInputValue("edit-creature-speed", creature.speed || "");
    setInputValue("edit-creature-saving-throws", creature.savingThrows || "");
    setInputValue("edit-creature-resistances", creature.resistances || "");
    setInputValue("edit-creature-immunities", creature.immunities || "");
    setInputValue("edit-creature-vulnerabilities", creature.vulnerabilities || "");
    setInputValue("edit-creature-senses", creature.senses || "");
    setInputValue("edit-creature-special-resources", creature.specialResources || "");
    writeTraitsToForge("edit-creature", creature);
    writeActionsToForge("edit-creature", creature);
    setForgeNotes("edit-creature", creature.notes || "");
    writeSpellcastingToForge("edit-creature", creature);
    renderForgeSpellManager("edit-creature");
    writeInventoryToForge("edit-creature", creature);
    renderForgeInventoryManager("edit-creature");
    setInputValue("edit-creature-hp-visibility", creature.hpVisibility);
    setCheckboxValue("edit-creature-is-in-combat", creature.isInCombat === true);

    renderEditConditionCheckboxes();
    setEditConditionCheckboxes(creature);

    if (imageInputElement !== null) {
        imageInputElement.value = "";
    }

    const addSectionElement = document.querySelector(".card-forge .add-creature-section");

    if (addSectionElement !== null) {
        addSectionElement.classList.add("card-forge-panel-hidden");
    }

    editSectionElement.classList.remove("edit-creature-section-hidden");
    editSectionElement.classList.remove("card-forge-panel-hidden");

    openCardForgeDrawer();
    setForgeTab("basis");
}

function closeEditCreatureForm() {
    const editSectionElement = document.querySelector("#edit-creature-section");
    const imageInputElement = document.querySelector("#edit-creature-image");

    editingCreatureId = null;
    activeForgeSpellEditor = null;
    activeForgeActionEditor = null;
    activeForgeTraitEditor = null;
    activeForgeInventoryEditor = null;
    clearEditCreatureError();

    if (imageInputElement !== null) {
        imageInputElement.value = "";
    }

    if (editSectionElement !== null) {
        editSectionElement.classList.add("edit-creature-section-hidden");
        editSectionElement.classList.add("card-forge-panel-hidden");
    }

    const addSectionElement = document.querySelector(".card-forge .add-creature-section");

    if (addSectionElement !== null) {
        addSectionElement.classList.remove("card-forge-panel-hidden");
    }

    closeCardForgeDrawer();
}

async function handleEditCreatureSaveButtonClick() {
    clearEditCreatureError();
    const scrollSnapshot = getViewportScrollSnapshot();

    const creature = getEditFormCreature();

    if (creature === null) {
        showEditCreatureError("Es ist keine Karte zum Bearbeiten geöffnet.");
        return;
    }

    const nameInputElement = document.querySelector("#edit-creature-name");
    const publicNameInputElement = document.querySelector("#edit-creature-public-name");
    const typeSelectElement = document.querySelector("#edit-creature-type");
    const imagePathInputElement = document.querySelector("#edit-creature-image-path");
    const imageInputElement = document.querySelector("#edit-creature-image");
    const initiativeInputElement = document.querySelector("#edit-creature-initiative");
    const initiativeModifierInputElement = document.querySelector("#edit-creature-initiative-modifier");
    const hpInputElement = document.querySelector("#edit-creature-hp");
    const maxHpInputElement = document.querySelector("#edit-creature-max-hp");
    const tempHpInputElement = document.querySelector("#edit-creature-temp-hp");
    const acInputElement = document.querySelector("#edit-creature-ac");
    const passivePerceptionInputElement = document.querySelector("#edit-creature-passive-perception");
    const passiveInsightInputElement = document.querySelector("#edit-creature-passive-insight");
    const passiveInvestigationInputElement = document.querySelector("#edit-creature-passive-investigation");
    const strengthScoreInputElement = document.querySelector("#edit-creature-strength-score");
    const strengthModifierInputElement = document.querySelector("#edit-creature-strength-modifier");
    const dexterityScoreInputElement = document.querySelector("#edit-creature-dexterity-score");
    const dexterityModifierInputElement = document.querySelector("#edit-creature-dexterity-modifier");
    const constitutionScoreInputElement = document.querySelector("#edit-creature-constitution-score");
    const constitutionModifierInputElement = document.querySelector("#edit-creature-constitution-modifier");
    const intelligenceScoreInputElement = document.querySelector("#edit-creature-intelligence-score");
    const intelligenceModifierInputElement = document.querySelector("#edit-creature-intelligence-modifier");
    const wisdomScoreInputElement = document.querySelector("#edit-creature-wisdom-score");
    const wisdomModifierInputElement = document.querySelector("#edit-creature-wisdom-modifier");
    const charismaScoreInputElement = document.querySelector("#edit-creature-charisma-score");
    const charismaModifierInputElement = document.querySelector("#edit-creature-charisma-modifier");
    const speedInputElement = document.querySelector("#edit-creature-speed");
    const savingThrowsInputElement = document.querySelector("#edit-creature-saving-throws");
    const resistancesInputElement = document.querySelector("#edit-creature-resistances");
    const immunitiesInputElement = document.querySelector("#edit-creature-immunities");
    const vulnerabilitiesInputElement = document.querySelector("#edit-creature-vulnerabilities");
    const sensesInputElement = document.querySelector("#edit-creature-senses");
    const specialResourcesInputElement = document.querySelector("#edit-creature-special-resources");
    const notesInputElement = document.querySelector("#edit-creature-notes");
    const hpVisibilitySelectElement = document.querySelector("#edit-creature-hp-visibility");
    const isInCombatInputElement = document.querySelector("#edit-creature-is-in-combat");
    const conditionListElement = document.querySelector("#edit-creature-condition-list");

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
        isInCombatInputElement === null ||
        conditionListElement === null
    ) {
        showEditCreatureError("Ein Bearbeitungsfeld wurde nicht gefunden. Bitte prüfe die IDs in index.html.");
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
        showEditCreatureError("Bitte gib einen internen Namen ein.");
        return;
    }

    if (publicName === "") {
        showEditCreatureError("Bitte gib einen öffentlichen Namen ein.");
        return;
    }

    if (Number.isFinite(initiative) === false) {
        showEditCreatureError("Initiative muss eine Zahl sein.");
        return;
    }

    if (Number.isFinite(hp) === false || hp < 0) {
        showEditCreatureError("HP müssen eine Zahl ab 0 sein.");
        return;
    }

    if (Number.isFinite(maxHp) === false || maxHp <= 0) {
        showEditCreatureError("Max HP müssen größer als 0 sein.");
        return;
    }

    if (hp > maxHp) {
        showEditCreatureError("Aktuelle HP dürfen nicht größer als Max HP sein.");
        return;
    }

    if (Number.isFinite(tempHp) === false || tempHp < 0) {
        showEditCreatureError("Temp HP müssen eine Zahl ab 0 sein.");
        return;
    }

    if (Number.isFinite(armorClass) === false || armorClass < 0) {
        showEditCreatureError("AC muss eine Zahl ab 0 sein.");
        return;
    }

    if (Number.isFinite(passivePerception) === false || passivePerception < 0) {
        showEditCreatureError("Passive Perception muss eine Zahl ab 0 sein.");
        return;
    }

    if (Number.isFinite(passiveInsight) === false || passiveInsight < 0) {
        showEditCreatureError("Passive Insight muss eine Zahl ab 0 sein.");
        return;
    }

    if (Number.isFinite(passiveInvestigation) === false || passiveInvestigation < 0) {
        showEditCreatureError("Passive Investigation muss eine Zahl ab 0 sein.");
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
        showEditCreatureError("Attribute müssen Zahlen sein.");
        return;
    }

    let imageData = imagePathInputElement.value.trim();

    if (imageInputElement.files.length > 0) {
        const imageFile = imageInputElement.files[0];

        try {
            imageData = await readImageFileAsDataUrl(imageFile);
        } catch (error) {
            showEditCreatureError("Das Bild konnte nicht gelesen werden.");
            return;
        }
    }

    const oldName = creature.name;

    creature.name = name;
    creature.publicName = publicName;
    creature.type = typeSelectElement.value;
    creature.initiative = Math.floor(initiative);
    creature.initiativeModifier = initiativeModifierInputElement.value.trim() || dexterityModifierInputElement.value.trim() || "+0";
    creature.hp = Math.floor(hp);
    creature.maxHp = Math.floor(maxHp);
    creature.tempHp = Math.floor(tempHp);
    creature.armorClass = Math.floor(armorClass);
    creature.passivePerception = Math.floor(passivePerception);
    creature.passiveInsight = Math.floor(passiveInsight);
    creature.passiveInvestigation = Math.floor(passiveInvestigation);
    creature.strengthScore = Math.floor(strengthScore);
    creature.strengthModifier = strengthModifierInputElement.value.trim() || "+0";
    creature.dexterityScore = Math.floor(dexterityScore);
    creature.dexterityModifier = dexterityModifierInputElement.value.trim() || "+0";
    creature.constitutionScore = Math.floor(constitutionScore);
    creature.constitutionModifier = constitutionModifierInputElement.value.trim() || "+0";
    creature.intelligenceScore = Math.floor(intelligenceScore);
    creature.intelligenceModifier = intelligenceModifierInputElement.value.trim() || "+0";
    creature.wisdomScore = Math.floor(wisdomScore);
    creature.wisdomModifier = wisdomModifierInputElement.value.trim() || "+0";
    creature.charismaScore = Math.floor(charismaScore);
    creature.charismaModifier = charismaModifierInputElement.value.trim() || "+0";
    creature.speed = speedInputElement.value.trim();
    creature.savingThrows = savingThrowsInputElement.value.trim();
    creature.resistances = resistancesInputElement.value.trim();
    creature.immunities = immunitiesInputElement.value.trim();
    creature.vulnerabilities = vulnerabilitiesInputElement.value.trim();
    creature.senses = sensesInputElement.value.trim();
    creature.spellcasting = readSpellcastingFromForge("edit-creature");
    creature.spellSaveDc = createCreatureSpellSaveDcText(creature.spellcasting);
    creature.specialResources = specialResourcesInputElement.value.trim();
    creature.traits = getForgeTraitsDraft("edit-creature");
    creature.actions = getForgeActionsDraft("edit-creature");
    creature.notes = getForgeNotesText("edit-creature");
    const nextInventory = readInventoryFromForge("edit-creature");
    creature.currency = nextInventory.currency;
    creature.inventoryCards = nextInventory.cards;
    creature.inventoryList = nextInventory.list;
    creature.hpVisibility = hpVisibilitySelectElement.value;
    creature.imageData = imageData;
    creature.conditions = getEditConditionValues();
    creature.isInCombat = isInCombatInputElement.checked;
    creature.isSelected = false;

    if (manuallySelectedPublicCardId === creature.id && creature.isInCombat === false) {
        clearManualPublicSelection();
    }

    const handCards = getHandCards();
    ensureCurrentTurnIndexIsValid(handCards);

    addCombatLogMessage(`Karte bearbeitet: ${oldName} → ${creature.name}.`);
    closeEditCreatureForm();
    renderCards();
    restoreViewportScrollSnapshotRobustly(scrollSnapshot);
}

// ============================================================
// 16. Formular: Neue Karte hinzufügen
// ============================================================

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

async function handleAddCreatureButtonClick() {
    clearAddCreatureError();

    const nameInputElement = document.querySelector("#new-creature-name");
    const publicNameInputElement = document.querySelector("#new-creature-public-name");
    const typeSelectElement = document.querySelector("#new-creature-type");
    const quantityInputElement = document.querySelector("#new-creature-quantity");
    const imageInputElement = document.querySelector("#new-creature-image");
    const initiativeInputElement = document.querySelector("#new-creature-initiative");
    const initiativeModifierInputElement = document.querySelector("#new-creature-initiative-modifier");
    const hpInputElement = document.querySelector("#new-creature-hp");
    const maxHpInputElement = document.querySelector("#new-creature-max-hp");
    const tempHpInputElement = document.querySelector("#new-creature-temp-hp");
    const hpVisibilitySelectElement = document.querySelector("#new-creature-hp-visibility");
    const acInputElement = document.querySelector("#new-creature-ac");
    const passivePerceptionInputElement = document.querySelector("#new-creature-passive-perception");
    const passiveInsightInputElement = document.querySelector("#new-creature-passive-insight");
    const passiveInvestigationInputElement = document.querySelector("#new-creature-passive-investigation");
    const strengthScoreInputElement = document.querySelector("#new-creature-strength-score");
    const strengthModifierInputElement = document.querySelector("#new-creature-strength-modifier");
    const dexterityScoreInputElement = document.querySelector("#new-creature-dexterity-score");
    const dexterityModifierInputElement = document.querySelector("#new-creature-dexterity-modifier");
    const constitutionScoreInputElement = document.querySelector("#new-creature-constitution-score");
    const constitutionModifierInputElement = document.querySelector("#new-creature-constitution-modifier");
    const intelligenceScoreInputElement = document.querySelector("#new-creature-intelligence-score");
    const intelligenceModifierInputElement = document.querySelector("#new-creature-intelligence-modifier");
    const wisdomScoreInputElement = document.querySelector("#new-creature-wisdom-score");
    const wisdomModifierInputElement = document.querySelector("#new-creature-wisdom-modifier");
    const charismaScoreInputElement = document.querySelector("#new-creature-charisma-score");
    const charismaModifierInputElement = document.querySelector("#new-creature-charisma-modifier");
    const speedInputElement = document.querySelector("#new-creature-speed");
    const savingThrowsInputElement = document.querySelector("#new-creature-saving-throws");
    const resistancesInputElement = document.querySelector("#new-creature-resistances");
    const immunitiesInputElement = document.querySelector("#new-creature-immunities");
    const vulnerabilitiesInputElement = document.querySelector("#new-creature-vulnerabilities");
    const sensesInputElement = document.querySelector("#new-creature-senses");
    const specialResourcesInputElement = document.querySelector("#new-creature-special-resources");
    const notesInputElement = document.querySelector("#new-creature-notes");
    const isInCombatInputElement = document.querySelector("#new-creature-is-in-combat");
    const conditionListElement = document.querySelector("#new-creature-condition-list");

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
        showAddCreatureError("Ein Formularfeld wurde nicht gefunden. Bitte prüfe die IDs in index.html.");
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

    if (Number.isFinite(tempHp) === false || tempHp < 0) {
        showAddCreatureError("Temp HP müssen eine Zahl ab 0 sein.");
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

    if (passiveInvestigation < 0) {
        showAddCreatureError("Passive Investigation darf nicht negativ sein.");
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
        showAddCreatureError("Attribute müssen Zahlen sein.");
        return;
    }

    let imageData = "";

    if (imageInputElement.files.length > 0) {
        const imageFile = imageInputElement.files[0];

        try {
            imageData = await readImageFileAsDataUrl(imageFile);
        } catch (error) {
            showAddCreatureError("Das Bild konnte nicht gelesen werden.");
            return;
        }
    }

    const startConditions = getNewConditionValues();
    const createdDeckCreatureIds = [];

    for (let index = 0; index < quantity; index = index + 1) {
        const newCreatureId = getNextCreatureId();
        const newCreature = {
            id: newCreatureId,
            name: getNumberedCreatureName(name, index, quantity),
            publicName: getNumberedCreatureName(publicName, index, quantity),
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
            spellSaveDc: createCreatureSpellSaveDcText(readSpellcastingFromForge("new-creature")),
            specialResources: specialResourcesInputElement.value.trim(),
            traits: getForgeTraitsDraft("new-creature"),
            actions: getForgeActionsDraft("new-creature"),
            notes: getForgeNotesText("new-creature"),
            spellcasting: readSpellcastingFromForge("new-creature"),
            ...createInventoryFieldsFromForge("new-creature"),
            hpVisibility: hpVisibilitySelectElement.value,
            imageData: imageData,
            conditions: startConditions.slice(),
            isDemoCard: false,
            isInCombat: isInCombatInputElement.checked,
            isSelected: false
        };

        creatures.push(newCreature);

        if (newCreature.isInCombat === false) {
            createdDeckCreatureIds.push(newCreatureId);
        }
    }

    const handCards = getHandCards();
    ensureCurrentTurnIndexIsValid(handCards);

    renderCards();

    if (createdDeckCreatureIds.length > 0) {
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                scrollToDeckCard(createdDeckCreatureIds[0], true);
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
    const turnDisabledAttribute = isEncounterStarted === true && handCards.length > 0 ? "" : " disabled";
    const stateActionButtonHtml = isEncounterStarted === true
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
                <strong>Runde ${roundNumber}</strong>
                <span>Keine Handkarten</span>
            </div>
            <button class="active-round-creature-card active-round-creature-card-empty" type="button" disabled>
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
            <strong>Runde ${roundNumber}</strong>
            <span>Turn ${currentTurnIndex + 1} von ${getInitiativeCards(handCards).length}</span>
        </div>

        <button
            class="active-round-creature-card"
            type="button"
            onclick="focusActiveCreature()"
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
    if (document.body.classList.contains("player-view") === false || prefersReducedPublicMotion() === true) {
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

    // Force style application before releasing the cards onto the rail.
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
    if (document.body.classList.contains("player-view") === false) {
        return;
    }

    window.requestAnimationFrame(function() {
        const ribbonElement = document.querySelector("#public-preview-ribbon");

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
    if (document.body.classList.contains("player-view") === false) {
        return null;
    }

    if (window.matchMedia !== undefined && window.matchMedia("(prefers-reduced-motion: reduce)").matches === true) {
        return null;
    }

    const ribbonElement = document.querySelector("#public-preview-ribbon");

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

function createPublicPreviewFallbackHtml(error) {
    const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler";

    return `
        <div class="public-preview-error-card">
            <p class="section-eyebrow">Spieltisch-Anzeige</p>
            <h3>Die öffentliche Anzeige konnte nicht vollständig aufgebaut werden.</h3>
            <p>${escapeHtml(errorMessage)}</p>
        </div>
    `;
}

function getPublicStageCardsForRender(publicCards, activeCard, shouldHoldStage) {
    if (publicCards.length === 0) {
        publicStagePresentedCreatureId = null;
        publicStagePendingCreatureId = null;
        return publicCards;
    }

    const activeCreatureId = activeCard !== null ? activeCard.id : publicCards[0].id;
    const presentedCardExists = publicCards.some(function(publicCard) {
        return publicCard.id === publicStagePresentedCreatureId;
    });

    if (publicStagePresentedCreatureId === null || presentedCardExists === false || shouldPublicPreviewFollowActiveCard() === false) {
        publicStagePresentedCreatureId = activeCreatureId;
    }

    if (shouldHoldStage === true && publicStagePresentedCreatureId !== activeCreatureId) {
        publicStagePendingCreatureId = activeCreatureId;
    } else {
        publicStagePresentedCreatureId = activeCreatureId;
        publicStagePendingCreatureId = null;
    }

    if (shouldPublicPreviewFollowActiveCard() === false) {
        return publicCards;
    }

    return publicCards.map(function(publicCard) {
        return Object.assign({}, publicCard, {
            isFocused: publicCard.id === publicStagePresentedCreatureId
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

function renderPublicPreview(publicCards, handCards) {
    const previewElement = document.querySelector("#public-preview-list");
    const ribbonElement = document.querySelector("#public-preview-ribbon");
    const activeCard = getActiveCard(handCards);

    if (previewElement === null || ribbonElement === null) {
        return;
    }

    document.body.classList.toggle("encounter-not-started", isEncounterStarted !== true);

    if (isEncounterStarted !== true) {
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
        const ribbonFirstCreatureId = ribbonCards.length > 0 ? ribbonCards[0].id : null;
        const shouldAnimateRibbonAdvance = publicRibbonPresentedFirstCreatureId !== null
            && ribbonFirstCreatureId !== null
            && publicRibbonPresentedFirstCreatureId !== ribbonFirstCreatureId;

        for (const publicCard of ribbonCards) {
            ribbonHtml += createPublicRibbonCardHtml(publicCard);
        }

        publicRibbonPresentedFirstCreatureId = ribbonFirstCreatureId;

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
            lastRenderedMirielBoardTriggerId = mirielBoardTriggerId;
        }

        activateMirielBoardAfterRender();

        if (mirielBoardRenderState.hasNewAutoTrigger !== true) {
            playPublicStageRailTransition(publicStageRailState);
        }

        scrollPublicInitiativeToActiveCard();
    } catch (error) {
        console.error("Der öffentliche Spieltisch konnte nicht gerendert werden.", error);
        previewElement.innerHTML = createPublicPreviewFallbackHtml(error);
        ribbonElement.innerHTML = "";
    }
}


function createFocusedCreatureCardHtml(creature, activeCard) {
    if (creature === null) {
        return `
            <article class="focused-creature-empty focused-creature-empty-stage">
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

    const isActive = activeCard !== null && creature.id === activeCard.id;
    const isDeckFocus = creature.isInCombat !== true;
    const activeLabelHtml = isActive ? `<span class="focused-status-badge active-focus-badge">Am Zug</span>` : "";
    const deckFocusLabelHtml = isDeckFocus ? `<span class="focused-status-badge deck-focus-badge">Deckkarte · nicht aktiv</span>` : "";
    const selectedLabelHtml = creature.isSelected === true
        ? (isDeckFocus ? `<span class="selected-deck-label">Deck-Auswahl</span>` : `<span class="focused-status-badge target-focus-badge">Ziel</span>`)
        : "";
    const targetButtonText = creature.isSelected === true ? "Ziel entfernen" : "Ziel setzen";
    const targetButtonStateClass = creature.isSelected === true ? "focus-target-toggle-button-selected" : "";
    const focusActionButtonHtml = isDeckFocus
        ? `<button class="focus-target-toggle-button deck-focus-hand-button" onclick="event.stopPropagation(); moveCardToHand(${creature.id})" type="button">Auf die Hand</button>`
        : `<button class="focus-target-toggle-button ${targetButtonStateClass}" onclick="event.stopPropagation(); toggleCreatureSelection(${creature.id})" type="button">${targetButtonText}</button>`;
    const conditionCount = Array.isArray(creature.conditions) ? creature.conditions.length : 0;
    const conditionChipsHtml = createConditionChipsHtml(creature);
    const conditionMarqueeClass = conditionCount > 3 ? "focus-condition-marquee is-scrolling" : "focus-condition-marquee";
    const repeatedConditionChipsHtml = conditionCount > 3
        ? `<span class="focus-condition-track-copy" aria-hidden="true">${conditionChipsHtml}</span>`
        : "";

    return `
        <article class="active-hand-focus-card ${isActive ? "active" : ""} ${creature.isSelected ? "selected-target-card" : ""} ${isCreatureOutOfAction(creature) ? "is-out-of-action" : ""}">
            ${createOutOfActionStampHtml(creature)}
            <div class="active-hand-focus-card-inner">
                <header class="active-hand-focus-header">
                    <div class="active-hand-focus-title">
                        <h3>${creature.name}</h3>
                        <p class="creature-public-alias">aka "${creature.publicName}"</p>
                    </div>

                    ${createCardMenuHtml(creature)}
                </header>

                <div class="active-hand-focus-image">
                    ${createCreatureImageHtml(creature)}
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
                        <span class="hp-visibility-inline">Spieler sehen: ${getPublicVisibilitySummary(creature)}</span>
                    </div>
                    <div class="active-hand-focus-resource-stack">
                        ${createDmHpBarHtml(creature)}
                        ${createDmTempHpBarHtml(creature)}
                    </div>
                </div>

                <div class="active-hand-focus-section">
                    <h4 class="active-hand-focus-section-title">Kampfwerte</h4>
                    <div class="active-hand-focus-stat-grid active-hand-focus-stat-grid-two">
                        <p class="active-hand-focus-stat-tile"><span class="active-hand-focus-stat-label">Initiative</span><strong class="active-hand-focus-stat-value">${creature.initiative}</strong></p>
                        <p class="active-hand-focus-stat-tile"><span class="active-hand-focus-stat-label">Armor Class</span><strong class="active-hand-focus-stat-value">${creature.armorClass}</strong></p>
                    </div>
                </div>

                <div class="active-hand-focus-section active-hand-focus-passive-section">
                    <h4 class="active-hand-focus-section-title">Passive Werte</h4>
                    <div class="active-hand-focus-stat-grid active-hand-focus-stat-grid-three">
                        <p class="active-hand-focus-stat-tile"><span class="active-hand-focus-stat-label">Perception</span><strong class="active-hand-focus-stat-value">${creature.passivePerception}</strong></p>
                        <p class="active-hand-focus-stat-tile"><span class="active-hand-focus-stat-label">Insight</span><strong class="active-hand-focus-stat-value">${creature.passiveInsight}</strong></p>
                        <p class="active-hand-focus-stat-tile"><span class="active-hand-focus-stat-label">Investigation</span><strong class="active-hand-focus-stat-value">${creature.passiveInvestigation}</strong></p>
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

function createFocusStagePreviewCardHtml(creature, positionLabel) {
    if (creature === null) {
        return `<div class="focus-stage-ghost-card focus-stage-ghost-card-empty" aria-hidden="true"></div>`;
    }

    return `
        <div
            class="focus-stage-ghost-card focus-stage-ghost-card-${positionLabel}"
            aria-hidden="true"
        >
            <span class="focus-stage-ghost-image">
                ${createCreatureImageHtml(creature)}
            </span>
            <span class="focus-stage-ghost-title">${creature.name}</span>
            <span class="focus-stage-ghost-meta">Ini ${creature.initiative} · HP ${creature.hp}/${creature.maxHp}</span>
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
                ${createFocusedCreatureCardHtml(focusedCard, activeCard)}
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
    const activeClass = activeDetailTab === tabName ? "active-detail-tab" : "";

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

function createDetailPanelHeaderHtml(creature) {
    const creatureName = creature === null
        ? "Keine Karte"
        : (creature.publicName || creature.name);

    return `
        <header class="active-hand-details-header">
            <p class="section-eyebrow">Kartendetails</p>
            <span class="active-hand-details-subtitle">${escapeHtml(creatureName)}</span>
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

const creatureTraitCategoryLabels = {
    resource: "Ressource",
    classFeature: "Klassenfeature",
    species: "Spezies",
    feat: "Feat",
    monsterTrait: "Monstertrait",
    npc: "NPC",
    passive: "Passiv",
    other: "Sonstiges"
};

function getSafeCreatureTraitCategory(value) {
    if (value === "resource" || value === "classFeature" || value === "species" || value === "feat" || value === "monsterTrait" || value === "npc" || value === "passive" || value === "other") {
        return value;
    }

    return "other";
}

function createCreatureTrait(rawTrait = {}, fallbackIndex = 0) {
    return {
        id: getSafeOptionalString(rawTrait.id) || `trait-${Date.now()}-${fallbackIndex}-${Math.random().toString(36).slice(2, 8)}`,
        name: getSafeOptionalString(rawTrait.name) || "Neuer Trait",
        category: getSafeCreatureTraitCategory(rawTrait.category),
        description: getSafeOptionalString(rawTrait.description),
        usage: getSafeOptionalString(rawTrait.usage),
        usageMax: getSafeNonNegativeInteger(rawTrait.usageMax, inferUsageMaxFromText(rawTrait.usage)),
        usageReset: getSafeUsageReset(rawTrait.usageReset) !== "none" ? getSafeUsageReset(rawTrait.usageReset) : inferUsageResetFromText(rawTrait.usage),
        used: getSafeNonNegativeInteger(rawTrait.used, 0),
        showAsAction: rawTrait.showAsAction === true,
        actionType: getSafeCreatureActionType(rawTrait.actionType),
        actionSummary: getSafeOptionalString(rawTrait.actionSummary),
        attack: getSafeOptionalString(rawTrait.attack),
        save: getSafeOptionalString(rawTrait.save),
        range: getSafeOptionalString(rawTrait.range),
        damage: getSafeOptionalString(rawTrait.damage),
        trigger: getSafeOptionalString(rawTrait.trigger)
    };
}

function getSafeCreatureTraits(value) {
    if (Array.isArray(value) === false) {
        return [];
    }

    return value
        .filter(function(trait) { return trait !== null && typeof trait === "object"; })
        .map(function(trait, index) { return createCreatureTrait(trait, index); })
        .filter(function(trait) { return trait.name.trim() !== ""; });
}

function getCreatureTraits(creature) {
    if (creature === null) {
        return [];
    }

    return getSafeCreatureTraits(creature.traits);
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

function setExpandedActionDetail(creatureId, actionId, isOpen) {
    expandedActionDetailKey = isOpen === true ? `${creatureId}:${actionId}` : "";
}


function findUsageActionReference(creature, actionId) {
    const directAction = getCreatureActions(creature).find(function(item) { return item.id === actionId; });

    if (directAction !== undefined) {
        return directAction;
    }

    if (actionId.startsWith("trait-")) {
        const traitId = actionId.replace(/^trait-/, "");
        const trait = getCreatureTraits(creature).find(function(item) { return item.id === traitId || item.id === actionId; });
        return trait !== undefined ? createActionFromTrait(trait) : null;
    }

    if (actionId.startsWith("spell-")) {
        const spellId = actionId.replace(/^spell-/, "");
        const spell = getCreatureSpellcasting(creature).spells.find(function(item) { return item.id === spellId || item.id === actionId; });
        return spell !== undefined ? createActionFromSpell(spell) : null;
    }

    return null;
}

function saveUsageActionReference(creature, actionReference) {
    if (actionReference.sourceType === "trait") {
        const traits = getCreatureTraits(creature);
        const trait = traits.find(function(item) { return item.id === actionReference.sourceId; });
        if (trait !== undefined) {
            trait.used = actionReference.used;
            creature.traits = traits;
        }
        return;
    }

    if (actionReference.sourceType === "spell") {
        const spellcasting = getCreatureSpellcasting(creature);
        const spell = spellcasting.spells.find(function(item) { return item.id === actionReference.sourceId; });
        if (spell !== undefined) {
            spell.used = actionReference.used;
            creature.spellcasting = spellcasting;
        }
        return;
    }

    const actions = getCreatureActions(creature);
    const action = actions.find(function(item) { return item.id === actionReference.id; });
    if (action !== undefined) {
        action.used = actionReference.used;
        creature.actions = actions;
    }
}

function toggleActionUsage(creatureId, actionId, usageIndex) {
    const detailScrollTop = captureActiveDetailScrollTop();
    const creature = findCreatureById(creatureId);

    if (creature === null) {
        return;
    }

    const action = findUsageActionReference(creature, actionId);

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

    saveUsageActionReference(creature, action);
    expandedActionDetailKey = `${creatureId}:${action.id}`;

    addCombatLogMessage(`${creature.publicName || creature.name}: ${action.name} Nutzung ${getAvailableActionUsageCount(action)} / ${max}.`);
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

function createActionUsageButtonsHtml(creatureId, action) {
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
                onclick="event.preventDefault(); event.stopPropagation(); toggleActionUsage(${creatureId}, '${action.id}', ${index})"
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

function createActionDetailCardHtml(creatureId, action) {
    const usageControlsHtml = createActionUsageButtonsHtml(creatureId, action);
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

    const isOpen = expandedActionDetailKey === `${creatureId}:${action.id}`;
    const metaParts = [];
    if (action.sourceLabel !== "") {
        metaParts.push(action.sourceLabel);
    }
    metaParts.push(creatureActionTypeSingularLabels[action.type] || "Aktion");

    return `
        <details class="active-hand-entry-card active-hand-action-card active-hand-action-card-${escapeHtml(action.type)} ${isOpen ? "active-hand-action-expanded" : ""}" ${isOpen ? "open" : ""} ontoggle="setExpandedActionDetail(${creatureId}, '${action.id}', this.open)">
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

function createActionDetailGroupHtml(creatureId, type, actions) {
    if (actions.length === 0) {
        return "";
    }

    return `
        <section class="active-hand-detail-section active-hand-action-group">
            <p class="section-eyebrow">${creatureActionTypeLabels[type]}</p>
            <div class="active-hand-entry-list">
                ${actions.map(function(action) { return createActionDetailCardHtml(creatureId, action); }).join("")}
            </div>
        </section>
    `;
}


function createTraitUsageButtonsHtml(creatureId, trait) {
    return createActionUsageButtonsHtml(creatureId, createCreatureAction({
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

function createTraitDetailCardHtml(creatureId, trait) {
    const usageHtml = createTraitUsageButtonsHtml(creatureId, trait);
    const metaParts = [creatureTraitCategoryLabels[trait.category] || "Trait"];

    if (trait.showAsAction === true) {
        metaParts.push(creatureActionTypeSingularLabels[trait.actionType] || "Aktion");
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

function createTraitDetailTabHtml(creature) {
    const traits = getCreatureTraits(creature);

    return `
        <div class="active-hand-detail-content active-hand-detail-scroll active-hand-action-reference detail-tab-surface">
            <section class="active-hand-detail-section active-hand-long-section">
                <p class="section-eyebrow">Traits</p>
                <div class="active-hand-entry-list">
                    ${traits.length > 0 ? traits.map(function(trait) { return createTraitDetailCardHtml(creature.id, trait); }).join("") : `<p class="detail-placeholder-text">Keine Traits eingetragen.</p>`}
                </div>
            </section>
        </div>
    `;
}

function createActionDetailTabHtml(creature) {
    const actions = getCreatureActionReferences(creature);
    const groups = ["action", "bonus", "reaction", "special"].map(function(type) {
        return createActionDetailGroupHtml(creature.id, type, actions.filter(function(action) { return action.type === type; }));
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
    return {
        id: getSafeOptionalString(rawItem.id) || `item-${Date.now()}-${fallbackIndex}-${Math.random().toString(36).slice(2, 8)}`,
        template: getSafeOptionalString(rawItem.template),
        name: getSafeOptionalString(rawItem.name) || "Neue Itemkarte",
        category: category,
        effect: getSafeOptionalString(rawItem.effect),
        description: getSafeOptionalString(rawItem.description),
        healingFormula: getSafeOptionalString(rawItem.healingFormula),
        image: normalizeInventoryImagePath(rawItem.image, category),
        showAsAction: rawItem.showAsAction === true,
        actionType: getSafeCreatureActionType(rawItem.actionType),
        used: 0
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
        quantity: getSafePositiveInteger(rawItem.quantity, 1),
        description: getSafeOptionalString(rawItem.description) || getSafeOptionalString(rawItem.notes) || suggestion.description,
        notes: getSafeOptionalString(rawItem.notes)
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
            for (let index = 0; index < parsed.count; index = index + 1) {
                cards.push(createInventoryCardFromTemplate("supremeHealing"));
            }
        } else if (lower.includes("großer heiltrank") || lower.includes("grosser heiltrank") || lower.includes("potion of superior healing") || (lower.includes("potion of healing") && lower.includes("superior"))) {
            for (let index = 0; index < parsed.count; index = index + 1) {
                cards.push(createInventoryCardFromTemplate("superiorHealing"));
            }
        } else if (lower.includes("starker heiltrank") || lower.includes("potion of greater healing") || (lower.includes("potion of healing") && lower.includes("greater"))) {
            for (let index = 0; index < parsed.count; index = index + 1) {
                cards.push(createInventoryCardFromTemplate("greaterHealing"));
            }
        } else if (lower.includes("heiltrank") || lower.includes("potion of healing")) {
            for (let index = 0; index < parsed.count; index = index + 1) {
                cards.push(createInventoryCardFromTemplate("healing"));
            }
        } else if ((lower.includes("potion") || lower.includes("trank")) && (lower.includes("shrieker") || lower.includes("sporen") || lower.includes("custom"))) {
            const customCard = createCustomConsumableCardFromEntry(entry, cards.length);
            for (let index = 0; index < customCard.count; index = index + 1) {
                cards.push(createInventoryCard({ ...customCard.item, id: "" }, cards.length));
            }
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

function getSafeInventoryCards(value) {
    if (Array.isArray(value) === false) {
        return [];
    }

    return value
        .filter(function(item) { return item !== null && typeof item === "object"; })
        .map(function(item, index) { return createInventoryCard(item, index); })
        .filter(function(item) { return item.name.trim() !== ""; });
}

function getSafeInventoryList(value) {
    if (Array.isArray(value) === false) {
        return [];
    }

    return value
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

function getInventoryData(creature) {
    if (creature === null) {
        return createEmptyInventoryData();
    }

    return {
        currency: getSafeCurrency(creature.currency),
        cards: sortInventoryCardsForDisplay(getSafeInventoryCards(creature.inventoryCards)),
        list: sortInventoryListByName(getSafeInventoryList(creature.inventoryList))
    };
}

function getInventoryCards(creature) {
    return getInventoryData(creature).cards;
}

function syncCreatureInventoryData(creature) {
    const inventoryData = getInventoryData(creature);
    creature.currency = inventoryData.currency;
    creature.inventoryCards = inventoryData.cards;
    creature.inventoryList = inventoryData.list;
}

function createActionFromInventoryItem(item) {
    return createCreatureAction({
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

function removeInventoryCardById(creature, itemId) {
    const cards = getSafeInventoryCards(creature.inventoryCards);
    creature.inventoryCards = cards.filter(function(item) { return item.id !== itemId; });
    syncCreatureInventoryData(creature);
}

function useInventoryCard(creatureId, itemId, mode) {
    const creature = findCreatureById(creatureId);
    if (creature === null) { return; }

    const item = getInventoryCards(creature).find(function(candidate) { return candidate.id === itemId; });
    if (item === undefined) { return; }

    let logText = `${creature.publicName || creature.name} verwendet ${item.name}.`;

    if (item.healingFormula !== "") {
        const result = rollDiceFormula(item.healingFormula);
        let target = creature;
        let targetLabel = "sich selbst";

        if (mode === "target") {
            const selectedTargets = getSelectedHandCards();
            if (selectedTargets.length === 0) {
                alert("Bitte wähle zuerst eine Zielkarte auf der Hand aus.");
                return;
            }
            target = selectedTargets[0];
            targetLabel = target.publicName || target.name;
        }

        applyHealing(target, result.total);
        logText = `${creature.publicName || creature.name} verwendet ${item.name} auf ${targetLabel}: ${result.total} HP Heilung (${result.formula}: ${result.rolls.join("+")}).`;
    }

    removeInventoryCardById(creature, itemId);
    addCombatLogMessage(logText);
    saveAndBroadcastAppState();
    renderCards();
}

function addInventoryTemplateToCreature(creatureId, templateName) {
    const creature = findCreatureById(creatureId);
    if (creature === null) { return; }

    const cards = getInventoryCards(creature);
    cards.push(createInventoryCardFromTemplate(templateName));
    creature.inventoryCards = cards;
    syncCreatureInventoryData(creature);
    addCombatLogMessage(`${creature.publicName || creature.name}: ${inventoryCardTemplates[templateName]?.name || "Item"} ins Inventar gelegt.`);
    saveAndBroadcastAppState();
    renderCardsPreservingDetailScroll();
}

function updateInventoryCurrency(creatureId) {
    const creature = findCreatureById(creatureId);
    if (creature === null) { return; }

    const previousCurrency = getSafeCurrency(creature.currency);
    const nextCurrency = {
        gp: getSafeNonNegativeInteger(document.querySelector(`#inventory-gp-${creatureId}`)?.value, 0),
        sp: getSafeNonNegativeInteger(document.querySelector(`#inventory-sp-${creatureId}`)?.value, 0),
        cp: getSafeNonNegativeInteger(document.querySelector(`#inventory-cp-${creatureId}`)?.value, 0)
    };

    creature.currency = nextCurrency;
    syncCreatureInventoryData(creature);

    const currencyChanges = [];
    if (previousCurrency.gp !== nextCurrency.gp) { currencyChanges.push(`Gold ${previousCurrency.gp} → ${nextCurrency.gp}`); }
    if (previousCurrency.sp !== nextCurrency.sp) { currencyChanges.push(`Silber ${previousCurrency.sp} → ${nextCurrency.sp}`); }
    if (previousCurrency.cp !== nextCurrency.cp) { currencyChanges.push(`Kupfer ${previousCurrency.cp} → ${nextCurrency.cp}`); }
    if (currencyChanges.length > 0) {
        addCombatLogMessage(`${creature.publicName || creature.name}: Geldbeutel geändert (${currencyChanges.join(", ")}).`);
    }

    saveAndBroadcastAppState();
    renderCardDetailPanelPreservingScroll(getFocusedCard(getHandCards(), getActiveCard(getHandCards())));
}

function openDetailInventoryCardEditor(creatureId, itemId = "", templateName = "customPotion") {
    const creature = findCreatureById(creatureId);
    if (creature === null) { return; }
    activeDetailInventoryListEditor = null;
    activeDetailInventoryCardEditor = { creatureId: creatureId, itemId: itemId, templateName: templateName };
    renderCardDetailPanelPreservingScroll(getFocusedCard(getHandCards(), getActiveCard(getHandCards())));
}

function cancelDetailInventoryEditor() {
    activeDetailInventoryCardEditor = null;
    activeDetailInventoryListEditor = null;
    renderCardDetailPanelPreservingScroll(getFocusedCard(getHandCards(), getActiveCard(getHandCards())));
}

function getDetailCardEditorItem(creature, editor) {
    if (editor === null || creature === null) { return null; }
    if (editor.itemId !== "") {
        return getInventoryCards(creature).find(function(item) { return item.id === editor.itemId; }) || null;
    }
    return createInventoryCardFromTemplate(editor.templateName || "customPotion");
}

function readDetailInventoryCardEditor(creatureId, existingId = "") {
    const category = document.querySelector(`#detail-item-category-${creatureId}`)?.value || "potion";
    return createInventoryCard({
        id: existingId,
        name: document.querySelector(`#detail-item-name-${creatureId}`)?.value.trim() || "Eigene Itemkarte",
        category: category,
        effect: document.querySelector(`#detail-item-effect-${creatureId}`)?.value.trim() || "",
        healingFormula: document.querySelector(`#detail-item-healing-${creatureId}`)?.value.trim() || "",
        description: document.querySelector(`#detail-item-description-${creatureId}`)?.value.trim() || "",
        image: document.querySelector(`#detail-item-image-${creatureId}`)?.value.trim() || (category === "scroll" ? "assets/items/scroll_custom.jpg" : "assets/items/potion_custom.jpg"),
        showAsAction: document.querySelector(`#detail-item-show-action-${creatureId}`)?.checked === true,
        actionType: document.querySelector(`#detail-item-action-type-${creatureId}`)?.value || "action"
    });
}

function saveDetailInventoryCardEditor(creatureId, openForgeAfterSave = false) {
    const creature = findCreatureById(creatureId);
    if (creature === null || activeDetailInventoryCardEditor === null) { return; }

    const cards = getInventoryCards(creature);
    const editor = activeDetailInventoryCardEditor;
    const existingIndex = cards.findIndex(function(item) { return item.id === editor.itemId; });
    const nextItem = readDetailInventoryCardEditor(creatureId, existingIndex >= 0 ? cards[existingIndex].id : "");

    if (existingIndex >= 0) {
        cards[existingIndex] = nextItem;
    } else {
        cards.push(nextItem);
    }

    creature.inventoryCards = cards;
    syncCreatureInventoryData(creature);
    activeDetailInventoryCardEditor = null;
    saveAndBroadcastAppState();

    if (openForgeAfterSave === true) {
        openInventoryCardInForge(creatureId, nextItem.id);
        return;
    }

    renderCardsPreservingDetailScroll();
}

function removeInventoryCardFromDetails(creatureId, itemId, shouldLog = false) {
    const creature = findCreatureById(creatureId);
    if (creature === null) { return; }
    const item = getInventoryCards(creature).find(function(candidate) { return candidate.id === itemId; });
    removeInventoryCardById(creature, itemId);
    activeDetailInventoryCardEditor = null;
    if (shouldLog === true && item !== undefined) {
        addCombatLogMessage(`${creature.publicName || creature.name}: ${item.name} aus dem Inventar entfernt.`);
    }
    saveAndBroadcastAppState();
    renderCardsPreservingDetailScroll();
}

function openInventoryCardInForge(creatureId, itemId) {
    openEditCreatureForm(creatureId);
    activeForgeInventoryEditor = { prefix: "edit-creature", itemId: itemId, itemType: "card", isNewDraft: false };
    setForgeTab("inventory");
    renderForgeInventoryManager("edit-creature");
}

function openDetailInventoryListEditor(creatureId, itemId = "") {
    const creature = findCreatureById(creatureId);
    if (creature === null) { return; }
    activeDetailInventoryCardEditor = null;
    activeDetailInventoryListEditor = { creatureId: creatureId, itemId: itemId };
    renderCardDetailPanelPreservingScroll(getFocusedCard(getHandCards(), getActiveCard(getHandCards())));
}

function getDetailListEditorItem(creature, editor) {
    if (editor === null || creature === null) { return null; }
    if (editor.itemId !== "") {
        return getInventoryData(creature).list.find(function(item) { return item.id === editor.itemId; }) || null;
    }
    return createInventoryListItem({ name: "", category: "equipment", quantity: 1, description: "" });
}

function saveDetailInventoryListEditor(creatureId) {
    const creature = findCreatureById(creatureId);
    if (creature === null || activeDetailInventoryListEditor === null) { return; }

    const editor = activeDetailInventoryListEditor;
    const list = getInventoryData(creature).list;
    const existingIndex = list.findIndex(function(item) { return item.id === editor.itemId; });
    const nextItem = createInventoryListItem({
        id: existingIndex >= 0 ? list[existingIndex].id : "",
        name: document.querySelector(`#detail-list-name-${creatureId}`)?.value.trim() || "Neuer Gegenstand",
        category: document.querySelector(`#detail-list-category-${creatureId}`)?.value || "equipment",
        quantity: document.querySelector(`#detail-list-quantity-${creatureId}`)?.value || 1,
        description: document.querySelector(`#detail-list-description-${creatureId}`)?.value.trim() || ""
    }, list.length);

    if (existingIndex >= 0) {
        list[existingIndex] = nextItem;
    } else {
        list.push(nextItem);
    }

    creature.inventoryList = list;
    syncCreatureInventoryData(creature);
    activeDetailInventoryListEditor = null;
    saveAndBroadcastAppState();
    renderCardsPreservingDetailScroll();
}

function removeInventoryListItem(creatureId, itemId) {
    const creature = findCreatureById(creatureId);
    if (creature === null) { return; }

    creature.inventoryList = getInventoryData(creature).list.filter(function(item) { return item.id !== itemId; });
    syncCreatureInventoryData(creature);
    activeDetailInventoryListEditor = null;
    saveAndBroadcastAppState();
    renderCardsPreservingDetailScroll();
}

function createInventoryAddMenuHtml(creatureId, context = "details", prefix = "") {
    const actionPrefix = context === "forge" ? `addForgeInventoryTemplate('${prefix}',` : `addInventoryTemplateToCreature(${creatureId},`;
    const customPotionAction = context === "forge" ? `addForgeInventoryTemplate('${prefix}', 'customPotion')` : `openDetailInventoryCardEditor(${creatureId}, '', 'customPotion')`;
    const customScrollAction = context === "forge" ? `addForgeInventoryTemplate('${prefix}', 'customScroll')` : `openDetailInventoryCardEditor(${creatureId}, '', 'customScroll')`;

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

function createInventoryCardHtml(creatureId, item) {
    const safeImage = escapeHtml(normalizeInventoryImagePath(item.image, item.category));
    const metaText = inventoryCategoryLabels[item.category] || "Item";
    const isHealingPotion = item.healingFormula !== "";
    const useLabel = item.category === "scroll" ? "Wirken" : "Verbrauchen";
    const descriptionText = item.description !== "" ? item.description : item.effect;
    const descriptionHtml = createInventoryDescriptionHtml(descriptionText);

    return `
        <article class="inventory-item-card inventory-item-card-${escapeHtml(item.category)}">
            <div class="inventory-item-card-header">
                <div class="inventory-item-title-block">
                    <h5>${createInventoryItemTitleHtml(item.name)}</h5>
                    <p class="inventory-item-meta">${escapeHtml(metaText)}</p>
                </div>
                <details class="inventory-item-menu">
                    <summary class="inventory-item-menu-summary" aria-label="Aktionen für ${escapeHtml(item.name)}">☰</summary>
                    <div class="inventory-item-menu-panel">
                        ${isHealingPotion ? `<button type="button" onclick="useInventoryCard(${creatureId}, '${item.id}', 'self')">Selbst trinken</button>` : ""}
                        ${isHealingPotion ? `<button class="inventory-item-target-menu-button" type="button" onclick="useInventoryCard(${creatureId}, '${item.id}', 'target')">Auf Ziel anwenden</button>` : ""}
                        ${isHealingPotion ? "" : `<button type="button" onclick="useInventoryCard(${creatureId}, '${item.id}', 'self')">${useLabel}</button>`}
                        <button type="button" onclick="openDetailInventoryCardEditor(${creatureId}, '${item.id}')">Edit</button>
                        <button class="card-menu-danger" type="button" onclick="removeInventoryCardFromDetails(${creatureId}, '${item.id}', true)">Entfernen</button>
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

function createDetailInventoryCardEditorHtml(creature) {
    if (activeDetailInventoryCardEditor === null || activeDetailInventoryCardEditor.creatureId !== creature.id) { return ""; }
    const item = getDetailCardEditorItem(creature, activeDetailInventoryCardEditor);
    if (item === null) { return ""; }

    const categoryOptions = Object.keys(inventoryCategoryLabels)
        .filter(function(key) { return ["potion", "scroll", "consumable", "magicItem", "quest", "misc"].includes(key); })
        .map(function(key) { return `<option value="${key}" ${item.category === key ? "selected" : ""}>${inventoryCategoryLabels[key]}</option>`; })
        .join("");
    const typeOptions = Object.keys(creatureActionTypeSingularLabels).map(function(key) {
        return `<option value="${key}" ${item.actionType === key ? "selected" : ""}>${creatureActionTypeSingularLabels[key]}</option>`;
    }).join("");
    const isNew = activeDetailInventoryCardEditor.itemId === "";

    return `
        <section class="inventory-inline-editor">
            <div class="forge-spell-editor-header"><h5>${isNew ? "Itemkarte hinzufügen" : "Itemkarte bearbeiten"}</h5><span>${escapeHtml(item.name)}</span></div>
            <div class="forge-spell-editor-grid">
                <label class="form-field forge-spell-editor-wide"><span>Name</span><input id="detail-item-name-${creature.id}" type="text" value="${escapeHtml(item.name)}"></label>
                <label class="form-field"><span>Kategorie</span><select id="detail-item-category-${creature.id}">${categoryOptions}</select></label>
                <label class="form-field"><span>Aktionstyp</span><select id="detail-item-action-type-${creature.id}">${typeOptions}</select></label>
                <label class="form-field"><span>Effekt/Kurztext</span><input id="detail-item-effect-${creature.id}" type="text" placeholder="Kurzer Effekt oder Nutzen" value="${escapeHtml(item.effect)}"></label>
                <label class="form-field"><span>Heilformel</span><input id="detail-item-healing-${creature.id}" type="text" placeholder="2d4+2" value="${escapeHtml(item.healingFormula)}"></label>
                <label class="form-field forge-spell-editor-wide"><span>Bildpfad</span><input id="detail-item-image-${creature.id}" type="text" value="${escapeHtml(item.image)}"></label>
                <label class="checkbox-field forge-checkbox-card forge-spell-editor-wide"><input id="detail-item-show-action-${creature.id}" type="checkbox" ${item.showAsAction === true ? "checked" : ""}><span>Im Aktionen-Tab anzeigen</span></label>
                <label class="form-field forge-spell-editor-wide"><span>Beschreibung</span><textarea id="detail-item-description-${creature.id}" rows="4" placeholder="Kurze Beschreibung nach Bedarf ergänzen">${escapeHtml(item.description)}</textarea></label>
            </div>
            <div class="inventory-inline-editor-actions">
                <button type="button" onclick="saveDetailInventoryCardEditor(${creature.id})">${isNew ? "Hinzufügen" : "Speichern"}</button>
                <button type="button" onclick="saveDetailInventoryCardEditor(${creature.id}, true)">In Kartenschmiede verfeinern</button>
                ${isNew ? "" : `<button class="card-menu-danger" type="button" onclick="removeInventoryCardFromDetails(${creature.id}, '${item.id}')">Löschen</button>`}
                <button type="button" onclick="cancelDetailInventoryEditor()">Abbrechen</button>
            </div>
        </section>
    `;
}

function createInventoryListHtml(creatureId, list) {
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
                                <button type="button" onclick="openDetailInventoryListEditor(${creatureId}, '${item.id}')">Edit</button>
                                <button class="card-menu-danger" type="button" onclick="removeInventoryListItem(${creatureId}, '${item.id}')" title="Eintrag entfernen" aria-label="${escapeHtml(item.name)} entfernen">Löschen</button>
                            </div>
                        </div>
                    </details>
                `;
            }).join("")}
        </div>
    `;
}

function createDetailInventoryListEditorHtml(creature) {
    if (activeDetailInventoryListEditor === null || activeDetailInventoryListEditor.creatureId !== creature.id) { return ""; }
    const item = getDetailListEditorItem(creature, activeDetailInventoryListEditor);
    if (item === null) { return ""; }
    const categoryOptions = Object.keys(inventoryCategoryLabels).map(function(key) {
        return `<option value="${key}" ${item.category === key ? "selected" : ""}>${inventoryCategoryLabels[key]}</option>`;
    }).join("");
    const isNew = activeDetailInventoryListEditor.itemId === "";

    return `
        <section class="inventory-inline-editor inventory-list-inline-editor">
            <div class="forge-spell-editor-header"><h5>${isNew ? "Gegenstand hinzufügen" : "Gegenstand bearbeiten"}</h5><span>${escapeHtml(item.name)}</span></div>
            <div class="forge-spell-editor-grid">
                <label class="form-field forge-spell-editor-wide"><span>Name</span><input id="detail-list-name-${creature.id}" type="text" placeholder="Name des Gegenstands" value="${escapeHtml(item.name)}"></label>
                <label class="form-field"><span>Kategorie</span><select id="detail-list-category-${creature.id}">${categoryOptions}</select></label>
                <label class="form-field"><span>Menge</span><input id="detail-list-quantity-${creature.id}" type="number" min="1" value="${item.quantity}"></label>
                <label class="form-field forge-spell-editor-wide"><span>Beschreibung</span><textarea id="detail-list-description-${creature.id}" rows="4" placeholder="Kurze Beschreibung nach Bedarf ergänzen">${escapeHtml(item.description)}</textarea></label>
            </div>
            <div class="inventory-inline-editor-actions">
                <button type="button" onclick="saveDetailInventoryListEditor(${creature.id})">${isNew ? "Hinzufügen" : "Speichern"}</button>
                ${isNew ? "" : `<button class="card-menu-danger" type="button" onclick="removeInventoryListItem(${creature.id}, '${item.id}')">Löschen</button>`}
                <button type="button" onclick="cancelDetailInventoryEditor()">Abbrechen</button>
            </div>
        </section>
    `;
}


function getInventoryStageStartIndex(creatureId, cardCount, visibleCount = 2) {
    const maxStart = Math.max(0, cardCount - visibleCount);
    const currentStart = Number(inventoryStageStartIndexes[creatureId] || 0);
    const nextStart = Math.max(0, Math.min(maxStart, currentStart));
    inventoryStageStartIndexes[creatureId] = nextStart;
    return nextStart;
}

function shiftInventoryStage(creatureId, direction) {
    const creature = findCreatureById(creatureId);
    if (creature === null) { return; }
    const cards = getInventoryData(creature).cards;
    const visibleCount = 2;
    const currentStart = getInventoryStageStartIndex(creatureId, cards.length, visibleCount);
    const maxStart = Math.max(0, cards.length - visibleCount);
    inventoryStageStartIndexes[creatureId] = Math.max(0, Math.min(maxStart, currentStart + direction));
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

function createInventoryTabHtml(creature) {
    const inventory = getInventoryData(creature);
    const visibleInventoryCardCount = 2;
    const stageStartIndex = getInventoryStageStartIndex(creature.id, inventory.cards.length, visibleInventoryCardCount);
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
        ? visibleCards.map(function(item) { return createInventoryCardHtml(creature.id, item); }).join("")
        : `<p class="detail-placeholder-text inventory-empty-ribbon-message">Keine Itemkarten im Schnellzugriff.</p>`;

    return `
        <div class="active-hand-detail-content active-hand-detail-scroll active-hand-inventory-reference detail-tab-surface">
            <section class="active-hand-detail-section inventory-card-section inventory-consumable-stage">
                <div class="active-hand-section-title-row inventory-stage-title-row">
                    <div>
                        <p class="section-eyebrow">Itemkarten</p>
                    </div>
                    ${createInventoryAddMenuHtml(creature.id)}
                </div>
                ${createDetailInventoryCardEditorHtml(creature)}
                <div class="inventory-consumable-shell">
                    <div class="inventory-stage-rail inventory-stage-rail-left ${hasLeftGhost ? "has-ghost-card" : "is-empty"} ${canMoveLeft ? "can-scroll" : "at-edge"}">
                        ${leftGhostHtml}
                        <button class="inventory-ribbon-scroll inventory-ribbon-scroll-left" type="button" onclick="shiftInventoryStage(${creature.id}, -1)" aria-label="Vorherige Itemkarten anzeigen" ${canMoveLeft ? "" : "disabled"}>‹</button>
                    </div>
                    <div class="inventory-card-ribbon-viewport">
                        <div class="inventory-card-ribbon inventory-card-ribbon-static" id="inventory-card-ribbon-${creature.id}">${cardsHtml}</div>
                    </div>
                    <div class="inventory-stage-rail inventory-stage-rail-right ${hasRightGhost ? "has-ghost-card" : "is-empty"} ${canMoveRight ? "can-scroll" : "at-edge"}">
                        ${rightGhostHtml}
                        <button class="inventory-ribbon-scroll inventory-ribbon-scroll-right" type="button" onclick="shiftInventoryStage(${creature.id}, 1)" aria-label="Weitere Itemkarten anzeigen" ${canMoveRight ? "" : "disabled"}>›</button>
                    </div>
                </div>
            </section>


            <section class="active-hand-detail-section inventory-list-section">
                <div class="active-hand-section-title-row">
                    <div>
                        <p class="section-eyebrow">Inventarliste</p>
                        <p class="inventory-section-hint">Normale Ausrüstung, Loot und Questgegenstände. Details öffnen sich per Klick.</p>
                    </div>
                    <button class="inventory-list-add-button forge-add-button" type="button" onclick="openDetailInventoryListEditor(${creature.id})">Gegenstand hinzufügen</button>
                </div>
                ${createDetailInventoryListEditorHtml(creature)}
                ${createInventoryListHtml(creature.id, inventory.list)}
            </section>
            <section class="active-hand-detail-section inventory-currency-section">
                <div class="inventory-currency-card">
                    <div class="inventory-currency-title">Geldbeutel</div>
                    <label><span>Gold</span><input id="inventory-gp-${creature.id}" type="number" min="0" value="${inventory.currency.gp}" onchange="updateInventoryCurrency(${creature.id})"></label>
                    <label><span>Silber</span><input id="inventory-sp-${creature.id}" type="number" min="0" value="${inventory.currency.sp}" onchange="updateInventoryCurrency(${creature.id})"></label>
                    <label><span>Kupfer</span><input id="inventory-cp-${creature.id}" type="number" min="0" value="${inventory.currency.cp}" onchange="updateInventoryCurrency(${creature.id})"></label>
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

function writeInventoryToForge(prefix, creature) {
    setForgeInventory(prefix, getInventoryData(creature));
}

function commitForgeInventoryIfEditing(prefix) {
    if (prefix !== "edit-creature") { return; }
    const creature = getEditFormCreature();
    if (creature === null) { return; }
    const inventory = getForgeInventoryDraft(prefix);
    creature.currency = inventory.currency;
    creature.inventoryCards = inventory.cards;
    creature.inventoryList = inventory.list;
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
        const typeOptions = Object.keys(creatureActionTypeSingularLabels).map(function(key) {
            return `<option value="${key}" ${item.actionType === key ? "selected" : ""}>${creatureActionTypeSingularLabels[key]}</option>`;
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
    const activeCard = activeForgeInventoryEditor !== null && activeForgeInventoryEditor.prefix === prefix && activeForgeInventoryEditor.itemType === "card"
        ? sortedCards.find(function(item) { return item.id === activeForgeInventoryEditor.itemId; })
        : null;
    const activeListItem = activeForgeInventoryEditor !== null && activeForgeInventoryEditor.prefix === prefix && activeForgeInventoryEditor.itemType === "list"
        ? sortedList.find(function(item) { return item.id === activeForgeInventoryEditor.itemId; })
        : null;
    const cardDisplayItems = activeCard === null ? sortedCards : [activeCard, ...sortedCards.filter(function(item) { return item.id !== activeCard.id; })];
    const listDisplayItems = activeListItem === null ? sortedList : [activeListItem, ...sortedList.filter(function(item) { return item.id !== activeListItem.id; })];
    const cardRows = cardDisplayItems.length > 0
        ? cardDisplayItems.map(function(item) { return createForgeInventoryCardRowHtml(prefix, item); }).join("")
        : `<p class="empty-list-message">Keine Itemkarten angelegt.</p>`;
    const listRows = listDisplayItems.length > 0
        ? listDisplayItems.map(function(item) { return createForgeInventoryListRowHtml(prefix, item); }).join("")
        : `<p class="empty-list-message">Keine Inventargegenstände angelegt.</p>`;

    managerElement.innerHTML = `
        <div class="forge-input-section inventory-forge-library-section">
            <div class="forge-spell-draft-header"><div><h4>Itemkarten</h4></div>${createInventoryAddMenuHtml(0, "forge", prefix)}</div>
            <div class="forge-spell-row-list forge-inventory-card-list">${cardRows}</div>
        </div>
        <div class="forge-input-section inventory-forge-list-section">
            <div class="forge-spell-draft-header"><div><h4>Inventarliste</h4></div><button class="forge-inventory-add-button forge-add-button" type="button" onclick="addForgeInventoryListItem('${prefix}')">Gegenstand hinzufügen</button></div>
            <div class="forge-spell-row-list forge-inventory-list">${listRows}</div>
        </div>
    `;
}


function createDetailTabContentHtml(creature) {
    if (creature === null) {
        return `
            <div class="active-hand-detail-content active-hand-detail-empty">
                <p>Keine Karte ausgewählt.</p>
            </div>
        `;
    }

    if (activeDetailTab === "actions") {
        return createActionDetailTabHtml(creature);
    }

    if (activeDetailTab === "traits") {
        return createTraitDetailTabHtml(creature);
    }

    if (activeDetailTab === "notes") {
        return `
            <div class="active-hand-detail-content active-hand-detail-scroll detail-tab-surface">
                ${createDetailTextPanelHtml("Notizen", creature.notes, "Noch keine DM-Notizen eingetragen.")}
            </div>
        `;
    }

    if (activeDetailTab === "spells") {
        return `
            <div class="active-hand-detail-content active-hand-detail-scroll active-hand-spell-reference detail-tab-surface">
                ${createSpellTrackerHtml(creature)}
            </div>
        `;
    }

    if (activeDetailTab === "inventory") {
        return createInventoryTabHtml(creature);
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
                        ${createAbilityScoreHtml(creature, "STR", "strengthScore", "strengthModifier")}
                        ${createAbilityScoreHtml(creature, "DEX", "dexterityScore", "dexterityModifier")}
                        ${createAbilityScoreHtml(creature, "CON", "constitutionScore", "constitutionModifier")}
                        ${createAbilityScoreHtml(creature, "INT", "intelligenceScore", "intelligenceModifier")}
                        ${createAbilityScoreHtml(creature, "WIS", "wisdomScore", "wisdomModifier")}
                        ${createAbilityScoreHtml(creature, "CHA", "charismaScore", "charismaModifier")}
                    </div>
                </section>

                <section class="active-hand-detail-section card-profile-section card-profile-reference-section">
                    <p class="section-eyebrow">Bewegung & Wahrnehmung</p>
                    <div class="active-hand-stat-grid card-profile-stat-grid card-profile-stat-grid-two">
                        ${createDetailStatCardHtml("Bewegung", creature.speed, "active-hand-stat-card card-profile-stat-card")}
                        ${createDetailStatCardHtml("Sinne", creature.senses, "active-hand-stat-card card-profile-stat-card")}
                        ${createDetailStatCardHtml("Passive Perception", creature.passivePerception, "active-hand-stat-card card-profile-stat-card tablet-profile-passive-stat")}
                        ${createDetailStatCardHtml("Passive Insight", creature.passiveInsight, "active-hand-stat-card card-profile-stat-card tablet-profile-passive-stat")}
                        ${createDetailStatCardHtml("Passive Investigation", creature.passiveInvestigation, "active-hand-stat-card card-profile-stat-card tablet-profile-passive-stat")}
                    </div>
                </section>

                <section class="active-hand-detail-section card-profile-section card-profile-defense-section">
                    <p class="section-eyebrow">Verteidigung</p>
                    <div class="active-hand-stat-grid card-profile-stat-grid card-profile-stat-grid-defense">
                        ${createDetailStatCardHtml("Rettungswürfe", creature.savingThrows, "active-hand-stat-card card-profile-stat-card card-profile-stat-card-wide")}
                        ${createDetailStatCardHtml("Resistenzen", creature.resistances, "active-hand-stat-card card-profile-stat-card")}
                        ${createDetailStatCardHtml("Immunitäten", creature.immunities, "active-hand-stat-card card-profile-stat-card")}
                        ${createDetailStatCardHtml("Verwundbarkeiten", creature.vulnerabilities, "active-hand-stat-card card-profile-stat-card")}
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

    const safeActiveDetailTab = getSafeDetailTab(activeDetailTab);

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
            class="active-hand-mini-card ${isActive ? "active-turn-card" : ""} ${isFocused ? "focused-hand-card" : ""} ${isSelected ? "selected-target-card" : ""} ${isCreatureOutOfAction(card) ? "is-out-of-action" : ""}"
            title="Handkarte"
        >
            ${createOutOfActionStampHtml(card)}
            <button
                class="active-hand-mini-main"
                onclick="setFocusedCreature(${card.id})"
                title="Diese Karte groß anzeigen"
            >
                <span class="active-hand-mini-image">
                    ${createCreatureImageHtml(card)}
                </span>

                <span class="active-hand-mini-copy">
                    <strong class="active-hand-mini-name">${createLoopingNameHtml(card.publicName || card.name, "active-hand-mini-name-text")}</strong>
                    <span class="active-hand-mini-meta"><b>Ini</b> ${card.initiative}</span>
                    <span class="active-hand-mini-meta"><b>HP</b> ${card.hp}/${card.maxHp} · ${tempHpText}</span>
                </span>
            </button>

            <button
                class="active-hand-mini-target"
                onclick="event.stopPropagation(); toggleCreatureSelection(${card.id});"
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
    const isSelected = card.isSelected === true;
    const initiativeModifierText = formatSignedModifier(getCreatureInitiativeModifier(card));
    const publicNameText = getSafeOptionalString(card.publicName) !== "" ? card.publicName : "Öffentlicher Name offen";
    const deckStateLabel = isSelected ? "Gewählt" : "Im Deck";
    const deckStateClass = isSelected ? "deck-status-selected" : "deck-status-position";

    return `
        <article class="preparation-deck-card ${isSelected ? "selected-deck-card" : ""}" data-deck-card-id="${card.id}" onclick="toggleCreatureSelection(${card.id})" title="Deckkarte auswählen">
            <div class="preparation-deck-card-inner">
                <div class="deck-card-topline">
                    <div class="deck-card-title-block">
                        <h3>${escapeHtml(card.name)}</h3>
                        <span class="creature-public-alias">${escapeHtml(publicNameText)}</span>
                    </div>
                    ${createCardMenuHtml(card)}
                </div>

                <div class="deck-card-image-frame">
                    ${createCreatureImageHtml(card)}
                </div>

                <div class="deck-card-state-action-row" aria-label="Kartentyp, Deckstatus und Fokus">
                    <div class="deck-card-state-list">
                        <span class="deck-status-label deck-status-type deck-status-type-${escapeAttribute(card.type)}">${escapeHtml(getDeckTypeLabel(card.type))}</span>
                        <span class="deck-status-separator" aria-hidden="true">·</span>
                        <span class="deck-status-label ${deckStateClass}">${deckStateLabel}</span>
                    </div>
                    <button class="deck-focus-button" onclick="event.stopPropagation(); setFocusedDeckCreature(${card.id});" type="button">Fokus</button>
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
    const typeFilterElement = document.querySelector("#deck-type-filter");
    const sortElement = document.querySelector("#deck-sort-mode");

    if (searchElement instanceof HTMLInputElement && searchElement.value !== deckSearchQuery) {
        searchElement.value = deckSearchQuery;
    }

    if (typeFilterElement instanceof HTMLSelectElement && typeFilterElement.value !== deckTypeFilter) {
        typeFilterElement.value = deckTypeFilter;
        updateArcaneSelectForElement(typeFilterElement);
    }

    if (sortElement instanceof HTMLSelectElement && sortElement.value !== deckSortMode) {
        sortElement.value = deckSortMode;
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
                    Keine passenden Karten im Deck.
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

function renderDeckWorkbenchOnly() {
    const deckCards = getDeckCards();
    const visibleDeckCards = getVisibleDeckCards(deckCards);

    renderPreparationDeckRibbon(visibleDeckCards);
    updateDeckSelectionStatus();
    enhanceArcaneSelects();
}

function setDeckSearchQuery(value) {
    deckSearchQuery = getSafeOptionalString(value);
    preserveViewportWhileRendering(function() {
        renderDeckWorkbenchOnly();
    });
}

function setDeckTypeFilter(value) {
    deckTypeFilter = ["all", "player", "npc", "monster"].includes(value) ? value : "all";
    preserveViewportWhileRendering(function() {
        renderDeckWorkbenchOnly();
    });
}

function setDeckSortMode(value) {
    deckSortMode = ["name", "type", "initiativeModifier", "hp"].includes(value) ? value : "name";
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

        html += createCreatureCardHtml(card, isActive);
    }

    listElement.innerHTML = html;
}

function renderCards() {
    if (shouldAutoloadDemoCards() === true && creatures.length === 0) {
        creatures = createDemoCreatures();
        encounterName = demoEncounterName;
        focusedCreatureId = null;
        resetEncounterStartGateState({ clearLog: true });
        isMirielBoardAutoTurnEnabled = false;
    }

    ensureEncounterStartGateConsistency();

    const handCards = getHandCards();
    const deckCards = getDeckCards();
    const visibleDeckCards = getVisibleDeckCards(deckCards);

    ensureCurrentTurnIndexIsValid(handCards);

    const activeCard = getActiveCard(handCards);
    const publicCards = createPublicEncounterState(handCards, activeCard);

    renderTurnInfo(handCards);

    if (appView === "player") {
        renderPublicPreview(publicCards, handCards);
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

    for (const creature of creatures) {

        if (creature.type === "player") {

            creature.hp = creature.maxHp;

            creature.tempHp = 0;

            creature.conditions = [];

            resetSpellSlotsForCreature(creature);

            resetUsageCountersForCreature(creature, ["shortRest", "longRest", "encounter", "turn", "round"]);

            creature.isSelected = false;

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
    creatures = createDemoCreatures();
    encounterName = demoEncounterName;
    focusedCreatureId = null;
    resetEncounterStartGateState({ clearLog: true });
    isMirielBoardAutoTurnEnabled = false;
    updateStorageStatus("Browser-Speicher: leer, Demo-Karten geladen");

    if (appView === "dm") {
        saveAppStateToBrowser();
        broadcastAppStateChange();
    }
}

setupPlayerViewPolling();
setupPublicPreviewNavigation();
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

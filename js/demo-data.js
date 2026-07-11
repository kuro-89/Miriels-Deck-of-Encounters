// ============================================================
// Demo-Daten für Miriel's Deck of Encounters
//
// Diese Datei enthält ausschließlich den vorbereiteten Demo-Spielstand.
// Sie wird vor app.js geladen. Die eigentliche App-Logik bleibt in app.js.
// ============================================================

function createDemoCards() {
    const demoCards = [
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
            demoSpellSeed: "Root Wall. Roots and grave soil rise as half cover until initiative count 0.\nGrave Pull. Necrotic roots drag cards through mud and loose stones.\nMoss Regrowth. Green corpse-light knits cracked stone back together.",
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

    return demoCards.map(addDemoStructuredCardData);
}

function addDemoStructuredCardData(card) {
    const { demoSpellSeed = "", demoInventorySeed = "", ...baseCard } = card;
    const demoActions = getDemoActionsForCard(card.id);
    const demoTraits = getDemoTraitsForCard(card.id);
    const demoSpellcasting = getDemoSpellcastingForCard(card);
    const demoInventory = createInventoryDataFromLegacyText(demoInventorySeed);

    if (card.id === 1) {
        demoInventory.cards.push(createInventoryCardFromTemplate("greaterHealing"));
    }

    return {
        ...baseCard,
        actions: demoActions,
        traits: demoTraits,
        spellcasting: demoSpellcasting,
        currency: demoInventory.currency,
        inventoryCards: demoInventory.cards,
        inventoryList: demoInventory.list,
        isDemoCard: true
    };
}

function isKnownDemoCardData(rawCard) {
    if (rawCard === null || typeof rawCard !== "object") {
        return false;
    }

    const rawName = typeof rawCard.name === "string" ? rawCard.name.trim().toLocaleLowerCase("de-DE") : "";

    if (rawName === "") {
        return false;
    }

    return demoCardNameSignatures.includes(rawName);
}

function getDemoActionsForCard(cardId) {
    const demoActions = {
        1: [
            createCardAction({ name: "Rapier", type: "action", attack: "+8 auf Treffer", range: "Reichweite 5 Fuß", damage: "1W8+5 Stich", description: "Nahkampfangriff mit einer Finessewaffe." }),
            createCardAction({ name: "Dolch", type: "action", attack: "+8 auf Treffer", range: "5 Fuß oder 20/60 Fuß", damage: "1W4+5 Stich", description: "Finesse, leicht und geworfen." }),
            createCardAction({ name: "Kurzbogen", type: "action", attack: "+8 auf Treffer", range: "80/320 Fuß", damage: "1W6+5 Stich", description: "Fernkampfangriff mit einer Waffe." }),
            createCardAction({ name: "Kampf mit zwei Waffen", type: "action", description: "Allgemeine Kampfoption, sobald Waffenwahl und Aktionsökonomie die Nebenhand erlauben." })
        ],
        2: [
            createCardAction({ name: "Dolch", type: "action", attack: "+4 auf Treffer", range: "5 Fuß oder 20/60 Fuß", damage: "1W4+2 Stich", description: "Einfach, Finesse, leicht und geworfen." }),
            createCardAction({ name: "Kampfstab", type: "action", attack: "+1 auf Treffer", range: "Reichweite 5 Fuß", damage: "1W6-1 Wucht", description: "Einfache, vielseitige Waffe." })
        ],
        3: [
            createCardAction({ name: "Lästiger Feger", type: "action", usageMax: 1, usageReset: "manual", usage: "Aufladung 5–6", attack: "+4 auf Treffer", range: "Reichweite 5 Fuß", damage: "1W6+2 Wucht", save: "SG 12 ST", description: "Bei einem misslungenen Rettungswurf stürzt das Ziel zu Boden." }),
            createCardAction({ name: "Staubstoß", type: "action", usage: "1 / Begegnung", range: "Kegel 10 Fuß", save: "SG 12 KO", description: "Betroffene Kreaturen sind bei einem misslungenen Rettungswurf bis zum Ende ihres nächsten Zuges blind." }),
            createCardAction({ name: "Erschreckendes Klappern", type: "action", range: "30 Fuß", save: "SG 12 WE", description: "Eine hörende Kreatur verliert bei einem misslungenen Rettungswurf ihre Reaktion bis zu Borstibalds nächstem Zug." })
        ],
        4: [
            createCardAction({ name: "Wurzelbiss", type: "action", attack: "+5 auf Treffer", range: "Reichweite 5 Fuß", damage: "2W6+3 Stich plus 1W6 Gift" }),
            createCardAction({ name: "Nebelsaft", type: "action", usageMax: 3, usageReset: "longRest", usage: "3 / Lange Rast", attack: "+5 auf Treffer", range: "30 Fuß", damage: "2W6 Gift", description: "Die Bewegungsrate des Ziels sinkt bis zum Ende seines nächsten Zuges um 10 Fuß." }),
            createCardAction({ name: "Kreischblüte", type: "action", usage: "1 / Begegnung", range: "15 Fuß", save: "SG 13 WE", description: "Betroffene Kreaturen sind bei einem misslungenen Rettungswurf bis zum Ende ihres nächsten Zuges verängstigt." }),
            createCardAction({ name: "Wurzelschlinge", type: "action", usageMax: 1, usageReset: "manual", usage: "Aufladung 5–6", range: "20 Fuß", save: "SG 13 ST", description: "Eine Kreatur am Boden ist bei einem misslungenen Rettungswurf bis zum Ende von Nebelzahns nächstem Zug festgesetzt." })
        ],
        5: [
            createCardAction({ name: "Funken-Schnabel", type: "action", attack: "+6 auf Treffer", range: "Reichweite 5 Fuß", damage: "1W4+4 Stich plus 1W6 Blitz" }),
            createCardAction({ name: "Funkenraub", type: "action", usageMax: 1, usageReset: "manual", usage: "Aufladung 6", attack: "+6 auf Treffer", range: "60 Fuß", damage: "2W6 psychisch", description: "Das Ziel kann bis zum Beginn seines nächsten Zuges keine Reaktionen einsetzen." }),
            createCardAction({ name: "Spiegelkrächzen", type: "action", range: "30 Fuß", save: "SG 14 WE", description: "Bei einem misslungenen Rettungswurf hat das Ziel Nachteil auf seinen nächsten Angriff vor Ende seines nächsten Zuges." }),
            createCardAction({ name: "Lichtflucht", type: "bonus", description: "Die Glimmerkrähe fliegt bis zur Hälfte ihrer Bewegungsrate. Von Spiegelkrächzen oder Funkenraub betroffene Kreaturen erhalten dabei keinen Gelegenheitsangriff." })
        ],
        6: [
            createCardAction({ name: "Eldritch Blast", type: "action", attack: "+7 auf Treffer", range: "120 Fuß", damage: "Zwei Strahlen mit je 1W10+4 Kraft" }),
            createCardAction({ name: "Unbewaffneter Schlag", type: "action", attack: "+2 auf Treffer", range: "Reichweite 5 Fuß", damage: "0 Wucht" })
        ],
        7: [
            createCardAction({ name: "Zermalmende Wurzel", type: "action", usageMax: 1, usageReset: "manual", usage: "Aufladung 5–6", attack: "+7 auf Treffer", range: "Reichweite 10 Fuß", damage: "2W10+5 Wucht", description: "Das Ziel wird gepackt." }),
            createCardAction({ name: "Grabsog", type: "action", usage: "1 / Begegnung", range: "Linie 15 Fuß", save: "SG 15 ST", description: "Betroffene Kreaturen werden bei einem misslungenen Rettungswurf 10 Fuß zum Koloss gezogen und stürzen zu Boden." }),
            createCardAction({ name: "Grabsteinschlag", type: "action", attack: "+7 auf Treffer", range: "Reichweite 5 Fuß", damage: "2W8+5 Wucht plus 1W8 nekrotisch" }),
            createCardAction({ name: "Moosbedecktes Brüllen", type: "action", range: "30 Fuß", damage: "1W6 psychisch", description: "Jede verängstigte oder am Boden liegende Kreatur in Reichweite erleidet den Schaden." })
        ],
        8: [
            createCardAction({ name: "Glasbiss", type: "action", attack: "+5 auf Treffer", range: "Reichweite 5 Fuß", damage: "1W6+3 Stich plus 1W6 psychisch" }),
            createCardAction({ name: "Falscher Schritt", type: "action", usageMax: 1, usageReset: "manual", usage: "Aufladung 5–6", range: "30 Fuß", save: "SG 14 IN", description: "Bei einem misslungenen Rettungswurf bewegt sich das Ziel 10 Fuß in eine vom Molch gewählte Richtung." }),
            createCardAction({ name: "Schimmerspucke", type: "action", attack: "+5 auf Treffer", range: "30 Fuß", damage: "2W6 psychisch", description: "Das Ziel kann bis zum Ende seines nächsten Zuges nicht von Unsichtbarkeit profitieren." }),
            createCardAction({ name: "Wellentausch", type: "bonus", range: "30 Fuß", description: "Der Molch tauscht den Platz mit seinem Doppelbild oder einer Spiegelung." })
        ],
        9: [
            createCardAction({ name: "Verborgener Dolch", type: "action", attack: "+6 auf Treffer", range: "Reichweite 5 Fuß", damage: "1W4+4 Stich", description: "Verursacht zusätzlich 1W6 Giftschaden, wenn Veyra Vorteil hatte." }),
            createCardAction({ name: "Erpressungsfaden", type: "action", usageMax: 3, usageReset: "charges", usage: "3 Ladungen", range: "30 Fuß", save: "SG 13 WE", description: "Bei einem misslungenen Rettungswurf hat das Ziel Nachteil auf seinen nächsten Angriff gegen Veyra oder einen ihrer Verbündeten." }),
            createCardAction({ name: "Im Regen verschwinden", type: "bonus", usage: "1 / Begegnung", description: "Veyra bewegt sich bis zu ihrer Bewegungsrate und versucht sich zu verstecken, selbst bei leichter Verdeckung durch Regen, Nebel oder Straßenschatten." }),
            createCardAction({ name: "Codierte Warnung", type: "reaction", range: "60 Fuß", trigger: "Ein sicht- oder hörbarer Verbündeter will seine Position wechseln.", description: "Der Verbündete darf sich sofort bis zu 10 Fuß bewegen, ohne Gelegenheitsangriffe auszulösen." })
        ]
    };

    return demoActions[cardId] || [];
}

function getDemoTraitsForCard(cardId) {
    const demoTraits = {
        1: [
            createCardTrait({ name: "Ressourcen", category: "resource", description: "Hinterhältiger Angriff 4W6 · Listige Aktion · Unheimliches Ausweichen · Entrinnen · Arkane Kartenmeisterin: 4 Zauberplätze 1. Grades, 2 Zauberplätze 2. Grades" }),
            createCardTrait({ name: "Hinterhältiger Angriff", category: "classFeature", usageMax: 1, usageReset: "turn", usage: "1 / Zug", showAsAction: true, actionType: "special", actionSummary: "Einmal pro Zug zusätzlich 4W6 Schaden verursachen, wenn die Voraussetzungen erfüllt sind.", description: "Einmal pro Zug verursacht Miriel mit einer Finesse- oder Fernkampfwaffe 4W6 zusätzlichen Schaden, wenn sie Vorteil hat oder ein Gegner des Ziels nahe bei ihm steht und Miriel keinen Nachteil hat." }),
            createCardTrait({ name: "Listige Aktion", category: "classFeature", showAsAction: true, actionType: "bonus", actionSummary: "Sprinten, Rückzug oder Verstecken als Bonusaktion einsetzen.", description: "Miriel kann in jedem ihrer Züge Sprinten, Rückzug oder Verstecken als Bonusaktion einsetzen." }),
            createCardTrait({ name: "Unheimliches Ausweichen", category: "classFeature", showAsAction: true, actionType: "reaction", trigger: "Ein sichtbarer Angreifer trifft Miriel.", actionSummary: "Den Schaden des Angriffs halbieren.", description: "Trifft ein sichtbarer Angreifer Miriel, kann sie ihre Reaktion einsetzen, um den Schaden dieses Angriffs zu halbieren." }),
            createCardTrait({ name: "Arkane Fingerfertigkeit", category: "classFeature", description: "Miriel kann ihre magische Hand unsichtbar wirken lassen und damit auf Distanz kleine Gegenstände, Schlösser und Diebeswerkzeug besonders geschickt bedienen." }),
            createCardTrait({ name: "Entrinnen", category: "passive", description: "Bei Geschicklichkeitsrettungswürfen gegen halben Schaden erleidet Miriel bei Erfolg keinen und bei Misserfolg nur halben Schaden." }),
            createCardTrait({ name: "Chaosfeen-Flug", category: "species", description: "Die Flugbewegungsrate entspricht der Laufbewegungsrate." }),
            createCardTrait({ name: "Chaosfeen-Magie", category: "species", description: "Miriels angeborene Feenmagie wird über ihre Zauberliste verwaltet; begrenzte Anwendungen werden dort gesondert erfasst." })
        ],
        2: [
            createCardTrait({ name: "Ressourcen", category: "resource", description: "Arkane Erholung 1/LR · Arkane Schreibfeder · Erwachtes Zauberbuch · Schlangenmagie" }),
            createCardTrait({ name: "Arkane Schreibfeder", category: "classFeature", showAsAction: true, actionType: "bonus", actionSummary: "Eine magische Schreibfeder in Suicas freier Hand erscheinen lassen.", description: "Suica ruft mit einer Bonusaktion eine tintenlose Feder hervor. Sie erleichtert das Übertragen arkaner Formeln und kann eigene Schriftzeichen in kurzer Entfernung wieder auslöschen." }),
            createCardTrait({ name: "Arkane Erholung", category: "classFeature", usageMax: 1, usageReset: "longRest", usage: "1 / Lange Rast", showAsAction: true, actionType: "special", actionSummary: "Nach einer kurzen Rast verbrauchte Zauberplätze mit insgesamt bis zu zwei Zaubergraden zurückgewinnen.", description: "Einmal pro langer Rast kann Suica nach einer kurzen Rast verbrauchte Zauberplätze zurückgewinnen, deren addierte Grade höchstens zwei betragen." }),
            createCardTrait({ name: "Erwachtes Zauberbuch: Ritualfokus", category: "classFeature", usageMax: 1, usageReset: "longRest", usage: "1 / Lange Rast", showAsAction: true, actionType: "special", actionSummary: "Ein vorbereitetes Ritual ohne zusätzliche Ritualzeit wirken.", description: "Solange Suica ihr Erwachtes Zauberbuch hält, kann sie einmal pro langer Rast ein vorbereitetes Ritual in dessen normaler Wirkzeit vollenden." }),
            createCardTrait({ name: "Magieresistenz", category: "species", description: "Vorteil auf Rettungswürfe gegen Zauber." }),
            createCardTrait({ name: "Giftresistenz", category: "species", description: "Resistenz gegen Giftschaden sowie Vorteil auf Rettungswürfe, um Vergiftung zu vermeiden oder zu beenden." }),
            createCardTrait({ name: "Gelehrte", category: "classFeature", description: "Suica verdoppelt ihren Übungsbonus bei einer beherrschten Wissensfertigkeit; in der Demo gilt dies für Nachforschungen." }),
            createCardTrait({ name: "Schlangenmagie", category: "species", description: "Suicas angeborene Magie wird über ihre Zauberliste verwaltet und umfasst giftige, tierbezogene und beeinflussende Effekte." })
        ],
        3: [
            createCardTrait({ name: "Täuschend echter Gegenstand", category: "monsterTrait", description: "Solange Borstibald reglos bleibt, ist er nicht von einem gewöhnlichen Besen zu unterscheiden, bis er sich bewegt oder angreift." }),
            createCardTrait({ name: "Staubiger Zorn", category: "monsterTrait", usageMax: 1, usageReset: "encounter", usage: "1 / Begegnung", showAsAction: true, actionType: "special", trigger: "Borstibald erleidet in einer Begegnung zum ersten Mal Schaden.", actionSummary: "Kreaturen im Umkreis von 10 Fuß haben bis zum Rundenende Nachteil auf ihre nächste Wahrnehmungsprobe.", description: "Wenn Borstibald in einer Begegnung erstmals Schaden erleidet, wirbelt er eine Staubwolke auf. Jede Kreatur im Umkreis von 10 Fuß hat bis zum Ende der Runde Nachteil auf ihre nächste Wahrnehmungsprobe." }),
            createCardTrait({ name: "Schwebender Hausplagegeist", category: "passive", description: "Borstibald ignoriert schwieriges Gelände, das durch Gerümpel, Möbel, verschüttete Flüssigkeiten oder lose Trümmer entsteht." })
        ],
        4: [
            createCardTrait({ name: "Verwurzelter Lauerjäger", category: "monsterTrait", description: "Nebelzahn hat Vorteil auf Heimlichkeitsproben, solange er teilweise in Erde, Nebel oder Laub verborgen ist." }),
            createCardTrait({ name: "Nebelgenährte Haut", category: "monsterTrait", description: "In Nebel, dämmrigem Licht oder dichter Vegetation erhält Nebelzahn +2 Rüstungsklasse gegen Fernkampfangriffe." }),
            createCardTrait({ name: "Witterung warmen Blutes", category: "monsterTrait", description: "Nebelzahn kennt die Richtung jeder verletzten Kreatur im Umkreis von 30 Fuß, die den Boden berührt." })
        ],
        5: [
            createCardTrait({ name: "Spiegelfeder", category: "monsterTrait", usageMax: 2, usageReset: "encounter", usage: "2 / Begegnung", showAsAction: true, actionType: "reaction", trigger: "Eine Kreatur verfehlt die Glimmerkrähe mit einem Angriff.", actionSummary: "Eine falsche Spiegelung aufblitzen lassen und sich 10 Fuß ohne Gelegenheitsangriffe bewegen.", description: "Bis zu zweimal pro Begegnung kann die Glimmerkrähe nach einem verfehlten Angriff eine falsche Spiegelung aufblitzen lassen und sich 10 Fuß bewegen, ohne Gelegenheitsangriffe auszulösen." }),
            createCardTrait({ name: "Gedankenraub", category: "monsterTrait", description: "Eine von Funkenraub getroffene Kreatur kann bis zum Beginn ihres nächsten Zuges keine Reaktionen einsetzen." }),
            createCardTrait({ name: "Glänzendes Omen", category: "monsterTrait", description: "Die Glimmerkrähe hat Vorteil auf Proben, um magische Gegenstände, spiegelnde Flächen und verborgenen Schmuck zu entdecken." })
        ],
        6: [
            createCardTrait({ name: "Ressourcen", category: "resource", description: "Zaubereipunkte 5 · Metamagie: Verstärkt, Beschleunigt · Fluch der Schattenklinge 1/SR · Gunst des Schicksals 1/SR · Heilende Berührung 1/LR · Sternenbrand 1/LR" }),
            createCardTrait({ name: "Heilende Berührung", category: "species", usageMax: 1, usageReset: "longRest", usage: "1 / Lange Rast", showAsAction: true, actionType: "action", actionSummary: "Eine berührte Kreatur mit Sternenlicht heilen.", description: "Liora kanalisiert mit einer Aktion sanftes Sternenlicht durch ihre Hände. Die berührte Kreatur erhält eine Anzahl W4 Heilung in Höhe von Lioras Übungsbonus." }),
            createCardTrait({ name: "Fluch der Schattenklinge", category: "classFeature", usageMax: 1, usageReset: "shortRest", usage: "1 / Kurze Rast", showAsAction: true, actionType: "bonus", range: "30 Fuß", actionSummary: "Eine sichtbare Kreatur eine Minute lang mit dem Mal der Schattenklinge belegen.", description: "Liora markiert mit einer Bonusaktion eine sichtbare Kreatur in 30 Fuß Reichweite. Gegen das markierte Ziel verursacht sie 3 zusätzlichen Schaden, erzielt bereits bei 19–20 einen kritischen Treffer und gewinnt 7 HP zurück, falls das Ziel fällt." }),
            createCardTrait({ name: "Quelle der Magie: Zauberplatz erschaffen", category: "classFeature", showAsAction: true, actionType: "bonus", actionSummary: "Zaubereipunkte ausgeben, um einen Zauberplatz zu erschaffen.", description: "Liora kann als Bonusaktion 2, 3 oder 5 Zaubereipunkte ausgeben, um einen Zauberplatz des 1., 2. oder 3. Grades zu erschaffen." }),
            createCardTrait({ name: "Beschleunigter Zauber", category: "classFeature", showAsAction: true, actionType: "bonus", actionSummary: "Zwei Zaubereipunkte ausgeben, um einen geeigneten Zauber als Bonusaktion zu wirken.", description: "Liora gibt zwei Zaubereipunkte aus und ändert die Wirkzeit eines geeigneten Zaubers für diesen Einsatz von einer Aktion zu einer Bonusaktion." }),
            createCardTrait({ name: "Gunst des Schicksals", category: "classFeature", usageMax: 1, usageReset: "shortRest", usage: "1 / Kurze Rast", showAsAction: true, actionType: "special", trigger: "Liora verfehlt einen Angriff oder misslingt bei einem Rettungswurf.", actionSummary: "2W4 auf das Ergebnis addieren und das Schicksal möglicherweise wenden.", description: "Einmal pro kurzer Rast kann Liora nach einem verfehlten Angriff oder misslungenen Rettungswurf 2W4 auf das Ergebnis addieren." }),
            createCardTrait({ name: "Sternenbrand", category: "species", usageMax: 1, usageReset: "longRest", usage: "1 / Lange Rast", showAsAction: true, actionType: "bonus", actionSummary: "Für eine Minute eine brennende Sternenaura entfesseln.", description: "Einmal pro langer Rast entfesselt Liora mit einer Bonusaktion für eine Minute ihre instabile Sternenkraft." }),
            createCardTrait({ name: "Arkane Reserve", category: "classFeature", usageMax: 1, usageReset: "longRest", usage: "1 / Lange Rast", showAsAction: true, actionType: "special", actionSummary: "Ein einminütiges Ritual stellt einen verbrauchten Pakt-Zauberplatz wieder her.", description: "Einmal pro langer Rast kann Liora ein einminütiges Ritual vollziehen und dadurch bis zu einen verbrauchten Pakt-Zauberplatz zurückgewinnen." }),
            createCardTrait({ name: "Sternenblut-Resistenz", category: "species", description: "Liora besitzt Resistenz gegen nekrotischen und gleißenden Schaden." }),
            createCardTrait({ name: "Unbeugsame Konzentration", category: "classFeature", description: "Liora hat Vorteil auf Konstitutionsrettungswürfe, mit denen sie ihre Konzentration aufrechterhält." }),
            createCardTrait({ name: "Gefechtsmagierin", category: "feat", description: "Liora kann Zauber auch mit Waffe oder Schild sicher wirken und geeignete Zauber für Gelegenheitsangriffe einsetzen." }),
            createCardTrait({ name: "Schattenklingen-Bindung", category: "classFeature", description: "Nach einer langen Rast bindet Liora eine geeignete Waffe an ihren Pakt und verwendet für Angriffe mit ihr ihr Charisma. Außerdem beherrscht sie mittelschwere Rüstungen, Schilde und Kriegswaffen." }),
            createCardTrait({ name: "Qualvoller Strahl", category: "classFeature", description: "Liora addiert ihren Charismamodifikator zum Schaden ihres unheimlichen Strahls." }),
            createCardTrait({ name: "Zurückstoßender Strahl", category: "classFeature", description: "Trifft Lioras unheimlicher Strahl eine große oder kleinere Kreatur, kann er sie bis zu 10 Fuß von ihr wegstoßen." })
        ],
        7: [
            createCardTrait({ name: "Grabmoos-Regeneration", category: "monsterTrait", showAsAction: true, actionType: "special", actionSummary: "Zu Beginn seines Zuges 10 Trefferpunkte zurückgewinnen, sofern seit dem letzten Zug kein Feuerschaden erlitten wurde.", description: "Steht der Koloss auf Erde oder Stein, gewinnt er zu Beginn seines Zuges 10 Trefferpunkte zurück, sofern er seit seinem letzten Zug keinen Feuerschaden erlitten hat." }),
            createCardTrait({ name: "Massiger Körper", category: "monsterTrait", description: "Der Koloss hat Vorteil auf Rettungswürfe dagegen, bewegt, zu Boden geworfen oder von Kreaturen unterhalb der Größenkategorie riesig gepackt zu werden." }),
            createCardTrait({ name: "Anker des Gräberfelds", category: "monsterTrait", description: "Schwieriges Gelände aus Wurzeln, Geröll oder Gräbern kostet den Koloss keine zusätzliche Bewegung." })
        ],
        8: [
            createCardTrait({ name: "Spiegelnde Haut", category: "monsterTrait", usageMax: 2, usageReset: "encounter", usage: "2 / Begegnung", showAsAction: true, actionType: "reaction", trigger: "Ein Zauberangriff verfehlt den Molch.", actionSummary: "Einen harmlosen Schimmer auf eine Kreatur im Umkreis von 10 Fuß umlenken; sie hat Nachteil auf ihre nächste Wahrnehmungsprobe.", description: "Bis zu zweimal pro Begegnung kann der Molch nach einem verfehlten Zauberangriff einen harmlosen Schimmer auf eine andere Kreatur im Umkreis von 10 Fuß lenken. Diese hat Nachteil auf ihre nächste Wahrnehmungsprobe." }),
            createCardTrait({ name: "Flackerndes Doppelbild", category: "monsterTrait", usageMax: 1, usageReset: "longRest", usage: "1 / Lange Rast", showAsAction: true, actionType: "special", actionSummary: "Ein Trugbild erschaffen, das bis zu seinem ersten Treffer bestehen bleibt.", description: "Einmal pro langer Rast erschafft der Molch ein Trugbild seiner selbst. Es verschwindet, sobald es von einem Angriff getroffen wird." }),
            createCardTrait({ name: "Spiegelsinn", category: "monsterTrait", description: "Der Molch kennt den Standort von Kreaturen im Umkreis von 30 Fuß, die sich in stillem Wasser, poliertem Metall oder Glas spiegeln." })
        ],
        9: [
            createCardTrait({ name: "Netz geheimer Ablagen", category: "npc", usageMax: 2, usageReset: "longRest", usage: "2 / Lange Rast", showAsAction: true, actionType: "special", actionSummary: "Den wahrscheinlichen Ablageort einer Nachricht, eines Schlüssels oder kleiner Schmuggelware in der Nähe kennen.", description: "Zweimal pro langer Rast kann Veyra glaubhaft den Ort kennen, an dem in der Nähe eine Nachricht, ein Schlüssel oder ein kleiner Schmuggelgegenstand verborgen wurde." }),
            createCardTrait({ name: "Geist der Menge", category: "npc", description: "Veyra kann versuchen, sich zu verstecken, wenn Regen, Nebel, Menschenmengen oder aufgehängte Wäsche sie leicht verdecken." }),
            createCardTrait({ name: "Instinkt der Informantin", category: "npc", description: "Veyra hat Vorteil auf Motiv-erkennen-Proben, um Lügen über Namen, Wege oder Zugehörigkeiten zu durchschauen." })
        ]
    };

    return demoTraits[cardId] || [];
}

function applySpellOverride(spellcasting, spellName, overrides) {
    const lowerName = getSafeOptionalString(spellName).toLowerCase();
    const spell = spellcasting.spells.find(function(item) { return item.name.toLowerCase() === lowerName; });

    if (spell !== undefined) {
        Object.assign(spell, overrides);
    }
}

function getDemoSpellcastingForCard(card) {
    const spellcasting = createDefaultSpellcasting(card);
    spellcasting.spells = parseLegacySpellsText(card.demoSpellSeed);
    applyLegacySlotHints(spellcasting, { spellsText: card.demoSpellSeed, spellSaveDc: card.spellSaveDc });

    if (card.id === 1) {
        applySpellOverride(spellcasting, "Chaossplitter", { castingTime: "1 Reaktion", range: "60 ft.", showAsAction: true, actionType: "reaction" });
        applySpellOverride(spellcasting, "Faerie Fire", { castingTime: "1 Aktion", range: "60 ft.", concentration: true, usageMax: 1, usageReset: "longRest", showAsAction: true, actionType: "action" });
        applySpellOverride(spellcasting, "Enlarge/Reduce", { castingTime: "1 Aktion", range: "30 Fuß", concentration: true, usageMax: 1, usageReset: "longRest", showAsAction: true, actionType: "action" });
    }

    if (card.id === 2) {
        applySpellOverride(spellcasting, "Shield", { castingTime: "1 Reaktion", showAsAction: true, actionType: "reaction" });
        applySpellOverride(spellcasting, "Suggestion", { castingTime: "1 Aktion", range: "30 Fuß", concentration: true, usageMax: 1, usageReset: "longRest", showAsAction: true, actionType: "action" });
    }

    if (card.id === 6) {
        applySpellOverride(spellcasting, "Elementarschild", { castingTime: "1 Reaktion", showAsAction: true, actionType: "reaction" });
        applySpellOverride(spellcasting, "Shield", { castingTime: "1 Reaktion", showAsAction: true, actionType: "reaction" });
        applySpellOverride(spellcasting, "Healing Word", { castingTime: "1 Bonusaktion", range: "60 ft.", showAsAction: true, actionType: "bonus" });
        applySpellOverride(spellcasting, "Hex", { castingTime: "1 Bonusaktion", range: "90 ft.", concentration: true, showAsAction: true, actionType: "bonus" });
        applySpellOverride(spellcasting, "Misty Step", { castingTime: "1 Bonusaktion", range: "Selbst", showAsAction: true, actionType: "bonus" });
        applySpellOverride(spellcasting, "Counterspell", { castingTime: "1 Reaktion", range: "60 ft.", showAsAction: true, actionType: "reaction" });
    }

    return spellcasting;
}

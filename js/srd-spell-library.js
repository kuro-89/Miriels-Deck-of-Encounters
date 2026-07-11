/**
 * Modul: srd-spell-library.js
 *
 * Aufgabe:
 * Stellt eine kuratierte, durchsuchbare Auswahl von Zaubern bereit, die dem
 * deutschen SRD 5.1 zugeordnet wurden. Die Bibliothek dient nur als Vorlage
 * für die Kartenschmiede; manuell erstellte Zauber bleiben weiterhin möglich.
 *
 * Verantwortlich für:
 * - strukturierte SRD-Zauberdaten
 * - Metadaten der Bibliothek
 *
 * Nicht verantwortlich für:
 * - Rendering
 * - Kartenänderungen
 * - Lizenzanzeige pro Zauber
 *
 * Zentrale Attribution:
 * - legal.html
 * - THIRD_PARTY_NOTICES.md
 */
const srd51SpellLibraryMeta = Object.freeze({
    key: "srd51-de",
    label: "SRD 5.1 · 2014-Regeln",
    shortLabel: "SRD 5.1",
    license: "CC BY 4.0",
    noticeHref: "legal.html#srd-license"
});

const srd51SpellLibrary = Object.freeze([
    {
        "id": "srd51-de-minor-illusion",
        "name": "Kleine Illusion",
        "aliases": [
            "Minor Illusion"
        ],
        "level": 0,
        "school": "Illusion",
        "castingTime": "1 Aktion",
        "range": "9 m",
        "components": "S, M (etwas Vlies)",
        "duration": "1 Minute",
        "ritual": false,
        "concentration": false,
        "saveOrAttack": "Nachforschungen gegen Zauberrettungswurf-SG",
        "description": "Du erschaffst ein Geräusch oder das unbewegte Bild eines Gegenstands innerhalb der Reichweite. Körperliche Berührung offenbart das Trugbild; eine Kreatur kann es außerdem mit einer erfolgreichen Nachforschungsprobe gegen deinen Zauberrettungswurf-SG durchschauen."
    },
    {
        "id": "srd51-de-mage-hand",
        "name": "Magierhand",
        "aliases": [
            "Mage Hand"
        ],
        "level": 0,
        "school": "Beschwörung",
        "castingTime": "1 Aktion",
        "range": "9 m",
        "components": "V, S",
        "duration": "1 Minute",
        "ritual": false,
        "concentration": false,
        "saveOrAttack": "",
        "description": "Eine schwebende spektrale Hand erscheint. Sie kann Gegenstände bis etwa 4,5 kg bewegen, Türen oder Behälter öffnen und einfache Objekte bedienen, aber nicht angreifen oder magische Gegenstände aktivieren."
    },
    {
        "id": "srd51-de-druidcraft",
        "name": "Druidenkunst",
        "aliases": [
            "Druidcraft"
        ],
        "level": 0,
        "school": "Verwandlung",
        "castingTime": "1 Aktion",
        "range": "9 m",
        "components": "V, S",
        "duration": "Unmittelbar",
        "ritual": false,
        "concentration": false,
        "saveOrAttack": "",
        "description": "Du erzeugst einen kleinen Natureffekt: eine kurze Wettervorhersage, das Erblühen einer Pflanze, einen harmlosen Sinneseindruck oder das Entzünden beziehungsweise Löschen einer kleinen Flamme."
    },
    {
        "id": "srd51-de-poison-spray",
        "name": "Gift versprühen",
        "aliases": [
            "Poison Spray"
        ],
        "level": 0,
        "school": "Beschwörung",
        "castingTime": "1 Aktion",
        "range": "3 m",
        "components": "V, S",
        "duration": "Unmittelbar",
        "ritual": false,
        "concentration": false,
        "saveOrAttack": "KO-Rettungswurf",
        "description": "Du erzeugst giftigen Nebel. Bei einem misslungenen Konstitutionsrettungswurf erleidet das Ziel 1W12 Giftschaden; der Schaden steigt auf höheren Charakterstufen."
    },
    {
        "id": "srd51-de-prestidigitation",
        "name": "Taschenspielerei",
        "aliases": [
            "Prestidigitation"
        ],
        "level": 0,
        "school": "Verwandlung",
        "castingTime": "1 Aktion",
        "range": "3 m",
        "components": "V, S",
        "duration": "Bis zu 1 Stunde",
        "ritual": false,
        "concentration": false,
        "saveOrAttack": "",
        "description": "Du erzeugst einen kleinen magischen Trick, etwa einen harmlosen Sinneseffekt, eine kleine Flamme, Reinigung oder Verschmutzung, Erwärmung oder Abkühlung, eine Markierung oder ein kleines nichtmagisches Schmuckstück."
    },
    {
        "id": "srd51-de-message",
        "name": "Botschaft",
        "aliases": [
            "Message"
        ],
        "level": 0,
        "school": "Verwandlung",
        "castingTime": "1 Aktion",
        "range": "36 m",
        "components": "V, S, M (ein kurzes Stück Kupferdraht)",
        "duration": "1 Runde",
        "ritual": false,
        "concentration": false,
        "saveOrAttack": "",
        "description": "Du flüsterst einer Kreatur eine Botschaft zu, die nur sie hört; sie kann dir leise antworten. Bestimmte Materialien und große Hindernisdicken blockieren die Magie."
    },
    {
        "id": "srd51-de-sacred-flame",
        "name": "Heilige Flamme",
        "aliases": [
            "Sacred Flame"
        ],
        "level": 0,
        "school": "Hervorrufung",
        "castingTime": "1 Aktion",
        "range": "18 m",
        "components": "V, S",
        "duration": "Unmittelbar",
        "ritual": false,
        "concentration": false,
        "saveOrAttack": "GE-Rettungswurf",
        "description": "Flammenähnliches Leuchten senkt sich auf eine sichtbare Kreatur. Bei misslungenem Geschicklichkeitsrettungswurf erleidet sie 1W8 gleißenden Schaden und erhält keinen Vorteil durch Deckung."
    },
    {
        "id": "srd51-de-eldritch-blast",
        "name": "Schauriger Strahl",
        "aliases": [
            "Eldritch Blast"
        ],
        "level": 0,
        "school": "Hervorrufung",
        "castingTime": "1 Aktion",
        "range": "36 m",
        "components": "V, S",
        "duration": "Unmittelbar",
        "ritual": false,
        "concentration": false,
        "saveOrAttack": "Fernkampf-Zauberangriff",
        "description": "Ein Strahl knisternder Energie verursacht bei einem Treffer 1W10 Energieschaden. Auf höheren Stufen erzeugst du mehrere getrennte Strahlen."
    },
    {
        "id": "srd51-de-light",
        "name": "Licht",
        "aliases": [
            "Light"
        ],
        "level": 0,
        "school": "Hervorrufung",
        "castingTime": "1 Aktion",
        "range": "Berührung",
        "components": "V, M (Glühwürmchen oder phosphoreszierendes Moos)",
        "duration": "1 Stunde",
        "ritual": false,
        "concentration": false,
        "saveOrAttack": "GE-Rettungswurf bei getragenem Gegenstand",
        "description": "Ein berührter Gegenstand spendet helles und dämmriges Licht. Die Lichtfarbe bestimmst du; bei einem getragenen Objekt kann ein Geschicklichkeitsrettungswurf nötig sein."
    },
    {
        "id": "srd51-de-disguise-self",
        "name": "Selbstverkleidung",
        "aliases": [
            "Disguise Self",
            "Disguise Selbst"
        ],
        "level": 1,
        "school": "Illusion",
        "castingTime": "1 Aktion",
        "range": "Selbst",
        "components": "V, S",
        "duration": "1 Stunde",
        "ritual": false,
        "concentration": false,
        "saveOrAttack": "Nachforschungen gegen Zauberrettungswurf-SG",
        "description": "Du veränderst dein äußeres Erscheinungsbild einschließlich Kleidung und Ausrüstung. Die Illusion hält einer Berührung nicht stand und kann durch Untersuchung erkannt werden."
    },
    {
        "id": "srd51-de-silent-image",
        "name": "Lautloses Trugbild",
        "aliases": [
            "Silent Image"
        ],
        "level": 1,
        "school": "Illusion",
        "castingTime": "1 Aktion",
        "range": "18 m",
        "components": "V, S, M (etwas Vlies)",
        "duration": "Konzentration, bis zu 10 Minuten",
        "ritual": false,
        "concentration": true,
        "saveOrAttack": "",
        "description": "Du erschaffst das sichtbare Abbild eines Gegenstands, einer Kreatur oder eines Phänomens. Das Bild kann bewegt werden, erzeugt aber keine Geräusche oder anderen Sinneseindrücke."
    },
    {
        "id": "srd51-de-find-familiar",
        "name": "Vertrauten finden",
        "aliases": [
            "Find Familiar"
        ],
        "level": 1,
        "school": "Beschwörung",
        "castingTime": "1 Stunde",
        "range": "3 m",
        "components": "V, S, M (Holzkohle, Weihrauch und Kräuter im Wert von 10 GM, verbraucht)",
        "duration": "Unmittelbar",
        "ritual": true,
        "concentration": false,
        "saveOrAttack": "",
        "description": "Du rufst einen vertrauten Geist in Tiergestalt. Der Vertraute kann nicht angreifen, kommuniziert telepathisch in begrenzter Entfernung und kann Berührungszauber für dich übermitteln."
    },
    {
        "id": "srd51-de-faerie-fire",
        "name": "Feenfeuer",
        "aliases": [
            "Faerie Fire"
        ],
        "level": 1,
        "school": "Hervorrufung",
        "castingTime": "1 Aktion",
        "range": "18 m",
        "components": "V",
        "duration": "Konzentration, bis zu 1 Minute",
        "ritual": false,
        "concentration": true,
        "saveOrAttack": "GE-Rettungswurf",
        "description": "Objekte und Kreaturen in einem Bereich werden bei misslungenem Geschicklichkeitsrettungswurf von farbigem Licht umgeben. Angriffe gegen sichtbare betroffene Ziele haben Vorteil, und Unsichtbarkeit hilft ihnen nicht."
    },
    {
        "id": "srd51-de-detect-magic",
        "name": "Magie entdecken",
        "aliases": [
            "Detect Magic"
        ],
        "level": 1,
        "school": "Erkenntnismagie",
        "castingTime": "1 Aktion",
        "range": "Selbst",
        "components": "V, S",
        "duration": "Konzentration, bis zu 10 Minuten",
        "ritual": true,
        "concentration": true,
        "saveOrAttack": "",
        "description": "Du spürst Magie im Umkreis von 9 m. Mit einer Aktion kannst du eine sichtbare Aura um magische Kreaturen oder Gegenstände erkennen und ihre Schule bestimmen."
    },
    {
        "id": "srd51-de-identify",
        "name": "Identifizieren",
        "aliases": [
            "Identify"
        ],
        "level": 1,
        "school": "Erkenntnismagie",
        "castingTime": "1 Minute",
        "range": "Berührung",
        "components": "V, S, M (Perle im Wert von mindestens 100 GM und Eulenfeder)",
        "duration": "Unmittelbar",
        "ritual": true,
        "concentration": false,
        "saveOrAttack": "",
        "description": "Du erfährst Eigenschaften, Aktivierung, Ladungen und erforderliche Einstimmung eines magischen Gegenstands. Bei einer Kreatur erkennst du stattdessen gegenwärtig auf ihr wirkende Zauber."
    },
    {
        "id": "srd51-de-shield",
        "name": "Schild",
        "aliases": [
            "Shield"
        ],
        "level": 1,
        "school": "Bannmagie",
        "castingTime": "1 Reaktion",
        "range": "Selbst",
        "components": "V, S",
        "duration": "1 Runde",
        "ritual": false,
        "concentration": false,
        "saveOrAttack": "",
        "description": "Als Reaktion auf einen Treffer oder Magisches Geschoss entsteht eine unsichtbare Barriere. Bis zum Beginn deines nächsten Zuges erhältst du +5 auf die Rüstungsklasse und wirst nicht von Magischem Geschoss getroffen."
    },
    {
        "id": "srd51-de-magic-missile",
        "name": "Magisches Geschoss",
        "aliases": [
            "Magic Missile"
        ],
        "level": 1,
        "school": "Hervorrufung",
        "castingTime": "1 Aktion",
        "range": "36 m",
        "components": "V, S",
        "duration": "Unmittelbar",
        "ritual": false,
        "concentration": false,
        "saveOrAttack": "Automatischer Treffer",
        "description": "Drei leuchtende Geschosse treffen automatisch Ziele deiner Wahl. Jedes Geschoss verursacht 1W4+1 Energieschaden; höhere Zauberplätze erzeugen weitere Geschosse."
    },
    {
        "id": "srd51-de-mage-armor",
        "name": "Magische Rüstung",
        "aliases": [
            "Mage Armor"
        ],
        "level": 1,
        "school": "Bannmagie",
        "castingTime": "1 Aktion",
        "range": "Berührung",
        "components": "V, S, M (ein Stück gegerbtes Leder)",
        "duration": "8 Stunden",
        "ritual": false,
        "concentration": false,
        "saveOrAttack": "",
        "description": "Eine willige ungerüstete Kreatur erhält eine Grund-Rüstungsklasse von 13 plus Geschicklichkeitsmodifikator. Der Zauber endet, wenn das Ziel eine Rüstung anlegt."
    },
    {
        "id": "srd51-de-comprehend-languages",
        "name": "Sprachen verstehen",
        "aliases": [
            "Comprehend Languages"
        ],
        "level": 1,
        "school": "Erkenntnismagie",
        "castingTime": "1 Aktion",
        "range": "Selbst",
        "components": "V, S, M (Ruß und Salz)",
        "duration": "1 Stunde",
        "ritual": true,
        "concentration": false,
        "saveOrAttack": "",
        "description": "Du verstehst die wörtliche Bedeutung gesprochener Sprachen und kannst geschriebene Sprachen lesen, wenn du die Oberfläche berührst."
    },
    {
        "id": "srd51-de-animal-friendship",
        "name": "Tierfreundschaft",
        "aliases": [
            "Animal Friendship"
        ],
        "level": 1,
        "school": "Verzauberung",
        "castingTime": "1 Aktion",
        "range": "9 m",
        "components": "V, S, M (ein Bissen Nahrung)",
        "duration": "24 Stunden",
        "ritual": false,
        "concentration": false,
        "saveOrAttack": "WE-Rettungswurf",
        "description": "Ein Tier mit sehr niedriger Intelligenz erkennt, dass du keine Gefahr darstellst. Misslingt sein Weisheitsrettungswurf, ist es für die Wirkungsdauer von dir bezaubert."
    },
    {
        "id": "srd51-de-healing-word",
        "name": "Heilendes Wort",
        "aliases": [
            "Healing Word"
        ],
        "level": 1,
        "school": "Hervorrufung",
        "castingTime": "1 Bonusaktion",
        "range": "18 m",
        "components": "V",
        "duration": "Unmittelbar",
        "ritual": false,
        "concentration": false,
        "saveOrAttack": "",
        "description": "Eine sichtbare Kreatur erhält 1W4 plus deinen Zauberwirken-Modifikator Trefferpunkte zurück. Untote und Konstrukte werden nicht geheilt."
    },
    {
        "id": "srd51-de-armor-of-agathys",
        "name": "Rüstung von Agathys",
        "aliases": [
            "Armor of Agathys"
        ],
        "level": 1,
        "school": "Bannmagie",
        "castingTime": "1 Aktion",
        "range": "Selbst",
        "components": "V, S, M (eine Tasse Wasser)",
        "duration": "1 Stunde",
        "ritual": false,
        "concentration": false,
        "saveOrAttack": "",
        "description": "Schützender Frost verleiht dir temporäre Trefferpunkte. Solange diese bestehen, erleidet eine Kreatur, die dich im Nahkampf trifft, Kälteschaden."
    },
    {
        "id": "srd51-de-protection-evil-good",
        "name": "Schutz vor Gut und Böse",
        "aliases": [
            "Protection from Evil and Good"
        ],
        "level": 1,
        "school": "Bannmagie",
        "castingTime": "1 Aktion",
        "range": "Berührung",
        "components": "V, S, M (Weihwasser oder Silber- und Eisenpulver)",
        "duration": "Konzentration, bis zu 10 Minuten",
        "ritual": false,
        "concentration": true,
        "saveOrAttack": "",
        "description": "Eine willige Kreatur wird gegen bestimmte übernatürliche Kreaturentypen geschützt. Deren Angriffe haben Nachteil, und sie können das Ziel schwerer bezaubern, verängstigen oder in Besitz nehmen."
    },
    {
        "id": "srd51-de-mirror-image",
        "name": "Spiegelbilder",
        "aliases": [
            "Mirror Image"
        ],
        "level": 2,
        "school": "Illusion",
        "castingTime": "1 Aktion",
        "range": "Selbst",
        "components": "V, S",
        "duration": "1 Minute",
        "ritual": false,
        "concentration": false,
        "saveOrAttack": "",
        "description": "Drei illusorische Doppelbilder bewegen sich mit dir. Bei einem Angriff gegen dich kann stattdessen ein Doppelbild getroffen und zerstört werden."
    },
    {
        "id": "srd51-de-enlarge-reduce",
        "name": "Vergrößern/Verkleinern",
        "aliases": [
            "Enlarge/Reduce"
        ],
        "level": 2,
        "school": "Verwandlung",
        "castingTime": "1 Aktion",
        "range": "9 m",
        "components": "V, S, M (eine Prise Eisenpulver)",
        "duration": "Konzentration, bis zu 1 Minute",
        "ritual": false,
        "concentration": true,
        "saveOrAttack": "KO-Rettungswurf bei unwilligem Ziel",
        "description": "Du vergrößerst oder verkleinerst eine Kreatur oder einen Gegenstand. Die Größenänderung beeinflusst Stärkeproben und -rettungswürfe sowie den Waffenschaden des Ziels."
    },
    {
        "id": "srd51-de-detect-thoughts",
        "name": "Gedanken wahrnehmen",
        "aliases": [
            "Detect Thoughts"
        ],
        "level": 2,
        "school": "Erkenntnismagie",
        "castingTime": "1 Aktion",
        "range": "Selbst",
        "components": "V, S, M (eine Kupfermünze)",
        "duration": "Konzentration, bis zu 1 Minute",
        "ritual": false,
        "concentration": true,
        "saveOrAttack": "WE-Rettungswurf beim tieferen Eindringen",
        "description": "Du liest zunächst die oberflächlichen Gedanken einer Kreatur. Du kannst tiefer eindringen oder nach denkenden Wesen suchen; ein widerstehendes Ziel kann einen Weisheitsrettungswurf ablegen."
    },
    {
        "id": "srd51-de-invisibility",
        "name": "Unsichtbarkeit",
        "aliases": [
            "Invisibility"
        ],
        "level": 2,
        "school": "Illusion",
        "castingTime": "1 Aktion",
        "range": "Berührung",
        "components": "V, S, M (eine Wimper in Gummiarabikum)",
        "duration": "Konzentration, bis zu 1 Stunde",
        "ritual": false,
        "concentration": true,
        "saveOrAttack": "",
        "description": "Eine berührte Kreatur und ihre getragene Ausrüstung werden unsichtbar. Der Zauber endet für ein Ziel, sobald es angreift oder einen Zauber wirkt."
    },
    {
        "id": "srd51-de-suggestion",
        "name": "Einflüsterung",
        "aliases": [
            "Suggestion"
        ],
        "level": 2,
        "school": "Verzauberung",
        "castingTime": "1 Aktion",
        "range": "9 m",
        "components": "V, M (Schlangenzunge und etwas Honig oder süßes Öl)",
        "duration": "Konzentration, bis zu 8 Stunden",
        "ritual": false,
        "concentration": true,
        "saveOrAttack": "WE-Rettungswurf",
        "description": "Du formulierst einen vernünftig klingenden Handlungsvorschlag. Bei misslungenem Weisheitsrettungswurf verfolgt das Ziel diesen Kurs, bis er erfüllt ist oder der Zauber endet."
    },
    {
        "id": "srd51-de-darkness",
        "name": "Dunkelheit",
        "aliases": [
            "Darkness"
        ],
        "level": 2,
        "school": "Hervorrufung",
        "castingTime": "1 Aktion",
        "range": "18 m",
        "components": "V, M (Fledermausfell und Pech oder Kohle)",
        "duration": "Konzentration, bis zu 10 Minuten",
        "ritual": false,
        "concentration": true,
        "saveOrAttack": "",
        "description": "Magische Dunkelheit erfüllt einen Bereich. Normale Dunkelsicht durchdringt sie nicht, und nichtmagisches Licht kann sie nicht erhellen."
    },
    {
        "id": "srd51-de-misty-step",
        "name": "Nebelschritt",
        "aliases": [
            "Misty Step"
        ],
        "level": 2,
        "school": "Beschwörung",
        "castingTime": "1 Bonusaktion",
        "range": "Selbst",
        "components": "V",
        "duration": "Unmittelbar",
        "ritual": false,
        "concentration": false,
        "saveOrAttack": "",
        "description": "Silbriger Nebel umgibt dich, und du teleportierst dich bis zu 9 m weit an einen freien Ort, den du sehen kannst."
    },
    {
        "id": "srd51-de-fireball",
        "name": "Feuerball",
        "aliases": [
            "Fireball"
        ],
        "level": 3,
        "school": "Hervorrufung",
        "castingTime": "1 Aktion",
        "range": "45 m",
        "components": "V, S, M (Fledermausguano und Schwefel)",
        "duration": "Unmittelbar",
        "ritual": false,
        "concentration": false,
        "saveOrAttack": "GE-Rettungswurf",
        "description": "Eine Explosion füllt eine Kugel mit 6 m Radius. Kreaturen erleiden bei misslungenem Geschicklichkeitsrettungswurf 8W6 Feuerschaden, bei Erfolg die Hälfte."
    },
    {
        "id": "srd51-de-hypnotic-pattern",
        "name": "Hypnotisches Muster",
        "aliases": [
            "Hypnotic Pattern"
        ],
        "level": 3,
        "school": "Illusion",
        "castingTime": "1 Aktion",
        "range": "36 m",
        "components": "S, M (glühender Weihrauch oder phosphoreszierendes Material)",
        "duration": "Konzentration, bis zu 1 Minute",
        "ritual": false,
        "concentration": true,
        "saveOrAttack": "WE-Rettungswurf",
        "description": "Ein verschlungenes Farbmuster erscheint. Betroffene Kreaturen sind bei misslungenem Weisheitsrettungswurf bezaubert, kampfunfähig und bewegungsunfähig, bis sie Schaden erleiden oder geweckt werden."
    },
    {
        "id": "srd51-de-counterspell",
        "name": "Gegenzauber",
        "aliases": [
            "Counterspell"
        ],
        "level": 3,
        "school": "Bannmagie",
        "castingTime": "1 Reaktion",
        "range": "18 m",
        "components": "S",
        "duration": "Unmittelbar",
        "ritual": false,
        "concentration": false,
        "saveOrAttack": "Zauberwirken-Probe bei höherem Zaubergrad",
        "description": "Du versuchst, den Zauber einer sichtbaren Kreatur während des Wirkens zu unterbrechen. Niedrigere Zauber scheitern automatisch; bei höheren Graden kann eine Probe nötig sein."
    }
]);

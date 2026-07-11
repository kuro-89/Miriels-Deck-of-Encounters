/**
 * Modul: srd-5.2.1-spell-library.js
 *
 * Aufgabe:
 * Stellt eine getrennte, kuratierte Auswahl aus dem deutschen SRD 5.2.1
 * für die 2024/5.5e-Regelfassung bereit.
 *
 * Verantwortlich für:
 * - strukturierte, geprüfte SRD-5.2.1-Zaubervorlagen
 * - Metadaten der 5.2.1-Bibliothek
 *
 * Nicht verantwortlich für:
 * - Rendering
 * - Kartenänderungen
 * - automatische Regelkonvertierung zwischen 5.1 und 5.2.1
 *
 * Zentrale Attribution:
 * - legal.html
 * - THIRD_PARTY_NOTICES.md
 */
const srd521SpellLibraryMeta = Object.freeze({
    key: "srd521-de",
    label: "SRD 5.2.1 · 2024-Regeln",
    shortLabel: "SRD 5.2.1",
    license: "CC BY 4.0",
    noticeHref: "legal.html#srd-521-license"
});

const srd521SpellLibrary = Object.freeze([
    {
        "id": "srd521-de-verwuenschung",
        "name": "Verwünschung",
        "aliases": [
            "Hex",
            "Verwünschen"
        ],
        "level": 1,
        "school": "Verzauberungsmagie",
        "castingTime": "1 Bonusaktion",
        "range": "27 m",
        "components": "V, G, M (versteinertes Auge eines Molchs)",
        "duration": "Konzentration, bis zu 1 Stunde",
        "ritual": false,
        "concentration": true,
        "saveOrAttack": "",
        "description": "Du verfluchst eine sichtbare Kreatur in Reichweite. Wenn du sie mit einem Angriffswurf triffst, erleidet sie zusätzlich 1W6 nekrotischen Schaden. Außerdem hat sie Nachteil auf Attributswürfe eines von dir gewählten Attributs. Sinkt sie auf 0 Trefferpunkte, kannst du den Fluch in einem späteren Zug mit einer Bonusaktion auf ein neues Ziel übertragen."
    }
]);

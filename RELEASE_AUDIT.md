# Release Audit 0.26.0

## Umfang

Release 0.26.0 führt einen bewusst kleinen ES-Modul-Schnitt ein. Die fachliche Hauptlogik bleibt in `js/app.js`; es gab keine große Zerlegung und keine neue größere SRD-Inhaltsübernahme.

## Neue Modulgrenzen

- `js/config.js`: Version, Karten-/Encounter-Konstanten, Speicherkennungen, Sicherheitslimits und allgemeine App-Konfiguration
- `js/utils.js`: DOM-unabhängige ID-Erzeugung
- `js/access.js`: Rollen, Sichtbarkeit, Zugriffsrichtlinien und Aktionsberechtigungen
- `js/state.js`: Fabriken für initialen Spiel- und UI-Zustand
- `js/content-metadata.js`: strikt getrennte Metadaten für SRD 5.1 und SRD 5.2.1
- `js/app.js`: importiert diese Module und behält Rendering sowie fachliche Abläufe

`index.html` lädt `js/app.js` nun mit `type="module"`. Die bestehenden Inline-Handler bleiben über eine ausdrücklich markierte globale Kompatibilitätsschicht verfügbar. Damit wird ihr Verhalten in diesem Release nicht still geändert.

## Importgraph

```text
index.html
├── js/srd-spell-library.js              (klassisches Datenskript, SRD 5.1)
├── js/srd-5.2.1-spell-library.js        (klassisches Datenskript, SRD 5.2.1)
├── js/demo-data.js                      (klassisches Datenskript)
├── js/game-state-schema.js              (ES-Modul für Import, Validierung und Normalisierung)
└── js/app.js                            (ES-Modul)
    ├── js/config.js
    ├── js/utils.js
    ├── js/access.js
    ├── js/state.js
    │   ├── js/config.js
    │   └── js/utils.js
    └── js/content-metadata.js
```

## Automatische Prüfungen

Erfolgreich in der Erstellungsumgebung:

- `node --check` für alle JavaScript-Dateien einschließlich Tests und Konfiguration
- 9 Vitest-Unit-Tests in 2 Testdateien
- `npm ci` aus dem mitgelieferten Lockfile, 0 gemeldete Sicherheitslücken

Nicht als bestanden gewertet:

- Die 10 Playwright-Browser-Tests konnten in dieser isolierten Erstellungsumgebung nicht bis zur App ausgeführt werden. Der vorhandene System-Chromium blockiert Zugriffe auf `127.0.0.1` und `localhost` administrativ mit `ERR_BLOCKED_BY_ADMINISTRATOR`. Der Playwright-eigene Chromium-Download war zusätzlich durch DNS-Sperre nicht möglich.
- Dies ist ein Umgebungsblocker, kein beobachteter fachlicher Testfehler. Die Suite muss lokal erneut vollständig ausgeführt werden; ein grüner Browserlauf wird hier ausdrücklich nicht behauptet.

## Rechtliche Trennung

- SRD 5.1 und SRD 5.2.1 bleiben getrennte Datenskripte und getrennte Metadatensätze.
- Es wurde kein neuer SRD-Inhalt übernommen oder umklassifiziert.
- Die Änderung beansprucht keine vollständige Rechtssicherheit; bestehende Attributionen und Prüfhinweise bleiben maßgeblich.

## Bekannte Risiken

- Klassische Inhalts-/Schema-Skripte und das ES-Modul laufen vorerst gemeinsam. Diese Übergangsarchitektur ist absichtlich klein, aber noch kein vollständig modularer Aufbau.
- Die Inhaltsmetadaten werden im neuen Modul separat gespiegelt. Änderungen an den klassischen Bibliotheksmetadaten müssen bis zu deren späterer Modulmigration synchron gehalten werden.
- Die globale Handler-Kompatibilitätsschicht ist umfangreich und soll erst in späteren, getesteten Schritten durch `addEventListener` ersetzt werden.
- `app.js` bleibt groß; dieser Release reduziert nur klar abgrenzbare Verantwortlichkeiten.

## Manuelle Resttests

1. App über einen lokalen HTTP-Server öffnen; Start ohne Konsolen- oder Modulfehler prüfen.
2. Alle 10 Playwright-Tests lokal ausführen.
3. Kartenanlage, Bearbeitung, Löschen, Reload und Local Storage prüfen.
4. Encounter starten, Zug vor/zurück, Schaden, Heilung, Temp-HP, Conditions und Undo prüfen.
5. Spieleransicht in zweitem Tab und BroadcastChannel-Synchronisation prüfen.
6. Import/Export sowie lesbaren Encounter-Bericht prüfen.
7. Kartenschmiede: freie Spells und beide getrennten SRD-Bibliotheken prüfen.
8. Footer-Links zu `legal.html`, `imprint.html` und `privacy.html` öffnen.

## Zusätzliche Kosten

- Keine neuen Laufzeitdienste, APIs, Backends oder kostenpflichtigen Abhängigkeiten.
- Keine zusätzlichen direkten Nutzungskosten durch Release 0.26.0.
- Für lokale Entwicklung bleiben lediglich die üblichen eigenen Infrastruktur-/Internetkosten für `npm ci` und gegebenenfalls `npx playwright install chromium`.

## Ergänzung: einheitlicher HTTP-Start

- Der vorübergehende, manuell zu synchronisierende Offline-Fallback `js/app-offline.js` wurde entfernt.
- `index.html` lädt ausschließlich `js/app.js` als natives ES-Modul.
- `server.js` stellt lokal die unveränderten statischen Projektdateien über HTTP bereit.
- `npm start` und `npm run dev` starten diesen Server auf `127.0.0.1:3000`.
- Playwright verwendet denselben Server auf Port 4173.
- GitHub Pages bleibt kompatibel, weil der Browsercode keine Node.js-Module importiert und weiterhin rein statisch ausgeliefert werden kann.
- Es wurden keine API, Datenbank, Konten oder serverseitige Spielstandsablage eingeführt.
- Zusätzliche Laufzeitkosten: keine. Der lokale Server verwendet ausschließlich in Node.js enthaltene Module.

## Korrektur und Ausbau des ES-Modul-Bootstraps

Die erste 0.26.0-Migration ließ eine bestehende Laufzeitkopplung zwischen `demo-data.js` und Modellfabriken aus `app.js` unberücksichtigt. Diese Kopplung ist nun vollständig als Modulbeziehung abgebildet.

- `demo-data.js` ist ein ES-Modul und exportiert `createDemoCards` ausdrücklich.
- `card-model.js` enthält die gemeinsam von App und Demo verwendeten Karten-, Zauber-, Trait- und Inventarfabriken samt eng gekoppelten Validierungshelfern.
- `demo-data.js` importiert diese Funktionen direkt aus `card-model.js`.
- Die vorübergehende Datei `demo-model-api.js` wurde entfernt.
- Es gibt keine globale Demo-Brücke über `window` oder `globalThis` mehr.
- `app.js` bleibt die zentrale UI- und Ablaufdatei; es wurde nicht großflächig zerlegt.

### Ergänzter Importgraph

```text
index.html
└── js/app.js
    ├── js/demo-data.js
    │   └── js/card-model.js
    │       ├── js/config.js
    │       └── js/utils.js
    ├── js/card-model.js
    ├── js/config.js
    ├── js/utils.js
    ├── js/access.js
    ├── js/state.js
    │   ├── js/config.js
    │   └── js/utils.js
    └── js/content-metadata.js
```

### Prüfung

- `node --check` für alle JavaScript-Dateien: bestanden.
- Vitest: 15 von 15 Tests bestanden.
- Playwright konnte in der Ausführungsumgebung nicht fachlich laufen, weil der von der installierten Playwright-Version erwartete Chromium-Testbrowser nicht vorhanden war. Die Suite brach vor dem ersten App-Test beim Browserstart ab.



## SRD-Bibliotheken als ES-Module

- `js/srd-spell-library.js` exportiert Metadaten und Bibliothek für SRD 5.1.
- `js/srd-5.2.1-spell-library.js` exportiert Metadaten und Bibliothek für SRD 5.2.1.
- `js/app.js` importiert beide Bibliotheken ausdrücklich.
- Die beiden Regelstände bleiben in getrennten Dateien und getrennten Datenbeständen.
- Die klassischen `<script>`-Einträge wurden aus `index.html` entfernt.

Prüfstand dieses Schritts:

- `node --check` für alle JavaScript-Dateien: bestanden
- Vitest: 18 von 18 Tests bestanden
- Playwright: nicht gestartet, weil das zur installierten Playwright-Version gehörende Chromium-Binary in der Ausführungsumgebung fehlt

## UI-Ereignisse ohne globale Browser-Brücke

Die statischen und dynamisch erzeugten Inline-Handler (`onclick`, `onchange`, `oninput`, `onsubmit`) wurden entfernt. Die Oberfläche verwendet nun `data-ui-*`-Attribute und eine zentrale modulinterne Ereignisdelegation in `js/app.js`. Der frühere `Object.assign(window, { ... })`-Kompatibilitätsblock wurde vollständig entfernt.

Diese Änderung betrifft ausschließlich die Ereignisverdrahtung. Die aufgerufenen Fachfunktionen und ihr Verhalten wurden nicht absichtlich verändert.

## Architekturabschluss: UI-Grundmodule und Fokusstage

Für den abschließenden 0.26.0-Architekturschritt wurden vier klar abgegrenzte Bereiche aus `app.js` extrahiert:

- `js/app-view.js`: URL-basierte DM-/Spieleransicht und statische Ansichtsumschaltung.
- `js/browser-storage.js`: fehlertoleranter Zugriff auf `localStorage`.
- `js/focus-stage.js`: Rendering der Fokuskarte und ihrer linken/rechten Geisterkarten.
- `js/ui-events.js`: zentrale Ereignisdelegation für `data-ui-*` ohne globale Handler.

Jede neue Datei dokumentiert Zweck, Abhängigkeiten und bereitgestellte Funktionen. Die zuvor unsichtbaren Geisterkarten wurden repariert: Ihre Elemente waren vorhanden, besaßen aber keine explizite linke/rechte Positionierung und lagen deshalb hinter der Hauptkarte.

### Zusätzlicher Importgraph

```text
app.js
├── app-view.js
├── browser-storage.js
├── focus-stage.js
└── ui-events.js
```

### Tests

- 22 Vitest-Unit-Tests bestanden.
- Neuer Playwright-Test prüft per Bounding-Box, dass beide Geisterkarten links bzw. rechts der Hauptkarte stehen.
- Der Browserlauf konnte in der bereitgestellten Umgebung nicht fachlich ausgeführt werden, weil das zur Playwright-Version gehörende Chromium-Binary fehlt; der System-Chromium ist administrativ eingeschränkt.

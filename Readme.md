# Miriel’s Deck of Encounters

v0.26.0 by kuro

Miriel’s Deck of Encounters is a static, card-based encounter manager for fantasy pen-and-paper roleplaying sessions. It runs as a browser application over HTTP or HTTPS and is prepared for publication through GitHub Pages.

The current release is a free, ad-free, non-commercial hobby project. It has no accounts, no backend, no project-operated uploads, and no server-side storage of card content.

## Public pages

- `index.html` – application
- `legal.html` – licenses and project information
- `privacy.html` – privacy information for GitHub Pages
- `imprint.html` – provider and contact information
- `ASSET_PROVENANCE.md` – provenance of bundled illustrations
- `LICENSE.md` – proprietary project notice and SRD exception

## Licensing summary

Original project code, interface elements, editorial text, characters, and project-created assets are proprietary unless expressly stated otherwise. All rights are reserved. A public GitHub repository permits viewing and forking through GitHub as required by GitHub’s Terms of Service, but does not grant a broader open-source license.

The project includes CC-BY-4.0 material from SRD 5.1 and SRD 5.2.1. The complete attribution and modification notices are maintained centrally in `legal.html` and `THIRD_PARTY_NOTICES.md`.

The project is independent and not official.

## Current status

The project is a static browser application built with HTML, CSS, and JavaScript. Locally it is served by a small Node.js development server; online it can be deployed unchanged through GitHub Pages.

Cards, settings, and imported images are stored locally in the browser. GitHub may process technical connection data when the hosted website is visited; see `privacy.html`.

There is currently no backend, database, account system, server-side save system, analytics service, advertising, or project-operated tracking.


## Local start with Node.js

Node.js 20 or newer is required for local development.

```bash
npm install
npm start
```

Then open `http://127.0.0.1:3000` in the browser. Stop the server with `Ctrl+C`. Directly opening `index.html` through `file://` is no longer a supported start method because the app now uses native ES modules.

The Node server only serves static files. It is not yet a data backend: cards and settings remain in browser storage, and GitHub Pages continues to work without Node.js. A detailed German explanation is available in `NODE_SERVER_GUIDE.md`.

## Main Views

### Spielleiter-Ansicht

The game master view is the main control surface. It contains:

- The active **Spieltisch** for the running encounter.
- The **Kartendeck** for preparation and reserve cards.
- The **Spielleiter-Atelier** with tools, card editing, presentation controls, and archive functions.
- Full internal card data, private notes, HP values, actions, traits, spells, inventory, and encounter controls.

### Spieltisch-Anzeige

The tabletop display is a passive public display intended for a second browser tab, external monitor, beamer, or shared screen.

It shows only public encounter information, such as:

- Current round and turn.
- The active public card.
- Previous and next cards in the initiative stage.
- Public initiative ribbon.
- Public HP display according to each card’s visibility mode.
- Publicly visible conditions.
- Miriels Schautafel for round calls, initiative previews, and manual image/text boards.

Before an encounter is started, the tabletop display hides cards and initiative information and shows a waiting board instead.

## Implemented Features

### Encounter Start Gate

The public tabletop display is locked until the game master starts the encounter.

Before start:

- Public cards are hidden.
- Initiative is hidden.
- Turn information is hidden.
- Miriels Schautafel shows the waiting message.

After start:

- The public stage is shown.
- The encounter begins at round 1.
- Miriels Schautafel displays the starting round call.

The start/end action is handled by one state-dependent button in the round controls:

- **Starten** before the encounter begins.
- **Beenden** while the encounter is running.

### Core Card System

The app supports creature and encounter cards with:

- Internal game master name.
- Public player-facing name.
- Card type: Player, NPC, or Monster.
- Card zone: hand or deck.
- Initiative value.
- Current HP, max HP, and temporary HP.
- Armor Class.
- Passive values.
- Conditions.
- Public HP visibility mode.
- Image path or locally stored browser image data.
- Actions, traits, spells, notes, and inventory text.
- Item/action display support for selected inventory entries.

Cards can be created, copied, edited, moved between hand and deck, selected, focused, archived, imported, exported, and removed.

### Spieltisch

The Spieltisch is the active encounter surface. It includes:

- Round and turn information.
- Previous/next turn controls.
- Encounter start/end control.
- Focus card.
- Card detail tabs.
- Initiative hand ribbon.
- Game master console with encounter chronicle and table whisper preview.

The current active card is highlighted in blue. Selected targets are highlighted in gold. Critical or destructive actions use ruby/red.

### Card Detail Tabs

The active card detail panel supports structured tabs for:

- Profile.
- Actions.
- Traits.
- Spells.
- Notes.
- Inventory.

This keeps larger cards readable while allowing the game master to inspect relevant information during a running encounter.

### Spielleiter-Atelier

The Spielleiter-Atelier is the game master’s tool area. It contains:

- Werkzeugkiste.
- Kartenschmiede.
- Miriels Schautafel controls.
- Archiv.

It is intended for quick game master actions without turning the main Spieltisch into a heavy editing surface.

### Werkzeugkiste

The Werkzeugkiste supports actions on selected targets, including:

- Apply damage.
- Apply healing.
- Set temporary HP.
- Add conditions.
- Remove conditions.

Damage is applied to temporary HP first before reducing normal HP.

### Kartenschmiede

The Kartenschmiede is used to create and edit cards. It supports card data such as:

- Names.
- Type.
- Initiative.
- HP and temporary HP.
- Armor Class.
- Passive values.
- Public HP visibility.
- Image path or uploaded image.
- Conditions.
- Actions.
- Traits.
- Spells.
- Notes.
- Inventory.

Images selected in the browser are processed locally before being stored in the browser state.

### Kartendeck

The Kartendeck is the preparation and reserve area. It supports:

- Searching.
- Filtering.
- Sorting.
- Selecting multiple deck cards.
- Moving selected cards to the hand.
- Managing card reserves before or during an encounter.

Cards in the deck are not automatically part of the active initiative until moved to the hand.

### Miriels Schautafel

Miriels Schautafel is the public presentation board inside the tabletop display.

It supports:

- Waiting board before encounter start.
- Round calls.
- Initiative previews.
- Manual image boards.
- Manual text boards.
- Image + text boards.
- Text size presets.
- Text position presets.
- Board preview in the Spielleiter-Atelier.

Manual Schautafel boards can be used for locations, clues, atmosphere, scene images, announcements, or table-facing messages.

### Spieltisch-Anzeige

The Spieltisch-Anzeige is the passive player-facing display. It is opened with:

```text
?view=player
```

The Spielleiter-Ansicht is opened with:

```text
?view=dm
```

Both views currently run inside the same local browser app. This is useful for a local second display, but it is not a secure separation of private and public information.

### Local Saving and Synchronization

The app stores encounter state in the browser using `localStorage`.

The state includes:

- Encounter name.
- Encounter start state.
- Round number.
- Current turn index.
- Creature/card list.
- Card zone state.
- HP and temporary HP.
- Conditions.
- Initiative values.
- Public HP visibility settings.
- Combat log / encounter chronicle.
- Table whisper preview state.
- Miriels Schautafel settings.
- Locally stored image data where applicable.

Local tab synchronization uses `BroadcastChannel` with a fallback strategy for player display updates.

Browser-local saving is convenient, but it remains tied to the current browser and device. It is not a database and not a server-backed save system.

### Encounter Export and Import

Encounter state can be exported as JSON and imported again later.

The archive area supports save/load workflows for:

- Browser storage.
- Encounter export.
- Encounter import.
- Demo cards.
- Reset and cleanup functions.

Exported JSON files are recommended for backups or prepared sessions.

Import validation currently allows up to:

- 1,000 cards per encounter export.
- 150 traits and 150 actions per card.
- 500 spells and 500 item cards per card.
- 1,000 regular inventory entries per card.
- 20 MB for JSON exports without embedded images.
- 100 MB for exports containing embedded raster images.

Files that exceed a limit are rejected with an error message; imported collections are not silently shortened.

### UI and Visual Design

The app uses a dark fantasy interface with:

- Card-like panels.
- Arcane background artwork.
- Distinct areas for Spieltisch, Kartendeck, Atelier, and Spieltisch-Anzeige.
- Horizontal card ribbons.
- Scroll buttons for card rows.
- Compact feed-style game master console.
- Header-based handbuch / quick guide.
- Responsive behavior for desktop and larger tablet displays.

The current target layout is desktop, laptop, and larger tablet landscape use. Smartphone layouts are not the primary target yet.

## Color Logic

The app uses a consistent color language:

- **Blue**: active card, current turn, focus, selected UI state.
- **Gold**: target selection or target-related actions.
- **Ruby / red**: damage, delete, end, or critical actions.
- **Violet / lilac**: neutral magical UI, structure, and emphasis.

Gold is intentionally reserved for target or goal states and is not used for ordinary buttons.

## Public HP Visibility Modes

Each card can define how much HP information is visible on the tabletop display.

### `full`

Players see:

- Current HP.
- Max HP.
- HP bar.
- Public damage state.

### `bar`

Players see:

- HP bar.
- Public damage state.

### `descriptive`

Players see only a descriptive state or aura, without HP numbers and without a normal HP bar.

### `hidden`

Players see no public HP information.

The game master always sees the internal HP values.

## Image Handling

The app uses two image types:

1. Project images referenced by file path, for example card images in `Images/` or UI backgrounds in `assets/`.
2. Browser-selected images converted to local browser data and stored in the current browser state.

Browser-selected image data can increase local storage use and exported JSON file size. Large uploaded board images are processed before storage where possible.

Recommended card image handling for project assets:

- Use images that are already optimized for the card frame.
- Prefer a maximum long edge of roughly `1100 px` for demo card images.
- Use good compression rather than full-resolution source files for bundled demo assets.
- Keep large background and header assets at higher resolution because they fill broad UI areas.

Use only images that you have the right to use.

Do not add copyrighted artwork directly to this project unless you have explicit permission to do so.

## Aktuelle Modulgrenzen in 0.26.0

Der große Architektur-Schritt trennt nun zusätzlich:

- `encounter-actions.js`: reine Kampf- und Condition-Mutationen ohne DOM.
- `persistence-controller.js`: Serialisierung und lokale Speicherzugriffe.
- `card-rendering.js`: gemeinsame DOM-Bausteine für Kartenlisten.
- `encounter-rendering.js`: kleine darstellungsbezogene Encounter-Formatierungen.
- `app-bootstrap.js`: explizite und testbare Startreihenfolge.

`app.js` bleibt die Orchestrierungsschicht und verbindet diese Fachmodule mit dem bestehenden Zustand und der Oberfläche.

## Current Architecture

The project is currently a static browser app.

There is one shared encounter state in `app.js`. Rendering follows this general pattern:

```text
State changes -> renderCards() -> UI is rebuilt from the current state
```

The code is organized around:

- Global state and constants.
- View mode handling.
- Browser storage.
- Tab synchronization.
- Card queries and sorting.
- Turn and round logic.
- Scroll and focus preservation.
- Card movement.
- HP and combat actions.
- Conditions.
- Image processing.
- Import and export.
- Public display data.
- Miriels Schautafel.
- HTML generation.
- Card editing.
- Rendering.

The project intentionally remains framework-free and build-step-free for now.

## Important Security Note

The current release is a statically hosted browser application. The player-facing display is not a security boundary because all local state is processed in the same client application.

Hidden information is hidden in the interface, but the full state can still exist in the same browser-side JavaScript application.

A future server-backed version should send only public data to player clients. Secret values should not merely be hidden with CSS or client-side rendering logic.

## Content Audit Notes

The bundled demo cards have been revised to reduce reliance on names associated with non-SRD publications. Several species, class features, spells, backgrounds, magic items, and healing-potion templates now use project-created names. The long backstories for Miriel, Suica, and Liora were removed from the bundled demo data.

Examples of project-created replacements include **Chaosfee**, **Arkane Kartenmeisterin**, **Resonanzschnitt**, **Chaossplitter**, **Schlangenblütige**, **Arkane Schreibfeder**, **Sternengeborene**, and **Sternenbrand**. These names and their project-written descriptions are not presented as official Dungeons & Dragons content.

Die mitgelieferten Demo-Inhalte wurden für Version 0.26.0 redaktionell geprüft und überwiegend einheitlich auf Deutsch formuliert. Etablierte SRD-5.1-Regelbegriffe und interne Import-Aliase können dort bestehen bleiben, wo sie für Regelverständnis oder Rückwärtskompatibilität erforderlich sind.

The bundled AI-generated and project-created images are documented file by file in `ASSET_PROVENANCE.md`. According to the documented project review, they use no third-party source images, official logos, or intentionally reproduced official artwork.

## Known Limitations

- No backend.
- No database.
- No server-side persistence.
- No user accounts.
- No real multi-device network mode yet.
- No secure separation between game master data and player-facing data.
- Browser-local saving depends on the current browser and device.
- Browser-selected images can increase state and export size.
- Smartphone layouts are not fully supported.
- No deployment setup.
- No server-side image upload.

## Planned / Possible Future Features

Possible future directions include:

- Server-backed encounter state.
- Separate secure DM and player routes.
- Public-data filtering on the server.
- Local network access for phones, tablets, and second monitors.
- Interactive player device views.
- Player-side table whisper input.
- Player-side limited damage/healing proposals.
- More robust save/load management.
- Backend image upload.
- Optional desktop packaging.

These are possible development directions and not promises or public roadmap commitments. The project is currently published as a free, ad-free hobby project.

## Project Structure

Typical project structure:

```text
Miriels-Deck-of-Encounters/
├── index.html
├── style.css
├── app.js
├── Readme.md
├── Images/
│   ├── miriel_img.png
│   ├── liora_img.png
│   ├── suica_img.png
│   ├── borstibald_img.png
│   └── ...
└── assets/
    ├── Miriel_header_app_banner_v1.png
    ├── background_stage_table_v1.png
    ├── background_deck_archive_v1.png
    ├── background_atelier_forge_v1.png
    ├── background_notice_board_miriel.png
    └── items/
        └── ...
```

The exact asset list may change during development.

## AI-Generated and Project-Created Assets

All bundled card images, header art, backgrounds, and item images were generated with ChatGPT/OpenAI for this project. According to the project owner, no third-party source images were used and no specific official D&D character or official artwork was requested as a model. File-by-file provenance is documented in `ASSET_PROVENANCE.md`.

## Legal Summary

The public, controlling legal notice is `legal.html`. In summary:

- Miriel’s Deck of Encounters is an independent and unofficial project.
- The project uses and adapts material from the **System Reference Document 5.1** under **Creative Commons Attribution 4.0 International (CC BY 4.0)**.
- SRD-derived material may have been translated, shortened, renamed, or editorially rewritten.
- Original source code, UI, original characters, original editorial text, and project-created assets remain proprietary unless a separate license says otherwise.
- User-entered and imported content is not reviewed or licensed by the project. Users are responsible for having the necessary rights.
- The current GitHub Pages version stores application state locally in the browser, provides no accounts, and does not automatically upload card or encounter content to the project operator.

See [`legal.html`](legal.html) for the complete notice and official source links.

## Copyright

Copyright © 2026 kuro. All rights reserved for original project material, subject to the separate CC BY 4.0 license and third-party rights described in `legal.html`.


## SRD demo detail policy

Version 0.26.0 includes separate, curated German libraries for SRD 5.1 and SRD 5.2.1. Existing unmatched or project-created entries were not removed. Unmatched or project-created entries remain unassigned to an SRD version unless they are explicitly audited.

The legally required SRD attribution is provided centrally in `legal.html` and `THIRD_PARTY_NOTICES.md`. It is intentionally not repeated next to every spell in the application.


## SRD-5.1 spell library

Version 0.26.0 adds a curated SRD-5.1 spell picker to both the new-card and edit-card sections of the Kartenschmiede.

- DMs can search and filter the library by spell level.
- Selecting a spell copies its structured fields into the current card.
- The copied spell remains fully editable.
- The existing manual spell editor remains available through “Eigener Spell”.
- The library is intentionally limited to the project’s currently audited SRD subset and is not presented as a complete official spell database.
- Attribution remains centralized in `legal.html` and `THIRD_PARTY_NOTICES.md`.


## Neutraler Umgang mit offenen Inhaltsprüfungen

Projektinterne Prüflisten dokumentieren ausschließlich offene Klassifizierungsfragen. Sie erklären keine gebündelten Platzhalter, Namen oder Entwürfe zu einem Rechts- oder Lizenzverstoß. Leere oder nur knapp beschriebene eigene Einträge bleiben Projektentwürfe, bis sie weiter ausgearbeitet oder klassifiziert werden.




## Dual SRD libraries

The Kartenschmiede offers two separate source selections:

- **SRD 5.1 · 2014 rules**
- **SRD 5.2.1 · 2024 rules**

The selected source is used only as a template library. Copied spells remain editable. The app does not automatically convert a card or encounter from one rules version to the other.

Version 0.26.0 moves Verwünschung/Hex to the SRD 5.2.1 library and restores the verified SRD 5.2.1 traits **Pakt der Klinge** and **Zurückdrängender Strahl** in the demo. Other previously removed entries were not restored because they were not verified as matching the current demo level and SRD 5.2.1 wording.

## Automatisierte Tests (ab 0.26.0)

Die lokale Testarchitektur verwendet Vitest für isolierte Logik- und Inhaltsprüfungen sowie Playwright für Browser-Smoke-Tests. Installation und Befehle stehen in [`TESTING.md`](TESTING.md).

Schnellstart:

```bash
npm install
npm run test:browser:install
npm test
```

Die Tests erzeugen kein Backend und verändern das statische Hostingmodell nicht.

### JavaScript-Architektur 0.26.0

Die Anwendung verwendet native ES-Module. Neben Datenmodell, Ansichtsrouting, Browser-Speicher, Fokusstage und delegierten UI-Ereignissen sind nun auch Encounter-Navigation, Render-Lebenszyklus sowie Drawer- und Click-away-Ereignisse getrennt gekapselt. `app.js` bleibt die zentrale Orchestrierung, während die neuen Fachmodule klar abgegrenzte Aufgaben übernehmen. Ihre Kopfkommentare beschreiben jeweils Zweck, Abhängigkeiten und Lieferbeziehungen.

## Entwicklerdokumentation

Eine verständliche Übersicht über Zuständigkeiten, Ereignisfluss, Zustand,
Speicherung, Rendering und Tests steht in
[`docs/ENTWICKLERLEITFADEN.md`](docs/ENTWICKLERLEITFADEN.md).

Die Drawer-Navigation ist zusätzlich in zwei Fachcontroller aufgeteilt:

- `js/atelier-controller.js` für das Spielleiter-Atelier
- `js/card-forge-controller.js` für die äußere Kartenschmiede und ihre Tabs

## Development architecture

The browser entry point is `js/app.js`. Domain rules, persistence, drawer controllers, rendering helpers, and application bootstrap are maintained in separate native ES modules. Run the architecture guard with:

```bash
npm run test:architecture
```

It verifies local import targets, prevents circular dependencies, and keeps the SRD 5.1 and SRD 5.2.1 content modules independent. A more detailed German developer guide exists locally at `docs/ENTWICKLERLEITFADEN.md`; that file is intentionally ignored by Git.

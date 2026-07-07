# Miriel’s Deck of Encounters

v0.7.0 by kuro**

Miriel’s Deck of Encounters is a local, card-based encounter manager for fantasy pen-and-paper roleplaying sessions. It is designed as a personal game master tool for preparing encounter cards, running initiative, tracking HP and conditions, and presenting selected public information on a separate tabletop display.

This is an unofficial, non-commercial, private personal project. It is not affiliated with, endorsed, sponsored, or approved by any tabletop roleplaying game publisher, platform, brand, or rights holder.

## Current Status

The project is currently a static browser-only web app built with:

- HTML
- CSS
- JavaScript

There is no backend, no database, no account system, and no server-side save system.

The app runs locally by opening `index.html` in a browser. It uses browser-local storage and local tab synchronization so that the game master view and the tabletop display can stay in sync on the same device or browser environment.

The current app is intended for private local use only.

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

The current app is a local browser prototype. The player-facing display is not a secure client.

Hidden information is hidden in the interface, but the full state can still exist in the same browser-side JavaScript application.

A future server-backed version should send only public data to player clients. Secret values should not merely be hidden with CSS or client-side rendering logic.

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

These are not promises or public roadmap commitments. The project is currently private and developed for personal use.

## Project Structure

Typical local project structure:

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

Some images used in this project were generated or edited with AI image tools and then selected, adapted, or organized for this private project.

They are intended as original project/demo/test assets for Miriel’s Deck of Encounters. They are not intended to copy or reproduce official tabletop RPG artwork, third-party character art, copyrighted franchise characters, logos, or protected brands.

Do not use any image, background, character illustration, icon, item image, or other asset from this project in another project without explicit written permission from the author.

## Copyright, License, and Usage

Copyright (c) 2026 kuro.

All rights reserved.

This project is currently private and not offered for public use.

No open-source license has been chosen. No license is granted.

You may not copy, fork, reuse, modify, redistribute, publish, mirror, reupload, sublicense, train on, sell, package, or incorporate this project, its source code, its text, its UI design, or its assets into another project without explicit written permission from the author.

If this repository, a ZIP archive, a screenshot, or any part of the project becomes visible or accessible to someone else, that does not grant permission to use it.

### Source Code

The source code is proprietary and private unless the author explicitly states otherwise in writing.

No permission is granted to copy, modify, reuse, redistribute, publish, mirror, reupload, sublicense, or incorporate the source code into any other project.

### Image and Asset Usage

All images and assets in `Images/`, `assets/`, and any related project folders are reserved for this project only.

They are not licensed for reuse, redistribution, modification, publication, training datasets, commercial use, non-commercial use, fan projects, templates, asset packs, or use in other software or media projects.

Do not copy, extract, edit, redistribute, republish, mirror, reupload, or use these assets without explicit written permission from the author.

### Third-Party Rights

This project should not include third-party copyrighted material unless the author has permission to use it.

If any third-party material is accidentally included, it should be removed or replaced. This project does not claim ownership of third-party rights, brands, systems, trademarks, or copyrighted works.

## Personal Use Notice

Miriel’s Deck of Encounters is currently maintained as a private personal tool and learning project by kuro.

It is not currently released as a public product, open-source project, template, asset pack, or reusable software library.

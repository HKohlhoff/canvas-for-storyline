# Canvas for StoryLine

Canvas for StoryLine turns a StoryLine writing project into connected Obsidian
Canvas files and an export-ready Markdown master file. It is designed for
authors who organize manuscript structure, scenes, notes, characters, and
locations in StoryLine and want to explore that structure visually in
Obsidian.

The generated `Master.md` is also intended as a stable source for a later
TeX/LaTeX export workflow.

## A complete Canvas publishing workflow

Canvas for StoryLine is designed to work especially well with two companion
plugins:

1. **Canvas for StoryLine** turns the manuscript structure into a connected
   overview Canvas, one Canvas per chapter, and an ordered `Master.md`.
2. [**Canvas Folding**](https://github.com/HKohlhoff/canvas-folding) makes the
   generated graph easier to explore inside Obsidian by collapsing complete
   branches, showing selected hierarchy levels, and focusing individual
   chapters or branches.
3. [**Canvas HTML Exporter**](https://github.com/HKohlhoff/canvas-html-exporter)
   turns the overview and its linked chapter Canvases into a portable,
   interactive HTML publication with navigation, deep search, linked pages,
   and browser-side folding.

Each plugin remains useful and installable on its own; there is no hard runtime
dependency between them. Together they cover the complete path from a
structured StoryLine manuscript through visual work in Obsidian to a
navigable publication. The exporter is the essential final step when the
Canvas book should be read or shared outside Obsidian.

If Canvas for StoryLine is useful to you, you can support its continued
development by buying me a coffee.

<a href="https://ko-fi.com/hokdev" target="_blank"><img height="36" style="border:0;height:36px" src="https://storage.ko-fi.com/cdn/kofi1.png?v=6" border="0" alt="Buy Me a Coffee at ko-fi.com"></a>

## Features

- Creates one project overview Canvas and one Canvas for every manuscript
  chapter.
- Groups the overview by acts and chapter canvases by scenes, scene notes,
  characters/POV, and locations.
- Preserves StoryLine manuscript order and visualizes StoryLine relationships
  as Canvas connections.
- Uses StoryLine's six scene-status colors and explains them on the overview
  and every chapter Canvas.
- Reads referenced characters and locations from the project's parent-series
  Codex when applicable.
- Shows chapter descriptions as hover information on overview cards. Chapter
  cards for scenes, notes, characters, and locations remain free of hover
  overlays.
- Uses compact, consistent geometry: cards keep a 100-unit vertical gap and
  every column on a Canvas matches that Canvas's longest populated column.
- Creates `Master.md` with ordinary `[[...]]` links to manuscript scenes only,
  ordered by act, chapter, and scene sequence.
- Offers separate commands and output settings for Canvas files and the master
  file.
- Uses only Obsidian APIs and works without desktop-only or network access.

## Requirements

- Obsidian 1.13.0 or later.
- A StoryLine project stored as Markdown files inside the current vault.
- Recognizable StoryLine metadata or common German/English category folders
  for scenes, scene notes, characters, and locations.

## Installation

Install Canvas for StoryLine from **Settings → Community plugins → Browse** in
Obsidian when it is available there.

For a manual installation:

1. Download `main.js`, `manifest.json`, and `styles.css` from the release.
2. Create `<vault>/.obsidian/plugins/canvas-for-storyline/`.
3. Copy the three files into that folder.
4. Reload Obsidian and enable **Canvas for StoryLine** under Community plugins.

Canvas Folding and Canvas HTML Exporter are optional companion plugins. Install
them from Community Plugins or from their respective GitHub releases to use the
complete workflow described above.

## Demo Vault

The repository contains a ready-to-use demonstration in
[`examples/demo-vault`](examples/demo-vault/). It includes a complete
**Rotkäppchen** StoryLine project with three acts, six chapters, all six scene
statuses, scene notes, characters, locations, and a shared series Codex.

To try it:

1. Download or clone this repository.
2. Open `examples/demo-vault` as a Vault in Obsidian.
3. Canvas Folding and Canvas HTML Exporter are already bundled and enabled in
   this demo Vault. Install and enable the current Canvas for StoryLine build.
4. Select `StoryLine/Märchenwald/Rotkäppchen` as the StoryLine project folder.
5. Run **Canvas for StoryLine: Create StoryLine Canvas files**.
6. Open the generated Rotkäppchen overview to explore or fold it. To publish
   the complete connected book, open that overview and run **Canvas HTML
   Exporter: Export active canvas as HTML**.

The bundled companion-plugin builds retain their own licenses. Their source
code and current releases are available from the linked repositories above.

## Setup

Open **Settings → Canvas for StoryLine** and configure:

| Setting | Purpose |
| --- | --- |
| StoryLine project folder | Vault-relative source folder. Generated Canvas files are written to its direct `Canvas` subfolder. |
| Included StoryLine elements | Select scenes, scene notes, characters, and locations for chapter canvases. |
| Master output folder | Optional independent Vault folder for `Master.md`. When empty, the project's `Canvas` folder is used. |
| Create master file with Canvas files | Controls whether the Canvas command also recreates `Master.md`. |

The project and Master folders can both be selected with a Vault folder
chooser.

## Commands

- **Canvas for StoryLine: Create StoryLine Canvas files** recreates the
  overview and chapter canvases. It also recreates `Master.md` when enabled in
  the settings.
- **Canvas for StoryLine: Create StoryLine master file** recreates only
  `Master.md`, regardless of the combined-generation setting.

There is deliberately no live synchronization in version 0.8.0. Run the
appropriate command again after changing StoryLine sources or plugin settings.

## Generated Canvas files

Canvas files are written directly to:

```text
<StoryLine project>/Canvas/
```

The overview contains act columns and linked chapter cards. Each chapter
Canvas contains equally high category columns based on its longest populated
column, a link back to the overview, and the complete StoryLine status legend.

Actual Canvas filenames retain the project prefix and `.canvas` extension for
unambiguous Vault links. Visible headings omit both. The overview information
heading uses `Project - Übersicht`; when the parent series metadata identifies
the book number unambiguously, it uses `Buch N - Project - Übersicht`.

## Master file

`Master.md` contains only manuscript scenes in StoryLine order:

- level-one headings for acts;
- level-two headings for chapters;
- level-three headings for scenes;
- ordinary Obsidian links without embeds.

An information block records the Vault, StoryLine project folder, and creation
date. This deliberately small structure is intended as the input boundary for
the planned TeX/LaTeX exporter.

## Important: generated files are replaced

Every run moves an existing target file to Obsidian's configured trash and
creates a new file. Manual edits in generated Canvas files or `Master.md` are
therefore not preserved.

When generated Canvas names change, obsolete plugin-owned Canvas files in the
project's direct `Canvas` folder are also moved to trash. Other files and
subfolders such as `Canvas/Vorgaben/` are left untouched. StoryLine source
files are never modified, and generated `Canvas/**` files are never read back
as StoryLine source material.

## Update notes

After a version change, the plugin shows the current update note once. It is
marked as read only after the window is closed and does not create a file in
the Vault. The **About** section at the bottom of the plugin settings provides
**Show last update** to reopen that note and **Show readme** to open this
complete documentation without leaving Obsidian.

## Data and privacy

Canvas for StoryLine works locally through Obsidian's Vault API. It has no
network functionality and sends no data anywhere. Settings, generated-file
ownership hashes, and the update-note marker are stored in the plugin's local
`data.json`.

The installed plugin does not contact the Ko-fi image or any other remote
README content. Canvas HTML Exporter is a separate desktop-only plugin; its own
privacy documentation applies when it is installed.

## Known limitations

- StoryLine projects that use substantially different metadata or folder
  conventions may require parser extensions.
- Generated output is intentionally replaceable and must not be used as the
  sole location for manual content.
- Version 0.8.0 has been validated against project M with 31 scenes, 31 scene
  notes, 16 characters, 13 locations, and six chapter canvases. A final manual
  release-gate pass remains required before publication.

## Development

```bash
npm install
npm test
npm run build:prod
```

For local deployment with hot reload:

```bash
OBSIDIAN_PLUGINS_DIR="/path/to/vault/.obsidian/plugins" npm run build:prod:deploy
```

The deployment target is always `canvas-for-storyline`. Production release
artifacts are written to `release/`.

## License

Canvas for StoryLine is licensed under the
[GNU General Public License v3.0 or later](LICENSE). Generated Canvas and
Markdown output may be used, published, distributed, and licensed independently
from the plugin under the output exception in
[`COPYING_EXCEPTION`](COPYING_EXCEPTION).

## Support and feedback

Please report reproducible problems and feature requests through the
[GitHub issue tracker](https://github.com/HKohlhoff/canvas-for-storyline/issues).

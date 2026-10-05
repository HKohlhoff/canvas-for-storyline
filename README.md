# Canvas for StoryLine

Canvas for StoryLine is an Obsidian plugin that turns selected information from
a StoryLine project into Canvas files and a Markdown master note. The master
note is intended as a stable input for a future TeX/LaTeX export workflow.

## Current scope

- Reads Markdown source notes from one configured StoryLine project folder.
- Recognizes scenes, scene notes, characters, and locations by frontmatter or
  common German/English folder names.
- Lets users include or exclude each category in the plugin settings.
- Writes `Übersicht.canvas`, chapter canvases, and `Master.md` to the project's
  direct `Canvas` subfolder.
- Orders scenes by StoryLine act, chapter, and sequence metadata. Chapter
  canvases include enabled scene-note, character, and location relations.
- Never reads generated `Canvas/**` content as source input.
- Uses stable IDs and refuses to overwrite unowned or manually changed output.

The first version deliberately has no live synchronization. Run the command
**Canvas for StoryLine: Generate or update StoryLine Canvas files and master
note** whenever the sources or settings change.

## Installation for development

```bash
npm install
npm test
npm run build:prod
```

For local hot-reload deployment:

```bash
OBSIDIAN_PLUGINS_DIR="/path/to/vault/.obsidian/plugins" npm run build:prod:deploy
```

The deployment target is always `canvas-for-storyline`.

## Data and privacy

The plugin uses Obsidian's Vault API. It does not require desktop-only APIs,
does not access the network, and does not send vault data anywhere. Generated
files remain inside the selected project folder. Ownership hashes are stored in
the plugin's local `data.json`; source files are never changed.

## Limitations

The source model was validated read-only against the real project M with 31
scenes, 31 scene notes, 9 characters, 4 locations, and six resulting chapter
canvases. Broader StoryLine variants and the complete Obsidian runtime workflow
still need validation. Generated files are not removed automatically when a
source disappears. A file edited after generation is reported as a conflict
and left untouched.

## License

GPL-3.0-or-later.

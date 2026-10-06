# Changelog

## 0.8.1

- Adopt Obsidian's declarative settings API so all plugin settings appear in
  settings search on Obsidian 1.13 and later.
- Replace the folder chooser's complete-vault enumeration with recursive,
  folder-only traversal while retaining the explicit **Choose** buttons.
  StoryLine content reads remain limited to the selected project and its
  parent-series Codex.
- Build, test, attest, and upload release assets through GitHub Actions so
  users and the Obsidian Community directory can verify their provenance.

## 0.8.0

- Add the initial Obsidian plugin lifecycle and settings.
- Add a vault folder chooser for the StoryLine project setting.
- Add category selection for scenes, scene notes, characters, and locations.
- Add separate Canvas and master-file commands and a setting that controls
  whether the Canvas command also creates the master file.
- Split Canvas and Master settings into separate sections and add a dedicated
  Vault output-folder chooser for `Master.md`.
- Generate Canvas names, act/chapter groups, colors, navigation, and layout
  from StoryLine project and series metadata using the approved reference
  canvases.
- Name overview and chapter Canvas files after the StoryLine project rather
  than the containing series, and use the extension-free filename as the
  basis for the chapter heading. Omit the project prefix in that heading and
  render it smaller than the act heading.
- Render only scenes in StoryLine manuscript order as ordinary Obsidian links
  in `Master.md`.
- Restore the exact compact reference structure: act/category groups contain
  linked colored file cards directly, without extra wrapper or description
  nodes. Store descriptions as card metadata and show chapter descriptions as
  automatically sized hover information on overview cards.
- Remove only the visible `.canvas` suffix from generated Canvas-card labels
  while preserving actual filenames and internal navigation labels.
- Remove the project prefix from visible generated Canvas headings. Keep it in
  the overview information heading, prefixed by `Buch N -` only when StoryLine
  determines the book number unambiguously.
- Use uniform cards and 40-unit inner spacing in chapter columns, with 70 units
  above and between chapter cards in overview act columns. Keep column groups
  equally wide and compactly spaced, and align the overview information box
  with the complete column grid.
- Size every act or category column to the longest populated column on its
  Canvas instead of retaining a fixed oversized minimum height.
- Limit hover descriptions to chapter cards on the overview; chapter Canvas
  cards for scenes, scene notes, characters, and locations no longer show
  quick information.
- Dismiss overview quick information immediately when its card is pressed or
  when Obsidian changes the active Canvas or workspace layout.
- Add all six StoryLine status colors to a compact single-line legend without
  inline HTML and use the same StoryLine colors for scene cards.
- Add the same six-color legend to every chapter Canvas in a separate box next
  to the overview navigation card.
- Include referenced entries from the series-level Codex.
- Generate an overview Canvas, chapter Canvas files, and `Master.md`.
- Preserve StoryLine narrative metadata and connect scene relations in chapter canvases.
- Add deterministic IDs and recreate same-named target files on every
  user-started generation after moving existing Vault files to Obsidian's
  configured trash. Use ownership state only to identify obsolete generated
  Canvas files safely.
- Add vault, StoryLine project-folder, and creation-date information plus act,
  chapter, and scene headings to the master file.
- Add production build, test, release metadata, and hot-reload deployment.
- Add a once-per-version Markdown update note, a matching repository
  `Last Update.md`, and **Show last update** at the bottom of the settings.
- Add an embedded README viewer with **Show readme** beside the update entry in
  the final **About** settings section.
- Add a complete Little Red Riding Hood demo Vault covering every exported StoryLine
  category and all six scene statuses, with English content, paths, metadata,
  generated headings, and Canvas files.
- Ship the Demo Vault without installed Community plugins or local plugin data
  and document how to install StoryLine plus the optional companion plugins.
- Localize generated Canvas and Master labels from the StoryLine project's
  language metadata.
- Document the three companion plugins, the browser-friendly HTML workflow,
  complete Markdown content in Canvas cards and HTML pages, support, privacy,
  and the generated-output license exception.

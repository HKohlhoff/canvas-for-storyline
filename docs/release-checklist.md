# Release checklist

## Automated

- [x] `npm test`
- [x] `npm run build:prod`
- [x] Release contains only `main.js`, `manifest.json`, and `styles.css`.
- [x] Manifest, package, and `versions.json` all name version `0.8.0`.
- [x] Embedded update text, update ID, displayed version, `Last Update.md`,
  settings entries, embedded README source, and manifest version are
  synchronized.

## Manual test vault

- [x] Deploy with `OBSIDIAN_PLUGINS_DIR=... npm run build:prod:deploy`.
- [ ] Plugin loads and unloads without console errors.
- [ ] Settings persist after restart.
- [ ] Version 0.8.0 shows its update note once after installation or upgrade;
  closing it stores the version-bound read marker, creates no Vault file, and
  prevents another automatic display on restart.
- [ ] **Show last update** remains at the bottom of the settings and reopens the
  current note.
- [ ] The final **About** settings section lists **Last update** followed by
  **README**; **Show readme** opens the repository README inside Obsidian.
- [ ] Embedded README images are omitted without placeholders or extra blank
  lines, relative links target the repository, and a linked Ko-fi image button
  would remain available as a normal text link.
- [ ] The project-folder chooser lists vault folders and stores the selected path.
- [ ] Settings separate Canvas and Master options; the Master folder chooser
  stores an independent vault-relative output path.
- [ ] Each category toggle changes generated contents as expected.
- [ ] Overview and chapter filenames begin with the StoryLine project name;
  chapter group names omit both that project prefix and `.canvas`, and are
  visibly smaller than act headings.
- [ ] Overview act groups and chapter category groups match the documented colors.
- [ ] Scene colors use StoryLine's six built-in status colors.
- [ ] Every chapter Canvas shows all six StoryLine status colors in a separate
  box 80 Canvas units to the right of the overview navigation card.
- [ ] The overview information block explains all six built-in StoryLine
  statuses without rendering raw HTML. Color names render in their respective
  colors; entries run on one line separated by ` - `.
- [ ] Chapter navigation opens the generated overview Canvas.
- [ ] `Master.md` contains only ordinary `[[...]]` scene links, without `!`,
  in StoryLine manuscript order.
- [ ] `Master.md` starts directly with an information block naming the Vault,
  StoryLine project folder, and creation date; no generated HTML comment
  precedes it.
- [ ] `Master.md` uses level-one headings for acts, level-two headings for
  chapters, and level-three headings for scenes.
- [ ] The Canvas command respects the master-file setting; the separate master
  command recreates `Master.md` regardless of that setting.
- [ ] Overview act groups and chapter category groups contain file cards
  directly with the reference geometry and 100 Canvas units of free vertical
  space between cards; no extra wrapper or visible description nodes remain.
- [ ] All act columns on an overview have the height of its longest act column;
  all category columns on a chapter Canvas have the height of its longest
  populated category column.
- [ ] Generated Canvas-card labels retain their filename but omit the visible
  project prefix and `.canvas` suffix without changing the actual Vault
  filename.
- [ ] The overview information heading reads `Project - Übersicht`; when the
  StoryLine series metadata identifies the book number unambiguously, it reads
  `Buch N - Project - Übersicht`.
- [ ] Resting the pointer on an overview chapter card shows its complete
  StoryLine description as automatically sized quick information without
  changing the Canvas layout. Scene, scene-note, character, and location cards
  on chapter canvases show no quick information.
- [ ] Opening a chapter from an overview card immediately closes its quick
  information; no overlay remains on the opened chapter Canvas.
- [ ] Canvas output stays in `<StoryLine project>/Canvas`; `Master.md` is
  created in its configured output folder (or in Canvas when none is set).
- [ ] `Canvas/**` is not re-imported as StoryLine source.
- [ ] A second run moves every existing target file to Obsidian trash and
  recreates it from current StoryLine data.
- [ ] When generated Canvas names change, obsolete plugin-owned Canvas files
  in the direct Canvas folder are moved to Obsidian trash; `Vorgaben/` remains
  untouched.
- [ ] Manual changes to a generated target file are deliberately discarded on
  the next run.
- [ ] Missing project folders and blocked output paths show useful notices.
- [ ] Mobile compatibility is smoke-tested; no Node/Electron API is used at runtime.

## Publication

- [x] Validate parsing against at least one real StoryLine project without modifying it.
- [x] Review README, changelog, privacy statement, and license.
- [x] Verify the demo Vault contains the release builds of Canvas Folding and
  Canvas HTML Exporter and enables both plugin IDs.
- [ ] Create release artifacts from a green production build.
- [ ] Create the annotated version tag and GitHub release only after explicit approval.

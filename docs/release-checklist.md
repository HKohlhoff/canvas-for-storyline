# Release checklist

## Automated

- [x] `npm test`
- [x] `npm run build:prod`
- [x] Release contains only `main.js`, `manifest.json`, and `styles.css`.
- [x] Manifest, package, and `versions.json` all name version `0.8.1`.
- [x] Release workflow builds, tests, attests, and uploads all three release
  assets from the version tag.
- [x] Source code does not use complete-vault enumeration APIs.
- [x] Settings use Obsidian's declarative API; folder choosers traverse only
  folders and retain explicit **Choose** buttons.
- [x] Embedded update text, update ID, displayed version, `Last Update.md`,
  settings entries, embedded README source, and manifest version are
  synchronized.

## Manual test vault

- [x] Deploy with `OBSIDIAN_PLUGINS_DIR=... npm run build:prod:deploy`.
- [ ] Plugin loads and unloads without console errors.
- [ ] Settings persist after restart.
- [ ] Every plugin setting can be found through Obsidian's settings search.
- [ ] Version 0.8.1 shows its update note once after installation or upgrade;
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
  visible headings and generated short names omit both that project prefix and
  `.canvas`.
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
- [ ] Overview act groups contain chapter cards with 70 Canvas units above and
  between cards. Chapter category groups use one uniform card size and 40
  Canvas units on every inner side, including above and between cards.
- [ ] Column groups are equally wide and compactly spaced; the overview
  information box aligns with the complete column grid.
- [ ] All act columns on an overview have the height of its longest act column;
  all category columns on a chapter Canvas have the height of its longest
  populated category column.
- [ ] Generated Canvas-card labels retain their filename but omit the visible
  project prefix and `.canvas` suffix without changing the actual Vault
  filename.
- [ ] Canvas headings, category labels, the status legend, and `Master.md`
  headings use English labels for an English StoryLine project and German
  labels for a German StoryLine project.
- [ ] The English Demo Vault overview heading reads
  `Book 1 - Little Red Riding Hood - Overview`.
- [ ] Resting the pointer on an overview chapter card shows its complete
  StoryLine description as automatically sized quick information without
  changing the Canvas layout. Scene, scene-note, character, and location cards
  on chapter canvases show no quick information.
- [ ] Opening a chapter from an overview card immediately closes its quick
  information; no overlay remains on the opened chapter Canvas.
- [ ] Canvas output stays in `<StoryLine project>/Canvas`; `Master.md` is
  created in its configured output folder (or in Canvas when none is set).
- [ ] `Canvas/**` is not re-imported as StoryLine source.
- [x] A second user-started run moves every existing same-named target file to
  Obsidian's configured trash and recreates it from current StoryLine data.
- [ ] When generated Canvas names change, obsolete plugin-owned Canvas files
  in the direct Canvas folder are moved to Obsidian trash; unrelated files and
  subfolders remain untouched.
- [ ] Missing project folders and blocked output paths show useful notices.
- [ ] Mobile compatibility is smoke-tested; no Node/Electron API is used at runtime.

## Release

- [x] Validate parsing against at least one real StoryLine project without modifying it.
- [x] Review README, changelog, privacy statement, and license.
- [x] Verify the English Demo Vault contains the generated overview, six
  chapter Canvases, and `Master.md`, but no installed Community plugins or
  local plugin data. Its README explains how to install the required and
  optional plugins.
- [x] Verify the Canvas and Demo documentation explains that file cards and
  their exported HTML pages contain the complete referenced Markdown content.
- [x] Create release artifacts from a green production build.
- [ ] Create the annotated version tag and GitHub release only after explicit approval.

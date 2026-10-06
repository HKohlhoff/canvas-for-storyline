# Canvas for StoryLine Demo Vault

This small Obsidian Vault contains a complete StoryLine example project based
on **Little Red Riding Hood**. The adaptation was written specifically for this
demo and is not copied from an existing edition.

## Try the demo

1. Download or clone this repository.
2. Open `examples/demo-vault` as a Vault in Obsidian.
3. Install and enable **StoryLine** and **Canvas for StoryLine** from Community
   Plugins. The demo intentionally ships without installed plugins.
4. Optionally install **Canvas Folding** and **Canvas HTML Exporter** to try the
   complete interactive Canvas and browser workflow.
5. Inspect the pre-generated overview, six chapter Canvases, and `Master.md`
   under `StoryLine/Enchanted Forest/Little Red Riding Hood/Canvas`.
6. In **Settings → Canvas for StoryLine**, select
   `StoryLine/Enchanted Forest/Little Red Riding Hood` as the StoryLine project folder.
7. Keep all four element types enabled.
8. Run **Canvas for StoryLine: Create StoryLine Canvas files**. Existing
   same-named output is moved to Obsidian's configured trash and recreated.
9. Open the regenerated files in the project's `Canvas` folder.
10. With Canvas Folding installed, collapse and expand branches in the overview.
11. With Canvas HTML Exporter installed, export the overview as a connected,
    interactive, browser-friendly HTML view.

The chapter Canvas cards provide the complete contents of their referenced
Markdown files, not only titles or summaries. The exported HTML pages likewise
contain the complete rendered Markdown content for the corresponding scenes,
scene notes, characters, and locations.

The example contains three acts, six chapters, all six scene statuses, scene
notes, and linked characters and locations from a shared series Codex.
`Master.md` is generated together with the Canvas files unless that setting is
disabled.

The project uses StoryLine 1.10.80's native structure:

- `Scenes/Act N` for scenes with native file names and global sequence values;
- `SceneNotes/` for notes linked from the scene inspector;
- `Codex/Characters` and `Codex/Locations` as the shared series Codex;
- `Notes`, `Research`, `Archive`, and `System` inside the book folder;
- StoryLine references for POV, characters, locations, setup/payoff,
  relationships, inhabitants, connected locations, plotlines, and book and
  series identities.

Canvas for StoryLine creates the connected book structure, Canvas Folding makes
it easier to explore in Obsidian, and Canvas HTML Exporter turns the overview
and chapters into a navigable browser view outside Obsidian. Each plugin
remains independent and must be installed separately.

> [!warning] Generated files
> The `Canvas` folder is plugin output. Existing same-named target files are
> moved to Obsidian's configured trash and recreated when generation runs.
> Source files outside the `Canvas` folder are never changed.

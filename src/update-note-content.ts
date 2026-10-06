export const CURRENT_UPDATE_VERSION = "0.8.0";
export const CURRENT_UPDATE_ID = `release-${CURRENT_UPDATE_VERSION}`;
export const SHOW_LAST_UPDATE_LABEL = "Show last update";
export const SHOW_LAST_UPDATE_DESCRIPTION = `Open the release notes for version ${CURRENT_UPDATE_VERSION}.`;

export const CURRENT_UPDATE_MARKDOWN = `# Canvas for StoryLine ${CURRENT_UPDATE_VERSION}

This first release turns a StoryLine project into connected Obsidian Canvas files and an export-ready Markdown master file.

## What is included

- A project overview with acts, chapters, StoryLine status colors, and chapter descriptions on hover.
- One compact Canvas per chapter with linked scenes, scene notes, characters, locations, and their StoryLine relationships.
- Matching column heights based on the longest column on each Canvas.
- A separate \`Master.md\` containing only manuscript scenes in StoryLine order, ready for a later TeX/LaTeX export workflow.
- Vault folder pickers, category switches, Wikilink or embed selection for Master scenes, a separate Master output folder, and independent Canvas and Master commands.

## Getting started

1. Open **Settings → Canvas for StoryLine**.
2. Choose the StoryLine project folder and, if wanted, a separate Master output folder.
3. Select the StoryLine categories to include.
4. Run **Canvas for StoryLine: Create StoryLine Canvas files** from the command palette.

## Complete Canvas and HTML workflow and demo

The repository includes a complete Little Red Riding Hood demo Vault with all supported
StoryLine element types and all six scene statuses. The Demo Vault ships without
installed Community plugins. After installing StoryLine and Canvas for StoryLine,
you can generate and explore the connected book Canvases. Optionally install
Canvas Folding and Canvas HTML Exporter to create a browser-friendly HTML view
of the overview and all linked chapter Canvases.

The three plugins remain independent. Used together, Canvas for StoryLine
creates the visual book structure, Canvas Folding makes it easier to navigate
while writing, and Canvas HTML Exporter provides a navigable browser view. The
Canvas cards and corresponding HTML pages contain the complete contents of the
referenced Markdown files, not only their titles or summaries.

> [!warning] Generated files are replaceable output
> Every user-started generation moves existing same-named target files to Obsidian's configured trash and recreates them. Keep manual work in StoryLine source files, not only in generated Canvas files or \`Master.md\`.

Open the complete documentation with **Show readme** and reopen this note with **Show last update** at the bottom of the plugin settings.`;

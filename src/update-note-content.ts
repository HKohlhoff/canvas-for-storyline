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
- Vault folder pickers, category switches, a separate Master output folder, and independent Canvas and Master commands.

## Getting started

1. Open **Settings → Canvas for StoryLine**.
2. Choose the StoryLine project folder and, if wanted, a separate Master output folder.
3. Select the StoryLine categories to include.
4. Run **Canvas for StoryLine: Create StoryLine Canvas files** from the command palette.

## Complete publishing workflow and demo

The repository includes a complete Rotkäppchen demo Vault with all supported
StoryLine element types and all six scene statuses. Canvas Folding and Canvas
HTML Exporter are already installed there, so the complete workflow can be
tested directly: generate the connected book Canvases, explore their branches
inside Obsidian, and export the overview with all linked chapter Canvases as an
interactive HTML publication.

The three plugins remain independent. Used together, Canvas for StoryLine
creates the visual book structure, Canvas Folding makes it easier to navigate
while writing, and Canvas HTML Exporter provides the final publication step.

> [!warning] Generated files are replaceable output
> Existing generated targets are moved to Obsidian's configured trash and recreated on every run. Do not keep manual edits only in generated Canvas files or \`Master.md\`.

Open the complete documentation with **Show readme** and reopen this note with **Show last update** at the bottom of the plugin settings.`;

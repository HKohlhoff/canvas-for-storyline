export const CURRENT_UPDATE_VERSION = "0.8.1";
export const CURRENT_UPDATE_ID = `release-${CURRENT_UPDATE_VERSION}`;
export const SHOW_LAST_UPDATE_LABEL = "Show last update";
export const SHOW_LAST_UPDATE_DESCRIPTION = `Open the release notes for version ${CURRENT_UPDATE_VERSION}.`;

export const CURRENT_UPDATE_MARKDOWN = `# Canvas for StoryLine ${CURRENT_UPDATE_VERSION}

This maintenance release improves review transparency and narrows Vault discovery.

## What changed

- Settings now use Obsidian's declarative API and appear in settings search on Obsidian 1.13 and later.
- Folder choosers retain their explicit **Choose** buttons while avoiding complete-vault file enumeration.
- StoryLine content reads remain limited to the configured project and its parent-series Codex.
- GitHub Actions now builds, tests, attests, and uploads the release assets so their provenance can be verified.

## Getting started

1. Open **Settings → Canvas for StoryLine**.
2. Choose the StoryLine project folder and, if wanted, a separate Master output folder.
3. Select the StoryLine categories to include.
4. Run **Canvas for StoryLine: Create StoryLine Canvas files** from the command palette.

> [!warning] Generated files are replaceable output
> Every user-started generation moves existing same-named target files to Obsidian's configured trash and recreates them. Keep manual work in StoryLine source files, not only in generated Canvas files or \`Master.md\`.

Open the complete documentation with **Show readme** and reopen this note with **Show last update** at the bottom of the plugin settings.`;

# Release checklist

## Automated

- [ ] `npm test`
- [ ] `npm run build:prod`
- [ ] Release contains only `main.js` and `manifest.json`.
- [ ] Manifest, package, and `versions.json` all name version `0.1.0`.

## Manual test vault

- [ ] Deploy with `OBSIDIAN_PLUGINS_DIR=... npm run build:prod:deploy`.
- [ ] Plugin loads and unloads without console errors.
- [ ] Settings persist after restart.
- [ ] Each category toggle changes generated contents as expected.
- [ ] The command creates output only in `<StoryLine project>/Canvas`.
- [ ] `Canvas/**` is not re-imported as StoryLine source.
- [ ] A second run is deterministic and leaves unchanged output untouched.
- [ ] A manually edited generated file is reported and not overwritten.
- [ ] Missing project folders and blocked output paths show useful notices.
- [ ] Mobile compatibility is smoke-tested; no Node/Electron API is used at runtime.

## Publication

- [ ] Validate parsing against at least one real StoryLine project without modifying it.
- [ ] Review README, changelog, privacy statement, and license.
- [ ] Create release artifacts from a green production build.
- [ ] Create the annotated version tag and GitHub release only after explicit approval.

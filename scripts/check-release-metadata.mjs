import fs from "node:fs";

const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const versions = JSON.parse(fs.readFileSync("versions.json", "utf8"));
const lastUpdate = fs.readFileSync("Last Update.md", "utf8");
const updateNoteSource = fs.readFileSync("src/update-note-content.ts", "utf8");
const settingsSource = fs.readFileSync("src/ui/settings-tab.ts", "utf8");
const readme = fs.readFileSync("README.md", "utf8");
const copyingException = fs.readFileSync("COPYING_EXCEPTION", "utf8");
const demoPlugins = JSON.parse(fs.readFileSync("examples/demo-vault/.obsidian/community-plugins.json", "utf8"));
const errors = [];
if (manifest.id !== "canvas-for-storyline") errors.push("Unexpected plugin id.");
if (manifest.name !== "Canvas for StoryLine") errors.push("Unexpected plugin name.");
if (manifest.version !== pkg.version) errors.push("Manifest and package versions differ.");
if (versions[manifest.version] !== manifest.minAppVersion) errors.push("versions.json does not match manifest.");
if (manifest.isDesktopOnly !== false) errors.push("Plugin must not be desktop-only.");
if (pkg.license !== "GPL-3.0-or-later") errors.push("Unexpected license.");
if (!copyingException.includes("Additional permission under GNU GPL version 3 section 7")) {
  errors.push("Generated-output license exception is missing or incomplete.");
}
for (const companion of ["canvas-folding", "canvas-html-exporter"]) {
  if (!demoPlugins.includes(companion)) errors.push(`Demo Vault does not enable ${companion}.`);
  const demoPluginPath = `examples/demo-vault/.obsidian/plugins/${companion}`;
  for (const artifact of ["main.js", "manifest.json", "styles.css"]) {
    if (!fs.existsSync(`${demoPluginPath}/${artifact}`)) {
      errors.push(`Demo Vault is missing ${companion}/${artifact}.`);
    }
  }
  const demoManifest = JSON.parse(fs.readFileSync(`${demoPluginPath}/manifest.json`, "utf8"));
  if (demoManifest.id !== companion) errors.push(`Demo Vault contains the wrong ${companion} manifest.`);
}
if (!readme.includes("https://github.com/HKohlhoff/canvas-folding")) {
  errors.push("README does not link Canvas Folding.");
}
if (!readme.includes("https://github.com/HKohlhoff/canvas-html-exporter")) {
  errors.push("README does not link Canvas HTML Exporter.");
}
if (!lastUpdate.startsWith(`# Canvas for StoryLine ${manifest.version}\n`)) {
  errors.push("Last Update.md does not name the manifest version.");
}
if (!updateNoteSource.includes(`CURRENT_UPDATE_VERSION = "${manifest.version}"`)) {
  errors.push("The embedded update note does not name the manifest version.");
}
if (
  !settingsSource.includes("SHOW_LAST_UPDATE_LABEL") ||
  !settingsSource.includes("showLastUpdate()") ||
  !settingsSource.includes('setButtonText("Show readme")') ||
  !settingsSource.includes("showReadme()")
) {
  errors.push("Settings do not expose Show last update and Show readme.");
}
if (errors.length > 0) throw new Error(errors.join("\n"));
console.log("Release metadata is consistent.");

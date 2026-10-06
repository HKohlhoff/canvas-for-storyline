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
const demoPluginsPath = "examples/demo-vault/.obsidian/plugins";
const demoGuidePath = "examples/How to Use the Demo-Vault.md";
const demoCanvasPath = "examples/demo-vault/StoryLine/Enchanted Forest/Little Red Riding Hood/Canvas";
const errors = [];
if (manifest.id !== "canvas-for-storyline") errors.push("Unexpected plugin id.");
if (manifest.name !== "Canvas for StoryLine") errors.push("Unexpected plugin name.");
if (manifest.version !== pkg.version) errors.push("Manifest and package versions differ.");
if (versions[manifest.version] !== manifest.minAppVersion) errors.push("versions.json does not match manifest.");
if (process.env.EXPECTED_RELEASE_TAG && process.env.EXPECTED_RELEASE_TAG !== manifest.version) {
  errors.push("Release tag does not match manifest version.");
}
if (manifest.isDesktopOnly !== false) errors.push("Plugin must not be desktop-only.");
if (pkg.license !== "GPL-3.0-or-later") errors.push("Unexpected license.");
if (!copyingException.includes("Additional permission under GNU GPL version 3 section 7")) {
  errors.push("Generated-output license exception is missing or incomplete.");
}
if (!Array.isArray(demoPlugins) || demoPlugins.length !== 0) {
  errors.push("Demo Vault must not enable Community plugins in its release state.");
}
if (fs.existsSync(demoPluginsPath) && fs.readdirSync(demoPluginsPath).length !== 0) {
  errors.push("Demo Vault must not bundle installed Community plugins.");
}
if (!fs.existsSync(demoGuidePath)) errors.push("Demo Vault usage guide is missing from examples.");
const demoCanvasFiles = fs.readdirSync(demoCanvasPath).filter((file) => file.endsWith(".canvas"));
if (demoCanvasFiles.length !== 7) errors.push("Demo Vault must contain the overview and six chapter Canvases.");
if (!fs.existsSync(`${demoCanvasPath}/Master.md`)) errors.push("Demo Vault is missing its generated Master.md.");
if (!readme.includes("https://github.com/HKohlhoff/canvas-folding")) {
  errors.push("README does not link Canvas Folding.");
}
if (!readme.includes("https://github.com/HKohlhoff/canvas-html-exporter")) {
  errors.push("README does not link Canvas HTML Exporter.");
}
const sourceFiles = fs.readdirSync("src", { recursive: true })
  .filter((path) => typeof path === "string" && path.endsWith(".ts"));
const sourceText = sourceFiles.map((path) => fs.readFileSync(`src/${path}`, "utf8")).join("\n");
for (const api of ["getAllLoadedFiles(", "getFiles(", "getMarkdownFiles("]) {
  if (sourceText.includes(api)) errors.push(`Source must not enumerate the complete vault with ${api}`);
}
if (!lastUpdate.startsWith(`# Canvas for StoryLine ${manifest.version}\n`)) {
  errors.push("Last Update.md does not name the manifest version.");
}
if (!updateNoteSource.includes(`CURRENT_UPDATE_VERSION = "${manifest.version}"`)) {
  errors.push("The embedded update note does not name the manifest version.");
}
if (
  !settingsSource.includes("getSettingDefinitions()") ||
  !settingsSource.includes("SHOW_LAST_UPDATE_LABEL") ||
  !settingsSource.includes("showLastUpdate()") ||
  !settingsSource.includes('setButtonText("Show readme")') ||
  !settingsSource.includes("showReadme()")
) {
  errors.push("Settings do not expose Show last update and Show readme.");
}
if (errors.length > 0) throw new Error(errors.join("\n"));
console.log("Release metadata is consistent.");

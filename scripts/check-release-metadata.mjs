import fs from "node:fs";

const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const versions = JSON.parse(fs.readFileSync("versions.json", "utf8"));
const errors = [];
if (manifest.id !== "canvas-for-storyline") errors.push("Unexpected plugin id.");
if (manifest.name !== "Canvas for StoryLine") errors.push("Unexpected plugin name.");
if (manifest.version !== pkg.version) errors.push("Manifest and package versions differ.");
if (versions[manifest.version] !== manifest.minAppVersion) errors.push("versions.json does not match manifest.");
if (manifest.isDesktopOnly !== false) errors.push("Plugin must not be desktop-only.");
if (pkg.license !== "GPL-3.0-or-later") errors.push("Unexpected license.");
if (errors.length > 0) throw new Error(errors.join("\n"));
console.log("Release metadata is consistent.");

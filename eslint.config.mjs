import { defineConfig, globalIgnores } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores([
    ".test-build/**",
    "_local/**",
    "examples/demo-vault/.obsidian/plugins/**/main.js",
    "main.js",
    "node_modules/**",
    "release/**",
  ]),
  { files: ["**/*.{js,mjs}"], languageOptions: { globals: globals.node } },
  ...obsidianmd.configs.recommended,
  {
    files: ["src/**/*.ts", "tests/**/*.ts"],
    languageOptions: {
      globals: globals.browser,
      parser: tseslint.parser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname }
    },
    rules: {
      "obsidianmd/ui/sentence-case": "off"
    }
  },
  {
    files: ["scripts/**/*.ts"],
    languageOptions: {
      globals: globals.node,
      parser: tseslint.parser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname }
    },
    rules: {
      "obsidianmd/hardcoded-config-path": "off",
      "obsidianmd/no-nodejs-modules": "off",
      "obsidianmd/rule-custom-message": "off"
    }
  },
  {
    files: ["build.mjs", "eslint.config.mjs", "scripts/**/*.mjs"],
    rules: {
      "obsidianmd/hardcoded-config-path": "off",
      "obsidianmd/no-nodejs-modules": "off",
      "obsidianmd/rule-custom-message": "off"
    }
  },
  {
    files: ["src/ui/settings-tab.ts"],
    rules: { "obsidianmd/settings-tab/prefer-setting-definitions": "off" }
  },
  {
    files: ["tests/**/*.ts"],
    rules: {
      "obsidianmd/no-nodejs-modules": "off",
      "@typescript-eslint/no-floating-promises": "off"
    }
  }
);

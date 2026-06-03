import js from "@eslint/js";
import json from "@eslint/json";
import { defineConfig } from "eslint/config";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    plugins: { js },
    extends: ["js/recommended"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: { globals: globals.node },
  },
  tseslint.configs.recommended,
  {
    files: ["**/*.json5"],
    plugins: { json },
    language: "json/json5",
    extends: ["json/recommended"],
  },
  {
    name: "ignore generated files",
    ignores: [
      "**/dist/*",
      "**/coverage/*",
      "**/node_modules/*",
      "test/fixtures/**",
      "packages/infrastructure/src/plugin/plugin-runtime/drivers/local-pool/test/fixtures/**",
    ],
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-require-imports": "off",
      "no-var": "off",
      "no-console": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            // side effect
            ["^\\u0000"],
            // node builtin
            ["^node:"],
            // external packages
            ["^@?\\w"],
            // aliases
            ["^@domain", "^@usecase", "^@infra", "^@shared", "^@/", "^~"],
            // parent imports
            ["^\\.\\.(?!/?$)", "^\\.\\./?$"],
            // same-folder imports
            ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
            // type imports
            ["^.+\\.?(css)$"],
          ],
        },
      ],
      "simple-import-sort/exports": "error",
    },
  },
]);

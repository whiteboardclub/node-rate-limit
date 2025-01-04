import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import jestPlugin from "eslint-plugin-jest";

/** @type {import('eslint').Linter.Config} */
export default [
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest,
      },
    },
    plugins: {
      jest: jestPlugin, // Specify the Jest plugin as an object
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
    },
    ignores: [".gitignore"],
  },
];

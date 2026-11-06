import tseslint from "typescript-eslint";
import hooks from "eslint-plugin-react-hooks";
import refresh from "eslint-plugin-react-refresh";
import globals from "globals";
export default tseslint.config(
  { ignores: ["dist/**", "dist-server/**", "node_modules/**", ".agents/**", ".codex/**", "test-results/**", "playwright-report/**", "output/**", ".playwright-cli/**"] },
  ...tseslint.configs.recommended,
  {
    files: ["public/sw.js"],
    languageOptions: { globals: globals.serviceworker },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: { globals: globals.browser },
    plugins: { "react-hooks": hooks, "react-refresh": refresh },
    rules: {
      ...hooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
  {
    files: ["*.js", "server/**/*.ts", "tests/**/*.ts", "*.config.ts"],
    languageOptions: { globals: globals.node },
  },
);

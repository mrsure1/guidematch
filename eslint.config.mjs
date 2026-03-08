import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Local debug and temporary artifacts:
    "*.bak",
    "tmp/**",
    "tmp_debug/**",
    "debug_*.js",
    "check_*.js",
    "fix_*.js",
    "test_*.js",
    "tmp_*.ts",
  ]),
  {
    rules: {
      // Existing codebase has broad `any` usage; keep signal as warning during incremental cleanup.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    files: ["scripts/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);

export default eslintConfig;

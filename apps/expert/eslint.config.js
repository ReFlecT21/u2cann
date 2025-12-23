import baseConfig, { restrictEnvAccess } from "@adh/eslint-config/base";
import nextjsConfig from "@adh/eslint-config/nextjs";
import reactConfig from "@adh/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".next/**"],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
  ...restrictEnvAccess,
];

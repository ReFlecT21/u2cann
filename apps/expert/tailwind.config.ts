import type { Config } from "tailwindcss";

import baseConfig from "@adh/tailwind-config/web";

export default {
  // We need to append the path to the UI package to the content array so that
  // those classes are included correctly.
  darkMode : "class",
  content: [
    ...baseConfig.content,
    "../../packages/ui/src/**/*.{ts,tsx}",
    "src/**/*.{ts,tsx}",
  ],
  presets: [baseConfig],
  theme: {},
} satisfies Config;

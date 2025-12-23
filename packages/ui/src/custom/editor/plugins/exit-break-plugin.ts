"use client";

import { PluginConfig } from "@udecode/plate";
import { ExitBreakPlugin } from "@udecode/plate-break/react";
import { HEADING_LEVELS } from "@udecode/plate-heading";
import { PlatePlugin } from "@udecode/plate/react";

export const exitBreakPlugin: PlatePlugin<PluginConfig<"exitBreak">> =
  ExitBreakPlugin.configure({
    options: {
      rules: [
        {
          hotkey: "mod+enter",
        },
        {
          before: true,
          hotkey: "mod+shift+enter",
        },
        {
          hotkey: "enter",
          level: 1,
          query: {
            allow: HEADING_LEVELS,
            end: true,
            start: true,
          },
          relative: true,
        },
      ],
    },
  });

export const REPOSITORIES = ["adh-expert"] as const;

export const PORT_MAPPING: Record<(typeof REPOSITORIES)[number], number> = {
  "adh-expert": 8000,
} as const;

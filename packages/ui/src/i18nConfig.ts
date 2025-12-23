export const languages = ["en", "ja"] as const;
export type Language = (typeof languages)[number];
export const defaultLanguage = "en";

export const i18nConfig = {
  locales: languages,
  defaultLocale: defaultLanguage,
  prefixDefault: true,
};

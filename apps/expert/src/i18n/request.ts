import { getRequestConfig } from "next-intl/server";

import ja from './messages/ja.json';
import en from './messages/en.json';
import cn from './messages/cn.json';
import my from './messages/my.json';
import kr from './messages/kr.json';

import { languages } from "@adh/ui/i18nConfig";
const locales = [...languages];
// Preload all locale files so they get bundled properly

export default getRequestConfig(async ({ locale }) => {
  console.log("localelol", locale);

  if (!locale) {
    console.warn(
      "Locale is undefined. This can happen during static rendering or dev reloads.",
    );
    return {
      locale: "en",
      messages: {},
    };
  }

  if (!locales.includes(locale)) {
    console.warn("Unsupported locale received:", locale);
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});

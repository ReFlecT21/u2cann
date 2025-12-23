"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCurrentLocale } from "next-i18n-router/client";

import { i18nConfig, Language } from "@adh/ui/i18nConfig";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@adh/ui/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@adh/ui/ui/popover";

import { CountryFlag } from "../CountryFlag";

const LANGUAGE_MAP: Record<Language, { label: React.ReactNode; name: string }> =
  {
    en: {
      label: <CountryFlag countryCode="US" />,
      name: "English",
    },

    ja: {
      label: <CountryFlag countryCode="JP" />,
      name: "日本語",
    },
  };

export function LanguageSwitcher() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const currentPathname = usePathname();
  const currentLocale = useCurrentLocale(i18nConfig) as Language;

  const handleChange = (newLocale: Language) => {
    // set cookie for next-i18n-router
    const days = 30;
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `NEXT_LOCALE=${newLocale};path=/`;

    if (
      currentLocale === i18nConfig.defaultLocale &&
      !i18nConfig.prefixDefault
    ) {
      router.push("/" + newLocale + currentPathname);
    } else {
      router.push(
        currentPathname.replace(`/${currentLocale}`, `/${newLocale}`),
      );
    }

    router.refresh();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>{LANGUAGE_MAP[currentLocale].label}</PopoverTrigger>
      <PopoverContent className="w-fit p-0">
        <Command>
          <CommandList>
            <CommandEmpty>No language found.</CommandEmpty>
            <CommandGroup>
              {Object.entries(LANGUAGE_MAP).map(
                ([language, { label, name }]) => (
                  <CommandItem
                    key={language}
                    value={language}
                    onSelect={(currentValue) => {
                      handleChange(currentValue as Language);
                      setOpen(false);
                    }}
                  >
                    {label} {name}
                  </CommandItem>
                ),
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

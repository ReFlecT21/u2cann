import ReactCountryFlag from "react-country-flag";

import { cn } from "@adh/ui";

interface CountryFlagProps {
  countryCode: string;
  size?: "sm" | "md";
}

export function CountryFlag({ countryCode, size = "sm" }: CountryFlagProps) {
  return (
    <div
      className={cn(
        "relative flex size-8 items-center justify-center overflow-hidden rounded-full",
        size === "sm" && "size-6",
      )}
    >
      <ReactCountryFlag
        countryCode={countryCode}
        svg
        className={cn(
          "absolute !size-8 object-cover",
          size === "sm" && "!size-6",
        )}
      />
    </div>
  );
}

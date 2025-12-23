import React from "react";
// radix-ui
import { SelectProps } from "@radix-ui/react-select";
// data
import { currencies as AllCurrencies } from "country-data-list";

import { cn } from "@adh/ui";
// shadcn
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adh/ui/ui/select";

// types
export interface Currency {
  code: string;
  decimals: number;
  name: string;
  number: string;
  symbol?: string;
}

// constants
// import { customCurrencies, allCurrencies } from "./country-dropdown";

interface CurrencySelectProps extends Omit<SelectProps, "onValueChange"> {
  onValueChange?: (value: string) => void;
  onCurrencySelect?: (currency: Currency) => void;
  name: string;
  placeholder?: string;
  currencies?: "custom" | "all";
  variant?: "default" | "small";
  valid?: boolean;
}

const CurrencySelect = React.forwardRef<HTMLButtonElement, CurrencySelectProps>(
  (
    {
      value,
      onValueChange,
      onCurrencySelect,
      name,
      placeholder = "Select currency",
      currencies = "all",
      variant = "default",
      valid = true,
      ...props
    },
    ref,
  ) => {
    const [selectedCurrency, setSelectedCurrency] =
      React.useState<Currency | null>(null);

    const uniqueCurrencies = React.useMemo<Currency[]>(() => {
      const currencyMap = new Map<string, Currency>();

      AllCurrencies.all.forEach((currency: Currency) => {
        // Check if the currency has all required properties
        if (currency.code && currency.name && currency.symbol) {
          let shouldInclude = false;

          switch (currencies) {
            case "custom":
              shouldInclude = customCurrencies.includes(currency.code);
              break;
            case "all":
              shouldInclude = !allCurrencies.includes(currency.code);
              break;
            default:
              shouldInclude = !allCurrencies.includes(currency.code);
          }

          if (shouldInclude) {
            // Special handling for Euro
            if (currency.code === "EUR") {
              currencyMap.set(currency.code, {
                code: currency.code,
                name: "Euro",
                symbol: currency.symbol,
                decimals: currency.decimals,
                number: currency.number,
              });
            } else {
              currencyMap.set(currency.code, {
                code: currency.code,
                name: currency.name,
                symbol: currency.symbol,
                decimals: currency.decimals,
                number: currency.number,
              });
            }
          }
        }
      });

      // Convert the map to an array and sort by currency name
      return Array.from(currencyMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name),
      );
    }, [currencies]);

    const handleValueChange = (newValue: string) => {
      const fullCurrencyData = uniqueCurrencies.find(
        (curr) => curr.code === newValue,
      );
      if (fullCurrencyData) {
        setSelectedCurrency(fullCurrencyData);
        if (onValueChange) {
          onValueChange(newValue);
        }
        if (onCurrencySelect) {
          onCurrencySelect(fullCurrencyData);
        }
      }
    };

    void selectedCurrency;

    return (
      <Select
        value={value}
        onValueChange={handleValueChange}
        {...props}
        name={name}
        data-valid={valid}
      >
        <SelectTrigger
          className={cn("w-full", variant === "small" && "w-fit gap-2")}
          data-valid={valid}
          ref={ref}
        >
          {value && variant === "small" ? (
            <SelectValue placeholder={placeholder}>
              <span>{value}</span>
            </SelectValue>
          ) : (
            <SelectValue placeholder={placeholder} />
          )}
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {uniqueCurrencies.map((currency) => (
              <SelectItem key={currency?.code} value={currency?.code || ""}>
                <div className="flex w-full items-center gap-2">
                  <span className="w-8 text-left text-sm text-muted-foreground">
                    {currency?.code}
                  </span>
                  <span className="hidden">{currency?.symbol}</span>
                  <span>{currency?.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    );
  },
);

CurrencySelect.displayName = "CurrencySelect";

export { CurrencySelect };

export const allCurrencies = [
  "AXG", // Anguilla
  "BAM", // Bosnia and Herzegovina convertible mark
  "BMD", // Bermudian dollar
  "BOV", // Bolivian Mvdol (funds code)
  "CHE", // WIR Euro (complementary currency)
  "CHW", // WIR Franc (complementary currency)
  "CLF", // Chilean Unidad de Fomento (funds code)
  "COU", // Colombian Unidad de Valor Real (funds code)
  "CUC", // Cuban convertible peso
  "KID", // Kiribati dollar
  "KPW", // North Korean won
  "LAK", // Lao kip
  "MGA", // Malagasy ariary
  "MRO", // Mauritanian ouguiya (pre-2018)
  "MXV", // Mexican Unidad de Inversion (funds code)
  "OMR", // Omani rial
  "PRB", // Transnistrian ruble
  "SSP", // South Sudanese pound
  "STD", // São Tomé and Príncipe dobra (pre-2018)
  "SVC", // Salvadoran colón
  "TJS", // Tajikistani somoni
  "TMT", // Turkmenistan manat
  "TVD", // Tuvaluan dollar
  "USN", // United States dollar (next day) (funds code)
  "UYI", // Uruguay Peso en Unidades Indexadas (funds code)
  "VED", // Venezuelan bolívar digital
  "VES", // Venezuelan bolívar soberano
  "VND", // Vietnamese đồng
  "XAF", // Central African CFA franc
  "XAG", // Silver (troy ounce)
  "XAU", // Gold (troy ounce)
  "XBA", // European Composite Unit (EURCO) (bond market unit)
  "XBB", // European Monetary Unit (E.M.U.-6) (bond market unit)
  "XBC", // European Unit of Account 9 (E.U.A.-9) (bond market unit)
  "XBD", // European Unit of Account 17 (E.U.A.-17) (bond market unit)
  "XDR", // Special Drawing Rights
  "XOF", // West African CFA franc
  "XPD", // Palladium (troy ounce)
  "XPF", // CFP franc
  "XPT", // Platinum (troy ounce)
  "XSU", // Sucre (ALBA regional currency)
  "XTS", // Code reserved for testing purposes
  "XUA", // ADB Unit of Account
  "XUG", // Uganda shilling (pre-1987)
  "XXX", // No currency
  "ZWL", // Zimbabwean dollar (no longer in active use)
];

// Currencies to include in the dropdown
export const customCurrencies = [
  "DKK",
  "SEK",
  "NOK",
  "EUR",
  "USD",
  "CAD",
  "GBP",
  "AUD",
  "NZD",
];

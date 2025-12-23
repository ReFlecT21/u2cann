"use client";

import React, {
  createContext,
  forwardRef,
  KeyboardEvent,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Check } from "lucide-react";

import { cn } from "@adh/ui";
import { Badge } from "@adh/ui/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandItem,
  CommandList,
} from "@adh/ui/ui/command";

interface SelectProps
  extends React.ComponentPropsWithoutRef<typeof CommandPrimitive> {
  value: string;
  onValueChange: (value: string) => void;
  loop?: boolean;
  setSearchQuery?: (query: string) => void;
}

interface SelectContextProps {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (value: boolean) => void;
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  activeIndex: number;
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
  ref: React.RefObject<HTMLInputElement>;
  setSearchQuery?: (query: string) => void;
}

const SelectContext = createContext<SelectContextProps | null>(null);

const useSelect = () => {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error("useSelect must be used within SelectProvider");
  }
  return context;
};

const SelectC = ({
  value,
  onValueChange,
  loop = false,
  className,
  setSearchQuery,
  children,
  dir,
  ...props
}: SelectProps) => {
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false); // Close dropdown
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange,
        open,
        setOpen,
        inputValue,
        setInputValue,
        activeIndex,
        setActiveIndex,
        ref: inputRef,
        setSearchQuery,
      }}
    >
      <div ref={containerRef} className="relative">
        <Command
          className={cn(
            "flex flex-col space-y-2 overflow-visible bg-transparent",
            className,
          )}
          dir={dir}
          {...props}
        >
          {children}
        </Command>
      </div>
    </SelectContext.Provider>
  );
};

const SelectTriggerC = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    setSearchQuery?: (query: string) => void;
    isInOrg?: boolean;
  }
>(({ className, children, setSearchQuery, isInOrg, ...props }, ref) => {
  const { value, onValueChange, setOpen, inputValue, setInputValue } =
    useSelect();

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent dropdown from opening on clear
    onValueChange(""); // Clear selection
    setInputValue(""); // Reset search input
    setOpen(false); // Close dropdown
  };

  const handleSearch = () => {
    if (inputValue.trim() !== "") {
      console.log("🔍 Triggering backend search:", inputValue);
      setSearchQuery?.(inputValue);
      setInputValue(""); // Reset search input
      setOpen(true);
    }
  };

  return (
    <div
      ref={ref}
      className={cn(
        "flex cursor-pointer items-center justify-between rounded-lg bg-background p-2 ring-1 ring-muted",
        className,
      )}
      onClick={() => setOpen(true)} // Always open dropdown on click
      {...props}
    >
      <span className="text-sm">{value}</span>
      {children}
      {!isInOrg && // Conditionally render buttons based on isInOrg
        (value ? (
          <button
            type="button"
            onClick={handleClear}
            className="ml-2 text-sm text-red-500 hover:text-red-700"
          >
            Clear
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSearch}
            className="ml-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Search
          </button>
        ))}
    </div>
  );
});

SelectTriggerC.displayName = "SelectTriggerC";

const SelectInputC = forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => {
  const {
    value,
    setOpen,
    inputValue,
    setInputValue,
    ref: inputRef,
  } = useSelect();

  return (
    <CommandPrimitive.Input
      {...props}
      ref={inputRef}
      value={value ? "" : inputValue} // Disable typing if a value is selected
      onValueChange={(newValue) => !value && setInputValue(newValue)} // Allow search only when no selection
      onFocus={() => !value && setOpen(true)} // Prevent search if a value is selected
      className={cn(
        "ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground",
        className,
        value && "cursor-pointer", // Change cursor when selection is made
      )}
      disabled={!!value} // Disable input when a selection is made
      placeholder={value ? "" : "Search here"} // Remove placeholder when value is selected
    />
  );
});

SelectInputC.displayName = "SelectInputC";

const SelectContentC = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children }, ref) => {
  const { open } = useSelect();
  return (
    <div ref={ref} className="relative">
      {open && (
        <div className="absolute top-0 z-10 w-full rounded-md border bg-white shadow-lg">
          {children}
        </div>
      )}
    </div>
  );
});
SelectContentC.displayName = "SelectContentC";

const SelectListC = forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, children }, ref) => {
  return (
    <CommandList
      ref={ref}
      className={cn("flex w-full flex-col gap-2 p-2", className)}
    >
      {children}
      <CommandEmpty>
        <span className="text-muted-foreground">No results found</span>
      </CommandEmpty>
    </CommandList>
  );
});
SelectListC.displayName = "SelectListC";

const SelectItemC = forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  { value: string } & React.ComponentPropsWithoutRef<
    typeof CommandPrimitive.Item
  >
>(({ className, value, children, ...props }, ref) => {
  const {
    value: selectedValue,
    onValueChange,
    setInputValue,
    setOpen,
  } = useSelect();

  return (
    <CommandItem
      ref={ref}
      {...props}
      onSelect={() => {
        onValueChange(value);
        setInputValue("");
        setOpen(false);
      }}
      className={cn(
        "flex justify-between rounded-md px-2 py-1 transition-colors",
        className,
      )}
    >
      {children}
      {selectedValue === value && <Check className="h-4 w-4" />}
    </CommandItem>
  );
});
SelectItemC.displayName = "SelectItemC";

export {
  SelectC,
  SelectTriggerC,
  SelectInputC,
  SelectContentC,
  SelectListC,
  SelectItemC,
};

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
import { Check, X as RemoveIcon } from "lucide-react";

import { cn } from "@adh/ui";
import { Badge } from "@adh/ui/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandItem,
  CommandList,
} from "@adh/ui/ui/command";

interface MultiSelectorProps
  extends React.ComponentPropsWithoutRef<typeof CommandPrimitive> {
  values: string[];
  onValuesChange: (value: string[]) => void;
  loop?: boolean;
  setSearchQuery?: (query: string) => void;
}

interface MultiSelectContextProps {
  value: string[];
  onValueChange: (value: any) => void;
  open: boolean;
  setOpen: (value: boolean) => void;
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  activeIndex: number;
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
  ref: React.RefObject<HTMLInputElement>;
  handleSelect: (e: React.SyntheticEvent<HTMLInputElement>) => void;
  setSearchQuery?: (query: string) => void;
}

const MultiSelectContext = createContext<MultiSelectContextProps | null>(null);

const useMultiSelect = () => {
  const context = useContext(MultiSelectContext);
  if (!context) {
    throw new Error("useMultiSelect must be used within MultiSelectProvider");
  }
  return context;
};

/**
 * MultiSelect Docs: {@link: https://shadcn-extension.vercel.app/docs/multi-select}
 */

// TODO : expose the visibility of the popup

const MultiSelectorC = ({
  values: value,
  onValuesChange: onValueChange,
  loop = false,
  className,
  setSearchQuery,
  children,
  dir,
  ...props
}: MultiSelectorProps) => {
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null); // ✅ Container ref for detecting outside clicks

  const [isValueSelected, setIsValueSelected] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState("");

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false); // Close dropdown when clicking outside
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const onValueChangeHandler = useCallback(
    (val: string) => {
      if (value.includes(val)) {
        onValueChange(value.filter((item) => item !== val));
      } else {
        onValueChange([...value, val]);
      }
    },
    [value, onValueChange],
  );

  return (
    <MultiSelectContext.Provider
      value={{
        value,
        onValueChange: onValueChangeHandler,
        handleSelect: () => {},
        open,
        setOpen,
        inputValue,
        setInputValue,
        activeIndex,
        setActiveIndex,
        ref: inputRef,
      }}
    >
      <div ref={containerRef} className="relative">
        {" "}
        {/* ✅ Add ref to track outside clicks */}
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
    </MultiSelectContext.Provider>
  );
};

const MultiSelectorTriggerC = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    setSearchQuery?: (query: string) => void;
  }
>(({ className, children, setSearchQuery, ...props }, ref) => {
  const {
    value,
    onValueChange,
    activeIndex,
    inputValue,
    setOpen,
    setInputValue,
  } = useMultiSelect();

  const mousePreventDefault = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleSearch = () => {
    if (inputValue.trim() !== "") {
      console.log("🔍 Triggering backend search:", inputValue);
      setSearchQuery?.(inputValue);
      setInputValue("");
      setOpen(true);
    }
  };

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-wrap gap-1 rounded-lg bg-background p-1 py-2 ring-1 ring-muted",
        {
          "ring-1 focus-within:ring-ring": activeIndex === -1,
        },
        className,
      )}
      {...props}
    >
      {value.map((item, index) => (
        <Badge
          key={item}
          className={cn(
            "flex items-center gap-1 rounded-xl px-1",
            activeIndex === index && "ring-2 ring-muted-foreground",
          )}
          variant={"secondary"}
        >
          <span className="text-xs">{item}</span>
          <button
            aria-label={`Remove ${item} option`}
            aria-roledescription="button to remove option"
            type="button"
            onMouseDown={mousePreventDefault}
            onClick={() => onValueChange(item)}
          >
            <span className="sr-only">Remove {item} option</span>
            <RemoveIcon className="h-4 w-4 hover:stroke-destructive" />
          </button>
        </Badge>
      ))}
      {children}
      <button
        type="button"
        onClick={handleSearch}
        className="ml-2 text-sm text-gray-500 hover:text-gray-700"
      >
        Search
      </button>
    </div>
  );
});

MultiSelectorTriggerC.displayName = "MultiSelectorTriggerC";

const MultiSelectorInputC = forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => {
  const {
    setOpen,
    inputValue,
    setInputValue,
    setActiveIndex,
    handleSelect,
    ref: inputRef,
  } = useMultiSelect();

  return (
    <CommandPrimitive.Input
      {...props}
      tabIndex={0}
      ref={inputRef}
      value={inputValue}
      onValueChange={setInputValue} // ✅ Update input value without triggering API
      onSelect={handleSelect}
      onBlur={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onClick={() => setActiveIndex(-1)}
      className={cn(
        "ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground",
        className,
      )}
    />
  );
});

MultiSelectorInputC.displayName = "MultiSelectorInputC";

const MultiSelectorContentC = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children }, ref) => {
  const { open } = useMultiSelect();
  return (
    <div ref={ref} className="relative">
      {open && (
        <div className="absolute top-0 z-10 w-full rounded-md border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
          {children}
        </div>
      )}
    </div>
  );
});

MultiSelectorContentC.displayName = "MultiSelectorContentC";

const MultiSelectorListC = forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, children }, ref) => {
  return (
    <CommandList
      ref={ref}
      className={cn(
        "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground scrollbar-thumb-rounded-lg flex w-full flex-col gap-2 p-2",
        className,
      )}
    >
      {children}
      <CommandEmpty>
        <span className="text-muted-foreground">No results found</span>
      </CommandEmpty>
    </CommandList>
  );
});

MultiSelectorListC.displayName = "MultiSelectorListC";

const MultiSelectorItemC = forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  { value: string } & React.ComponentPropsWithoutRef<
    typeof CommandPrimitive.Item
  >
>(({ className, value, children, ...props }, ref) => {
  const {
    value: Options,
    onValueChange,
    setInputValue,
    setOpen,
  } = useMultiSelect();

  const mousePreventDefault = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  const isIncluded = Options.includes(value);
  return (
    <CommandItem
      ref={ref}
      {...props}
      onSelect={() => {
        onValueChange(value);
        setOpen(false);
        setInputValue("");
      }}
      className={cn(
        "flex cursor-pointer justify-between rounded-md px-2 py-1 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
        className,
        isIncluded && "cursor-default opacity-50",
        props.disabled && "cursor-not-allowed opacity-50",
      )}
      onMouseDown={mousePreventDefault}
    >
      {children}
      {isIncluded && <Check className="h-4 w-4" />}
    </CommandItem>
  );
});

MultiSelectorItemC.displayName = "MultiSelectorItemC";

export {
  MultiSelectorC,
  MultiSelectorTriggerC,
  MultiSelectorInputC,
  MultiSelectorContentC,
  MultiSelectorListC,
  MultiSelectorItemC,
};

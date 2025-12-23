import React, { useState } from "react";
import { X } from "lucide-react";

import { Badge } from "@adh/ui/ui/badge";
import { Button } from "@adh/ui/ui/button";
import { Input } from "@adh/ui/ui/input";

export default function BadgeInput({
  placeholder,
  onSelectionChange,
  value,
}: {
  placeholder: string;
  onSelectionChange: (selectedItems: string[]) => void;
  value?: string[];
}) {
  const [inputValue, setInputValue] = useState("");
  const [items, setItems] = useState<string[]>(value ? value : []);

  const removeItem = (item: string) => {
    setItems((prevItems) => prevItems.filter((i) => i !== item));
  };

  const addItem = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim() !== "") {
      e.preventDefault();
      if (!items.includes(inputValue.trim())) {
        setItems([...items, inputValue.trim()]);
        onSelectionChange([...items, inputValue.trim()]);
      }
      setInputValue("");
    }
  };

  return (
    <div className="w-full">
      <div className="relative flex flex-wrap items-center gap-1 rounded-md border px-3 py-2">
        {items.map((item, index) => (
          <Badge
            key={index}
            className="px-2 py-0.5 text-xs"
            variant="secondary"
          >
            {item}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ml-1 h-auto p-0 hover:bg-transparent"
              onClick={() => removeItem(item)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
        <Input
          className="min-w-[120px] flex-1 border-none bg-transparent p-0 text-sm"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={addItem}
        />
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { ChevronRight } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@adh/ui/ui/select";

export default function DropdownExpandableMultiSelect({
  defaultValue,
  data,
  onSelectionChange,
}: {
  defaultValue?: string[];
  data: Record<string, string[]>;
  onSelectionChange: (selectedItems: string[]) => void;
}) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>(
    defaultValue || [],
  );
  const [open, setOpen] = useState(false);

  const handleCategoryClick = (e: React.MouseEvent, category: string) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const handleItemSelect = (e: React.MouseEvent, item: string) => {
    e.preventDefault();
    e.stopPropagation();
    const newSelection = selectedItems.includes(item)
      ? selectedItems.filter((i) => i !== item)
      : [...selectedItems, item];
    setSelectedItems(newSelection);
    onSelectionChange(newSelection);
  };

  return (
    <div className="space-y-2">
      <Select open={open} onOpenChange={setOpen}>
        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={
              selectedItems.length > 0
                ? selectedItems.join(", ") // Display selected items
                : "Select"
            }
          ></SelectValue>
        </SelectTrigger>
        <SelectContent className="w-[300px]">
          <div className="max-h-[300px] overflow-auto">
            {Object.entries(data).map(([category, items]) => (
              <div key={category} className="border-b last:border-b-0">
                <div
                  className="flex cursor-pointer items-center justify-between px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={(e) => handleCategoryClick(e, category)}
                >
                  <div className="flex items-center space-x-2">
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${
                        expandedCategory === category
                          ? "rotate-90 transform"
                          : ""
                      }`}
                    />
                    <span>{category}</span>
                    <span className="text-gray-500">({items.length})</span>
                  </div>
                </div>

                {expandedCategory === category && (
                  <div className="bg-gray-50 py-1 dark:bg-gray-800">
                    {items.map((item: string) => (
                      <div
                        key={item}
                        className="flex cursor-pointer items-center px-6 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={(e) => handleItemSelect(e, item)}
                      >
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={selectedItems.includes(item)}
                          readOnly
                        />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
}

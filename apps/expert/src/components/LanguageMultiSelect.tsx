import React, { useState } from "react";

import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@adh/ui/ui/select";

interface LanguageMultiSelectProps {
  onSelectionChange: (selectedItems: string[]) => void;
}

export default function LanguageMultiSelect({
  onSelectionChange,
}: LanguageMultiSelectProps) {
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  // Create the options as usual
  const options = [
    { value: "English", label: "English" },
    { value: "Chinese", label: "Chinese (漢語)" },
    { value: "Japanese", label: "Japanese (日本語)" },
    { value: "Korean", label: "Korean (한국어)" },
    { value: "Thai", label: "Thai (ภาษาไทย)" },
    { value: "Vietnamese", label: "Vietnamese (Tiếng Việt)" },
    { value: "Indonesian", label: "Indonesian (Bahasa Indonesia)" },
    { value: "Malay", label: "Malay (Bahasa Melayu)" },
    { value: "Filipino", label: "Filipino (Tagalog)" },
    { value: "Burmese", label: "Burmese (မြန်မာဘာသာ)" },
    { value: "Khmer", label: "Khmer (ភាសាខ្មែរ)" },
    { value: "Lao", label: "Lao (ລາວ)" },
    { value: "Hindi", label: "Hindi (हिन्दी)" },
    { value: "Arabic", label: "Arabic (العربية)" },
    { value: "Spanish", label: "Spanish (Español)" },
    { value: "French", label: "French (Français)" },
    { value: "German", label: "German (Deutsch)" },
    { value: "Russian", label: "Russian (русский)" },
    { value: "Portuguese", label: "Portuguese (Português)" },
    { value: "Italian", label: "Italian (Italiano)" },
    { value: "Dutch", label: "Dutch (Nederlands)" },
    { value: "Polish", label: "Polish (Polskie)" },
    { value: "Turkish", label: "Turkish (Türk)" },
    { value: "Swedish", label: "Swedish (Svenska)" },
    { value: "Romanian", label: "Romanian (Română)" },
    { value: "Greek", label: "Greek (Ελληνικά)" },
    { value: "Hungarian", label: "Hungarian (Magyar)" },
    { value: "Czech", label: "Czech (Čeština)" },
    { value: "Finnish", label: "Finnish (Suomalainen)" },
  ];

  // Toggle selection of items
  const handleItemSelect = (e: React.MouseEvent, item: string) => {
    e.preventDefault();
    e.stopPropagation();
    const newSelection = selectedLanguages.includes(item)
      ? selectedLanguages.filter((i) => i !== item)
      : [...selectedLanguages, item];
    setSelectedLanguages(newSelection);
    onSelectionChange(newSelection);
  };

  return (
    <Select>
      <SelectTrigger className="w-full">
        <SelectValue
          placeholder={
            selectedLanguages && selectedLanguages.length > 0
              ? selectedLanguages.join(", ")
              : "Select Language"
          }
        />
      </SelectTrigger>
      <SelectContent className="max-h-[300px] w-[300px] overflow-hidden">
        {options.map(({ value: optionValue, label }) => (
          <div
            key={optionValue}
            className="flex cursor-pointer items-center px-6 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={(e) => handleItemSelect(e, optionValue)}
          >
            <input
              type="checkbox"
              className="mr-2"
              checked={selectedLanguages.includes(optionValue)}
              readOnly
            />
            <span>{label}</span>
          </div>
        ))}
      </SelectContent>
    </Select>
  );
}

"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@adh/ui";
import { Button } from "@adh/ui/ui/button";
import { Calendar } from "@adh/ui/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@adh/ui/ui/popover";

interface DatePickerProps {
  date: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  className?: string;
  fullWidth?: boolean;
}

export function DatePicker({
  date,
  onSelect,
  className,
  fullWidth,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            fullWidth ? "w-full" : "w-[280px]",
            "justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

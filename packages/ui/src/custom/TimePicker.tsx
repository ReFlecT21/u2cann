"use client";

import * as React from "react";
import { cn } from "@adh/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adh/ui/ui/select";

type AmPm = "AM" | "PM";

export interface TimePickerProps {
  value?: string; // in 24h format HH:mm
  onChange: (value: string) => void; // returns 24h HH:mm
  className?: string;
  fullWidth?: boolean;
  placeholder?: string;
}

function parse24h(value?: string): {
  hour12: number;
  minute: number;
  ampm: AmPm;
  timeString: string;
} {
  if (!value) return { hour12: 12, minute: 0, ampm: "AM", timeString: "12:00" };
  const [hStr, mStr] = value.split(":");
  const h = Number(hStr);
  const m = Number(mStr ?? 0);
  const ampm: AmPm = h >= 12 ? "PM" : "AM";
  let hour12 = h;
  if (h === 0) hour12 = 12; // 00 -> 12 AM
  if (h > 12) hour12 = h - 12; // 13..23 -> 1..11 PM
  const timeString = `${hour12.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  return { hour12, minute: m, ampm, timeString };
}

function to24h(timeString: string, ampm: AmPm): string {
  const [hStr, mStr] = timeString.split(":");
  let h = Number(hStr);
  const m = Number(mStr ?? 0);
  
  if (h === 12) h = 0; // 12 AM -> 00, 12 PM stays 12
  if (ampm === "PM" && h !== 0) h += 12; // Add 12 for PM (except 12 PM)
  if (ampm === "PM" && Number(hStr) === 12) h = 12; // 12 PM stays 12
  
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function TimePicker({
  value = "",
  onChange,
  fullWidth,
}: TimePickerProps) {
  const parsed = React.useMemo(() => parse24h(value), [value]);
  const [timeInput, setTimeInput] = React.useState(parsed.timeString);
  const [ampm, setAmPm] = React.useState<AmPm>(parsed.ampm);

  React.useEffect(() => {
    const p = parse24h(value);
    setTimeInput(p.timeString);
    setAmPm(p.ampm);
  }, [value]);

  const handleAmPmChange = (newAmPm: string) => {
    const newAmPmValue = newAmPm as AmPm;
    setAmPm(newAmPmValue);
    if (timeInput) {
      onChange(to24h(timeInput, newAmPmValue));
    }
  };

  const handleHourChange = (newHour: string) => {
    const newTime = `${newHour.padStart(2, "0")}:${timeInput.split(':')[1] || "00"}`;
    setTimeInput(newTime);
    onChange(to24h(newTime, ampm));
  };

  const handleMinuteChange = (newMinute: string) => {
    const newTime = `${timeInput.split(':')[0] || "12"}:${newMinute.padStart(2, "0")}`;
    setTimeInput(newTime);
    onChange(to24h(newTime, ampm));
  };

  const [hours, minutes] = timeInput.split(':');

  // Generate hour options (1-12)
  const hourOptions = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  
  // Generate minute options (0-59)
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

  return (
    <div className={cn("flex items-center gap-2", fullWidth && "w-full")}>
      <div className="flex items-center gap-1">
        <Select value={hours || ""} onValueChange={handleHourChange}>
          <SelectTrigger className="w-16">
            <SelectValue placeholder="HH" />
          </SelectTrigger>
          <SelectContent>
            {hourOptions.map((hour) => (
              <SelectItem key={hour} value={hour}>
                {hour.padStart(2, "0")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground">:</span>
        <Select value={minutes || ""} onValueChange={handleMinuteChange}>
          <SelectTrigger className="w-16">
            <SelectValue placeholder="MM" />
          </SelectTrigger>
          <SelectContent className="max-h-48 overflow-y-auto">
            {minuteOptions.map((minute) => (
              <SelectItem key={minute} value={minute}>
                {minute}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Select value={ampm} onValueChange={handleAmPmChange}>
        <SelectTrigger className="w-20">
          <SelectValue placeholder="AM/PM" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export default TimePicker;

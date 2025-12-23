import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@adh/ui/ui/button";
import { Badge } from "@adh/ui/ui/badge";
import { MoreHorizontal, PencilIcon, TrashIcon, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@adh/ui/ui/dropdown-menu";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);

export interface AvailabilityRow {
  id: string;
  name?: string;
  isDefault: boolean;
  timezone: string;
  availability: {
    day: string;
    start: string;
    end: string;
  }[];
}

function parseTimeFlexible(raw: string) {
  // Support both 24h ("09:00") and 12h ("9:00am" / "9:00 AM") inputs
  const formats = [
    "HH:mm",
    "H:mm",
    "h:mma",
    "h:mmA",
    "hh:mma",
    "hh:mm A",
    "h:mm a",
    "h:mm A",
  ];
  for (const fmt of formats) {
    const d = dayjs(raw, fmt, true);
    if (d.isValid()) return d;
  }
  return null;
}

function groupHoursByTime(hours: AvailabilityRow["availability"]) {
  const groups: { days: string[]; start: string; end: string }[] = [];

  (hours || []).forEach(({ day, start, end }) => {
    const parsedStart = parseTimeFlexible(start);
    const parsedEnd = parseTimeFlexible(end);
    const formattedStart = parsedStart ? parsedStart.format("h:mm A") : start;
    const formattedEnd = parsedEnd ? parsedEnd.format("h:mm A") : end;
    const existingGroup = groups.find(
      (g) => g.start === formattedStart && g.end === formattedEnd,
    );
    if (existingGroup) {
      existingGroup.days.push(day);
    } else {
      groups.push({ days: [day], start: formattedStart, end: formattedEnd });
    }
  });

  return groups;
}

function formatDays(days: string[]) {
  const abbr = days.map((d) => d.slice(0, 3));
  if (abbr.length === 1) return abbr[0];
  if (abbr.length === 2) return abbr.join(" - ");
  return `${abbr[0]} - ${abbr[abbr.length - 1]}`;
}

export function getColumns({
  onEdit,
  onDelete,
}: {
  onEdit: (row: AvailabilityRow) => void;
  onDelete: (id: string) => void;
}): ColumnDef<AvailabilityRow>[] {
  return [
    {
      header: "Working Hours",
      meta: { align: "left", headClassName: "pl-8", cellClassName: "pl-8" },
      accessorKey: "availability",
      cell: ({ row }) => {
        const availability = row.original;
        const groups = groupHoursByTime(availability.availability || []);

        return (
          <div className="flex flex-col gap-2 py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Working Hours</span>
              {availability.isDefault && (
                <Badge variant="secondary" className="bg-green-600 text-white">
                  Default
                </Badge>
              )}
            </div>
            <div className="space-y-1 text-sm">
              {groups.map(({ days, start, end }, i) => (
                <div key={i}>
                  {formatDays(days)}, {start} - {end}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4" />
              <span>{availability.timezone}</span>
            </div>
          </div>
        );
      },
    },
    {
      header: "Actions",
      id: "actions",
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(row.original)}>
                <PencilIcon className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(row.original.id)}
              >
                <TrashIcon className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

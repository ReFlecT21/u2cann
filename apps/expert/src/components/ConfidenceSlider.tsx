import React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@adh/ui";
import { Label } from "@adh/ui/ui/label";
import { Slider } from "@adh/ui/ui/slider";
import { useTranslations } from "next-intl";

type SliderProps = React.ComponentProps<typeof Slider> & {
  value?: number[];
  onValueChange?: (value: number[]) => void;
};

export function ConfidenceSlider({
  className,
  value = [0],
  onValueChange,
  ...props
}: SliderProps) {
  const t = useTranslations("confidenceSlider");
  const labels = [t("low"), t("medium"), t("high")];
  const sliderValue = value ?? [0]; // Ensure value is always defined

  return (
    <div className={cn("w-[60%]", className)}>
      <SliderPrimitive.Root
        value={sliderValue}
        max={2}
        step={1}
        onValueChange={onValueChange}
        className={cn(
          "relative mb-4 flex w-full touch-none select-none items-center",
          className,
        )}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-red-200">
          <SliderPrimitive.Range className="absolute h-full bg-red-500" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-red-500 bg-white ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
      </SliderPrimitive.Root>
      <div className="flex justify-between">
        {labels.map((label, index) => (
          <Label
            key={label}
            className={cn(
              "text-sm",
              sliderValue[0] === index ? "font-bold" : "text-muted-foreground",
            )}
          >
            {label}
          </Label>
        ))}
      </div>
    </div>
  );
}

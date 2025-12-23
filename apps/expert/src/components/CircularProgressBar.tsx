"use client";

import React from "react";
import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from "recharts";
import { useTranslations } from "next-intl";

interface CircularProgressBarProps {
  value: number; // Current value
  total: number; // Total value
}

const CircularProgressBar: React.FC<CircularProgressBarProps> = ({
  value,
  total,
}) => {
  const t = useTranslations("circularProgressBar");
  // Define the data for the circular progress bar
  const data = [
    {
      name: "Progress",
      value: (value / total) * 100, // Percentage of completion
      fill: "#db2633", // Color of the progress
    },
  ];

  return (
    <>
      <div className="relative flex h-64 flex-col items-center justify-center">
        {/* Wrapping RadialBarChart with ResponsiveContainer to make it responsive */}
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="100%"
            outerRadius="100%"
            barSize={10}
            data={data}
            startAngle={180}
            endAngle={0}
            cy="50%" // Adjusting this to center the chart properly
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar background dataKey="value" cornerRadius={10} />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Text below the chart */}
        <div className="absolute bottom-4 flex flex-col items-center font-semibold">
          <div className="text-xl">{`${data[0]?.value.toFixed(0)}%`}</div>
          <div className="leading-none text-muted-foreground">
          {`${value}/${total} ${t("complete")}`}
          </div>
        </div>
      </div>
    </>
  );
};

export default CircularProgressBar;

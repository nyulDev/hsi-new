"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Label, Pie, PieChart } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./ui/chart";

const chartConfig = {
  visitors: {
    label: "Investors",
  },
} satisfies ChartConfig;

const AppPieChart = () => {
  const [totalInvestors, setTotalInvestors] = useState<number>(0);
  const { theme } = useTheme();

  useEffect(() => {
    async function fetchTotalInvestors() {
      try {
        const response = await fetch("/api/investors?action=totalCount");
        const data = await response.json();
        if (data.total !== undefined) {
          setTotalInvestors(data.total);
        }
      } catch (error) {
        console.error("Failed to fetch total investors:", error);
      }
    }
    fetchTotalInvestors();
  }, []);

  const chartFillColor = theme === "dark" ? "#FAA533" : "#003161";

  const chartData = [
    {
      browser: "investors",
      visitors: totalInvestors,
      fill: chartFillColor,
    },
  ];

  return (
    <div className="">
      <h1 className="text-lg font-medium mb-6">Total Investor</h1>
      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square max-h-[250px]"
      >
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Pie
            data={chartData}
            dataKey="visitors"
            nameKey="browser"
            innerRadius={60}
            strokeWidth={5}
          >
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className="fill-foreground text-3xl font-bold"
                      >
                        {totalInvestors.toLocaleString()}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 24}
                        className="fill-muted-foreground"
                      >
                        Investors
                      </tspan>
                    </text>
                  );
                }
                return null;
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>
      {/* <div className="mt-4 flex flex-col gap-2 items-center">
        <div className="leading-none text-muted-foreground">
          Displays total registered investors
        </div>
      </div> */}
    </div>
  );
};

export default AppPieChart;

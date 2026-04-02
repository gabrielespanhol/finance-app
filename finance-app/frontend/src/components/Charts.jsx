import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export default function Charts({
  chartData = [],
  balancePieData = [],
  categories = {},
}) {
  // Use fixed sizes to avoid ResponsiveContainer/ResizeObserver sizing differences
  return (
    <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
      <div className="flex-1 flex items-center justify-center">
        {chartData && chartData.length > 0 ? (
          <PieChart width={300} height={300}>
            <Pie
              data={chartData}
              dataKey="value"
              outerRadius={100}
              innerRadius={40}
            >
              {chartData.map((e, i) => (
                <Cell key={i} fill={categories[e.name] || "#8884d8"} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        ) : (
          <div className="p-6 text-center text-sm text-[#9CA3AF]">
            No data available
          </div>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center">
        {balancePieData && balancePieData.length > 0 ? (
          <PieChart width={300} height={300}>
            <Pie
              data={balancePieData}
              dataKey="value"
              innerRadius={40}
              outerRadius={80}
            >
              {balancePieData.map((_, i) => (
                <Cell key={i} fill={i === 0 ? "#10b981" : "#ef4444"} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        ) : (
          <div className="p-6 text-center text-sm text-[#9CA3AF]">
            No data available
          </div>
        )}
      </div>
    </div>
  );
}

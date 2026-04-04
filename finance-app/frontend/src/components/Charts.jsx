import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "../utils/format";

const EmptyState = () => (
  <div className="p-6 text-center text-sm text-[#9CA3AF] w-full h-[250px] flex items-center justify-center">
    Não há dados
  </div>
);

const CustomLegend = ({ payload }) => {
  return (
    <ul className="flex flex-row md:flex-col flex-wrap justify-center md:justify-start content-start gap-x-6 gap-y-1.5 w-full md:w-auto md:max-h-[250px] px-2 text-sm text-[#9CA3AF]">
      {payload.map((entry, index) => (
        <li key={`item-${index}`} className="flex items-center gap-2">
          <span style={{ backgroundColor: entry.color }} className="w-2.5 h-2.5 rounded-full flex-shrink-0" />
          <span className="truncate max-w-[130px]" title={entry.value}>{entry.value}</span>
        </li>
      ))}
    </ul>
  );
};

export default function Charts({
  chartData = [],
  balancePieData = [],
  categories = {},
}) {
  const activeChartData = chartData ? chartData.filter((d) => d.value > 0) : [];
  const activeBalanceData = balancePieData ? balancePieData.filter((d) => d.value > 0) : [];

  return (
    <div className="flex flex-col md:flex-row w-full gap-6">
      
      {/* 1st Chart Container */}
      <div className="flex-1 w-full flex flex-col md:flex-row items-center justify-between min-h-[250px]">
        {activeChartData.length > 0 ? (
          <>
            <div className="order-2 md:order-1 w-full md:w-auto flex mt-4 md:mt-0">
               <CustomLegend payload={activeChartData.map(e => ({ value: e.name, color: categories[e.name] || "#8884d8" }))} />
            </div>
            <div className="order-1 md:order-2 flex-1 w-full min-w-[200px] h-[250px] md:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activeChartData}
                    dataKey="value"
                    outerRadius="80%"
                    innerRadius="40%"
                  >
                    {activeChartData.map((e, i) => (
                      <Cell key={i} fill={categories[e.name] || "#8884d8"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <EmptyState />
        )}
      </div>

      {/* 2nd Chart Container */}
      <div className="flex-1 w-full flex flex-col md:flex-row items-center justify-between min-h-[250px]">
        {activeBalanceData.length > 0 ? (
          <>
            <div className="order-2 md:order-1 w-full md:w-auto flex mt-4 md:mt-0">
               <CustomLegend payload={activeBalanceData.map(e => ({ value: e.name, color: e.name === "Receitas" ? "#10b981" : "#ef4444" }))} />
            </div>
            <div className="order-1 md:order-2 flex-1 w-full min-w-[200px] h-[250px] md:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activeBalanceData}
                    dataKey="value"
                    innerRadius="40%"
                    outerRadius="80%"
                  >
                    {activeBalanceData.map((e, i) => (
                      <Cell key={i} fill={e.name === "Receitas" ? "#10b981" : "#ef4444"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "../utils/format";

const EmptyState = () => (
  <div className="p-6 text-center text-sm text-muted w-full flex items-center justify-center" style={{ height: '250px' }}>
    Não há dados
  </div>
);

const CustomLegend = ({ payload }) => {
  return (
    <ul 
      className="flex flex-row md:flex-col flex-wrap items-center md:items-start gap-3 text-sm text-muted" 
      style={{ 
        width: '100%', 
        maxHeight: '280px', 
        padding: '0 0.5rem',
        overflowY: 'auto',
        scrollbarWidth: 'thin'
      }}
    >
      {payload.map((entry, index) => (
        <li key={`item-${index}`} className="flex items-center gap-2" style={{ minWidth: '110px' }}>
          <span style={{ backgroundColor: entry.color, width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 }} />
          <span className="truncate" style={{ maxWidth: '140px' }} title={entry.value}>{entry.value}</span>
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
      <div className="flex flex-col-reverse md:flex-row items-center w-full gap-8" style={{ minHeight: '300px' }}>
        {activeChartData.length > 0 ? (
          <>
            <div className="flex w-full md:w-auto" style={{ flexShrink: 0, maxWidth: '280px' }}>
               <CustomLegend payload={activeChartData.map(e => ({ value: e.name, color: categories[e.name] || "#8884d8" }))} />
            </div>
            <div className="flex-grow w-full" style={{ minWidth: '250px', height: '300px' }}>
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
      <div className="flex flex-col-reverse md:flex-row items-center w-full gap-8" style={{ minHeight: '300px' }}>
        {activeBalanceData.length > 0 ? (
          <>
            <div className="flex w-full md:w-auto" style={{ flexShrink: 0, maxWidth: '280px' }}>
               <CustomLegend payload={activeBalanceData.map(e => ({ value: e.name, color: e.name === "Receitas" ? "#10b981" : "#ef4444" }))} />
            </div>
            <div className="flex-grow w-full" style={{ minWidth: '250px', height: '300px' }}>
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

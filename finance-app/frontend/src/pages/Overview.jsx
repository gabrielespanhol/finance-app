import React from "react";
import useTransactions from "../hooks/useTransactions";
import { formatCurrency } from "../utils/format";
import { categories } from "../utils/categories";

export default function Overview({ dark, setDark }) {
  const tx = useTransactions({ dark, setDark });

  return (
    <>
      <h2 className="font-semibold mb-4">Visão Geral de Gastos</h2>

      <div
        className={`${dark ? "bg-[#1E2329] border-[#2B3139] text-[#EAECEF]" : "bg-white border-gray-100 text-gray-900"} p-4 rounded-2xl border`}
      >
        <div className="p-2">
          <div>
            <h3 className="font-semibold mb-1">
              Gastos por Categoria (acumulado)
            </h3>
            <div className="text-sm text-[#9CA3AF] mb-3">
              Visão acumulada por categoria
            </div>
          </div>
          {tx.globalData.reduce((s, g) => s + g.value, 0) === 0 ? (
            <div className="text-sm text-[#9CA3AF]">No data available</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {tx.globalData.map((g) => (
                <div
                  key={g.name}
                  className="flex items-center justify-between gap-3 p-2 rounded-md"
                  style={{ borderColor: dark ? "#2B3139" : "#f3f4f6" }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ background: categories[g.name] }}
                    />
                    <span>{g.name}</span>
                  </div>
                  <div className="text-sm">{formatCurrency(g.value)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

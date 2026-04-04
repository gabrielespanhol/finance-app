import React, { useMemo, useState } from "react";
import useTransactions from "../hooks/useTransactions";
import { formatCurrency } from "../utils/format";
import TransactionsTable from "../components/TransactionsTable";

export default function Overview({ dark, setDark }) {
  const tx = useTransactions({ dark, setDark });

  // Derive available years from all transactions
  const availableYears = useMemo(() => {
    const years = [
      ...new Set(
        tx.transactions
          .map((t) => t.date?.slice(0, 4))
          .filter(Boolean)
      ),
    ].sort((a, b) => b - a);
    return years;
  }, [tx.transactions]);

  const currentYear = new Date().getFullYear().toString();
  const [filterYear, setFilterYear] = useState(currentYear);
  const [filterMonth, setFilterMonth] = useState(""); // "" = all months

  const MONTHS = [
    { value: "01", label: "Janeiro" },
    { value: "02", label: "Fevereiro" },
    { value: "03", label: "Março" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Maio" },
    { value: "06", label: "Junho" },
    { value: "07", label: "Julho" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
  ];

  // Filter transactions based on selected year + optional month
  const filtered = useMemo(() => {
    return tx.transactions.filter((t) => {
      if (!t.date) return false;
      const [y, m] = t.date.split("-");
      if (y !== filterYear) return false;
      if (filterMonth && m !== filterMonth) return false;
      return true;
    });
  }, [tx.transactions, filterYear, filterMonth]);

  // Aggregate expenses by category using backend color map
  const categoryTotals = useMemo(() => {
    const map = {};
    filtered
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const cat = t.category || "Outros";
        map[cat] = (map[cat] || 0) + Number(t.amount);
      });
    // Build result array sorted by value desc, with color from backend
    return Object.entries(map)
      .map(([name, value]) => ({
        name,
        value,
        color: tx.categoriesMap[name] || "#9CA3AF",
      }))
      .sort((a, b) => b.value - a.value);
  }, [filtered, tx.categoriesMap]);

  const totalExpense = categoryTotals.reduce((s, c) => s + c.value, 0);
  const totalIncome = filtered
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);

  const cardClass = `${dark ? "bg-[#1E2329] border-[#2B3139] text-[#EAECEF]" : "bg-white border-gray-100 text-gray-900"} p-4 rounded-2xl border`;
  const selectClass = `${dark ? "bg-[#1E2329] border-[#2B3139] text-[#EAECEF]" : "bg-white border-gray-200 text-gray-900"} border p-2 rounded-xl text-sm`;

  const periodLabel = filterMonth
    ? `${MONTHS.find((m) => m.value === filterMonth)?.label} ${filterYear}`
    : filterYear;

  const [overviewSearch, setOverviewSearch] = useState("");
  const overviewTableData = useMemo(() => {
    const q = overviewSearch.toLowerCase();
    return [...filtered]
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      .filter((t) => !q || (t.description || "").toLowerCase().includes(q));
  }, [filtered, overviewSearch]);

  return (
    <>
      <h2 className="font-semibold mb-4">Visão Geral de Gastos</h2>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          className={selectClass}
        >
          {availableYears.length === 0 && (
            <option value={currentYear}>{currentYear}</option>
          )}
          {availableYears.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className={selectClass}
        >
          <option value="">Todos os meses</option>
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        {filterMonth && (
          <button
            onClick={() => setFilterMonth("")}
            className="text-sm text-[#9CA3AF] px-3 py-2 rounded-xl border border-[#2B3139] hover:opacity-75 transition-opacity"
          >
            Limpar mês
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className={cardClass}>
          <p className="text-sm text-[#9CA3AF] mb-1">Receitas — {periodLabel}</p>
          <strong className="text-green-300 text-xl">{formatCurrency(totalIncome)}</strong>
        </div>
        <div className={cardClass}>
          <p className="text-sm text-[#9CA3AF] mb-1">Despesas — {periodLabel}</p>
          <strong className="text-red-400 text-xl">{formatCurrency(totalExpense)}</strong>
        </div>
        <div className={cardClass}>
          <p className="text-sm text-[#9CA3AF] mb-1">Saldo — {periodLabel}</p>
          <strong className={`text-xl ${totalIncome - totalExpense >= 0 ? (dark ? "text-green-200" : "text-green-300") : (dark ? "text-red-200" : "text-red-500")}`}>
            {formatCurrency(totalIncome - totalExpense)}
          </strong>
        </div>
      </div>


      {/* Category Breakdown */}
      <div className={cardClass}>
        <div className="mb-3">
          <h3 className="font-semibold mb-1">Gastos por Categoria</h3>
          <p className="text-sm text-[#9CA3AF]">
            {filterMonth ? `Visão mensal — ${periodLabel}` : `Visão anual — ${filterYear}`}
          </p>
        </div>

        {categoryTotals.length === 0 ? (
          <div className="text-sm text-[#9CA3AF] py-6 text-center">Não há dados</div>
        ) : (
          <div className="flex flex-col gap-3">
            {categoryTotals.map((cat) => {
              const pct = totalExpense > 0 ? (cat.value / totalExpense) * 100 : 0;
              return (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-sm">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#9CA3AF]">{pct.toFixed(1)}%</span>
                      <span className="text-sm font-medium">{formatCurrency(cat.value)}</span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className={`w-full h-1.5 rounded-full ${dark ? "bg-[#2B3139]" : "bg-gray-100"}`}>
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Transactions Table */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Transações — {periodLabel}</h3>
          <span className="text-sm text-[#9CA3AF]">{overviewTableData.length} registros</span>
        </div>
        <input
          type="text"
          placeholder="Buscar por descrição..."
          value={overviewSearch}
          onChange={(e) => setOverviewSearch(e.target.value)}
          className={`w-full mb-3 ${dark ? "bg-[#1E2329] border-[#2B3139] text-[#EAECEF] placeholder-[#6b7280]" : "bg-white border-gray-200"} p-2 rounded-xl border`}
        />
        <TransactionsTable
          tableData={overviewTableData}
          selectedIds={[]}
          setSelectedIds={() => {}}
          setSelected={() => {}}
          dark={dark}
          categories={tx.categoriesMap}
        />
      </div>
    </>
  );
}

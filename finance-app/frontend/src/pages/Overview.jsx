import React, { useMemo, useState } from "react";
import useTransactions from "../hooks/useTransactions";
import { formatCurrency } from "../utils/format";
import TransactionsTable from "../components/TransactionsTable";
import TransactionModal from "../components/TransactionModal";

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

  const cardClass = "card";
  const selectClass = "input-base text-sm";

  const periodLabel = filterMonth
    ? `${MONTHS.find((m) => m.value === filterMonth)?.label} ${filterYear}`
    : filterYear;

  const [overviewSearch, setOverviewSearch] = useState("");
  const [tableFilter, setTableFilter] = useState({ category: "", type: "" });

  const overviewTableData = useMemo(() => {
    const q = overviewSearch.toLowerCase();
    return [...filtered]
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      .filter((t) => {
        if (q && !(t.description || "").toLowerCase().includes(q)) return false;
        if (tableFilter.category && t.category !== tableFilter.category) return false;
        if (tableFilter.type && t.type !== tableFilter.type) return false;
        return true;
      });
  }, [filtered, overviewSearch, tableFilter]);

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
            className="btn btn-secondary"
          >
            Limpar mês
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className={cardClass}>
          <p className="text-muted mb-1">Receitas — {periodLabel}</p>
          <strong className="text-success text-xl">{formatCurrency(totalIncome)}</strong>
        </div>
        <div className={cardClass}>
          <p className="text-muted mb-1">Despesas — {periodLabel}</p>
          <strong className="text-danger text-xl">{formatCurrency(totalExpense)}</strong>
        </div>
        <div className={cardClass}>
          <p className="text-muted mb-1">Saldo — {periodLabel}</p>
          <strong className={`text-xl ${totalIncome - totalExpense >= 0 ? "text-success" : "text-danger"}`}>
            {formatCurrency(totalIncome - totalExpense)}
          </strong>
        </div>
      </div>


      {/* Category Breakdown */}
      <div className={cardClass}>
        <div className="mb-3">
          <h3 className="text-h">Gastos por Categoria</h3>
          <p className="text-muted">
            {filterMonth ? `Visão mensal — ${periodLabel}` : `Visão anual — ${filterYear}`}
          </p>
        </div>

        {categoryTotals.length === 0 ? (
          <div className="text-muted p-6 text-center">Não há dados</div>
        ) : (
          <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-4">
            {categoryTotals.map((cat) => {
              const pct = totalExpense > 0 ? (cat.value / totalExpense) * 100 : 0;
              return (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                       <span
                        className="inline-block"
                        style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          backgroundColor: cat.color,
                          flexShrink: 0
                        }}
                      />
                      <span>{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted">{pct.toFixed(1)}%</span>
                      <span className="font-medium">{formatCurrency(cat.value)}</span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full rounded-full overflow-hidden" style={{ height: '0.4rem', backgroundColor: 'var(--color-border-soft)' }}>
                    <div
                      className="h-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        )}
      </div>
      {/* Transactions Table */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Transações — {periodLabel}</h3>
          <span className="text-sm text-[#9CA3AF]">{overviewTableData.length} registros</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <input
            type="text"
            placeholder="Buscar por descrição..."
            value={overviewSearch}
            onChange={(e) => setOverviewSearch(e.target.value)}
            className="input-base flex-1"
            style={{ minWidth: '160px' }}
          />
          <select
            value={tableFilter.category}
            onChange={(e) => setTableFilter((s) => ({ ...s, category: e.target.value }))}
            className={selectClass}
          >
            <option value="">Todas as categorias</option>
            {(tx.categories || []).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={tableFilter.type}
            onChange={(e) => setTableFilter((s) => ({ ...s, type: e.target.value }))}
            className={selectClass}
          >
            <option value="">Tipo (todos)</option>
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
          </select>
          {(overviewSearch || tableFilter.category || tableFilter.type) && (
            <button
              onClick={() => { setOverviewSearch(""); setTableFilter({ category: "", type: "" }); }}
              className="btn btn-secondary btn-icon"
            >
              Limpar
            </button>
          )}
        </div>
        <TransactionsTable
          tableData={overviewTableData}
          selectedIds={[]}
          setSelectedIds={() => {}}
          setSelected={tx.setSelected}
          dark={dark}
          categories={tx.categoriesMap}
        />
      </div>

      {tx.selected && (
        <TransactionModal
          selected={tx.selected}
          updateSelected={tx.updateSelected}
          setSelected={tx.setSelected}
          dark={dark}
          fetchData={tx.fetchData}
          setModalEditing={tx.setModalEditing}
          updateTransaction={tx.updateTransaction}
          deleteTransaction={tx.deleteTransaction}
          categories={tx.categories}
        />
      )}
    </>
  );
}

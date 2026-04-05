import React, { useMemo, useState } from "react";
import useTransactions from "../hooks/useTransactions";
import { formatCurrency } from "../utils/format";
import TransactionsTable from "../components/TransactionsTable";
import TransactionModal from "../components/TransactionModal";
import Modal from "../components/Modal";

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
      <div className="card mb-6">
        <h2 className="text-h">Visão Geral de Gastos</h2>
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
              Limpar período
            </button>
          )}
        </div>

        {/* Summary Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-surface-inner border border-border-soft">
            <p className="text-muted mb-1 text-xs font-medium uppercase tracking-wider">Receitas — {periodLabel}</p>
            <strong className="text-success text-2xl">{formatCurrency(totalIncome)}</strong>
          </div>
          <div className="p-4 rounded-xl bg-surface-inner border border-border-soft">
            <p className="text-muted mb-1 text-xs font-medium uppercase tracking-wider">Despesas — {periodLabel}</p>
            <strong className="text-danger text-2xl">{formatCurrency(totalExpense)}</strong>
          </div>
          <div className="p-4 rounded-xl bg-surface-inner border border-border-soft">
            <p className="text-muted mb-1 text-xs font-medium uppercase tracking-wider">Saldo — {periodLabel}</p>
            <strong className={`text-2xl ${totalIncome - totalExpense >= 0 ? "text-success" : "text-danger"}`}>
              {formatCurrency(totalIncome - totalExpense)}
            </strong>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className={cardClass + " mb-6"}>
        <div className="mb-6">
          <h2 className="text-h">Gastos por Categoria</h2>
          <p className="text-muted text-sm">
            {filterMonth ? `Relatório mensal: ${periodLabel}` : `Relatório anual: ${filterYear}`}
          </p>
        </div>

        {categoryTotals.length === 0 ? (
          <div className="text-muted p-10 text-center bg-surface-inner rounded-xl border border-dashed border-border">Não há despesas registradas</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            {categoryTotals.map((cat) => {
              const pct = totalExpense > 0 ? (cat.value / totalExpense) * 100 : 0;
              return (
                <div key={cat.name} className="p-2 px-3 rounded-xl hover:bg-surface-inner border border-transparent hover:border-border-soft transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                       <span
                        className="inline-block"
                        style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          backgroundColor: cat.color,
                          flexShrink: 0,
                          boxShadow: '0 0 0 2px var(--color-bg), 0 0 0 3px var(--color-border-soft)'
                        }}
                      />
                      <span className="text-sm font-semibold text-primary">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted bg-surface-inner px-2 py-0.5 rounded-md border border-border-soft">{pct.toFixed(0)}%</span>
                      <span className="text-sm font-bold text-primary">{formatCurrency(cat.value)}</span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="progress-bar-container" style={{ height: '0.4rem' }}>
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${pct}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transactions Table Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-h m-0">Movimentações — {periodLabel}</h2>
          <div className="flex items-center gap-3">
            {tx.selectedIds.length > 0 && (
              <div className="text-sm text-muted flex items-center gap-1 font-medium">
                <span>{tx.selectedIds.length}</span>
                <span className="opacity-40">/</span>
                <span>{overviewTableData.length}</span>
              </div>
            )}
            <button
              onClick={async () => {
                if (!tx.selectedIds.length) return;
                if (
                  tx.selectedIds.length === overviewTableData.length &&
                  overviewTableData.length > 0
                ) {
                  tx.setShowDeleteAllModal(true);
                  return;
                }
                await Promise.all(
                  tx.selectedIds.map((id) => tx.deleteTransaction(id)),
                );
                tx.setSelectedIds([]);
                tx.fetchData();
              }}
              className={`btn btn-danger btn-icon ${tx.selectedIds.length === 0 ? "opacity-40" : ""}`}
              title="Excluir selecionados"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M9 3v1H4v2h16V4h-5V3H9zM6 7v12a2 2 0 002 2h8a2 2 0 002-2V7H6z" />
              </svg>
            </button>
            <span className="text-sm font-medium text-muted bg-surface-inner px-3 py-1 rounded-full border border-border-soft">{overviewTableData.length} transações</span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <input
            type="text"
            placeholder="Buscar por descrição..."
            value={overviewSearch}
            onChange={(e) => setOverviewSearch(e.target.value)}
            className="input-base flex-1"
            style={{ minWidth: '200px' }}
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
              title="Limpar filtros"
            >
              ✕
            </button>
          )}
        </div>

        <TransactionsTable
          tableData={overviewTableData}
          selectedIds={tx.selectedIds}
          setSelectedIds={tx.setSelectedIds}
          setSelected={tx.setSelected}
          dark={tx.dark}
          categories={tx.categoriesMap}
        />
      </div>

      {tx.selected && (
        <TransactionModal
          selected={tx.selected}
          updateSelected={tx.updateSelected}
          setSelected={tx.setSelected}
          dark={tx.dark}
          fetchData={tx.fetchData}
          setModalEditing={tx.setModalEditing}
          updateTransaction={tx.updateTransaction}
          deleteTransaction={tx.deleteTransaction}
          categories={tx.categories}
        />
      )}

      {tx.showDeleteAllModal && (
        <Modal
          show={tx.showDeleteAllModal}
          type="confirm"
          danger={true}
          title="Confirmar exclusão"
          message="Você tem certeza que deseja excluir todas as transações visíveis? Esta ação não pode ser desfeita."
          onCancel={() => tx.setShowDeleteAllModal(false)}
          onConfirm={async () => {
            await Promise.all(overviewTableData.map((t) => tx.deleteTransaction(t.id)));
            tx.setShowDeleteAllModal(false);
            tx.setSelectedIds([]);
            tx.fetchData();
          }}
          confirmLabel="Excluir tudo"
        />
      )}
    </>
  );
}

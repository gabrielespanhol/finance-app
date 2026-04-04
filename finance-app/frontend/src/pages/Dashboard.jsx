import React, { useMemo, useState } from "react";
import TransactionsTable from "../components/TransactionsTable";
import TransactionModal from "../components/TransactionModal";
import Modal from "../components/Modal";
import Charts from "../components/Charts";
import useTransactions from "../hooks/useTransactions";
import { formatCurrency } from "../utils/format";

export default function Dashboard({ dark, setDark }) {
  const tx = useTransactions({ dark, setDark });
  const [searchQuery, setSearchQuery] = useState("");

  const handlePrevMonth = () => {
    if (!tx.month) return;
    const [y, m] = tx.month.split("-");
    const prev = new Date(parseInt(y), parseInt(m) - 2, 1);
    tx.setMonth(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`);
  };

  const handleNextMonth = () => {
    if (!tx.month) return;
    const [y, m] = tx.month.split("-");
    const next = new Date(parseInt(y), parseInt(m), 1);
    tx.setMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`);
  };

  return (
    <>
      {/* FILTER + MONTH */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="btn btn-secondary btn-icon"
            title="Mês anterior"
          >
            ←
          </button>
          <input
            type="month"
            value={tx.month}
            onChange={(e) => tx.setMonth(e.target.value)}
            className="input-base"
          />
          <button
            onClick={handleNextMonth}
            className="btn btn-secondary btn-icon"
            title="Próximo mês"
          >
            →
          </button>
        </div>
        <div className="text-muted font-medium">
          Período: <span className="text-primary-text">{tx.month}</span>
        </div>
      </div>

      {/* SUMMARY CARDS (kept simple, reused existing values) */}
      <div className="card mb-6">
        <h2 className="text-h">Balanço Mensal</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-surface-inner border border-border-soft">
            <p className="text-muted mb-1 text-xs font-medium uppercase tracking-wider">Receitas</p>
            <strong className="text-success text-2xl">
              {tx.filtered.length === 0
                ? "R$0,00"
                : formatCurrency(tx.totalIncome)}
            </strong>
          </div>
          <div className="p-4 rounded-xl bg-surface-inner border border-border-soft">
            <p className="text-muted mb-1 text-xs font-medium uppercase tracking-wider">Despesas</p>
            <strong className="text-danger text-2xl">
              {tx.filtered.length === 0
                ? "R$0,00"
                : formatCurrency(tx.totalExpense)}
            </strong>
          </div>
          <div className="p-4 rounded-xl bg-surface-inner border border-border-soft">
            <p className="text-muted mb-1 text-xs font-medium uppercase tracking-wider">Saldo</p>
            <strong
              className={`text-2xl ${tx.balance >= 0 ? "text-success" : "text-danger"}`}
            >
              {tx.filtered.length === 0 ? "R$0,00" : formatCurrency(tx.balance)}
            </strong>
          </div>
        </div>
      </div>

      {/* FORM + UPLOAD (kept inline to avoid moving many props) */}
      <div className="card mb-6">
        <h2 className="text-h">Adicionar Transação</h2>
        <form
          onSubmit={tx.handleSubmit}
          className="flex flex-wrap gap-3 mb-4 items-center"
        >
          <input
            type="date"
            className="input-base"
            value={tx.form.date}
            onChange={(e) => tx.setForm({ ...tx.form, date: e.target.value })}
          />
          <input
            type="text"
            placeholder="Valor"
            className="input-base w-32"
            value={
              tx.amountInput ||
              (tx.form.amount ? formatCurrency(tx.form.amount) : "")
            }
            onChange={(e) => {
              const v = e.target.value;
              tx.setAmountInput(v);
              const num = tx.parseCurrencyInput(v);
              tx.setForm({ ...tx.form, amount: num });
            }}
            onBlur={() => {
              if (tx.form.amount || tx.form.amount === 0)
                tx.setAmountInput(formatCurrency(tx.form.amount));
            }}
          />
          <select
            className="input-base"
            value={tx.form.type}
            onChange={(e) => {
              const v = e.target.value;
              tx.setForm({
                ...tx.form,
                type: v,
                category: v === "income" ? "" : tx.form.category,
              });
            }}
          >
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
          </select>
          <select
            disabled={tx.form.type === "income"}
            className={`input-base ${tx.form.type === "income" ? "opacity-60 cursor-not-allowed" : ""}`}
            value={tx.form.category}
            onChange={(e) =>
              tx.setForm({ ...tx.form, category: e.target.value })
            }
          >
            <option value="">Categoria</option>
            {(tx.categories || []).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            placeholder="Descrição"
            className="input-base flex-1 min-w-[160px]"
            value={tx.form.description}
            onChange={(e) =>
              tx.setForm({ ...tx.form, description: e.target.value })
            }
          />
          <button
            disabled={!tx.isFormValid}
            className={`btn btn-primary ${!tx.isFormValid ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Adicionar
          </button>
        </form>

        <div className="pt-4 border-t border-border-soft">
          <label
            className="btn btn-secondary shadow-sm cursor-pointer inline-flex items-center gap-2"
            style={{ width: 'fit-content' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="flex-shrink-0"
              style={{ display: 'block' }}
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" x2="12" y1="3" y2="15" />
            </svg>
            <span className="font-semibold">Enviar Extrato</span>
            <input type="file" onChange={tx.handleUpload} className="hidden" />
          </label>
          {tx.uploadFeedback && (
            <div className="mt-2 text-sm text-muted">
              {tx.uploadFeedback}
            </div>
          )}
        </div>
      </div>

      {/* CHARTS */}
      <div className="card mb-6">
        <h2 className="text-h mb-4">Gastos por Categoria</h2>
        <Charts
          chartData={tx.chartData}
          balancePieData={tx.balancePieData}
          categories={tx.categoriesMap}
        />
      </div>

      {/* Transactions table + controls */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h m-0">Extrato do Mês</h2>
          <div className="flex items-center gap-3">
            {tx.selectedIds.length > 0 && (
              <div className="text-sm text-muted flex items-center gap-1 font-medium">
                <span>{tx.selectedIds.length}</span>
                <span className="opacity-40">/</span>
                <span>{tx.tableData.length}</span>
              </div>
            )}
            <button
              onClick={async () => {
                if (!tx.selectedIds.length) return;
                if (
                  tx.selectedIds.length === tx.tableData.length &&
                  tx.tableData.length > 0
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
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Search filter */}
        <input
          type="text"
          placeholder="Buscar por descrição..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-base flex-1"
          style={{ minWidth: '180px' }}
        />
        <select
          value={tx.tableFilters.category}
          onChange={(e) =>
            tx.setTableFilters((s) => ({ ...s, category: e.target.value }))
          }
          className="input-base"
        >
          <option value="">Todas as categorias</option>
          {(tx.categories || []).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={tx.tableFilters.type}
          onChange={(e) =>
            tx.setTableFilters((s) => ({ ...s, type: e.target.value }))
          }
          className="input-base"
        >
          <option value="">Tipo (todos)</option>
          <option value="expense">Despesa</option>
          <option value="income">Receita</option>
        </select>
        <button
          onClick={() => tx.setTableFilters({ category: "", type: "" })}
          className="btn btn-secondary btn-icon"
        >
          Limpar
        </button>
      </div>

      <TransactionsTable
        tableData={useMemo(
          () => tx.tableData.filter((t) =>
            !searchQuery || (t.description || "").toLowerCase().includes(searchQuery.toLowerCase())
          ),
          [tx.tableData, searchQuery]
        )}
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

      {tx.showDuplicateModal && (
        <Modal
          show={tx.showDuplicateModal}
          type="confirm"
          title="Transação duplicada"
          message="Transação duplicada detectada. Adicionar mesmo assim?"
          onCancel={() => {
            tx.setShowDuplicateModal(false);
            tx.setDuplicateCandidate(null);
          }}
          onConfirm={tx.confirmAddAnyway}
          confirmLabel="Adicionar mesmo assim"
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
          onConfirm={tx.confirmDeleteAll}
          confirmLabel="Excluir tudo"
        />
      )}
    </>
  );
}

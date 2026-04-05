import React, { useEffect } from "react";
import { createPortal } from "react-dom";

export default function TransactionModal({
  selected,
  updateSelected,
  setSelected,
  dark,
  fetchData,
  setModalEditing,
  updateTransaction,
  deleteTransaction,
  categories,
}) {
  useEffect(() => {
    // Lock scrolling on open
    document.body.classList.add("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, []);

  const availableCategories = categories || [];
  const optionsList =
    selected?.category &&
    selected.category !== "" &&
    !availableCategories.includes(selected.category)
      ? [selected.category, ...availableCategories]
      : availableCategories;

  const modalElement = (
    <div className="modal-overlay" onClick={() => setSelected(null)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          aria-label="Fechar"
          className="modal-close"
          onClick={() => setSelected(null)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <h2 className="text-xl font-bold mb-6">Detalhes</h2>

        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Descrição</label>
            <input
              placeholder="Ex: Aluguel, Supermercado..."
              className="input-base w-full"
              value={selected.description || ""}
              onChange={(e) => updateSelected({ description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Valor (R$)</label>
              <input
                type="number"
                placeholder="0,00"
                className="input-base w-full"
                value={selected.amount || ""}
                onChange={(e) => updateSelected({ amount: Number(e.target.value) })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Data</label>
              <input
                type="date"
                className="input-base w-full"
                value={selected.date || ""}
                onChange={(e) => updateSelected({ date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Tipo</label>
              <select
                className="input-base w-full"
                value={selected.type || "expense"}
                onChange={(e) => {
                  const v = e.target.value;
                  updateSelected({
                    type: v,
                    category: v === "income" ? "" : selected.category,
                  });
                }}
              >
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Categoria</label>
              <select
                className="input-base w-full"
                disabled={selected.type === "income"}
                value={selected.category || ""}
                onChange={(e) => updateSelected({ category: e.target.value })}
              >
                <option value="">Selecione categoria</option>
                {optionsList.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Pessoa Responsável</label>
            <input
              placeholder="Nome da pessoa"
              className="input-base w-full"
              value={selected.person || ""}
              onChange={(e) => updateSelected({ person: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            className="btn btn-danger px-6"
            onClick={async () => {
              await deleteTransaction(selected.id);
              setModalEditing(false);
              setSelected(null);
              fetchData();
            }}
          >
            Excluir
          </button>
          <button
            className="btn btn-primary px-8"
            onClick={async () => {
              await updateTransaction(selected.id, selected);
              setModalEditing(false);
              setSelected(null);
              fetchData();
            }}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalElement, document.body);
}

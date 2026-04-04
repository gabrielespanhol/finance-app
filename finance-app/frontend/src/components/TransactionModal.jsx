import React from "react";

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
  const availableCategories = categories || [];
  const optionsList =
    selected?.category &&
    selected.category !== "" &&
    !availableCategories.includes(selected.category)
      ? [selected.category, ...availableCategories]
      : availableCategories;
  return (
    <div
      className="modal-overlay"
      onClick={() => setSelected(null)}
    >
      <div
        className="modal-content"
        style={{ maxWidth: '28rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          aria-label="Fechar"
          className="absolute top-4 right-4 text-muted transition-colors font-medium border-0 bg-transparent"
          onClick={() => setSelected(null)}
        >
          ✕
        </button>
        <h2 className="text-lg font-semibold mb-3">Detalhes</h2>

        <div className="flex flex-col gap-2 mb-4">
          <input
            placeholder="Descrição"
            className="input-base w-full"
            value={selected.description || ""}
            onChange={(e) => updateSelected({ description: e.target.value })}
          />
          <input
            type="number"
            placeholder="Valor"
            className="input-base w-full"
            value={selected.amount || ""}
            onChange={(e) => updateSelected({ amount: Number(e.target.value) })}
          />
          <input
            type="date"
            className="input-base w-full"
            value={selected.date || ""}
            onChange={(e) => updateSelected({ date: e.target.value })}
          />
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
          <select
            className="input-base w-full"
            disabled={selected.type === "income"}
            value={selected.category || ""}
            onChange={(e) => updateSelected({ category: e.target.value })}
          >
            <option value="">Selecione uma categoria</option>
            {optionsList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            placeholder="Pessoa"
            className="input-base w-full"
            value={selected.person || ""}
            onChange={(e) => updateSelected({ person: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            className="btn btn-primary"
            onClick={async () => {
              await updateTransaction(selected.id, selected);
              setModalEditing(false);
              setSelected(null);
              fetchData();
            }}
          >
            Salvar
          </button>
          <button
            className="btn btn-danger"
            onClick={async () => {
              await deleteTransaction(selected.id);
              setModalEditing(false);
              setSelected(null);
              fetchData();
            }}
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

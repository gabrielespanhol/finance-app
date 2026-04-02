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
}) {
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4"
      onClick={() => {
        if (!false) setSelected(null);
      }}
    >
      <div
        className={`${dark ? "bg-[#1E2329] border-[#2B3139] text-[#EAECEF]" : "bg-white text-gray-900"} p-4 rounded-2xl w-full max-w-md border shadow-lg relative`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          aria-label="Close"
          className="absolute top-3 right-3 text-sm text-[#9CA3AF] hover:text-white"
          onClick={() => setSelected(null)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 8.586l4.95-4.95a1 1 0 011.414 1.414L11.414 10l4.95 4.95a1 1 0 01-1.414 1.414L10 11.414l-4.95 4.95a1 1 0 01-1.414-1.414L8.586 10l-4.95-4.95A1 1 0 015.05 3.636L10 8.586z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <h2 className="font-semibold mb-3">Detalhes</h2>

        <input
          placeholder="Descrição"
          className={`${dark ? "bg-[#151719] border-[#2B3139] text-[#EAECEF]" : "bg-white border-gray-200 text-gray-900"} p-2 w-full mb-2 rounded-xl`}
          value={selected.description || ""}
          onChange={(e) => updateSelected({ description: e.target.value })}
        />
        <input
          type="number"
          placeholder="Valor"
          className={`${dark ? "bg-[#151719] border-[#2B3139] text-[#EAECEF]" : "bg-white border-gray-200 text-gray-900"} p-2 w-full mb-2 rounded-xl`}
          value={selected.amount || ""}
          onChange={(e) => updateSelected({ amount: Number(e.target.value) })}
        />
        <input
          type="date"
          className={`${dark ? "bg-[#151719] border-[#2B3139] text-[#EAECEF]" : "bg-white border-gray-200 text-gray-900"} p-2 w-full mb-2 rounded-xl`}
          value={selected.date || ""}
          onChange={(e) => updateSelected({ date: e.target.value })}
        />
        <select
          className={`${dark ? "bg-[#151719] border-[#2B3139] text-[#EAECEF]" : "bg-white border-gray-200 text-gray-900"} p-2 w-full mb-2 rounded-xl`}
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
          className={`${dark ? "bg-[#151719] border-[#2B3139] text-[#EAECEF]" : "bg-white border-gray-200 text-gray-900"} p-2 w-full mb-2 rounded-xl`}
          disabled={selected.type === "income"}
          value={selected.category || ""}
          onChange={(e) => updateSelected({ category: e.target.value })}
        >
          <option value="">Selecione uma categoria</option>
          {/* Options rendered by parent or category util */}
        </select>
        <input
          placeholder="Pessoa"
          className={`${dark ? "bg-[#151719] border-[#2B3139] text-[#EAECEF]" : "bg-white border-gray-200 text-gray-900"} p-2 w-full mb-3 rounded-xl`}
          value={selected.person || ""}
          onChange={(e) => updateSelected({ person: e.target.value })}
        />

        <div className="flex justify-end gap-2">
          <button
            className="bg-[#FCD535] text-black px-3 py-1 rounded-2xl"
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
            className="bg-red-500 text-white px-3 py-1 rounded-2xl"
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

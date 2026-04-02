import React from "react";
import useCategories from "../hooks/useCategories";

export default function CategoriesPage({ dark, setDark }) {
  const cat = useCategories({ dark, setDark });

  // Separate add and edit slightly to avoid confusion on the UI overlay
  const isEditing = cat.editingId !== null;

  return (
    <>
      <h2 className="font-semibold mb-6 text-xl">Gerenciar Categorias</h2>
      
      {/* ADD NEW CATEGORY FORM */}
      <div className={`${cat.dark ? "bg-[#1E2329] border-[#2B3139]" : "bg-white border-gray-100"} p-4 rounded-2xl border mb-6`}>
        <h2 className="font-semibold mb-3">Nova Categoria</h2>
        <form 
          onSubmit={(e) => {
            if (isEditing) {
               // Protect against submitting 'add' while editing
               e.preventDefault();
               return;
            }
            cat.handleSubmit(e);
          }} 
          className="flex flex-wrap gap-3 items-center"
        >
          <input
            type="text"
            placeholder="Nome da categoria"
            className={`${cat.dark ? "bg-[#151719] border-[#2B3139] text-[#EAECEF]" : "bg-white border-gray-200"} p-2 rounded-xl flex-1`}
            value={!isEditing ? cat.form.name : ""}
            onChange={(e) => !isEditing && cat.setForm({ ...cat.form, name: e.target.value })}
            disabled={isEditing}
          />
          <input
            type="color"
            className={`${cat.dark ? "bg-[#151719] border-[#2B3139]" : "bg-white border-gray-200"} p-1 rounded-xl h-10 w-16 cursor-pointer`}
            value={!isEditing ? cat.form.color : "#888888"}
            onChange={(e) => !isEditing && cat.setForm({ ...cat.form, color: e.target.value })}
            disabled={isEditing}
          />
          <button
            disabled={!cat.form.name || !cat.form.color || isEditing}
            className={`bg-[#FCD535] text-black px-4 py-2 rounded-2xl shadow-sm ${(!cat.form.name || !cat.form.color || isEditing) ? "opacity-60 cursor-not-allowed" : ""}`}
            type="submit"
          >
            Adicionar
          </button>
        </form>
      </div>

      <div className={`${cat.dark ? "bg-[#1E2329] border-[#2B3139]" : "bg-white border-gray-100"} rounded-2xl border overflow-hidden`}>
        <table className="w-full text-left">
          <thead className={`text-sm ${cat.dark ? "bg-[#151719] text-[#9CA3AF]" : "bg-gray-50 text-gray-500"} border-b ${cat.dark ? "border-[#2B3139]" : "border-gray-100"}`}>
            <tr>
              <th className="p-4 w-16">Cor</th>
              <th className="p-4">Nome</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {(cat.categories || []).map((c) => (
              <tr key={c.id || c.name} className={`border-b last:border-0 ${cat.dark ? "border-[#2B3139]" : "border-gray-100"}`}>
                <td className="p-4">
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: c.color }}></div>
                </td>
                <td className="p-4 font-medium">{c.name}</td>
                <td className="p-4 text-right">
                  <button onClick={() => cat.handleEdit(c)} className="text-[#FCD535] hover:underline mr-4 text-sm font-medium">Editar</button>
                  <button onClick={() => cat.handleDelete(c.id || c.name)} className="text-red-500 hover:underline text-sm font-medium">Excluir</button>
                </td>
              </tr>
            ))}
            {cat.categories.length === 0 && (
              <tr>
                <td colSpan="3" className="p-4 text-center text-[#9CA3AF]">Nenhuma categoria.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL */}
      {isEditing && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={cat.cancelEdit}
        >
          <div
            className={`${
              cat.dark ? "bg-[#1E2329] border-[#2B3139] text-[#EAECEF]" : "bg-white text-gray-900"
            } p-4 rounded-2xl w-full max-w-sm border shadow-lg relative`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="Close"
              className="absolute top-3 right-3 text-sm text-[#9CA3AF] hover:text-white"
              onClick={cat.cancelEdit}
            >
              ✕
            </button>
            <h2 className="font-semibold mb-4">Editar Categoria</h2>
            
            <form onSubmit={cat.handleSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Nome da categoria"
                className={`${cat.dark ? "bg-[#151719] border-[#2B3139] text-[#EAECEF]" : "bg-white border-gray-200"} p-2 rounded-xl w-full`}
                value={cat.form.name}
                onChange={(e) => cat.setForm({ ...cat.form, name: e.target.value })}
              />
              <div className="flex items-center gap-3 mb-2">
                <label className="text-sm">Cor:</label>
                <input
                  type="color"
                  className={`${cat.dark ? "bg-[#151719] border-[#2B3139]" : "bg-white border-gray-200"} p-1 rounded-xl h-10 w-16 cursor-pointer`}
                  value={cat.form.color}
                  onChange={(e) => cat.setForm({ ...cat.form, color: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={cat.cancelEdit}
                  className={`px-4 py-2 rounded-2xl ${cat.dark ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-800"}`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!cat.isFormValid}
                  className={`bg-[#FCD535] text-black px-4 py-2 rounded-2xl shadow-sm ${!cat.isFormValid ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

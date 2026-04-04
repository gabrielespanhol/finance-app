import React from "react";
import useCategories from "../hooks/useCategories";
import Modal from "../components/Modal";

export default function CategoriesPage({ dark, setDark }) {
  const cat = useCategories({ dark, setDark });

  // Separate add and edit slightly to avoid confusion on the UI overlay
  const isEditing = cat.editingId !== null;

  return (
    <>
      <Modal {...cat.modal.modalState} dark={cat.dark} />
      <h1 className="text-2xl font-semibold mb-6">Gerenciar Categorias</h1>
      
      {/* ADD NEW CATEGORY FORM */}
      <div className="card mb-6">
        <h2 className="text-h">Nova Categoria</h2>
        <form 
          onSubmit={(e) => {
            if (isEditing) {
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
            className="input-base flex-1"
            value={!isEditing ? cat.form.name : ""}
            onChange={(e) => !isEditing && cat.setForm({ ...cat.form, name: e.target.value })}
            disabled={isEditing}
          />
          <input
            type="color"
            className="input-color"
            value={!isEditing ? cat.form.color : "#888888"}
            onChange={(e) => !isEditing && cat.setForm({ ...cat.form, color: e.target.value })}
            disabled={isEditing}
          />
          <button
            disabled={!cat.form.name || !cat.form.color || isEditing}
            className={`btn btn-primary ${(!cat.form.name || !cat.form.color || isEditing) ? "opacity-60" : ""}`}
            type="submit"
          >
            Adicionar
          </button>
        </form>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {(cat.categories || []).map((c) => (
              <tr key={c.id || c.name}>
                <td className="font-medium">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block"
                      style={{ 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        backgroundColor: c.color || '#888888',
                        flexShrink: 0
                      }}
                    />
                    <span>{c.name}</span>
                  </div>
                </td>
                <td className="text-right">
                  <button onClick={() => cat.handleEdit(c)} className="btn-inline mr-4" style={{ color: 'var(--color-primary)', border: 'none', background: 'none', cursor: 'pointer' }}>Editar</button>
                  <button onClick={() => cat.handleDelete(c.id || c.name)} className="btn-inline" style={{ color: 'var(--color-danger)', border: 'none', background: 'none', cursor: 'pointer' }}>Excluir</button>
                </td>
              </tr>
            ))}
            {cat.categories.length === 0 && (
              <tr>
                <td colSpan="3" className="p-4 text-center text-muted">Nenhuma categoria.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL */}
      {isEditing && (
        <div className="modal-overlay" onClick={cat.cancelEdit}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              aria-label="Close"
              className="absolute top-4 right-4 text-muted transition-colors"
              onClick={cat.cancelEdit}
            >
              ✕
            </button>
            <h2 className="text-lg font-semibold mb-4">Editar Categoria</h2>
            
            <form onSubmit={cat.handleSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Nome da categoria"
                className="input-base w-full"
                value={cat.form.name}
                onChange={(e) => cat.setForm({ ...cat.form, name: e.target.value })}
              />
              <div className="flex items-center gap-3 mb-2">
                <label className="text-sm">Cor:</label>
                <input
                  type="color"
                  className="input-color"
                  value={cat.form.color}
                  onChange={(e) => cat.setForm({ ...cat.form, color: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={cat.cancelEdit}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!cat.isFormValid}
                  className="btn btn-primary"
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

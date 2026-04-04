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
      
      {/* ADD NEW CATEGORY FORM */}
      <div className="card mb-6">
        <h2 className="text-h">Gerenciar Categorias</h2>
        <div className="mb-6 bg-surface-inner p-4 border border-border-soft rounded-xl">
          <p className="text-muted text-sm mb-3 font-medium uppercase tracking-wider">Nova Categoria</p>
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
                <th style={{ textAlign: 'left' }}>Nome</th>
                <th className="text-center" style={{ textAlign: 'center', width: '200px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {(cat.categories || []).map((c) => (
                <tr key={c.id || c.name} className="hover:bg-surface-inner transition-colors">
                  <td className="font-semibold" style={{ verticalAlign: 'middle' }}>
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-block"
                        style={{ 
                          width: '12px', 
                          height: '12px', 
                          borderRadius: '50%', 
                          backgroundColor: c.color || '#888888',
                          flexShrink: 0,
                          boxShadow: '0 0 0 2px var(--color-bg), 0 0 0 3px var(--color-border-soft)'
                        }}
                      />
                      <span className="text-sm">{c.name}</span>
                    </div>
                  </td>
                  <td className="text-center" style={{ verticalAlign: 'middle' }}>
                    <div className="flex items-center justify-center gap-2">
                       <button onClick={() => cat.handleEdit(c)} className="btn btn-secondary py-1.5 px-3 text-xs font-semibold">Editar</button>
                       <button onClick={() => cat.handleDelete(c.id || c.name)} className="btn btn-danger py-1.5 px-3 text-xs font-semibold">Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
              {cat.categories.length === 0 && (
                <tr>
                  <td colSpan="2" className="p-16 text-center text-muted">
                    <p className="font-medium">Nenhuma categoria cadastrada</p>
                    <p className="text-xs opacity-60">Use o formulário acima para começar</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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

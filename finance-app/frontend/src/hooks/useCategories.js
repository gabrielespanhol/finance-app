import { useState, useEffect } from "react";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../services/api";

export default function useCategories(external = {}) {
  const { dark: externalDark, setDark: externalSetDark } = external || {};
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: "", color: "#888888" });
  const [editingId, setEditingId] = useState(null);
  
  const darkInternal = true;
  const dark = externalDark !== undefined ? externalDark : darkInternal;

  const fetchData = async () => {
    try {
      const data = await getCategories();
      setCategories(data || []);
    } catch (e) {
      console.error("Failed to fetch categories", e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.color) return;

    try {
      if (editingId) {
        await updateCategory(editingId, form);
      } else {
        await createCategory(form);
      }
      setForm({ name: "", color: "#888888" });
      setEditingId(null);
      fetchData();
    } catch (err) {
      console.error("Error saving category", err);
      alert(err.response?.data?.error || "Erro ao salvar categoria");
    }
  };

  const handleEdit = (cat) => {
    setForm({ name: cat.name, color: cat.color });
    setEditingId(cat.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deseja realmente excluir esta categoria?")) return;
    try {
      await deleteCategory(id);
      if (editingId === id) {
        setEditingId(null);
        setForm({ name: "", color: "#888888" });
      }
      fetchData();
    } catch (err) {
      console.error("Error deleting category", err);
      alert(err.response?.data?.error || "Erro ao excluir categoria");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: "", color: "#888888" });
  };

  const isFormValid = form.name && form.color;

  return {
    categories,
    form,
    setForm,
    editingId,
    handleSubmit,
    handleEdit,
    handleDelete,
    cancelEdit,
    isFormValid,
    dark
  };
}

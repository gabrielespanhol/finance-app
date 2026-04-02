import { useEffect, useState } from "react";
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  uploadFile,
  getCategories,
} from "../services/api";
import { parseCurrencyInput } from "../utils/format";
import { categories } from "../utils/categories";

// Hook encapsulating transactions state and logic
export default function useTransactions(external = {}) {
  const { dark: externalDark, setDark: externalSetDark } = external || {};
  const [transactions, setTransactions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [duplicateCandidate, setDuplicateCandidate] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [tableFilters, setTableFilters] = useState({ category: "", type: "" });
  const [darkInternal, setDarkInternal] = useState(true);
  const dark = externalDark !== undefined ? externalDark : darkInternal;
  const setDark =
    externalSetDark !== undefined ? externalSetDark : setDarkInternal;
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    date: today,
    amount: "",
    type: "expense",
    category: "",
    description: "",
  });
  const [amountInput, setAmountInput] = useState("");
  const [uploadFeedback, setUploadFeedback] = useState(null);
  const [modalEditing, setModalEditing] = useState(false);
  const [categoriesState, setCategoriesState] = useState([]);

  const fetchData = async () => {
    const data = await getTransactions();
    setTransactions(data);
    // also refresh categories so UI stays in sync after changes
    try {
      const cats = await getCategories();
      // cats expected as [{name, color}]
      setCategoriesState(cats.map((c) => c.name));
    } catch (e) {
      // ignore, keep previous
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.date || form.amount === null || form.amount === "" || !form.type)
      return;
    const payload = {
      ...form,
      category: form.type === "income" ? "Outros" : form.category,
    };
    const isDup = transactions.some(
      (t) =>
        t.date === payload.date &&
        Number(t.amount) === Number(payload.amount) &&
        (t.category || "") === (payload.category || ""),
    );
    if (isDup) {
      setDuplicateCandidate(payload);
      setShowDuplicateModal(true);
      return;
    }
    await createTransaction(payload);
    setForm({
      date: today,
      amount: "",
      type: "expense",
      category: "",
      description: "",
    });
    setAmountInput("");
    fetchData();
  };

  const confirmAddAnyway = async () => {
    if (!duplicateCandidate) return;
    await createTransaction(duplicateCandidate);
    setDuplicateCandidate(null);
    setShowDuplicateModal(false);
    setForm({
      date: today,
      amount: "",
      type: "expense",
      category: "",
      description: "",
    });
    setAmountInput("");
    fetchData();
  };

  useEffect(() => {
    setModalEditing(false);
  }, [selected]);

  const updateSelected = (changes) => {
    setSelected((s) => ({ ...(s || {}), ...changes }));
    setModalEditing(true);
  };

  const confirmDeleteAll = async () => {
    const ids = tableData.map((t) => t.id);
    if (!ids.length) {
      setShowDeleteAllModal(false);
      return;
    }
    await Promise.all(ids.map((id) => deleteTransaction(id)));
    setShowDeleteAllModal(false);
    setSelectedIds([]);
    fetchData();
  };

  // monthly filter
  const filtered = transactions.filter((t) => t.date?.startsWith(month));

  const tableData = filtered
    .filter((t) => {
      if (
        tableFilters.category &&
        tableFilters.category !== "" &&
        t.category !== tableFilters.category
      )
        return false;
      if (
        tableFilters.type &&
        tableFilters.type !== "" &&
        t.type !== tableFilters.type
      )
        return false;
      return true;
    })
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const totalIncome = filtered
    .filter((t) => t.type === "income")
    .reduce((a, t) => a + Number(t.amount), 0);
  const totalExpense = filtered
    .filter((t) => t.type === "expense")
    .reduce((a, t) => a + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

  const isFormValid =
    form.date &&
    form.amount !== null &&
    form.amount !== "" &&
    form.type &&
    (form.type === "income" || (form.category && form.category !== ""));

  const chartData = Object.keys(categories).map((cat) => ({
    name: cat,
    value: filtered
      .filter((t) => t.category === cat && t.type === "expense")
      .reduce((a, t) => a + Number(t.amount), 0),
  }));
  const globalData = Object.keys(categories).map((cat) => ({
    name: cat,
    value: transactions
      .filter((t) => t.category === cat && t.type === "expense")
      .reduce((a, t) => a + Number(t.amount), 0),
  }));
  const balancePieData = [
    { name: "Receitas", value: totalIncome },
    { name: "Despesas", value: totalExpense },
  ];
  const chartHasData = chartData.reduce
    ? chartData.reduce((s, c) => s + c.value, 0) > 0
    : false;

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const data = await uploadFile(formData);
      setUploadFeedback(
        `Imported: ${data.imported || 0}, Skipped: ${data.skipped || 0}`,
      );
      fetchData();
    } catch (err) {
      setUploadFeedback("Upload failed");
    }
  };

  return {
    transactions,
    selected,
    setSelected,
    selectedIds,
    setSelectedIds,
    duplicateCandidate,
    showDuplicateModal,
    setShowDuplicateModal,
    showDeleteAllModal,
    setShowDeleteAllModal,
    tableFilters,
    setTableFilters,
    dark,
    setDark,
    month,
    setMonth,
    form,
    setForm,
    amountInput,
    setAmountInput,
    uploadFeedback,
    // names fetched from backend
    categories: categoriesState,
    setUploadFeedback,
    modalEditing,
    setModalEditing,
    fetchData,
    handleSubmit,
    confirmAddAnyway,
    updateSelected,
    confirmDeleteAll,
    filtered,
    tableData,
    totalIncome,
    totalExpense,
    balance,
    isFormValid,
    chartData,
    globalData,
    balancePieData,
    chartHasData,
    handleUpload,
    parseCurrencyInput,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
}

import { useEffect, useState } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

const categories = {
  Alimentação: "#22c55e",
  Moradia: "#3b82f6",
  Transporte: "#f59e0b",
  Lazer: "#a855f7",
  Investimentos: "#10b981",
  Saúde: "#ef4444",
  Outros: "#6b7280",
};

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [duplicateCandidate, setDuplicateCandidate] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [tableFilters, setTableFilters] = useState({
    category: "",
    type: "",
  });
  const [dark, setDark] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [tab, setTab] = useState("dashboard");

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

  const fetchData = async () => {
    const res = await axios.get("http://localhost:3001/transactions");
    setTransactions(res.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // prevent invalid
    if (!form.date || form.amount === null || form.amount === "" || !form.type)
      return;
    // backend requires a category on POST; for incomes use a default category
    const payload = {
      ...form,
      category: form.type === "income" ? "Outros" : form.category,
    };
    // duplicate detection (date, amount, category)
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
    await axios.post("http://localhost:3001/transactions", payload);
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
    await axios.post("http://localhost:3001/transactions", duplicateCandidate);
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

  const confirmDeleteAll = async () => {
    // delete all rows currently shown in tableData
    const ids = tableData.map((t) => t.id);
    if (!ids.length) {
      setShowDeleteAllModal(false);
      return;
    }
    await Promise.all(
      ids.map((id) => axios.delete(`http://localhost:3001/transactions/${id}`)),
    );
    setShowDeleteAllModal(false);
    setSelectedIds([]);
    fetchData();
  };

  // filtro mensal
  const filtered = transactions.filter((t) => t.date?.startsWith(month));

  // table-level filtering and sorting (newest first)
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

  // cálculos
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
    // category only required for expenses
    (form.type === "income" || (form.category && form.category !== ""));

  // gráfico mensal
  // category charts: only consider expenses
  const chartData = Object.keys(categories).map((cat) => ({
    name: cat,
    value: filtered
      .filter((t) => t.category === cat && t.type === "expense")
      .reduce((a, t) => a + Number(t.amount), 0),
  }));

  // gráfico geral
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

  const chartHasData = chartData.reduce((s, c) => s + c.value, 0) > 0;

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://localhost:3001/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = res.data || {};
      setUploadFeedback(
        `Imported: ${data.imported || 0}, Skipped: ${data.skipped || 0}`,
      );
      fetchData();
    } catch (err) {
      setUploadFeedback("Upload failed");
    }
  };

  const formatCurrency = (v) => {
    if (v === null || v === undefined || v === "") return "";
    const n = Number(v);
    if (isNaN(n)) return "";
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const parseCurrencyInput = (s) => {
    if (!s) return null;
    // remove everything except digits, comma, dot, and minus
    const cleaned = String(s)
      .replace(/[^0-9\-.,]/g, "")
      .replace(/\.(?=.*\.)/g, "")
      .replace(",", ".");
    const n = Number(cleaned);
    return isNaN(n) ? null : n;
  };

  return (
    <div
      className={`${dark ? "bg-[#181A20] text-[#EAECEF]" : "bg-gray-50 text-gray-900"} min-h-screen p-6 transition-colors`}
    >
      {/* HEADER */}
      <header className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold">Finance</h1>
            <nav className="flex bg-transparent rounded-2xl p-1">
              {["dashboard", "planejamento"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 rounded-2xl text-sm font-medium transition-colors ${
                    tab === t
                      ? "bg-[#FCD535] text-black"
                      : `${dark ? "text-[#9CA3AF]" : "text-gray-500"}`
                  }`}
                >
                  {t === "dashboard" ? "Dashboard" : "Overview"}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-[#9CA3AF]">
              <span className="text-xs">Light</span>
              <button
                onClick={() => setDark(!dark)}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${dark ? "bg-[#111214] justify-end flex" : "bg-gray-200 justify-start flex"}`}
                aria-label="Toggle theme"
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white shadow ${dark ? "" : ""}`}
                />
              </button>
              <span className="text-xs">Dark</span>
            </label>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <>
            {/* FILTER + MONTH */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className={`${dark ? "bg-[#1E2329] border-[#2B3139] placeholder-[#9CA3AF] text-[#EAECEF]" : "bg-white border-gray-200"} border p-2 rounded-xl`}
              />
              <div className="text-sm text-[#9CA3AF]">Mês: {month}</div>
            </div>

            {/* SUMMARY CARDS */}
            <h2 className="font-semibold mb-2">Balanço Mensal</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div
                className={`p-4 rounded-2xl border ${dark ? "bg-[#1E2329] border-[#2B3139]" : "bg-white border-gray-100"}`}
              >
                <p className="text-sm text-[#9CA3AF]">Receitas</p>
                <strong className="text-green-300 text-xl">
                  {filtered.length === 0
                    ? "R$0,00"
                    : formatCurrency(totalIncome)}
                </strong>
              </div>

              <div
                className={`p-4 rounded-2xl border ${dark ? "bg-[#1E2329] border-[#2B3139]" : "bg-white border-gray-100"}`}
              >
                <p className="text-sm text-[#9CA3AF]">Despesas</p>
                <strong className="text-red-400 text-xl">
                  {filtered.length === 0
                    ? "R$0,00"
                    : formatCurrency(totalExpense)}
                </strong>
              </div>

              <div
                className={`p-4 rounded-2xl border ${dark ? "bg-[#1E2329] border-[#2B3139]" : "bg-white border-gray-100"}`}
              >
                <p className="text-sm text-[#9CA3AF]">Saldo</p>
                <strong
                  className={`text-xl ${balance >= 0 ? "text-white" : "text-red-200"}`}
                >
                  {filtered.length === 0 ? "R$0,00" : formatCurrency(balance)}
                </strong>
              </div>
            </div>

            {/* FORM + UPLOAD */}
            <div
              className={`${dark ? "bg-[#1E2329] border-[#2B3139]" : "bg-white border-gray-100"} p-4 rounded-2xl border mb-6`}
            >
              <h2 className="font-semibold mb-3">Adicionar Transação</h2>

              <form
                onSubmit={handleSubmit}
                className="flex flex-wrap gap-3 mb-3 items-center"
              >
                <input
                  type="date"
                  className={`${dark ? "bg-[#151719] border-[#2B3139] text-[#EAECEF]" : "bg-white border-gray-200"} p-2 rounded-xl`}
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />

                <input
                  type="text"
                  placeholder="Valor"
                  className={`${dark ? "bg-[#151719] border-[#2B3139] text-[#EAECEF]" : "bg-white border-gray-200"} p-2 rounded-xl w-32`}
                  value={
                    amountInput ||
                    (form.amount ? formatCurrency(form.amount) : "")
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    setAmountInput(v);
                    const num = parseCurrencyInput(v);
                    setForm({ ...form, amount: num });
                  }}
                  onBlur={() => {
                    if (form.amount || form.amount === 0)
                      setAmountInput(formatCurrency(form.amount));
                  }}
                />

                <select
                  className={`${dark ? "bg-[#151719] border-[#2B3139] text-[#EAECEF]" : "bg-white border-gray-200"} p-2 rounded-xl`}
                  value={form.type}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm({
                      ...form,
                      type: v,
                      category: v === "income" ? "" : form.category,
                    });
                  }}
                >
                  <option value="expense">Despesa</option>
                  <option value="income">Receita</option>
                </select>

                <select
                  disabled={form.type === "income"}
                  className={`${dark ? "bg-[#151719] border-[#2B3139] text-[#EAECEF]" : "bg-white border-gray-200"} p-2 rounded-xl ${form.type === "income" ? "opacity-60 cursor-not-allowed" : ""}`}
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  <option value="">Categoria</option>
                  {Object.keys(categories).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <input
                  placeholder="Descrição"
                  className={`${dark ? "bg-[#151719] border-[#2B3139] text-[#EAECEF]" : "bg-white border-gray-200"} p-2 rounded-xl flex-1 min-w-[160px]`}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />

                <button
                  disabled={!isFormValid}
                  className={`bg-[#FCD535] text-black px-4 py-2 rounded-2xl shadow-sm ${!isFormValid ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="inline-block h-4 w-4 mr-2"
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

              <div className="mt-2">
                <label
                  className={`${dark ? "bg-[#151719] border-[#2B3139] text-[#9CA3AF]" : "bg-white border-gray-200 text-gray-700"} inline-flex items-center gap-3 p-2 rounded-xl border cursor-pointer`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V7l-5-4H4z" />
                  </svg>
                  <span className="text-sm">Upload Extrato</span>
                  <input
                    type="file"
                    onChange={handleUpload}
                    className="hidden"
                  />
                </label>
                {uploadFeedback && (
                  <div className="mt-2 text-sm text-[#9CA3AF]">
                    {uploadFeedback}
                  </div>
                )}
              </div>
            </div>

            {/* CHARTS */}
            <h2 className="font-semibold mb-2">Gastos por Categoria</h2>
            <div
              className={`${dark ? "bg-[#1E2329] border-[#2B3139]" : "bg-white border-gray-100"} p-4 rounded-2xl border mb-6 flex flex-col md:flex-row gap-6 items-center justify-center`}
            >
              <div className="flex-1">
                <div>
                  <h3 className="font-semibold mb-1">Gastos por Categoria</h3>
                  <div className="text-sm text-[#9CA3AF] mb-2">
                    Somente despesas do mês selecionado
                  </div>
                </div>
                {chartHasData ? (
                  <div className="flex items-center justify-center">
                    <PieChart width={300} height={300}>
                      <Pie data={chartData} dataKey="value">
                        {chartData.map((e, i) => (
                          <Cell key={i} fill={categories[e.name]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </div>
                ) : (
                  <div className="p-6 text-center text-sm text-[#9CA3AF]">
                    No data available
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div>
                  <h3 className="font-semibold mb-1">Receitas vs Despesas</h3>
                  <div className="text-sm text-[#9CA3AF] mb-2">
                    Balanço mensal do mês selecionado
                  </div>
                </div>
                {totalIncome === 0 && totalExpense === 0 ? (
                  <div className="p-6 text-center text-sm text-[#9CA3AF]">
                    No data available
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <PieChart width={300} height={300}>
                      <Pie data={balancePieData} dataKey="value">
                        <Cell key={0} fill="#10b981" />
                        <Cell key={1} fill="#ef4444" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </div>
                )}
              </div>
            </div>

            {/* TRANSACTIONS TABLE */}
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Extrato do Mês</h2>
              <div className="flex items-center gap-2">
                {/* Selection indicator: shows selected/total when any rows are selected */}
                {selectedIds.length > 0 && (
                  <div className="text-sm text-[#9CA3AF] flex items-center gap-2 mr-2">
                    <span className="font-medium">{selectedIds.length}</span>
                    <span className="text-[#6b7280]">/</span>
                    <span className="text-[#9CA3AF]">{tableData.length}</span>
                  </div>
                )}

                <button
                  onClick={async () => {
                    if (!selectedIds.length) return;
                    if (
                      selectedIds.length === tableData.length &&
                      tableData.length > 0
                    ) {
                      setShowDeleteAllModal(true);
                      return;
                    }
                    // Otherwise delete immediately without confirmation
                    await Promise.all(
                      selectedIds.map((id) =>
                        axios.delete(
                          `http://localhost:3001/transactions/${id}`,
                        ),
                      ),
                    );
                    setSelectedIds([]);
                    fetchData();
                  }}
                  className={`flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-2xl ${selectedIds.length === 0 ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M9 3v1H4v2h16V4h-5V3H9zM6 7v12a2 2 0 002 2h8a2 2 0 002-2V7H6z" />
                  </svg>
                  <span>Excluir</span>
                </button>
              </div>
            </div>

            {/* Table filters */}
            <div className="flex flex-wrap items-center gap-3 mb-3">
              {/* Date filter removed per request */}

              <select
                value={tableFilters.category}
                onChange={(e) =>
                  setTableFilters((s) => ({ ...s, category: e.target.value }))
                }
                className={`${dark ? "bg-[#151719] border-[#2B3139] text-[#EAECEF]" : "bg-white border-gray-200"} p-2 rounded-xl`}
              >
                <option value="">Todas as categorias</option>
                {Object.keys(categories).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={tableFilters.type}
                onChange={(e) =>
                  setTableFilters((s) => ({ ...s, type: e.target.value }))
                }
                className={`${dark ? "bg-[#151719] border-[#2B3139] text-[#EAECEF]" : "bg-white border-gray-200"} p-2 rounded-xl`}
              >
                <option value="">Tipo (todos)</option>
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </select>

              <button
                onClick={() => setTableFilters({ category: "", type: "" })}
                className="text-sm text-[#9CA3AF] px-2 py-1 rounded-xl border"
              >
                Limpar
              </button>
            </div>

            <div
              className={`${dark ? "bg-[#1E2329] border-[#2B3139]" : "bg-white border-gray-100"} rounded-2xl border overflow-hidden`}
            >
              <table className="w-full">
                <thead
                  className={`${dark ? "bg-[#141619] text-[#9CA3AF]" : "bg-gray-50 text-gray-600"}`}
                >
                  <tr>
                    <th className="p-3 text-left">
                      <input
                        type="checkbox"
                        className="appearance-none w-5 h-5 rounded-full border transition-colors checked:bg-[#FCD535] checked:border-[#FCD535] focus:outline-none"
                        checked={
                          selectedIds.length === tableData.length &&
                          tableData.length > 0
                        }
                        onChange={(e) => {
                          if (e.target.checked)
                            setSelectedIds(tableData.map((f) => f.id));
                          else setSelectedIds([]);
                        }}
                      />
                    </th>
                    <th className="p-3 text-left">Data</th>
                    <th className="p-3 text-left">Descrição</th>
                    <th className="p-3 text-left">Categoria</th>
                    <th className="p-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-6 text-center text-sm text-[#9CA3AF]"
                      >
                        No data available
                      </td>
                    </tr>
                  ) : (
                    tableData.map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => setSelected(t)}
                        className={`cursor-pointer transition-colors ${dark ? "hover:bg-[#212428]" : "hover:bg-gray-50"}`}
                      >
                        <td className="p-3 text-sm">
                          <input
                            onClick={(e) => e.stopPropagation()}
                            type="checkbox"
                            className="appearance-none w-5 h-5 rounded-full border transition-colors checked:bg-[#FCD535] checked:border-[#FCD535] focus:outline-none"
                            checked={selectedIds.includes(t.id)}
                            onChange={(e) => {
                              if (e.target.checked)
                                setSelectedIds((s) => [...s, t.id]);
                              else
                                setSelectedIds((s) =>
                                  s.filter((id) => id !== t.id),
                                );
                            }}
                          />
                        </td>
                        <td className="p-3 text-sm">{t.date}</td>
                        <td className="p-3 text-sm">{t.description || ""}</td>
                        <td className="p-3 text-sm">
                          {t.type === "income" ? (
                            <span
                              style={{ color: dark ? "#EAECEF" : undefined }}
                            >
                              -
                            </span>
                          ) : (
                            <div className="flex items-center gap-3">
                              <span
                                className="w-4 h-4 rounded-full"
                                style={{ background: categories[t.category] }}
                              />
                              <span
                                style={{ color: dark ? "#EAECEF" : undefined }}
                              >
                                {t.category}
                              </span>
                            </div>
                          )}
                        </td>
                        <td
                          className={`p-3 text-sm text-right ${t.type === "expense" ? "text-red-400" : "text-green-300"}`}
                        >
                          {formatCurrency(t.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* VISÃO GERAL */}
        {tab === "planejamento" && (
          <>
            <h2 className="font-semibold mb-4">Visão Geral de Gastos</h2>

            <div
              className={`${dark ? "bg-[#1E2329] border-[#2B3139] text-[#EAECEF]" : "bg-white border-gray-100 text-gray-900"} p-4 rounded-2xl border`}
            >
              <div className="p-2">
                <div>
                  <h3 className="font-semibold mb-1">
                    Gastos por Categoria (acumulado)
                  </h3>
                  <div className="text-sm text-[#9CA3AF] mb-3">
                    Visão acumulada por categoria
                  </div>
                </div>
                {globalData.reduce((s, g) => s + g.value, 0) === 0 ? (
                  <div className="text-sm text-[#9CA3AF]">
                    No data available
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {globalData.map((g) => (
                      <div
                        key={g.name}
                        className="flex items-center justify-between gap-3 p-2 rounded-md"
                        style={{ borderColor: dark ? "#2B3139" : "#f3f4f6" }}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ background: categories[g.name] }}
                          />
                          <span>{g.name}</span>
                        </div>
                        <div className="text-sm">{formatCurrency(g.value)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* MODAL */}
        {selected && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4">
            <div
              className={`${dark ? "bg-[#1E2329] border-[#2B3139] text-[#EAECEF]" : "bg-white text-gray-900"} p-4 rounded-2xl w-full max-w-md border shadow-lg`}
            >
              <h2 className="font-semibold mb-3">Detalhes</h2>

              {/* Descrição */}
              <input
                placeholder="Descrição"
                className={`${dark ? "bg-[#151719] border-[#2B3139] text-[#EAECEF]" : "bg-white border-gray-200 text-gray-900"} p-2 w-full mb-2 rounded-xl`}
                value={selected.description || ""}
                onChange={(e) =>
                  setSelected({ ...selected, description: e.target.value })
                }
              />

              {/* Valor */}
              <input
                type="number"
                placeholder="Valor"
                className={`${dark ? "bg-[#151719] border-[#2B3139] text-[#EAECEF]" : "bg-white border-gray-200 text-gray-900"} p-2 w-full mb-2 rounded-xl`}
                value={selected.amount || ""}
                onChange={(e) =>
                  setSelected({ ...selected, amount: Number(e.target.value) })
                }
              />

              {/* Data */}
              <input
                type="date"
                className={`${dark ? "bg-[#151719] border-[#2B3139] text-[#EAECEF]" : "bg-white border-gray-200 text-gray-900"} p-2 w-full mb-2 rounded-xl`}
                value={selected.date || ""}
                onChange={(e) =>
                  setSelected({ ...selected, date: e.target.value })
                }
              />

              {/* Tipo */}
              <select
                className={`${dark ? "bg-[#151719] border-[#2B3139] text-[#EAECEF]" : "bg-white border-gray-200 text-gray-900"} p-2 w-full mb-2 rounded-xl`}
                value={selected.type || "expense"}
                onChange={(e) => {
                  const v = e.target.value;
                  setSelected({
                    ...selected,
                    type: v,
                    category: v === "income" ? "" : selected.category,
                  });
                }}
              >
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </select>

              {/* Categoria */}
              <select
                className={`${
                  dark
                    ? "bg-[#151719] border-[#2B3139] text-[#EAECEF]"
                    : "bg-white border-gray-200 text-gray-900"
                } p-2 w-full mb-2 rounded-xl`}
                disabled={selected.type === "income"}
                value={selected.category || ""}
                onChange={(e) =>
                  setSelected({ ...selected, category: e.target.value })
                }
              >
                <option value="">Selecione uma categoria</option>

                {Object.keys(categories).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Pessoa */}
              <input
                placeholder="Pessoa"
                className={`${dark ? "bg-[#151719] border-[#2B3139] text-[#EAECEF]" : "bg-white border-gray-200 text-gray-900"} p-2 w-full mb-3 rounded-xl`}
                value={selected.person || ""}
                onChange={(e) =>
                  setSelected({ ...selected, person: e.target.value })
                }
              />

              <div className="flex justify-end gap-2">
                <button
                  className="bg-[#FCD535] text-black px-3 py-1 rounded-2xl"
                  onClick={async () => {
                    await axios.put(
                      `http://localhost:3001/transactions/${selected.id}`,
                      selected,
                    );
                    setSelected(null);
                    fetchData();
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="inline-block h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Salvar
                </button>

                <button
                  className="bg-red-500 text-white px-3 py-1 rounded-2xl"
                  onClick={async () => {
                    await axios.delete(
                      `http://localhost:3001/transactions/${selected.id}`,
                    );
                    setSelected(null);
                    fetchData();
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="inline-block h-4 w-4 mr-2"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M9 3v1H4v2h16V4h-5V3H9zM6 7v12a2 2 0 002 2h8a2 2 0 002-2V7H6z" />
                  </svg>
                  Excluir
                </button>

                <button
                  className={`${dark ? "text-[#9CA3AF]" : "text-gray-700"}`}
                  onClick={() => setSelected(null)}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Duplicate confirmation modal */}
        {showDuplicateModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4">
            <div
              className={`${dark ? "bg-[#1E2329] border-[#2B3139] text-[#EAECEF]" : "bg-white text-gray-900"} p-4 rounded-2xl w-full max-w-md border shadow-lg`}
            >
              <h2 className="font-semibold mb-3">Transação duplicada</h2>
              <p className="mb-4 text-sm text-[#9CA3AF]">
                Duplicate transaction detected. Add anyway?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  className="bg-gray-200 text-gray-800 px-3 py-1 rounded-2xl"
                  onClick={() => {
                    setShowDuplicateModal(false);
                    setDuplicateCandidate(null);
                  }}
                >
                  Cancelar
                </button>
                <button
                  className="bg-[#FCD535] text-black px-3 py-1 rounded-2xl"
                  onClick={confirmAddAnyway}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="inline-block h-4 w-4 mr-2"
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
                  Adicionar mesmo assim
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Delete all confirmation modal */}
        {showDeleteAllModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4">
            <div
              className={`${dark ? "bg-[#1E2329] border-[#2B3139] text-[#EAECEF]" : "bg-white text-gray-900"} p-4 rounded-2xl w-full max-w-md border shadow-lg`}
            >
              <h2 className="font-semibold mb-3">Confirmar exclusão</h2>
              <p className="mb-4 text-sm text-[#9CA3AF]">
                Você tem certeza que deseja excluir todas as transações
                visíveis? Esta ação não pode ser desfeita.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  className="bg-gray-200 text-gray-800 px-3 py-1 rounded-2xl"
                  onClick={() => setShowDeleteAllModal(false)}
                >
                  Cancelar
                </button>
                <button
                  className="bg-red-600 text-white px-3 py-1 rounded-2xl"
                  onClick={confirmDeleteAll}
                >
                  Excluir tudo
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

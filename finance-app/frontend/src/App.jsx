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
  const [dark, setDark] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [tab, setTab] = useState("dashboard");

  const [form, setForm] = useState({
    date: "",
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
    if (
      !form.date ||
      form.amount === null ||
      form.amount === "" ||
      !form.category ||
      !form.type
    )
      return;
    await axios.post("http://localhost:3001/transactions", form);
    setForm({
      date: "",
      amount: "",
      type: "expense",
      category: "",
      description: "",
    });
    setAmountInput("");
    fetchData();
  };

  // filtro mensal
  const filtered = transactions.filter((t) => t.date?.startsWith(month));

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
    form.category &&
    form.type;

  // gráfico mensal
  const chartData = Object.keys(categories).map((cat) => ({
    name: cat,
    value: filtered
      .filter((t) => t.category === cat)
      .reduce((a, t) => a + Number(t.amount), 0),
  }));

  // gráfico geral
  const globalData = Object.keys(categories).map((cat) => ({
    name: cat,
    value: transactions
      .filter((t) => t.category === cat)
      .reduce((a, t) => a + Number(t.amount), 0),
  }));

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
                  {formatCurrency(totalIncome)}
                </strong>
              </div>

              <div
                className={`p-4 rounded-2xl border ${dark ? "bg-[#1E2329] border-[#2B3139]" : "bg-white border-gray-100"}`}
              >
                <p className="text-sm text-[#9CA3AF]">Despesas</p>
                <strong className="text-red-400 text-xl">
                  {formatCurrency(totalExpense)}
                </strong>
              </div>

              <div
                className={`p-4 rounded-2xl border ${dark ? "bg-[#1E2329] border-[#2B3139]" : "bg-white border-gray-100"}`}
              >
                <p className="text-sm text-[#9CA3AF]">Saldo</p>
                <strong
                  className={`text-xl ${balance >= 0 ? "text-white" : "text-red-200"}`}
                >
                  {formatCurrency(balance)}
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
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="expense">Despesa</option>
                  <option value="income">Receita</option>
                </select>

                <select
                  className={`${dark ? "bg-[#151719] border-[#2B3139] text-[#EAECEF]" : "bg-white border-gray-200"} p-2 rounded-xl`}
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
              <div className="flex-1 flex items-center justify-center">
                <PieChart width={300} height={300}>
                  <Pie data={chartData} dataKey="value">
                    {chartData.map((e, i) => (
                      <Cell key={i} fill={categories[e.name]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </div>

              <div className="flex-1 flex items-center justify-center">
                <BarChart width={400} height={300} data={chartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value">
                    {chartData.map((e, i) => (
                      <Cell key={i} fill={categories[e.name]} />
                    ))}
                  </Bar>
                </BarChart>
              </div>
            </div>

            {/* TRANSACTIONS TABLE */}
            <h2 className="font-semibold mb-2">Extrato do Mês</h2>
            <div
              className={`${dark ? "bg-[#1E2329] border-[#2B3139]" : "bg-white border-gray-100"} rounded-2xl border overflow-hidden`}
            >
              <table className="w-full">
                <thead
                  className={`${dark ? "bg-[#141619] text-[#9CA3AF]" : "bg-gray-50 text-gray-600"}`}
                >
                  <tr>
                    <th className="p-3 text-left">Data</th>
                    <th className="p-3 text-left">Categoria</th>
                    <th className="p-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => setSelected(t)}
                      className={`cursor-pointer transition-colors ${dark ? "hover:bg-[#212428]" : "hover:bg-gray-50"}`}
                    >
                      <td className="p-3 text-sm">{t.date}</td>
                      <td className="p-3 text-sm flex items-center gap-3">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ background: categories[t.category] }}
                        />
                        <span style={{ color: dark ? "#EAECEF" : undefined }}>
                          {t.category}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-right">
                        {formatCurrency(t.amount)}
                      </td>
                    </tr>
                  ))}
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
              <BarChart width={600} height={300} data={globalData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value">
                  {globalData.map((e, i) => (
                    <Cell key={i} fill={categories[e.name]} />
                  ))}
                </Bar>
              </BarChart>
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
                onChange={(e) =>
                  setSelected({ ...selected, type: e.target.value })
                }
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
      </main>
    </div>
  );
}

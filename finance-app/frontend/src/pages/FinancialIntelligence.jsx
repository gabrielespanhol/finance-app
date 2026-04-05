import React, { useMemo, useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import useTransactions from "../hooks/useTransactions";
import { formatCurrency } from "../utils/format";
import {
  getSavedMoney,
  createSavedMoney,
  deleteSavedMoney,
  getProjections,
  createProjection,
  deleteProjection,
  updateProjection,
} from "../services/api";
import "../styles/FinancialIntelligence.css";

export default function FinancialIntelligence({ dark }) {
  const tx = useTransactions({ dark });
  const [savedMoney, setSavedMoney] = useState([]);
  const [projections, setProjections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: null, message: "" });
  const [editingSaved, setEditingSaved] = useState(null);
  const [editingProj, setEditingProj] = useState(null);

  // Form states
  const [savedForm, setSavedForm] = useState({ description: "", amount: "" });
  const [projForm, setProjForm] = useState({
    description: "",
    category: "Fixos",
    amount: "",
    type: "expense",
    startDate: new Date().toISOString().slice(0, 10),
  });

  const currentYear = new Date().getFullYear();
  const [gridYear, setGridYear] = useState(currentYear);

  const fetchData = async () => {
    try {
      const [sm, pj] = await Promise.all([getSavedMoney(), getProjections()]);
      setSavedMoney(sm || []);
      setProjections(pj || []);
    } catch (e) {
      console.error("Error fetching intel data", e);
      showFeedback("error", "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: null, message: "" }), 3000);
  };

  const handleAddSaved = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!savedForm.description.trim() || !savedForm.amount || Number(savedForm.amount) <= 0) {
      showFeedback("error", "Preencha descrição e valor (>0).");
      return;
    }
    
    try {
      setIsSubmitting(true);
      if (editingSaved) {
        await updateSavedMoney(editingSaved.id, {
          description: savedForm.description,
          amount: Number(savedForm.amount),
        });
        showFeedback("success", "Registro atualizado!");
      } else {
        await createSavedMoney({
          description: savedForm.description,
          amount: Number(savedForm.amount),
        });
        showFeedback("success", "Saldo adicionado!");
      }
      setSavedForm({ description: "", amount: "" });
      setEditingSaved(null);
      document.getElementById('modal-saved')?.close();
      await fetchData();
    } catch (err) {
      showFeedback("error", "Erro ao salvar dados.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSaved = (sm) => {
    setEditingSaved(sm);
    setSavedForm({ description: sm.description, amount: sm.amount });
    document.getElementById('modal-saved')?.showModal();
  };

  const handleDeleteSaved = async (id) => {
    if (window.confirm("Excluir este registro?")) {
      await deleteSavedMoney(id);
      await fetchData();
    }
  };

  const handleAddProj = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!projForm.description.trim() || !projForm.amount || Number(projForm.amount) <= 0) {
      showFeedback("error", "Preencha descrição e valor (>0).");
      return;
    }
    
    try {
      setIsSubmitting(true);
      const payload = {
        ...projForm,
        amount: Number(projForm.amount),
        recurrence: "monthly",
      };

      if (editingProj) {
        await updateProjection(editingProj.id, payload);
        showFeedback("success", "Recorrência atualizada!");
      } else {
        await createProjection(payload);
        showFeedback("success", "Recorrência cadastrada!");
      }

      setProjForm({
        description: "",
        category: "Fixos",
        amount: "",
        type: "expense",
        startDate: new Date().toISOString().slice(0, 10),
      });
      setEditingProj(null);
      document.getElementById('modal-proj')?.close();
      await fetchData();
    } catch (err) {
      showFeedback("error", "Erro ao salvar recorrência.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProj = (p) => {
    setEditingProj(p);
    setProjForm({
      description: p.description,
      category: p.category || (p.type === 'income' ? 'Entradas' : 'Fixos'),
      amount: p.amount,
      type: p.type,
      startDate: p.startDate,
    });
    document.getElementById('modal-proj')?.showModal();
  };

  const handleDeleteProj = async (id) => {
    if (window.confirm("Excluir esta projeção?")) {
      await deleteProjection(id);
      await fetchData();
    }
  };

  // 1) Monthly Historical Data for Line Chart
  const lineChartData = useMemo(() => {
    const monthsMap = {};
    (tx.transactions || []).forEach((t) => {
      if (!t.date) return;
      const monthKey = t.date.slice(0, 7); // YYYY-MM
      if (!monthsMap[monthKey]) {
        monthsMap[monthKey] = { month: monthKey, income: 0, expense: 0 };
      }
      if (t.type === "income") monthsMap[monthKey].income += Number(t.amount);
      else monthsMap[monthKey].expense += Number(t.amount);
    });

    const sorted = Object.values(monthsMap).sort((a, b) =>
      a.month.localeCompare(b.month)
    );

    return sorted.map((d) => ({
      ...d,
      balance: d.income - d.expense,
      label: new Date(d.month + "-02").toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      }),
    }));
  }, [tx.transactions]);

  // 2) Aggregation for projections grid
  const MONTHS = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", 
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ];

  const gridData = useMemo(() => {
    const result = MONTHS.map((m, idx) => {
      const monthNum = String(idx + 1).padStart(2, "0");
      const yearMonth = `${gridYear}-${monthNum}`;
      
      const monthData = {
        monthName: m,
        yearMonth,
        projectionsIncome: [],
        projectionsExpense: [],
        realCreditCard: 0,
        totalIncome: 0,
        totalExpense: 0,
      };

      // Add projections that started before or in this month
      (projections || []).forEach((p) => {
        if (p.startDate <= yearMonth + "-31") {
          const item = { 
            description: p.description, 
            amount: Number(p.amount),
            category: p.category || (p.type === 'income' ? 'Entradas' : 'Fixos')
          };
          if (p.type === "income") {
            monthData.projectionsIncome.push(item);
            monthData.totalIncome += item.amount;
          } else {
            monthData.projectionsExpense.push(item);
            monthData.totalExpense += item.amount;
          }
        }
      });

      // Search real future transactions (Credit Card / Installments)
      tx.transactions.forEach((t) => {
        if (t.date && t.date.startsWith(yearMonth)) {
          const desc = (t.description || "").toLowerCase();
          if (desc.includes("cartão") || desc.includes("credito") || desc.includes("crédito") || desc.includes("parcela")) {
            monthData.realCreditCard += Number(t.amount);
            monthData.totalExpense += Number(t.amount);
          }
        }
      });

      monthData.remaining = monthData.totalIncome - monthData.totalExpense;
      return monthData;
    });

    return result;
  }, [projections, tx.transactions, gridYear]);

  // Group projections by category for table display
  const groupedProjsByCat = useMemo(() => {
    const groups = {};
    projections.forEach(p => {
      const cat = p.category || (p.type === 'income' ? 'Entradas' : 'Fixos');
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    return groups;
  }, [projections]);

  // Totals for saved money
  const totalSavedValue = useMemo(() => 
    savedMoney.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
  , [savedMoney]);

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Toast-style Feedback */}
      {feedback.message && (
        <div className={`fixed top-4 right-4 z-[2000] px-6 py-3 rounded-xl shadow-2xl animate-appear border ${feedback.type === 'success' ? 'bg-success/20 text-success border-success/30' : 'bg-danger/20 text-danger border-danger/30'}`}>
           <span className="font-bold">{feedback.message}</span>
        </div>
      )}

      {/* TOP: LINE CHART */}
      <div className="card">
        <h2 className="text-h">Evolução Mensal (Real)</h2>
        <div className="chart-container mt-4">
          <ResponsiveContainer>
            <LineChart data={lineChartData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-soft)" />
              <XAxis dataKey="label" stroke="var(--color-muted)" fontSize={12} tickMargin={10} />
              <YAxis tickFormatter={(v) => `R$${v}`} stroke="var(--color-muted)" fontSize={12} />
              <Tooltip 
                formatter={(v) => formatCurrency(v)}
                contentStyle={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", borderRadius: "8px" }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line type="monotone" dataKey="income" name="Receita" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="expense" name="Despesa" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="balance" name="Balanço" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* MIDDLE: SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card flex flex-col justify-between p-6">
          <p className="text-muted text-xs uppercase font-bold tracking-widest mb-1">Total Guardado</p>
          <h3 className="text-3xl font-bold text-primary-text">{formatCurrency(totalSavedValue)}</h3>
        </div>
        <div className="card flex flex-col justify-between p-6">
          <p className="text-muted text-xs uppercase font-bold tracking-widest mb-1">Projeção Mensal Próximos 30 dias</p>
          <h3 className="text-3xl font-bold text-success">
            {formatCurrency(gridData[new Date().getMonth() + 1]?.totalIncome || 0)}
          </h3>
        </div>
        <div className="card flex flex-col justify-between p-6">
          <p className="text-muted text-xs uppercase font-bold tracking-widest mb-1">Gastos Projetados Próximos 30 dias</p>
          <h3 className="text-3xl font-bold text-danger">
            {formatCurrency(gridData[new Date().getMonth() + 1]?.totalExpense || 0)}
          </h3>
        </div>
      </div>

      {/* SECTION 1: SAVED MONEY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-h m-0 text-xl">Dinheiro Guardado</h2>
              <p className="text-muted text-xs">Acompanhamento manual de reservas e investimentos</p>
            </div>
            <button className="btn btn-primary" onClick={() => { setEditingSaved(null); setSavedForm({ description: "", amount: "" }); document.getElementById('modal-saved').showModal(); }}>
               Adicionar
            </button>
          </div>
          
          {/* Prominent Saved Money Total Card (as requested) */}
          <div className="bg-surface-inner p-4 rounded-xl border border-border-soft flex items-center justify-between">
             <span className="text-sm font-semibold text-muted">Saldo Total</span>
             <span className="text-2xl font-black text-primary-text">{formatCurrency(totalSavedValue)}</span>
          </div>

          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-sm">
              <thead className="text-muted border-b border-border-soft">
                <tr>
                  <th className="py-3 px-4 font-bold text-xs uppercase tracking-tighter text-left">Descrição</th>
                  <th className="py-3 px-4 font-bold text-xs uppercase tracking-tighter text-left">Valor</th>
                  <th className="py-3 px-4 font-bold text-xs uppercase tracking-tighter text-left">Data</th>
                  <th className="py-3 px-4 font-bold text-xs uppercase tracking-tighter text-left">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {savedMoney.map((sm) => (
                  <tr key={sm.id} className="hover:bg-surface-inner transition-colors">
                    <td className="py-3 px-4 text-left">{sm.description}</td>
                    <td className="py-3 px-4 text-left font-bold">{formatCurrency(sm.amount)}</td>
                    <td className="py-3 px-4 text-left text-muted text-xs">
                      {new Date(sm.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-3 px-4 text-left flex items-center justify-start gap-2">
                      <button onClick={() => handleEditSaved(sm)} className="btn btn-icon text-muted hover:text-primary transition-colors" title="Editar">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                         </svg>
                      </button>
                      <button onClick={() => handleDeleteSaved(sm.id)} className="btn btn-icon text-danger hover:bg-danger/10 transition-colors" title="Excluir">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                         </svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {savedMoney.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-muted">Nenhum registro encontrado</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 2: PROJECTIONS CONFIG */}
        <div className="card p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-h m-0 text-xl">Recorrências</h2>
              <p className="text-muted text-xs">Projeções mensais automáticas (Entradas e Fixos)</p>
            </div>
            <button className="btn btn-primary" onClick={() => { setEditingProj(null); setProjForm({ description: "", category: "Fixos", amount: "", type: "expense", startDate: new Date().toISOString().slice(0, 10) }); document.getElementById('modal-proj').showModal(); }}>
               Configurar
            </button>
          </div>

          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-sm">
              <thead className="text-muted border-b border-border-soft">
                <tr>
                  <th className="py-3 px-4 font-bold text-xs uppercase tracking-tighter text-left">Descrição</th>
                  <th className="py-3 px-4 font-bold text-xs uppercase tracking-tighter text-left">Categoria</th>
                  <th className="py-3 px-4 font-bold text-xs uppercase tracking-tighter text-left">Valor</th>
                  <th className="py-3 px-4 font-bold text-xs uppercase tracking-tighter text-left">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {projections.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-inner transition-colors">
                    <td className="py-3 px-4 text-left">{p.description}</td>
                    <td className="py-3 px-4 text-left">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${p.type === "income" ? "bg-success/20 text-success" : "bg-danger/20 text-danger"}`}>
                        {p.category || (p.type === 'income' ? 'Entrada' : 'Fixo')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-left font-bold">{formatCurrency(p.amount)}</td>
                    <td className="py-3 px-4 text-left flex items-center justify-start gap-2">
                       <button onClick={() => handleEditProj(p)} className="btn btn-icon text-muted hover:text-primary transition-colors" title="Editar">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                         </svg>
                      </button>
                      <button onClick={() => handleDeleteProj(p.id)} className="btn btn-icon text-danger hover:bg-danger/10 transition-colors" title="Excluir">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                         </svg>
                      </button>
                    </td>
                  </tr>
                ))}
                 {projections.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-muted">Nenhuma recorrência configurada</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 3: PROJECTION GRID (Spreadsheet Style) */}
      <div className="card p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-h m-0 text-xl">Previsão Anual</h2>
            <p className="text-muted text-sm font-medium">Grid consolidado de planejamento financeiro</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted uppercase">Ano</span>
            <select value={gridYear} onChange={(e) => setGridYear(Number(e.target.value))} className="input-base text-sm font-bold min-w-[100px]">
               {[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map(y => (
                 <option key={y} value={y}>{y}</option>
               ))}
            </select>
          </div>
        </div>
        
        <div className="projection-grid-wrapper">
          <table className="projection-grid-table">
            <thead>
              <tr className="bg-surface-inner">
                <th className="p-4 border-r border-b border-border-soft font-black uppercase tracking-widest sticky left-0 bg-surface-inner z-10 w-[200px]">CATEGORIA</th>
                {gridData.map(d => (
                  <th key={d.monthName} className="p-4 border-r border-b border-border-soft text-center font-black uppercase">{d.monthName}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Income Rows */}
              <tr className="bg-success/5 font-bold">
                <td className="p-4 border-r border-b border-border-soft uppercase text-success sticky left-0 bg-[#f0fdf4] dark:bg-success/10 z-10">ENTRADAS (Projetado)</td>
                {gridData.map((d, i) => (
                  <td key={i} className="p-4 border-r border-b border-border-soft text-center text-success text-sm font-black">
                    {formatCurrency(d.totalIncome)}
                  </td>
                ))}
              </tr>
              
              {/* Expense Sections */}
              {Object.entries(groupedProjsByCat).filter(([cat, ps]) => ps[0].type === 'expense').map(([cat, ps]) => (
                <React.Fragment key={cat}>
                    <tr className="bg-surface-inner">
                        <td colSpan={13} className="p-3 border-b border-border-soft text-muted font-black uppercase text-[10px] tracking-widest px-4 sticky left-0 bg-surface-inner z-10">{cat}</td>
                    </tr>
                    {ps.map(p => (
                        <tr key={p.id} className="hover:bg-surface-inner transition-colors">
                            <td className="p-4 border-r border-b border-border-soft text-primary-text font-medium sticky left-0 bg-surface z-10">{p.description}</td>
                            {gridData.map((d, i) => (
                                <td key={i} className="p-4 border-r border-b border-border-soft text-center font-bold text-primary-text opacity-70">
                                    {p.startDate <= d.yearMonth + "-31" ? formatCurrency(p.amount) : "-"}
                                </td>
                            ))}
                        </tr>
                    ))}
                </React.Fragment>
              ))}

              {/* Real Future Transactions (Credit Card) */}
              <tr className="bg-warning/5 hover:bg-warning/10 transition-colors">
                <td className="p-4 border-r border-b border-border-soft font-black text-primary-text uppercase tracking-tight sticky left-0 bg-warning/5 z-10">
                   Cartão de Crédito <span className="opacity-40">(Real)</span>
                </td>
                {gridData.map((d, i) => (
                  <td key={i} className="p-4 border-r border-b border-border-soft text-center font-black text-primary-text flex items-center justify-center gap-1">
                    {d.realCreditCard > 0 && <span className="text-[10px]" title="Capturado do banco">🔒</span>}
                    {formatCurrency(d.realCreditCard)}
                  </td>
                ))}
              </tr>

              {/* TOTALS */}
              <tr className="font-black border-t-2 border-border-soft">
                <td className="p-4 border-r border-b border-border-soft sticky left-0 bg-surface z-10">TOTAL GASTOS</td>
                {gridData.map((d, i) => (
                  <td key={i} className="p-4 border-r border-b border-border-soft text-center text-danger font-black text-sm">
                    {formatCurrency(d.totalExpense)}
                  </td>
                ))}
              </tr>
              <tr className="font-black bg-surface-inner">
                <td className="p-4 border-r border-b border-border-soft sticky left-0 bg-surface-inner z-10">DINHEIRO RESTANTE</td>
                {gridData.map((d, i) => (
                  <td key={i} className={`p-4 border-r border-border-soft text-center text-sm font-black ${d.remaining >= 0 ? 'text-success' : 'text-danger'}`}>
                    {formatCurrency(d.remaining)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL SAVED MONEY */}
      <dialog id="modal-saved" className="modal-custom">
        <div className="modal-card">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-black">{editingSaved ? 'Editar Registro' : 'Registrar Saldo'}</h3>
              <p className="text-muted text-xs font-bold opacity-60">Dinheiro guardado ou investimentos</p>
            </div>
            <button onClick={() => document.getElementById('modal-saved').close()} className="btn btn-secondary btn-icon rounded-full">✕</button>
          </div>
          <form onSubmit={handleAddSaved} className="flex flex-col gap-6">
            <div>
              <label className="label-form">Descrição</label>
              <input 
                type="text" 
                className="input-base w-full h-12" 
                value={savedForm.description}
                onChange={e => setSavedForm({...savedForm, description: e.target.value})}
                placeholder="Ex: Reserva de Emergência"
                required
                autoComplete="off"
              />
            </div>
            <div>
              <label className="label-form">Valor atual</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted">R$</span>
                <input 
                  type="number" 
                  step="0.01" 
                  className="input-base w-full h-12 pl-12 font-black text-lg" 
                  value={savedForm.amount}
                  onChange={e => setSavedForm({...savedForm, amount: e.target.value})}
                  placeholder="0,00"
                  required
                />
              </div>
            </div>
            <div className="flex gap-4 items-center mt-4">
              <button type="button" className="btn btn-secondary flex-1 h-12 font-bold" onClick={() => document.getElementById('modal-saved').close()}>Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-1 h-12 font-black shadow-xl disabled:opacity-50">
                {isSubmitting ? "Salvando..." : (editingSaved ? "Atualizar" : "Confirmar")}
              </button>
            </div>
          </form>
        </div>
      </dialog>

      {/* MODAL PROJECTION */}
      <dialog id="modal-proj" className="modal-custom">
        <div className="modal-card max-w-[500px]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-black">{editingProj ? 'Editar Recorrência' : 'Nova Recorrência'}</h3>
              <p className="text-muted text-xs font-bold opacity-60">Fluxos previsíveis de entrada ou saída</p>
            </div>
            <button onClick={() => document.getElementById('modal-proj').close()} className="btn btn-secondary btn-icon rounded-full">✕</button>
          </div>
          <form onSubmit={handleAddProj} className="flex flex-col gap-6">
             <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="label-form">Natureza</label>
                  <select 
                    className="input-base w-full h-12 font-black" 
                    value={projForm.type}
                    onChange={e => setProjForm({...projForm, type: e.target.value, category: e.target.value === 'income' ? 'Entradas' : 'Fixos'})}
                  >
                    <option value="expense">Despesa 📉</option>
                    <option value="income">Receita 📈</option>
                  </select>
                </div>
                <div>
                  <label className="label-form">Grupo / Tags</label>
                  <input 
                    type="text"
                    className="input-base w-full h-12"
                    list="proj-cats-v2"
                    value={projForm.category}
                    onChange={e => setProjForm({...projForm, category: e.target.value})}
                    placeholder="Fixos..."
                  />
                  <datalist id="proj-cats-v2">
                    <option value="Fixos" />
                    <option value="Serviços" />
                    <option value="Estudo" />
                    <option value="Investimento" />
                  </datalist>
                </div>
             </div>
            <div>
              <label className="label-form">Identificação</label>
              <input 
                type="text" 
                className="input-base w-full h-12" 
                value={projForm.description}
                onChange={e => setProjForm({...projForm, description: e.target.value})}
                placeholder="Ex: Aluguel, Internet, Salário..."
                required
                autoComplete="off"
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="label-form">Valor Estimado</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="input-base w-full h-12 font-black" 
                    value={projForm.amount}
                    onChange={e => setProjForm({...projForm, amount: e.target.value})}
                    placeholder="0,00"
                    required
                  />
                </div>
                <div>
                  <label className="label-form">Plano inicia em</label>
                  <input 
                    type="date" 
                    className="input-base w-full h-12" 
                    value={projForm.startDate}
                    onChange={e => setProjForm({...projForm, startDate: e.target.value})}
                    required
                  />
                </div>
            </div>
            <div className="flex gap-4 items-center mt-6">
              <button type="button" className="btn btn-secondary flex-1 h-12 font-bold" onClick={() => document.getElementById('modal-proj').close()}>Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-1 h-12 font-black shadow-xl disabled:opacity-50">
                {isSubmitting ? "Processando..." : (editingProj ? "Salvar Alterações" : "Salvar Projeção")}
              </button>
            </div>
          </form>
        </div>
      </dialog>

    </div>
  );
}

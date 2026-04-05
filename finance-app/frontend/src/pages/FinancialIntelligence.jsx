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
  updateSavedMoney,
  deleteSavedMoney,
  getProjections,
  createProjection,
  deleteProjection,
  updateProjection,
} from "../services/api";
import { createPortal } from "react-dom";
import Modal from "../components/Modal";
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
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showProjModal, setShowProjModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, action: null, title: "", message: "" });

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
      setShowSavedModal(false);
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
    setShowSavedModal(true);
  };

  const handleDeleteSaved = (id) => {
    setDeleteConfirm({
      show: true,
      title: "Excluir Registro",
      message: "Você tem certeza que deseja excluir este registro de saldo?",
      action: async () => {
        await deleteSavedMoney(id);
        await fetchData();
        setDeleteConfirm({ show: false, action: null, title: "", message: "" });
      }
    });
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
      setShowProjModal(false);
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
    setShowProjModal(true);
  };

  const handleDeleteProj = (id) => {
    setDeleteConfirm({
      show: true,
      title: "Excluir Recorrência",
      message: "Isso removerá esta projeção dos cálculos futuros. Continuar?",
      action: async () => {
        await deleteProjection(id);
        await fetchData();
        setDeleteConfirm({ show: false, action: null, title: "", message: "" });
      }
    });
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

      // Projections logic already updates totalIncome and totalExpense above

      monthData.remaining = monthData.totalIncome - monthData.totalExpense;
      return monthData;
    });

    return result;
  }, [projections, tx.transactions, gridYear]);

  const groupedProjsByCat = useMemo(() => {
    const groups = {};
    (projections || [])
      .filter(p => Number(p.amount) > 0 && (p.description || "").trim() !== "")
      .forEach(p => {
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
            <button className="btn btn-primary" onClick={() => { setEditingSaved(null); setSavedForm({ description: "", amount: "" }); setShowSavedModal(true); }}>
               Adicionar
            </button>
          </div>
          
          {/* Prominent Saved Money Total Card (as requested) */}
          <div className="bg-surface-inner p-4 rounded-xl border border-border-soft flex items-center justify-between">
             <span className="text-sm font-semibold text-muted">Saldo Total</span>
             <span className="text-2xl font-black text-primary-text">{formatCurrency(totalSavedValue)}</span>
          </div>

          <div className="table-container mt-2">
            <table className="table-fixed">
              <thead>
                <tr>
                  <th className="text-left w-auto">Descrição</th>
                  <th className="text-left w-[140px]">Data</th>
                  <th className="text-left w-[150px]">Valor</th>
                  <th className="text-right w-[100px]">Ação</th>
                </tr>
              </thead>
              <tbody>
                {savedMoney.map((sm) => (
                  <tr key={sm.id} className="hover:bg-surface-inner transition-colors">
                    <td className="text-left align-middle overflow-hidden text-ellipsis whitespace-nowrap">{sm.description}</td>
                    <td className="text-left text-muted text-xs align-middle whitespace-nowrap">
                      {new Date(sm.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="text-left font-bold align-middle whitespace-nowrap">{formatCurrency(sm.amount)}</td>
                    <td className="text-right align-middle">
                      <div className="flex items-center justify-end gap-2 h-full">
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
                      </div>
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
            <button className="btn btn-primary" onClick={() => { setEditingProj(null); setProjForm({ description: "", category: "Fixos", amount: "", type: "expense", startDate: new Date().toISOString().slice(0, 10) }); setShowProjModal(true); }}>
               Adicionar
            </button>
          </div>

          <div className="table-container mt-2">
            <table className="table-fixed">
              <thead>
                <tr>
                  <th className="text-left w-auto">Descrição</th>
                  <th className="text-left w-[140px]">Categoria</th>
                  <th className="text-left w-[150px]">Valor</th>
                  <th className="text-right w-[100px]">Ação</th>
                </tr>
              </thead>
              <tbody>
                {projections.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-inner transition-colors">
                    <td className="text-left align-middle overflow-hidden text-ellipsis whitespace-nowrap">{p.description}</td>
                    <td className="text-left align-middle w-[140px]">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-flex items-center ${p.type === "income" ? "bg-success/20 text-success" : "bg-danger/20 text-danger"}`}>
                        {p.category || (p.type === 'income' ? 'Entrada' : 'Fixo')}
                      </span>
                    </td>
                    <td className="text-left font-bold align-middle whitespace-nowrap">{formatCurrency(p.amount)}</td>
                    <td className="text-right align-middle">
                      <div className="flex items-center justify-end gap-2 h-full">
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
                      </div>
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
                <th className="sticky-col bg-surface-inner font-black uppercase tracking-widest w-[200px]">CATEGORIA</th>
                {gridData.map(d => (
                  <th key={d.monthName} className="text-center font-black uppercase">{d.monthName}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Income Rows */}
              <tr className="bg-success/5 font-bold">
                <td className="sticky-col bg-[#f0fdf4] dark:bg-success/10 uppercase text-success font-black">ENTRADAS (Projetado)</td>
                {gridData.map((d, i) => (
                  <td key={i} className="text-center text-success text-sm font-black">
                    {d.totalIncome > 0 ? formatCurrency(d.totalIncome) : <span className="text-muted opacity-40">-</span>}
                  </td>
                ))}
              </tr>
              
              {/* Expense Sections */}
              {Object.entries(groupedProjsByCat).filter(([cat, ps]) => ps[0].type === 'expense').map(([cat, ps]) => (
                <React.Fragment key={cat}>
                    <tr className="bg-surface-inner">
                        <td colSpan={13} className="bg-surface-inner text-muted font-black uppercase text-[10px] tracking-widest px-4 sticky-col">{cat}</td>
                    </tr>
                    {ps.map(p => (
                        <tr key={p.id} className="hover:bg-surface-inner transition-colors">
                            <td className="sticky-col bg-surface text-primary-text font-medium">{p.description}</td>
                            {gridData.map((d, i) => (
                                <td key={i} className="text-center font-bold text-primary-text opacity-70">
                                    {(p.startDate <= d.yearMonth + "-31" && p.amount > 0) ? formatCurrency(p.amount) : <span className="text-muted opacity-30">-</span>}
                                </td>
                            ))}
                        </tr>
                    ))}
                </React.Fragment>
              ))}


              {/* TOTALS */}
              <tr className="font-black border-t-2 border-border-soft">
                <td className="sticky-col bg-surface">TOTAL GASTOS</td>
                {gridData.map((d, i) => (
                  <td key={i} className="text-center text-danger font-black text-sm">
                    {d.totalExpense > 0 ? formatCurrency(d.totalExpense) : <span className="text-muted opacity-40">-</span>}
                  </td>
                ))}
              </tr>
              <tr className="font-black bg-surface-inner">
                <td className="sticky-col bg-surface-inner">DINHEIRO RESTANTE</td>
                {gridData.map((d, i) => (
                  <td key={i} className={`text-center text-sm font-black ${d.remaining >= 0 ? 'text-success' : 'text-danger'}`}>
                    {d.remaining !== 0 ? formatCurrency(d.remaining) : <span className="text-muted opacity-40">-</span>}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL SAVED MONEY */}
      {showSavedModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowSavedModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button aria-label="Fechar" className="modal-close" onClick={() => setShowSavedModal(false)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <h2 className="text-xl font-bold mb-8">{editingSaved ? 'Editar Registro' : 'Registrar Saldo'}</h2>
            
            <form onSubmit={handleAddSaved} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Descrição</label>
                <input 
                  type="text" 
                  className="input-base w-full" 
                  value={savedForm.description}
                  onChange={e => setSavedForm({...savedForm, description: e.target.value})}
                  placeholder="Ex: Reserva de Emergência"
                  required
                  autoComplete="off"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Valor (R$)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  className="input-base w-full" 
                  value={savedForm.amount}
                  onChange={e => setSavedForm({...savedForm, amount: e.target.value})}
                  placeholder="0,00"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" className="btn btn-secondary px-6" onClick={() => setShowSavedModal(false)}>Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary px-8">
                  {isSubmitting ? "Salvando..." : (editingSaved ? "Atualizar" : "Confirmar")}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL PROJECTION */}
      {showProjModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowProjModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button aria-label="Fechar" className="modal-close" onClick={() => setShowProjModal(false)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <h2 className="text-xl font-bold mb-8">{editingProj ? 'Editar Recorrência' : 'Nova Recorrência'}</h2>
            
            <form onSubmit={handleAddProj} className="flex flex-col gap-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Natureza</label>
                    <select 
                      className="input-base w-full" 
                      value={projForm.type}
                      onChange={e => setProjForm({...projForm, type: e.target.value, category: e.target.value === 'income' ? 'Entradas' : 'Fixos'})}
                    >
                      <option value="expense">Despesa</option>
                      <option value="income">Receita</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Categoria</label>
                    <input 
                      type="text"
                      className="input-base w-full"
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
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Descrição</label>
                <input 
                  type="text" 
                  className="input-base w-full" 
                  value={projForm.description}
                  onChange={e => setProjForm({...projForm, description: e.target.value})}
                  placeholder="Ex: Aluguel, Internet, Salário..."
                  required
                  autoComplete="off"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Valor (R$)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="input-base w-full" 
                      value={projForm.amount}
                      onChange={e => setProjForm({...projForm, amount: e.target.value})}
                      placeholder="0,00"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Plano inicia em</label>
                    <input 
                      type="date" 
                      className="input-base w-full" 
                      value={projForm.startDate}
                      onChange={e => setProjForm({...projForm, startDate: e.target.value})}
                      required
                    />
                  </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" className="btn btn-secondary px-6" onClick={() => setShowProjModal(false)}>Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary px-8">
                  {isSubmitting ? "Salvando..." : (editingProj ? "Salvar" : "Salvar")}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        show={deleteConfirm.show}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        danger={true}
        confirmLabel="Excluir"
        onCancel={() => setDeleteConfirm({ ...deleteConfirm, show: false })}
        onConfirm={deleteConfirm.action}
      />

    </div>
  );
}

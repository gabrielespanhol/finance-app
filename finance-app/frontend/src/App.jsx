import { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import Overview from "./pages/Overview";
import CategoriesPage from "./pages/CategoriesPage";

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [dark, setDark] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <div className="min-h-screen p-6 transition-colors">
      <header className="container-main mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold">Finance</h1>
            <nav className="flex items-center gap-4 bg-transparent rounded-2xl p-1 ml-4">
              {["dashboard", "planejamento", "categorias"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`btn px-4 py-2 border-0 ${
                    tab === t
                      ? "btn-primary"
                      : "text-muted"
                  }`}
                >
                  {t === "dashboard" ? "Dashboard" : t === "planejamento" ? "Visão Geral" : "Categorias"}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
              <span className="text-xs">Claro</span>
              <button
                onClick={() => setDark(!dark)}
                className={`relative w-12 h-6 rounded-full transition-colors ${dark ? "bg-[#111214]" : "bg-gray-200"}`}
                aria-label="Alternar tema"
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${dark ? "right-1" : "left-1"}`} />
              </button>
              <span className="text-xs">Escuro</span>
            </label>
          </div>
        </div>
      </header>

      <main className="container-main">
        {tab === "dashboard" && <Dashboard dark={dark} setDark={setDark} />}
        {tab === "planejamento" && <Overview dark={dark} setDark={setDark} />}
        {tab === "categorias" && <CategoriesPage dark={dark} setDark={setDark} />}
      </main>
    </div>
  );
}

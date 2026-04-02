import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Overview from "./pages/Overview";
import CategoriesPage from "./pages/CategoriesPage";

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [dark, setDark] = useState(true);

  return (
    <div
      className={`${dark ? "bg-[#181A20] text-[#EAECEF]" : "bg-gray-50 text-gray-900"} min-h-screen p-6 transition-colors`}
    >
      <header className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold">Finance</h1>
            <nav className="flex bg-transparent rounded-2xl p-1">
              {["dashboard", "planejamento", "categorias"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 rounded-2xl text-sm font-medium transition-colors ${
                    tab === t
                      ? "bg-[#FCD535] text-black"
                      : `${dark ? "text-[#9CA3AF]" : "text-gray-500"}`
                  }`}
                >
                  {t === "dashboard" ? "Dashboard" : t === "planejamento" ? "Overview" : "Categorias"}
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
        {tab === "dashboard" && <Dashboard dark={dark} setDark={setDark} />}
        {tab === "planejamento" && <Overview dark={dark} setDark={setDark} />}
        {tab === "categorias" && <CategoriesPage dark={dark} setDark={setDark} />}
      </main>
    </div>
  );
}

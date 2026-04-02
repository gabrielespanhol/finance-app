import React from "react";
import { formatCurrency } from "../utils/format";
import { categories } from "../utils/categories";

export default function TransactionsTable({
  tableData,
  selectedIds,
  setSelectedIds,
  setSelected,
  dark,
}) {
  return (
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
                      if (e.target.checked) setSelectedIds((s) => [...s, t.id]);
                      else setSelectedIds((s) => s.filter((id) => id !== t.id));
                    }}
                  />
                </td>
                <td className="p-3 text-sm">{t.date}</td>
                <td className="p-3 text-sm">{t.description || ""}</td>
                <td className="p-3 text-sm">
                  {t.type === "income" ? (
                    <span style={{ color: dark ? "#EAECEF" : undefined }}>
                      -
                    </span>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span
                        className="w-4 h-4 rounded-full"
                        style={{ background: categories[t.category] }}
                      />
                      <span style={{ color: dark ? "#EAECEF" : undefined }}>
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
  );
}

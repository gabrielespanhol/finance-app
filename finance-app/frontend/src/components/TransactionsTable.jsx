import React from "react";
import { formatCurrency } from "../utils/format";

export default function TransactionsTable({
  tableData,
  selectedIds,
  setSelectedIds,
  setSelected,
  dark,
  categories = {},
}) {
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                className="checkbox-custom"
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
            <th>Data</th>
            <th>Descrição</th>
            <th>Categoria</th>
            <th className="text-right">Valor</th>
          </tr>
        </thead>
        <tbody>
          {tableData.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-6 text-center text-sm text-muted">
                No data available
              </td>
            </tr>
          ) : (
            tableData.map((t) => (
              <tr
                key={t.id}
                onClick={() => setSelected(t)}
                className="cursor-pointer"
              >
                <td>
                  <input
                    onClick={(e) => e.stopPropagation()}
                    type="checkbox"
                    className="checkbox-custom"
                    checked={selectedIds.includes(t.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds((s) => [...s, t.id]);
                      else setSelectedIds((s) => s.filter((id) => id !== t.id));
                    }}
                  />
                </td>
                <td>{t.date}</td>
                <td>{t.description || ""}</td>
                <td>
                  {t.type === "income" ? (
                    "-"
                  ) : (
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block"
                        style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          backgroundColor: categories[t.category] || '#888888',
                          flexShrink: 0
                        }}
                      />
                      <span className="text-sm">{t.category}</span>
                    </div>
                  )}
                </td>
                <td
                  className={`text-right ${t.type === "expense" ? "text-danger" : "text-success"}`}
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

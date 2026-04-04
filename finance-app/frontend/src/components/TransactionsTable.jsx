import React, { useState, useMemo } from "react";
import { formatCurrency, formatDate } from "../utils/format";

export default function TransactionsTable({
  tableData,
  selectedIds,
  setSelectedIds,
  setSelected,
  dark,
  categories = {},
}) {
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    let sortableItems = [...tableData];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'amount') {
          aValue = Number(aValue);
          bValue = Number(bValue);
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [tableData, sortConfig]);

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <span className="ml-1 opacity-20">↕</span>;
    }
    return <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th style={{ width: '48px', textAlign: 'center' }}>
              <input
                type="checkbox"
                className="checkbox-custom mx-auto"
                checked={
                  selectedIds.length === sortedData.length &&
                  sortedData.length > 0
                }
                onChange={(e) => {
                  if (e.target.checked)
                    setSelectedIds(sortedData.map((f) => f.id));
                  else setSelectedIds([]);
                }}
              />
            </th>
            <th 
              className="cursor-pointer select-none" 
              onClick={() => handleSort('date')}
              style={{ textAlign: 'left', width: '140px' }}
            >
              Data <SortIcon columnKey="date" />
            </th>
            <th style={{ textAlign: 'left' }}>Descrição</th>
            <th style={{ textAlign: 'left', width: '180px' }}>Categoria</th>
            <th 
              className="text-right cursor-pointer select-none" 
              onClick={() => handleSort('amount')}
              style={{ textAlign: 'right', width: '140px' }}
            >
              Valor <SortIcon columnKey="amount" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-10 text-center text-sm text-muted">
                Nenhuma transação encontrada
              </td>
            </tr>
          ) : (
            sortedData.map((t) => (
              <tr
                key={t.id}
                onClick={() => setSelected(t)}
                className="cursor-pointer hover:bg-surface-inner transition-colors"
                style={{ verticalAlign: 'middle' }}
              >
                <td style={{ textAlign: 'center' }}>
                  <input
                    onClick={(e) => e.stopPropagation()}
                    type="checkbox"
                    className="checkbox-custom mx-auto"
                    checked={selectedIds.includes(t.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds((s) => [...s, t.id]);
                      else setSelectedIds((s) => s.filter((id) => id !== t.id));
                    }}
                  />
                </td>
                <td className="whitespace-nowrap" style={{ textAlign: 'left' }}>
                  {formatDate(t.date)}
                </td>
                <td style={{ textAlign: 'left' }}>{t.description || ""}</td>
                <td style={{ textAlign: 'left' }}>
                  {t.type === "income" ? (
                    <span className="text-muted opacity-40">—</span>
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
                      <span className="text-sm truncate max-w-[150px]">{t.category}</span>
                    </div>
                  )}
                </td>
                <td
                  className={`text-right font-medium ${t.type === "expense" ? "text-danger" : "text-success"}`}
                  style={{ textAlign: 'right' }}
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

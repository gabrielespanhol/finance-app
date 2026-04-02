export const formatCurrency = (v) => {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  if (isNaN(n)) return "";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export const parseCurrencyInput = (s) => {
  if (!s) return null;
  const cleaned = String(s)
    .replace(/[^0-9\-.,]/g, "")
    .replace(/\.(?=.*\.)/g, "")
    .replace(",", ".");
  const n = Number(cleaned);
  return isNaN(n) ? null : n;
};

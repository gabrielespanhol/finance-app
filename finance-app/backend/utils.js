// Utilities: date and number parsing and simple categorization
const { REGRAS_EXTRATO } = require('./interfaces/categories');

function toISODate(val) {
  if (!val) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
    const [d, m, y] = val.split("/");
    return `${y}-${m}-${d}`;
  }
  const m = val.match(/^(\d{4})(\d{2})(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(val);
  if (!isNaN(d)) {
    return d.toISOString().slice(0, 10);
  }
  return null;
}

function toNumber(val) {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "number") return val;
  let s = String(val).trim();

  // Handle Brazilian format explicitly: e.g. "4.382,38" -> "4382.38" | "-15,00" -> "-15.00"
  if (/^-?(?:\d{1,3}(?:\.\d{3})+|\d+),\d{2}$/.test(s)) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    s = s.replace(/[^0-9\-.,]/g, "");
    // If it has a single comma and no dots (e.g. "15,00"), assume comma is decimal
    if (s.includes(",") && !s.includes(".")) {
      s = s.replace(",", ".");
    } else if (s.includes(",") && s.includes(".")) {
      // If both, assume the last one is the decimal
      const lastComma = s.lastIndexOf(",");
      const lastDot = s.lastIndexOf(".");
      if (lastComma > lastDot) {
        s = s.replace(/\./g, "").replace(",", ".");
      } else {
        s = s.replace(/,/g, "");
      }
    }
  }

  const n = Number(s);
  if (isNaN(n)) return null;
  return n;
}


function categorize(description, amount) {
  if (!description) return "Outros";

  const s = description.toLowerCase();

  // Busca a primeira regra que valida o texto
  const match = REGRAS_EXTRATO.find((regra) =>
    regra.regex.test(s)
  );

  return match ? match.categoria : "Outros";
}

function resolveTransactionType(amount, description, source) {
  if (source === "csv") {
    if (/estorno/i.test(description)) return "income";
    return "expense";
  }
  // pdf, ofx, etc.
  return amount < 0 ? "expense" : "income";
}

module.exports = { toISODate, toNumber, categorize, resolveTransactionType };

// Utilities: date and number parsing and simple categorization

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
  const s = String(val)
    .replace(/[^0-9\-.,]/g, "")
    .replace(",", ".");
  const n = Number(s);
  if (isNaN(n)) return null;
  return n;
}

function categorize(description, amount) {
  if (!description) return "Outros";
  const s = description.toLowerCase();
  if (/uber|99/.test(s)) return "Transporte";
  if (/ifood|restaurant|restaurante|mercado|supermercado/.test(s))
    return "Alimentação";
  if (/rent|aluguel|condomínio/.test(s)) return "Moradia";
  return "Outros";
}

module.exports = { toISODate, toNumber, categorize };

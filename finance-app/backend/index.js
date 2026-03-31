const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

const db = new sqlite3.Database("./database.db");

const VALID_CATEGORIES = [
  "Alimentação",
  "Moradia",
  "Transporte",
  "Lazer",
  "Investimentos",
  "Saúde",
  "Outros",
];

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

// Tabela
db.run(`
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT,
  amount REAL,
  type TEXT,
  category TEXT,
  person TEXT,
  description TEXT
)
`);

// CRUD
app.get("/transactions", (req, res) => {
  db.all(`SELECT * FROM transactions`, [], (err, rows) => {
    if (err) return res.status(500).send(err);
    res.json(rows);
  });
});

app.post("/transactions", (req, res) => {
  const { date, amount, type, category, person, description } = req.body;

  // required fields
  const isoDate = toISODate(date);
  const num = toNumber(amount);
  if (!isoDate || num === null || !type || !category) {
    return res
      .status(400)
      .json({
        error: "date, amount, type and category are required and must be valid",
      });
  }

  const finalCategory = VALID_CATEGORIES.includes(category)
    ? category
    : "Outros";

  db.run(
    `INSERT INTO transactions (date, amount, type, category, person, description)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [isoDate, num, type, finalCategory, person || null, description || null],
    function (err) {
      if (err) return res.status(500).send(err);
      res.json({ id: this.lastID });
    },
  );
});

app.put("/transactions/:id", (req, res) => {
  const { id } = req.params;
  const { date, amount, type, category, person, description } = req.body;

  // validate provided fields
  const updates = [];
  const params = [];
  if (date !== undefined) {
    const iso = toISODate(date);
    if (!iso) return res.status(400).json({ error: "invalid date" });
    updates.push("date=?");
    params.push(iso);
  }
  if (amount !== undefined) {
    const num = toNumber(amount);
    if (num === null) return res.status(400).json({ error: "invalid amount" });
    updates.push("amount=?");
    params.push(num);
  }
  if (type !== undefined) {
    if (!type) return res.status(400).json({ error: "invalid type" });
    updates.push("type=?");
    params.push(type);
  }
  if (category !== undefined) {
    const finalCategory = VALID_CATEGORIES.includes(category)
      ? category
      : "Outros";
    updates.push("category=?");
    params.push(finalCategory);
  }
  if (person !== undefined) {
    updates.push("person=?");
    params.push(person);
  }
  if (description !== undefined) {
    updates.push("description=?");
    params.push(description);
  }

  if (updates.length === 0)
    return res.status(400).json({ error: "no updatable fields provided" });

  params.push(id);
  const sql = `UPDATE transactions SET ${updates.join(", ")} WHERE id=?`;
  db.run(sql, params, function (err) {
    if (err) return res.status(500).send(err);
    res.sendStatus(200);
  });
});

app.delete("/transactions/:id", (req, res) => {
  db.run(`DELETE FROM transactions WHERE id=?`, [req.params.id], () => {
    res.sendStatus(200);
  });
});

// Upload CSV (simples)
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "file missing" });
  const name = req.file.originalname || req.file.filename;
  const ext = (name.split(".").pop() || "").toLowerCase();
  const content = fs.readFileSync(req.file.path, "utf-8");

  const items = [];

  if (ext === "ofx") {
    // basic OFX parser: capture <STMTTRN> blocks
    const matches = content.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) || [];
    matches.forEach((blk) => {
      const dt = (blk.match(/<DTPOSTED>([^<\s]+)/i) || [])[1];
      const amt = (blk.match(/<TRNAMT>([^<\s]+)/i) || [])[1];
      const name = (blk.match(/<NAME>([^<\n]+)/i) || [])[1] || "";
      const memo = (blk.match(/<MEMO>([^<\n]+)/i) || [])[1] || "";
      const date = toISODate(dt);
      const amount = toNumber(amt);
      items.push({ date, amount, description: (name || memo).trim() });
    });
  } else {
    // assume CSV-like
    const lines = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    let start = 0;
    // detect header
    if (lines.length > 0 && /date|amount|descricao|description/i.test(lines[0]))
      start = 1;
    for (let i = start; i < lines.length; i++) {
      const line = lines[i];
      const parts = line.split(",").map((p) => p.trim());
      // try common orders: date,desc,amount OR date,amount,desc
      let date = parts[0];
      let amount = parts[2] || parts[1];
      let description = parts[1] || parts[2] || "";
      date = toISODate(date);
      amount = toNumber(amount);
      items.push({ date, amount, description });
    }
  }

  // categorization keywords
  function categorize(description, amount) {
    if (!description) return "Outros";
    const s = description.toLowerCase();
    if (/uber|99/.test(s)) return "Transporte";
    if (/ifood|restaurant|restaurante|mercado|supermercado/.test(s))
      return "Alimentação";
    if (/rent|aluguel|condomínio/.test(s)) return "Moradia";
    return "Outros";
  }

  const inserted = [];
  const skipped = [];

  items.forEach((it) => {
    const date = it.date;
    const amount = it.amount;
    const description = it.description || "";
    if (!date || amount === null) {
      skipped.push({ ...it, reason: "invalid" });
      return;
    }
    const type = amount > 0 ? "income" : "expense";
    const category = categorize(description, amount);

    // check duplicate
    const sql = `SELECT COUNT(*) as c FROM transactions WHERE date=? AND amount=? AND description=?`;
    db.get(sql, [date, amount, description], (err, row) => {
      if (err) {
        skipped.push({ ...it, reason: "db" });
        return;
      }
      if (row && row.c > 0) {
        skipped.push({ ...it, reason: "duplicate" });
        return;
      }
      db.run(
        `INSERT INTO transactions (date, amount, type, category, description) VALUES (?, ?, ?, ?, ?)`,
        [date, amount, type, category, description],
        function (err) {
          if (err) skipped.push({ ...it, reason: "db" });
          else
            inserted.push({
              id: this.lastID,
              date,
              amount,
              type,
              category,
              description,
            });
        },
      );
    });
  });

  // cleanup file
  try {
    fs.unlinkSync(req.file.path);
  } catch (e) {}

  // respond after short delay to allow DB inserts to complete
  setTimeout(() => {
    res.json({
      imported: inserted.length,
      skipped: skipped.length,
      skippedItems: skipped,
    });
  }, 300);
});

app.listen(3001, () => console.log("Backend rodando"));

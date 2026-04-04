const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Database initialization and table creation
const dbPath = path.resolve(__dirname, "./database.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
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
  // categories table for centralized category management
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      color TEXT
    )
  `);

  // Seed default categories (INSERT OR IGNORE)
  const defaults = [
    ["Alimentação", "#f97316"],     // laranja (comida → quente/apetite)
    ["Moradia", "#7c3aed"],        // roxo (estável, custo alto)
    ["Transporte", "#2563eb"],     // azul (movimento, deslocamento)
    ["Lazer", "#033e49ff"],          // azul claro (leve, diversão)
    ["Investimentos", "#74f0a1ff"],  // verde (crescimento financeiro)
    ["Saúde", "#fc8282ff"],          // vermelho suave (atenção/cuidado)
    ["Outros", "#6b7280"],         // cinza (neutro)
    ["Aurora", "#d946ef"],         // rosa/roxo vibrante (diferente mesmo)
    ["Compras", "#ec1438ff"],        // rosa/vermelho (consumo)
    ["Financiamento", "#0ea5e9"],  // azul médio (institucional/banco)
    ["Educação", "#09ecd2ff"],       // verde-água (conhecimento/equilíbrio)
    ["Dizimo", "#ead708ff"],         // amarelo (espiritual/oferta)
    ["Pessoal", "#08aa74ff"]         // verde mais suave (vida pessoal)
  ];
  const stmt = db.prepare(
    `INSERT OR IGNORE INTO categories (name, color) VALUES (?, ?)`
  );
  defaults.forEach((d) => stmt.run(d[0], d[1]));
  stmt.finalize(() => {
    // Migration: add category_id column if not exists
    db.run(`ALTER TABLE transactions ADD COLUMN category_id INTEGER`, function (err) {
      // It will err if column already exists.
      // Next, migrate current transactions to have proper category_id
      db.run(`
        UPDATE transactions 
        SET category_id = (SELECT id FROM categories WHERE categories.name = transactions.category)
        WHERE category_id IS NULL
      `, function (err) {
        if (err) console.error("Migration phase 1 error:", err);
        // Fallback any remaining nulls to Outros
        db.run(`
          UPDATE transactions
          SET category_id = (SELECT id FROM categories WHERE name = 'Outros')
          WHERE category_id IS NULL
        `);
      });
    });
  });
});

module.exports = db;

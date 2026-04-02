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
    ["Alimentação", "#ff5900"],
    ["Moradia", "#7f304d"],
    ["Transporte", "#ca8712"],
    ["Lazer", "#55b1f7"],
    ["Investimentos", "#f3ff18"],
    ["Saúde", "#69f009"],
    ["Outros", "#6b7280"],
    ["Aurora", "#ee11c6"],
  ];
  const stmt = db.prepare(
    `INSERT OR IGNORE INTO categories (name, color) VALUES (?, ?)`,
  );
  defaults.forEach((d) => stmt.run(d[0], d[1]));
  stmt.finalize();
});

module.exports = db;

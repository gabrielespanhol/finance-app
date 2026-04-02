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
    ["Alimentação", "#22c55e"],
    ["Moradia", "#3b82f6"],
    ["Transporte", "#f59e0b"],
    ["Lazer", "#a855f7"],
    ["Investimentos", "#10b981"],
    ["Saúde", "#ef4444"],
    ["Outros", "#6b7280"],
    ["Aurora", "#7c3aed"],
  ];
  const stmt = db.prepare(
    `INSERT OR IGNORE INTO categories (name, color) VALUES (?, ?)`,
  );
  defaults.forEach((d) => stmt.run(d[0], d[1]));
  stmt.finalize();
});

module.exports = db;

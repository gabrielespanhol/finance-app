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
});

module.exports = db;

const db = require("../db");
const { toISODate, toNumber, categorize } = require("../utils");

// Helper to reliably resolve a category ID and name from a given string
function getCategoryId(name, callback) {
  db.get(`SELECT id, name FROM categories WHERE name = ?`, [name], (err, row) => {
    if (err) return callback(err);
    if (row && row.name) return callback(null, row);
    
    // Fallback to Outros
    db.get(`SELECT id, name FROM categories WHERE name = 'Outros'`, (err2, outRow) => {
      if (err2) return callback(err2);
      callback(null, outRow);
    });
  });
}

// Fetch all transactions with JOIN to maintain UI string compatibility via category_id
function getAllTransactions(callback) {
  const sql = `
    SELECT t.*, c.name as category_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return callback(err);
    
    // Map back into simple objects so frontend UI does not break
    const mapped = rows.map((r) => {
      const { category_name, ...rest } = r;
      // Guarantee string existence for backwards compatibility
      return { ...rest, category: category_name || "Outros" }; 
    });
    callback(null, mapped);
  });
}

// Create a new transaction with validation
function createTransaction(payload, callback) {
  const { date, amount, type, category, person, description } = payload;
  const isoDate = toISODate(date);
  const num = toNumber(amount);
  if (!isoDate || num === null || !type || !category) {
    return callback({
      status: 400,
      error: "date, amount, type and category are required and must be valid",
    });
  }

  // Map incoming string 'category' to real id
  getCategoryId(category, (err, catData) => {
    if (err) return callback(err);
    db.run(
      `INSERT INTO transactions (date, amount, type, category, category_id, person, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [isoDate, num, type, catData.name, catData.id, person || null, description || null],
      function (err) {
        if (err) return callback(err);
        callback(null, { id: this.lastID });
      }
    );
  });
}

// Update transaction fields
function updateTransaction(id, payload, callback) {
  const { date, amount, type, category, person, description } = payload;
  const updates = [];
  const params = [];

  if (date !== undefined) {
    const iso = toISODate(date);
    if (!iso) return callback({ status: 400, error: "invalid date" });
    updates.push("date=?"); params.push(iso);
  }
  if (amount !== undefined) {
    const num = toNumber(amount);
    if (num === null) return callback({ status: 400, error: "invalid amount" });
    updates.push("amount=?"); params.push(num);
  }
  if (type !== undefined) {
    if (!type) return callback({ status: 400, error: "invalid type" });
    updates.push("type=?"); params.push(type);
  }

  const proceedUpdate = (finalCategoryValue, finalCategoryId) => {
    if (finalCategoryValue !== undefined && finalCategoryId !== undefined) {
      updates.push("category=?"); params.push(finalCategoryValue);
      updates.push("category_id=?"); params.push(finalCategoryId);
    }
    if (person !== undefined) { updates.push("person=?"); params.push(person); }
    if (description !== undefined) { updates.push("description=?"); params.push(description); }
    
    if (updates.length === 0)
      return callback({ status: 400, error: "no updatable fields provided" });
      
    params.push(id);
    const sql = `UPDATE transactions SET ${updates.join(", ")} WHERE id=?`;
    db.run(sql, params, function (err) {
      if (err) return callback(err);
      callback(null);
    });
  };

  // If category was explicitly mutated, resolve ID first
  if (category !== undefined) {
    getCategoryId(category, (err, catData) => {
      if (err) return callback(err);
      proceedUpdate(catData.name, catData.id);
    });
  } else {
    proceedUpdate(undefined, undefined);
  }
}

// Delete transaction
function deleteTransaction(id, callback) {
  db.run(`DELETE FROM transactions WHERE id=?`, [id], function (err) {
    if (err) return callback(err);
    callback(null);
  });
}

// Process and insert multiple parsed items (from upload) 
function processUploadItems(items, done) {
  const inserted = [];
  const skipped = [];
  let processed = 0;
  if (!items || items.length === 0) return done({ inserted, skipped });

  // Outros cache optimization for batch inserts
  db.get(`SELECT id, name FROM categories WHERE name = 'Outros'`, (err, fallbackRow) => {
    
    items.forEach((it) => {
      const date = it.date;
      let amount = it.amount;
      const description = it.description || "";
      if (!date || amount === null) {
        skipped.push({ ...it, reason: "invalid" });
        processed += 1;
        if (processed === items.length) return done({ inserted, skipped });
        return;
      }
      
      const type = amount < 0 ? "expense" : "income";
      amount = Math.abs(amount);
      // Auto categorize attempts to guess string
      const categoryStr = categorize(description, amount);
      
      db.get(`SELECT id, name FROM categories WHERE name = ?`, [categoryStr], (e, row) => {
        const catData = row || fallbackRow;

        const sql = `SELECT COUNT(*) as c FROM transactions WHERE date=? AND amount=? AND description=?`;
        db.get(sql, [date, amount, description], (errCount, countRow) => {
          if (errCount) {
            skipped.push({ ...it, reason: "db" });
            processed += 1;
            if (processed === items.length) return done({ inserted, skipped });
            return;
          }
          if (countRow && countRow.c > 0) {
            skipped.push({ ...it, reason: "duplicate" });
            processed += 1;
            if (processed === items.length) return done({ inserted, skipped });
            return;
          }

          db.run(
            `INSERT INTO transactions (date, amount, type, category, category_id, description) VALUES (?, ?, ?, ?, ?, ?)`,
            [date, amount, type, catData.name, catData.id, description],
            function (insertErr) {
              if (insertErr) skipped.push({ ...it, reason: "db" });
              else inserted.push({ id: this.lastID, date, amount, type, category: catData.name, description });
              
              processed += 1;
              if (processed === items.length) return done({ inserted, skipped });
            }
          );
        });
      });
    });
  });
}

module.exports = {
  getAllTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  processUploadItems,
};

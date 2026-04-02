const db = require("../db");
const { toISODate, toNumber, categorize } = require("../utils");

// Fetch all transactions
function getAllTransactions(callback) {
  db.all(`SELECT * FROM transactions`, [], callback);
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
  // validate category exists in categories table, fallback to 'Outros'
  db.get(
    `SELECT name FROM categories WHERE name = ?`,
    [category],
    (err, row) => {
      if (err) return callback(err);
      const finalCategory = row && row.name ? row.name : "Outros";
      db.run(
        `INSERT INTO transactions (date, amount, type, category, person, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
        [
          isoDate,
          num,
          type,
          finalCategory,
          person || null,
          description || null,
        ],
        function (err) {
          if (err) return callback(err);
          callback(null, { id: this.lastID });
        },
      );
    },
  );
}

// Update transaction fields
function updateTransaction(id, payload, callback) {
  const { date, amount, type, category, person, description } = payload;
  const updates = [];
  const params = [];
  if (date !== undefined) {
    const iso = toISODate(date);
    if (!iso) return callback({ status: 400, error: "invalid date" });
    updates.push("date=?");
    params.push(iso);
  }
  if (amount !== undefined) {
    const num = toNumber(amount);
    if (num === null) return callback({ status: 400, error: "invalid amount" });
    updates.push("amount=?");
    params.push(num);
  }
  if (type !== undefined) {
    if (!type) return callback({ status: 400, error: "invalid type" });
    updates.push("type=?");
    params.push(type);
  }
  const proceedUpdate = (finalCategoryValue) => {
    if (finalCategoryValue !== undefined) {
      updates.push("category=?");
      params.push(finalCategoryValue);
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
      return callback({ status: 400, error: "no updatable fields provided" });
    params.push(id);
    const sql = `UPDATE transactions SET ${updates.join(", ")} WHERE id=?`;
    db.run(sql, params, function (err) {
      if (err) return callback(err);
      callback(null);
    });
  };
  // if category was provided, validate against categories table first
  if (category !== undefined) {
    db.get(
      `SELECT name FROM categories WHERE name = ?`,
      [category],
      (err, row) => {
        if (err) return callback(err);
        const finalCategory = row && row.name ? row.name : "Outros";
        proceedUpdate(finalCategory);
      },
    );
  } else {
    proceedUpdate(undefined);
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

  items.forEach((it) => {
    const date = it.date;
    const amount = it.amount;
    const description = it.description || "";
    if (!date || amount === null) {
      skipped.push({ ...it, reason: "invalid" });
      processed += 1;
      if (processed === items.length) done({ inserted, skipped });
      return;
    }
    const type = amount > 0 ? "income" : "expense";
    const category = categorize(description, amount);

    const sql = `SELECT COUNT(*) as c FROM transactions WHERE date=? AND amount=? AND description=?`;
    db.get(sql, [date, amount, description], (err, row) => {
      if (err) {
        skipped.push({ ...it, reason: "db" });
        processed += 1;
        if (processed === items.length) done({ inserted, skipped });
        return;
      }
      if (row && row.c > 0) {
        skipped.push({ ...it, reason: "duplicate" });
        processed += 1;
        if (processed === items.length) done({ inserted, skipped });
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
          processed += 1;
          if (processed === items.length) done({ inserted, skipped });
        },
      );
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

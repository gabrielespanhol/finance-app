const db = require("../db");

function getAllCategories(callback) {
  db.all(`SELECT id, name, color FROM categories ORDER BY name`, [], callback);
}

function createCategory(payload, callback) {
  const { name, color } = payload;
  if (!name || !color) return callback({ status: 400, error: "name and color required" });
  db.run(`INSERT INTO categories (name, color) VALUES (?, ?)`, [name, color], function (err) {
    if (err) {
      if (err.message && err.message.includes("UNIQUE constraint failed")) {
        return callback({ status: 400, error: "category already exists" });
      }
      return callback(err);
    }
    callback(null, { id: this.lastID, name, color });
  });
}

function updateCategory(id, payload, callback) {
  const { name, color } = payload;
  if (name === undefined && color === undefined) {
    return callback({ status: 400, error: "no updatable fields" });
  }

  db.get(`SELECT name FROM categories WHERE id = ?`, [id], (err, row) => {
    if (err) return callback(err);
    if (!row) return callback({ status: 404, error: "category not found" });

    const oldName = row.name;

    const updates = [];
    const params = [];
    if (name !== undefined) { updates.push("name=?"); params.push(name); }
    if (color !== undefined) { updates.push("color=?"); params.push(color); }
    params.push(id);

    db.run(`UPDATE categories SET ${updates.join(", ")} WHERE id=?`, params, function(err) {
      if (err) {
        if (err.message && err.message.includes("UNIQUE constraint failed")) {
          return callback({ status: 400, error: "category already exists" });
        }
        return callback(err);
      }
      
      if (name !== undefined && name !== oldName) {
        db.run(`UPDATE transactions SET category = ? WHERE category_id = ?`, [name, id], function(err2) {
          if (err2) return callback(err2);
          callback(null);
        });
      } else {
        callback(null);
      }
    });
  });
}

function deleteCategory(id, callback) {
  db.run(`INSERT OR IGNORE INTO categories (name, color) VALUES (?, ?)`, ["Outros", "#6b7280"], function (err) {
    if (err) return callback(err);

    db.get(`SELECT id, name FROM categories WHERE name = 'Outros'`, (err, outRow) => {
      if (err) return callback(err);
      if (!outRow) return callback({ status: 500, error: "Unable to resolve 'Outros'" });

      db.get(`SELECT name FROM categories WHERE id = ?`, [id], (err, row) => {
        if (err) return callback(err);
        if (!row) return callback({ status: 404, error: "category not found" });

        const catName = row.name;

        if (catName === "Outros") {
          return callback({ status: 400, error: "Cannot delete the default 'Outros' category." });
        }

        db.run(`UPDATE transactions SET category = ?, category_id = ? WHERE category_id = ?`, ["Outros", outRow.id, id], function (err2) {
          if (err2) return callback(err2);

          db.run(`DELETE FROM categories WHERE id=?`, [id], function(err3) {
            if (err3) return callback(err3);
            callback(null);
          });
        });
      });
    });
  });
}

module.exports = { getAllCategories, createCategory, updateCategory, deleteCategory };

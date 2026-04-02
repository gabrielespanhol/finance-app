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
  const updates = [];
  const params = [];
  if (name !== undefined) { updates.push("name=?"); params.push(name); }
  if (color !== undefined) { updates.push("color=?"); params.push(color); }
  if (updates.length === 0) return callback({ status: 400, error: "no updatable fields" });
  params.push(id);
  db.run(`UPDATE categories SET ${updates.join(", ")} WHERE id=?`, params, function(err) {
    if (err) {
      if (err.message && err.message.includes("UNIQUE constraint failed")) {
        return callback({ status: 400, error: "category already exists" });
      }
      return callback(err);
    }
    callback(null);
  });
}

function deleteCategory(id, callback) {
  db.run(`DELETE FROM categories WHERE id=?`, [id], function(err) {
    if (err) return callback(err);
    callback(null);
  });
}

module.exports = { getAllCategories, createCategory, updateCategory, deleteCategory };

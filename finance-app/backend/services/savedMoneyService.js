const db = require("../db");

function getAllSavedMoney(callback) {
  db.all("SELECT * FROM saved_money ORDER BY createdAt DESC", [], (err, rows) => {
    callback(err, rows);
  });
}

function createSavedMoney(payload, callback) {
  const { amount, description } = payload;
  const createdAt = new Date().toISOString();
  db.run(
    "INSERT INTO saved_money (amount, description, createdAt) VALUES (?, ?, ?)",
    [amount, description, createdAt],
    function (err) {
      if (err) return callback(err);
      callback(null, { id: this.lastID, amount, description, createdAt });
    }
  );
}

function deleteSavedMoney(id, callback) {
  db.run("DELETE FROM saved_money WHERE id = ?", [id], function (err) {
    callback(err);
  });
}

function updateSavedMoney(id, payload, callback) {
  const { amount, description } = payload;
  db.run(
    "UPDATE saved_money SET amount = ?, description = ? WHERE id = ?",
    [amount, description, id],
    function (err) {
      callback(err);
    }
  );
}

module.exports = {
  getAllSavedMoney,
  createSavedMoney,
  deleteSavedMoney,
  updateSavedMoney,
};

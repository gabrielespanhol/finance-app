const db = require("../db");

function getAllProjections(callback) {
  db.all("SELECT * FROM projections", [], (err, rows) => {
    callback(err, rows);
  });
}

function createProjection(payload, callback) {
  const { type, category, amount, description, recurrence, startDate } = payload;
  db.run(
    "INSERT INTO projections (type, category, amount, description, recurrence, startDate) VALUES (?, ?, ?, ?, ?, ?)",
    [type, category, amount, description, recurrence || "monthly", startDate],
    function (err) {
      if (err) return callback(err);
      callback(null, { id: this.lastID, type, category, amount, description, recurrence, startDate });
    }
  );
}

function deleteProjection(id, callback) {
  db.run("DELETE FROM projections WHERE id = ?", [id], function (err) {
    callback(err);
  });
}

function updateProjection(id, payload, callback) {
  const { type, category, amount, description, recurrence, startDate } = payload;
  const updates = [];
  const params = [];
  if (type) { updates.push("type=?"); params.push(type); }
  if (category) { updates.push("category=?"); params.push(category); }
  if (amount) { updates.push("amount=?"); params.push(amount); }
  if (description) { updates.push("description=?"); params.push(description); }
  if (recurrence) { updates.push("recurrence=?"); params.push(recurrence); }
  if (startDate) { updates.push("startDate=?"); params.push(startDate); }
  
  if (updates.length === 0) return callback({ status: 400, error: "No fields to update" });
  
  params.push(id);
  const sql = `UPDATE projections SET ${updates.join(", ")} WHERE id=?`;
  db.run(sql, params, function (err) {
    callback(err);
  });
}

module.exports = {
  getAllProjections,
  createProjection,
  deleteProjection,
  updateProjection,
};

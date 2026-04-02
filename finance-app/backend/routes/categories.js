const express = require("express");
const router = express.Router();
const service = require("../services/categoryService");

// GET /categories
router.get("/categories", (req, res) => {
  service.getAllCategories((err, rows) => {
    if (err) return res.status(500).send(err);
    // Explicitly return id, name, color for frontend compatibility but also id for updating
    res.json(rows.map((r) => ({ id: r.id, name: r.name, color: r.color })));
  });
});

// POST /categories
router.post("/categories", (req, res) => {
  service.createCategory(req.body, (err, result) => {
    if (err) {
      if (err.status) return res.status(err.status).json({ error: err.error });
      return res.status(500).send(err);
    }
    res.json(result);
  });
});

// PUT /categories/:id
router.put("/categories/:id", (req, res) => {
  service.updateCategory(req.params.id, req.body, (err) => {
    if (err) {
      if (err.status) return res.status(err.status).json({ error: err.error });
      return res.status(500).send(err);
    }
    res.sendStatus(200);
  });
});

// DELETE /categories/:id
router.delete("/categories/:id", (req, res) => {
  service.deleteCategory(req.params.id, (err) => {
    if (err) return res.status(500).send(err);
    res.sendStatus(200);
  });
});

module.exports = router;

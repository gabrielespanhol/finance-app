const express = require("express");
const multer = require("multer");
const fs = require("fs");
const router = express.Router();
const upload = multer({ dest: "uploads/" });

const service = require("../services/transactionService");
const { toISODate, toNumber } = require("../utils");

// GET /transactions
router.get("/transactions", (req, res) => {
  service.getAllTransactions((err, rows) => {
    if (err) return res.status(500).send(err);
    res.json(rows);
  });
});

// POST /transactions
router.post("/transactions", (req, res) => {
  service.createTransaction(req.body, (err, result) => {
    if (err) {
      if (err.status) return res.status(err.status).json({ error: err.error });
      return res.status(500).send(err);
    }
    res.json(result);
  });
});

// PUT /transactions/:id
router.put("/transactions/:id", (req, res) => {
  service.updateTransaction(req.params.id, req.body, (err) => {
    if (err) {
      if (err.status) return res.status(err.status).json({ error: err.error });
      return res.status(500).send(err);
    }
    res.sendStatus(200);
  });
});

// DELETE /transactions/:id
router.delete("/transactions/:id", (req, res) => {
  service.deleteTransaction(req.params.id, (err) => {
    if (err) return res.status(500).send(err);
    res.sendStatus(200);
  });
});

// Upload endpoint - parse CSV/OFX-like files and insert
router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "file missing" });
  const name = req.file.originalname || req.file.filename;
  const ext = (name.split(".").pop() || "").toLowerCase();
  const content = fs.readFileSync(req.file.path, "utf-8");

  const items = [];

  if (ext === "ofx") {
    const matches = content.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) || [];
    matches.forEach((blk) => {
      const dt = (blk.match(/<DTPOSTED>([^<\s]+)/i) || [])[1];
      const amt = (blk.match(/<TRNAMT>([^<\s]+)/i) || [])[1];
      const name = (blk.match(/<NAME>([^<\n]+)/i) || [])[1] || "";
      const memo = (blk.match(/<MEMO>([^<\n]+)/i) || [])[1] || "";
      const date = toISODate(dt);
      const amount = toNumber(amt);
      items.push({ date, amount, description: (name || memo).trim() });
    });
  } else {
    const lines = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    let start = 0;
    if (lines.length > 0 && /date|amount|descricao|description/i.test(lines[0]))
      start = 1;
    for (let i = start; i < lines.length; i++) {
      const line = lines[i];
      const parts = line.split(",").map((p) => p.trim());
      let date = parts[0];
      let amount = parts[2] || parts[1];
      let description = parts[1] || parts[2] || "";
      date = toISODate(date);
      amount = toNumber(amount);
      items.push({ date, amount, description });
    }
  }

  service.processUploadItems(items, ({ inserted, skipped }) => {
    // cleanup file
    try {
      fs.unlinkSync(req.file.path);
    } catch (e) {}
    res.json({
      imported: inserted.length,
      skipped: skipped.length,
      skippedItems: skipped,
    });
  });
});

module.exports = router;

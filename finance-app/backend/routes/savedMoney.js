const express = require("express");
const router = express.Router();
const service = require("../services/savedMoneyService");

router.get("/saved-money", (req, res) => {
  service.getAllSavedMoney((err, rows) => {
    if (err) return res.status(500).send(err);
    res.json(rows);
  });
});

router.post("/saved-money", (req, res) => {
  service.createSavedMoney(req.body, (err, result) => {
    if (err) return res.status(500).send(err);
    res.json(result);
  });
});

router.put("/saved-money/:id", (req, res) => {
  service.updateSavedMoney(req.params.id, req.body, (err) => {
    if (err) return res.status(500).send(err);
    res.sendStatus(200);
  });
});

router.delete("/saved-money/:id", (req, res) => {
  service.deleteSavedMoney(req.params.id, (err) => {
    if (err) return res.status(500).send(err);
    res.sendStatus(200);
  });
});

module.exports = router;

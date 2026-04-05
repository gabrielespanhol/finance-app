const express = require("express");
const router = express.Router();
const service = require("../services/projectionService");

router.get("/projections", (req, res) => {
  service.getAllProjections((err, rows) => {
    if (err) return res.status(500).send(err);
    res.json(rows);
  });
});

router.post("/projections", (req, res) => {
  service.createProjection(req.body, (err, result) => {
    if (err) return res.status(500).send(err);
    res.json(result);
  });
});

router.put("/projections/:id", (req, res) => {
  service.updateProjection(req.params.id, req.body, (err) => {
    if (err) {
      if (err.status) return res.status(err.status).json({ error: err.error });
      return res.status(500).send(err);
    }
    res.sendStatus(200);
  });
});

router.delete("/projections/:id", (req, res) => {
  service.deleteProjection(req.params.id, (err) => {
    if (err) return res.status(500).send(err);
    res.sendStatus(200);
  });
});

module.exports = router;

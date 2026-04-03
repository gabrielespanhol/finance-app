const express = require("express");
const multer = require("multer");
const fs = require("fs");
const router = express.Router();

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 }
}).single("file");

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

// Upload endpoint - parse CSV/OFX/PDF files and insert
router.post("/upload", (req, res) => {
  upload(req, res, async (multerErr) => {
    let startTime = Date.now();

    if (multerErr) {
      console.error(`[Upload Failed] Multer: ${multerErr.message}`);
      return res.status(400).json({ success: false, error: `Erro ao enviar arquivo: ${multerErr.message}` });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: "Nenhum arquivo enviado." });
    }

    const { originalname, filename, size, path: filePath, mimetype } = req.file;
    const ext = (originalname.split(".").pop() || "").toLowerCase();

    console.log(`[Upload Initiated] File: ${originalname} | Mime: ${mimetype} | Size: ${size} bytes`);

    const items = [];

    try {
      if (ext === "pdf") {
        if (mimetype !== "application/pdf") {
          throw new Error("Formato de arquivo inválido pela extensão. O arquivo deve ser um PDF.");
        }

        let pdfParse;
        try {
          pdfParse = require("pdf-parse");
        } catch (e) {
          throw new Error("A biblioteca pdf-parse não está instalada no servidor. Rode 'npm install pdf-parse'.");
        }

        const dataBuffer = fs.readFileSync(filePath);
        let data;
        try {
          data = await pdfParse(dataBuffer);
        } catch (parseErr) {
          throw new Error(`Falha ao decodificar a estrutura do PDF: ${parseErr.message}`);
        }

        const lines = data.text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

        let tableStarted = false;
        let headerCount = 0;
        const dateRegex = /^(\d{2}\/\d{2}\/(?:\d{4}|\d{2}))/;
        const currencyRegex = /-?(?:\d{1,3}(?:\.\d{3})+|\d+),\d{2}/g;

        for (let i = 0; i < lines.length; i++) {
          let line = lines[i]; // 1. Mude apenas aqui de 'const' para 'let'

          if (!tableStarted) {
            const l = line.toLowerCase();
            if (l.includes("data") || l.includes("lançamento") || l.includes("lancamento") || l.includes("valor")) {
              headerCount++;
              if (headerCount >= 2 || (l.includes("data") && l.includes("valor"))) {
                tableStarted = true;
              }
            }
            if (dateRegex.test(line) && currencyRegex.test(line)) {
              tableStarted = true;
            }
            if (!tableStarted) continue;
          }

          if (/SALDO DO DIA|SALDO ANTERIOR|SALDO/i.test(line)) continue;

          const dateMatch = line.match(dateRegex);
          if (!dateMatch) continue;

          // 2. ADICIONE ESTAS 3 LINHAS: Isola a data inicial para protegê-la e corrige os valores grudados apenas no resto da linha
          const originalDate = dateMatch[0];
          const restOfLine = line.substring(originalDate.length).replace(/(\d{2}\/\d{2})([-\d])/g, '$1 $2');
          line = originalDate + restOfLine;

          const currencies = line.match(currencyRegex);
          if (!currencies || currencies.length === 0) continue;

          // 3. DAQUI PARA BAIXO, TUDO CONTINUA EXATAMENTE IGUAL AO SEU CÓDIGO ORIGINAL
          let dateStr = dateMatch[1];
          if (dateStr.length === 8) {
            const [d, m, yy] = dateStr.split("/");
            dateStr = `${d}/${m}/20${yy}`;
          }

          const amtStr = currencies[currencies.length - 1];
          const valIndex = line.lastIndexOf(amtStr);
          if (!line.trim().endsWith(amtStr)) continue;

          let description = line.substring(dateMatch[0].length, valIndex).trim();

          const date = toISODate(dateStr);
          const amount = toNumber(amtStr);

          if (!date || amount === null) continue;

          if (description.includes("COF RESGATE CDB") || description.includes("APLICACAO COFRINHOS")) {
            continue;
          }

          items.push({ date, amount, description });
        }

      } else if (ext === "ofx") {
        const content = fs.readFileSync(filePath, "utf-8");
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
        const content = fs.readFileSync(filePath, "utf-8");
        const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        let start = 0;
        if (lines.length > 0 && /date|amount|descricao|description/i.test(lines[0])) start = 1;
        for (let i = start; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes("Pagamento recebido") || line.includes("Estorno")) {
            continue;
          }
          const parts = line.split(",").map((p) => p.trim());
          let date = parts[0];
          let amount = parts[2] || parts[1];
          let description = parts[1] || parts[2] || "";
          date = toISODate(date);
          amount = toNumber(amount);
          items.push({ date, amount, description });
        }
      }

      // Delegate business insertion wrapper
      service.processUploadItems(items, ({ inserted, skipped }) => {
        try { fs.unlinkSync(filePath); } catch (e) { }

        const duration = Date.now() - startTime;
        console.log(`[Upload Completed] Concluído em ${duration}ms. Importados: ${inserted.length}, Ignorados: ${skipped.length}`);

        res.json({
          success: true,
          data: {
            imported: inserted.length,
            skipped: skipped.length,
            skippedItems: skipped,
          }
        });
      });

    } catch (err) {
      if (filePath) {
        try { fs.unlinkSync(filePath); } catch (e) { }
      }

      const duration = Date.now() - startTime;
      console.error(`[Upload Failed] Mensagem: ${err.message} | Duração: ${duration}ms`);
      console.error(err.stack); // Full trace

      return res.status(500).json({
        success: false,
        error: `Erro ao extrair e processar o arquivo. Detalhe: ${err.message}`
      });
    }
  });
});

module.exports = router;

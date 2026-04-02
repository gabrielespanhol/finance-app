const express = require("express");
const cors = require("cors");
const transactionsRouter = require("./routes/transactions");

const app = express();
app.use(cors());
app.use(express.json());

// Mount transactions router (contains CRUD + upload)
app.use("/", transactionsRouter);

app.listen(3001, () => console.log("Backend rodando"));

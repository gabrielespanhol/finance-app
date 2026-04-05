const express = require("express");
const cors = require("cors");
const transactionsRouter = require("./routes/transactions");

const app = express();
app.use(cors());
app.use(express.json());

const categoriesRouter = require("./routes/categories");
const savedMoneyRouter = require("./routes/savedMoney");
const projectionsRouter = require("./routes/projections");

// Mount routers
app.use("/", transactionsRouter);
app.use("/", categoriesRouter);
app.use("/", savedMoneyRouter);
app.use("/", projectionsRouter);

app.listen(3001, () => console.log("Backend rodando"));

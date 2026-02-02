const express = require("express");
const cors = require("cors");

const clientsRouter = require("./routes/clients");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Tech Visits Manager API is running");
});

app.get("/health", (req, res) => {
  res.json({ ok: true, message: "Tech Visits Manager API running" });
});

app.use("/api/clients", clientsRouter);

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

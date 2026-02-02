const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ ok: true, message: "Tech Visits Manager API running" });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

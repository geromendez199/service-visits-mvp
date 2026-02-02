const path = require("path");
const express = require("express");
const cors = require("cors");

const clientsRouter = require("./routes/clients");
const visitsRouter = require("./routes/visits");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rutas de API primero (buena práctica)
app.get("/health", (req, res) => {
  res.json({ ok: true, message: "Tech Visits Manager API running" });
});

app.use("/api/clients", clientsRouter);
app.use("/api/visits", visitsRouter);

// Servir frontend como archivos estáticos
const frontendPath = path.join(__dirname, "..", "frontend");
app.use(express.static(frontendPath));

// Fallback: cualquier ruta que no sea /api devuelve el frontend
// Usamos RegExp para evitar el error de path-to-regexp con "*"
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`App running on http://localhost:${PORT}`);
});

const express = require("express");
const path = require("path");
const crypto = require("crypto");
const { readJson, writeJson } = require("../utils/fileDb");

const router = express.Router();

const VISITS_FILE = path.join(__dirname, "..", "data", "visits.json");
const CLIENTS_FILE = path.join(__dirname, "..", "data", "clients.json");

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

// GET /api/visits
router.get("/", (req, res) => {
  const visits = readJson(VISITS_FILE);
  res.json({ ok: true, data: visits });
});

// POST /api/visits
router.post("/", (req, res) => {
  const { clientId, date, status, notes } = req.body;

  if (!isNonEmptyString(clientId)) {
    return res.status(400).json({ ok: false, error: "clientId is required" });
  }

  const clients = readJson(CLIENTS_FILE);
  const clientExists = clients.some((c) => c.id === clientId);

  if (!clientExists) {
    return res.status(404).json({ ok: false, error: "client not found" });
  }

  const visits = readJson(VISITS_FILE);

  const newVisit = {
    id: crypto.randomUUID(),
    clientId,
    date: isNonEmptyString(date) ? date : new Date().toISOString(),
    status: isNonEmptyString(status) ? status : "pending",
    notes: isNonEmptyString(notes) ? notes.trim() : "",
    createdAt: new Date().toISOString(),
  };

  visits.push(newVisit);
  writeJson(VISITS_FILE, visits);

  res.status(201).json({ ok: true, data: newVisit });
});

// GET /api/visits/client/:clientId
router.get("/client/:clientId", (req, res) => {
  const { clientId } = req.params;
  const visits = readJson(VISITS_FILE);
  const filtered = visits.filter((v) => v.clientId === clientId);

  res.json({ ok: true, data: filtered });
});

// DELETE /api/visits/:id
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  const visits = readJson(VISITS_FILE);
  const next = visits.filter((v) => v.id !== id);

  if (next.length === visits.length) {
    return res.status(404).json({ ok: false, error: "visit not found" });
  }

  writeJson(VISITS_FILE, next);
  res.json({ ok: true, message: "visit deleted" });
});

module.exports = router;

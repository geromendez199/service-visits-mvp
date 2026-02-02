const express = require("express");
const path = require("path");
const { readJson, writeJson } = require("../utils/fileDb");
const crypto = require("crypto");

const router = express.Router();

const CLIENTS_FILE = path.join(__dirname, "..", "data", "clients.json");

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

// GET /api/clients
router.get("/", (req, res) => {
  const clients = readJson(CLIENTS_FILE);
  res.json({ ok: true, data: clients });
});

// POST /api/clients
router.post("/", (req, res) => {
  const { name, phone, address, notes } = req.body;

  if (!isNonEmptyString(name)) {
    return res.status(400).json({ ok: false, error: "name is required" });
  }

  const clients = readJson(CLIENTS_FILE);

  const newClient = {
    id: crypto.randomUUID(),
    name: name.trim(),
    phone: isNonEmptyString(phone) ? phone.trim() : "",
    address: isNonEmptyString(address) ? address.trim() : "",
    notes: isNonEmptyString(notes) ? notes.trim() : "",
    createdAt: new Date().toISOString(),
  };

  clients.push(newClient);
  writeJson(CLIENTS_FILE, clients);

  res.status(201).json({ ok: true, data: newClient });
});

// DELETE /api/clients/:id
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  const clients = readJson(CLIENTS_FILE);
  const next = clients.filter((c) => c.id !== id);

  if (next.length === clients.length) {
    return res.status(404).json({ ok: false, error: "client not found" });
  }

  writeJson(CLIENTS_FILE, next);
  res.json({ ok: true, message: "client deleted" });
});

module.exports = router;

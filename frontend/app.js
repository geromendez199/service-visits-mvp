const API_BASE = "http://localhost:3000";
const CLIENTS_API = `${API_BASE}/api/clients`;

const form = document.getElementById("client-form");
const list = document.getElementById("clients-list");
const statusBox = document.getElementById("status");
const refreshBtn = document.getElementById("refresh");

function setStatus(message, type = "") {
  statusBox.textContent = message || "";
  statusBox.className = "status";
  if (type === "ok") statusBox.classList.add("ok");
  if (type === "err") statusBox.classList.add("err");
}

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();

  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { ok: false, error: "Invalid JSON response" };
  }

  if (!res.ok) {
    const msg = json?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return json;
}

function createClientItem(client) {
  const li = document.createElement("li");

  const line = document.createElement("div");
  line.className = "client-line";

  const meta = document.createElement("div");
  meta.className = "client-meta";

  const name = document.createElement("div");
  name.className = "client-name";
  name.textContent = client.name;

  const details = document.createElement("div");
  details.className = "client-small";
  details.textContent = [
    client.phone ? `📞 ${client.phone}` : null,
    client.address ? `📍 ${client.address}` : null
  ].filter(Boolean).join(" • ");

  const id = document.createElement("div");
  id.className = "client-small";
  id.textContent = `ID: ${client.id}`;

  meta.appendChild(name);
  if (details.textContent) meta.appendChild(details);
  meta.appendChild(id);

  const actions = document.createElement("div");
  actions.className = "actions";

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "action-btn";
  copyBtn.textContent = "Copiar ID";
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(client.id);
      setStatus("ID copiado al portapapeles.", "ok");
    } catch {
      setStatus("No pude copiar el ID (permiso del navegador).", "err");
    }
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "action-btn danger";
  deleteBtn.textContent = "Eliminar";
  deleteBtn.addEventListener("click", async () => {
    const ok = confirm(`¿Eliminar cliente "${client.name}"?`);
    if (!ok) return;

    try {
      setStatus("Eliminando cliente...", "");
      await fetchJson(`${CLIENTS_API}/${client.id}`, { method: "DELETE" });
      setStatus("Cliente eliminado.", "ok");
      await loadClients();
    } catch (err) {
      setStatus(`Error al eliminar: ${err.message}`, "err");
    }
  });

  actions.appendChild(copyBtn);
  actions.appendChild(deleteBtn);

  line.appendChild(meta);
  line.appendChild(actions);

  li.appendChild(line);
  return li;
}

async function loadClients() {
  try {
    setStatus("Cargando clientes...", "");
    const json = await fetchJson(CLIENTS_API);
    const clients = json.data || [];

    list.innerHTML = "";
    if (clients.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No hay clientes todavía.";
      list.appendChild(li);
      setStatus("Listo.", "ok");
      return;
    }

    clients.forEach((client) => {
      list.appendChild(createClientItem(client));
    });

    setStatus("Listo.", "ok");
  } catch (err) {
    setStatus(`Error al cargar clientes: ${err.message}`, "err");
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const client = {
    name: document.getElementById("name").value,
    phone: document.getElementById("phone").value,
    address: document.getElementById("address").value,
    notes: document.getElementById("notes").value
  };

  try {
    setStatus("Guardando cliente...", "");
    await fetchJson(CLIENTS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(client)
    });

    form.reset();
    setStatus("Cliente guardado.", "ok");
    await loadClients();
  } catch (err) {
    setStatus(`Error al guardar: ${err.message}`, "err");
  }
});

refreshBtn.addEventListener("click", loadClients);

loadClients();

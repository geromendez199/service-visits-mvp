const API_BASE = "http://localhost:3000";
const CLIENTS_API = `${API_BASE}/api/clients`;
const VISITS_API = `${API_BASE}/api/visits`;

const form = document.getElementById("client-form");
const list = document.getElementById("clients-list");
const statusBox = document.getElementById("status");
const refreshBtn = document.getElementById("refresh");

const visitsList = document.getElementById("visits-list");
const visitClientSelect = document.getElementById("visit-client");
const visitStatusSelect = document.getElementById("visit-status");
const visitDateInput = document.getElementById("visit-date");
const visitNotesInput = document.getElementById("visit-notes");
const createVisitBtn = document.getElementById("create-visit");
const refreshVisitsBtn = document.getElementById("refresh-visits");

let cachedClients = [];

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

/* ---------------------------
   CLIENTS UI
---------------------------- */

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

  const selectBtn = document.createElement("button");
  selectBtn.type = "button";
  selectBtn.className = "action-btn";
  selectBtn.textContent = "Ver visitas";
  selectBtn.addEventListener("click", async () => {
    visitClientSelect.value = client.id;
    await loadVisitsForSelectedClient();
    setStatus(`Mostrando visitas de "${client.name}".`, "ok");
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "action-btn danger";
  deleteBtn.textContent = "Eliminar";
  deleteBtn.addEventListener("click", async () => {
    const ok = confirm(`¿Eliminar cliente "${client.name}"?\n\nNota: esto NO borra visitas asociadas (MVP).`);
    if (!ok) return;

    try {
      setStatus("Eliminando cliente...", "");
      await fetchJson(`${CLIENTS_API}/${client.id}`, { method: "DELETE" });
      setStatus("Cliente eliminado.", "ok");
      await loadClients();
      await loadVisitsForSelectedClient();
    } catch (err) {
      setStatus(`Error al eliminar: ${err.message}`, "err");
    }
  });

  actions.appendChild(copyBtn);
  actions.appendChild(selectBtn);
  actions.appendChild(deleteBtn);

  line.appendChild(meta);
  line.appendChild(actions);

  li.appendChild(line);
  return li;
}

function populateClientSelect(clients) {
  const current = visitClientSelect.value;
  visitClientSelect.innerHTML = "";

  if (clients.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "No hay clientes";
    visitClientSelect.appendChild(opt);
    visitClientSelect.disabled = true;
    return;
  }

  visitClientSelect.disabled = false;

  clients.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = `${c.name}${c.phone ? ` (${c.phone})` : ""}`;
    visitClientSelect.appendChild(opt);
  });

  // mantener selección si existe, si no elegir el primero
  const stillExists = clients.some((c) => c.id === current);
  visitClientSelect.value = stillExists ? current : clients[0].id;
}

async function loadClients() {
  try {
    setStatus("Cargando clientes...", "");
    const json = await fetchJson(CLIENTS_API);
    const clients = json.data || [];
    cachedClients = clients;

    list.innerHTML = "";
    if (clients.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No hay clientes todavía.";
      list.appendChild(li);
      populateClientSelect([]);
      setStatus("Listo.", "ok");
      return;
    }

    clients.forEach((client) => list.appendChild(createClientItem(client)));
    populateClientSelect(clients);

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
    await loadVisitsForSelectedClient();
  } catch (err) {
    setStatus(`Error al guardar: ${err.message}`, "err");
  }
});

refreshBtn.addEventListener("click", async () => {
  await loadClients();
  await loadVisitsForSelectedClient();
});

/* ---------------------------
   VISITS UI
---------------------------- */

function formatVisitDate(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;
  return d.toLocaleString();
}

function getClientName(clientId) {
  const c = cachedClients.find((x) => x.id === clientId);
  return c ? c.name : "Cliente desconocido";
}

function createVisitItem(visit) {
  const li = document.createElement("li");

  const line = document.createElement("div");
  line.className = "visit-line";

  const meta = document.createElement("div");
  meta.className = "visit-meta";

  const title = document.createElement("div");
  title.className = "visit-title";
  title.textContent = `${getClientName(visit.clientId)} — ${formatVisitDate(visit.date)}`;

  const badge = document.createElement("div");
  badge.className = "badge";
  badge.textContent = `status: ${visit.status || "pending"}`;

  const small = document.createElement("div");
  small.className = "visit-small";
  small.textContent = `ID: ${visit.id}${visit.notes ? ` • ${visit.notes}` : ""}`;

  meta.appendChild(title);
  meta.appendChild(badge);
  meta.appendChild(small);

  const actions = document.createElement("div");
  actions.className = "actions";

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "action-btn danger";
  deleteBtn.textContent = "Eliminar";
  deleteBtn.addEventListener("click", async () => {
    const ok = confirm("¿Eliminar esta visita?");
    if (!ok) return;

    try {
      setStatus("Eliminando visita...", "");
      await fetchJson(`${VISITS_API}/${visit.id}`, { method: "DELETE" });
      setStatus("Visita eliminada.", "ok");
      await loadVisitsForSelectedClient();
    } catch (err) {
      setStatus(`Error al eliminar visita: ${err.message}`, "err");
    }
  });

  actions.appendChild(deleteBtn);

  line.appendChild(meta);
  line.appendChild(actions);

  li.appendChild(line);
  return li;
}

async function loadVisitsForSelectedClient() {
  try {
    const clientId = visitClientSelect.value;
    visitsList.innerHTML = "";

    if (!clientId) {
      const li = document.createElement("li");
      li.textContent = "Seleccioná un cliente para ver visitas.";
      visitsList.appendChild(li);
      return;
    }

    const json = await fetchJson(`${VISITS_API}/client/${clientId}`);
    const visits = json.data || [];

    if (visits.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No hay visitas para este cliente.";
      visitsList.appendChild(li);
      return;
    }

    // ordenar por fecha descendente
    visits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    visits.forEach((v) => visitsList.appendChild(createVisitItem(v)));
  } catch (err) {
    setStatus(`Error al cargar visitas: ${err.message}`, "err");
  }
}

visitClientSelect.addEventListener("change", loadVisitsForSelectedClient);
refreshVisitsBtn.addEventListener("click", loadVisitsForSelectedClient);

createVisitBtn.addEventListener("click", async () => {
  const clientId = visitClientSelect.value;

  if (!clientId) {
    setStatus("No hay cliente seleccionado para crear visita.", "err");
    return;
  }

  // datetime-local devuelve "YYYY-MM-DDTHH:mm" sin timezone; lo convertimos a ISO local.
  // Si el usuario no carga fecha, usamos ahora.
  let dateIso = new Date().toISOString();
  const raw = visitDateInput.value;
  if (raw) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) dateIso = d.toISOString();
  }

  const payload = {
    clientId,
    status: visitStatusSelect.value || "pending",
    date: dateIso,
    notes: visitNotesInput.value || ""
  };

  try {
    setStatus("Creando visita...", "");
    await fetchJson(VISITS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    visitNotesInput.value = "";
    visitDateInput.value = "";
    setStatus("Visita creada.", "ok");
    await loadVisitsForSelectedClient();
  } catch (err) {
    setStatus(`Error al crear visita: ${err.message}`, "err");
  }
});

/* ---------------------------
   INIT
---------------------------- */

(async function init() {
  await loadClients();
  await loadVisitsForSelectedClient();
})();

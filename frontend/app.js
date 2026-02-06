const API_BASE = "http://localhost:3000";
const CLIENTS_API = `${API_BASE}/api/clients`;
const VISITS_API = `${API_BASE}/api/visits`;

const elements = {
  statusBox: document.getElementById("status"),
  clientForm: document.getElementById("client-form"),
  clientName: document.getElementById("name"),
  clientPhone: document.getElementById("phone"),
  clientAddress: document.getElementById("address"),
  clientNotes: document.getElementById("notes"),
  nameError: document.getElementById("name-error"),
  clientsList: document.getElementById("clients-list"),
  refreshClients: document.getElementById("refresh"),
  visitsList: document.getElementById("visits-list"),
  visitForm: document.getElementById("visit-form"),
  visitClientSelect: document.getElementById("visit-client"),
  visitStatusSelect: document.getElementById("visit-status"),
  visitDateInput: document.getElementById("visit-date"),
  visitNotesInput: document.getElementById("visit-notes"),
  refreshVisits: document.getElementById("refresh-visits"),
  modal: document.getElementById("confirm-modal"),
  modalTitle: document.getElementById("confirm-title"),
  modalMessage: document.getElementById("confirm-message"),
  modalConfirm: document.querySelector("[data-modal-confirm]"),
  modalCancel: document.querySelector("[data-modal-cancel]"),
  modalBackdrop: document.querySelector("[data-modal-close]")
};

const state = {
  clients: [],
  modalResolver: null
};

/* ---------------------------
   STATUS + VALIDATION
---------------------------- */

function setStatus(message, type = "") {
  elements.statusBox.textContent = message || "";
  elements.statusBox.className = "status";
  if (type === "ok") elements.statusBox.classList.add("ok");
  if (type === "err") elements.statusBox.classList.add("err");
}

function setFieldError(input, errorEl, message) {
  errorEl.textContent = message || "";
  input.classList.toggle("input-error", Boolean(message));
}

function validateClientForm() {
  const name = elements.clientName.value.trim();
  if (!name) {
    setFieldError(elements.clientName, elements.nameError, "El nombre es obligatorio.");
    return false;
  }

  setFieldError(elements.clientName, elements.nameError, "");
  return true;
}

/* ---------------------------
   MODAL
---------------------------- */

function confirmModal({ title, message, confirmText = "Confirmar", danger = false }) {
  elements.modalTitle.textContent = title;
  elements.modalMessage.textContent = message;
  elements.modalConfirm.textContent = confirmText;
  elements.modalConfirm.classList.toggle("btn-danger", danger);
  elements.modalConfirm.classList.toggle("btn-primary", !danger);

  elements.modal.classList.add("open");
  elements.modal.setAttribute("aria-hidden", "false");

  elements.modalConfirm.focus();

  return new Promise((resolve) => {
    state.modalResolver = resolve;
  });
}

function closeModal(result) {
  elements.modal.classList.remove("open");
  elements.modal.setAttribute("aria-hidden", "true");
  if (state.modalResolver) state.modalResolver(result);
  state.modalResolver = null;
}

/* ---------------------------
   API
---------------------------- */

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

const api = {
  listClients: () => fetchJson(CLIENTS_API),
  createClient: (payload) =>
    fetchJson(CLIENTS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }),
  deleteClient: (id) => fetchJson(`${CLIENTS_API}/${id}`, { method: "DELETE" }),
  listVisits: (clientId) => fetchJson(`${VISITS_API}/client/${clientId}`),
  createVisit: (payload) =>
    fetchJson(VISITS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }),
  deleteVisit: (id) => fetchJson(`${VISITS_API}/${id}`, { method: "DELETE" })
};

/* ---------------------------
   RENDER
---------------------------- */

function renderLoading(listEl) {
  listEl.innerHTML = "";
  for (let i = 0; i < 3; i += 1) {
    const li = document.createElement("li");
    li.className = "skeleton";
    listEl.appendChild(li);
  }
}

function renderEmpty(listEl, message) {
  listEl.innerHTML = "";
  const li = document.createElement("li");
  li.className = "list-item";
  li.textContent = message;
  listEl.appendChild(li);
}

function getClientName(clientId) {
  const client = state.clients.find((item) => item.id === clientId);
  return client ? client.name : "Cliente desconocido";
}

function formatVisitDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleString();
}

function badgeClass(status) {
  if (status === "completed") return "badge badge--completed";
  if (status === "cancelled") return "badge badge--cancelled";
  return "badge badge--pending";
}

function createClientItem(client) {
  const li = document.createElement("li");
  li.className = "list-item";

  const content = document.createElement("div");
  content.className = "list-content";

  const title = document.createElement("div");
  title.className = "list-title";
  title.textContent = client.name;

  const details = document.createElement("div");
  details.className = "list-meta";
  details.textContent = [
    client.phone ? `📞 ${client.phone}` : null,
    client.address ? `📍 ${client.address}` : null
  ]
    .filter(Boolean)
    .join(" • ");

  const id = document.createElement("div");
  id.className = "list-meta";
  id.textContent = `ID: ${client.id}`;

  content.appendChild(title);
  if (details.textContent) content.appendChild(details);
  content.appendChild(id);

  const actions = document.createElement("div");
  actions.className = "list-actions";

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "btn btn-secondary";
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
  selectBtn.className = "btn btn-secondary";
  selectBtn.textContent = "Ver visitas";
  selectBtn.addEventListener("click", async () => {
    elements.visitClientSelect.value = client.id;
    await loadVisitsForSelectedClient();
    setStatus(`Mostrando visitas de "${client.name}".`, "ok");
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "btn btn-danger";
  deleteBtn.textContent = "Eliminar";
  deleteBtn.addEventListener("click", async () => {
    const ok = await confirmModal({
      title: `Eliminar cliente "${client.name}"`,
      message:
        "Este paso no elimina visitas asociadas (MVP). Podés borrarlas manualmente desde la sección de visitas.",
      confirmText: "Eliminar cliente",
      danger: true
    });
    if (!ok) return;

    try {
      setStatus("Eliminando cliente...", "");
      await api.deleteClient(client.id);
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

  li.appendChild(content);
  li.appendChild(actions);

  return li;
}

function createVisitItem(visit) {
  const li = document.createElement("li");
  li.className = "list-item";

  const content = document.createElement("div");
  content.className = "list-content";

  const title = document.createElement("div");
  title.className = "list-title";
  title.textContent = `${getClientName(visit.clientId)} — ${formatVisitDate(visit.date)}`;

  const badge = document.createElement("div");
  badge.className = badgeClass(visit.status || "pending");
  badge.textContent = visit.status || "pending";

  const meta = document.createElement("div");
  meta.className = "list-meta";
  meta.textContent = `ID: ${visit.id}${visit.notes ? ` • ${visit.notes}` : ""}`;

  content.appendChild(title);
  content.appendChild(badge);
  content.appendChild(meta);

  const actions = document.createElement("div");
  actions.className = "list-actions";

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "btn btn-danger";
  deleteBtn.textContent = "Eliminar";
  deleteBtn.addEventListener("click", async () => {
    const ok = await confirmModal({
      title: "Eliminar visita",
      message: "¿Querés eliminar esta visita? Este paso no se puede deshacer.",
      confirmText: "Eliminar visita",
      danger: true
    });
    if (!ok) return;

    try {
      setStatus("Eliminando visita...", "");
      await api.deleteVisit(visit.id);
      setStatus("Visita eliminada.", "ok");
      await loadVisitsForSelectedClient();
    } catch (err) {
      setStatus(`Error al eliminar visita: ${err.message}`, "err");
    }
  });

  actions.appendChild(deleteBtn);
  li.appendChild(content);
  li.appendChild(actions);

  return li;
}

function renderClientOptions(clients) {
  const current = elements.visitClientSelect.value;
  elements.visitClientSelect.innerHTML = "";

  if (clients.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "No hay clientes";
    elements.visitClientSelect.appendChild(opt);
    elements.visitClientSelect.disabled = true;
    return;
  }

  elements.visitClientSelect.disabled = false;

  clients.forEach((client) => {
    const opt = document.createElement("option");
    opt.value = client.id;
    opt.textContent = `${client.name}${client.phone ? ` (${client.phone})` : ""}`;
    elements.visitClientSelect.appendChild(opt);
  });

  const stillExists = clients.some((client) => client.id === current);
  elements.visitClientSelect.value = stillExists ? current : clients[0].id;
}

async function loadClients() {
  try {
    renderLoading(elements.clientsList);
    setStatus("Cargando clientes...", "");
    const json = await api.listClients();
    const clients = json.data || [];

    state.clients = clients;
    elements.clientsList.innerHTML = "";

    if (clients.length === 0) {
      renderEmpty(elements.clientsList, "No hay clientes todavía.");
      renderClientOptions([]);
      setStatus("Listo.", "ok");
      return;
    }

    clients.forEach((client) => elements.clientsList.appendChild(createClientItem(client)));
    renderClientOptions(clients);
    setStatus("Listo.", "ok");
  } catch (err) {
    setStatus(`Error al cargar clientes: ${err.message}`, "err");
  }
}

async function loadVisitsForSelectedClient() {
  try {
    const clientId = elements.visitClientSelect.value;
    renderLoading(elements.visitsList);

    if (!clientId) {
      renderEmpty(elements.visitsList, "Seleccioná un cliente para ver visitas.");
      return;
    }

    const json = await api.listVisits(clientId);
    const visits = json.data || [];

    if (visits.length === 0) {
      renderEmpty(elements.visitsList, "No hay visitas para este cliente.");
      return;
    }

    visits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    elements.visitsList.innerHTML = "";
    visits.forEach((visit) => elements.visitsList.appendChild(createVisitItem(visit)));
  } catch (err) {
    setStatus(`Error al cargar visitas: ${err.message}`, "err");
  }
}

/* ---------------------------
   EVENTS
---------------------------- */

elements.clientForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!validateClientForm()) return;

  const payload = {
    name: elements.clientName.value.trim(),
    phone: elements.clientPhone.value.trim(),
    address: elements.clientAddress.value.trim(),
    notes: elements.clientNotes.value.trim()
  };

  try {
    setStatus("Guardando cliente...", "");
    await api.createClient(payload);
    elements.clientForm.reset();
    setStatus("Cliente guardado.", "ok");
    await loadClients();
    await loadVisitsForSelectedClient();
  } catch (err) {
    setStatus(`Error al guardar: ${err.message}`, "err");
  }
});

elements.clientName.addEventListener("blur", validateClientForm);

elements.refreshClients.addEventListener("click", async () => {
  await loadClients();
  await loadVisitsForSelectedClient();
});

elements.visitForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const clientId = elements.visitClientSelect.value;

  if (!clientId) {
    setStatus("No hay cliente seleccionado para crear visita.", "err");
    return;
  }

  let dateIso = new Date().toISOString();
  const raw = elements.visitDateInput.value;
  if (raw) {
    const date = new Date(raw);
    if (!Number.isNaN(date.getTime())) dateIso = date.toISOString();
  }

  const payload = {
    clientId,
    status: elements.visitStatusSelect.value || "pending",
    date: dateIso,
    notes: elements.visitNotesInput.value.trim()
  };

  try {
    setStatus("Creando visita...", "");
    await api.createVisit(payload);
    elements.visitNotesInput.value = "";
    elements.visitDateInput.value = "";
    setStatus("Visita creada.", "ok");
    await loadVisitsForSelectedClient();
  } catch (err) {
    setStatus(`Error al crear visita: ${err.message}`, "err");
  }
});

elements.visitClientSelect.addEventListener("change", loadVisitsForSelectedClient);

elements.refreshVisits.addEventListener("click", loadVisitsForSelectedClient);

[elements.modalCancel, elements.modalBackdrop].forEach((el) => {
  el.addEventListener("click", () => closeModal(false));
});

elements.modalConfirm.addEventListener("click", () => closeModal(true));

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && elements.modal.classList.contains("open")) {
    closeModal(false);
  }
});

/* ---------------------------
   INIT
---------------------------- */

(async function init() {
  await loadClients();
  await loadVisitsForSelectedClient();
})();

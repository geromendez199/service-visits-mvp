const API_URL = "http://localhost:3000/api/clients";

const form = document.getElementById("client-form");
const list = document.getElementById("clients-list");

async function loadClients() {
  const res = await fetch(API_URL);
  const json = await res.json();

  list.innerHTML = "";

  json.data.forEach(client => {
    const li = document.createElement("li");
    li.textContent = `${client.name} - ${client.phone}`;
    list.appendChild(li);
  });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const client = {
    name: document.getElementById("name").value,
    phone: document.getElementById("phone").value,
    address: document.getElementById("address").value,
    notes: document.getElementById("notes").value
  };

  await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(client)
  });

  form.reset();
  loadClients();
});

loadClients();

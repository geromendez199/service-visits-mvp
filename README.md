# Tech Visits Manager (MVP)

Mini sistema para registrar clientes y visitas técnicas.
Proyecto simple orientado a portfolio: limpio, entendible y con un flujo de commits realista.

---

## ✅ Funcionalidades

### Clientes
- Crear cliente
- Listar clientes
- Eliminar cliente
- Copiar ID del cliente desde el frontend

### Visitas
- Crear visita asociada a un cliente
- Listar visitas por cliente
- Eliminar visita

---

## 🧱 Stack

- Backend: Node.js + Express
- Frontend: HTML + CSS + JavaScript (Fetch API)
- Persistencia: JSON local (MVP)

---

## 📁 Estructura del proyecto

```text
service-visits-mvp/
├── backend/
│   ├── server.js
│   ├── routes/
│   │   ├── clients.js
│   │   └── visits.js
│   ├── utils/
│   │   └── fileDb.js
│   └── data/
│       ├── clients.json
│       └── visits.json
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
└── screenshots/


---

## 🚀 Cómo ejecutar el proyecto

### 1) Backend
Desde la raíz del repositorio:

cd backend
npm install
node server.js

El backend queda disponible en:
http://localhost:3000

Endpoints de prueba:
- GET /  
- GET /health  

---

### 2) Frontend
Abrir el archivo:
frontend/index.html

El frontend consume la API desde:
http://localhost:3000

---

## 🔌 API Endpoints

### Clientes

Listar clientes  
GET /api/clients

Crear cliente  
POST /api/clients

Body (JSON):
{
  "name": "Juan Perez",
  "phone": "3492-123456",
  "address": "Rafaela",
  "notes": "Cliente nuevo"
}

Eliminar cliente  
DELETE /api/clients/:id

---

### Visitas

Listar visitas  
GET /api/visits

Listar visitas por cliente  
GET /api/visits/client/:clientId

Crear visita  
POST /api/visits

Body (JSON):
{
  "clientId": "CLIENT_ID_AQUI",
  "status": "completed",
  "notes": "Revisión general"
}

Eliminar visita  
DELETE /api/visits/:id

---

## 🧪 Ejemplos de pruebas (PowerShell)

Crear cliente:
Invoke-WebRequest -Uri http://localhost:3000/api/clients `
  -Method POST `
  -ContentType 'application/json' `
  -Body '{"name":"Juan Perez","phone":"3492-123456","address":"Rafaela","notes":"Cliente nuevo"}'

Listar clientes:
Invoke-WebRequest -Uri http://localhost:3000/api/clients -Method GET

Crear visita:
Invoke-WebRequest -Uri http://localhost:3000/api/visits `
  -Method POST `
  -ContentType 'application/json' `
  -Body '{"clientId":"CLIENT_ID_AQUI","status":"pending","notes":"Primera visita"}'

Listar visitas por cliente:
Invoke-WebRequest -Uri http://localhost:3000/api/visits/client/CLIENT_ID_AQUI -Method GET

---

## 👤 Autor

Gerónimo Méndez  
Estudiante de Ingeniería en Computación

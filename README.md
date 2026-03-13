# InmoLotes — Frontend React

Sistema web inmobiliario para gestión de venta de lotes de terreno.  
**Stack:** React 18 + Vite + Tailwind CSS 3 + Context API

---

## Estructura del Proyecto

```
src/
├── context/
│   └── AppContext.jsx        # Estado global (useReducer) + persistencia en localStorage
├── hooks/
│   └── index.js              # useAuth, useLotes, usePagos, usePQRS
├── utils/
│   └── api.js                # Todas las llamadas al backend (fetch + JWT)
├── components/
│   ├── ui.jsx                # Componentes base: Button, Input, Modal, Badge, Card…
│   ├── ProtectedSection.jsx  # HOC y wrapper de control de roles
│   ├── auth/
│   │   └── AuthPages.jsx     # Login, Register, ForgotPassword
│   ├── layout/
│   │   ├── Sidebar.jsx       # Navegación lateral dinámica por rol
│   │   ├── Dashboards.jsx    # AdminDashboard + ClienteDashboard
│   │   └── Clientes.jsx      # Vista de gestión de clientes (solo admin)
│   ├── lotes/
│   │   └── GestionLotes.jsx  # CRUD lotes + cambio de estado + catálogo tipologías
│   ├── pagos/
│   │   └── GestionPagos.jsx  # Compras, motor de cuotas, historial, saldo pendiente
│   ├── pqrs/
│   │   └── PQRS.jsx          # Formulario cliente + Dashboard admin PQRS
│   └── proyecto/
│       └── Proyecto.jsx      # Etapas del negocio + modelos de planos
└── App.jsx                   # Router principal por rol
```

---

## Instalación y arranque

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
cp .env.example .env
# → Editar VITE_API_URL con la URL de tu backend Express

# 3. Iniciar en desarrollo
npm run dev

# 4. Build para producción
npm run build
```

---

## Variables de entorno

| Variable        | Descripción                             | Ejemplo                          |
|-----------------|-----------------------------------------|----------------------------------|
| `VITE_API_URL`  | URL base del backend Node.js/Express    | `http://localhost:3000/api`      |

---

## Contrato con el Backend (Node.js + Express)

El frontend asume los siguientes endpoints. Todos (salvo auth) requieren el header:
```
Authorization: Bearer <token_jwt>
```

### Auth
| Método | Ruta                        | Body                                      | Respuesta                        |
|--------|-----------------------------|-------------------------------------------|----------------------------------|
| POST   | `/api/auth/login`           | `{ correo, password }`                    | `{ user, token }` — `user.rol` debe ser `"admin"` o `"cliente"` |
| POST   | `/api/auth/register`        | `{ nombre, correo, telefono, password }`  | `{ message }`                    |
| POST   | `/api/auth/forgot-password` | `{ correo }`                              | `{ message }`                    |
| POST   | `/api/auth/reset-password`  | `{ token, password }`                     | `{ message }`                    |

### Lotes
| Método | Ruta                      | Notas                                   |
|--------|---------------------------|-----------------------------------------|
| GET    | `/api/lotes`              | Lista todos                             |
| GET    | `/api/lotes/:id`          | Detalle                                 |
| POST   | `/api/lotes`              | Body: `{ area, ubicacion, valor, etapa, estado, descripcion }` |
| PUT    | `/api/lotes/:id`          | Actualizar campos                       |
| DELETE | `/api/lotes/:id`          | —                                       |
| PATCH  | `/api/lotes/:id/estado`   | Body: `{ estado }` — `"Disponible"` \| `"Reservado"` \| `"Vendido"` |

### Compras
| Método | Ruta                              | Body / Notas                                        |
|--------|-----------------------------------|-----------------------------------------------------|
| GET    | `/api/compras`                    | Lista todas (admin)                                 |
| GET    | `/api/compras/cliente/:clienteId` | Compras de un cliente                               |
| POST   | `/api/compras`                    | `{ cliente_id, lote_ids[], cuotas, valor_cuota, valor_total }` — debe marcar los lotes como Reservado |

### Pagos
| Método | Ruta                          | Body / Notas                                             |
|--------|-------------------------------|----------------------------------------------------------|
| GET    | `/api/pagos`                  | Lista todos                                              |
| GET    | `/api/pagos/compra/:compraId` | Pagos de una compra                                      |
| POST   | `/api/pagos`                  | `{ compra_id, monto, fecha, referencia, notas }` — el backend debe enviar el comprobante por email (nodemailer) |

### PQRS
| Método | Ruta                          | Body / Notas                              |
|--------|-------------------------------|-------------------------------------------|
| GET    | `/api/pqrs`                   | Lista todas (admin)                       |
| GET    | `/api/pqrs/cliente/:clienteId`| PQRS de un cliente                        |
| POST   | `/api/pqrs`                   | `{ cliente_id, tipo, asunto, descripcion }` |
| PUT    | `/api/pqrs/:id`               | `{ respuesta, estado }`                   |

### Usuarios
| Método | Ruta                    | Notas                              |
|--------|-------------------------|------------------------------------|
| GET    | `/api/usuarios/clientes`| Lista usuarios con rol `"cliente"` — incluir `compras_count` y `created_at` |

---

## Campos esperados en respuestas

### `user` (en login)
```json
{
  "id": 1,
  "nombre": "Juan Pérez",
  "correo": "juan@email.com",
  "telefono": "3001234567",
  "rol": "admin"
}
```

### `lote`
```json
{
  "id": 1,
  "area": 150,
  "ubicacion": "Manzana 3, Lote 12",
  "valor": 50000000,
  "etapa": "Preventa",
  "estado": "Disponible",
  "descripcion": ""
}
```

### `compra`
```json
{
  "id": 1,
  "cliente_id": 2,
  "cliente_nombre": "Juan Pérez",
  "lote_id": 3,
  "cuotas": 12,
  "valor_cuota": 4166667,
  "valor_total": 50000000,
  "saldo_pendiente": 45833333
}
```

### `pago`
```json
{
  "id": 1,
  "compra_id": 1,
  "monto": 4166667,
  "fecha": "2024-03-15",
  "referencia": "TRF-001",
  "notas": ""
}
```

### `pqrs`
```json
{
  "id": 1,
  "cliente_id": 2,
  "cliente_nombre": "Juan Pérez",
  "tipo": "Petición",
  "asunto": "Consulta sobre escrituración",
  "descripcion": "...",
  "estado": "Pendiente",
  "respuesta": null,
  "fecha": "2024-03-15T10:00:00Z"
}
```

---

## Roles y control de acceso

| Rol       | Acceso                                                         |
|-----------|----------------------------------------------------------------|
| `admin`   | Dashboard global, CRUD lotes, compras, pagos, PQRS, clientes  |
| `cliente` | Solo su dashboard, sus lotes, su historial de pagos, sus PQRS |

El token JWT se almacena en `localStorage` bajo la clave `inmolotes_session`. El Context API lo inyecta automáticamente en cada petición.

---

## Despliegue en Vercel

1. Conecta el repo en [vercel.com](https://vercel.com)
2. Framework: **Vite**
3. Build command: `npm run build`
4. Output dir: `dist`
5. Agrega la env var `VITE_API_URL` apuntando al backend desplegado

---

## Scripts disponibles

```bash
npm run dev      # Servidor de desarrollo (http://localhost:5173)
npm run build    # Build de producción → /dist
npm run preview  # Vista previa del build
```

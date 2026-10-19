# Mi Dinero — Frontend

Aplicación de finanzas personales construida con Vite, React 18, TypeScript y
React Router. Incluye layout responsive, sistema de componentes accesibles,
cliente HTTP centralizado, utilidades de dinero y fechas, rutas públicas/privadas
y página 404.

Este repositorio contiene **solo el frontend**. La API se consume desde
`VITE_API_URL` y no forma parte de este proyecto.

## Requisitos

- Node.js 20 o superior.
- Una API disponible en `VITE_API_URL` (por defecto `http://localhost:8000`). En
  producción se consume directamente desde el dominio de la API.

## Instalación

    cp .env.example .env.local
    npm install

## Variables de entorno

| Variable       | Descripción                      | Local                   | Producción                            |
| -------------- | -------------------------------- | ----------------------- | ------------------------------------- |
| `VITE_API_URL` | URL base de la API sin `/` final | `http://localhost:8000` | `https://api-midinero.pradov.xyz`     |

- `.env.example` documenta la variable.
- `.env.production` fija la API de producción y Vite lo usa en `npm run build`.
- Para desarrollo local, crea `.env.local` con `VITE_API_URL=http://localhost:8000`.
- En desarrollo, Vite también reescribe `/api/*` hacia `http://localhost:8000/*`
  si prefieres usar una ruta relativa.
- La API permite CORS desde cualquier origen, por lo que el frontend puede
  consumirla directamente sin proxy inverso.

Vite solo expone variables con el prefijo `VITE_`. No guardes secretos en
variables del frontend.

## Ejecutar

    npm run dev      # http://localhost:5173
    npm run preview  # sirve el build de producción

Rutas disponibles:

- `/` — presentación pública y estado de la API.
- `/login` — placeholder de autenticación (W2).
- `/app` — resumen privado (protegido; redirige a login sin sesión).
- `/app/movimientos` — ingresos y gastos (contrato provisional; protegida).

## Dominio y despliegue

- Web: <https://midinero.pradov.xyz>
- API: <https://api-midinero.pradov.xyz>
- `public/CNAME` fija `midinero.pradov.xyz` (GitHub Pages). Si se publica en
  otro proveedor, ese archivo se ignora y el dominio se configura en el panel
  del proveedor.
- La API de producción se fija en `.env.production` y se consume directamente;
  la API admite CORS desde cualquier origen.

## Contrato provisional de cuentas y movimientos

`docs/api-contract.md` **no existe todavía** ni en este repo ni en la API
desplegada; el OpenAPI solo publica `GET /health`. Para no simular datos en
producción, el frontend consume las siguientes rutas supuestas, todas sobre el
cliente HTTP único (`credentials: "include"`, CSRF y sobre de error estándar):

| Método | Ruta | Uso |
| ------ | ---- | --- |
| `GET` | `/api/v1/accounts?page_size=100` | Selector y saldos por cuenta |
| `GET` | `/api/v1/categories?type=income\|expense` | Categorías por tipo |
| `GET` | `/api/v1/transactions` | Listado con filtros y paginación |
| `POST` | `/api/v1/transactions` | Crear (header `Idempotency-Key`) |
| `PATCH` | `/api/v1/transactions/{id}` | Editar (header `Idempotency-Key`) |
| `DELETE` | `/api/v1/transactions/{id}` | Eliminar y recalcular saldo |

Supuestos que deben confirmarse contra el contrato real:

- Los importes viajan como string decimal y el backend rechaza decimales de más.
- `type` es `income` o `expense`; la moneda se hereda de la cuenta.
- El backend recalcula el saldo al crear, editar o eliminar.
- `DELETE` elimina; si el contrato define anulación, hay que ajustar el servicio.
- Los listados responden `{ items, page, page_size, total }`.
- Los `422` traen `details` con el campo y mensaje para mostrarlos junto al input.

Si la API responde distinto, la pantalla muestra el error del backend; **no hay
datos de ejemplo ni fallback local**.

## Pruebas

    npm run test
    npm run test:watch

Cobertura actual:

- Formato y validación de importes en `src/utils/money.ts` (COP, USD, EUR, cero,
  strings enormes).
- Fechas sin desplazamiento por zona horaria y día actual en `America/Bogota`.
- Cliente HTTP con MSW: credenciales, CSRF, 401, 404, 409, 422, 429, red caída y 204.
- Servicios de cuentas, categorías y movimientos (query, cuerpo e Idempotency-Key).
- Validaciones del formulario, generación de claves de idempotencia.
- Página de movimientos: saldos separados por moneda, filtros desde URL,
  paginación, creación sin duplicado por doble envío, 422 por campo, borrado con
  confirmación, estados carga/vacío/error, descripciones con HTML mostradas como
  texto y ausencia de datos financieros en `localStorage`/`sessionStorage`.
- Estados de carga del componente `Button`.

No hay Playwright, axe ni ESLint configurados. Tampoco hay Docker Compose en este
repo para la prueba manual contra la API local.

## Qué NO está probado y riesgos conocidos

- **Flujo manual contra la API real:** imposible hoy: no existen endpoints de
  auth, cuentas, categorías ni movimientos. La API desplegada solo tiene
  `/health`. No se crearon datos falsos ni se modificó el backend.
- **Autenticación real:** `AuthContext` sigue devolviendo `anonymous`; todo
  `/app/*`, incluido `/app/movimientos`, redirige a login. Falta W2 (login,
  `GET /auth/me`, logout, CSRF real).
- **Cuentas (W3):** no hay pantalla de cuentas ni ficha de cuenta; por tanto no
  existe el historial por cuenta y el refresco de saldos solo se prueba con MSW.
- **Contrato de movimientos:** las rutas y campos son provisionales; cualquier
  diferencia con el backend real puede requerir cambios.
- **CORS en producción y cookies cross-subdomain:** no verificados en esta fase.
- **E2E, dos usuarios, Playwright y Mailpit:** no ejecutados (no configurados).
- **axe y revisión manual con teclado/lector de pantalla:** no ejecutados. Sí se
  usaron roles y textos accesibles, `aria-live`, labels y foco visible en el
  código, pero sin auditoría automatizada.
- **Lighthouse, rendimiento y presupuesto de bundle:** no medidos.
- **Cabeceras de seguridad y CSP:** no definidas.

## Build

    npm run build

Genera `dist/`. El build ejecuta primero `tsc -b`; no se publica si hay errores
de tipos.

## Arquitectura

    src/
      components/ui/       Componentes reutilizables y accesibles
      components/routing/  Protección de rutas
      components/transactions/ Formulario, filtros y saldos
      contexts/            Contexto de autenticación (scaffold W2)
      layouts/             Layout con navegación móvil y lateral
      pages/               Páginas públicas, privadas y 404
      services/            Cliente HTTP único y servicios de API
      styles/              Variables de diseño y estilos globales
      types/               Tipos compartidos de la API
      utils/               Dinero, fechas y utilidades
      test/                Configuración de pruebas

## Pendientes

- Publicar `docs/api-contract.md` con auth, cuentas, categorías y movimientos.
- Ajustar los servicios provisionales al contrato definitivo (rutas, campos,
  semántica de anulación e Idempotency-Key).
- W2: autenticación real con cookies HttpOnly, `GET /auth/me`, registro,
  confirmación de correo, recuperación de contraseña y logout.
- W3: cuentas y ficha de cuenta con historial de movimientos.
- Dashboard real, transferencias y perfil.
- Configurar ESLint, Playwright + Mailpit, axe y CI.
- Header CSRF: confirmar el nombre definitivo (`X-CSRF-Token` es provisional).

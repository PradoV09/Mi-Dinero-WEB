# Mi Dinero — Frontend

Aplicación de finanzas personales construida con Vite, React 18, TypeScript y
React Router. Incluye layout responsive, sistema de componentes accesibles,
cliente HTTP centralizado, utilidades de dinero y fechas, rutas públicas/privadas
y página 404.

Este repositorio contiene **solo el frontend**. La API se consume desde
`VITE_API_URL` y no forma parte de este proyecto.

## Requisitos

- Node.js 20 o superior.
- Una API disponible en `VITE_API_URL` (por defecto `http://localhost:8000`).

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

Vite solo expone variables con el prefijo `VITE_`. No guardes secretos en
variables del frontend.

## Ejecutar

    npm run dev      # http://localhost:5173
    npm run preview  # sirve el build de producción

Rutas disponibles en W1:

- `/` — presentación pública y estado de la API.
- `/login` — placeholder de autenticación (W2).
- `/app` — resumen privado (protegido; redirige a login sin sesión).
- `/demo` — vista previa de la interfaz, solo en modo desarrollo.

## Dominio y despliegue

- Web: <https://midinero.pradov.xyz>
- API: <https://api-midinero.pradov.xyz>
- `public/CNAME` fija `midinero.pradov.xyz` (GitHub Pages). Si se publica en
  otro proveedor, ese archivo se ignora y el dominio se configura en el panel
  del proveedor.
- La API de producción se fija en `.env.production`.

## Pruebas

    npm run test
    npm run test:watch

Cobertura actual:

- Formato y validación de importes en `src/utils/money.ts`.
- Fechas sin desplazamiento por zona horaria.
- Cliente HTTP con MSW: credenciales, sobre de error, CSRF y 401.
- Estados de carga del componente `Button`.

Las pruebas de formularios y los flujos de autenticación se agregan en W2. El
E2E con Playwright contra la API real y Mailpit se agregará cuando la API
soporte el flujo completo.

## Build

    npm run build

Genera `dist/`. El build ejecuta primero `tsc -b`; no se publica si hay errores
de tipos.

## Arquitectura

    src/
      components/ui/       Componentes reutilizables y accesibles
      components/routing/  Protección de rutas
      contexts/            Contexto de autenticación (scaffold W2)
      layouts/             Layout con navegación móvil y lateral
      pages/               Páginas públicas, privadas y 404
      services/            Cliente HTTP único y servicios de API
      styles/              Variables de diseño y estilos globales
      types/               Tipos compartidos de la API
      utils/               Dinero, fechas y utilidades
      test/                Configuración de pruebas

## Pendientes

- `docs/api-contract.md` no existe. El header CSRF está implementado con el
  nombre provisional `X-CSRF-Token` y se debe ajustar al contrato.
- W2: autenticación real con cookies HttpOnly, `GET /auth/me`, registro,
  confirmación de correo, recuperación de contraseña y logout.
- W3 a W7: cuentas, movimientos, dashboard, transferencias y perfil.
- E2E con Playwright + Mailpit cuando la API esté lista.
# Mi-Dinero-WEB

# Mis Finanzas

Gestor de ingresos y gastos con React 19, Tailwind CSS 4, Recharts y Supabase
(PostgreSQL + autenticación). Cada usuario tiene su cuenta y solo puede ver sus
propios datos, desde cualquier dispositivo.

## Puesta en marcha

### 1. Crear el proyecto de Supabase

1. Crea un proyecto en <https://supabase.com/dashboard>.
2. Abre **SQL Editor**, pega el contenido de
   [`supabase/migrations/20261001000000_finanzas.sql`](supabase/migrations/20261001000000_finanzas.sql)
   y ejecútalo. Crea las tablas, la seguridad por filas (RLS), las categorías
   iniciales de cada usuario nuevo y la reasignación al borrar categorías.
3. En **Authentication → URL Configuration**:
   - *Site URL*: la URL donde esté publicada la app (en desarrollo,
     `http://localhost:5173`).
   - *Redirect URLs*: añade también `http://localhost:5173` y la URL pública.
   Así funcionan los enlaces de confirmación y de recuperación de contraseña.

> Alternativa con la CLI: `npx supabase login`, `npx supabase link --project-ref <ref>`
> y `npx supabase db push`.

### 2. Variables de entorno

Copia `.env.example` a `.env.local` y rellena la URL del proyecto y la clave
pública (**Project Settings → API Keys**, la *publishable* o la *anon*).
Nunca uses la clave secreta / `service_role` en el frontend.

### 3. Arrancar

```bash
npm install
npm run dev
```

## Acceder desde otros dispositivos

Los datos ya viven en Supabase, pero la web también tiene que estar accesible:

- **En tu red local**: `npm run dev -- --host` y abre en el móvil la URL
  `http://<IP-de-tu-PC>:5173`.
- **Desde cualquier sitio**: publica la carpeta `dist` (`npm run build`) en
  Vercel, Netlify o Cloudflare Pages, define allí las dos variables `VITE_…`
  y añade la URL pública en *Authentication → URL Configuration*.

Al volver a una pestaña o recuperar la conexión, la app vuelve a cargar los
datos, así que los cambios hechos en otro dispositivo aparecen solos.

## Modelo de datos

| Tabla          | Columnas principales                                                       |
| -------------- | -------------------------------------------------------------------------- |
| `categories`   | `id`, `user_id`, `name`, `type` (`income`/`expense`), `color`, `icon`, `system_key` |
| `transactions` | `id`, `user_id`, `type`, `amount`, `category_id`, `date`, `description`     |

- RLS: cada usuario solo puede leer y modificar sus filas.
- Un movimiento solo puede usar una categoría del mismo usuario y del mismo tipo.
- `Otros gastos` / `Otros ingresos` (`system_key`) no se pueden borrar: reciben
  los movimientos de las categorías eliminadas.

## Scripts

- `npm run dev` – servidor de desarrollo
- `npm run build` – compilación de producción en `dist/`
- `npm run lint` – oxlint

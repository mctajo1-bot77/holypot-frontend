# Holypot Trading – Configuración de Deployment

> **Nota:** Las secciones marcadas con `[BACKEND]` deben completarse con información del chat de backend.

---

## Servicios en Render

| Servicio | Tipo | Repositorio |
|---------|------|------------|
| holypot-frontend | Static Site | `holypot-frontend` (este repo) |
| holypot-backend | Web Service | `[BACKEND: nombre del repo]` |
| holypot-db | PostgreSQL | Managed DB en Render |

---

## Frontend – Render Static Site

### Build Settings

| Parámetro | Valor |
|-----------|-------|
| Root Directory | `frontend-vite/` |
| Build Command | `npm run build` |
| Publish Directory | `frontend-vite/dist` |
| Node Version | `[BACKEND: verificar .nvmrc o package.json]` |

### Variables de Entorno (Frontend)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_API_URL` | URL del backend en Render | `https://holypot-backend.onrender.com` |

> Solo hay **una** variable de entorno en el frontend. Toda la configuración sensible vive en el backend.

### Configuración de Rutas SPA

Para que React Router funcione en Render Static Site, se necesita un redirect rule:

```
/* → /index.html  [200]
```

Archivo `frontend-vite/public/_redirects` (Render) o configuración en `render.yaml`:

```yaml
# render.yaml (si existe)
routes:
  - type: rewrite
    source: /*
    destination: /index.html
```

---

## Backend – Render Web Service `[BACKEND]`

### Build Settings `[BACKEND]`

| Parámetro | Valor |
|-----------|-------|
| Root Directory | `[BACKEND]` |
| Build Command | `npm install` |
| Start Command | `node server.js` o `npm start` |
| Node Version | `[BACKEND]` |

### Variables de Entorno (Backend) `[BACKEND]`

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string de Render |
| `JWT_SECRET` | Secret para firmar tokens JWT de usuarios |
| `JWT_ADMIN_SECRET` | Secret para tokens de admin `[BACKEND: o es el mismo?]` |
| `NOWPAYMENTS_API_KEY` | API key de NOWPayments |
| `NOWPAYMENTS_IPN_SECRET` | Secret para verificar webhooks IPN |
| `FINNHUB_API_KEY` | API key de Finnhub |
| `OANDA_API_KEY` | Bearer token de OANDA |
| `OANDA_ACCOUNT_ID` | ID de cuenta OANDA Practice `[BACKEND]` |
| `HCAPTCHA_SECRET` | Secret key de hCaptcha |
| `EMAIL_HOST` | SMTP host `[BACKEND]` |
| `EMAIL_PORT` | SMTP port `[BACKEND]` |
| `EMAIL_USER` | SMTP user `[BACKEND]` |
| `EMAIL_PASS` | SMTP password `[BACKEND]` |
| `EMAIL_FROM` | From address `[BACKEND]` |
| `FRONTEND_URL` | URL del frontend en Render |
| `PORT` | Puerto del servidor (Render lo inyecta como 10000) |
| `NODE_ENV` | `production` |

---

## Base de Datos – Render PostgreSQL `[BACKEND]`

| Parámetro | Valor |
|-----------|-------|
| Plan | `[BACKEND: Free/Starter/etc.]` |
| Región | `[BACKEND: US East / Frankfurt / etc.]` |
| Versión PostgreSQL | `[BACKEND]` |
| Connection Pooling | `[BACKEND: pgBouncer?]` |

### Migraciones `[BACKEND]`

> `[BACKEND]` ¿Se usan migraciones automáticas (Sequelize/Prisma) o SQL manual?

---

## CORS y Seguridad

El backend debe tener CORS configurado para aceptar requests del frontend:

```javascript
// Configuración esperada en backend [BACKEND: verificar]
cors({
  origin: process.env.FRONTEND_URL, // https://holypot-frontend.onrender.com
  credentials: true
})
```

El frontend usa `withCredentials: true` en las llamadas axios (LoginPage).

---

## Puntos Críticos de Escalabilidad

### 1. WebSocket y Plan Free de Render

Render Free tier duerme después de 15min de inactividad. El frontend tiene configurado:

```javascript
reconnectionAttempts: 5,
reconnectionDelay: 1000
```

Esto cubre reconexiones cortas pero **un cold start puede tardar 30-60s**.

> `[BACKEND]` Considerar upgrade a Starter ($7/mes) para evitar cold starts en producción.

### 2. Polling de Velas en EditPositionModal

El modal de edición hace polling cada **1 segundo** a `/api/candles/{symbol}`. Con múltiples usuarios editando simultáneamente esto puede generar carga significativa en el backend.

> `[BACKEND]` Considerar cache corto (1-2s) en el endpoint de velas o pushear velas via WebSocket.

### 3. Cron Job de Settlement (21:00 UTC)

El job de settlement procesa todas las posiciones abiertas de golpe. En Render Free:
- El proceso puede ser lento si hay muchas posiciones
- Si el servidor está dormido a las 21:00 UTC, el job no corre

> `[BACKEND]` Verificar que el cron job tenga un mecanismo de recovery o usar Render Cron Jobs dedicados.

### 4. Rate Limits de APIs Externas

| API | Límite | Impacto |
|-----|--------|---------|
| Finnhub Free | 60 req/min | Con 6 instrumentos × polling = riesgo de throttling |
| OANDA Practice | 120 req/2s | Suficiente para uso actual |
| NOWPayments | Sin límite publicado | No crítico |

> `[BACKEND]` Confirmar si se usa caché de precios (ej. 500ms) para reducir llamadas a Finnhub.

### 5. localStorage y Tokens

El frontend guarda JWTs en localStorage (sin HttpOnly). Si el proyecto escala:
- Considerar mover a cookies HttpOnly para mayor seguridad
- El `holypotToken` es sobreescrito durante impersonación de admin — esto está manejado con el par `holypotAdminToken`

---

## Estructura del Repositorio

```
holypot-frontend/          ← Este repo
├── frontend-vite/         ← Código fuente React
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
├── docs/                  ← Esta carpeta de documentación
│   ├── ARCHITECTURE.md
│   ├── FLOWS.md
│   ├── INTEGRATIONS.md
│   ├── DATABASE_SCHEMA.md
│   └── DEPLOYMENT.md
└── README.md              (si existe)
```

---

## Checklist de Deploy

### Frontend
- [ ] `VITE_API_URL` apunta a URL de backend en Render
- [ ] Redirect rules configuradas para SPA (`/* → /index.html`)
- [ ] Build command: `npm run build` en directorio `frontend-vite/`
- [ ] Publish directory: `frontend-vite/dist`

### Backend `[BACKEND]`
- [ ] Todas las variables de entorno configuradas en Render
- [ ] CORS apunta a URL de frontend
- [ ] `DATABASE_URL` de Render PostgreSQL
- [ ] Migraciones corridas antes del primer deploy
- [ ] Webhook URL de NOWPayments actualizada a URL de producción
- [ ] Cron job de settlement verificado

### Tras el Deploy
- [ ] Verificar WebSocket conecta correctamente (revisar Network tab)
- [ ] Registrar un usuario de prueba y hacer pago de test
- [ ] Verificar que el webhook de NOWPayments llega al backend
- [ ] Confirmar que los precios llegan via liveUpdate
- [ ] Probar apertura y cierre de trade
- [ ] Probar flujo admin → impersonar usuario

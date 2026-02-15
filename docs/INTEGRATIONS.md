# Holypot Trading – Integraciones con APIs Externas

> **Nota:** Las secciones marcadas con `[BACKEND]` deben completarse con información del chat de backend. El frontend solo conoce la existencia de estas integraciones a través de los datos que devuelve el backend.

---

## 1. Finnhub – Precios en Tiempo Real

**Rol:** Proveedor de precios de mercado para instrumentos FX e índices.

**Usado por:** Backend (el frontend recibe precios ya procesados via WebSocket `liveUpdate`).

| Dato | Valor |
|------|-------|
| Sitio | https://finnhub.io |
| Autenticación | API Key en header `X-Finnhub-Token` `[BACKEND: insertar key]` |
| Rate limit | 60 req/min (free tier) `[BACKEND: confirmar tier]` |
| Protocolo | REST + WebSocket propio `[BACKEND: confirmar cuál usan]` |

### Instrumentos Consultados (inferidos desde frontend)

| Símbolo Frontend | Símbolo Finnhub (probable) | Tipo |
|-----------------|---------------------------|------|
| EURUSD | `OANDA:EUR_USD` o `FXCM:EURUSD` | FX |
| GBPUSD | `OANDA:GBP_USD` | FX |
| USDJPY | `OANDA:USD_JPY` | FX |
| XAUUSD | `OANDA:XAU_USD` | Commodities |
| SPX500 | `^GSPC` o `SPY` | Index |
| NAS100 | `^IXIC` o `QQQ` | Index |

> `[BACKEND]` Confirmar los símbolos exactos que usa el backend para cada instrumento.

### Endpoints Relevantes `[BACKEND]`

```
GET https://finnhub.io/api/v1/quote?symbol={symbol}&token={API_KEY}
  → { c: currentPrice, h: high, l: low, o: open, pc: prevClose }

WebSocket: wss://ws.finnhub.io?token={API_KEY}
  → Suscripción: { type: "subscribe", symbol: "OANDA:EUR_USD" }
  → Mensaje: { type: "trade", data: [{ s, p, t, v }] }
```

### Flujo en el Sistema `[BACKEND]`

```
Finnhub → Backend (cache + procesamiento) → Socket.io liveUpdate → Frontend
```

---

## 2. OANDA – Simulación y Validación de Trades

**Rol:** Validación de spreads y posiblemente datos de velas históricas para el chart.

**Usado por:** Backend principalmente; el frontend consume el resultado via `/api/candles/{symbol}`.

| Dato | Valor |
|------|-------|
| Sitio | https://developer.oanda.com |
| Entorno | Practice (fxTrade Practice) o Live `[BACKEND]` |
| Autenticación | Bearer token en header `Authorization` `[BACKEND]` |
| Rate limit | 120 req/2s por IP `[BACKEND: confirmar]` |

### Endpoints Relevantes `[BACKEND]`

```
# Precios / spread actual
GET /v3/accounts/{accountId}/pricing?instruments={instrument}
  → { prices: [{ asks, bids, tradeable }] }

# Velas históricas (usado por EditPositionModal via /api/candles)
GET /v3/instruments/{instrument}/candles?count=500&granularity=S5
  → { candles: [{ time, mid: { o, h, l, c } }] }
```

### Cómo llega al Frontend

```
EditPositionModal → GET /api/candles/{symbol}?from=...
                 ← array de velas OHLC
```

El modal usa **TradingView Lightweight Charts** para renderizar las velas localmente.

### Instrumentos (conversión de símbolo frontend → OANDA) `[BACKEND]`

| Frontend | OANDA |
|----------|-------|
| EURUSD | EUR_USD |
| GBPUSD | GBP_USD |
| USDJPY | USD_JPY |
| XAUUSD | XAU_USD |
| SPX500 | SPX500_USD |
| NAS100 | NAS100_USD |

---

## 3. NOWPayments – Pagos USDT On-Chain

**Rol:** Pasarela de pagos cripto para cobrar el fee de entrada a competencias.

**Usado por:** Backend + webhook; el frontend solo recibe la `paymentUrl` y redirige al usuario.

| Dato | Valor |
|------|-------|
| Sitio | https://nowpayments.io |
| Autenticación | API Key en header `x-api-key` `[BACKEND]` |
| Moneda | USDT (TRC-20 o ERC-20 configurable) `[BACKEND: confirmar red]` |
| Webhook | POST `/webhook/nowpayments` (en backend) |

### Flujo de Pago

```
1. Backend crea invoice → NOWPayments:
   POST https://api.nowpayments.io/v1/payment
   {
     price_amount: 12 | 59 | 107,
     price_currency: "usd",
     pay_currency: "usdttrc20",
     order_id: entryId,
     order_description: "Holypot Basic Entry",
     ipn_callback_url: "{BACKEND_URL}/webhook/nowpayments",
     success_url: "{FRONTEND_URL}/dashboard",
     cancel_url: "{FRONTEND_URL}/"
   }

2. NOWPayments responde → { payment_url, payment_id, pay_address }

3. Frontend redirige usuario a payment_url

4. Usuario paga USDT desde su wallet

5. NOWPayments confirma → llama webhook:
   POST /webhook/nowpayments
   {
     payment_status: "confirmed" | "partially_paid" | "failed",
     order_id: entryId,
     payment_id: "...",
     actually_paid: "12.0"
   }

6. Backend actualiza competition_entry.status = 'active'
```

### Estados de Pago `[BACKEND]`

| Estado NOWPayments | Acción en Backend |
|-------------------|------------------|
| `waiting` | No action |
| `confirming` | No action |
| `confirmed` | Activar entry |
| `partially_paid` | `[BACKEND: manejo?]` |
| `failed` | Marcar entry como failed |
| `expired` | Marcar entry como expired |

### Seguridad del Webhook `[BACKEND]`

```
Verificar IPN signature con NOWPAYMENTS_IPN_SECRET
Header: x-nowpayments-sig
```

---

## 4. hCaptcha – Protección Anti-Bot en Registro

**Rol:** Evitar registros automatizados y abuso de la plataforma.

**Usado por:** Frontend (widget) + Backend (verificación).

| Dato | Valor |
|------|-------|
| Sitio | https://www.hcaptcha.com |
| Sitekey (Frontend) | `a0b26f92-ba34-47aa-be42-c936e488a6f4` |
| Secret Key (Backend) | `[BACKEND: en variable de entorno HCAPTCHA_SECRET]` |

### Flujo

```
1. LandingPage renderiza widget hCaptcha con sitekey
2. Usuario completa el captcha → hCaptcha devuelve token
3. Frontend envía token en POST /api/create-payment { captchaToken, ... }
4. Backend verifica: POST https://hcaptcha.com/siteverify
   { secret: HCAPTCHA_SECRET, response: captchaToken }
5. Si valid: true → continúa el registro
```

---

## 5. TradingView Widget – Charts de Mercado

**Rol:** Gráfico de mercado en tiempo real en el Dashboard principal.

**Usado por:** Frontend directamente (CDN, no pasa por backend).

| Dato | Valor |
|------|-------|
| Fuente | Script CDN de TradingView |
| Autenticación | Ninguna (widget público) |
| Datos | TradingView propios (no OANDA/Finnhub) |
| Timeframe | 1H (configurado en componente) |

### Mapeo de Símbolos (TradingViewChart.jsx) `[FRONTEND]`

```javascript
// Símbolos usados en el widget TradingView
EURUSD  → "FX:EURUSD"  o "OANDA:EURUSD"
GBPUSD  → "FX:GBPUSD"
USDJPY  → "FX:USDJPY"
XAUUSD  → "TVC:GOLD"  o "OANDA:XAUUSD"
SPX500  → "SP:SPX"
NAS100  → "NASDAQ:NDX"
```

> `[BACKEND]` Los símbolos exactos están en `TradingViewChart.jsx` — verificar que coincidan con los que usa el backend para cálculos de P&L.

---

## 6. Socket.io – Comunicación en Tiempo Real

**Rol:** Actualizaciones en vivo de posiciones, precios y capital sin polling HTTP.

| Dato | Valor |
|------|-------|
| Librería cliente | `socket.io-client` |
| URL | `VITE_API_URL` (mismo servidor backend) |
| Transports | `['websocket', 'polling']` (fallback automático) |
| Reconnection | 5 intentos, delay 1000ms |
| Timeout | 10,000ms |

### Eventos

| Evento | Emitido por | Recibido por | Payload |
|--------|------------|-------------|---------|
| `liveUpdate` | Backend (cada ~1s) | Dashboard, AdminDashboard | `{ positions, livePrices, liveCapital }` |
| `tradeClosedAuto` | Backend (TP/SL hit) | Dashboard | `{ reason: 'TP_hit'\|'SL_hit', position: {...} }` |

### Autenticación WebSocket `[BACKEND]`

> `[BACKEND]` Confirmar si el socket verifica el JWT al conectar (middleware handshake) o es sin auth.

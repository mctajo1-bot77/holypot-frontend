# Holypot Trading – Flujos de la Plataforma

> **Nota:** Las secciones marcadas con `[BACKEND]` deben completarse con información del chat de backend.

---

## 1. Registro de Usuario y Selección de Tier

```mermaid
sequenceDiagram
    participant U as Usuario (Browser)
    participant FE as LandingPage.jsx
    participant HC as hCaptcha
    participant BE as Backend /api
    participant NP as NOWPayments
    participant DB as PostgreSQL [BACKEND]
    participant EM as Email Service [BACKEND]

    U->>FE: Rellena form (email, password, wallet, nickname)
    U->>FE: Selecciona tier ($12 / $59 / $107)
    FE->>HC: Solicita token captcha
    HC-->>FE: captchaToken
    FE->>BE: POST /api/create-payment { email, password, wallet, nickname, level, captchaToken }
    BE->>HC: Verifica captchaToken [BACKEND]
    BE->>DB: Crea user + competition_entry (status: pending_payment) [BACKEND]
    BE->>NP: Crea invoice { amount, currency: USDT, orderId: entryId } [BACKEND]
    NP-->>BE: { paymentUrl, paymentId }
    BE-->>FE: { success, paymentUrl, token, entryId }
    FE->>U: localStorage.setItem('holypotToken', token)
    FE->>U: localStorage.setItem('holypotEntryId', entryId)
    FE->>U: window.location = paymentUrl (redirect a NOWPayments)

    Note over NP,BE: Usuario paga USDT on-chain

    NP->>BE: Webhook POST /webhook/nowpayments { payment_status, order_id }
    BE->>DB: UPDATE entry status = 'active' [BACKEND]
    BE->>EM: Envía email verificación [BACKEND]
    EM->>U: Email con link /verify-email?token=...
    U->>BE: GET /verify-email?token=...
    BE->>DB: Marca email como verificado [BACKEND]
    BE-->>U: Redirect a /login con mensaje de éxito
```

---

## 2. Login y Protección de Rutas

```mermaid
sequenceDiagram
    participant U as Usuario
    participant FE as LoginPage.jsx
    participant BE as Backend /api/login
    participant PR as PrivateRoute
    participant DASH as Dashboard

    U->>FE: email + password
    FE->>FE: localStorage.removeItem('holypotAdminToken')
    FE->>FE: localStorage.removeItem('holypotToken')
    FE->>FE: localStorage.removeItem('holypotEntryId')
    FE->>BE: POST /api/login { email, password }
    BE-->>FE: { token, entryId } [BACKEND verifica creds]
    FE->>FE: localStorage.setItem('holypotToken', token)
    FE->>FE: localStorage.setItem('holypotEntryId', entryId)
    FE->>PR: navigate('/dashboard')
    PR->>PR: ¿holypotToken presente?
    alt Token presente
        PR->>DASH: Renderiza Dashboard
    else Sin token
        PR->>FE: Redirige a /login
    end
```

---

## 3. Apertura y Gestión de Trades (Flujo Principal)

```mermaid
sequenceDiagram
    participant U as Trader
    participant DASH as App.jsx (Dashboard)
    participant WS as Socket.io
    participant BE as Backend
    participant FINN as Finnhub [BACKEND]
    participant OANDA as OANDA [BACKEND]
    participant DB as PostgreSQL [BACKEND]

    DASH->>WS: connect (al montar componente)
    WS-->>DASH: liveUpdate { livePrices, positions, liveCapital }
    DASH->>DASH: Renderiza precios en vivo + posiciones abiertas

    Note over U,DASH: Usuario quiere abrir trade
    U->>DASH: Selecciona símbolo (ej. EURUSD)
    U->>DASH: Selecciona dirección (Buy/Sell)
    U->>DASH: Elige tipo orden (Market/Limit/Stop)
    U->>DASH: Configura lots, TP, SL
    DASH->>DASH: useRiskCalculator calcula riesgo %
    Note right of DASH: riesgo = (distPips × pipValue × lots) / capital × 100
    alt Riesgo > 10%
        DASH->>U: Advertencia de riesgo elevado
    end
    U->>DASH: Click "ABRIR TRADE"
    DASH->>BE: POST /api/open-trade { entryId, symbol, direction, orderType, lots, tp, sl, limitPrice }
    BE->>FINN: GET precio actual [BACKEND]
    BE->>OANDA: Valida spread [BACKEND]
    BE->>DB: INSERT position (status: open) [BACKEND]
    BE-->>DASH: { success, positionId }
    WS-->>DASH: liveUpdate (posición nueva incluida)
    DASH->>U: Tabla actualizada con posición abierta

    Note over U,DASH: Usuario cierra trade manualmente
    U->>DASH: Click "Cerrar" en tabla de posiciones
    DASH->>BE: POST /api/close-trade { positionId, entryId }
    BE->>DB: UPDATE position status=closed, pnl calculado [BACKEND]
    BE-->>DASH: { success, pnl }
    WS-->>DASH: liveUpdate (posición cerrada, capital actualizado)

    Note over WS,BE: TP/SL alcanzado automáticamente
    BE->>WS: emit tradeClosedAuto { reason: 'TP_hit'|'SL_hit', position }
    WS-->>DASH: tradeClosedAuto
    DASH->>U: Notificación popup + actualiza tabla
```

---

## 4. Edición de Posición (Modal Avanzado)

```mermaid
sequenceDiagram
    participant U as Trader
    participant DASH as Dashboard
    participant MODAL as EditPositionModal
    participant BE as Backend

    U->>DASH: Click "Editar" en posición
    DASH->>MODAL: Abre modal con positionData
    MODAL->>BE: GET /api/candles/{symbol}?from=...
    BE-->>MODAL: Array de velas OHLC [BACKEND]
    MODAL->>MODAL: Renderiza chart TradingView Lightweight Charts
    MODAL->>MODAL: Dibuja línea precio entrada, TP, SL

    Note over U,MODAL: Usuario arrastra TP/SL en el chart
    U->>MODAL: Drag línea TP hacia arriba
    MODAL->>MODAL: Calcula nuevo pnl potencial
    MODAL->>MODAL: Sonido de drag (audio feedback)

    Note over U,MODAL: Opciones adicionales
    U->>MODAL: Click "Breakeven" → SL se mueve al precio de entrada
    U->>MODAL: Activa "Trailing Stop" → SL sigue al precio
    U->>MODAL: Slider "Cierre Parcial" → configura % a cerrar

    U->>MODAL: Click "GUARDAR CAMBIOS"
    MODAL->>BE: POST /api/edit-position { positionId, tp, sl, lots }
    BE-->>MODAL: { success }
    MODAL->>DASH: Cierra modal + refresca posiciones

    Note over U,MODAL: O cierre parcial
    U->>MODAL: Click "CERRAR PARCIAL"
    MODAL->>BE: POST /api/partial-close { positionId, percentage }
    BE-->>MODAL: { success, closedPnl }
```

---

## 5. Settlement Diario y Payout

```mermaid
sequenceDiagram
    participant CRON as Cron Job 21:00 UTC [BACKEND]
    participant DB as PostgreSQL [BACKEND]
    participant BE as Backend [BACKEND]
    participant NP as NOWPayments [BACKEND]
    participant FE as CompetitionEndModal.jsx
    participant U as Usuario

    CRON->>DB: Cierra todas posiciones abiertas al precio de mercado
    CRON->>DB: Calcula retorno % final de cada entry
    CRON->>DB: Rankea competidores por nivel
    CRON->>DB: Calcula premios (50/30/20% del prize pool)
    CRON->>DB: INSERT payouts para top 3
    CRON->>NP: Inicia pagos USDT a wallets ganadoras [BACKEND]
    NP-->>CRON: { paymentId, status }
    CRON->>DB: UPDATE payout status = confirmed/pending

    Note over FE,U: Usuario activo ve el modal de resultados
    FE->>BE: GET /my-payouts (polling cada 10s)
    BE-->>FE: { payouts: [{ amount, wallet, status }] }
    alt Usuario ganó
        FE->>U: Confetti + fanfare audio + muestra premio
        FE->>U: Muestra payment status (confirmed/pending)
    else Usuario no ganó
        FE->>U: Muestra posición final y retorno
    end
    FE->>BE: GET /ranking?level=... (rankings finales)
    BE-->>FE: Top 3 del día
```

---

## 6. Impersonación de Usuario por Admin

```mermaid
sequenceDiagram
    participant ADM as Admin
    participant ADASH as AdminDashboard.jsx
    participant BE as Backend
    participant DASH as Dashboard (nueva pestaña)

    ADM->>ADASH: Click "Ver como usuario" (fila del usuario)
    ADASH->>BE: POST /api/admin/generate-user-token { entryId }
    Note right of BE: Backend verifica token admin, genera JWT temporal [BACKEND]
    BE-->>ADASH: { success, token, entryId }
    ADASH->>ADASH: adminToken = localStorage.getItem('holypotToken')
    ADASH->>ADASH: localStorage.setItem('holypotAdminToken', adminToken)
    ADASH->>ADASH: localStorage.setItem('holypotToken', token)
    ADASH->>ADASH: localStorage.setItem('holypotEntryId', entryId)
    ADASH->>DASH: window.open('/dashboard', '_blank')
    DASH->>DASH: PrivateRoute ve holypotToken → permite acceso
    Note right of DASH: Admin ve dashboard del usuario (view-only, sin botones de trading)
```

---

## 7. Verificación de Email

```mermaid
sequenceDiagram
    participant U as Usuario
    participant EMAIL as Email Service [BACKEND]
    participant FE as VerifyEmailPage.jsx
    participant BE as Backend

    EMAIL->>U: Email con link /verify-email?token=<jwt>
    U->>FE: Abre link en browser
    FE->>FE: Extrae token de URL params
    FE->>BE: GET /api/verify-email?token=<jwt>
    BE->>BE: Verifica token [BACKEND]
    alt Token válido
        BE-->>FE: { success: true }
        FE->>U: Muestra "Email verificado ✓"
        FE->>FE: setTimeout 3s → navigate('/login')
    else Token inválido/expirado
        BE-->>FE: { error: 'Token inválido' }
        FE->>U: Muestra error
    end
```

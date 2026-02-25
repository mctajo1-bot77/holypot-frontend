// ════════════════════════════════════════════════════════════════════════════
// INSTRUMENT CONFIG
// ════════════════════════════════════════════════════════════════════════════
// pipMultiplier: convierte diferencia de precio → pips (solo para display)
//   EURUSD: 0.0001 = 1 pip  → ×10,000
//   USDJPY: 0.01   = 1 pip  → ×100
//   XAUUSD: 0.1    = 1 pip  → ×10
//   Índices: 1 punto = 1 pip → ×1
//
// CÁLCULO DE RIESGO — fórmula consistente con el modelo de PnL:
//   riskPercent = lotSize × |entryPrice − SL| / entryPrice × 100
//   riskUSD     = virtualCapital × riskPercent / 100
//
// lotSize en esta plataforma es FRACCIÓN DEL CAPITAL (0.01–1.0),
// NO lotes estándar forex (100,000 unidades). Por eso NO se usa pipValue
// en las fórmulas de riesgo.
// ════════════════════════════════════════════════════════════════════════════

export const instrumentConfig = {
  'EURUSD': { pipMultiplier: 10000, displayName: 'EUR/USD', decimals: 5 },
  'GBPUSD': { pipMultiplier: 10000, displayName: 'GBP/USD', decimals: 5 },
  'USDJPY': { pipMultiplier: 100,   displayName: 'USD/JPY', decimals: 3 },
  'XAUUSD': { pipMultiplier: 10,    displayName: 'Gold',    decimals: 2 },
  'SPX500': { pipMultiplier: 1,     displayName: 'S&P 500', decimals: 2 },
  'NAS100': { pipMultiplier: 1,     displayName: 'NASDAQ 100', decimals: 2 }
};

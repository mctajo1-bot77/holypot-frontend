import { instrumentConfig } from './pipConfig';

// ═══════════════════════════════════════════════════════════════════════════
// RISK CALCULATOR — Fórmula consistente con el modelo de PnL del backend
// ═══════════════════════════════════════════════════════════════════════════
// PnL real: pnlAmount = virtualCapital × lotSize × (priceChange / entryPrice)
// Riesgo:   riskPercent = lotSize × |entryPrice - SL| / entryPrice × 100
//
// lotSize en esta plataforma es una FRACCIÓN DEL CAPITAL (0.01–1.0),
// NO lotes estándar forex (100,000 unidades). Por eso pipValue NO se usa.
// ═══════════════════════════════════════════════════════════════════════════

export const useRiskCalculator = (symbol, entryPrice, stopLoss, virtualCapital) => {
  const config = instrumentConfig[symbol] || instrumentConfig['EURUSD'];

  const calculateRealRisk = (lotSize) => {
    if (!entryPrice || entryPrice === 0) {
      return { riskPercent: 0, riskUSD: 0, distancePips: 0, isValid: false };
    }

    if (!stopLoss) {
      // Sin SL: estima con 100 pips convertidos a distancia de precio
      const defaultPriceDistance = 100 / config.pipMultiplier;
      const percentMove = (defaultPriceDistance / entryPrice) * 100;
      const riskPercent = lotSize * percentMove;
      const riskUSD     = (virtualCapital * riskPercent) / 100;
      return { riskPercent, riskUSD, distancePips: 100, isValid: false };
    }

    const distancePips = Math.abs(entryPrice - stopLoss) * config.pipMultiplier;
    const percentMove  = (Math.abs(entryPrice - stopLoss) / entryPrice) * 100;
    const riskPercent  = lotSize * percentMove;
    const riskUSD      = (virtualCapital * riskPercent) / 100;

    return { riskPercent, riskUSD, distancePips, isValid: true };
  };

  const calculateOptimalLotSize = (targetRiskPercent) => {
    if (!entryPrice || entryPrice === 0) return 0.01;

    const percentMove = stopLoss
      ? (Math.abs(entryPrice - stopLoss) / entryPrice) * 100
      : ((100 / config.pipMultiplier) / entryPrice) * 100;

    if (percentMove === 0) return 0.01;

    const optimalLot = targetRiskPercent / percentMove;
    return Math.min(1.0, Math.max(0.01, parseFloat(optimalLot.toFixed(2))));
  };

  return {
    calculateRealRisk,
    calculateOptimalLotSize,
    instrumentInfo: config
  };
};

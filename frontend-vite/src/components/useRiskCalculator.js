import { instrumentConfig } from './pipConfig';

export const useRiskCalculator = (symbol, entryPrice, stopLoss, virtualCapital) => {
  const config = instrumentConfig[symbol] || instrumentConfig['EURUSD'];

  const calculateRealRisk = (lotSize) => {
    if (!entryPrice) {
      return { riskPercent: 0, riskUSD: 0, distancePips: 0, isValid: false };
    }

    if (!stopLoss) {
      // Sin SL: usa mismo default que el backend (100 pips estimados)
      const defaultPips = 100;
      const riskUSD     = defaultPips * config.pipValue * lotSize;
      const riskPercent = (riskUSD / virtualCapital) * 100;
      return { riskPercent, riskUSD, distancePips: defaultPips, isValid: false };
    }

    const distancePips = Math.abs(entryPrice - stopLoss) * config.pipMultiplier;
    const riskUSD      = distancePips * config.pipValue * lotSize;
    const riskPercent  = (riskUSD / virtualCapital) * 100;

    return { riskPercent, riskUSD, distancePips, isValid: true };
  };

  const calculateOptimalLotSize = (targetRiskPercent) => {
    if (!entryPrice) return 0.01;

    const pips = stopLoss
      ? Math.abs(entryPrice - stopLoss) * config.pipMultiplier
      : 100;

    const targetRiskUSD = (virtualCapital * targetRiskPercent) / 100;
    const optimalLot    = targetRiskUSD / (pips * config.pipValue);

    return Math.min(1.0, Math.max(0.01, optimalLot));
  };

  return {
    calculateRealRisk,
    calculateOptimalLotSize,
    instrumentInfo: config
  };
};

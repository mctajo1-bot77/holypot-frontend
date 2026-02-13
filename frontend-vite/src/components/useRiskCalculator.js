import { instrumentConfig } from './pipConfig';

export const useRiskCalculator = (symbol, entryPrice, stopLoss, virtualCapital) => {
  const config = instrumentConfig[symbol] || instrumentConfig['EURUSD'];
  
  const calculateRealRisk = (lotSize) => {
    if (!stopLoss || !entryPrice) {
      return { riskPercent: lotSize * 10, riskUSD: 0, distancePips: 0, isValid: false };
    }
    
    const distancePips = Math.abs(entryPrice - stopLoss) * config.pipMultiplier;
    const riskUSD = distancePips * config.pipValue * lotSize;
    const riskPercent = (riskUSD / virtualCapital) * 100;
    
    return { riskPercent, riskUSD, distancePips, isValid: true };
  };
  
  const calculateOptimalLotSize = (targetRiskPercent) => {
    if (!stopLoss || !entryPrice) return 0.01;
    
    const distancePips = Math.abs(entryPrice - stopLoss) * config.pipMultiplier;
    const targetRiskUSD = (virtualCapital * targetRiskPercent) / 100;
    const optimalLot = targetRiskUSD / (distancePips * config.pipValue);
    
    return Math.min(1.0, Math.max(0.01, optimalLot));
  };
  
  return { 
    calculateRealRisk, 
    calculateOptimalLotSize,
    instrumentInfo: config
  };
};

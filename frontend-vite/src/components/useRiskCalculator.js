export const useRiskCalculator = (symbol, entryPrice, stopLoss, virtualCapital) => {
  const config = instrumentConfig[symbol];
  
  const calculateRealRisk = (lotSize) => {
    if (!stopLoss || !entryPrice || !config) {
      return { riskPercent: lotSize * 10, riskUSD: 0 }; // Fallback
    }
    
    // Distancia en pips
    const distancePips = Math.abs(entryPrice - stopLoss) * config.pipMultiplier;
    
    // Riesgo en USD
    const riskUSD = distancePips * config.pipValue * lotSize;
    
    // Riesgo en %
    const riskPercent = (riskUSD / virtualCapital) * 100;
    
    return { riskPercent, riskUSD, distancePips };
  };
  
  const calculateOptimalLotSize = (targetRiskPercent) => {
    if (!stopLoss || !entryPrice || !config) return 0.01;
    
    const distancePips = Math.abs(entryPrice - stopLoss) * config.pipMultiplier;
    const targetRiskUSD = (virtualCapital * targetRiskPercent) / 100;
    const optimalLot = targetRiskUSD / (distancePips * config.pipValue);
    
    return Math.min(1.0, Math.max(0.01, optimalLot));
  };
  
  return { calculateRealRisk, calculateOptimalLotSize };
};

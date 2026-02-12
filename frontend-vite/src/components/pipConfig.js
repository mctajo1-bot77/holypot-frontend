export const instrumentConfig = {
  'EURUSD': { 
    pipValue: 10,        // $10 por pip (1 lote estándar)
    pipMultiplier: 10000, // 0.0001 = 1 pip
    displayName: 'EUR/USD'
  },
  'GBPUSD': { 
    pipValue: 10, 
    pipMultiplier: 10000,
    displayName: 'GBP/USD'
  },
  'USDJPY': { 
    pipValue: 9.09,      // Yen pairs slightly different
    pipMultiplier: 100,  // 0.01 = 1 pip (only 2 decimals)
    displayName: 'USD/JPY'
  },
  'XAUUSD': { 
    pipValue: 10,
    pipMultiplier: 10,   // Gold: 0.10 = 1 pip
    displayName: 'Gold'
  },
  'SPX500': { 
    pipValue: 50,        // $50 per point
    pipMultiplier: 1,
    displayName: 'S&P 500'
  },
  'NAS100': { 
    pipValue: 20,        // $20 per point
    pipMultiplier: 1,
    displayName: 'NASDAQ 100'
  }
};

import React, { useEffect, useRef, useState } from 'react';

function TradingViewChart({ symbol, currentPrice, virtualCapital = 10000, isFullscreen = false, onToggleFullscreen }) {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  const [tvReady, setTvReady] = useState(false);

  // Mapeo symbols OANDA (datos precisos + consistentes con backend Finnhub)
  const tvSymbolMap = {
    EURUSD: 'OANDA:EURUSD',
    GBPUSD: 'OANDA:GBPUSD',
    USDJPY: 'OANDA:USDJPY',
    XAUUSD: 'OANDA:XAUUSD',
    SPX500: 'SP:SPX',
    NAS100: 'NASDAQ:NDX',
  };
  const tvSymbol = tvSymbolMap[symbol] || 'OANDA:EURUSD';

  // P&L total live %
  const totalPnlPercent = ((virtualCapital - 10000) / 10000 * 100).toFixed(2);

  // Cargar tv.js UNA SOLA VEZ (global)
  useEffect(() => {
    if (tvReady) return;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => setTvReady(true);
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [tvReady]);

  // Recrear widget cuando cambia symbol o está listo
  useEffect(() => {
    if (!tvReady || !containerRef.current) return;

    // Limpiar widget anterior si existe
    if (widgetRef.current) {
      widgetRef.current.remove();
      widgetRef.current = null;
    }

    // Crear nuevo widget con OANDA
    const widget = new window.TradingView.widget({
      container_id: containerRef.current.id,
      width: '100%',
      height: '100%',
      symbol: tvSymbol,
      interval: '60',
      timezone: 'UTC',
      theme: 'dark',
      style: '1',
      locale: 'es',
      toolbar_bg: '#000000',
      enable_publishing: false,
      allow_symbol_change: false,
      hide_side_toolbar: false,
      withdateranges: true,
      autosize: true,
      studies: ['MASimple@tv-basicstudies'],
      overrides: {
        "paneProperties.background": "#000000",
        "paneProperties.vertGridProperties.color": "#2B2B43",
        "paneProperties.horzGridProperties.color": "#2B2B43",
      },
    });

    widgetRef.current = widget;
  }, [tvReady, tvSymbol]);

  return (
    <div className={
      isFullscreen
        ? 'fixed inset-0 z-[9999] bg-black'
        : 'relative w-full h-full min-h-[500px] bg-black overflow-hidden rounded-3xl'
    }>
      {/* Equity live flotante (mejor posición y estilo) */}
      <div className="absolute bottom-4 left-4 z-20 bg-black/80 backdrop-blur-lg border border-holy/50 rounded-xl px-6 py-4 shadow-2xl">
        <p className="text-white text-lg font-bold">
          Equity live: {virtualCapital.toFixed(0)} USDT
        </p>
        <p className={`text-3xl font-bold ${totalPnlPercent >= 0 ? 'text-profit' : 'text-red-500'}`}>
          {totalPnlPercent >= 0 ? '+' : ''}{totalPnlPercent}%
        </p>
        {currentPrice && (
          <p className="text-blue-400 text-lg mt-1">
            Precio {symbol}: {currentPrice.toFixed(5)}
          </p>
        )}
      </div>

      {/* Botón fullscreen */}
      <button
        onClick={() => onToggleFullscreen && onToggleFullscreen()}
        className="absolute top-3 right-3 z-20 bg-black/70 hover:bg-black/90 border border-holy/40 text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition"
        title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
      >
        {isFullscreen ? '✕ Salir' : '⛶ Fullscreen'}
      </button>

      {/* Container del widget – ocupa TODO el espacio disponible */}
      <div
        id="tradingview_chart_container"
        ref={containerRef}
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}

export default TradingViewChart;
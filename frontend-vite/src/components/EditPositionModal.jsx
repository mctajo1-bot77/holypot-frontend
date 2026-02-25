import React, { useState, useEffect, useRef } from 'react';
import { createChart, ColorType, CrosshairMode, LineStyle } from 'lightweight-charts';
import apiClient from '@/api';
import { instrumentConfig } from '@/components/pipConfig';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:5000/api';

const soundDragStart = new Audio('https://freesound.org/data/previews/341/341695_581577-lq.mp3');
const soundDragEnd   = new Audio('https://freesound.org/data/previews/245/245645_4041066-lq.mp3');
const soundAction    = new Audio('https://freesound.org/data/previews/269/269026_5123856-lq.mp3');

// Tamaño de 1 pip según instrumento
const getPipSize = (symbol) => {
  if (!symbol) return 0.0001;
  if (symbol.includes('JPY')) return 0.01;
  if (symbol === 'XAUUSD') return 0.1;
  if (symbol === 'SPX500' || symbol === 'NAS100') return 1.0;
  return 0.0001;
};

// Decimales a mostrar según instrumento
const getPriceDecimals = (symbol) => {
  if (!symbol) return 4;
  if (symbol === 'XAUUSD') return 2;
  if (symbol === 'SPX500' || symbol === 'NAS100') return 1;
  if (symbol.includes('JPY')) return 3;
  return 4;
};

// Tolerancia para detectar hover sobre una línea
const getDragTolerance = (symbol) => {
  if (!symbol) return 0.0002;
  if (symbol.includes('JPY')) return 0.05;
  if (symbol === 'XAUUSD') return 0.5;
  if (symbol === 'SPX500' || symbol === 'NAS100') return 5;
  return 0.0002;
};

const EditPositionModal = ({
  position,
  open,
  onOpenChange,
  onSave,
  currentPrice,
  virtualCapital = 10000,
  userRank = 'Calculando...'
}) => {
  const chartContainerRef = useRef(null);
  const chartRef          = useRef(null);
  const seriesRef         = useRef(null);
  const linesRef          = useRef({});

  const currentLotSize = position?.lotSize || 0.01;

  const [editLotSize,    setEditLotSize]    = useState(currentLotSize.toFixed(2));
  const dec = getPriceDecimals(position?.symbol);
  const [editTakeProfit, setEditTakeProfit] = useState(
    position?.takeProfit ? position.takeProfit.toFixed(dec) : ''
  );
  const [editStopLoss, setEditStopLoss] = useState(
    position?.stopLoss ? position.stopLoss.toFixed(dec) : ''
  );
  const [trailingActive,  setTrailingActive]  = useState(false);
  const [trailingPips,    setTrailingPips]    = useState(20);
  const [partialPercent,  setPartialPercent]  = useState(50);
  const [candles,         setCandles]         = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [isDragging,      setIsDragging]      = useState(null); // 'tp' | 'sl' | null
  const [isModalVisible,  setIsModalVisible]  = useState(false);
  const [initialized,     setInitialized]     = useState(false);
  // Toggle: true = ver mi entrada (con líneas), false = modo análisis limpio
  const [showEntryLines,  setShowEntryLines]  = useState(true);
  // Indicador visual de auto-guardado tras arrastrar
  const [dragSaved,       setDragSaved]       = useState(null); // 'tp' | 'sl' | null
  const [dragError,       setDragError]       = useState(false);
  const [slRiskBlocked,   setSlRiskBlocked]   = useState(false); // SL drag bloqueado por 10% max

  // Refs con los últimos valores para leerlos dentro de event handlers sin deps
  const editTakeProfitRef = useRef(editTakeProfit);
  const editStopLossRef   = useRef(editStopLoss);
  const editLotSizeRef    = useRef(editLotSize);
  const isDraggingRef     = useRef(null);
  const showEntryLinesRef = useRef(true);

  // Mantener refs sincronizados con el estado actual
  useEffect(() => { editTakeProfitRef.current = editTakeProfit; }, [editTakeProfit]);
  useEffect(() => { editStopLossRef.current   = editStopLoss;   }, [editStopLoss]);
  useEffect(() => { editLotSizeRef.current    = editLotSize;    }, [editLotSize]);
  useEffect(() => { isDraggingRef.current     = isDragging;     }, [isDragging]);
  useEffect(() => { showEntryLinesRef.current = showEntryLines; }, [showEntryLines]);

  const equityLive    = Math.floor(virtualCapital).toLocaleString('es-ES');
  const returnPercent = ((virtualCapital - 10000) / 10000 * 100).toFixed(2);

  // ─── Sync open → isModalVisible ────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setTimeout(() => setIsModalVisible(true), 150);
    } else {
      setIsModalVisible(false);
      setInitialized(false);
    }
  }, [open]);

  // ─── Cargar velas (poll 1 s) ────────────────────────────────────────────────
  useEffect(() => {
    if (!open || !position?.symbol) {
      setCandles([]);
      setLoading(false);
      return;
    }

    const fetchCandles = async () => {
      if (!initialized) setLoading(true);
      try {
        const res = await apiClient.get(`/candles/${position.symbol}`, { params: { from: 0 } });
        const newCandles = res.data.candles || [];
        setCandles(newCandles);

        if (seriesRef.current && !initialized && newCandles.length > 0) {
          seriesRef.current.setData(newCandles);
          setInitialized(true);
          chartRef.current?.timeScale().fitContent();
        }
        if (seriesRef.current && initialized && newCandles.length > 0) {
          seriesRef.current.update(newCandles[newCandles.length - 1]);
        }
      } catch {
        setCandles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCandles();
    const interval = setInterval(fetchCandles, 1000);
    return () => clearInterval(interval);
  }, [open, position?.symbol]);

  // ─── Crear chart UNA sola vez ───────────────────────────────────────────────
  useEffect(() => {
    if (!isModalVisible || !chartContainerRef.current || !position) return;

    const chart = createChart(chartContainerRef.current, {
      width:  chartContainerRef.current.clientWidth,
      height: 500,
      layout: { background: { type: ColorType.Solid, color: '#000' }, textColor: '#fff' },
      grid:   { vertLines: { color: '#333' }, horzLines: { color: '#333' } },
      crosshair: { mode: CrosshairMode.Normal },
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
        rightOffset: 20,
        barSpacing: 25,
        minBarSpacing: 5,
        maxBarSpacing: 50,
        lockVisibleTimeRangeOnResize: true,
        fixLeftEdge: false,
      },
      handleScroll: true,
      handleScale:  true,
      localization: { priceFormatter: p => p.toFixed(getPriceDecimals(position?.symbol)) },
    });
    chartRef.current = chart;

    const series = chart.addCandlestickSeries({
      upColor:     '#00C853',
      downColor:   '#F44336',
      wickUpColor: '#00C853',
      wickDownColor: '#F44336',
    });
    seriesRef.current = series;

    // ── Líneas iniciales (entrada + live + TP/SL) ──
    const d = getPriceDecimals(position.symbol);

    linesRef.current.entry = series.createPriceLine({
      price:            position.entryPrice,
      color:            '#FFD700',
      lineWidth:        2,
      lineStyle:        LineStyle.Dashed,
      axisLabelVisible: true,
      title:            `Entry ${position.entryPrice.toFixed(d)}`,
    });

    if (currentPrice) {
      linesRef.current.live = series.createPriceLine({
        price:            currentPrice,
        color:            '#00FFFF',
        lineWidth:        2,
        lineStyle:        LineStyle.Solid,
        axisLabelVisible: true,
        title:            `Live ${currentPrice.toFixed(d)}`,
      });
    }

    if (position.takeProfit) {
      linesRef.current.tp = series.createPriceLine({
        price:            position.takeProfit,
        color:            '#00C853',
        lineWidth:        3,
        axisLabelVisible: true,
        title:            `TP ${position.takeProfit.toFixed(d)}`,
      });
    }

    if (position.stopLoss) {
      linesRef.current.sl = series.createPriceLine({
        price:            position.stopLoss,
        color:            '#F44336',
        lineWidth:        3,
        axisLabelVisible: true,
        title:            `SL ${position.stopLoss.toFixed(d)}`,
      });
    }

    const resizeObserver = new ResizeObserver(() => {
      chart.applyOptions({
        width:  chartContainerRef.current.clientWidth,
        height: 500,
      });
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      linesRef.current = {};
    };
  }, [isModalVisible, position]);

  // ─── Update línea live ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!seriesRef.current || !currentPrice || !showEntryLines) return;
    const d = getPriceDecimals(position?.symbol);

    if (linesRef.current.live) {
      linesRef.current.live.applyOptions({
        price: currentPrice,
        title: `Live ${currentPrice.toFixed(d)}`,
      });
    } else {
      linesRef.current.live = seriesRef.current.createPriceLine({
        price:            currentPrice,
        color:            '#00FFFF',
        lineWidth:        2,
        lineStyle:        LineStyle.Solid,
        axisLabelVisible: true,
        title:            `Live ${currentPrice.toFixed(d)}`,
      });
    }
  }, [currentPrice, showEntryLines]);

  // ─── Update línea TP ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!seriesRef.current || !showEntryLines) return;
    const d = getPriceDecimals(position?.symbol);

    if (linesRef.current.tp) seriesRef.current.removePriceLine(linesRef.current.tp);
    linesRef.current.tp = null;

    if (editTakeProfit) {
      const price = parseFloat(editTakeProfit);
      if (!isNaN(price)) {
        linesRef.current.tp = seriesRef.current.createPriceLine({
          price,
          color:            '#00C853',
          lineWidth:        3,
          axisLabelVisible: true,
          title:            `TP ${price.toFixed(d)}`,
        });
      }
    }
  }, [editTakeProfit, showEntryLines]);

  // ─── Update línea SL ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!seriesRef.current || !showEntryLines) return;
    const d = getPriceDecimals(position?.symbol);

    if (linesRef.current.sl) seriesRef.current.removePriceLine(linesRef.current.sl);
    linesRef.current.sl = null;

    if (editStopLoss) {
      const price = parseFloat(editStopLoss);
      if (!isNaN(price)) {
        linesRef.current.sl = seriesRef.current.createPriceLine({
          price,
          color:            '#F44336',
          lineWidth:        3,
          axisLabelVisible: true,
          title:            `SL ${price.toFixed(d)}`,
        });
      }
    }
  }, [editStopLoss, showEntryLines]);

  // ─── Toggle análisis / mi entrada ──────────────────────────────────────────
  useEffect(() => {
    if (!seriesRef.current) return;

    if (!showEntryLines) {
      // Modo análisis: quitar todas las líneas overlay
      ['entry', 'live', 'tp', 'sl'].forEach(key => {
        if (linesRef.current[key]) {
          seriesRef.current.removePriceLine(linesRef.current[key]);
          linesRef.current[key] = null;
        }
      });
    } else {
      // Volver a crear todas las líneas con valores actuales
      const d = getPriceDecimals(position?.symbol);
      if (position?.entryPrice) {
        linesRef.current.entry = seriesRef.current.createPriceLine({
          price:            position.entryPrice,
          color:            '#FFD700',
          lineWidth:        2,
          lineStyle:        LineStyle.Dashed,
          axisLabelVisible: true,
          title:            `Entry ${position.entryPrice.toFixed(d)}`,
        });
      }
      if (currentPrice) {
        linesRef.current.live = seriesRef.current.createPriceLine({
          price:            currentPrice,
          color:            '#00FFFF',
          lineWidth:        2,
          lineStyle:        LineStyle.Solid,
          axisLabelVisible: true,
          title:            `Live ${currentPrice.toFixed(d)}`,
        });
      }
      if (editTakeProfit) {
        const tp = parseFloat(editTakeProfit);
        if (!isNaN(tp)) {
          linesRef.current.tp = seriesRef.current.createPriceLine({
            price:            tp,
            color:            '#00C853',
            lineWidth:        3,
            axisLabelVisible: true,
            title:            `TP ${tp.toFixed(d)}`,
          });
        }
      }
      if (editStopLoss) {
        const sl = parseFloat(editStopLoss);
        if (!isNaN(sl)) {
          linesRef.current.sl = seriesRef.current.createPriceLine({
            price:            sl,
            color:            '#F44336',
            lineWidth:        3,
            axisLabelVisible: true,
            title:            `SL ${sl.toFixed(d)}`,
          });
        }
      }
    }
  }, [showEntryLines]);

  // ─── Trailing Stop ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!trailingActive || !currentPrice || !position?.direction) return;

    const pipsValue = trailingPips * getPipSize(position.symbol);

    const d = getPriceDecimals(position?.symbol);
    if (position.direction === 'long') {
      const newSL = currentPrice - pipsValue;
      if (newSL > (parseFloat(editStopLoss) || -Infinity)) {
        setEditStopLoss(newSL.toFixed(d));
      }
    } else {
      const newSL = currentPrice + pipsValue;
      if (newSL < (parseFloat(editStopLoss) || Infinity)) {
        setEditStopLoss(newSL.toFixed(d));
      }
    }
  }, [currentPrice, trailingActive, trailingPips, position?.direction, editStopLoss]);

  // ─── Drag SL/TP sobre el gráfico (con auto-save al soltar) ────────────────
  // isModalVisible en deps: el chart se crea DESPUÉS de que el modal es visible (150ms),
  // así que sin este dep el effect se ejecutaba antes de que chartRef.current existiera.
  useEffect(() => {
    if (!open || !isModalVisible || !chartRef.current || !chartContainerRef.current) return;

    const container  = chartContainerRef.current;
    const entry      = position?.entryPrice;
    const dir        = position?.direction;
    const sym        = position?.symbol;
    const tolerance  = getDragTolerance(sym);
    const decimals   = getPriceDecimals(sym);
    const pipCfg     = instrumentConfig[sym] || instrumentConfig['EURUSD'];
    const lotSize    = parseFloat(position?.lotSize) || 0.01;
    const capital    = virtualCapital || 10000;

    const getPriceFromMouse = (e) => {
      const rect = container.getBoundingClientRect();
      return seriesRef.current?.coordinateToPrice(e.clientY - rect.top) ?? null;
    };

    // Usa refs para leer siempre el valor más reciente sin re-attachar listeners
    const handleMouseMove = (e) => {
      if (!showEntryLinesRef.current) { container.style.cursor = 'default'; return; }
      const price = getPriceFromMouse(e);
      if (price === null) return;

      const dragging = isDraggingRef.current;
      if (dragging === 'tp') {
        container.style.cursor = 'grabbing';
        if (dir === 'long'  && price > entry) setEditTakeProfit(price.toFixed(decimals));
        if (dir === 'short' && price < entry) setEditTakeProfit(price.toFixed(decimals));
      } else if (dragging === 'sl') {
        container.style.cursor = 'grabbing';
        // Verificar que el nuevo SL no supere el 10% de riesgo máximo
        const distPips   = Math.abs(entry - price) * pipCfg.pipMultiplier;
        const riskUSD    = distPips * pipCfg.pipValue * lotSize;
        const riskPct    = (riskUSD / capital) * 100;
        if (riskPct > 10) {
          setSlRiskBlocked(true);
          setTimeout(() => setSlRiskBlocked(false), 1500);
          return; // no mover el SL — excede el 10%
        }
        if (dir === 'long'  && price < entry && price > 0) setEditStopLoss(price.toFixed(decimals));
        if (dir === 'short' && price > entry)              setEditStopLoss(price.toFixed(decimals));
      } else {
        const tp  = editTakeProfitRef.current;
        const sl  = editStopLossRef.current;
        const overTP = tp && Math.abs(price - parseFloat(tp)) < tolerance;
        const overSL = sl && Math.abs(price - parseFloat(sl)) < tolerance;
        container.style.cursor = overTP || overSL ? 'ns-resize' : 'default';
      }
    };

    const handleMouseDown = (e) => {
      if (!showEntryLinesRef.current) return;
      const price = getPriceFromMouse(e);
      if (price === null) return;

      const tp = editTakeProfitRef.current;
      const sl = editStopLossRef.current;

      if (tp && Math.abs(price - parseFloat(tp)) < tolerance) {
        setIsDragging('tp');
        soundDragStart.play().catch(() => {});
      } else if (sl && Math.abs(price - parseFloat(sl)) < tolerance) {
        setIsDragging('sl');
        soundDragStart.play().catch(() => {});
      }
    };

    // Auto-save cuando se suelta la línea
    const handleMouseUp = async () => {
      const wasDragging = isDraggingRef.current;
      if (!wasDragging) return;

      soundDragEnd.play().catch(() => {});
      setIsDragging(null);
      container.style.cursor = 'default';

      // Leer valores actualizados desde refs
      const tp  = editTakeProfitRef.current ? parseFloat(editTakeProfitRef.current) : null;
      const sl  = editStopLossRef.current   ? parseFloat(editStopLossRef.current)   : null;
      const lot = parseFloat(editLotSizeRef.current) || position?.lotSize;

      try {
        await apiClient.post('/edit-position', {
          positionId: position.id,
          lotSize:    lot,
          takeProfit: tp,
          stopLoss:   sl,
        });
        setDragSaved(wasDragging);
        setTimeout(() => setDragSaved(null), 2000);
      } catch (err) {
        console.error('Auto-save drag failed:', err);
        setDragError(true);
        setTimeout(() => setDragError(false), 3000);
      }
    };

    container.addEventListener('mousemove',  handleMouseMove);
    container.addEventListener('mousedown',  handleMouseDown);
    container.addEventListener('mouseup',    handleMouseUp);
    container.addEventListener('mouseleave', handleMouseUp);

    return () => {
      container.removeEventListener('mousemove',  handleMouseMove);
      container.removeEventListener('mousedown',  handleMouseDown);
      container.removeEventListener('mouseup',    handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseUp);
    };
  // isModalVisible aquí es clave: garantiza que el chart ya existe cuando se attachen los listeners
  }, [open, isModalVisible, position?.id, position?.symbol, position?.direction, position?.entryPrice, position?.lotSize]);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleBreakeven = () => {
    const pip = getPipSize(position?.symbol);
    const offset = position.direction === 'long' ? pip : -pip;
    setEditStopLoss((position.entryPrice + offset).toFixed(getPriceDecimals(position?.symbol)));
    soundAction.play().catch(() => {});
  };

  const handlePartialClose = async () => {
    if (partialPercent < 10 || partialPercent > 90) {
      alert('Partial close entre 10% y 90%');
      return;
    }
    try {
      await apiClient.post('/partial-close', {
        positionId: position.id,
        percent:    partialPercent / 100,
      });
      soundAction.play().catch(() => {});
      onSave();
    } catch (err) {
      alert('Error partial close: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleSave = () => {
    const lot = parseFloat(editLotSize.replace(',', '.'));
    const tp  = editTakeProfit ? parseFloat(editTakeProfit.replace(',', '.')) : null;
    const sl  = editStopLoss   ? parseFloat(editStopLoss.replace(',', '.'))   : null;

    if (isNaN(lot) || lot <= 0) {
      alert('LotSize inválido');
      return;
    }
    if (lot > currentLotSize) {
      alert('LotSize no puede ser mayor al actual');
      return;
    }

    const entry = position.entryPrice;
    if (tp !== null) {
      if (position.direction === 'long'  && tp <= entry) { alert('TP debe ser mayor al entry en LONG');  return; }
      if (position.direction === 'short' && tp >= entry) { alert('TP debe ser menor al entry en SHORT'); return; }
    }
    if (sl !== null) {
      if (position.direction === 'long'  && sl >= entry) { alert('SL debe ser menor al entry en LONG');  return; }
      if (position.direction === 'short' && sl <= entry) { alert('SL debe ser mayor al entry en SHORT'); return; }
    }

    onSave({ lotSize: lot, takeProfit: tp, stopLoss: sl });
    soundAction.play().catch(() => {});
  };

  if (!position) return null;

  const dirColor = position.direction === 'long' ? 'text-profit' : 'text-red-400';
  const dirLabel = position.direction === 'long' ? 'LONG ▲' : 'SHORT ▼';

  // Calcular P&L de esta posición
  const pipSize   = getPipSize(position.symbol);
  const pnlPips   = currentPrice
    ? (position.direction === 'long'
        ? (currentPrice - position.entryPrice) / pipSize
        : (position.entryPrice - currentPrice) / pipSize)
    : 0;
  const pnlColor  = pnlPips >= 0 ? 'text-profit' : 'text-red-400';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-[#080808] backdrop-blur-xl border border-holy/30 text-white p-0 rounded-2xl">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-white/10">
          <div>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-holy font-mono">{position.symbol}</span>
              <span className={`text-sm font-bold px-2 py-0.5 rounded ${position.direction === 'long' ? 'bg-profit/20 text-profit' : 'bg-red-500/20 text-red-400'}`}>
                {dirLabel}
              </span>
              <span className="text-gray-400 text-sm font-normal">× {position.lotSize}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 mt-0.5">
              Entry: <span className="text-white font-mono">{position.entryPrice?.toFixed(getPriceDecimals(position.symbol))}</span>
              {currentPrice && (
                <> · Live: <span className="text-cyan-400 font-mono">{currentPrice.toFixed(getPriceDecimals(position.symbol))}</span></>
              )}
              {pnlPips !== 0 && (
                <> · <span className={`font-bold ${pnlColor}`}>{pnlPips >= 0 ? '+' : ''}{pnlPips.toFixed(1)} pips</span></>
              )}
            </DialogDescription>
          </div>

          {/* Equity + Rank */}
          <div className="text-right">
            <p className="text-lg font-bold text-holy leading-tight">
              {equityLive} USDT
            </p>
            <p className={`text-sm font-bold leading-tight ${returnPercent >= 0 ? 'text-profit' : 'text-red-400'}`}>
              {returnPercent >= 0 ? '+' : ''}{returnPercent}%
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Ranking: <span className="text-holy">{userRank}</span></p>
          </div>
        </div>

        {/* ── Chart + toggle ── */}
        <div className="px-4 pt-3">
          {/* Toggle bar */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">
              {showEntryLines
                ? '📍 Viendo tu entrada activa — arrastra las líneas TP/SL para ajustarlas'
                : '📊 Modo análisis — gráfico limpio sin líneas de posición'}
            </p>
            <button
              onClick={() => setShowEntryLines(v => !v)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                showEntryLines
                  ? 'bg-holy/15 border-holy/40 text-holy hover:bg-holy/25'
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-400'
              }`}
            >
              {showEntryLines ? '📊 Ver solo gráfico' : '📍 Ver mi entrada'}
            </button>
          </div>

          {/* Chart */}
          <div
            ref={chartContainerRef}
            className="w-full h-[420px] rounded-xl overflow-hidden bg-black border border-white/10 relative"
          >
            {loading && (
              <div className="absolute top-2 right-2 z-10">
                <p className="text-xs text-holy animate-pulse">Cargando...</p>
              </div>
            )}

            {/* Indicador de auto-guardado */}
            {dragSaved && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                <span className="flex items-center gap-1.5 bg-profit/20 border border-profit/50 text-profit text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
                  ✓ {dragSaved === 'tp' ? 'TP' : 'SL'} guardado automáticamente
                </span>
              </div>
            )}
            {dragError && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                <span className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/50 text-red-400 text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
                  ✕ Error al guardar — usa el botón manual
                </span>
              </div>
            )}
            {slRiskBlocked && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                <span className="flex items-center gap-1.5 bg-orange-500/20 border border-orange-500/50 text-orange-300 text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
                  ⚠ SL bloqueado — excede el 10% de riesgo máximo
                </span>
              </div>
            )}

            {showEntryLines && (
              <div className="absolute bottom-2 left-2 z-10 flex gap-2 pointer-events-none">
                <span className="text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-yellow-400">— Entry</span>
                <span className="text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-cyan-400">— Live</span>
                {editTakeProfit && <span className="text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-green-400">— TP</span>}
                {editStopLoss   && <span className="text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-red-400">— SL</span>}
              </div>
            )}
          </div>
        </div>

        {/* ── Controles ── */}
        <div className="px-4 pb-5 pt-4 space-y-4">

          {/* Fila 1: LotSize + Trailing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-400">
                LotSize <span className="text-gray-600">(actual: {currentLotSize})</span>
              </Label>
              <Input
                type="text"
                value={editLotSize}
                onChange={(e) => {
                  const val = e.target.value.replace(',', '.');
                  if (val === '' || /^\d*\.?\d*$/.test(val)) setEditLotSize(val);
                }}
                placeholder="0.50"
                className="mt-1.5 bg-[#111] border-white/15 text-white font-mono"
              />
              <p className="text-[10px] text-gray-600 mt-1">Solo puedes reducir el tamaño</p>
            </div>

            <div>
              <Label className="text-xs text-gray-400">Trailing Stop</Label>
              <div className="flex items-center gap-3 mt-1.5">
                <Checkbox
                  checked={trailingActive}
                  onCheckedChange={setTrailingActive}
                  className="border-white/30"
                />
                <Input
                  type="number"
                  value={trailingPips}
                  onChange={e => setTrailingPips(parseInt(e.target.value) || 20)}
                  className="w-20 bg-[#111] border-white/15 text-white font-mono"
                  min={1}
                />
                <span className="text-xs text-gray-400">pips</span>
              </div>
              {trailingActive && (
                <p className="text-[10px] text-holy mt-1">✓ Activo — SL se ajusta automáticamente</p>
              )}
            </div>
          </div>

          {/* Fila 2: TP + SL */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-400">
                Take Profit
                {editTakeProfit && currentPrice && (
                  <span className="ml-2 text-green-400 font-mono">
                    ({((parseFloat(editTakeProfit) - (position.direction === 'long' ? currentPrice : 0) + (position.direction === 'short' ? currentPrice : 0)) / pipSize * (position.direction === 'short' ? -1 : 1)).toFixed(0)} pips)
                  </span>
                )}
              </Label>
              <Input
                type="text"
                value={editTakeProfit}
                onChange={(e) => {
                  const val = e.target.value.replace(',', '.');
                  if (val === '' || /^\d*\.?\d*$/.test(val)) setEditTakeProfit(val);
                }}
                placeholder={position.direction === 'long' ? 'Por encima del entry' : 'Por debajo del entry'}
                className="mt-1.5 bg-[#111] border-green-600/40 text-green-300 font-mono focus:border-green-500"
              />
            </div>

            <div>
              <Label className="text-xs text-gray-400">
                Stop Loss
                {editStopLoss && currentPrice && (
                  <span className="ml-2 text-red-400 font-mono">
                    ({Math.abs((parseFloat(editStopLoss) - currentPrice) / pipSize).toFixed(0)} pips)
                  </span>
                )}
              </Label>
              <Input
                type="text"
                value={editStopLoss}
                onChange={(e) => {
                  const val = e.target.value.replace(',', '.');
                  if (val === '' || /^\d*\.?\d*$/.test(val)) setEditStopLoss(val);
                }}
                placeholder={position.direction === 'long' ? 'Por debajo del entry' : 'Por encima del entry'}
                className="mt-1.5 bg-[#111] border-red-600/40 text-red-300 font-mono focus:border-red-500"
              />
            </div>
          </div>

          {/* Fila 3: Breakeven + Partial Close */}
          <div className="bg-white/5 rounded-xl p-3 flex flex-col gap-3 border border-white/10">
            <div className="flex items-center gap-3">
              <Button
                onClick={handleBreakeven}
                size="sm"
                className="bg-profit/20 text-profit border border-profit/40 hover:bg-profit/30 font-semibold text-xs px-4"
              >
                ⚡ Breakeven
              </Button>
              <p className="text-[11px] text-gray-500">
                Mueve el SL al entry price (+1 pip) para proteger la posición
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handlePartialClose}
                size="sm"
                variant="destructive"
                className="bg-red-600/20 text-red-300 border border-red-600/40 hover:bg-red-600/30 font-semibold text-xs px-4 shrink-0"
              >
                ✂ Cierre parcial {partialPercent}%
              </Button>
              <Slider
                value={[partialPercent]}
                onValueChange={v => setPartialPercent(v[0])}
                min={10}
                max={90}
                step={5}
                className="flex-1 [&_[role=track]]:bg-gray-700 [&_[role=thumb]]:bg-red-400 [&_[role=thumb]]:ring-red-400/50"
              />
              <span className="text-xs text-gray-400 w-8 text-right shrink-0">{partialPercent}%</span>
            </div>
          </div>

          {/* Guardar */}
          <Button
            onClick={handleSave}
            className="w-full bg-gradient-to-r from-holy to-purple-600 text-black text-base py-5 font-bold rounded-xl hover:scale-[1.02] transition"
          >
            Guardar cambios
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditPositionModal;

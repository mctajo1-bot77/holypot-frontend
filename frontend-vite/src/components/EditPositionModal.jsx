import React, { useState, useEffect, useRef } from 'react';
import { createChart, ColorType, CrosshairMode, LineStyle } from 'lightweight-charts';
import axios from 'axios';
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

const API_BASE = 'http://localhost:5000/api';

const soundDragStart = new Audio('https://freesound.org/data/previews/341/341695_581577-lq.mp3');
const soundDragEnd = new Audio('https://freesound.org/data/previews/245/245645_4041066-lq.mp3');
const soundAction = new Audio('https://freesound.org/data/previews/269/269026_5123856-lq.mp3');

const EditPositionModal = ({ position, open, onOpenChange, onSave, currentPrice, virtualCapital = 10000, userRank = 'Calculando...' }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const linesRef = useRef({});

  const currentLotSize = position?.lotSize || 0.01;
  const [editLotSize, setEditLotSize] = useState(currentLotSize.toFixed(2));
  const [editTakeProfit, setEditTakeProfit] = useState(position?.takeProfit ? position.takeProfit.toFixed(4) : '');
  const [editStopLoss, setEditStopLoss] = useState(position?.stopLoss ? position.stopLoss.toFixed(4) : '');
  const [trailingActive, setTrailingActive] = useState(false);
  const [trailingPips, setTrailingPips] = useState(20);
  const [partialPercent, setPartialPercent] = useState(50);
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Equity live entero
  const equityLive = Math.floor(virtualCapital).toLocaleString('es-ES');
  const returnPercent = ((virtualCapital - 10000) / 10000 * 100).toFixed(2);

  // Sincroniza open con isModalVisible (delay para animación Shadcn)
  useEffect(() => {
    if (open) {
      setTimeout(() => setIsModalVisible(true), 150);
    } else {
      setIsModalVisible(false);
      setInitialized(false);
    }
  }, [open]);

  // Cargar velas globales del par (desde 0 para contexto completo del día)
  useEffect(() => {
    if (!open || !position?.symbol) {
      setCandles([]);
      setLoading(false);
      return;
    }

    const fetchCandles = async () => {
      // Loading solo la primera vez (evita overlay parpadeante)
      if (!initialized) setLoading(true);

      try {
        const res = await axios.get(`${API_BASE}/candles/${position.symbol}`, {
          params: { from: 0 }
        });
        const newCandles = res.data.candles || [];
        setCandles(newCandles);
        console.log('Velas cargadas en modal:', newCandles.length);

        // setData solo la primera vez
        if (seriesRef.current && !initialized && newCandles.length > 0) {
          seriesRef.current.setData(newCandles);
          setInitialized(true);
          chartRef.current?.timeScale().fitContent();
        }

        // Update solo la última vela si cambia (sin flicker)
        if (seriesRef.current && initialized && newCandles.length > 0) {
          const lastCandle = newCandles[newCandles.length - 1];
          seriesRef.current.update(lastCandle);
        }
      } catch (err) {
        console.error('Error loading candles in modal', err);
        setCandles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCandles();

    // Poll cada 1 segundo para update ultra-live (solo última vela)
    const interval = setInterval(fetchCandles, 1000);
    return () => clearInterval(interval);
  }, [open, position?.symbol]);

  // Crear chart UNA SOLA VEZ cuando isModalVisible (velas grandes + zoom/pan full + espacio derecho)
  useEffect(() => {
    if (!isModalVisible || !chartContainerRef.current || !position) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: { background: { type: ColorType.Solid, color: '#000' }, textColor: '#fff' },
      grid: { vertLines: { color: '#333' }, horzLines: { color: '#333' } },
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
      handleScale: true,
      localization: {
        priceFormatter: p => p.toFixed(4),
      },
    });
    chartRef.current = chart;

    const series = chart.addCandlestickSeries({
      upColor: '#00C853',
      downColor: '#F44336',
      wickUpColor: '#00C853',
      wickDownColor: '#F44336',
    });
    seriesRef.current = series;

    // Entry line (4 decimales)
    linesRef.current.entry = series.createPriceLine({
      price: position.entryPrice,
      color: '#FFD700',
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: `Entry ${position.entryPrice.toFixed(4)}`,
    });

    // Línea live (4 decimales)
    if (currentPrice) {
      linesRef.current.live = series.createPriceLine({
        price: currentPrice,
        color: '#00FFFF',
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: `Live ${currentPrice.toFixed(4)}`,
      });
    }

    // ResizeObserver extra (para modals Shadcn)
    const resizeObserver = new ResizeObserver(() => {
      chart.applyOptions({
        width: chartContainerRef.current.clientWidth,
        height: 500,
      });
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [isModalVisible, position]);

  // Update línea live (4 decimales)
  useEffect(() => {
    if (!seriesRef.current || !currentPrice) return;

    if (linesRef.current.live) {
      linesRef.current.live.applyOptions({
        price: currentPrice,
        title: `Live ${currentPrice.toFixed(4)}`,
      });
    } else {
      linesRef.current.live = seriesRef.current.createPriceLine({
        price: currentPrice,
        color: '#00FFFF',
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: `Live ${currentPrice.toFixed(4)}`,
      });
    }
  }, [currentPrice]);

  // Update TP/SL lines (4 decimales)
  useEffect(() => {
    if (!seriesRef.current) return;

    if (linesRef.current.tp) seriesRef.current.removePriceLine(linesRef.current.tp);
    if (editTakeProfit) {
      linesRef.current.tp = seriesRef.current.createPriceLine({
        price: parseFloat(editTakeProfit),
        color: '#00C853',
        lineWidth: 3,
        axisLabelVisible: true,
        title: `TP ${parseFloat(editTakeProfit).toFixed(4)}`,
      });
    }
  }, [editTakeProfit]);

  useEffect(() => {
    if (!seriesRef.current) return;

    if (linesRef.current.sl) seriesRef.current.removePriceLine(linesRef.current.sl);
    if (editStopLoss) {
      linesRef.current.sl = seriesRef.current.createPriceLine({
        price: parseFloat(editStopLoss),
        color: '#F44336',
        lineWidth: 3,
        axisLabelVisible: true,
        title: `SL ${parseFloat(editStopLoss).toFixed(4)}`,
      });
    }
  }, [editStopLoss]);

  // Drag logic (igual)
  useEffect(() => {
    if (!open || !chartRef.current) return;

    const container = chartContainerRef.current;

    const getPriceFromMouse = (e) => {
      const rect = container.getBoundingClientRect();
      const y = e.clientY - rect.top;
      return seriesRef.current.coordinateToPrice(y);
    };

    const tolerance = position.symbol.includes('JPY') ? 0.02 : 0.0002;

    const handleMouseMove = (e) => {
      const price = getPriceFromMouse(e);
      const overTP = editTakeProfit && Math.abs(price - parseFloat(editTakeProfit)) < tolerance;
      const overSL = editStopLoss && Math.abs(price - parseFloat(editStopLoss)) < tolerance;

      if (isDragging) {
        container.style.cursor = 'grabbing';
      } else {
        container.style.cursor = overTP || overSL ? 'ns-resize' : 'default';
      }
    };

    const handleMouseDown = (e) => {
      const price = getPriceFromMouse(e);
      if (editTakeProfit && Math.abs(price - parseFloat(editTakeProfit)) < tolerance) {
        setIsDragging('tp');
        soundDragStart.play().catch(() => {});
      } else if (editStopLoss && Math.abs(price - parseFloat(editStopLoss)) < tolerance) {
        setIsDragging('sl');
        soundDragStart.play().catch(() => {});
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        soundDragEnd.play().catch(() => {});
        setIsDragging(null);
        container.style.cursor = 'default';
      }
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseUp);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [open, editTakeProfit, editStopLoss, isDragging, position.symbol]);

  // Trailing Stop
  useEffect(() => {
    if (!trailingActive || !currentPrice || !position.direction) return;

    const pipsValue = trailingPips * (position.symbol.includes('JPY') ? 0.01 : 0.0001);

    let newSL;
    if (position.direction === 'long') {
      newSL = currentPrice - pipsValue;
      if (newSL > (parseFloat(editStopLoss) || -Infinity)) {
        setEditStopLoss(newSL.toFixed(4));
      }
    } else {
      newSL = currentPrice + pipsValue;
      if (newSL < (parseFloat(editStopLoss) || Infinity)) {
        setEditStopLoss(newSL.toFixed(4));
      }
    }
  }, [currentPrice, trailingActive, trailingPips, position.direction, editStopLoss]);

  const handleBreakeven = () => {
    const offset = position.direction === 'long' ? 0.0001 : -0.0001;
    const bePrice = (position.entryPrice + offset).toFixed(4);
    setEditStopLoss(bePrice);
    soundAction.play().catch(() => {});
  };

  const handlePartialClose = async () => {
    if (partialPercent < 10 || partialPercent > 90) {
      alert('Partial close entre 10% y 90%');
      return;
    }
    try {
      await axios.post(`${API_BASE}/partial-close`, {
        positionId: position.id,
        percent: partialPercent / 100,
      });
      soundAction.play().catch(() => {});
      onSave();
    } catch (err) {
      alert('Error partial close');
    }
  };

  const handleSave = () => {
    // Parse values
    const lot = parseFloat(editLotSize.replace(',', '.'));
    const tp = editTakeProfit ? parseFloat(editTakeProfit.replace(',', '.')) : null;
    const sl = editStopLoss ? parseFloat(editStopLoss.replace(',', '.')) : null;

    // Validación lotSize ≤ current
    if (lot > currentLotSize) {
      alert('LotSize no puede ser mayor al actual');
      return;
    }

    // Validación lógica TP/SL
    const entry = position.entryPrice;
    if (tp !== null) {
      if (position.direction === 'long' && tp <= entry) {
        alert('TP debe ser mayor al entry price en LONG');
        return;
      }
      if (position.direction === 'short' && tp >= entry) {
        alert('TP debe ser menor al entry price en SHORT');
        return;
      }
    }

    if (sl !== null) {
      if (position.direction === 'long' && sl >= entry) {
        alert('SL debe ser menor al entry price en LONG');
        return;
      }
      if (position.direction === 'short' && sl <= entry) {
        alert('SL debe ser mayor al entry price en SHORT');
        return;
      }
    }

    onSave({
      lotSize: lot,
      takeProfit: tp,
      stopLoss: sl,
    });
    soundAction.play().catch(() => {});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-black/90 backdrop-blur-xl border border-holy/40 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl text-holy">
            Editar {position?.symbol} {position?.direction.toUpperCase()}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Arrastra las líneas verde (TP) o roja (SL) en el gráfico. Solo números en los campos.
          </DialogDescription>
        </DialogHeader>

        {/* Equity superior derecha (saldo live) */}
        <div className="absolute top-4 right-6 text-right">
          <p className="text-2xl font-bold text-holy">
            Equity: {equityLive} USDT
          </p>
          <p className={`text-xl font-bold ${returnPercent >= 0 ? 'text-profit' : 'text-red-500'}`}>
            ({returnPercent >= 0 ? '+' : ''}{returnPercent}%)
          </p>
        </div>

        {/* Ranking live superior central */}
        <div className="text-center -mt-4 mb-4">
          <p className="text-3xl font-bold text-holy">
            Posición {userRank}
          </p>
        </div>

        <div ref={chartContainerRef} className="w-full h-[500px] rounded-lg overflow-hidden bg-black border border-gray-800 relative">
          {loading && (
            <div className="absolute top-2 right-2 z-10">
              <p className="text-sm text-holy animate-pulse">Cargando...</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6 mt-8">
          <div>
            <Label>LotSize (risk ~{(parseFloat(editLotSize) * 10).toFixed(1)}%)</Label>
            <Input
              type="text" // type="text" para edición libre
              value={editLotSize}
              onChange={(e) => {
                let val = e.target.value.replace(',', '.');
                if (val === '' || /^\d*\.?\d*$/.test(val)) { // solo números + punto
                  setEditLotSize(val);
                }
              }}
              placeholder="0.50"
              className="mt-2"
            />
          </div>

          <div>
            <Label>Trailing Stop</Label>
            <div className="flex items-center gap-4 mt-2">
              <Checkbox checked={trailingActive} onCheckedChange={setTrailingActive} />
              <Input
                type="number"
                value={trailingPips}
                onChange={e => setTrailingPips(parseInt(e.target.value) || 20)}
                className="w-24"
              />
              <span>pips</span>
            </div>
          </div>

          <div>
            <Label>Take Profit: {editTakeProfit || 'Ninguno'}</Label>
            <Input
              type="text" // type="text" para edición libre
              value={editTakeProfit}
              onChange={(e) => {
                let val = e.target.value.replace(',', '.');
                if (val === '' || /^\d*\.?\d*$/.test(val)) { // solo números + punto
                  setEditTakeProfit(val);
                }
              }}
              placeholder="1.0850"
              className="mt-2"
            />
          </div>

          <div>
            <Label>Stop Loss: {editStopLoss || 'Ninguno'}</Label>
            <Input
              type="text" // type="text" para edición libre
              value={editStopLoss}
              onChange={(e) => {
                let val = e.target.value.replace(',', '.');
                if (val === '' || /^\d*\.?\d*$/.test(val)) { // solo números + punto
                  setEditStopLoss(val);
                }
              }}
              placeholder="1.0750"
              className="mt-2"
            />
          </div>

          <div className="col-span-2 flex gap-4 items-center">
            <Button onClick={handleBreakeven} className="bg-profit text-black">
              Breakeven
            </Button>
            <Button onClick={handlePartialClose} variant="destructive">
              Partial Close {partialPercent}%
            </Button>
            <Slider
              value={[partialPercent]}
              onValueChange={v => setPartialPercent(v[0])}
              min={10}
              max={90}
              className="flex-1 [&_[role=track]]:bg-gray-600 [&_[role=thumb]]:bg-holy [&_[role=thumb]]:ring-holy/50"
            />
          </div>
        </div>

        <Button
          onClick={handleSave}
          className="w-full mt-8 bg-gradient-to-r from-holy to-purple-600 text-black text-xl py-6 font-bold rounded-full hover:scale-105 transition"
        >
          Guardar cambios
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default EditPositionModal;
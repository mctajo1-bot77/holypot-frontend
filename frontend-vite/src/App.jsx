import React, { useState, useEffect } from 'react';
import axios from "axios";
import apiClient from '@/api'; // Nuevo path
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { io } from "socket.io-client";
import { 
  Rocket, 
  Coins, 
  Crown, 
  Power 
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import TradingViewChart from "@/components/TradingViewChart";
import logo from "@/assets/Holypot-logo.webp";
import background from "@/assets/background.jpg";
import EditPositionModal from "@/components/EditPositionModal";

// ✅ CONFIGURACIÓN DINÁMICA: Detecta automáticamente si estás en desarrollo o producción
const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : 'http://localhost:5000/api';

// ✅ SOCKET.IO OPTIMIZADO: Reconexión automática y transporte eficiente
const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
  transports: ['websocket', 'polling'], // Intenta WebSocket primero, luego polling
  reconnection: true,                    // Reconexión automática si se cae
  reconnectionAttempts: 5,              // Máximo 5 intentos
  reconnectionDelay: 1000,              // Espera 1 segundo entre intentos
  timeout: 10000                        // Timeout de 10 segundos
});

// ✅ INTERCEPTOR AXIOS: Agrega token automáticamente a todas las peticiones
axios.interceptors.request.use(config => {
  const userToken = localStorage.getItem('holypotToken');
  const adminToken = localStorage.getItem('holypotAdminToken');
  const token = userToken || adminToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function Dashboard() {
  const navigate = useNavigate();

  const [entryId, setEntryId] = useState(localStorage.getItem('holypotEntryId') || '');
  const [symbol, setSymbol] = useState('EURUSD');
  const [orderType, setOrderType] = useState('market');
  const [direction, setDirection] = useState('long');
  const [targetPrice, setTargetPrice] = useState('');
  const [lotSize, setLotSize] = useState(0.5);
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [livePrices, setLivePrices] = useState({});
  const [currentPrice, setCurrentPrice] = useState(null);
  const [positions, setPositions] = useState([]);
  const [totalRisk, setTotalRisk] = useState(0);
  const [virtualCapital, setVirtualCapital] = useState(10000);
  const [competitions, setCompetitions] = useState({});
  const [userLevel, setUserLevel] = useState('basic');
  const [selectedLevel, setSelectedLevel] = useState('basic');
  const [currentRanking, setCurrentRanking] = useState([]);
  const [advice, setAdvice] = useState(null);

  const [editingPosition, setEditingPosition] = useState(null);

  const [myPayouts, setMyPayouts] = useState([]);
  const [showWinModal, setShowWinModal] = useState(false);
  const [latestWin, setLatestWin] = useState(null);

  const isAdminSession = !!localStorage.getItem('holypotAdminToken');

  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num || 0);
  };

  const formatPercent = (num) => {
    const value = parseFloat(num);
    return isNaN(value) ? '0.00%' : (value > 0 ? '+' : '') + value.toFixed(2) + '%';
  };

  const percentChange = ((virtualCapital - 10000) / 10000 * 100);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  useEffect(() => {
    const stored = localStorage.getItem('holypotEntryId');
    if (!stored) window.location.href = '/';
    else setEntryId(stored);
  }, []);

  useEffect(() => {
    if (!entryId) return;

    const fetchData = async () => {
      try {
        const compRes = await axios.get(`${API_BASE}/competitions/active`);
        const comps = {};
        compRes.data.forEach(c => {
          comps[c.level] = {
            prizePool: c.prizePool,
            participants: c.participants,
            timeLeft: c.timeLeft
          };
        });
        setCompetitions(comps);

        const posRes = await axios.get(`${API_BASE}/my-positions?entryId=${entryId}`);
        setPositions(posRes.data.positions || []);
        setTotalRisk(posRes.data.totalRiskPercent || 0);
        setVirtualCapital(parseFloat(posRes.data.virtualCapital) || 10000);
        setLivePrices(posRes.data.livePrices || {});

        const adviceRes = await axios.get(`${API_BASE}/my-advice`);
        setAdvice(adviceRes.data.advice);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [entryId]);

  useEffect(() => {
    setCurrentPrice(livePrices[symbol] || null);
  }, [symbol, livePrices]);

  useEffect(() => {
    if (!selectedLevel) return;

    const fetchRanking = async () => {
      try {
        const rankRes = await axios.get(`${API_BASE}/ranking?level=${selectedLevel}`);
        setCurrentRanking(rankRes.data || []);
      } catch (err) {
        console.error(err);
        setCurrentRanking([]);
      }
    };

    fetchRanking();
  }, [selectedLevel]);

  useEffect(() => {
    if (userLevel && competitions[userLevel]) {
      setSelectedLevel(userLevel);
    }
  }, [userLevel, competitions]);

  useEffect(() => {
    if (!entryId) return;

    socket.on('liveUpdate', (data) => {
      const myEntry = data.find(d => d.entryId === entryId);
      if (myEntry) {
        setPositions(myEntry.positions || []);
        setVirtualCapital(parseFloat(myEntry.liveCapital) || 10000);
        setLivePrices(myEntry.livePrices || {});
      }
    });

    socket.on('tradeClosedAuto', (data) => {
      if (data.entryId === entryId) {
        alert(`¡Trade cerrado automáticamente!\nMotivo: ${data.reason === 'TP_hit' ? 'Take Profit' : 'Stop Loss'}\nP&L: ${data.pnlPercent}%`);
      }
    });

    return () => {
      socket.off('liveUpdate');
      socket.off('tradeClosedAuto');
    };
  }, [entryId]);

  useEffect(() => {
    const fetchMyPayouts = async () => {
      try {
        const res = await axios.get(`${API_BASE}/my-payouts`);
        setMyPayouts(res.data);

        const recentWin = res.data.find(p => 
          p.status === 'confirmed' && 
          new Date(p.date) > new Date(Date.now() - 48 * 60 * 60 * 1000)
        );
        if (recentWin) {
          setLatestWin(recentWin);
          setShowWinModal(true);
        }
      } catch (err) {
        console.error('Error fetching my-payouts:', err);
      }
    };

    fetchMyPayouts();
  }, []);

  const openTrade = async () => {
    if (lotSize < 0.01 || lotSize > 1.0) {
      alert('LotSize debe estar entre 0.01 y 1.0');
      return;
    }

    if (orderType !== 'market') {
      if (!targetPrice) {
        alert('Precio objetivo obligatorio para orden Limit/Stop');
        return;
      }
      const tp = parseFloat(targetPrice);
      if (isNaN(tp)) {
        alert('Precio objetivo inválido');
        return;
      }

      if (orderType === 'limit') {
        if (direction === 'long' && tp >= currentPrice) {
          alert('Buy Limit debe ser menor al precio actual');
          return;
        }
        if (direction === 'short' && tp <= currentPrice) {
          alert('Sell Limit debe ser mayor al precio actual');
          return;
        }
      }

      if (orderType === 'stop') {
        if (direction === 'long' && tp <= currentPrice) {
          alert('Buy Stop debe ser mayor al precio actual');
          return;
        }
        if (direction === 'short' && tp >= currentPrice) {
          alert('Sell Stop debe ser menor al precio actual');
          return;
        }
      }
    }

    try {
      const res = await axios.post(`${API_BASE}/open-trade`, {
        entryId,
        symbol,
        direction,
        lotSize,
        orderType,
        targetPrice: orderType !== 'market' ? parseFloat(targetPrice) : null,
        takeProfit: takeProfit ? parseFloat(takeProfit) : null,
        stopLoss: stopLoss ? parseFloat(stopLoss) : null
      });
      alert(res.data.message);
      setTargetPrice('');
      setTakeProfit('');
      setStopLoss('');
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  const closeTrade = async (positionId) => {
    try {
      const res = await axios.post(`${API_BASE}/close-trade`, { positionId });
      alert(res.data.message);
    } catch (err) {
      alert('Error close: ' + (err.response?.data?.error || err.message));
    }
  };

  const userComp = competitions[userLevel] || { prizePool: 0, participants: 0, timeLeft: '00h 00m' };
  const activeLevels = Object.keys(competitions).filter(level => (competitions[level]?.participants || 0) > 0);

  return (
    <TooltipProvider>
      <div className="min-h-screen text-white relative overflow-hidden">
        {/* FONDO ESPACIO + OVERLAY */}
        <div className="fixed inset-0 -z-10">
          <img src={background} alt="Fondo" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/60" />
        </div>

        {/* HEADER GLASS AZUL SUTIL */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-primary/65 backdrop-blur-md border-b border-holy/20 shadow-md py-6">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
            <div className="relative">
              <img 
                src={logo} 
                alt="Holypot Logo" 
                className="h-16 w-16 object-contain drop-shadow-2xl animate-float"
              />
              <div className="absolute -inset-4 rounded-full bg-holy/20 blur-3xl animate-pulse-slow-halo" />
            </div>

            <div className="text-center">
              <h1 className="text-4xl font-bold text-holy">Holypot Trading 🚀</h1>
              <p className="text-lg text-gray-300 mt-1">
                Nivel: {userLevel.toUpperCase()} | Participantes: {userComp.participants} | Tiempo restante: <span className="text-red-500 font-bold animate-pulse">{userComp.timeLeft}</span>
              </p>
            </div>

            <div className="text-right">
              <p className="text-2xl font-bold text-holy animate-pulse">
                Prize pool: {formatNumber(userComp.prizePool)} USDT
              </p>
              <p className="text-xl mt-1">
                Saldo live: <span className={percentChange >= 0 ? "text-profit" : "text-red-500"}>{formatNumber(Math.floor(virtualCapital))} USDT</span> ({formatPercent(percentChange)})
              </p>
            </div>
          </div>
        </header>

        {/* SIDEBAR */}
        <aside className="fixed left-0 top-24 bottom-0 w-20 bg-primary/90 backdrop-blur border-r border-borderSubtle shadow-card flex flex-col items-center py-8 space-y-8">
          <nav className="flex-1 flex flex-col items-center space-y-10">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-holy/20" onClick={() => navigate('/dashboard')}>
                  <Rocket className="h-10 w-10" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right"><p>Dashboard</p></TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-holy/20" onClick={() => navigate('/profile')}>
                  <Coins className="h-10 w-10" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right"><p>Mi Perfil</p></TooltipContent>
            </Tooltip>

            {isAdminSession && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-holy/20" onClick={() => navigate('/admin')}>
                    <Crown className="h-10 w-10" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right"><p>Panel Admin</p></TooltipContent>
              </Tooltip>
            )}

            <div className="mt-auto">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-red-700" onClick={handleLogout}>
                    <Power className="h-10 w-10" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right"><p>Cerrar Sesión</p></TooltipContent>
              </Tooltip>
            </div>
          </nav>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="ml-20 pt-32 px-8 pb-20">
          {/* CONSEJO IA GLASS */}
          <div className="relative group mb-12">
            <div className="absolute inset-0 bg-gradient-to-br from-holy/30 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition" />
            <Card className="relative bg-black/30 backdrop-blur-xl border border-holy/40 rounded-3xl shadow-2xl p-8 text-center hover:scale-105 transition-all duration-500">
              <p className="text-3xl font-bold text-holy mb-6">Consejo IA del día (by Grok)</p>
              <p className="text-2xl text-gray-200">
                {advice || 'Compite hoy para recibir tu consejo personalizado mañana 🚀'}
              </p>
            </Card>
          </div>

          {/* CARDS MULTI-NIVEL GLASS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            {/* BASIC */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-profit/30 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition" />
              <Card className="relative bg-black/30 backdrop-blur-xl border border-profit/40 rounded-3xl shadow-2xl p-10 text-center hover:scale-105 transition-all duration-500">
                <CardHeader>
                  <CardTitle className="text-4xl text-profit">BASIC</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl text-holy mb-4">Prize pool: {formatNumber(competitions.basic?.prizePool || 0)} USDT</p>
                  <p className="text-xl text-gray-200 mb-2">Participantes: {competitions.basic?.participants || 0}</p>
                  <p className="text-lg text-gray-300">Tiempo restante: <span className="text-red-500 font-bold animate-pulse">{competitions.basic?.timeLeft || '00h 00m'}</span></p>
                </CardContent>
              </Card>
            </div>

            {/* MEDIUM */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition" />
              <Card className="relative bg-black/30 backdrop-blur-xl border border-blue-500/40 rounded-3xl shadow-2xl p-10 text-center hover:scale-105 transition-all duration-500">
                <CardHeader>
                  <CardTitle className="text-4xl text-blue-400">MEDIUM</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl text-holy mb-4">Prize pool: {formatNumber(competitions.medium?.prizePool || 0)} USDT</p>
                  <p className="text-xl text-gray-200 mb-2">Participantes: {competitions.medium?.participants || 0}</p>
                  <p className="text-lg text-gray-300">Tiempo restante: <span className="text-red-500 font-bold animate-pulse">{competitions.medium?.timeLeft || '00h 00m'}</span></p>
                </CardContent>
              </Card>
            </div>

            {/* PREMIUM */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-holy/40 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition" />
              <Card className="relative bg-black/30 backdrop-blur-xl border border-holy/50 rounded-3xl shadow-2xl p-10 text-center hover:scale-105 transition-all duration-500">
                <CardHeader>
                  <CardTitle className="text-4xl text-holy">PREMIUM</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl text-holy mb-4">Prize pool: {formatNumber(competitions.premium?.prizePool || 0)} USDT</p>
                  <p className="text-xl text-gray-200 mb-2">Participantes: {competitions.premium?.participants || 0}</p>
                  <p className="text-lg text-gray-300">Tiempo restante: <span className="text-red-500 font-bold animate-pulse">{competitions.premium?.timeLeft || '00h 00m'}</span></p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* GRÁFICO + NEW TRADE GLASS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12">
            {/* GRÁFICO */}
            <div className="lg:col-span-2 relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-holy/20 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition" />
              <Card className="relative bg-black/30 backdrop-blur-xl border border-holy/40 rounded-3xl shadow-2xl hover:scale-103 transition-all duration-300 h-[830px]">
                <CardHeader>
                  <CardTitle className="text-3xl text-holy text-center">Gráfico {symbol} Live</CardTitle>
                </CardHeader>
                <CardContent className="p-0 h-full">
                  <TradingViewChart 
                    symbol={symbol} 
                    positions={positions} 
                    currentPrice={currentPrice} 
                    virtualCapital={virtualCapital}  
                  />
                </CardContent>
              </Card>
            </div>

            {/* NEW TRADE CARD */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-holy/30 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition" />
              <Card className="relative bg-black/30 backdrop-blur-xl border border-holy/40 rounded-3xl shadow-2xl p-8 hover:scale-103 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-3xl text-holy text-center">New Trade</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-center text-2xl font-bold text-gray-200">
                    Precio actual {symbol}: {currentPrice ? currentPrice.toFixed(5) : 'Cargando...'}
                  </p>

                  <Tabs value={orderType} onValueChange={setOrderType} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-black/40 border border-borderSubtle rounded-xl">
                      <TabsTrigger value="market" className="text-white">Market</TabsTrigger>
                      <TabsTrigger value="limit" className="text-white">Limit</TabsTrigger>
                      <TabsTrigger value="stop" className="text-white">Stop</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div>
                    <label className="text-xl font-bold mb-2 block text-gray-200">Symbol</label>
                    <Select value={symbol} onValueChange={setSymbol}>
                      <SelectTrigger className="w-full bg-black/40 border-borderSubtle text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EURUSD">EURUSD</SelectItem>
                        <SelectItem value="GBPUSD">GBPUSD</SelectItem>
                        <SelectItem value="USDJPY">USDJPY</SelectItem>
                        <SelectItem value="XAUUSD">XAUUSD</SelectItem>
                        <SelectItem value="SPX500">SPX500</SelectItem>
                        <SelectItem value="NAS100">NAS100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xl font-bold mb-2 block text-gray-200">Direction</label>
                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        onClick={() => setDirection('long')} 
                        className={`text-xl h-16 font-bold rounded-lg shadow-lg transition-all
                          ${direction === 'long' ? 'bg-profit hover:bg-profit/80 border-4 border-profit text-black' : 'bg-profit/70 hover:bg-profit/90 text-white'}`}
                      >
                        {orderType === 'market' ? 'LONG' : orderType === 'limit' ? 'Buy Limit' : 'Buy Stop'}
                      </Button>
                      <Button 
                        onClick={() => setDirection('short')} 
                        className={`text-xl h-16 font-bold rounded-lg shadow-lg transition-all
                          ${direction === 'short' ? 'bg-red-700 hover:bg-red-800 border-4 border-red-900' : 'bg-red-500 hover:bg-red-600 border-2 border-red-600'}`}
                      >
                        {orderType === 'market' ? 'SHORT' : orderType === 'limit' ? 'Sell Limit' : 'Sell Stop'}
                      </Button>
                    </div>
                  </div>

                  {orderType !== 'market' && (
                    <div>
                      <label className="text-xl font-bold mb-2 block text-gray-200">Precio objetivo</label>
                      <Input 
                        type="number" 
                        step="0.00001" 
                        placeholder="ej: 1.10500" 
                        value={targetPrice} 
                        onChange={e => setTargetPrice(e.target.value)} 
                        className="bg-black/40 border-borderSubtle text-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xl font-bold mb-2 block text-gray-200">
                      LotSize (risk ~{(lotSize * 10).toFixed(1)}%)
                    </label>
                    <div className="flex items-center gap-4">
                      <Slider 
                        min={0.01} 
                        max={1.0} 
                        step={0.01} 
                        value={[lotSize]} 
                        onValueChange={(v) => setLotSize(v[0])}
                        className="flex-1 bg-gray-700 [&_[role=slider]]:bg-holy [&_[role=slider]]:hover:bg-holyGlow [&_[role=slider]]:ring-holy"
                      />
                      <Input 
                        type="number" 
                        min="0.01" 
                        max="1.0" 
                        step="0.01"
                        value={lotSize.toFixed(2)}
                        onChange={(e) => {
                          let val = parseFloat(e.target.value);
                          if (isNaN(val)) val = 0.01;
                          val = Math.max(0.01, Math.min(1.0, val));
                          setLotSize(val);
                        }}
                        className="w-32 bg-black/40 border-borderSubtle text-white text-center"
                      />
                    </div>
                    <p className="text-center text-2xl mt-3 font-bold text-white">
                      {lotSize.toFixed(2)} lot (risk ~{(lotSize * 10).toFixed(1)}%)
                    </p>
                  </div>

                  <div>
                    <label className="text-xl font-bold mb-2 block text-gray-200">Take Profit (opcional)</label>
                    <Input type="number" step="0.00001" placeholder="ej: 1.10500" value={takeProfit} onChange={e => setTakeProfit(e.target.value)} className="bg-black/40 border-borderSubtle text-white" />
                  </div>

                  <div>
                    <label className="text-xl font-bold mb-2 block text-gray-200">Stop Loss (opcional)</label>
                    <Input type="number" step="0.00001" placeholder="ej: 1.09000" value={stopLoss} onChange={e => setStopLoss(e.target.value)} className="bg-black/40 border-borderSubtle text-white" />
                  </div>

                  <Button onClick={openTrade} className="w-full bg-gradient-to-r from-holy to-purple-600 text-black text-3xl py-8 font-bold rounded-full shadow-lg hover:shadow-holy/50 hover:scale-105 transition duration-300">
                    ABRIR TRADE
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* POSITIONS + RISK GLASS */}
          <div className="relative group mb-12">
            <div className="absolute inset-0 bg-gradient-to-br from-holy/20 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition" />
            <Card className="relative bg-black/30 backdrop-blur-xl border border-holy/40 rounded-3xl shadow-2xl p-8 hover:scale-103 transition-all duration-400">
              <h2 className="text-4xl mb-6 text-center text-holy font-bold">Positions Abiertas</h2>
              <Table>
                <TableHeader className="bg-black/40">
                  <TableRow>
                    <TableHead className="text-holy">Symbol</TableHead>
                    <TableHead className="text-holy">Direction</TableHead>
                    <TableHead className="text-holy">LotSize (% risk)</TableHead>
                    <TableHead className="text-holy">Entry Price</TableHead>
                    <TableHead className="text-holy">P&L Live</TableHead>
                    <TableHead className="text-holy">TP (pips)</TableHead>
                    <TableHead className="text-holy">SL (pips)</TableHead>
                    <TableHead className="text-holy">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-400">
                        No positions abiertas – abre tu primer trade 🚀
                      </TableCell>
                    </TableRow>
                  ) : (
                    positions.map((pos) => {
                      const riskPercent = ((pos.lotSize || 0.01) * 10).toFixed(1);
                      const livePnl = parseFloat(pos.livePnl || 0).toFixed(2);
                      const pipsToTP = pos.takeProfit && currentPrice ? (pos.direction === 'long' 
                        ? ((pos.takeProfit - currentPrice) * 10000).toFixed(0) 
                        : ((currentPrice - pos.takeProfit) * 10000).toFixed(0)) : '-';
                      const pipsToSL = pos.stopLoss && currentPrice ? (pos.direction === 'long' 
                        ? ((currentPrice - pos.stopLoss) * 10000).toFixed(0) 
                        : ((pos.stopLoss - currentPrice) * 10000).toFixed(0)) : '-';

                      return (
                        <TableRow key={pos.id} className="hover:bg-white/10 transition">
                          <TableCell className="text-gray-200">{pos.symbol}</TableCell>
                          <TableCell>
                            <Badge variant={pos.direction === 'long' ? "default" : "destructive"} className={pos.direction === 'long' ? "bg-profit text-black" : "bg-red-600 text-white"}>
                              {pos.direction.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className={riskPercent > 5 ? "text-red-500" : "text-profit"}>
                            {pos.lotSize || 0.01} ({riskPercent}%)
                          </TableCell>
                          <TableCell className="text-gray-200">{pos.entryPrice.toFixed(5)}</TableCell>
                          <TableCell className={parseFloat(livePnl) > 0 ? "text-profit" : "text-red-500"}>
                            {livePnl}%
                          </TableCell>
                          <TableCell className={pipsToTP !== '-' && pipsToTP > 0 ? "text-profit" : "text-red-500"}>
                            {pos.takeProfit || '-'} ({pipsToTP} pips)
                          </TableCell>
                          <TableCell className={pipsToSL !== '-' && pipsToSL > 0 ? "text-red-500" : "text-profit"}>
                            {pos.stopLoss || '-'} ({pipsToSL} pips)
                          </TableCell>
                          <TableCell className="flex gap-2">
                            <Button 
                              variant="outline" 
                              className="bg-holy/20 hover:bg-holy/40 text-white" 
                              onClick={() => setEditingPosition(pos)}
                            >
                              Edit
                            </Button>
                            <Button variant="destructive" onClick={() => closeTrade(pos.id)}>
                              CLOSE
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              <div className="mt-8">
                <p className="text-xl text-center mb-2 text-gray-200">Risk total abierto: {totalRisk.toFixed(1)}% (max 10%)</p>
                <Progress 
                  value={totalRisk} 
                  className={`h-12 rounded-full bg-gray-700 overflow-hidden shadow-card ${totalRisk > 8 ? 'shadow-[0_0_25px_red]' : totalRisk > 5 ? 'shadow-[0_0_20px_orange]' : 'shadow-[0_0_15px_#00C853]'}`}
                >
                  <div 
                    className={`h-full transition-all duration-700 ${totalRisk > 8 ? 'bg-red-600' : totalRisk > 5 ? 'bg-orange-500' : 'bg-profit'} shadow-inner`} 
                    style={{ width: `${totalRisk * 10}%` }} 
                  />
                </Progress>
              </div>
            </Card>
          </div>

          {/* MODAL DE EDICIÓN ÚNICO */}
          {editingPosition && (
            <EditPositionModal
              position={editingPosition}
              open={true}
              onOpenChange={() => setEditingPosition(null)}
              onSave={async (updates) => {
                try {
                  await axios.post(`${API_BASE}/edit-position`, {
                    positionId: editingPosition.id,
                    ...updates
                  });
                  alert('Posición editada correctamente');
                  setEditingPosition(null);
                } catch (err) {
                  alert('Error editando posición: ' + (err.response?.data?.error || err.message));
                }
              }}
              currentPrice={currentPrice}
              virtualCapital={virtualCapital}
            />
          )}

          {/* RANKING LIVE GLASS */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-holy/20 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition" />
            <Card className="relative bg-black/30 backdrop-blur-xl border border-holy/40 rounded-3xl shadow-2xl p-8 hover:scale-105 transition-all duration-500">
              <div className="flex justify-center mb-8">
                <div className="w-96">
                  <label className="text-xl font-bold block mb-2 text-center text-gray-200">
                    Ver ranking de competencia activa:
                  </label>
                  <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                    <SelectTrigger className="w-full bg-black/40 border-borderSubtle text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activeLevels.map(level => (
                        <SelectItem key={level} value={level}>
                          {level.toUpperCase()} ({competitions[level]?.participants || 0} participantes)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <h2 className="text-4xl mb-6 text-center text-holy font-bold">
                Ranking Live Top 10 – {selectedLevel.toUpperCase()}
              </h2>

              <Table>
                <TableHeader className="bg-black/40">
                  <TableRow>
                    <TableHead className="text-holy">Spot #</TableHead>
                    <TableHead className="text-holy">Trader</TableHead>
                    <TableHead className="text-holy">Retorno %</TableHead>
                    <TableHead className="text-holy">Capital Live</TableHead>
                    <TableHead className="text-holy">Open Positions</TableHead>
                    <TableHead className="text-holy">Premio Proyectado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentRanking.slice(0, 10).map((r, i) => (
                    <TableRow key={i} className={i < 3 ? "bg-gradient-to-r from-holy/20 to-transparent" : "hover:bg-white/10 transition"}>
                      <TableCell className="text-gray-200">#{i + 1}</TableCell>
                      <TableCell className="text-gray-200">
                        {r.displayName || 'Anónimo'}
                      </TableCell>
                      <TableCell className={parseFloat(r.retorno) > 0 ? "text-profit" : "text-red-500"}>
                        {r.retorno}
                      </TableCell>
                      <TableCell className="text-gray-200">{formatNumber(r.liveCapital)} USDT</TableCell>
                      <TableCell className="text-gray-200">0</TableCell>
                      <TableCell className="text-profit font-bold">
                        0 USDT
                      </TableCell>
                    </TableRow>
                  )) || (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                        Cargando ranking...
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* MODAL ¡GANASTE! */}
          <Dialog open={showWinModal} onOpenChange={setShowWinModal}>
            <DialogContent className="bg-black/80 backdrop-blur-xl border border-holy/40 text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="text-4xl text-center text-holy animate-pulse">
                  ¡FELICIDADES, GANASTE! 🚀🏆
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 text-center">
                <p className="text-2xl text-profit font-bold">
                  {latestWin ? formatNumber(latestWin.amount) : 0} USDT
                </p>
                <p className="text-xl text-gray-200">
                  Posición #{latestWin?.position} en competencia {latestWin?.level.toUpperCase()}
                </p>
                <p className="text-lg text-gray-300">
                  Fecha: {latestWin ? new Date(latestWin.date).toLocaleDateString('es-ES') : ''}
                </p>
                <p className="text-lg">
                  <Badge className="bg-profit text-black text-lg px-6 py-2">
                    Pago confirmado en blockchain ✅
                  </Badge>
                </p>
                <p className="text-sm text-gray-400">
                  Payment ID: {latestWin?.paymentId ? '...' + latestWin.paymentId.slice(-10) : '-'}
                </p>
                <p className="text-lg text-gray-200">
                  ¡El USDT ya está en tu wallet TRC20! Revisa tu billetera.
                </p>
                <Button 
                  onClick={() => setShowWinModal(false)}
                  className="w-full bg-gradient-to-r from-holy to-purple-600 text-black text-xl py-6 font-bold rounded-full"
                >
                  ¡Genial, seguir compitiendo!
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </TooltipProvider>
  );
}

export default Dashboard;

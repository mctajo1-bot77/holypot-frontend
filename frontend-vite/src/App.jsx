import React, { useState, useEffect } from 'react';
import axios from "axios";
import apiClient from '@/api';
import { instrumentConfig } from '@/components/pipConfig';
import { useRiskCalculator } from '@/components/useRiskCalculator';
import { useNavigate } from "react-router-dom";
import { useI18n, LanguageToggle } from '@/i18n';
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
  Power,
  AlertTriangle,
  TrendingUp,
  TrendingDown
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

const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : 'http://localhost:5000/api';

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000
});

axios.interceptors.request.use(config => {
  const userToken = localStorage.getItem('holypotToken');
  const adminToken = localStorage.getItem('holypotAdminToken');
  const token = userToken || adminToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function Dashboard() {
  const navigate = useNavigate();
  const { t } = useI18n();

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

  const { calculateRealRisk, calculateOptimalLotSize, instrumentInfo } = useRiskCalculator(
    symbol, 
    currentPrice, 
    stopLoss ? parseFloat(stopLoss) : null, 
    virtualCapital
  );

  const riskInfo = calculateRealRisk(lotSize);

  // ✅ FUNCIÓN PARA VERIFICAR SI ES ADMIN
  const isAdmin = () => {
    const token = localStorage.getItem('holypotToken');
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role === 'admin' || payload.email === 'admin@holypot.com';
    } catch (err) {
      return false;
    }
  };

  const isAdminSession = isAdmin();

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

  // ✅ CORRECCIÓN: Permitir admins sin entryId
  useEffect(() => {
    const stored = localStorage.getItem('holypotEntryId');
    const isUserAdmin = isAdmin();
    
    // Si NO hay entryId Y NO es admin → redirigir
    if (!stored && !isUserAdmin) {
      console.log('❌ No entryId y no es admin - redirigiendo a /');
      window.location.href = '/';
      return;
    }
    
    // Si es admin SIN entryId → mostrar mensaje pero permitir acceso
    if (!stored && isUserAdmin) {
      console.log('✅ Admin sin entryId - acceso permitido (modo vista)');
      setEntryId(''); // Dejar vacío
      return;
    }
    
    // Usuario normal con entryId
    console.log('✅ Usuario con entryId:', stored);
    setEntryId(stored);
  }, []);

  useEffect(() => {
    // ✅ CORRECCIÓN: Solo ejecutar si hay entryId O si es admin
    if (!entryId && !isAdminSession) {
      console.log('⏭️ Skipping fetchData - no entryId y no es admin');
      return;
    }

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

        // ✅ CORRECCIÓN: Solo obtener posiciones si hay entryId
        if (entryId) {
          const posRes = await axios.get(`${API_BASE}/my-positions?entryId=${entryId}`);
          setPositions(posRes.data.positions || []);
          setTotalRisk(posRes.data.totalRiskPercent || 0);
          setVirtualCapital(parseFloat(posRes.data.virtualCapital) || 10000);
          setLivePrices(posRes.data.livePrices || {});

          const adviceRes = await axios.get(`${API_BASE}/my-advice`);
          setAdvice(adviceRes.data.advice);
        } else {
          // Admin sin entryId - cargar solo precios live del socket
          console.log('👑 Admin mode - no personal positions');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [entryId, isAdminSession]);

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
    // ✅ CORRECCIÓN: Solo suscribirse a socket si hay entryId
    if (!entryId) {
      console.log('⏭️ Skipping socket subscription - no entryId');
      return;
    }

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
    // ✅ CORRECCIÓN: Solo obtener payouts si NO es admin
    if (isAdminSession) {
      console.log('⏭️ Skipping payouts - admin mode');
      return;
    }

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
  }, [isAdminSession]);

  const openTrade = async () => {
    // ✅ CORRECCIÓN: Bloquear si es admin o no hay entryId
    if (!entryId) {
      alert('⚠️ No puedes abrir trades en modo admin. Inicia sesión como usuario normal.');
      return;
    }

    if (lotSize < 0.01 || lotSize > 1.0) {
      alert('LotSize debe estar entre 0.01 y 1.0');
      return;
    }

    if (riskInfo.riskPercent > 10) {
      alert(`⚠️ Riesgo demasiado alto: ${riskInfo.riskPercent.toFixed(1)}%\nMáximo permitido: 10%\n\nSugerencia: Usa ${calculateOptimalLotSize(2).toFixed(2)} lot para 2% de riesgo`);
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

  const calculatePositionRisk = (position) => {
    const entryPrice = position.entryPrice;
    const sl = position.stopLoss;
    const lot = position.lotSize || 0.01;
    
    if (!sl || !entryPrice) {
      return { riskPercent: lot * 10, riskUSD: 0, distancePips: 0 };
    }
    
    const config = instrumentConfig[position.symbol] || instrumentConfig['EURUSD'];
    const distancePips = Math.abs(entryPrice - sl) * config.pipMultiplier;
    const riskUSD = distancePips * config.pipValue * lot;
    const riskPercent = (riskUSD / virtualCapital) * 100;
    
    return { riskPercent, riskUSD, distancePips };
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen text-white relative overflow-hidden">
        <div className="fixed inset-0 -z-10">
          <img src={background} alt="Fondo" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/60" />
        </div>

        {/* ALERTA DE MODO ADMIN */}
        {isAdminSession && !entryId && (
          <div className="fixed top-20 md:top-32 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-500/90 backdrop-blur-md border border-yellow-600 px-4 md:px-8 py-3 md:py-4 rounded-lg shadow-2xl max-w-[95vw]">
            <p className="text-black font-bold text-sm md:text-xl text-center">
              {t('dash.adminMode')}
            </p>
          </div>
        )}

        <header className="fixed top-0 left-0 right-0 z-50 bg-primary/65 backdrop-blur-md border-b border-holy/20 shadow-md py-3 md:py-6">
          <div className="max-w-7xl mx-auto px-3 md:px-6 flex items-center justify-between gap-2">
            <div className="relative shrink-0">
              <img
                src={logo}
                alt="Holypot Logo"
                className="h-10 w-10 md:h-16 md:w-16 object-contain drop-shadow-2xl animate-float"
              />
              <div className="absolute -inset-4 rounded-full bg-holy/20 blur-3xl animate-pulse-slow-halo" />
            </div>

            <div className="text-center min-w-0 flex-1">
              <h1 className="text-lg md:text-4xl font-bold text-holy truncate">Holypot Trading</h1>
              <p className="text-xs md:text-lg text-gray-300 mt-0.5 md:mt-1 truncate">
                {entryId ? (
                  <><span className="hidden sm:inline">{t('dash.level')}: {userLevel.toUpperCase()} | {t('dash.participants')}: {userComp.participants} | </span>{t('dash.timeLeft')}: <span className="text-red-500 font-bold animate-pulse">{userComp.timeLeft}</span></>
                ) : (
                  <span className="text-yellow-400 text-xs md:text-base">{t('dash.viewMode')}</span>
                )}
              </p>
            </div>

            <div className="text-right shrink-0 flex flex-col items-end gap-1">
              <LanguageToggle className="mb-1" />
              <p className="text-sm md:text-2xl font-bold text-holy animate-pulse whitespace-nowrap">
                <span className="hidden sm:inline">{t('dash.prizePool')}: </span>{formatNumber(userComp.prizePool)} USDT
              </p>
              {entryId && (
                <p className="text-xs md:text-xl mt-0.5 md:mt-1 whitespace-nowrap">
                  <span className="hidden md:inline">{t('dash.balance')}: </span><span className={percentChange >= 0 ? "text-profit" : "text-red-500"}>{formatNumber(Math.floor(virtualCapital))}</span> <span className="hidden sm:inline">({formatPercent(percentChange)})</span>
                </p>
              )}
            </div>
          </div>
        </header>

        {/* SIDEBAR - Desktop only */}
        <aside className="hidden md:flex fixed left-0 top-28 bottom-0 w-20 bg-primary/90 backdrop-blur border-r border-borderSubtle shadow-card flex-col items-center py-8 space-y-8">
          <nav className="flex-1 flex flex-col items-center space-y-10">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-holy/20" onClick={() => navigate('/dashboard')}>
                  <Rocket className="h-10 w-10" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right"><p>{t('nav.dashboard')}</p></TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-holy/20" onClick={() => navigate('/profile')}>
                  <Coins className="h-10 w-10" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right"><p>{t('nav.profile')}</p></TooltipContent>
            </Tooltip>

            {isAdminSession && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-holy/20" onClick={() => navigate('/admin')}>
                    <Crown className="h-10 w-10" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right"><p>{t('nav.admin')}</p></TooltipContent>
              </Tooltip>
            )}

            <div className="mt-auto">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-red-700" onClick={handleLogout}>
                    <Power className="h-10 w-10" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right"><p>{t('nav.logout')}</p></TooltipContent>
              </Tooltip>
            </div>
          </nav>
        </aside>

        {/* BOTTOM NAV - Mobile only */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-primary/95 backdrop-blur-md border-t border-holy/20 flex justify-around items-center py-2 px-2">
          <Button variant="ghost" size="icon" className="text-white hover:bg-holy/20 flex-1" onClick={() => navigate('/dashboard')}>
            <Rocket className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white hover:bg-holy/20 flex-1" onClick={() => navigate('/profile')}>
            <Coins className="h-6 w-6" />
          </Button>
          {isAdminSession && (
            <Button variant="ghost" size="icon" className="text-white hover:bg-holy/20 flex-1" onClick={() => navigate('/admin')}>
              <Crown className="h-6 w-6" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="text-white hover:bg-red-700 flex-1" onClick={handleLogout}>
            <Power className="h-6 w-6" />
          </Button>
        </nav>

        <main className="md:ml-20 pt-24 md:pt-36 px-3 md:px-8 pb-24 md:pb-20">
          {/* CONSEJO IA */}
          <div className="relative group mb-6 md:mb-12">
            <div className="absolute inset-0 bg-gradient-to-br from-holy/30 to-transparent rounded-2xl md:rounded-3xl blur-xl group-hover:blur-2xl transition" />
            <Card className="relative bg-black/30 backdrop-blur-xl border border-holy/40 rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-8 text-center hover:md:scale-105 transition-all duration-500">
              <p className="text-xl md:text-3xl font-bold text-holy mb-3 md:mb-6">{t('dash.aiAdvice')}</p>
              <p className="text-base md:text-2xl text-gray-200">
                {advice || t('dash.aiAdvicePlaceholder')}
              </p>
            </Card>
          </div>

          {/* CARDS MULTI-NIVEL */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12 mb-6 md:mb-12">
            {[
              { key: 'basic', color: 'profit', border: 'profit/40', title: 'BASIC' },
              { key: 'medium', color: 'blue-500', border: 'blue-500/40', title: 'MEDIUM', titleColor: 'text-blue-400' },
              { key: 'premium', color: 'holy', border: 'holy/50', title: 'PREMIUM' }
            ].map(({ key, color, border, title, titleColor }) => (
              <div key={key} className="relative group">
                <div className={`absolute inset-0 bg-gradient-to-br from-${color}/30 to-transparent rounded-2xl md:rounded-3xl blur-xl group-hover:blur-2xl transition`} />
                <Card className={`relative bg-black/30 backdrop-blur-xl border border-${border} rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-10 text-center hover:md:scale-105 transition-all duration-500`}>
                  <CardHeader className="p-2 md:p-6">
                    <CardTitle className={`text-2xl md:text-4xl ${titleColor || `text-${color}`}`}>{title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 md:p-6">
                    <p className="text-lg md:text-2xl text-holy mb-2 md:mb-4">{t('dash.prizePool')}: {formatNumber(competitions[key]?.prizePool || 0)} USDT</p>
                    <p className="text-base md:text-xl text-gray-200 mb-1 md:mb-2">{t('dash.participants')}: {competitions[key]?.participants || 0}</p>
                    <p className="text-sm md:text-lg text-gray-300">{t('dash.timeLeft')}: <span className="text-red-500 font-bold animate-pulse">{competitions[key]?.timeLeft || '00h 00m'}</span></p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* GRÁFICO + NEW TRADE */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-12 mb-6 md:mb-12">
            <div className="lg:col-span-2 relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-holy/20 to-transparent rounded-2xl md:rounded-3xl blur-xl group-hover:blur-2xl transition" />
              <Card className="relative bg-black/30 backdrop-blur-xl border border-holy/40 rounded-2xl md:rounded-3xl shadow-2xl hover:md:scale-103 transition-all duration-300 h-[400px] md:h-[830px]">
                <CardHeader className="p-3 md:p-6">
                  <CardTitle className="text-xl md:text-3xl text-holy text-center">{t('dash.chart')} {symbol} {t('dash.live')}</CardTitle>
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
              <div className="absolute inset-0 bg-gradient-to-br from-holy/30 to-transparent rounded-2xl md:rounded-3xl blur-xl group-hover:blur-2xl transition" />
              <Card className="relative bg-black/30 backdrop-blur-xl border border-holy/40 rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-8 hover:md:scale-103 transition-all duration-300">
                <CardHeader className="p-3 md:p-6">
                  <CardTitle className="text-xl md:text-3xl text-holy text-center">{t('dash.newTrade')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 md:space-y-6">
                  <p className="text-center text-lg md:text-2xl font-bold text-gray-200">
                    {t('dash.currentPrice')} {symbol}: {currentPrice ? currentPrice.toFixed(5) : t('dash.loading')}
                  </p>

                  <Tabs value={orderType} onValueChange={setOrderType} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-black/40 border border-borderSubtle rounded-xl">
                      <TabsTrigger value="market" className="text-white">Market</TabsTrigger>
                      <TabsTrigger value="limit" className="text-white">Limit</TabsTrigger>
                      <TabsTrigger value="stop" className="text-white">Stop</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div>
                    <label className="text-base md:text-xl font-bold mb-2 block text-gray-200">{t('dash.symbol')}</label>
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
                    <label className="text-base md:text-xl font-bold mb-2 block text-gray-200">{t('dash.direction')}</label>
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <Button
                        onClick={() => setDirection('long')}
                        disabled={!entryId}
                        className={`text-base md:text-xl h-12 md:h-16 font-bold rounded-lg shadow-lg transition-all
                          ${direction === 'long' ? 'bg-profit hover:bg-profit/80 border-4 border-profit text-black' : 'bg-profit/70 hover:bg-profit/90 text-white'}`}
                      >
                        {orderType === 'market' ? 'LONG' : orderType === 'limit' ? 'Buy Limit' : 'Buy Stop'}
                      </Button>
                      <Button
                        onClick={() => setDirection('short')}
                        disabled={!entryId}
                        className={`text-base md:text-xl h-12 md:h-16 font-bold rounded-lg shadow-lg transition-all
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
                        disabled={!entryId}
                        className="bg-black/40 border-borderSubtle text-white"
                      />
                    </div>
                  )}

                  <div className="space-y-3">
                    <label className="text-base md:text-xl font-bold block text-gray-200">
                      {t('dash.lotSize')}
                    </label>
                    
                    <div className="flex items-center gap-4">
                      <Slider 
                        min={0.01} 
                        max={1.0} 
                        step={0.01} 
                        value={[lotSize]} 
                        onValueChange={(v) => setLotSize(v[0])}
                        disabled={!entryId}
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
                        disabled={!entryId}
                        className="w-32 bg-black/40 border-borderSubtle text-white text-center"
                      />
                    </div>
                    
                    <div className="bg-black/40 rounded-lg p-4 space-y-2 border border-white/10">
                      <p className="text-center text-2xl font-bold text-white">
                        {lotSize.toFixed(2)} lot
                      </p>
                      
                      {stopLoss && riskInfo.isValid ? (
                        <>
                          <p className={`text-center text-sm md:text-lg font-semibold ${riskInfo.riskPercent > 5 ? 'text-yellow-400' : 'text-profit'}`}>
                            <TrendingUp className="inline w-4 h-4 mr-1" />
                            {t('dash.riskReal')}: {riskInfo.riskPercent.toFixed(2)}% (${riskInfo.riskUSD.toFixed(0)})
                          </p>
                          <p className="text-center text-xs md:text-sm text-gray-400">
                            {t('dash.slDistance')}: {riskInfo.distancePips.toFixed(0)} {instrumentInfo.pipMultiplier === 1 ? 'pts' : 'pips'}
                          </p>

                          {riskInfo.riskPercent > 5 && (
                            <div className="mt-3 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                              <p className="text-red-400 font-bold text-center flex items-center justify-center gap-2 text-sm md:text-base">
                                <AlertTriangle className="w-5 h-5" />
                                {t('dash.highRisk')}
                              </p>
                              <p className="text-xs md:text-sm text-gray-300 text-center mt-1">
                                {t('dash.suggested')}: <span className="text-profit font-bold">{calculateOptimalLotSize(2).toFixed(2)} lot</span> {t('dash.forRisk')} 2%
                              </p>
                              <p className="text-xs text-gray-400 text-center">
                                o <span className="text-blue-400">{calculateOptimalLotSize(5).toFixed(2)} lot</span> {t('dash.forRisk')} 5%
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-center text-xs md:text-sm text-gray-400">
                          {stopLoss ? t('dash.calculatingRisk') : t('dash.addSL')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-base md:text-xl font-bold mb-2 block text-gray-200">{t('dash.takeProfit')}</label>
                    <Input 
                      type="number" 
                      step="0.00001" 
                      placeholder="ej: 1.10500" 
                      value={takeProfit} 
                      onChange={e => setTakeProfit(e.target.value)}
                      disabled={!entryId}
                      className="bg-black/40 border-borderSubtle text-white"
                    />
                  </div>

                  <div>
                    <label className="text-base md:text-xl font-bold mb-2 block text-gray-200">{t('dash.stopLoss')}</label>
                    <Input 
                      type="number" 
                      step="0.00001" 
                      placeholder="ej: 1.09000" 
                      value={stopLoss} 
                      onChange={e => setStopLoss(e.target.value)}
                      disabled={!entryId}
                      className="bg-black/40 border-borderSubtle text-white"
                    />
                  </div>

                  <Button
                    onClick={openTrade}
                    disabled={!entryId || riskInfo.riskPercent > 10}
                    className={`w-full text-xl md:text-3xl py-5 md:py-8 font-bold rounded-full shadow-lg transition duration-300
                      ${!entryId || riskInfo.riskPercent > 10
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-gradient-to-r from-holy to-purple-600 text-black hover:shadow-holy/50 hover:scale-105'
                      }`}
                  >
                    {!entryId ? t('dash.viewOnly') : riskInfo.riskPercent > 10 ? t('dash.riskTooHigh') : t('dash.openTrade')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* POSITIONS */}
          <div className="relative group mb-6 md:mb-12">
            <div className="absolute inset-0 bg-gradient-to-br from-holy/20 to-transparent rounded-2xl md:rounded-3xl blur-xl group-hover:blur-2xl transition" />
            <Card className="relative bg-black/30 backdrop-blur-xl border border-holy/40 rounded-2xl md:rounded-3xl shadow-2xl p-3 md:p-8 hover:md:scale-103 transition-all duration-400">
              <h2 className="text-2xl md:text-4xl mb-4 md:mb-6 text-center text-holy font-bold">{t('dash.positions')}</h2>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-black/40">
                  <TableRow>
                    <TableHead className="text-holy">{t('pos.symbol')}</TableHead>
                    <TableHead className="text-holy">{t('pos.direction')}</TableHead>
                    <TableHead className="text-holy">{t('pos.lotSize')}</TableHead>
                    <TableHead className="text-holy">{t('pos.entryPrice')}</TableHead>
                    <TableHead className="text-holy">{t('pos.pnl')}</TableHead>
                    <TableHead className="text-holy hidden md:table-cell">{t('pos.tp')}</TableHead>
                    <TableHead className="text-holy hidden md:table-cell">{t('pos.sl')}</TableHead>
                    <TableHead className="text-holy">{t('pos.action')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-400">
                        {entryId ? t('dash.noPositions') : t('dash.adminNoPositions')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    positions.map((pos) => {
                      const positionRisk = calculatePositionRisk(pos);
                      const livePnl = parseFloat(pos.livePnl || 0).toFixed(2);
                      
                      const config = instrumentConfig[pos.symbol] || instrumentConfig['EURUSD'];
                      const pipsToTP = pos.takeProfit && currentPrice ? (pos.direction === 'long' 
                        ? ((pos.takeProfit - currentPrice) * config.pipMultiplier).toFixed(0) 
                        : ((currentPrice - pos.takeProfit) * config.pipMultiplier).toFixed(0)) : '-';
                      const pipsToSL = pos.stopLoss && currentPrice ? (pos.direction === 'long' 
                        ? ((currentPrice - pos.stopLoss) * config.pipMultiplier).toFixed(0) 
                        : ((pos.stopLoss - currentPrice) * config.pipMultiplier).toFixed(0)) : '-';

                      return (
                        <TableRow key={pos.id} className="hover:bg-white/10 transition">
                          <TableCell className="text-gray-200">{pos.symbol}</TableCell>
                          <TableCell>
                            <Badge variant={pos.direction === 'long' ? "default" : "destructive"} className={pos.direction === 'long' ? "bg-profit text-black" : "bg-red-600 text-white"}>
                              {pos.direction.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className={positionRisk.riskPercent > 5 ? "text-red-500 font-semibold" : "text-profit"}>
                            {pos.lotSize || 0.01} 
                            <span className="text-sm ml-1">
                              ({pos.stopLoss ? positionRisk.riskPercent.toFixed(1) : (pos.lotSize * 10).toFixed(1)}%)
                            </span>
                            {positionRisk.riskPercent > 5 && (
                              <AlertTriangle className="inline w-4 h-4 ml-1" />
                            )}
                          </TableCell>
                          <TableCell className="text-gray-200">{pos.entryPrice.toFixed(5)}</TableCell>
                          <TableCell className={parseFloat(livePnl) > 0 ? "text-profit" : "text-red-500"}>
                            {livePnl}%
                          </TableCell>
                          <TableCell className={`hidden md:table-cell ${pipsToTP !== '-' && pipsToTP > 0 ? "text-profit" : "text-red-500"}`}>
                            {pos.takeProfit || '-'} ({pipsToTP} {config.pipMultiplier === 1 ? 'pts' : 'p'})
                          </TableCell>
                          <TableCell className={`hidden md:table-cell ${pipsToSL !== '-' && pipsToSL > 0 ? "text-red-500" : "text-profit"}`}>
                            {pos.stopLoss || '-'} ({pipsToSL} {config.pipMultiplier === 1 ? 'pts' : 'p'})
                          </TableCell>
                          <TableCell className="flex gap-2">
                            <Button 
                              variant="outline" 
                              className="bg-holy/20 hover:bg-holy/40 text-white" 
                              onClick={() => setEditingPosition(pos)}
                              disabled={!entryId}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="destructive" 
                              onClick={() => closeTrade(pos.id)}
                              disabled={!entryId}
                            >
                              CLOSE
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              </div>

              {entryId && (
                <div className="mt-4 md:mt-8">
                  <p className="text-sm md:text-xl text-center mb-2 text-gray-200">{t('dash.riskTotal')}: {totalRisk.toFixed(1)}% (max 10%)</p>
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
              )}
            </Card>
          </div>

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

          {/* RANKING */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-holy/20 to-transparent rounded-2xl md:rounded-3xl blur-xl group-hover:blur-2xl transition" />
            <Card className="relative bg-black/30 backdrop-blur-xl border border-holy/40 rounded-2xl md:rounded-3xl shadow-2xl p-3 md:p-8 hover:md:scale-105 transition-all duration-500">
              <div className="flex justify-center mb-4 md:mb-8">
                <div className="w-full max-w-96">
                  <label className="text-sm md:text-xl font-bold block mb-2 text-center text-gray-200">
                    {t('dash.selectRanking')}
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

              <h2 className="text-xl md:text-4xl mb-4 md:mb-6 text-center text-holy font-bold">
                {t('dash.ranking')} – {selectedLevel.toUpperCase()}
              </h2>

              <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-black/40">
                  <TableRow>
                    <TableHead className="text-holy">{t('rank.spot')}</TableHead>
                    <TableHead className="text-holy">{t('rank.trader')}</TableHead>
                    <TableHead className="text-holy">{t('rank.return')}</TableHead>
                    <TableHead className="text-holy">{t('rank.capital')}</TableHead>
                    <TableHead className="text-holy hidden md:table-cell">{t('rank.openPos')}</TableHead>
                    <TableHead className="text-holy hidden md:table-cell">{t('rank.prize')}</TableHead>
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
                      <TableCell className="text-gray-200 hidden md:table-cell">0</TableCell>
                      <TableCell className="text-profit font-bold hidden md:table-cell">
                        0 USDT
                      </TableCell>
                    </TableRow>
                  )) || (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                        {t('dash.loadingRanking')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
            </Card>
          </div>

          {/* MODAL GANASTE */}
          {!isAdminSession && (
            <Dialog open={showWinModal} onOpenChange={setShowWinModal}>
              <DialogContent className="bg-black/80 backdrop-blur-xl border border-holy/40 text-white max-w-[95vw] md:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl md:text-4xl text-center text-holy animate-pulse">
                    {t('win.congrats')}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 md:space-y-6 text-center">
                  <p className="text-xl md:text-2xl text-profit font-bold">
                    {latestWin ? formatNumber(latestWin.amount) : 0} USDT
                  </p>
                  <p className="text-base md:text-xl text-gray-200">
                    {t('win.position')} #{latestWin?.position} {t('win.inCompetition')} {latestWin?.level.toUpperCase()}
                  </p>
                  <p className="text-sm md:text-lg text-gray-300">
                    {t('win.date')}: {latestWin ? new Date(latestWin.date).toLocaleDateString('es-ES') : ''}
                  </p>
                  <p className="text-sm md:text-lg">
                    <Badge className="bg-profit text-black text-sm md:text-lg px-4 md:px-6 py-2">
                      {t('win.paymentConfirmed')}
                    </Badge>
                  </p>
                  <p className="text-xs md:text-sm text-gray-400">
                    {t('win.paymentId')}: {latestWin?.paymentId ? '...' + latestWin.paymentId.slice(-10) : '-'}
                  </p>
                  <p className="text-sm md:text-lg text-gray-200">
                    {t('win.walletMsg')}
                  </p>
                  <Button
                    onClick={() => setShowWinModal(false)}
                    className="w-full bg-gradient-to-r from-holy to-purple-600 text-black text-lg md:text-xl py-4 md:py-6 font-bold rounded-full"
                  >
                    {t('win.continue')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </main>
      </div>
    </TooltipProvider>
  );
}

export default Dashboard;

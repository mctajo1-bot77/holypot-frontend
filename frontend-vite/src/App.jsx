import React, { useState, useEffect, useMemo } from 'react';
import axios from "axios";
import apiClient from '@/api';
import { instrumentConfig } from '@/components/pipConfig';
import { useRiskCalculator } from '@/components/useRiskCalculator';
import { toast, Toaster } from '@/components/Toaster';
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
import CompetitionEndedModal from '@/components/CompetitionEndedModal';
import {
  Rocket,
  Coins,
  Crown,
  Power,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Bot,
  Activity,
  Target,
  Trophy,
  Shield
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

const COUNTRY_FLAGS = {
  AR: '🇦🇷', BO: '🇧🇴', BR: '🇧🇷', CL: '🇨🇱', CO: '🇨🇴', CR: '🇨🇷',
  CU: '🇨🇺', DO: '🇩🇴', EC: '🇪🇨', SV: '🇸🇻', GT: '🇬🇹', HN: '🇭🇳',
  MX: '🇲🇽', NI: '🇳🇮', PA: '🇵🇦', PY: '🇵🇾', PE: '🇵🇪', PR: '🇵🇷',
  UY: '🇺🇾', VE: '🇻🇪', ES: '🇪🇸', US: '🇺🇸', CA: '🇨🇦', DE: '🇩🇪',
  FR: '🇫🇷', GB: '🇬🇧', IT: '🇮🇹', PT: '🇵🇹', NL: '🇳🇱', SE: '🇸🇪',
  CH: '🇨🇭', RU: '🇷🇺', TR: '🇹🇷', NG: '🇳🇬', ZA: '🇿🇦', EG: '🇪🇬',
  MA: '🇲🇦', GH: '🇬🇭', KE: '🇰🇪', IN: '🇮🇳', CN: '🇨🇳', JP: '🇯🇵',
  KR: '🇰🇷', ID: '🇮🇩', PH: '🇵🇭', VN: '🇻🇳', TH: '🇹🇭', PK: '🇵🇰',
  AU: '🇦🇺', NZ: '🇳🇿', OTHER: '🌍'
};

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
  const [adminTestMode, setAdminTestMode] = useState(false);
  const [testEntryId, setTestEntryId] = useState('');
  const [chartFullscreen, setChartFullscreen] = useState(false);
  // Fin de competición diaria
  const [competitionEnded, setCompetitionEnded] = useState(() => new Date().getUTCHours() >= 21);
  const [competitionResults, setCompetitionResults] = useState(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [myAdvice, setMyAdvice] = useState(null);

  // entryId efectivo: en test mode usa el testEntryId temporal
  const activeEntryId = adminTestMode && testEntryId ? testEntryId : entryId;

  const { calculateRealRisk, calculateOptimalLotSize, instrumentInfo } = useRiskCalculator(
    symbol, 
    currentPrice, 
    stopLoss ? parseFloat(stopLoss) : null, 
    virtualCapital
  );

  const riskInfo = calculateRealRisk(lotSize);

  // Riesgo actual del portafolio (suma de posiciones abiertas)
  const portfolioRisk = useMemo(() => {
    return positions.filter(p => !p.closedAt).reduce((sum, p) => {
      if (!p.entryPrice || p.entryPrice === 0) return sum;
      const lot = p.lotSize || 0.01;
      const cfg = instrumentConfig[p.symbol] || instrumentConfig['EURUSD'];
      if (p.stopLoss) {
        return sum + lot * (Math.abs(p.entryPrice - p.stopLoss) / p.entryPrice) * 100;
      }
      const defaultDist = 100 / cfg.pipMultiplier;
      return sum + lot * (defaultDist / p.entryPrice) * 100;
    }, 0);
  }, [positions]);

  // Máximo de lots para el nuevo trade = cuánto cabe hasta llegar al 10% de portafolio
  // maxLots = (10% − riesgoPortafolio) / percentMoveNuevoPosicion
  const maxLotByRisk = useMemo(() => {
    if (!currentPrice || currentPrice === 0) return 5.0;
    const cfg = instrumentConfig[symbol] || instrumentConfig['EURUSD'];
    const remainingRisk = Math.max(0, 10 - portfolioRisk);
    if (remainingRisk <= 0) return 0.01; // portafolio ya al límite
    let percentMove = 0;
    if (stopLoss) {
      const sl = parseFloat(stopLoss);
      if (!isNaN(sl) && sl > 0) {
        percentMove = (Math.abs(currentPrice - sl) / currentPrice) * 100;
      }
    }
    if (percentMove <= 0) {
      const defaultDist = 100 / cfg.pipMultiplier;
      percentMove = (defaultDist / currentPrice) * 100;
    }
    // Redondeamos hacia abajo para no exceder nunca el 10%
    return Math.min(parseFloat(Math.floor((remainingRisk / percentMove) * 100) / 100), 100.0);
  }, [symbol, currentPrice, stopLoss, portfolioRisk]);

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
            prizePool: c.prizePoolReal,
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
        const pnl = parseFloat(data.pnlPercent);
        if (data.reason === 'TP_hit') {
          toast.tp({ symbol: data.symbol || '', pnl });
        } else {
          toast.sl({ symbol: data.symbol || '', pnl });
        }
      }
    });

    socket.on('entryDisqualified', (data) => {
      if (data.entryId === entryId) {
        toast.drawdown();
      }
    });

    socket.on('competitionEnded', (results) => {
      setCompetitionEnded(true);
      setCompetitionResults(results);
      setShowEndModal(true);
    });

    socket.on('myAdvice', (data) => {
      setMyAdvice(data.text);
    });

    return () => {
      socket.off('liveUpdate');
      socket.off('tradeClosedAuto');
      socket.off('entryDisqualified');
      socket.off('competitionEnded');
      socket.off('myAdvice');
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

  // Cargar resultados de la última competencia si la competencia ya terminó y no hay resultados en memoria
  useEffect(() => {
    if (!competitionEnded || competitionResults || isAdminSession) return;
    const fetchLastResults = async () => {
      try {
        const res = await axios.get(`${API_BASE}/last-competition-results`);
        if (res.data && Object.keys(res.data).some(l => res.data[l]?.hasData)) {
          // Convertir al formato esperado por CompetitionEndedModal
          const converted = {};
          Object.entries(res.data).forEach(([level, data]) => {
            if (data.hasData) {
              converted[level] = {
                rollover: false,
                participants: data.participants,
                prizePool: data.prizePool,
                top3: data.top3,
                ranking: data.ranking
              };
            } else {
              converted[level] = { rollover: true, participants: 0 };
            }
          });
          setCompetitionResults(converted);
        }
      } catch (err) {
        console.error('Error fetching last competition results:', err);
      }
    };
    fetchLastResults();
  }, [competitionEnded, competitionResults, isAdminSession]);

  const openTrade = async () => {
    if (!activeEntryId) {
      toast.warning('Sin entry activa', 'En test mode presiona "Activar" primero.');
      return;
    }

    if (lotSize < 0.01) {
      toast.warning('LotSize inválido', 'El mínimo permitido es 0.01');
      return;
    }

    if (riskInfo.riskPercent > 10) {
      toast.warning(
        `Riesgo demasiado alto: ${riskInfo.riskPercent.toFixed(1)}%`,
        `Máximo 10%. Sugerencia: ${calculateOptimalLotSize(2).toFixed(2)} lots para 2% de riesgo`
      );
      return;
    }

    if (orderType !== 'market') {
      if (!targetPrice) {
        toast.warning('Precio objetivo requerido', 'Obligatorio para órdenes Limit/Stop');
        return;
      }
      const tp = parseFloat(targetPrice);
      if (isNaN(tp)) {
        toast.warning('Precio objetivo inválido');
        return;
      }
      if (orderType === 'limit') {
        if (direction === 'long'  && tp >= currentPrice) { toast.warning('Buy Limit', 'Debe ser menor al precio actual'); return; }
        if (direction === 'short' && tp <= currentPrice) { toast.warning('Sell Limit', 'Debe ser mayor al precio actual'); return; }
      }
      if (orderType === 'stop') {
        if (direction === 'long'  && tp <= currentPrice) { toast.warning('Buy Stop', 'Debe ser mayor al precio actual'); return; }
        if (direction === 'short' && tp >= currentPrice) { toast.warning('Sell Stop', 'Debe ser menor al precio actual'); return; }
      }
    }

    try {
      const res = await axios.post(`${API_BASE}/open-trade`, {
        entryId: activeEntryId,
        symbol,
        direction,
        lotSize,
        orderType,
        targetPrice: orderType !== 'market' ? parseFloat(targetPrice) : null,
        takeProfit: takeProfit ? parseFloat(takeProfit) : null,
        stopLoss: stopLoss ? parseFloat(stopLoss) : null
      });
      toast.trade({
        title: `¡Trade Abierto! ${direction.toUpperCase()} ${symbol}`,
        detail: `${lotSize} lots · entrada ${currentPrice?.toFixed(instrumentConfig[symbol]?.decimals ?? 5) ?? ''}`,
        pnl: res.data.riskInfo?.riskPercent != null ? null : undefined
      });
      setTargetPrice('');
      setTakeProfit('');
      setStopLoss('');
    } catch (err) {
      toast.error('Error al abrir trade', err.response?.data?.error || err.message);
    }
  };

  const closeTrade = async (positionId) => {
    try {
      const res = await axios.post(`${API_BASE}/close-trade`, { positionId });
      const detail = res.data.message?.split('!')[1]?.trim() || 'Posición cerrada manualmente';
      toast.success('Trade cerrado', detail);
    } catch (err) {
      toast.error('Error al cerrar trade', err.response?.data?.error || err.message);
    }
  };

  const userComp = competitions[userLevel] || { prizePool: 0, participants: 0, timeLeft: '00h 00m' };
  const activeLevels = Object.keys(competitions).filter(level => (competitions[level]?.participants || 0) > 0);

  const calculatePositionRisk = (position) => {
    const entryPrice = position.entryPrice;
    const sl  = position.stopLoss;
    const lot = position.lotSize || 0.01;
    const config = instrumentConfig[position.symbol] || instrumentConfig['EURUSD'];

    if (!entryPrice || entryPrice === 0) {
      return { riskPercent: 0, riskUSD: 0, distancePips: 0 };
    }

    if (!sl) {
      // Sin SL: estima con 100 pips convertidos a distancia de precio
      const defaultPriceDistance = 100 / config.pipMultiplier;
      const percentMove = (defaultPriceDistance / entryPrice) * 100;
      const riskPercent = lot * percentMove;
      const riskUSD     = (virtualCapital * riskPercent) / 100;
      return { riskPercent, riskUSD, distancePips: 100 };
    }

    const distancePips = Math.abs(entryPrice - sl) * config.pipMultiplier;
    const percentMove  = (Math.abs(entryPrice - sl) / entryPrice) * 100;
    const riskPercent  = lot * percentMove;
    const riskUSD      = (virtualCapital * riskPercent) / 100;

    return { riskPercent, riskUSD, distancePips };
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen text-white relative">
        <Toaster />

        {/* ── BACKGROUND ─────────────────────────────────────────────────────── */}
        <div className="fixed inset-0 -z-10">
          <img src={background} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/75" />
        </div>

        {/* ── ADMIN ALERT ────────────────────────────────────────────────────── */}
        {isAdminSession && (
          <div className={`fixed top-20 md:top-24 left-1/2 -translate-x-1/2 z-50 backdrop-blur-md border px-4 md:px-8 py-2.5 rounded-lg shadow-2xl max-w-[95vw] flex items-center gap-3 ${
            adminTestMode
              ? 'bg-red-600/90 border-red-700'
              : 'bg-yellow-500/90 border-yellow-600'
          }`}>
            <p className="text-black font-bold text-sm">
              {adminTestMode ? `🧪 TEST MODE — entry: ${testEntryId.slice(0,8)}…` : t('dash.adminMode')}
            </p>
            <button
              onClick={async () => {
                if (adminTestMode) {
                  // Desactivar: limpiar entry de test
                  setAdminTestMode(false);
                  setTestEntryId('');
                  setPositions([]);
                  setVirtualCapital(10000);
                } else {
                  // Activar: crear entry de test en backend
                  try {
                    const res = await axios.post(`${API_BASE}/manual-create-confirm`, {
                      email: 'admin-test@holypot.com',
                      walletAddress: '0x0000000000000000000000000000000000000000',
                      level: 'basic'
                    }, { withCredentials: true });
                    setTestEntryId(res.data.entryId);
                    setAdminTestMode(true);
                  } catch (err) {
                    toast.error('Error creando entry de test', err.response?.data?.error || err.message);
                  }
                }
              }}
              className={`text-xs font-bold px-2 py-1 rounded transition ${
                adminTestMode
                  ? 'bg-white text-red-600 hover:bg-red-100'
                  : 'bg-black/20 text-black hover:bg-black/30'
              }`}
            >
              {adminTestMode ? 'Desactivar' : 'Activar test mode'}
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* HEADER                                                           */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#0F172A]/80 backdrop-blur-md border-b border-[#FFD700]/20 h-[88px] md:h-[112px]">
          <div className="max-w-7xl mx-auto px-3 md:px-6 h-full flex items-center justify-between gap-2">
            <div className="relative shrink-0">
              <img src={logo} alt="Holypot" className="h-10 w-10 md:h-14 md:w-14 object-contain drop-shadow-2xl animate-float" />
              <div className="absolute -inset-3 rounded-full bg-[#FFD700]/15 blur-2xl animate-pulse" />
            </div>

            <div className="text-center min-w-0 flex-1">
              <h1 className="text-lg md:text-3xl font-bold text-[#FFD700] truncate">Holypot Trading</h1>
              <p className="text-xs md:text-sm text-gray-400 mt-0.5 truncate">
                {entryId ? (
                  <>
                    <span className="hidden sm:inline">{t('dash.level')}: {userLevel.toUpperCase()} | {t('dash.participants')}: {userComp.participants} | </span>
                    {t('dash.timeLeft')}: <span className="text-red-400 font-bold animate-pulse">{userComp.timeLeft}</span>
                  </>
                ) : (
                  <span className="text-yellow-400">{t('dash.viewMode')}</span>
                )}
              </p>
            </div>

            <div className="text-right shrink-0 flex flex-col items-end gap-1">
              <LanguageToggle className="mb-1" />
              <p className="text-sm md:text-lg font-bold text-[#FFD700] whitespace-nowrap">
                <span className="hidden sm:inline">{t('dash.prizePool')}: </span>{formatNumber(userComp.prizePool)} USDT
              </p>
              {entryId && (
                <p className="text-xs md:text-sm mt-0.5 whitespace-nowrap">
                  <span className={percentChange >= 0 ? 'text-[#00C853]' : 'text-red-400'}>
                    {formatNumber(Math.floor(virtualCapital))}
                  </span>
                  <span className="hidden sm:inline text-gray-400"> ({formatPercent(percentChange)})</span>
                </p>
              )}
            </div>
          </div>
        </header>

        {/* Banner competición cerrada */}
        {competitionEnded && !isAdminSession && (
          <div className="fixed top-[88px] md:top-[112px] left-0 right-0 z-40 bg-[#1a0a00] border-b border-orange-500/40 text-orange-300 text-xs font-semibold text-center py-1.5 flex items-center justify-center gap-2">
            🔒 Competición cerrada · Solo visualización · Nueva sesión a las <span className="text-white font-bold">00:00 UTC</span>
            <button onClick={() => setShowEndModal(true)} className="underline text-orange-400 hover:text-orange-200 ml-1">Ver resultados</button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SIDEBAR — Desktop only (FundingPips style)                     */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <aside className="hidden md:flex fixed left-0 top-[112px] bottom-0 w-56 bg-[#0B1120] border-r border-[#1E2A3A] flex-col z-30">
          <nav className="flex flex-col flex-1 px-3 py-5 overflow-y-auto">

            {/* ─── TRADING ──────────────────────────────────── */}
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-2 mb-2">Trading</p>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-[#FFD700] bg-[#FFD700]/10 hover:bg-[#FFD700]/15 rounded-lg mb-1 h-10"
            >
              <Rocket className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">{t('nav.dashboard')}</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg mb-1 h-10"
              onClick={() => navigate('/profile')}
            >
              <Coins className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">{t('nav.profile')}</span>
            </Button>

            {/* ─── COMUNIDAD ────────────────────────────────── */}
            <div className="border-t border-[#1E2A3A] my-3" />
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-2 mb-2">Comunidad</p>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg mb-1 h-10"
              onClick={() => navigate('/ganadores')}
            >
              <Trophy className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">Hall of Fame</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg mb-1 h-10"
              onClick={() => navigate('/pagos-verificados')}
            >
              <Shield className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">Pagos Verificados</span>
            </Button>

            {/* ─── ADMIN ────────────────────────────────────── */}
            {isAdminSession && (
              <>
                <div className="border-t border-[#1E2A3A] my-3" />
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-2 mb-2">Admin</p>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg mb-1 h-10"
                  onClick={() => navigate('/admin')}
                >
                  <Crown className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-medium">{t('nav.admin')}</span>
                </Button>
              </>
            )}

            {/* ─── BOTTOM ───────────────────────────────────── */}
            <div className="mt-auto">
              <div className="border-t border-[#1E2A3A] my-3" />
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg h-10"
                onClick={handleLogout}
              >
                <Power className="h-5 w-5 shrink-0" />
                <span className="text-sm font-medium">{t('nav.logout')}</span>
              </Button>
            </div>

          </nav>
        </aside>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* BOTTOM NAV — Mobile only                                        */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0B1120]/98 backdrop-blur-md border-t border-[#1E2A3A] flex justify-around items-center py-1 px-1">
          <Button variant="ghost" size="icon" className="text-[#FFD700] bg-[#FFD700]/20 flex-1 flex-col gap-0.5 h-14 rounded-none">
            <Rocket className="h-5 w-5" />
            <span className="text-[9px] font-medium">Trading</span>
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5 flex-1 flex-col gap-0.5 h-14 rounded-none" onClick={() => navigate('/profile')}>
            <Coins className="h-5 w-5" />
            <span className="text-[9px] font-medium">Perfil</span>
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5 flex-1 flex-col gap-0.5 h-14 rounded-none" onClick={() => navigate('/ganadores')}>
            <Trophy className="h-5 w-5" />
            <span className="text-[9px] font-medium">Hall of Fame</span>
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5 flex-1 flex-col gap-0.5 h-14 rounded-none" onClick={() => navigate('/pagos-verificados')}>
            <Shield className="h-5 w-5" />
            <span className="text-[9px] font-medium">Pagos</span>
          </Button>
          {isAdminSession && (
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5 flex-1 flex-col gap-0.5 h-14 rounded-none" onClick={() => navigate('/admin')}>
              <Crown className="h-5 w-5" />
              <span className="text-[9px] font-medium">Admin</span>
            </Button>
          )}
          <Button variant="ghost" size="icon" className="text-red-400 hover:bg-red-900/20 flex-1 flex-col gap-0.5 h-14 rounded-none" onClick={handleLogout}>
            <Power className="h-5 w-5" />
            <span className="text-[9px] font-medium">Salir</span>
          </Button>
        </nav>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* MAIN CONTENT                                                     */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <main className="md:ml-56 pt-[88px] md:pt-[112px] px-3 md:px-8 pb-24 md:pb-20">
          <div className="max-w-7xl mx-auto space-y-5">

            {/* ── STATS HERO STRIP ──────────────────────────────────────────── */}
            {entryId && (
              <div className="relative rounded-2xl overflow-hidden border border-[#FFD700]/20 bg-gradient-to-br from-[#1a1f2e] to-[#0F172A]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,215,0,0.06)_0%,_transparent_65%)]" />
                <div className="relative grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#2A2A2A]">
                  <div className="text-center px-4 py-4">
                    <p className={`text-2xl md:text-3xl font-bold tabular-nums ${percentChange >= 0 ? 'text-[#00C853]' : 'text-red-400'}`}>
                      {formatNumber(Math.floor(virtualCapital))}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{t('dash.balance')} USDT</p>
                  </div>
                  <div className="text-center px-4 py-4">
                    <p className={`text-2xl md:text-3xl font-bold ${percentChange >= 0 ? 'text-[#00C853]' : 'text-red-400'}`}>
                      {formatPercent(percentChange)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">P&amp;L</p>
                  </div>
                  <div className="text-center px-4 py-4">
                    <p className="text-2xl md:text-3xl font-bold text-[#FFD700] tabular-nums">
                      {formatNumber(userComp.prizePool)} USDT
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{t('dash.prizePool')}</p>
                  </div>
                  <div className="text-center px-4 py-4">
                    <p className="text-2xl md:text-3xl font-bold text-red-400 animate-pulse">
                      {userComp.timeLeft}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{t('dash.timeLeft')}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── IA DEL DÍA ────────────────────────────────────────────────── */}
            <div className="relative rounded-2xl overflow-hidden">
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-[#FFD700]/30 via-[#FFD700]/10 to-purple-600/20 blur-sm" />
              <div className="relative rounded-2xl border border-[#FFD700]/35 bg-gradient-to-br from-[#1a1a0e] via-[#161616] to-[#120d1e] p-5 md:p-6">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="flex items-center gap-3 md:flex-col md:gap-2 md:min-w-[80px] md:items-center">
                    <div className="relative">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#FFD700]/20 to-purple-600/20 border border-[#FFD700]/30 flex items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.12)]">
                        <Bot className="h-5 w-5 text-[#FFD700]" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#00C853] rounded-full border-2 border-[#161616] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      </div>
                    </div>
                    <p className="text-[#FFD700] font-bold text-sm md:text-center md:mt-1">{t('dash.aiAdvice')}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#FFD700]/60 text-xs font-medium uppercase tracking-widest mb-2">{t('profile.aiSubtitle')}</p>
                    <p className="text-sm md:text-base text-white leading-relaxed">
                      {advice || t('dash.aiAdvicePlaceholder')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── COMPETITION LEVEL CARDS ───────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { key: 'basic',   accent: '#00C853', icon: <Rocket    className="h-4 w-4" />, label: 'BASIC'   },
                { key: 'medium',  accent: '#4a9eff', icon: <TrendingUp className="h-4 w-4" />, label: 'MEDIUM'  },
                { key: 'premium', accent: '#FFD700', icon: <Crown     className="h-4 w-4" />, label: 'PREMIUM' },
              ].map(({ key, accent, icon, label }) => (
                <div
                  key={key}
                  className="relative bg-[#161616] rounded-2xl border p-5 transition-all duration-300 hover:border-opacity-60"
                  style={{ borderColor: key === userLevel ? `${accent}50` : '#2A2A2A' }}
                >
                  {key === userLevel && (
                    <div className="absolute top-3 right-3">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: accent, backgroundColor: `${accent}20` }}>
                        {t('profile.tier')}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accent}18`, color: accent }}>
                      {icon}
                    </div>
                    <h3 className="font-bold text-base" style={{ color: accent }}>{label}</h3>
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">{t('dash.prizePool')}</span>
                      <span className="text-base font-bold text-[#FFD700]">{formatNumber(competitions[key]?.prizePool || 0)} USDT</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">{t('dash.participants')}</span>
                      <span className="text-sm text-gray-300">{competitions[key]?.participants || 0}</span>
                    </div>
                    <div className="pt-2 border-t border-[#2A2A2A] flex justify-between items-center">
                      <span className="text-xs text-gray-500">{t('dash.timeLeft')}</span>
                      <span className="text-sm font-bold text-red-400 animate-pulse">{competitions[key]?.timeLeft || '00h 00m'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── CHART + NEW TRADE ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* Chart — 2/3 */}
              <div className="lg:col-span-2 bg-[#161616] border border-[#2A2A2A] rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#2A2A2A]">
                  <div className="w-8 h-8 rounded-lg bg-[#FFD700]/15 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-[#FFD700]" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-200">{t('dash.chart')} {symbol} {t('dash.live')}</h3>
                  <div className="ml-auto flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#00C853] animate-pulse" />
                    <span className="text-xs text-gray-500">Live</span>
                  </div>
                </div>
                <div className="h-[360px] md:h-[680px]">
                  <TradingViewChart
                    symbol={symbol}
                    positions={positions}
                    currentPrice={currentPrice}
                    virtualCapital={virtualCapital}
                    isFullscreen={chartFullscreen}
                    onToggleFullscreen={() => setChartFullscreen(f => !f)}
                  />
                </div>
              </div>

              {/* New Trade — 1/3 (flotante en fullscreen) */}
              <div className={
                chartFullscreen
                  ? 'fixed right-4 top-1/2 -translate-y-1/2 z-[10000] w-80 max-h-[90vh] overflow-y-auto bg-[#161616] border border-[#2A2A2A] rounded-2xl p-5 flex flex-col gap-4 shadow-2xl'
                  : 'bg-[#161616] border border-[#2A2A2A] rounded-2xl p-5 flex flex-col gap-4'
              }>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#FFD700]/15 flex items-center justify-center">
                    <Target className="h-4 w-4 text-[#FFD700]" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-200">{t('dash.newTrade')}</h3>
                  {currentPrice && (
                    <div className="ml-auto text-right">
                      <p className="text-xs text-gray-500">{symbol}</p>
                      <p className="text-sm font-bold text-white">{currentPrice.toFixed(5)}</p>
                    </div>
                  )}
                </div>

                {/* Order type */}
                <Tabs value={orderType} onValueChange={setOrderType} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-[#0F172A] border border-[#2A2A2A] rounded-xl h-9">
                    <TabsTrigger value="market" className="text-white text-xs data-[state=active]:bg-[#FFD700] data-[state=active]:text-black">Market</TabsTrigger>
                    <TabsTrigger value="limit"  className="text-white text-xs data-[state=active]:bg-[#FFD700] data-[state=active]:text-black">Limit</TabsTrigger>
                    <TabsTrigger value="stop"   className="text-white text-xs data-[state=active]:bg-[#FFD700] data-[state=active]:text-black">Stop</TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Symbol */}
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">{t('dash.symbol')}</label>
                  <Select value={symbol} onValueChange={setSymbol}>
                    <SelectTrigger className="w-full bg-[#0F172A] border-[#2A2A2A] text-white h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['EURUSD','GBPUSD','USDJPY','XAUUSD','SPX500','NAS100'].map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Direction */}
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">{t('dash.direction')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => setDirection('long')}
                      disabled={!activeEntryId}
                      className={`h-10 font-bold text-sm rounded-lg transition-all ${
                        direction === 'long'
                          ? 'bg-[#00C853] text-black'
                          : 'bg-[#00C853]/15 text-[#00C853] border border-[#00C853]/30 hover:bg-[#00C853]/25'
                      }`}
                    >
                      {orderType === 'market' ? '▲ LONG' : orderType === 'limit' ? 'Buy Limit' : 'Buy Stop'}
                    </Button>
                    <Button
                      onClick={() => setDirection('short')}
                      disabled={!activeEntryId}
                      className={`h-10 font-bold text-sm rounded-lg transition-all ${
                        direction === 'short'
                          ? 'bg-red-500 text-white'
                          : 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25'
                      }`}
                    >
                      {orderType === 'market' ? '▼ SHORT' : orderType === 'limit' ? 'Sell Limit' : 'Sell Stop'}
                    </Button>
                  </div>
                </div>

                {/* Target price (limit / stop) */}
                {orderType !== 'market' && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">Precio objetivo</label>
                    <Input
                      type="number" step="0.00001" placeholder="ej: 1.10500"
                      value={targetPrice} onChange={e => setTargetPrice(e.target.value)}
                      disabled={!activeEntryId}
                      className="bg-[#0F172A] border-[#2A2A2A] text-white h-9 text-sm"
                    />
                  </div>
                )}

                {/* Lot size */}
                <div>
                  <div className="flex justify-between mb-1.5">
                    <label className="text-xs text-gray-500">{t('dash.lotSize')}</label>
                    <span className="text-xs font-bold text-white">
                      {lotSize.toFixed(2)}
                      <span className="text-gray-500 font-normal"> / {maxLotByRisk.toFixed(2)} max</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Slider
                      min={0.01}
                      max={maxLotByRisk}
                      step={maxLotByRisk > 10 ? 0.1 : 0.01}
                      value={[Math.min(lotSize, maxLotByRisk)]}
                      onValueChange={(v) => setLotSize(v[0])}
                      disabled={!activeEntryId}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      min="0.01"
                      max={maxLotByRisk}
                      step={maxLotByRisk > 10 ? 0.1 : 0.01}
                      value={lotSize.toFixed(2)}
                      onChange={(e) => {
                        let val = parseFloat(e.target.value);
                        if (isNaN(val)) val = 0.01;
                        setLotSize(Math.max(0.01, Math.min(maxLotByRisk, val)));
                      }}
                      disabled={!activeEntryId}
                      className="w-20 bg-[#0F172A] border-[#2A2A2A] text-white h-9 text-sm text-center"
                    />
                  </div>

                  {/* Risk indicator */}
                  {stopLoss && riskInfo.isValid ? (
                    <div className={`mt-2 px-3 py-2 rounded-lg border text-xs ${
                      riskInfo.riskPercent > 5
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-[#00C853]/10 border-[#00C853]/30'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">{t('dash.riskReal')}</span>
                        <span className={`font-bold ${riskInfo.riskPercent > 5 ? 'text-red-400' : 'text-[#00C853]'}`}>
                          {riskInfo.riskPercent.toFixed(2)}% · ${riskInfo.riskUSD.toFixed(0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-gray-400">{t('dash.slDistance')}</span>
                        <span className="text-gray-300">{riskInfo.distancePips.toFixed(0)} {instrumentInfo.pipMultiplier === 1 ? 'pts' : 'pips'}</span>
                      </div>
                      {riskInfo.riskPercent > 5 && (
                        <p className="mt-1.5 text-red-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {t('dash.suggested')}: <span className="text-[#00C853] font-bold ml-1">{calculateOptimalLotSize(2).toFixed(2)} lot</span> @ 2%
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-gray-600 text-center">{stopLoss ? t('dash.calculatingRisk') : t('dash.addSL')}</p>
                  )}
                </div>

                {/* TP + SL */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">{t('dash.takeProfit')}</label>
                    <Input type="text" inputMode="decimal" placeholder="TP"
                      value={takeProfit}
                      onChange={e => {
                        const val = e.target.value.replace(',', '.');
                        if (val === '' || /^\d*\.?\d*$/.test(val)) setTakeProfit(val);
                      }}
                      disabled={!activeEntryId}
                      className="bg-[#0F172A] border-[#2A2A2A] text-white h-9 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">{t('dash.stopLoss')}</label>
                    <Input type="text" inputMode="decimal" placeholder="SL"
                      value={stopLoss}
                      onChange={e => {
                        const val = e.target.value.replace(',', '.');
                        if (val === '' || /^\d*\.?\d*$/.test(val)) setStopLoss(val);
                      }}
                      disabled={!activeEntryId}
                      className="bg-[#0F172A] border-[#2A2A2A] text-white h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Open trade button — bloqueado si la competición terminó */}
                {competitionEnded ? (
                  <div className="w-full h-11 flex items-center justify-center rounded-xl bg-[#1a1a1a] border border-white/10 text-gray-500 text-sm font-semibold gap-2">
                    🔒 Competición cerrada · Abre a las 00:00 UTC
                  </div>
                ) : (
                  <Button
                    onClick={openTrade}
                    disabled={!activeEntryId || riskInfo.riskPercent > 10}
                    className={`w-full h-11 font-bold text-sm rounded-xl mt-auto transition-all ${
                      !activeEntryId || riskInfo.riskPercent > 10
                        ? 'bg-[#2A2A2A] text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#FFD700] to-[#f59e0b] text-black hover:opacity-90 hover:shadow-[0_0_20px_rgba(255,215,0,0.25)]'
                    }`}
                  >
                    {!activeEntryId ? t('dash.viewOnly') : riskInfo.riskPercent > 10 ? t('dash.riskTooHigh') : t('dash.openTrade')}
                  </Button>
                )}
              </div>
            </div>

            {/* ── POSITIONS ─────────────────────────────────────────────────── */}
            <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#2A2A2A]">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-blue-400" />
                </div>
                <h2 className="text-sm font-semibold text-gray-200">{t('dash.positions')}</h2>
                {positions.filter(p => !p.closedAt).length > 0 && (
                  <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                    {positions.filter(p => !p.closedAt).length} open
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#2A2A2A] hover:bg-transparent">
                      <TableHead className="text-[#FFD700] text-xs font-semibold">{t('pos.symbol')}</TableHead>
                      <TableHead className="text-[#FFD700] text-xs font-semibold">{t('pos.direction')}</TableHead>
                      <TableHead className="text-[#FFD700] text-xs font-semibold">{t('pos.lotSize')}</TableHead>
                      <TableHead className="text-[#FFD700] text-xs font-semibold">{t('pos.entryPrice')}</TableHead>
                      <TableHead className="text-[#FFD700] text-xs font-semibold">{t('pos.pnl')}</TableHead>
                      <TableHead className="text-[#FFD700] text-xs font-semibold hidden md:table-cell">{t('pos.tp')}</TableHead>
                      <TableHead className="text-[#FFD700] text-xs font-semibold hidden md:table-cell">{t('pos.sl')}</TableHead>
                      <TableHead className="text-[#FFD700] text-xs font-semibold">{t('pos.action')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positions.filter(p => !p.closedAt).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-10 text-gray-600 text-sm">
                          {entryId ? t('dash.noPositions') : t('dash.adminNoPositions')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      positions.filter(p => !p.closedAt).map((pos) => {
                        const positionRisk = calculatePositionRisk(pos);
                        const livePnl = parseFloat(pos.livePnl || 0).toFixed(2);
                        const config = instrumentConfig[pos.symbol] || instrumentConfig['EURUSD'];
                        const pipsToTP = pos.takeProfit && currentPrice
                          ? (pos.direction === 'long'
                              ? ((pos.takeProfit - currentPrice) * config.pipMultiplier).toFixed(0)
                              : ((currentPrice - pos.takeProfit) * config.pipMultiplier).toFixed(0))
                          : '-';
                        const pipsToSL = pos.stopLoss && currentPrice
                          ? (pos.direction === 'long'
                              ? ((currentPrice - pos.stopLoss) * config.pipMultiplier).toFixed(0)
                              : ((pos.stopLoss - currentPrice) * config.pipMultiplier).toFixed(0))
                          : '-';

                        return (
                          <TableRow key={pos.id} className="border-[#2A2A2A] hover:bg-white/5 transition-colors">
                            <TableCell className="text-gray-200 text-sm font-medium py-3">{pos.symbol}</TableCell>
                            <TableCell className="py-3">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                pos.direction === 'long' ? 'bg-[#00C853]/20 text-[#00C853]' : 'bg-red-500/20 text-red-400'
                              }`}>
                                {pos.direction.toUpperCase()}
                              </span>
                            </TableCell>
                            <TableCell className="py-3">
                              <span className={`text-sm ${positionRisk.riskPercent > 5 ? 'text-red-400' : 'text-gray-300'}`}>
                                {pos.lotSize || 0.01}
                                <span className="text-xs ml-1 text-gray-500">
                                  ({positionRisk.riskPercent.toFixed(1)}%)
                                </span>
                              </span>
                              {positionRisk.riskPercent > 5 && <AlertTriangle className="inline w-3.5 h-3.5 ml-1 text-red-400" />}
                            </TableCell>
                            <TableCell className="text-gray-300 text-sm py-3">{pos.entryPrice.toFixed(5)}</TableCell>
                            <TableCell className={`text-sm font-bold py-3 ${parseFloat(livePnl) > 0 ? 'text-[#00C853]' : 'text-red-400'}`}>
                              {livePnl}%
                            </TableCell>
                            <TableCell className={`hidden md:table-cell text-xs py-3 ${pipsToTP !== '-' && pipsToTP > 0 ? 'text-[#00C853]' : 'text-red-400'}`}>
                              {pos.takeProfit || '—'} <span className="text-gray-600">({pipsToTP}p)</span>
                            </TableCell>
                            <TableCell className={`hidden md:table-cell text-xs py-3 ${pipsToSL !== '-' && pipsToSL > 0 ? 'text-red-400' : 'text-[#00C853]'}`}>
                              {pos.stopLoss || '—'} <span className="text-gray-600">({pipsToSL}p)</span>
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="flex gap-1.5">
                                <Button
                                  variant="outline" size="sm"
                                  className="h-7 px-2.5 text-xs bg-[#FFD700]/10 border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/20"
                                  onClick={() => setEditingPosition(pos)}
                                  disabled={!entryId}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="destructive" size="sm"
                                  className="h-7 px-2.5 text-xs bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30"
                                  onClick={() => closeTrade(pos.id)}
                                  disabled={!entryId}
                                >
                                  Close
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {entryId && (
                <div className="px-5 py-4 border-t border-[#2A2A2A]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">{t('dash.riskTotal')}</span>
                    <span className={`text-xs font-bold ${portfolioRisk > 8 ? 'text-red-400' : portfolioRisk > 5 ? 'text-yellow-400' : 'text-[#00C853]'}`}>
                      {portfolioRisk.toFixed(2)}% / 10%
                    </span>
                  </div>
                  <div className="w-full bg-[#2A2A2A] rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${portfolioRisk > 8 ? 'bg-red-500' : portfolioRisk > 5 ? 'bg-yellow-400' : 'bg-[#00C853]'}`}
                      style={{ width: `${Math.min(portfolioRisk * 10, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ── EDIT POSITION MODAL ───────────────────────────────────────── */}
            {editingPosition && (
              <EditPositionModal
                position={editingPosition}
                open={true}
                onOpenChange={() => setEditingPosition(null)}
                onSave={async (updates) => {
                  try {
                    await axios.post(`${API_BASE}/edit-position`, { positionId: editingPosition.id, ...updates });
                    toast.success('Posición actualizada', 'TP/SL guardados correctamente');
                    setEditingPosition(null);
                  } catch (err) {
                    toast.error('Error al editar posición', err.response?.data?.error || err.message);
                  }
                }}
                currentPrice={currentPrice}
                virtualCapital={virtualCapital}
              />
            )}

            {/* ── RANKING ───────────────────────────────────────────────────── */}
            <div className="bg-[#161616] border border-[#2A2A2A] rounded-2xl overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-[#2A2A2A]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#FFD700]/15 flex items-center justify-center">
                    <Crown className="h-4 w-4 text-[#FFD700]" />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-200">
                    {t('dash.ranking')} — {selectedLevel.toUpperCase()}
                  </h2>
                </div>
                <div className="sm:ml-auto w-full sm:w-44">
                  <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                    <SelectTrigger className="w-full bg-[#0F172A] border-[#2A2A2A] text-white h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activeLevels.map(level => (
                        <SelectItem key={level} value={level}>
                          {level.toUpperCase()} ({competitions[level]?.participants || 0})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#2A2A2A] hover:bg-transparent">
                      <TableHead className="text-[#FFD700] text-xs font-semibold">{t('rank.spot')}</TableHead>
                      <TableHead className="text-[#FFD700] text-xs font-semibold">{t('rank.trader')}</TableHead>
                      <TableHead className="text-[#FFD700] text-xs font-semibold">{t('rank.return')}</TableHead>
                      <TableHead className="text-[#FFD700] text-xs font-semibold">{t('rank.capital')}</TableHead>
                      <TableHead className="text-[#FFD700] text-xs font-semibold hidden md:table-cell">{t('rank.openPos')}</TableHead>
                      <TableHead className="text-[#FFD700] text-xs font-semibold hidden md:table-cell">{t('rank.prize')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentRanking.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-gray-600 text-sm">
                          {t('dash.loadingRanking')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentRanking.slice(0, 10).map((r, i) => (
                        <TableRow
                          key={i}
                          className={`border-[#2A2A2A] transition-colors ${
                            i === 0 ? 'bg-[#FFD700]/8 hover:bg-[#FFD700]/12' :
                            i === 1 ? 'bg-gray-400/4 hover:bg-white/5' :
                            i === 2 ? 'bg-orange-700/4 hover:bg-white/5' :
                            'hover:bg-white/5'
                          }`}
                        >
                          <TableCell className="py-3">
                            <span className={`text-sm font-bold ${
                              i === 0 ? 'text-[#FFD700]' :
                              i === 1 ? 'text-gray-300' :
                              i === 2 ? 'text-orange-400' : 'text-gray-600'
                            }`}>
                              #{i + 1}
                            </span>
                          </TableCell>
                          <TableCell className="text-gray-200 text-sm py-3">
                            <span className="flex items-center gap-1.5">
                              {r.country && <span title={r.country}>{COUNTRY_FLAGS[r.country] || '🌍'}</span>}
                              {r.displayName || 'Anónimo'}
                            </span>
                          </TableCell>
                          <TableCell className={`text-sm font-bold py-3 ${parseFloat(r.retorno) > 0 ? 'text-[#00C853]' : 'text-red-400'}`}>
                            {r.retorno}
                          </TableCell>
                          <TableCell className="text-gray-300 text-sm py-3">{formatNumber(r.liveCapital)} USDT</TableCell>
                          <TableCell className="text-gray-500 text-sm py-3 hidden md:table-cell">0</TableCell>
                          <TableCell className="text-[#FFD700] font-bold text-sm py-3 hidden md:table-cell">0 USDT</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* ── COMPETITION ENDED MODAL ───────────────────────────────────── */}
            {!isAdminSession && (
              <CompetitionEndedModal
                open={showEndModal}
                onClose={() => setShowEndModal(false)}
                results={competitionResults}
                userEntryId={entryId}
                userLevel={userLevel}
                myAdvice={myAdvice}
              />
            )}

            {/* ── WIN MODAL ─────────────────────────────────────────────────── */}
            {!isAdminSession && (
              <Dialog open={showWinModal} onOpenChange={setShowWinModal}>
                <DialogContent className="bg-[#161616] backdrop-blur-xl border border-[#FFD700]/30 text-white max-w-[95vw] md:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-2xl md:text-3xl text-center text-[#FFD700]">
                      {t('win.congrats')}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 text-center">
                    <p className="text-3xl font-bold text-[#00C853]">
                      {latestWin ? formatNumber(latestWin.amount) : 0} USDT
                    </p>
                    <p className="text-base text-gray-300">
                      {t('win.position')} #{latestWin?.position} {t('win.inCompetition')} {latestWin?.level.toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-400">
                      {t('win.date')}: {latestWin ? new Date(latestWin.date).toLocaleDateString('es-ES') : ''}
                    </p>
                    <Badge className="bg-[#00C853] text-black text-sm px-4 py-1.5">
                      {t('win.paymentConfirmed')}
                    </Badge>
                    <p className="text-xs text-gray-500">
                      {t('win.paymentId')}: {latestWin?.paymentId ? '...' + latestWin.paymentId.slice(-10) : '-'}
                    </p>
                    <p className="text-sm text-gray-300">{t('win.walletMsg')}</p>
                    <Button
                      onClick={() => setShowWinModal(false)}
                      className="w-full bg-gradient-to-r from-[#FFD700] to-[#f59e0b] text-black font-bold rounded-xl h-11"
                    >
                      {t('win.continue')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}

export default Dashboard;

// ============================================================
// HOLYPOT TRADING — PROFILE PAGE
// ============================================================
// ✅ BILINGÜE:  USA SIEMPRE t('key') PARA TODOS LOS TEXTOS VISIBLES.
//              Añadir claves nuevas en AMBOS idiomas en i18n.jsx.
// ✅ SOLO VISUAL: No modificar lógica API, auth ni navegación.
// ✅ APIs CONSUMIDAS:
//    • GET /api/competitions/active       → competitions (prizePool, participants, timeLeft)
//    • GET /api/my-positions?entryId=     → virtualCapital
//    • GET /api/my-profile?entryId=       → profile { stats, history, nickname,
//                                            currentPosition, bestRanking }
//    • GET /api/my-advice                 → advice (string)
// ✅ ESTADO CRÍTICO: entryId | profile | advice | loading | userLevel | virtualCapital
// ✅ RESPONSIVE: grid-cols-1 (mobile) → md:grid-cols-2 (tablet) → lg:grid-cols-3 (desktop)
// ✅ IA DEL DÍA: SIEMPRE destacada, full-width, primera sección visible del perfil.
// ✅ HISTORIAL:  tabla fecha / tier / posición / nivel conseguido / retorno% / premio
// ✅ COLORES TOKEN:
//    bgDark=#0A0A0A | card=#161616 | border=#2A2A2A | holy=#FFD700
//    profit=#00C853 | loss=#FF4444 | blue=#4a9eff
// ✅ NIVEL XP (visual, calculado de historial):
//    BRONCE 0-99 · PLATA 100-299 · ORO 300-599 · PLATINO 600-999 · MAESTRO 1000+
// ✅ NO TOCAR: handleLogout | fetchProfileData | fetchHeaderData
//             formatNumber | formatPercent | percentChange
// ============================================================

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Rocket, Coins, Crown, Power, Trophy, Medal,
  TrendingUp, TrendingDown, Sparkles, Bot, Share2,
  Globe, Zap, Activity, BarChart2, Star, Award,
  Calendar, DollarSign, ChevronDown, ChevronUp, Target
} from "lucide-react";
import {
  RadialBarChart, RadialBar, PolarAngleAxis,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip, Cell
} from 'recharts';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import logo from "@/assets/Holypot-logo.webp";
import background from "@/assets/background.jpg";
import { useI18n, LanguageToggle } from '@/i18n';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:5000/api';

axios.interceptors.request.use(config => {
  const userToken = localStorage.getItem('holypotToken');
  const adminToken = localStorage.getItem('holypotAdminToken');
  const token = userToken || adminToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── XP helpers (visual only, no backend dependency) ────────────────────────
const XP_LEVELS = [
  { key: 'bronze',   min: 0,    max: 99,   color: '#CD7F32', bg: 'from-orange-700 to-orange-900', label: 'BRONCE',  labelEn: 'BRONZE'   },
  { key: 'silver',   min: 100,  max: 299,  color: '#C0C0C0', bg: 'from-gray-400 to-gray-600',     label: 'PLATA',   labelEn: 'SILVER'   },
  { key: 'gold',     min: 300,  max: 599,  color: '#FFD700', bg: 'from-yellow-400 to-yellow-600', label: 'ORO',     labelEn: 'GOLD'     },
  { key: 'platinum', min: 600,  max: 999,  color: '#E5E4E2', bg: 'from-slate-300 to-blue-300',    label: 'PLATINO', labelEn: 'PLATINUM' },
  { key: 'master',   min: 1000, max: 9999, color: '#A855F7', bg: 'from-yellow-400 to-purple-600', label: 'MAESTRO', labelEn: 'MASTER'   },
];

const getXpFromHistory = (history = []) =>
  history.reduce((total, h) => {
    total += 10; // each participation
    const pos = parseInt((h.position ?? '999').toString().replace('#', ''));
    if (pos <= 10) total += 20;
    if (pos <= 3)  total += 50;
    if (pos === 1) total += 100;
    return total;
  }, 0);

const getXpLevel = (xp) =>
  XP_LEVELS.slice().reverse().find(l => xp >= l.min) || XP_LEVELS[0];

const getPositionLevel = (positionStr) => {
  const pos = parseInt((positionStr ?? '999').toString().replace('#', ''));
  if (pos === 1)  return XP_LEVELS[4]; // MASTER
  if (pos <= 3)   return XP_LEVELS[3]; // PLATINUM
  if (pos <= 10)  return XP_LEVELS[2]; // GOLD
  if (pos <= 20)  return XP_LEVELS[1]; // SILVER
  return XP_LEVELS[0];                 // BRONZE
};

// ─── Loading spinner ─────────────────────────────────────────────────────────
const LoadingSpinner = ({ label }) => (
  <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
    <div className="text-center">
      <div className="relative w-20 h-20 mx-auto mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-[#FFD700]/20" />
        <div className="absolute inset-0 rounded-full border-4 border-t-[#FFD700] animate-spin" />
        <Zap className="absolute inset-0 m-auto h-8 w-8 text-[#FFD700]" />
      </div>
      <p className="text-lg text-gray-300 font-medium">{label}</p>
    </div>
  </div>
);

// ─── Component ───────────────────────────────────────────────────────────────
const Profile = () => {
  const navigate = useNavigate();
  const { t, lang } = useI18n();

  // ── State (unchanged from original) ──────────────────────────────────────
  const [entryId] = useState(localStorage.getItem('holypotEntryId') || '');
  const [profile, setProfile] = useState(null);
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(true);

  const [competitions, setCompetitions] = useState({});
  const [userLevel, setUserLevel] = useState('basic');
  const [virtualCapital, setVirtualCapital] = useState(10000);

  // ── UI-only state ─────────────────────────────────────────────────────────
  const [expandedRow, setExpandedRow] = useState(null);

  const isAdminSession = !!localStorage.getItem('holypotAdminToken');

  // ── Formatters (unchanged) ────────────────────────────────────────────────
  const formatNumber = (num) => new Intl.NumberFormat('es-ES').format(num || 0);

  const formatPercent = (num) => {
    const value = parseFloat(num);
    return isNaN(value) ? '0.00%' : (value > 0 ? '+' : '') + value.toFixed(2) + '%';
  };

  const percentChange = ((virtualCapital - 10000) / 10000 * 100);

  // ── Auth (unchanged) ──────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // ── Data fetching (unchanged) ─────────────────────────────────────────────
  useEffect(() => {
    if (!entryId) return;

    const fetchHeaderData = async () => {
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
        setVirtualCapital(parseFloat(posRes.data.virtualCapital) || 10000);
      } catch (err) {
        console.error(err);
      }
    };

    fetchHeaderData();
    const interval = setInterval(fetchHeaderData, 10000);
    return () => clearInterval(interval);
  }, [entryId]);

  useEffect(() => {
    if (!entryId) {
      window.location.href = '/';
      return;
    }

    const fetchProfileData = async () => {
      try {
        const profileRes = await axios.get(`${API_BASE}/my-profile`, { params: { entryId } });
        setProfile(profileRes.data);

        const adviceRes = await axios.get(`${API_BASE}/my-advice`);
        setAdvice(adviceRes.data.advice);

        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchProfileData();
    const interval = setInterval(fetchProfileData, 10000);
    return () => clearInterval(interval);
  }, [entryId]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) return <LoadingSpinner label={t('profile.loadingProfile')} />;

  // ── Derived data ──────────────────────────────────────────────────────────
  const userComp = competitions[userLevel] || { prizePool: 0, participants: 0, timeLeft: '00h 00m' };
  const stats     = profile?.stats || {};
  const buys      = stats.buys || 0;
  const sells     = stats.sells || 0;
  const totalTrades  = stats.totalTrades || 0;
  const dailyReturn  = parseFloat(stats.dailyReturn || 0);
  const moreBuys     = buys > sells;
  const topAssetsData = stats.topAssets || [];
  const hasTrades    = totalTrades > 0;
  const history      = profile?.history || [];

  // XP (visual, computed from history)
  const totalXP    = getXpFromHistory(history);
  const xpLevel    = getXpLevel(totalXP);
  const xpProgress = xpLevel.key === 'master'
    ? 100
    : Math.round(((totalXP - xpLevel.min) / (xpLevel.max - xpLevel.min + 1)) * 100);
  const xpToNext   = xpLevel.key === 'master' ? 0 : (xpLevel.max + 1 - totalXP);
  const xpLabel    = lang === 'en' ? xpLevel.labelEn : xpLevel.label;

  // Projected level from current competition position
  const projLevel  = getPositionLevel(profile?.currentPosition);
  const projLabel  = lang === 'en' ? projLevel.labelEn : projLevel.label;

  // History aggregates
  const totalComps   = history.length;
  const wonComps     = history.filter(h => parseFloat(h.prize || 0) > 0).length;
  const winRate      = totalComps > 0 ? Math.round((wonComps / totalComps) * 100) : 0;
  const winningTrades = hasTrades ? Math.round(totalTrades * (dailyReturn >= 0 ? 0.6 : 0.35)) : 0;
  const losingTrades  = totalTrades - winningTrades;

  // Chart placeholders (shown only when no real trades)
  const dailyReturnData = hasTrades ? [] : [
    { day: 'Lun', value: -413 }, { day: 'Mar', value: 166 },
    { day: 'Mié', value: 803  }, { day: 'Jue', value: -588 },
    { day: 'Vie', value: -902 }
  ];
  const sessionSuccessData = hasTrades ? [] : [
    { session: 'New York', success: 28.1 },
    { session: 'London',   success: 16.7 },
    { session: 'Asia',     success: 62.5 }
  ];
  const gaugeData = [{ value: Math.min(Math.abs(dailyReturn), 100) }];

  // Tier styling
  const tierColor = userLevel === 'premium'
    ? 'text-[#FFD700]' : userLevel === 'medium'
    ? 'text-blue-400'  : 'text-emerald-400';
  const tierBg = userLevel === 'premium'
    ? 'bg-[#FFD700]/20 border-[#FFD700]/40' : userLevel === 'medium'
    ? 'bg-blue-400/20 border-blue-400/40'   : 'bg-emerald-400/20 border-emerald-400/40';

  const getLevelMedal = (size = 'h-6 w-6') => {
    if (userLevel === 'premium') return <Trophy className={`${size} text-[#FFD700]`} />;
    if (userLevel === 'medium')  return <Medal  className={`${size} text-blue-400`}  />;
    return                              <Medal  className={`${size} text-emerald-400`} />;
  };

  // Shared card style
  const card = 'relative bg-[#161616] border border-[#2A2A2A] rounded-2xl shadow-lg hover:border-[#FFD700]/25 transition-all duration-300';

  // Tooltip style for recharts
  const ttStyle = {
    backgroundColor: '#161616',
    border: '1px solid #2A2A2A',
    color: 'white',
    borderRadius: '10px',
    fontSize: '12px'
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <TooltipProvider>
      <div className="min-h-screen text-white relative overflow-hidden">

        {/* ── BACKGROUND ─────────────────────────────────────────────────── */}
        <div className="fixed inset-0 -z-10">
          <img src={background} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/75" />
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* HEADER                                                           */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#0F172A]/80 backdrop-blur-md border-b border-[#FFD700]/20 py-3 md:py-4">
          <div className="max-w-7xl mx-auto px-3 md:px-6 flex items-center justify-between gap-2">
            {/* Logo */}
            <div className="relative shrink-0">
              <img src={logo} alt="Holypot Logo" className="h-10 w-10 md:h-14 md:w-14 object-contain drop-shadow-2xl" />
              <div className="absolute -inset-3 rounded-full bg-[#FFD700]/15 blur-2xl animate-pulse" />
            </div>

            {/* Center */}
            <div className="text-center min-w-0 flex-1">
              <h1 className="text-lg md:text-3xl font-bold text-[#FFD700] truncate">Holypot Trading</h1>
              <p className="text-xs md:text-sm text-gray-400 mt-0.5 truncate">
                <span className="hidden sm:inline">
                  {t('dash.level')}: {userLevel.toUpperCase()} | {t('dash.participants')}: {userComp.participants} |{' '}
                </span>
                {t('dash.timeLeft')}: <span className="text-red-400 font-bold animate-pulse">{userComp.timeLeft}</span>
              </p>
            </div>

            {/* Right */}
            <div className="text-right shrink-0 flex flex-col items-end gap-1">
              <LanguageToggle className="mb-1" />
              <p className="text-sm md:text-lg font-bold text-[#FFD700] whitespace-nowrap">
                <span className="hidden sm:inline">{t('dash.prizePool')}: </span>{formatNumber(userComp.prizePool)} USDT
              </p>
              <p className="text-xs md:text-sm mt-0.5 whitespace-nowrap">
                <span className={percentChange >= 0 ? 'text-[#00C853]' : 'text-red-400'}>
                  {formatNumber(Math.floor(virtualCapital))}
                </span>
                <span className="hidden sm:inline text-gray-400"> ({formatPercent(percentChange)})</span>
              </p>
            </div>
          </div>
        </header>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SIDEBAR — Desktop only                                           */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <aside className="hidden md:flex fixed left-0 top-[72px] bottom-0 w-20 bg-[#0F172A]/90 backdrop-blur border-r border-[#2A2A2A] flex-col items-center py-8 space-y-8">
          <nav className="flex-1 flex flex-col items-center space-y-8">
            <UITooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-[#FFD700]/20" onClick={() => navigate('/dashboard')}>
                  <Rocket className="h-8 w-8" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right"><p>{t('nav.dashboard')}</p></TooltipContent>
            </UITooltip>

            <UITooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="text-[#FFD700] bg-[#FFD700]/20">
                  <Coins className="h-8 w-8" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right"><p>{t('nav.profile')}</p></TooltipContent>
            </UITooltip>

            {isAdminSession && (
              <UITooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-[#FFD700]/20" onClick={() => navigate('/admin')}>
                    <Crown className="h-8 w-8" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right"><p>{t('nav.admin')}</p></TooltipContent>
              </UITooltip>
            )}

            <div className="mt-auto">
              <UITooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-red-700/50" onClick={handleLogout}>
                    <Power className="h-8 w-8" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right"><p>{t('nav.logout')}</p></TooltipContent>
              </UITooltip>
            </div>
          </nav>
        </aside>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* BOTTOM NAV — Mobile only                                         */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0F172A]/95 backdrop-blur-md border-t border-[#FFD700]/20 flex justify-around items-center py-2 px-2">
          <Button variant="ghost" size="icon" className="text-white hover:bg-[#FFD700]/20 flex-1" onClick={() => navigate('/dashboard')}>
            <Rocket className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" className="text-[#FFD700] bg-[#FFD700]/20 flex-1">
            <Coins className="h-6 w-6" />
          </Button>
          {isAdminSession && (
            <Button variant="ghost" size="icon" className="text-white hover:bg-[#FFD700]/20 flex-1" onClick={() => navigate('/admin')}>
              <Crown className="h-6 w-6" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="text-white hover:bg-red-700/50 flex-1" onClick={handleLogout}>
            <Power className="h-6 w-6" />
          </Button>
        </nav>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* MAIN CONTENT                                                     */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <main className="md:ml-20 pt-20 md:pt-[88px] px-3 md:px-6 pb-24 md:pb-12">
          <div className="max-w-7xl mx-auto space-y-5">

            {/* ── USER HERO ────────────────────────────────────────────────── */}
            <div className="relative rounded-2xl overflow-hidden border border-[#FFD700]/20 bg-gradient-to-br from-[#1a1f2e] to-[#0F172A]">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,215,0,0.07)_0%,_transparent_65%)]" />
              <div className="relative p-5 md:p-8">
                {/* Top row: avatar + name + buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Avatar + name + badges */}
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${xpLevel.bg} flex items-center justify-center shadow-lg`}>
                        {getLevelMedal('h-8 w-8 md:h-10 md:w-10')}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#00C853] rounded-full border-2 border-[#0F172A]" />
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-4xl font-bold text-white leading-tight">
                        {t('profile.hello')} <span className="text-[#FFD700]">{profile?.nickname || 'Trader'}</span>!
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {/* Tier badge */}
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${tierBg} ${tierColor}`}>
                          {userLevel.toUpperCase()}
                        </span>
                        {/* XP Level badge */}
                        <span
                          className="text-xs font-bold px-3 py-1 rounded-full border"
                          style={{ color: xpLevel.color, borderColor: `${xpLevel.color}40`, backgroundColor: `${xpLevel.color}15` }}
                        >
                          ⚡ {xpLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-bold text-xs px-4"
                      onClick={() => navigate('/')}
                    >
                      {t('profile.joinNow')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#2A2A2A] text-gray-300 hover:border-[#FFD700]/40 hover:bg-[#FFD700]/10 text-xs gap-1.5"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      {t('profile.share')}
                    </Button>
                  </div>
                </div>

                {/* Stats strip */}
                <div className="mt-5 pt-5 border-t border-[#2A2A2A] grid grid-cols-3 gap-0 divide-x divide-[#2A2A2A]">
                  <div className="text-center px-3">
                    <p className="text-2xl md:text-3xl font-bold text-[#FFD700]">
                      {profile?.currentPosition || '#—'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{t('profile.yourPosition')}</p>
                  </div>
                  <div className="text-center px-3">
                    <p className={`text-2xl md:text-3xl font-bold ${percentChange >= 0 ? 'text-[#00C853]' : 'text-red-400'}`}>
                      {formatPercent(percentChange)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{t('profile.roi')}</p>
                  </div>
                  <div className="text-center px-3">
                    <p className="text-2xl md:text-3xl font-bold text-white">
                      {profile?.bestRanking || '#—'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{t('profile.bestRanking')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── 3 INFO CARDS ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Card 1 — Current Competition */}
              <div className={`${card} p-5`}>
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-[#FFD700]/15 flex items-center justify-center">
                    <Target className="h-4 w-4 text-[#FFD700]" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-200">{t('profile.currentComp')}</h3>
                </div>

                {userComp.participants > 0 ? (
                  <div className="space-y-3.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">{t('profile.tier')}</span>
                      <span className={`text-sm font-bold ${tierColor}`}>{userLevel.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">{t('profile.yourPosition')}</span>
                      <span className="text-xl font-bold text-white">{profile?.currentPosition || '#—'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">{t('profile.roi')}</span>
                      <span className={`text-sm font-bold ${percentChange >= 0 ? 'text-[#00C853]' : 'text-red-400'}`}>
                        {formatPercent(percentChange)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">{t('dash.participants')}</span>
                      <span className="text-sm text-gray-300">{userComp.participants}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">{t('dash.timeLeft')}</span>
                      <span className="text-sm font-bold text-red-400 animate-pulse">{userComp.timeLeft}</span>
                    </div>
                    <div className="pt-3 border-t border-[#2A2A2A]">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">{t('profile.projectedLevel')}</span>
                        <span
                          className="text-xs font-bold px-2.5 py-1 rounded-lg"
                          style={{ color: projLevel.color, backgroundColor: `${projLevel.color}20` }}
                        >
                          {projLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 space-y-3">
                    <Target className="h-10 w-10 text-gray-600" />
                    <p className="text-gray-500 text-sm text-center">{t('profile.noActiveComp')}</p>
                    <Button
                      size="sm"
                      className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-bold text-xs"
                      onClick={() => navigate('/')}
                    >
                      {t('profile.joinNow')}
                    </Button>
                  </div>
                )}
              </div>

              {/* Card 2 — XP Global */}
              <div className={`${card} p-5`}>
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-purple-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-200">{t('profile.xpGlobal')}</h3>
                </div>

                <div className="space-y-4">
                  {/* Level badge + XP number */}
                  <div className="flex items-center justify-between">
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-gradient-to-r ${xpLevel.bg} text-white`}
                    >
                      <Star className="h-3.5 w-3.5" />
                      {xpLabel}
                    </div>
                    <span className="text-2xl font-bold text-white">{totalXP} <span className="text-sm text-gray-400 font-normal">XP</span></span>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                      <span>{totalXP} XP</span>
                      <span>{xpLevel.key === 'master' ? '∞' : `${xpLevel.max + 1} XP`}</span>
                    </div>
                    <div className="w-full bg-[#2A2A2A] rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${xpLevel.bg} transition-all duration-700`}
                        style={{ width: `${Math.min(xpProgress, 100)}%` }}
                      />
                    </div>
                    {xpLevel.key !== 'master' && (
                      <p className="text-xs text-gray-500 mt-1.5">{xpToNext} XP {t('profile.xpToNext')}</p>
                    )}
                  </div>

                  {/* Level ladder */}
                  <div className="pt-2 border-t border-[#2A2A2A] grid grid-cols-1 gap-1.5">
                    {XP_LEVELS.map(lvl => (
                      <div key={lvl.key} className={`flex items-center justify-between text-xs transition-opacity ${xpLevel.key === lvl.key ? 'opacity-100' : 'opacity-35'}`}>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: lvl.color }} />
                          <span style={{ color: xpLevel.key === lvl.key ? lvl.color : '#6b7280' }}>
                            {lang === 'en' ? lvl.labelEn : lvl.label}
                          </span>
                        </div>
                        <span className="text-gray-600">{lvl.min}{lvl.key === 'master' ? '+' : `–${lvl.max}`} XP</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 3 — Stats Overview */}
              <div className={`${card} p-5`}>
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-blue-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-200">{t('profile.statsOverview')}</h3>
                </div>

                <div className="space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{t('profile.competitions')}</span>
                    <span className="text-xl font-bold text-white">{totalComps}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{t('profile.winRate')}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-[#2A2A2A] rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-[#00C853]" style={{ width: `${winRate}%` }} />
                      </div>
                      <span className="text-sm font-bold text-[#00C853]">{winRate}%</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{t('profile.bestRanking')}</span>
                    <span className="text-xl font-bold text-[#FFD700]">{profile?.bestRanking || '#—'}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{t('profile.totalOps')}</span>
                    <span className="text-xl font-bold text-white">{totalTrades}</span>
                  </div>

                  <div className="pt-3 border-t border-[#2A2A2A] flex justify-between items-center">
                    <span className="text-xs text-gray-500">{t('dash.prizePool')}</span>
                    <span className="text-sm font-bold text-[#FFD700]">{formatNumber(userComp.prizePool)} USDT</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* IA DEL DÍA — FULL WIDTH, DIFERENCIADOR PRINCIPAL             */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <div className="relative rounded-2xl overflow-hidden">
              {/* Glow layer */}
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-[#FFD700]/30 via-[#FFD700]/10 to-purple-600/20 blur-sm" />
              <div className="relative rounded-2xl border border-[#FFD700]/35 bg-gradient-to-br from-[#1a1a0e] via-[#161616] to-[#120d1e] p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-start gap-6">

                  {/* Icon + title block */}
                  <div className="flex md:flex-col items-center md:items-center gap-4 md:gap-2 md:min-w-[100px] md:text-center">
                    <div className="relative">
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-[#FFD700]/20 to-purple-600/20 border border-[#FFD700]/30 flex items-center justify-center shadow-[0_0_25px_rgba(255,215,0,0.15)]">
                        <Bot className="h-7 w-7 text-[#FFD700]" />
                      </div>
                      {/* Live dot */}
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#00C853] rounded-full border-2 border-[#161616] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      </div>
                    </div>
                    <div>
                      <p className="text-[#FFD700] font-bold text-base leading-tight">{t('profile.aiSection')}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{t('profile.aiBy')}</p>
                    </div>
                  </div>

                  {/* Advice content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[#FFD700]/60 text-xs font-medium uppercase tracking-widest mb-3">
                      {t('profile.aiSubtitle')}
                    </p>
                    <p className="text-base md:text-xl text-white leading-relaxed font-medium">
                      {advice || t('dash.aiAdvicePlaceholder')}
                    </p>
                    <div className="mt-5 flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-[#FFD700]/50" />
                      <span className="text-xs text-gray-600">{t('profile.aiUpdatedDaily')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── TRADING BEHAVIOR ROW ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Bull/Bear bias */}
              <div className={`${card} p-5`}>
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-[#FFD700]/15 flex items-center justify-center">
                    <BarChart2 className="h-4 w-4 text-[#FFD700]" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-200">{t('profile.bias')}</h3>
                </div>

                <div className="flex flex-col items-center space-y-4">
                  <div className="flex items-center justify-between w-full">
                    {/* Bear side */}
                    <div className="text-center">
                      <TrendingDown className="h-8 w-8 text-red-400 mx-auto" />
                      <p className="text-xs text-gray-500 mt-1">BEAR</p>
                      <p className="text-base font-bold text-red-400">{sells}</p>
                    </div>

                    {/* Progress track */}
                    <div className="flex-1 mx-3">
                      <div className="relative h-3 bg-[#2A2A2A] rounded-full overflow-hidden">
                        <div
                          className="absolute left-0 top-0 h-full bg-red-500/80 rounded-l-full transition-all duration-700"
                          style={{ width: `${(sells / (buys + sells || 1)) * 100}%` }}
                        />
                        <div
                          className="absolute right-0 top-0 h-full bg-[#00C853]/80 rounded-r-full transition-all duration-700"
                          style={{ width: `${(buys / (buys + sells || 1)) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Bull side */}
                    <div className="text-center">
                      <TrendingUp className="h-8 w-8 text-[#00C853] mx-auto" />
                      <p className="text-xs text-gray-500 mt-1">BULL</p>
                      <p className="text-base font-bold text-[#00C853]">{buys}</p>
                    </div>
                  </div>

                  <p className="text-2xl font-bold" style={{ color: moreBuys ? '#00C853' : '#FF4444' }}>
                    {moreBuys ? t('profile.ratherBull') : t('profile.ratherBear')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {buys + sells > 0
                      ? `${Math.round((moreBuys ? buys : sells) / (buys + sells) * 100)}% ${t('profile.biasConsistency')}`
                      : t('profile.noTrades')}
                  </p>
                </div>
              </div>

              {/* Total Operations */}
              <div className={`${card} p-5 flex flex-col items-center justify-center text-center`}>
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center mb-3">
                  <Activity className="h-4 w-4 text-blue-400" />
                </div>
                <h3 className="text-sm font-semibold text-gray-400 mb-4">{t('profile.totalOps')}</h3>
                <p className="text-6xl md:text-7xl font-bold text-[#FFD700] tabular-nums">{totalTrades}</p>
                <div className="mt-5 flex gap-5 text-sm">
                  <div className="text-center">
                    <p className="text-[#00C853] font-bold text-lg">{winningTrades}</p>
                    <p className="text-xs text-gray-500">{t('profile.wins')}</p>
                  </div>
                  <div className="text-center border-x border-[#2A2A2A] px-5">
                    <p className="text-red-400 font-bold text-lg">{losingTrades}</p>
                    <p className="text-xs text-gray-500">{t('profile.losses')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-bold text-lg">
                      {totalTrades > 0 ? Math.round((winningTrades / totalTrades) * 100) : 0}%
                    </p>
                    <p className="text-xs text-gray-500">{t('profile.winRate')}</p>
                  </div>
                </div>
              </div>

              {/* Daily Return Chart */}
              <div className={`${card} p-5`}>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-200">{t('profile.dailyReturn')}</h3>
                </div>
                {hasTrades ? (
                  <div className="flex items-center justify-center h-[160px]">
                    <p className="text-gray-500 text-sm text-center">{t('profile.historySoon')}</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={dailyReturnData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                      <XAxis dataKey="day" stroke="#3A3A3A" tick={{ fill: '#6b7280', fontSize: 11 }} />
                      <YAxis stroke="#3A3A3A" tick={{ fill: '#6b7280', fontSize: 11 }} />
                      <Tooltip contentStyle={ttStyle} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {dailyReturnData.map((entry, i) => (
                          <Cell key={i} fill={entry.value > 0 ? '#00C853' : '#FF4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* ── PROFITABILITY + SESSION SUCCESS ──────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Profitability gauge */}
              <div className={`${card} p-5`}>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#00C853]/15 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-[#00C853]" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-200">{t('profile.profitability')}</h3>
                </div>
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width={180} height={180}>
                    <RadialBarChart cx="50%" cy="50%" innerRadius="50%" outerRadius="90%" data={gaugeData}>
                      <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                      <RadialBar
                        dataKey="value"
                        cornerRadius={10}
                        fill={dailyReturn >= 0 ? '#00C853' : '#FF4444'}
                        background={{ fill: '#2A2A2A' }}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <p className={`text-4xl font-bold mt-2 ${dailyReturn >= 0 ? 'text-[#00C853]' : 'text-red-400'}`}>
                    {formatPercent(dailyReturn)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{t('profile.hitRatio')}</p>
                  <div className="mt-4 flex gap-6">
                    <div className="text-center">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-[#00C853]" />
                        <span className="text-[#00C853] font-bold">{winningTrades}</span>
                      </div>
                      <p className="text-xs text-gray-500">{t('profile.wins')}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-400" />
                        <span className="text-red-400 font-bold">{losingTrades}</span>
                      </div>
                      <p className="text-xs text-gray-500">{t('profile.losses')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Session Success */}
              <div className={`${card} p-5`}>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                    <Globe className="h-4 w-4 text-blue-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-200">{t('profile.sessionSuccess')}</h3>
                </div>
                {hasTrades ? (
                  <div className="flex items-center justify-center h-[200px]">
                    <p className="text-gray-500 text-sm">{t('profile.historySoon')}</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={sessionSuccessData} layout="horizontal" margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                      <XAxis
                        type="number"
                        stroke="#3A3A3A"
                        tick={{ fill: '#6b7280', fontSize: 11 }}
                        domain={[0, 100]}
                        ticks={[0, 25, 50, 75, 100]}
                        tickFormatter={v => `${v}%`}
                      />
                      <YAxis dataKey="session" type="category" stroke="#3A3A3A" tick={{ fill: '#6b7280', fontSize: 11 }} />
                      <Tooltip contentStyle={ttStyle} formatter={v => `${v}%`} />
                      <Line
                        type="monotone"
                        dataKey="success"
                        stroke="#4a9eff"
                        strokeWidth={3}
                        dot={{ fill: '#4a9eff', r: 5 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* ── TOP INSTRUMENTS ───────────────────────────────────────────── */}
            <div className={`${card} p-5 md:p-6`}>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-[#FFD700]/15 flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-[#FFD700]" />
                </div>
                <h3 className="text-base font-semibold text-gray-200">{t('profile.topInstruments')}</h3>
              </div>

              {topAssetsData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <BarChart2 className="h-12 w-12 text-gray-700" />
                  <p className="text-gray-500 text-sm">{t('profile.noTrades')}</p>
                  <Button
                    size="sm"
                    className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-bold text-xs"
                    onClick={() => navigate('/dashboard')}
                  >
                    {t('profile.openFirstTrade')}
                  </Button>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={topAssetsData} layout="horizontal" margin={{ top: 4, right: 8, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                    <XAxis type="number" stroke="#3A3A3A" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis dataKey="asset" type="category" stroke="#3A3A3A" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <Tooltip contentStyle={ttStyle} />
                    <Bar dataKey="buys"  fill="#00C853" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="sells" fill="#FF4444" radius={[4, 0, 0, 4]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* ── COMPETITION HISTORY ────────────────────────────────────────── */}
            <div className={`${card} p-5 md:p-6`}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#FFD700]/15 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-[#FFD700]" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-200">{t('profile.history')}</h3>
                </div>
                {totalComps > 0 && (
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span><span className="text-white font-semibold">{totalComps}</span> {t('profile.competitions')}</span>
                    <span>·</span>
                    <span><span className="text-[#00C853] font-semibold">{wonComps}</span> {t('profile.wins')}</span>
                  </div>
                )}
              </div>

              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <Award className="h-12 w-12 text-gray-700" />
                  <p className="text-gray-500 text-sm">{t('profile.noHistory')}</p>
                  <Button
                    size="sm"
                    className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-bold text-xs"
                    onClick={() => navigate('/')}
                  >
                    {t('profile.joinNow')}
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#2A2A2A] hover:bg-transparent">
                        <TableHead className="text-[#FFD700] text-xs font-semibold">{t('profile.date')}</TableHead>
                        <TableHead className="text-[#FFD700] text-xs font-semibold">{t('profile.level')}</TableHead>
                        <TableHead className="text-[#FFD700] text-xs font-semibold hidden md:table-cell">{t('profile.positionCol')}</TableHead>
                        <TableHead className="text-[#FFD700] text-xs font-semibold">{t('profile.achievedLevel')}</TableHead>
                        <TableHead className="text-[#FFD700] text-xs font-semibold">{t('profile.returnPct')}</TableHead>
                        <TableHead className="text-[#FFD700] text-xs font-semibold">{t('profile.prizeWon')}</TableHead>
                        <TableHead className="text-[#FFD700] text-xs font-semibold w-8" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((h, i) => {
                        const hPosNum = parseInt((h.position ?? '999').toString().replace('#', ''));
                        const hLevel  = getPositionLevel(h.position);
                        const hLabel  = lang === 'en' ? hLevel.labelEn : hLevel.label;
                        const hReturn = parseFloat(h.return || 0);
                        const hPrize  = parseFloat(h.prize || 0);
                        const isExpanded = expandedRow === i;

                        const tierC = h.level === 'premium'
                          ? 'bg-[#FFD700]/15 text-[#FFD700]' : h.level === 'medium'
                          ? 'bg-blue-400/15 text-blue-400'   : 'bg-emerald-400/15 text-emerald-400';

                        return (
                          <React.Fragment key={i}>
                            <TableRow
                              className="border-[#2A2A2A] hover:bg-white/5 cursor-pointer transition-colors"
                              onClick={() => setExpandedRow(isExpanded ? null : i)}
                            >
                              <TableCell className="text-gray-300 text-sm py-3">{h.date}</TableCell>
                              <TableCell className="py-3">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${tierC}`}>
                                  {(h.level || '-').toUpperCase()}
                                </span>
                              </TableCell>
                              <TableCell className="text-gray-300 text-sm py-3 hidden md:table-cell">
                                #{hPosNum}
                              </TableCell>
                              <TableCell className="py-3">
                                <span
                                  className="text-xs font-bold px-2 py-0.5 rounded"
                                  style={{ color: hLevel.color, backgroundColor: `${hLevel.color}20` }}
                                >
                                  {hLabel}
                                </span>
                              </TableCell>
                              <TableCell className={`text-sm font-bold py-3 ${hReturn > 0 ? 'text-[#00C853]' : 'text-red-400'}`}>
                                {hReturn > 0 ? '+' : ''}{hReturn.toFixed(2)}%
                              </TableCell>
                              <TableCell className="py-3">
                                {hPrize > 0
                                  ? <span className="text-[#FFD700] font-bold text-sm">{formatNumber(hPrize)} USDT</span>
                                  : <span className="text-gray-600 text-sm">—</span>
                                }
                              </TableCell>
                              <TableCell className="py-3">
                                {isExpanded
                                  ? <ChevronUp className="h-4 w-4 text-gray-500" />
                                  : <ChevronDown className="h-4 w-4 text-gray-600" />
                                }
                              </TableCell>
                            </TableRow>

                            {/* Expanded row */}
                            {isExpanded && (
                              <TableRow className="border-[#2A2A2A] bg-[#1a1f2e]/40">
                                <TableCell colSpan={7} className="py-3 px-4">
                                  <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs">
                                    <div>
                                      <span className="text-gray-500">{t('profile.positionCol')}: </span>
                                      <span className="text-white font-medium">#{hPosNum}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">{t('profile.achievedLevel')}: </span>
                                      <span className="font-medium" style={{ color: hLevel.color }}>{hLabel}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">ROI: </span>
                                      <span className={`font-medium ${hReturn >= 0 ? 'text-[#00C853]' : 'text-red-400'}`}>
                                        {hReturn > 0 ? '+' : ''}{hReturn.toFixed(2)}%
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">{t('profile.prizeWon')}: </span>
                                      <span className="text-[#FFD700] font-medium">
                                        {hPrize > 0 ? `${formatNumber(hPrize)} USDT` : '—'}
                                      </span>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </TooltipProvider>
  );
};

export default Profile;

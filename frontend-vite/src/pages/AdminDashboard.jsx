// ============================================================
// HOLYPOT TRADING — ADMIN DASHBOARD
// ============================================================
// ✅ BILINGÜE: USA SIEMPRE t('key') PARA TODOS LOS TEXTOS VISIBLES.
//             Añadir claves nuevas en admin.* en i18n.jsx (ES + EN).
// ✅ SOCKET: socket.on('liveUpdate') → fetchData(). NO modificar.
// ✅ APIs CONSUMIDAS:
//    • GET  /admin/data                  → overview, competencias, usuarios
//    • GET  /admin/payouts               → historial payouts
//    • GET  /admin/pending-payouts       → payouts pendientes por red
//    • GET  /admin/batch-payouts         → historial de batches
//    • POST /admin/trigger-batch-payout  → liquidar (siempre con confirmDialog)
//    • POST /admin/generate-user-token   → impersonar usuario
// ✅ ESTADO CRÍTICO: data | payouts | pendingPayouts | batches | loading
// ✅ ACCIONES DESTRUCTIVAS: SIEMPRE pedir confirmación vía confirmDialog
//    NUNCA llamar triggerBatch() directo sin setConfirmDialog primero
// ✅ NOTIFICACIONES: usar showToast(), NUNCA alert() ni confirm() nativo
// ✅ RESPONSIVE: 2 cols mobile → 4 cols desktop (overview)
//               1 col mobile → 2 cols desktop (analytics)
// ✅ NO TOCAR: fetchData | fetchSettlement | triggerBatch | viewAsUser | exportCSV
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import apiClient from '@/api';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { io } from "socket.io-client";
import background from "@/assets/background.jpg";
import { useI18n, LanguageToggle } from '@/i18n';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import {
  Users, DollarSign, Trophy, Activity, Search, RefreshCw,
  CheckCircle, XCircle, AlertTriangle, Zap, BarChart2
} from 'lucide-react';

// Socket (unchanged)
const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000
});

const formatNumber = (num) =>
  new Intl.NumberFormat('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num || 0);

const AdminDashboard = () => {
  // ── State (unchanged) ─────────────────────────────────────────────────────
  const [data, setData] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [pendingPayouts, setPendingPayouts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [settlementLoading, setSettlementLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nowpaymentsBalance, setNowpaymentsBalance] = useState(null);

  // ── UI-only state ──────────────────────────────────────────────────────────
  const [lastUpdated, setLastUpdated] = useState(null);
  const [toast, setToast] = useState(null);                   // { type, message }
  const [confirmDialog, setConfirmDialog] = useState(null);   // { title, desc, onConfirm }
  const [userSearch, setUserSearch] = useState('');
  const [userLevelFilter, setUserLevelFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [payoutsStatusFilter, setPayoutsStatusFilter] = useState('all');

  // ── Fetch guards (prevent concurrent calls & throttle socket events) ───────
  const isFetchingRef  = useRef(false);
  const lastFetchedRef = useRef(0);   // timestamp of last completed fetch

  const navigate = useNavigate();
  const { t } = useI18n();

  // ── Toast helper (replaces alert()) ───────────────────────────────────────
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  // ── Data fetching (unchanged logic, guarded against concurrent runs) ────────
  const fetchSettlement = async () => {
    try {
      const [pendingRes, batchRes] = await Promise.all([
        apiClient.get('/admin/pending-payouts'),
        apiClient.get('/admin/batch-payouts')
      ]);
      setPendingPayouts(pendingRes.data || []);
      setBatches(batchRes.data || []);
    } catch (err) {
      console.warn('Settlement endpoints no disponibles');
    }
  };

  const fetchData = async () => {
    // Skip if already running or fetched within the last 8 s
    if (isFetchingRef.current) return;
    if (Date.now() - lastFetchedRef.current < 8000) return;

    isFetchingRef.current = true;
    try {
      const res = await apiClient.get('/admin/data');
      setData(res.data || {
        overview: { inscripcionesTotal: 0, participantesActivos: 0, revenuePlataforma: 0, prizePoolTotal: 0 },
        competencias: {},
        usuarios: []
      });
      try {
        const payoutsRes = await apiClient.get('/admin/payouts');
        setPayouts(payoutsRes.data || []);
      } catch {
        setPayouts([]);
      }
      try {
        const balRes = await apiClient.get('/admin/nowpayments-status');
        setNowpaymentsBalance(balRes.data?.balance || null);
      } catch {
        setNowpaymentsBalance(null);
      }
      await fetchSettlement();
      lastFetchedRef.current = Date.now();
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      setLoading(false);
      showToast('error', t('admin.noData'));
      navigate('/admin-login');
    } finally {
      isFetchingRef.current = false;
    }
  };

  const triggerBatch = async (network = null) => {
    setSettlementLoading(true);
    try {
      const res = await apiClient.post('/admin/trigger-batch-payout', network ? { network } : {});
      showToast('success', res.data.message);
      await fetchSettlement();
    } catch (err) {
      showToast('error', err.response?.data?.error || err.message);
    } finally {
      setSettlementLoading(false);
      setConfirmDialog(null);
    }
  };

  useEffect(() => {
    fetchData();
    // Throttled handler: socket sends liveUpdate on every price tick,
    // but we only need to re-fetch admin data at most every 8 s.
    const handleLiveUpdate = () => fetchData();
    socket.on('liveUpdate', handleLiveUpdate);
    return () => socket.off('liveUpdate', handleLiveUpdate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const viewAsUser = async (entryId) => {
    try {
      const res = await apiClient.post('/admin/generate-user-token', { entryId });
      const adminToken = localStorage.getItem('holypotToken');
      localStorage.setItem('holypotAdminToken', adminToken);
      localStorage.setItem('holypotToken', res.data.token);
      localStorage.setItem('holypotEntryId', entryId);
      window.open('/dashboard', '_blank');
    } catch (err) {
      showToast('error', err.response?.data?.error || err.message);
    }
  };

  const exportCSV = (level) => {
    const csv = data?.competencias?.[level]?.top3CSV || '';
    const blob = new Blob([`Wallet,Amount USDT\n${csv}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `holypot_${level}_pagos.csv`;
    a.click();
  };

  // ── Derived / filtered data ────────────────────────────────────────────────
  const filteredUsers = (data?.usuarios || []).filter(u => {
    const q = userSearch.toLowerCase();
    const matchSearch = !q ||
      (u.displayName || '').toLowerCase().includes(q) ||
      (u.wallet || '').toLowerCase().includes(q);
    const matchLevel  = userLevelFilter  === 'all' || u.level  === userLevelFilter;
    const matchStatus = userStatusFilter === 'all' || u.status === userStatusFilter;
    return matchSearch && matchLevel && matchStatus;
  });

  const filteredPayouts = payoutsStatusFilter === 'all'
    ? payouts
    : payouts.filter(p => p.status === payoutsStatusFilter);

  const payoutsTotals = payouts.reduce((acc, p) => {
    if (p.status === 'confirmed' || p.status === 'sent') acc.paid += (p.amount || 0);
    else acc.pending += (p.amount || 0);
    return acc;
  }, { paid: 0, pending: 0 });

  // Analytics data (built from existing API responses)
  const competitionBarData = Object.entries(data?.competencias || {}).map(([level, comp]) => ({
    name: level.toUpperCase(),
    [t('dash.participants')]: comp.participantes || 0,
    'Prize Pool': comp.prizePool || 0,
  }));

  const revenueDonutData = [
    { name: t('admin.revenue'),   value: data?.overview?.revenuePlataforma || 0, color: '#00C853' },
    { name: t('admin.totalPool'), value: data?.overview?.prizePoolTotal    || 0, color: '#FFD700' },
  ];

  const payoutsDonutData = [
    { name: 'Confirmed', value: payouts.filter(p => p.status === 'confirmed').length, color: '#00C853' },
    { name: 'Pending',   value: payouts.filter(p => p.status === 'pending').length,   color: '#FFD700' },
    { name: 'Sent',      value: payouts.filter(p => p.status === 'sent').length,      color: '#4a9eff' },
    { name: 'Failed',    value: payouts.filter(p => p.status === 'failed').length,    color: '#FF4444' },
  ].filter(d => d.value > 0);

  // ── Visual helpers ─────────────────────────────────────────────────────────
  const card    = 'relative bg-[#161616] border border-[#2A2A2A] rounded-2xl shadow-lg';
  const ttStyle = { backgroundColor: '#161616', border: '1px solid #2A2A2A', color: 'white', borderRadius: '10px', fontSize: '12px' };

  const getMedalStyle = (pos) => {
    if (pos === 0) return { row: 'border-l-2 border-[#FFD700]',   icon: '🥇', text: 'text-[#FFD700]' };
    if (pos === 1) return { row: 'border-l-2 border-[#C0C0C0]',   icon: '🥈', text: 'text-[#C0C0C0]' };
    if (pos === 2) return { row: 'border-l-2 border-[#CD7F32]',   icon: '🥉', text: 'text-[#CD7F32]' };
    return                { row: '',                               icon: `#${pos + 1}`, text: 'text-gray-400' };
  };

  const StatusBadge = ({ status }) => {
    const map = {
      confirmed: 'bg-[#00C853]/15 text-[#00C853]',
      sent:      'bg-blue-500/15 text-blue-400',
      pending:   'bg-[#FFD700]/15 text-[#FFD700]',
      failed:    'bg-red-500/15 text-red-400',
    };
    return (
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${map[status] || 'bg-gray-600/20 text-gray-400'}`}>
        {status || '—'}
      </span>
    );
  };

  const tierColor = (level) =>
    level === 'premium' ? 'text-[#FFD700]' :
    level === 'medium'  ? 'text-blue-400'  : 'text-emerald-400';

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-[#FFD700]/20" />
            <div className="absolute inset-0 rounded-full border-4 border-t-[#FFD700] animate-spin" />
            <Zap className="absolute inset-0 m-auto h-8 w-8 text-[#FFD700]" />
          </div>
          <p className="text-lg text-gray-300">{t('admin.loadingAdmin')}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <p className="text-xl text-gray-400">{t('admin.noData')}</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen text-white relative overflow-hidden">

      {/* ── BACKGROUND ─────────────────────────────────────────────────────── */}
      <div className="fixed inset-0 -z-10">
        <img src={background} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/75" />
      </div>

      {/* ── TOAST ──────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[200] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl max-w-sm transition-all duration-300 ${
          toast.type === 'success'
            ? 'bg-[#00C853]/15 border-[#00C853]/35 text-[#00C853]'
            : 'bg-red-500/15 border-red-500/35 text-red-400'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle className="h-5 w-5 shrink-0" />
            : <XCircle className="h-5 w-5 shrink-0" />
          }
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}

      {/* ── CONFIRMATION DIALOG ────────────────────────────────────────────── */}
      <Dialog open={!!confirmDialog} onOpenChange={() => !settlementLoading && setConfirmDialog(null)}>
        <DialogContent className="bg-[#161616] border border-[#2A2A2A] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#FFD700]">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              {confirmDialog?.title}
            </DialogTitle>
            <DialogDescription className="text-gray-300 pt-1">
              {confirmDialog?.desc}
            </DialogDescription>
          </DialogHeader>
          <p className="text-xs text-gray-500 -mt-2">{t('admin.settleConfirmDesc')}</p>
          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="outline"
              className="border-[#2A2A2A] text-gray-300 hover:bg-white/5"
              disabled={settlementLoading}
              onClick={() => setConfirmDialog(null)}
            >
              {t('admin.cancel')}
            </Button>
            <Button
              className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-bold"
              disabled={settlementLoading}
              onClick={confirmDialog?.onConfirm}
            >
              {settlementLoading ? t('admin.processing') : t('admin.confirm')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* HEADER                                                               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <header className="relative bg-[#0F172A]/80 backdrop-blur-md border-b border-[#FFD700]/20 py-4 md:py-5">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-4xl font-bold text-[#FFD700]">{t('admin.title')}</h1>
            {lastUpdated && (
              <p className="text-xs text-gray-500 mt-0.5">
                {t('admin.lastUpdated')}: {lastUpdated.toLocaleTimeString('es-ES')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Button
              variant="outline"
              size="sm"
              className="border-[#2A2A2A] text-gray-400 hover:border-[#FFD700]/40 hover:text-white gap-1.5 text-xs"
              onClick={fetchData}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('admin.refresh')}</span>
            </Button>
            <Button
              size="sm"
              className="bg-red-600/15 text-red-400 hover:bg-red-600/30 border border-red-600/30 font-bold text-xs"
              onClick={() => navigate('/admin-login')}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* CONTENT                                                              */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-6 md:py-8">

        {/* ── OVERVIEW CARDS ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">

          <div className={`${card} p-4 md:p-5`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-[#FFD700]/15 flex items-center justify-center">
                <Trophy className="h-3.5 w-3.5 text-[#FFD700]" />
              </div>
              <span className="text-xs text-gray-500">{t('admin.totalSignups')}</span>
            </div>
            <p className="text-3xl md:text-4xl font-bold text-[#FFD700] tabular-nums">
              {data.overview?.inscripcionesTotal ?? 0}
            </p>
          </div>

          <div className={`${card} p-4 md:p-5`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <Users className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <span className="text-xs text-gray-500">{t('admin.activeParticipants')}</span>
            </div>
            <p className="text-3xl md:text-4xl font-bold text-blue-400 tabular-nums">
              {data.overview?.participantesActivos ?? 0}
            </p>
          </div>

          <div className={`${card} p-4 md:p-5`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-[#00C853]/15 flex items-center justify-center">
                <DollarSign className="h-3.5 w-3.5 text-[#00C853]" />
              </div>
              <span className="text-xs text-gray-500">{t('admin.revenue')}</span>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-[#00C853] tabular-nums">
              {formatNumber(data.overview?.revenuePlataforma ?? 0)}
              <span className="text-xs text-gray-500 font-normal ml-1">USDT</span>
            </p>
          </div>

          <div className={`${card} p-4 md:p-5`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center">
                <Activity className="h-3.5 w-3.5 text-purple-400" />
              </div>
              <span className="text-xs text-gray-500">{t('admin.totalPool')}</span>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-purple-400 tabular-nums">
              {formatNumber(data.overview?.prizePoolTotal ?? 0)}
              <span className="text-xs text-gray-500 font-normal ml-1">USDT</span>
            </p>
          </div>

          {/* Saldo real NowPayments */}
          <div className={`${card} p-4 md:p-5 col-span-2 md:col-span-1`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                <DollarSign className="h-3.5 w-3.5 text-cyan-400" />
              </div>
              <span className="text-xs text-gray-500">Saldo NowPayments</span>
            </div>
            {nowpaymentsBalance ? (
              <>
                <p className="text-2xl md:text-3xl font-bold text-cyan-400 tabular-nums">
                  {formatNumber(nowpaymentsBalance.usdtAvailable ?? 0)}
                  <span className="text-xs text-gray-500 font-normal ml-1">USDT</span>
                </p>
                {nowpaymentsBalance.usdtPending > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Pendiente: {formatNumber(nowpaymentsBalance.usdtPending)} USDT
                  </p>
                )}
              </>
            ) : (
              <p className="text-2xl font-bold text-gray-600">—</p>
            )}
          </div>
        </div>

        {/* ── TABS ───────────────────────────────────────────────────────────── */}
        <Tabs defaultValue="competencias">
          <TabsList className="grid w-full grid-cols-5 mb-5 bg-[#161616] border border-[#2A2A2A] rounded-xl overflow-hidden">
            {[
              ['competencias', t('admin.competitions')],
              ['usuarios',     t('admin.users')],
              ['payouts',      t('admin.payouts')],
              ['settlement',   'Settlement'],
              ['analytics',    t('admin.analytics')],
            ].map(([val, label]) => (
              <TabsTrigger
                key={val}
                value={val}
                className="text-xs md:text-sm py-2.5 text-gray-400 data-[state=active]:text-[#FFD700] data-[state=active]:bg-[#FFD700]/10 transition-all"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* TAB: COMPETENCIAS                                               */}
          {/* ════════════════════════════════════════════════════════════════ */}
          <TabsContent value="competencias" className="space-y-4">
            {Object.keys(data.competencias || {}).length === 0 ? (
              <div className={`${card} p-10 text-center`}>
                <Trophy className="h-12 w-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No hay competencias activas</p>
              </div>
            ) : Object.entries(data.competencias || {}).map(([level, comp]) => (
              <div key={level} className={card}>
                {/* Card header */}
                <div className="p-5 border-b border-[#2A2A2A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className={`text-xl md:text-2xl font-bold ${tierColor(level)}`}>
                      {level.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                      <span>
                        <Users className="h-3 w-3 inline mr-1" />
                        {comp.participantes ?? 0} {t('dash.participants')}
                      </span>
                      <span>
                        <DollarSign className="h-3 w-3 inline mr-1" />
                        {formatNumber(comp.prizePool ?? 0)} USDT {t('dash.prizePool')}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-bold text-xs"
                    onClick={() => exportCSV(level)}
                  >
                    {t('admin.exportCSV')}
                  </Button>
                </div>

                {/* Ranking table with top-3 highlights */}
                <div className="overflow-x-auto p-3 md:p-4">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#2A2A2A] hover:bg-transparent">
                        <TableHead className="text-[#FFD700] text-xs w-12">{t('admin.pos')}</TableHead>
                        <TableHead className="text-[#FFD700] text-xs">Trader</TableHead>
                        <TableHead className="text-[#FFD700] text-xs hidden md:table-cell">Wallet</TableHead>
                        <TableHead className="text-[#FFD700] text-xs">{t('rank.return')}</TableHead>
                        <TableHead className="text-[#FFD700] text-xs">{t('rank.capital')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(comp.ranking || []).map((r, i) => {
                        const m = getMedalStyle(i);
                        return (
                          <TableRow key={i} className={`border-[#2A2A2A] hover:bg-white/5 transition ${m.row}`}>
                            <TableCell className={`font-bold text-sm ${m.text}`}>{m.icon}</TableCell>
                            <TableCell className="text-gray-200 text-sm font-medium">{r.displayName || 'Anon'}</TableCell>
                            <TableCell className="font-mono text-xs text-gray-500 hidden md:table-cell">{r.wallet || '—'}</TableCell>
                            <TableCell className="text-sm font-bold text-[#00C853]">{r.retorno || '0%'}</TableCell>
                            <TableCell className="text-gray-200 text-sm">{formatNumber(r.liveCapital || 0)} USDT</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* TAB: USUARIOS                                                   */}
          {/* ════════════════════════════════════════════════════════════════ */}
          <TabsContent value="usuarios">
            <div className={card}>
              {/* Filters */}
              <div className="p-5 border-b border-[#2A2A2A] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-200">
                    {t('admin.userList')}
                    <span className="text-[#FFD700] ml-2 text-base font-bold">({filteredUsers.length})</span>
                  </h3>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-600" />
                    <input
                      type="text"
                      placeholder={t('admin.searchUser')}
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700]/40 transition"
                    />
                  </div>
                  <select
                    value={userLevelFilter}
                    onChange={e => setUserLevelFilter(e.target.value)}
                    className="px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-sm text-gray-300 focus:outline-none focus:border-[#FFD700]/40 transition"
                  >
                    <option value="all">{t('admin.allLevels')}</option>
                    <option value="basic">BASIC</option>
                    <option value="medium">MEDIUM</option>
                    <option value="premium">PREMIUM</option>
                  </select>
                  <select
                    value={userStatusFilter}
                    onChange={e => setUserStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-sm text-gray-300 focus:outline-none focus:border-[#FFD700]/40 transition"
                  >
                    <option value="all">{t('admin.allStatuses')}</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                    <option value="disqualified">Disqualified</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto p-3 md:p-4">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#2A2A2A] hover:bg-transparent">
                      <TableHead className="text-[#FFD700] text-xs">Trader</TableHead>
                      <TableHead className="text-[#FFD700] text-xs hidden md:table-cell">Wallet</TableHead>
                      <TableHead className="text-[#FFD700] text-xs">Level</TableHead>
                      <TableHead className="text-[#FFD700] text-xs hidden md:table-cell">Status</TableHead>
                      <TableHead className="text-[#FFD700] text-xs">{t('rank.capital')}</TableHead>
                      <TableHead className="text-[#FFD700] text-xs">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow className="border-[#2A2A2A]">
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500 text-sm">
                          No se encontraron usuarios
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.map(u => (
                      <TableRow key={u.id} className="border-[#2A2A2A] hover:bg-white/5 transition">
                        <TableCell className="text-gray-200 text-sm font-medium">{u.displayName || 'Anon'}</TableCell>
                        <TableCell className="font-mono text-xs text-gray-500 hidden md:table-cell">{u.wallet || '—'}</TableCell>
                        <TableCell>
                          <span className={`text-xs font-bold ${tierColor(u.level)}`}>
                            {u.level?.toUpperCase() || '—'}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <StatusBadge status={u.status} />
                        </TableCell>
                        <TableCell className="text-gray-200 text-sm">{formatNumber(u.virtualCapital || 0)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            className="bg-[#FFD700]/10 text-[#FFD700] hover:bg-[#FFD700]/20 border border-[#FFD700]/25 text-xs font-bold"
                            onClick={() => viewAsUser(u.id)}
                          >
                            {t('admin.viewAsUser')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* TAB: PAYOUTS                                                    */}
          {/* ════════════════════════════════════════════════════════════════ */}
          <TabsContent value="payouts">
            <div className={card}>
              {/* Summary + filter */}
              <div className="p-5 border-b border-[#2A2A2A] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-gray-200">{t('admin.payoutsHistory')}</h3>
                  <div className="flex gap-5 text-sm">
                    <div className="text-center">
                      <p className="text-[#00C853] font-bold tabular-nums">{formatNumber(payoutsTotals.paid)} USDT</p>
                      <p className="text-xs text-gray-500">{t('admin.totalPaid')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[#FFD700] font-bold tabular-nums">{formatNumber(payoutsTotals.pending)} USDT</p>
                      <p className="text-xs text-gray-500">{t('admin.totalPending')}</p>
                    </div>
                  </div>
                </div>
                <select
                  value={payoutsStatusFilter}
                  onChange={e => setPayoutsStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-sm text-gray-300 focus:outline-none focus:border-[#FFD700]/40 transition"
                >
                  <option value="all">{t('admin.allStatuses')}</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="sent">Sent</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* Table */}
              <div className="overflow-x-auto p-3 md:p-4">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#2A2A2A] hover:bg-transparent">
                      <TableHead className="text-[#FFD700] text-xs">{t('admin.date')}</TableHead>
                      <TableHead className="text-[#FFD700] text-xs">Trader</TableHead>
                      <TableHead className="text-[#FFD700] text-xs hidden md:table-cell">Level</TableHead>
                      <TableHead className="text-[#FFD700] text-xs hidden md:table-cell">{t('profile.positionCol')}</TableHead>
                      <TableHead className="text-[#FFD700] text-xs">{t('admin.network')}</TableHead>
                      <TableHead className="text-[#FFD700] text-xs">{t('profile.prizeWon')}</TableHead>
                      <TableHead className="text-[#FFD700] text-xs">Status</TableHead>
                      <TableHead className="text-[#FFD700] text-xs hidden md:table-cell">Payment ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayouts.length === 0 ? (
                      <TableRow className="border-[#2A2A2A]">
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500 text-sm">
                          {t('admin.noPayouts')}
                        </TableCell>
                      </TableRow>
                    ) : filteredPayouts.map(p => (
                      <TableRow key={p.id} className="border-[#2A2A2A] hover:bg-white/5 transition">
                        <TableCell className="text-gray-300 text-sm">{new Date(p.date).toLocaleDateString('es-ES')}</TableCell>
                        <TableCell className="text-gray-200 text-sm">{p.user?.nickname || 'Anon'}</TableCell>
                        <TableCell className="text-gray-300 text-xs hidden md:table-cell">{p.level?.toUpperCase() || '—'}</TableCell>
                        <TableCell className="text-gray-300 text-sm hidden md:table-cell">#{p.position || 0}</TableCell>
                        <TableCell>
                          <span className="text-xs font-mono font-bold text-gray-400">
                            {(p.network || '—').toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell className="text-[#00C853] font-bold text-sm">{formatNumber(p.amount || 0)} USDT</TableCell>
                        <TableCell><StatusBadge status={p.status} /></TableCell>
                        <TableCell className="font-mono text-xs text-gray-500 hidden md:table-cell">{p.paymentId || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* TAB: SETTLEMENT                                                 */}
          {/* ════════════════════════════════════════════════════════════════ */}
          <TabsContent value="settlement" className="space-y-4">

            {/* Pending payouts */}
            <div className={card}>
              <div className="p-5 border-b border-[#2A2A2A] flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-200">{t('admin.payoutSettlement')}</h3>
                  <p className="text-xs text-gray-600 mt-0.5">{t('admin.settleConfirmDesc')}</p>
                </div>
                <Button
                  className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-bold text-sm gap-2 shrink-0"
                  disabled={settlementLoading || pendingPayouts.length === 0}
                  onClick={() => setConfirmDialog({
                    title: t('admin.confirmAll'),
                    desc: `${pendingPayouts.reduce((s, g) => s + g.payouts.length, 0)} pagos · ${formatNumber(pendingPayouts.reduce((s, g) => s + g.totalAmount, 0))} USDT`,
                    onConfirm: () => triggerBatch()
                  })}
                >
                  <Zap className="h-4 w-4" />
                  {settlementLoading ? t('admin.processing') : t('admin.settleAll')}
                </Button>
              </div>

              <div className="p-4 md:p-5">
                {pendingPayouts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-10 w-10 text-[#00C853] mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">{t('admin.noPayoutsPending')}</p>
                  </div>
                ) : pendingPayouts.map(group => (
                  <div key={group.network} className="mb-6 last:mb-0">
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#2A2A2A]">
                      <div>
                        <span className="text-[#FFD700] font-bold">{group.label}</span>
                        <span className="text-gray-500 text-xs ml-2">
                          {group.payouts.length} pagos · {formatNumber(group.totalAmount)} USDT
                        </span>
                      </div>
                      <Button
                        size="sm"
                        disabled={settlementLoading}
                        className="bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border border-blue-500/30 text-xs font-bold"
                        onClick={() => setConfirmDialog({
                          title: `${t('admin.settleNetwork')} ${group.label}`,
                          desc: `${group.payouts.length} pagos · ${formatNumber(group.totalAmount)} USDT`,
                          onConfirm: () => triggerBatch(group.network)
                        })}
                      >
                        {t('admin.settleNetwork')} {group.label}
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-[#2A2A2A] hover:bg-transparent">
                            <TableHead className="text-[#FFD700] text-xs">Trader</TableHead>
                            <TableHead className="text-[#FFD700] text-xs">Level</TableHead>
                            <TableHead className="text-[#FFD700] text-xs">{t('admin.pos')}</TableHead>
                            <TableHead className="text-[#FFD700] text-xs">{t('admin.amount')}</TableHead>
                            <TableHead className="text-[#FFD700] text-xs hidden md:table-cell">Wallet</TableHead>
                            <TableHead className="text-[#FFD700] text-xs hidden md:table-cell">{t('admin.date')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.payouts.map(p => (
                            <TableRow key={p.id} className="border-[#2A2A2A] hover:bg-white/5 transition">
                              <TableCell className="text-gray-200 text-sm">{p.user?.nickname || 'Anon'}</TableCell>
                              <TableCell className={`text-xs font-bold ${tierColor(p.level)}`}>{p.level?.toUpperCase()}</TableCell>
                              <TableCell className="text-gray-300 text-sm">#{p.position}</TableCell>
                              <TableCell className="text-[#00C853] font-bold text-sm">{formatNumber(p.amount)} USDT</TableCell>
                              <TableCell className="font-mono text-xs text-gray-500 hidden md:table-cell">{p.walletAddress || '—'}</TableCell>
                              <TableCell className="text-gray-400 text-xs hidden md:table-cell">{new Date(p.date).toLocaleDateString('es-ES')}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Batch history */}
            <div className={card}>
              <div className="p-5 border-b border-[#2A2A2A]">
                <h3 className="text-sm font-semibold text-gray-200">{t('admin.batchHistory')}</h3>
              </div>
              <div className="overflow-x-auto p-3 md:p-4">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#2A2A2A] hover:bg-transparent">
                      <TableHead className="text-[#FFD700] text-xs">{t('admin.date')}</TableHead>
                      <TableHead className="text-[#FFD700] text-xs">{t('admin.network')}</TableHead>
                      <TableHead className="text-[#FFD700] text-xs">Pagos</TableHead>
                      <TableHead className="text-[#FFD700] text-xs">Total</TableHead>
                      <TableHead className="text-[#FFD700] text-xs">Status</TableHead>
                      <TableHead className="text-[#FFD700] text-xs hidden md:table-cell">NOWPayments ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.length === 0 ? (
                      <TableRow className="border-[#2A2A2A]">
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500 text-sm">
                          {t('admin.noBatches')}
                        </TableCell>
                      </TableRow>
                    ) : batches.map(b => (
                      <TableRow key={b.id} className="border-[#2A2A2A] hover:bg-white/5 transition">
                        <TableCell className="text-gray-300 text-sm">{new Date(b.createdAt).toLocaleDateString('es-ES')}</TableCell>
                        <TableCell className="text-gray-200 font-bold text-sm">{b.network?.toUpperCase()}</TableCell>
                        <TableCell className="text-gray-300 text-sm">{b.payoutCount}</TableCell>
                        <TableCell className="text-[#00C853] font-bold text-sm">{formatNumber(b.totalAmount)} USDT</TableCell>
                        <TableCell><StatusBadge status={b.status} /></TableCell>
                        <TableCell className="font-mono text-xs text-gray-500 hidden md:table-cell">{b.nowpaymentsId || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* TAB: ANALYTICS                                                  */}
          {/* ════════════════════════════════════════════════════════════════ */}
          <TabsContent value="analytics" className="space-y-4">

            {/* Quick stat row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: t('admin.totalSignups'),      val: data.overview?.inscripcionesTotal ?? 0,           color: '#FFD700',  suffix: '' },
                { label: t('admin.activeParticipants'), val: data.overview?.participantesActivos ?? 0,         color: '#4a9eff',  suffix: '' },
                { label: t('admin.revenue'),            val: `${formatNumber(data.overview?.revenuePlataforma ?? 0)} USDT`, color: '#00C853', suffix: '' },
                { label: t('admin.totalPool'),          val: `${formatNumber(data.overview?.prizePoolTotal    ?? 0)} USDT`, color: '#A855F7', suffix: '' },
              ].map((s, i) => (
                <div key={i} className={`${card} p-4 text-center`}>
                  <p className="text-xl md:text-2xl font-bold tabular-nums" style={{ color: s.color }}>{s.val}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Charts grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Participants by level */}
              <div className={`${card} p-5`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-[#FFD700]/15 flex items-center justify-center">
                    <BarChart2 className="h-3.5 w-3.5 text-[#FFD700]" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-200">{t('admin.signupsByLevel')}</h3>
                </div>
                {competitionBarData.length === 0 ? (
                  <div className="flex items-center justify-center h-[200px]">
                    <p className="text-gray-600 text-sm">Sin datos</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={competitionBarData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                      <XAxis dataKey="name" stroke="#3A3A3A" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <YAxis stroke="#3A3A3A" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <Tooltip contentStyle={ttStyle} />
                      <Bar dataKey={t('dash.participants')} fill="#FFD700" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Revenue vs Prize Pool donut */}
              <div className={`${card} p-5`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-[#00C853]/15 flex items-center justify-center">
                    <DollarSign className="h-3.5 w-3.5 text-[#00C853]" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-200">{t('admin.revenueVsPool')}</h3>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={revenueDonutData}
                      cx="50%" cy="50%"
                      innerRadius={55} outerRadius={85}
                      paddingAngle={4} dataKey="value"
                    >
                      {revenueDonutData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={ttStyle} formatter={v => `${formatNumber(v)} USDT`} />
                    <Legend formatter={val => <span style={{ color: '#9ca3af', fontSize: '11px' }}>{val}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Prize pool by level */}
              <div className={`${card} p-5`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center">
                    <Trophy className="h-3.5 w-3.5 text-purple-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-200">Prize Pool {t('admin.signupsByLevel')}</h3>
                </div>
                {competitionBarData.length === 0 ? (
                  <div className="flex items-center justify-center h-[200px]">
                    <p className="text-gray-600 text-sm">Sin datos</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={competitionBarData} margin={{ top: 4, right: 8, left: -5, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                      <XAxis dataKey="name" stroke="#3A3A3A" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <YAxis stroke="#3A3A3A" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <Tooltip contentStyle={ttStyle} formatter={v => `${formatNumber(v)} USDT`} />
                      <Bar dataKey="Prize Pool" fill="#A855F7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Payouts by status donut */}
              <div className={`${card} p-5`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center">
                    <Activity className="h-3.5 w-3.5 text-blue-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-200">{t('admin.payoutsDistribution')}</h3>
                </div>
                {payoutsDonutData.length === 0 ? (
                  <div className="flex items-center justify-center h-[200px]">
                    <p className="text-gray-600 text-sm">{t('admin.noPayouts')}</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={payoutsDonutData}
                        cx="50%" cy="50%"
                        innerRadius={55} outerRadius={85}
                        paddingAngle={4} dataKey="value"
                      >
                        {payoutsDonutData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip contentStyle={ttStyle} />
                      <Legend formatter={val => <span style={{ color: '#9ca3af', fontSize: '11px' }}>{val}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;

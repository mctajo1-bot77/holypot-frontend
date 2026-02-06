import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Rocket, 
  Coins, 
  Crown, 
  Power,
  Trophy,
  Medal,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { 
  RadialBarChart, 
  RadialBar, 
  PolarAngleAxis, 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip, 
  Cell 
} from 'recharts';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import logo from "@/assets/Holypot-logo.webp";
import background from "@/assets/background.jpg";

const API_BASE = 'http://localhost:5000/api';

axios.interceptors.request.use(config => {
  const userToken = localStorage.getItem('holypotToken');
  const adminToken = localStorage.getItem('holypotAdminToken');
  const token = userToken || adminToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const Profile = () => {
  const navigate = useNavigate();

  const [entryId] = useState(localStorage.getItem('holypotEntryId') || '');
  const [profile, setProfile] = useState(null);
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(true);

  const [competitions, setCompetitions] = useState({});
  const [userLevel, setUserLevel] = useState('basic');
  const [virtualCapital, setVirtualCapital] = useState(10000);

  const isAdminSession = !!localStorage.getItem('holypotAdminToken');

  const formatNumber = (num) => new Intl.NumberFormat('es-ES').format(num || 0);

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

  if (loading) return <p className="text-center text-3xl mt-40 text-gray-200">Cargando perfil...</p>;

  const userComp = competitions[userLevel] || { prizePool: 0, participants: 0, timeLeft: '00h 00m' };

  // STATS REALES (del backend profile.stats)
  const stats = profile?.stats || {};
  const buys = stats.buys || 0;
  const sells = stats.sells || 0;
  const totalTrades = stats.totalTrades || 0;
  const dailyReturn = parseFloat(stats.dailyReturn || 0);
  const moreBuys = buys > sells;

  // Top assets reales (del backend)
  const topAssetsData = stats.topAssets || [];

  // Placeholder bonito si no hay trades
  const hasTrades = totalTrades > 0;

  // Placeholder charts (hasta historial real)
  const dailyReturnData = hasTrades ? [] : [ // vacío si trades, placeholder si no
    { day: 'Lun', value: -413 },
    { day: 'Mar', value: 166 },
    { day: 'Mié', value: 803 },
    { day: 'Jue', value: -588 },
    { day: 'Vie', value: -902 }
  ];

  const sessionSuccessData = hasTrades ? [] : [
    { session: 'New York', success: 28.1 },
    { session: 'London', success: 16.7 },
    { session: 'Asia', success: 62.5 }
  ];

  const gaugeData = [
    { value: dailyReturn }
  ];

  const getLevelMedal = () => {
    const level = userLevel;
    const size = "h-12 w-12";
    if (level === 'premium') return <Trophy className={`${size} text-holy`} />;
    if (level === 'medium') return <Medal className={`${size} text-blue-400`} />;
    return <Medal className={`${size} text-profit`} />;
  };

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
            <UITooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-holy/20" onClick={() => navigate('/dashboard')}>
                  <Rocket className="h-10 w-10" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right"><p>Dashboard</p></TooltipContent>
            </UITooltip>

            <UITooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white bg-holy/20">
                  <Coins className="h-10 w-10" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right"><p>Mi Perfil</p></TooltipContent>
            </UITooltip>

            {isAdminSession && (
              <UITooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-holy/20" onClick={() => navigate('/admin')}>
                    <Crown className="h-10 w-10" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right"><p>Panel Admin</p></TooltipContent>
              </UITooltip>
            )}

            <div className="mt-auto">
              <UITooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-red-700" onClick={handleLogout}>
                    <Power className="h-10 w-10" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right"><p>Cerrar Sesión</p></TooltipContent>
              </UITooltip>
            </div>
          </nav>
        </aside>

        {/* CONTENIDO DEL PERFIL */}
        <main className="ml-20 pt-32 px-8 pb-20">
          <div className="max-w-7xl mx-auto">
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

            <div className="flex items-center justify-center mb-12 gap-6">
              {getLevelMedal()}
              <h1 className="text-5xl font-bold text-holy">
                ¡Hola, {profile?.nickname || 'Anónimo'}!
              </h1>
            </div>

            <p className="text-3xl text-center mb-12 text-gray-300">
              Estás {profile?.currentPosition || '#-'} en tu competencia actual • Mejor ranking histórico: {profile?.bestRanking || '#-'}
            </p>

            {/* GRID STATS SUPERIOR GLASS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {/* Sesgo comportamiento (real) */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-holy/20 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition" />
                <Card className="relative bg-black/30 backdrop-blur-xl border border-holy/40 rounded-3xl shadow-2xl p-8 text-center hover:scale-105 transition-all duration-500">
                  <CardHeader><CardTitle className="text-2xl text-gray-200">Sesgo comportamiento</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex justify-center items-center gap-8 mb-6">
                      <TrendingDown className="h-20 w-20 text-red-500" />
                      <Slider 
                        value={[buys / (buys + sells || 1) * 100]} 
                        className="w-64 bg-gray-700 [&_[role=slider]]:bg-red-500" 
                        disabled 
                      />
                      <TrendingUp className="h-20 w-20 text-profit" />
                    </div>
                    <p className="text-4xl font-bold text-white">{moreBuys ? 'Rather Bull 🐂' : 'Rather Bear 🐻'}</p>
                    <p className="text-xl text-gray-300 mt-2">Compras: {buys} | Ventas: {sells}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Operaciones totales (real) */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-holy/20 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition" />
                <Card className="relative bg-black/30 backdrop-blur-xl border border-holy/40 rounded-3xl shadow-2xl p-8 text-center hover:scale-105 transition-all duration-500">
                  <CardHeader><CardTitle className="text-2xl text-gray-200">Operaciones totales</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-6xl font-bold text-holy">{totalTrades}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Rendimiento diario (placeholder bonito si no trades) */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-holy/20 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition" />
                <Card className="relative bg-black/30 backdrop-blur-xl border border-holy/40 rounded-3xl shadow-2xl p-8 hover:scale-105 transition-all duration-500">
                  <CardHeader><CardTitle className="text-2xl text-gray-200">Rendimiento por día de trading</CardTitle></CardHeader>
                  <CardContent>
                    {hasTrades ? (
                      <p className="text-center text-gray-400 py-8">Historial real pronto – ¡compite más!</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={dailyReturnData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                          <XAxis dataKey="day" stroke="#9ca3af" tick={{ fill: '#d1d5db' }} />
                          <YAxis stroke="#9ca3af" tick={{ fill: '#d1d5db' }} />
                          <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: 'white' }} />
                          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                            {dailyReturnData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#00ff85' : '#ff5252'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* RENTABILIDAD + TASAS ÉXITO GLASS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              {/* Rentabilidad gauge (real) */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-holy/20 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition" />
                <Card className="relative bg-black/30 backdrop-blur-xl border border-holy/40 rounded-3xl shadow-2xl p-8 hover:scale-105 transition-all duration-500">
                  <CardHeader><CardTitle className="text-2xl text-gray-200 text-center">Rentabilidad</CardTitle></CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <ResponsiveContainer width={250} height={250}>
                      <RadialBarChart cx="50%" cy="50%" innerRadius="50%" outerRadius="90%" data={gaugeData}>
                        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                        <RadialBar dataKey="value" cornerRadius={20} fill="#00ff85" background={{ fill: '#334155' }} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <p className="text-5xl font-bold text-profit mt-4">{dailyReturn.toFixed(2)}%</p>
                    <p className="text-xl text-gray-300">Ratio de aciertos</p>
                  </CardContent>
                </Card>
              </div>

              {/* Tasas de éxito por sesión (placeholder bonito si no trades) */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-holy/20 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition" />
                <Card className="relative bg-black/30 backdrop-blur-xl border border-holy/40 rounded-3xl shadow-2xl p-8 hover:scale-105 transition-all duration-500">
                  <CardHeader><CardTitle className="text-2xl text-gray-200 text-center">Tasas de éxito por sesión</CardTitle></CardHeader>
                  <CardContent>
                    {hasTrades ? (
                      <p className="text-center text-gray-400 py-8">Historial real pronto – ¡compite más!</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={sessionSuccessData} layout="horizontal">
                          <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                          <XAxis type="number" stroke="#9ca3af" tick={{ fill: '#d1d5db' }} domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} tickFormatter={(value) => `${value}%`} />
                          <YAxis dataKey="session" type="category" stroke="#9ca3af" tick={{ fill: '#d1d5db' }} />
                          <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: 'white' }} formatter={(value) => `${value}%`} />
                          <Line type="monotone" dataKey="success" stroke="#00ff85" strokeWidth={6} dot={{ fill: '#00ff85', r: 8 }} activeDot={{ r: 10 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* INSTRUMENTOS MÁS OPERADOS GLASS (real topAssets) */}
            <div className="relative group mb-16">
              <div className="absolute inset-0 bg-gradient-to-br from-holy/20 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition" />
              <Card className="relative bg-black/30 backdrop-blur-xl border border-holy/40 rounded-3xl shadow-2xl p-10 hover:scale-105 transition-all duration-500">
                <CardHeader><CardTitle className="text-3xl text-holy text-center">Instrumentos más operados</CardTitle></CardHeader>
                <CardContent>
                  {topAssetsData.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">No trades aún – ¡abre tu primer trade! 🚀</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={topAssetsData} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                        <XAxis type="number" stroke="#9ca3af" tick={{ fill: '#d1d5db' }} />
                        <YAxis dataKey="asset" type="category" stroke="#9ca3af" tick={{ fill: '#d1d5db' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: 'white' }} />
                        <Bar dataKey="buys" fill="#00ff85" radius={[0, 8, 8, 0]} />
                        <Bar dataKey="sells" fill="#ff5252" radius={[8, 0, 0, 8]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* HISTORIAL COMPETENCIAS GLASS */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-holy/20 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition" />
              <Card className="relative bg-black/30 backdrop-blur-xl border border-holy/40 rounded-3xl shadow-2xl p-10">
                <CardHeader><CardTitle className="text-3xl text-holy text-center">Historial competencias</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader className="bg-black/40">
                      <TableRow>
                        <TableHead className="text-holy">Fecha</TableHead>
                        <TableHead className="text-holy">Level</TableHead>
                        <TableHead className="text-holy">Retorno %</TableHead>
                        <TableHead className="text-holy">Posición</TableHead>
                        <TableHead className="text-holy">Premio ganado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(profile?.history || []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                            No historial aún – ¡compite hoy!
                          </TableCell>
                        </TableRow>
                      ) : (
                        profile?.history?.map((h, i) => (
                          <TableRow key={i} className="hover:bg-white/10 transition">
                            <TableCell className="text-gray-200">{h.date}</TableCell>
                            <TableCell className="text-gray-200">{h.level.toUpperCase()}</TableCell>
                            <TableCell className={parseFloat(h.return) > 0 ? "text-profit" : "text-red-500"}>
                              {parseFloat(h.return).toFixed(2)}%
                            </TableCell>
                            <TableCell className="text-gray-200">#{h.position || '-'}</TableCell>
                            <TableCell className="text-profit font-bold">
                              {formatNumber(h.prize)} USDT
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
};

export default Profile;
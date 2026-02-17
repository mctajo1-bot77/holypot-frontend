import React, { useState, useEffect } from 'react';
import apiClient from '@/api';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { io } from "socket.io-client";
import background from "@/assets/background.jpg";
import { useI18n, LanguageToggle } from '@/i18n';

// Socket dinámico
const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000
});

const formatNumber = (num) => {
  return new Intl.NumberFormat('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num || 0);
};

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useI18n();

  const fetchData = async () => {
    try {
      const res = await apiClient.get('/admin/data');
      setData(res.data || { overview: { inscripcionesTotal: 0, participantesActivos: 0, revenuePlataforma: 0, prizePoolTotal: 0 }, competencias: {}, usuarios: [] });

      try {
        const payoutsRes = await apiClient.get('/admin/payouts');
        setPayouts(payoutsRes.data || []);
      } catch (payoutErr) {
        console.warn('Payouts endpoint no disponible');
        setPayouts([]);
      }

      setLoading(false);
    } catch (err) {
      setLoading(false);
      alert('Error cargando datos admin');
      navigate('/admin-login');
    }
  };

  useEffect(() => {
    fetchData();
    socket.on('liveUpdate', fetchData);
    return () => socket.off('liveUpdate');
  }, [navigate]);

  const viewAsUser = async (entryId) => {
    try {
      const res = await apiClient.post('/admin/generate-user-token', { entryId });
      const adminToken = localStorage.getItem('holypotToken');
      localStorage.setItem('holypotAdminToken', adminToken);
      localStorage.setItem('holypotToken', res.data.token);
      localStorage.setItem('holypotEntryId', entryId);
      window.open('/dashboard', '_blank');
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
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

  if (loading) return <p className="text-center text-xl md:text-3xl mt-40 text-gray-200">{t('admin.loadingAdmin')}</p>;

  if (!data) return <p className="text-center text-xl md:text-3xl mt-40 text-gray-200">{t('admin.noData')}</p>;

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* FONDO */}
      <div className="fixed inset-0 -z-10">
        <img src={background} alt="Fondo" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* HEADER */}
      <header className="relative bg-primary/65 backdrop-blur-md border-b border-holy/20 shadow-md py-4 md:py-8">
        <div className="max-w-7xl mx-auto px-3 md:px-6 text-center">
          <div className="flex justify-center mb-2">
            <LanguageToggle />
          </div>
          <h1 className="text-2xl md:text-5xl font-bold text-holy">{t('admin.title')}</h1>
          <Button
            onClick={() => navigate('/admin-login')}
            className="mt-3 md:mt-6 bg-gradient-to-r from-holy to-purple-600 text-black text-base md:text-xl px-6 md:px-8 py-2 md:py-4 font-bold rounded-full hover:scale-105 transition"
          >
            Logout
          </Button>
        </div>
      </header>

      {/* OVERVIEW */}
      <div className="max-w-7xl mx-auto px-3 md:px-8 py-8 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12 mb-8 md:mb-16">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-holy/30 to-transparent rounded-2xl md:rounded-3xl blur-xl group-hover:blur-2xl transition" />
            <Card className="relative bg-black/30 backdrop-blur-xl border border-holy/40 rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-8 text-center hover:md:scale-105 transition-all duration-500">
              <CardTitle className="text-lg md:text-2xl mb-2 md:mb-4 text-gray-200">{t('admin.totalSignups')}</CardTitle>
              <p className="text-3xl md:text-5xl font-bold text-holy">{data.overview?.inscripcionesTotal ?? 0}</p>
            </Card>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-profit/30 to-transparent rounded-2xl md:rounded-3xl blur-xl group-hover:blur-2xl transition" />
            <Card className="relative bg-black/30 backdrop-blur-xl border border-profit/40 rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-8 text-center hover:md:scale-105 transition-all duration-500">
              <CardTitle className="text-lg md:text-2xl mb-2 md:mb-4 text-gray-200">{t('admin.revenue')}</CardTitle>
              <p className="text-3xl md:text-5xl font-bold text-profit">{formatNumber(data.overview?.revenuePlataforma ?? 0)} USDT</p>
            </Card>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-transparent rounded-2xl md:rounded-3xl blur-xl group-hover:blur-2xl transition" />
            <Card className="relative bg-black/30 backdrop-blur-xl border border-blue-500/40 rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-8 text-center hover:md:scale-105 transition-all duration-500">
              <CardTitle className="text-lg md:text-2xl mb-2 md:mb-4 text-gray-200">{t('admin.totalPool')}</CardTitle>
              <p className="text-3xl md:text-5xl font-bold text-holy">{formatNumber(data.overview?.prizePoolTotal ?? 0)} USDT</p>
            </Card>
          </div>
        </div>

        {/* TABS */}
        <Tabs defaultValue="competencias" className="max-w-7xl mx-auto">
          <TabsList className="grid w-full grid-cols-3 mb-4 md:mb-8 bg-black/40 backdrop-blur-md border border-holy/20 rounded-xl">
            <TabsTrigger value="competencias" className="text-sm md:text-xl py-2 md:py-4 text-white">{t('admin.competitions')}</TabsTrigger>
            <TabsTrigger value="usuarios" className="text-sm md:text-xl py-2 md:py-4 text-white">{t('admin.users')}</TabsTrigger>
            <TabsTrigger value="payouts" className="text-sm md:text-xl py-2 md:py-4 text-white">{t('admin.payouts')}</TabsTrigger>
          </TabsList>

          <TabsContent value="competencias">
            {Object.keys(data.competencias || {}).map(level => (
              <div key={level} className="relative group mb-8 md:mb-16">
                <div className="absolute inset-0 bg-gradient-to-br from-holy/20 to-transparent rounded-2xl md:rounded-3xl blur-xl group-hover:blur-2xl transition" />
                <Card className="relative bg-black/30 backdrop-blur-xl border border-holy/40 rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-10 hover:md:scale-103 transition-all duration-500">
                  <CardHeader className="p-2 md:p-6">
                    <CardTitle className="text-lg md:text-3xl text-holy">
                      {level.toUpperCase()} – {data.competencias[level]?.participantes ?? 0} {t('dash.participants')} – {t('dash.prizePool')}: {formatNumber(data.competencias[level]?.prizePool ?? 0)} USDT
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-black/40">
                          <TableRow>
                            <TableHead className="text-holy">Pos</TableHead>
                            <TableHead className="text-holy">Trader</TableHead>
                            <TableHead className="text-holy hidden md:table-cell">Wallet</TableHead>
                            <TableHead className="text-holy">{t('rank.return')}</TableHead>
                            <TableHead className="text-holy">{t('rank.capital')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(data.competencias[level]?.ranking || []).map((r, i) => (
                            <TableRow key={i} className="hover:bg-white/10 transition">
                              <TableCell className="font-bold text-gray-200">#{i + 1}</TableCell>
                              <TableCell className="text-gray-200">{r.displayName || 'Anon'}</TableCell>
                              <TableCell className="font-mono text-sm text-gray-300 hidden md:table-cell">{r.wallet || ''}</TableCell>
                              <TableCell className="text-gray-200">{r.retorno || '0%'}</TableCell>
                              <TableCell className="text-gray-200">{formatNumber(r.liveCapital || 0)} USDT</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <Button
                      onClick={() => exportCSV(level)}
                      className="mt-4 md:mt-8 bg-gradient-to-r from-holy to-green-600 text-black text-sm md:text-xl px-4 md:px-8 py-3 md:py-5 font-bold rounded-full shadow-lg hover:scale-105 transition"
                    >
                      {t('admin.exportCSV')}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="usuarios">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-holy/20 to-transparent rounded-2xl md:rounded-3xl blur-xl group-hover:blur-2xl transition" />
              <Card className="relative bg-black/30 backdrop-blur-xl border border-holy/40 rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-10">
                <CardHeader className="p-2 md:p-6">
                  <CardTitle className="text-lg md:text-3xl text-holy">{t('admin.userList')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-black/40">
                        <TableRow>
                          <TableHead className="text-holy">Trader</TableHead>
                          <TableHead className="text-holy hidden md:table-cell">Wallet</TableHead>
                          <TableHead className="text-holy">Level</TableHead>
                          <TableHead className="text-holy hidden md:table-cell">Status</TableHead>
                          <TableHead className="text-holy">{t('rank.capital')}</TableHead>
                          <TableHead className="text-holy">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(data.usuarios || []).map(u => (
                          <TableRow key={u.id} className="hover:bg-white/10 transition">
                            <TableCell className="text-gray-200">{u.displayName || 'Anon'}</TableCell>
                            <TableCell className="font-mono text-sm text-gray-300 hidden md:table-cell">{u.wallet || ''}</TableCell>
                            <TableCell className="text-gray-200">{u.level?.toUpperCase() || ''}</TableCell>
                            <TableCell className="text-gray-200 hidden md:table-cell">{u.status || ''}</TableCell>
                            <TableCell className="text-gray-200">{formatNumber(u.virtualCapital || 0)}</TableCell>
                            <TableCell>
                              <Button
                                onClick={() => viewAsUser(u.id)}
                                className="bg-gradient-to-r from-holy to-blue-600 text-black px-3 md:px-6 py-2 md:py-3 text-xs md:text-base font-bold rounded-full hover:scale-105 transition"
                              >
                                {t('admin.viewAsUser')}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payouts">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-holy/20 to-transparent rounded-2xl md:rounded-3xl blur-xl group-hover:blur-2xl transition" />
              <Card className="relative bg-black/30 backdrop-blur-xl border border-holy/40 rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-10">
                <CardHeader className="p-2 md:p-6">
                  <CardTitle className="text-lg md:text-3xl text-holy text-center">{t('admin.payoutsHistory')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-black/40">
                        <TableRow>
                          <TableHead className="text-holy">{t('profile.date')}</TableHead>
                          <TableHead className="text-holy">Trader</TableHead>
                          <TableHead className="text-holy hidden md:table-cell">Level</TableHead>
                          <TableHead className="text-holy hidden md:table-cell">{t('profile.positionCol')}</TableHead>
                          <TableHead className="text-holy">{t('profile.prizeWon')}</TableHead>
                          <TableHead className="text-holy">Status</TableHead>
                          <TableHead className="text-holy hidden md:table-cell">Payment ID</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payouts.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                              {t('admin.noPayouts')}
                            </TableCell>
                          </TableRow>
                        ) : (
                          payouts.map((p) => (
                            <TableRow key={p.id} className="hover:bg-white/10 transition">
                              <TableCell className="text-gray-200">{new Date(p.date).toLocaleDateString('es-ES')}</TableCell>
                              <TableCell className="text-gray-200">{p.user?.nickname || 'Anon'}</TableCell>
                              <TableCell className="text-gray-200 hidden md:table-cell">{p.level?.toUpperCase() || ''}</TableCell>
                              <TableCell className="text-gray-200 hidden md:table-cell">#{p.position || 0}</TableCell>
                              <TableCell className="text-profit font-bold">{formatNumber(p.amount || 0)} USDT</TableCell>
                              <TableCell>
                                <Badge variant={p.status === 'confirmed' ? "default" : "secondary"} className={p.status === 'confirmed' ? "bg-profit text-black" : "bg-gray-600 text-white"}>
                                  {p.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono text-sm text-gray-300 hidden md:table-cell">{p.paymentId || '-'}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Trophy, Shield, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import logo from '@/assets/Holypot-logo.webp';

// Scroll to anchor on hash navigation (e.g. /ganadores#pagos-verificados)
function useHashScroll() {
  useEffect(() => {
    if (!window.location.hash) return;
    const id = window.location.hash.replace('#', '');
    const el = document.getElementById(id);
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
  }, []);
}

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:5000/api';

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

const medal = (pos) => pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : `${pos}º`;

export default function WinnersPage() {
  const navigate = useNavigate();
  useHashScroll();
  const [hallOfFame, setHallOfFame] = useState([]);
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [histLoading, setHistLoading] = useState(false);

  useEffect(() => {
    const fetchHof = async () => {
      try {
        const res = await axios.get(`${API_BASE}/hall-of-fame`);
        setHallOfFame(res.data);
      } catch (err) {
        console.error('hall-of-fame error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHof();
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      setHistLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/winners-history?page=${page}`);
        setHistory(res.data.winners);
        setTotalPages(res.data.pages);
      } catch (err) {
        console.error('winners-history error:', err);
      } finally {
        setHistLoading(false);
      }
    };
    fetchHistory();
  }, [page]);

  return (
    <div className="min-h-screen bg-[#060914] text-white">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0F172A]/95 backdrop-blur-md border-b border-[#D4AF37]/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition"
          >
            <ChevronLeft className="w-4 h-4" /> Inicio
          </button>
          <div className="flex items-center gap-2">
            <img src={logo} alt="Holypot" className="h-7 w-7 object-contain" />
            <span className="font-bold text-[#D4AF37] text-lg">Ganadores</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-20">

        {/* ── HALL OF FAME ─────────────────────────────────────────── */}
        <section id="hall-of-fame">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Trophy className="w-9 h-9 text-[#D4AF37]" />
              <h1 className="text-3xl md:text-5xl font-extrabold text-white">Hall of Fame</h1>
            </div>
            <p className="text-gray-400 max-w-xl mx-auto">
              Los mejores traders de la historia de Holypot — clasificados por tasa de éxito y mejor retorno.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
            </div>
          ) : hallOfFame.length === 0 ? (
            <div className="text-center py-16 text-gray-600">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Aún no hay datos históricos. ¡Compite hoy y sé el primero!</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#D4AF37]/20 shadow-2xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#D4AF37]/8 text-[#D4AF37] text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 text-left w-12">#</th>
                    <th className="px-4 py-3 text-left">Trader</th>
                    <th className="px-4 py-3 text-center">Competencias</th>
                    <th className="px-4 py-3 text-center">Tasa Éxito</th>
                    <th className="px-4 py-3 text-center">Mejor Retorno</th>
                    <th className="px-4 py-3 text-center hidden md:table-cell">Retorno Prom.</th>
                    <th className="px-4 py-3 text-center hidden md:table-cell">Instrumento Top</th>
                  </tr>
                </thead>
                <tbody>
                  {hallOfFame.map((trader, i) => (
                    <tr
                      key={i}
                      className={`border-t border-[#1a2035] transition-colors ${
                        i < 3 ? 'bg-[#D4AF37]/5' : 'hover:bg-white/2'
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <span className={`font-bold text-base ${
                          i === 0 ? 'text-[#FFD700]' :
                          i === 1 ? 'text-gray-300' :
                          i === 2 ? 'text-orange-400' : 'text-gray-600'
                        }`}>
                          {i < 3 ? medal(i + 1) : `#${i + 1}`}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xl" title={trader.country}>
                            {COUNTRY_FLAGS[trader.country] || '🌍'}
                          </span>
                          <span className="font-semibold text-white">{trader.nickname}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center text-gray-300">{trader.competitions}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`font-bold text-base ${trader.winRate > 0 ? 'text-[#00C853]' : 'text-gray-600'}`}>
                          {trader.winRate}%
                        </span>
                      </td>
                      <td className={`px-4 py-3.5 text-center font-bold ${trader.bestReturn >= 0 ? 'text-[#00C853]' : 'text-red-400'}`}>
                        {trader.bestReturn >= 0 ? '+' : ''}{trader.bestReturn}%
                      </td>
                      <td className={`px-4 py-3.5 text-center text-sm hidden md:table-cell ${trader.avgReturn >= 0 ? 'text-[#00C853]/70' : 'text-red-400/70'}`}>
                        {trader.avgReturn >= 0 ? '+' : ''}{trader.avgReturn}%
                      </td>
                      <td className="px-4 py-3.5 text-center hidden md:table-cell">
                        <span className="text-xs bg-[#1a2035] border border-[#2A3050] px-2 py-1 rounded font-mono text-gray-300">
                          {trader.topInstrument}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── PAGOS VERIFICADOS ────────────────────────────────────── */}
        <section id="pagos-verificados">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Shield className="w-8 h-8 text-[#00C853]" />
              <h2 className="text-2xl md:text-4xl font-extrabold text-white">Pagos Verificados</h2>
            </div>
            <p className="text-gray-400 max-w-xl mx-auto text-sm">
              Cada premio pagado es verificable directamente en blockchain.
              Haz clic en <strong className="text-white">Verificar →</strong> para confirmar el pago en el explorador.
            </p>
          </div>

          {histLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-[#00C853]/30 border-t-[#00C853] rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-16 text-gray-600">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Aún no hay pagos confirmados registrados.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-2xl border border-[#00C853]/20 shadow-2xl">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#00C853]/8 text-[#00C853] text-xs uppercase tracking-wider">
                      <th className="px-4 py-3 text-left">Fecha</th>
                      <th className="px-4 py-3 text-left">Trader</th>
                      <th className="px-4 py-3 text-center">Nivel</th>
                      <th className="px-4 py-3 text-center">Pos</th>
                      <th className="px-4 py-3 text-center hidden md:table-cell">Retorno</th>
                      <th className="px-4 py-3 text-right">Premio</th>
                      <th className="px-4 py-3 text-center hidden lg:table-cell">Wallet</th>
                      <th className="px-4 py-3 text-center hidden md:table-cell">Red</th>
                      <th className="px-4 py-3 text-center">Verificar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((w, i) => (
                      <tr key={i} className="border-t border-[#1a2035] hover:bg-white/2 transition-colors">
                        <td className="px-4 py-3.5 text-gray-400 text-xs whitespace-nowrap">{w.date}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xl" title={w.country}>{COUNTRY_FLAGS[w.country] || '🌍'}</span>
                            <span className="font-semibold text-white">{w.nickname}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            w.level === 'BASIC' ? 'bg-[#00C853]/15 text-[#00C853]' :
                            w.level === 'MEDIUM' ? 'bg-blue-500/15 text-blue-400' :
                            'bg-[#D4AF37]/15 text-[#D4AF37]'
                          }`}>
                            {w.level}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center text-xl">{medal(w.position)}</td>
                        <td className={`px-4 py-3.5 text-center font-bold hidden md:table-cell ${
                          w.return > 0 ? 'text-[#00C853]' : w.return < 0 ? 'text-red-400' : 'text-gray-500'
                        }`}>
                          {w.return != null ? `${w.return >= 0 ? '+' : ''}${w.return}%` : '-'}
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-[#D4AF37] whitespace-nowrap">
                          ${w.amount.toFixed(2)} USDT
                        </td>
                        <td className="px-4 py-3.5 text-center hidden lg:table-cell">
                          <span className="font-mono text-xs text-gray-500">{w.walletShort}</span>
                        </td>
                        <td className="px-4 py-3.5 text-center hidden md:table-cell">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            w.network === 'POLYGON' ? 'bg-purple-500/15 text-purple-400' : 'bg-red-400/15 text-red-400'
                          }`}>
                            {w.network}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {w.explorerUrl ? (
                            <a
                              href={w.explorerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-[#00C853] hover:text-white transition font-semibold"
                            >
                              <span className="hidden md:inline">Verificar</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span className="text-gray-700 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg bg-[#1a2035] text-white disabled:opacity-30 hover:bg-[#2a3050] transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-gray-400 text-sm">Página {page} de {totalPages}</span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg bg-[#1a2035] text-white disabled:opacity-30 hover:bg-[#2a3050] transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </section>

      </div>

      {/* Footer simple */}
      <footer className="border-t border-[#D4AF37]/10 mt-10 py-8 text-center">
        <p className="text-xs text-gray-600">Holypot Trading © 2026 · Todos los pagos verificados en blockchain</p>
      </footer>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Trophy, ChevronLeft } from 'lucide-react';
import logo from '@/assets/Holypot-logo.webp';
import TopWinnersPyramid from '@/components/TopWinnersPyramid';

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
  const [hallOfFame, setHallOfFame] = useState([]);
  const [lastResults, setLastResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeLevel, setActiveLevel] = useState('medium');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hofRes, lastRes] = await Promise.all([
          axios.get(`${API_BASE}/hall-of-fame`),
          axios.get(`${API_BASE}/last-competition-results`)
        ]);
        setHallOfFame(hofRes.data);
        setLastResults(lastRes.data);
      } catch (err) {
        console.error('winners page error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[#060914] text-white">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0F172A]/95 backdrop-blur-md border-b border-[#D4AF37]/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition"
          >
            <ChevronLeft className="w-4 h-4" /> Volver
          </button>
          <div className="flex items-center gap-2">
            <img src={logo} alt="Holypot" className="h-7 w-7 object-contain" />
            <span className="font-bold text-[#D4AF37] text-lg">Hall of Fame</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-10">

        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Trophy className="w-9 h-9 text-[#D4AF37]" />
            <h1 className="text-3xl md:text-5xl font-extrabold text-white">Hall of Fame</h1>
          </div>
          <p className="text-gray-400 max-w-xl mx-auto">
            Los mejores traders de la historia de Holypot — clasificados por tasa de éxito y mejor retorno.
          </p>
        </div>

        {/* ── ÚLTIMA COMPETENCIA – PODIO ── */}
        {!loading && lastResults && (
          <div className="mb-12">
            <p className="text-xs text-[#D4AF37] font-bold uppercase tracking-widest text-center mb-4">
              Última competencia
            </p>

            {/* Level tabs */}
            <div className="flex justify-center gap-2 mb-6">
              {['basic', 'medium', 'premium'].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setActiveLevel(lvl)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition ${
                    activeLevel === lvl
                      ? lvl === 'basic' ? 'bg-[#00C853] text-black'
                        : lvl === 'medium' ? 'bg-blue-500 text-white'
                        : 'bg-[#D4AF37] text-black'
                      : 'bg-[#1a2035] text-gray-400 hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {lastResults[activeLevel]?.hasData ? (
              <TopWinnersPyramid
                top3={lastResults[activeLevel].top3 || []}
                level={activeLevel}
                date={lastResults[activeLevel].date}
                prizePool={lastResults[activeLevel].prizePool}
              />
            ) : (
              <div className="text-center py-10 text-gray-600 border border-[#1a2035] rounded-2xl">
                <Trophy className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Sin datos para {activeLevel.toUpperCase()} — ¡compite hoy!</p>
              </div>
            )}
          </div>
        )}

        {/* ── HALL OF FAME TABLE ── */}
        <p className="text-xs text-[#D4AF37] font-bold uppercase tracking-widest text-center mb-6">
          Ranking histórico global
        </p>

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

      </div>

      <footer className="border-t border-[#D4AF37]/10 mt-10 py-8 text-center">
        <p className="text-xs text-gray-600">Holypot Trading © 2026 · Todos los pagos verificados en blockchain</p>
      </footer>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy } from "lucide-react";
import { useI18n } from '@/i18n';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:5000/api';

const LandingHeaderWinners = () => {
  const { t } = useI18n();
  const [winners, setWinners] = useState({ basic: [], medium: [], premium: [] });
  const [totalPaid, setTotalPaid] = useState(0);
  const [currentLevel, setCurrentLevel] = useState('basic');

  const levels = ['basic', 'medium', 'premium'];
  const levelNames = { basic: 'BASIC', medium: 'MEDIUM', premium: 'PREMIUM' };

  useEffect(() => {
    const updateLevel = () => {
      const index = new Date().getUTCHours() % 3;
      setCurrentLevel(levels[index]);
    };
    updateLevel();
    const interval = setInterval(updateLevel, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [winnersRes, totalRes] = await Promise.all([
          axios.get(`${API_BASE}/last-winners`),
          axios.get(`${API_BASE}/total-prizes-paid`),
        ]);
        setWinners(winnersRes.data || { basic: [], medium: [], premium: [] });
        setTotalPaid(totalRes.data.totalPaid || 0);
      } catch (err) {
        console.error('Error fetching header data:', err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const top3 = winners[currentLevel] || [];
  const formatNumber = (num) => new Intl.NumberFormat('es-ES').format(Math.round(num || 0));

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">

      {/* Total pagado */}
      <div className="text-center md:text-left shrink-0">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
          {t('landing.totalPaid')}
        </p>
        <p className="text-4xl md:text-5xl font-extrabold text-[#D4AF37] tabular-nums leading-none">
          {formatNumber(totalPaid)}
        </p>
        <p className="text-sm text-gray-400 mt-1">USDT</p>
      </div>

      {/* Divider – visible on desktop */}
      <div className="hidden md:block w-px h-20 bg-[#D4AF37]/15 shrink-0" />

      {/* Winners */}
      <div className="flex-1 w-full">
        <p className="text-xs text-gray-500 uppercase tracking-widest text-center mb-4">
          {t('landing.winnersTitle')} {levelNames[currentLevel]}{' '}
          <span className="normal-case text-gray-600">{t('landing.winnersRotate')}</span>
        </p>

        {top3.length === 0 ? (
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 py-4">
            <Trophy className="w-8 h-8 text-gray-700 shrink-0" />
            <div className="text-center">
              <p className="text-gray-400 text-sm">{t('landing.noWinners')}</p>
              <p className="text-gray-600 text-xs mt-0.5">{t('landing.beFirst')}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-3">

            {/* 1st */}
            {top3[0] && (
              <div className="flex items-center gap-3 bg-yellow-500/8 border border-yellow-500/25 rounded-2xl px-4 py-3 min-w-[160px]">
                <div className="shrink-0">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-white text-sm truncate">{top3[0].nickname}</p>
                  <p className="text-yellow-400 text-xs tabular-nums">{formatNumber(top3[0].prize)} USDT</p>
                </div>
              </div>
            )}

            {/* 2nd */}
            {top3[1] && (
              <div className="flex items-center gap-3 bg-gray-400/5 border border-gray-500/20 rounded-2xl px-4 py-3 min-w-[140px]">
                <span className="text-gray-400 font-extrabold text-sm shrink-0">2°</span>
                <div className="min-w-0">
                  <p className="font-bold text-white text-sm truncate">{top3[1].nickname}</p>
                  <p className="text-gray-400 text-xs tabular-nums">{formatNumber(top3[1].prize)} USDT</p>
                </div>
              </div>
            )}

            {/* 3rd */}
            {top3[2] && (
              <div className="flex items-center gap-3 bg-amber-800/5 border border-amber-700/20 rounded-2xl px-4 py-3 min-w-[140px]">
                <span className="text-amber-600 font-extrabold text-sm shrink-0">3°</span>
                <div className="min-w-0">
                  <p className="font-bold text-white text-sm truncate">{top3[2].nickname}</p>
                  <p className="text-amber-600/70 text-xs tabular-nums">{formatNumber(top3[2].prize)} USDT</p>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

    </div>
  );
};

export default LandingHeaderWinners;

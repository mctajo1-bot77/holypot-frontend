import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/Holypot-logo.webp";
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
      const hour = new Date().getUTCHours();
      const index = hour % 3;
      setCurrentLevel(levels[index]);
    };

    updateLevel();
    const interval = setInterval(updateLevel, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const winnersRes = await axios.get(`${API_BASE}/last-winners`);
        setWinners(winnersRes.data || { basic: [], medium: [], premium: [] });

        const totalRes = await axios.get(`${API_BASE}/total-prizes-paid`);
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
    <div className="relative w-full max-w-7xl mx-auto px-2 md:px-6">
      {/* Login button */}
      <Button
        asChild
        className="absolute top-2 right-2 md:top-4 md:right-6 text-xs md:text-sm py-1.5 md:py-2 px-4 md:px-6 bg-gradient-to-r from-holy to-purple-600 text-black font-bold rounded-full shadow-lg hover:scale-105 transition duration-300 z-10"
      >
        <Link to="/login">{t('nav.login')}</Link>
      </Button>

      {/* Desktop: horizontal layout */}
      <div className="hidden md:flex items-center justify-between">
        {/* IZQUIERDA: LOGO + TEXTO */}
        <div className="text-left flex items-center gap-8">
          <div className="relative">
            <img
              src={logo}
              alt="Holypot Logo"
              className="h-32 w-32 object-contain drop-shadow-2xl animate-float"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div className="absolute -inset-8 rounded-full bg-holy/20 blur-3xl animate-pulse-slow-halo" />
          </div>

          <div>
            <h1 className="text-5xl font-bold text-holy">Holypot Trading</h1>
            <p className="text-xl text-gray-300 max-w-md">
              {t('landing.tagline')}
            </p>
          </div>
        </div>

        {/* CENTRO: TOP3 ROTATIVO */}
        <div className="flex flex-col items-center">
          <p className="text-lg text-gray-400 mb-4">{t('landing.winnersTitle')} {levelNames[currentLevel]} {t('landing.winnersRotate')}</p>
          {top3.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="w-20 h-20 mx-auto text-gray-600 mb-4" />
              <p className="text-2xl text-gray-400">{t('landing.noWinners')}</p>
              <p className="text-lg text-gray-500 mt-2">{t('landing.beFirst')}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              {top3[0] && (
                <Card className="bg-cardDark border border-borderSubtle shadow-md hover:shadow-xl transition p-5 w-72">
                  <Trophy className="w-14 h-14 mx-auto text-yellow-500 mb-2" />
                  <p className="text-center font-bold text-xl">1er {top3[0].nickname}</p>
                  <p className="text-center text-sm text-gray-400">{t('landing.prizePool')}: {formatNumber(top3[0].prize)} USDT</p>
                </Card>
              )}
              <div className="flex gap-6">
                {top3[1] && (
                  <Card className="bg-cardDark border border-borderSubtle shadow-md hover:shadow-xl transition p-4 w-56">
                    <p className="text-center font-bold text-lg">2do {top3[1].nickname}</p>
                    <p className="text-center text-sm text-gray-400">{formatNumber(top3[1].prize)} USDT</p>
                  </Card>
                )}
                {top3[2] && (
                  <Card className="bg-cardDark border border-borderSubtle shadow-md hover:shadow-xl transition p-4 w-56">
                    <p className="text-center font-bold text-lg">3er {top3[2].nickname}</p>
                    <p className="text-center text-sm text-gray-400">{formatNumber(top3[2].prize)} USDT</p>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>

        {/* DERECHA: TOTAL PREMIOS */}
        <div className="text-right">
          <p className="text-xl text-gray-400">{t('landing.totalPaid')}</p>
          <p className="text-5xl font-bold text-holy">
            {formatNumber(totalPaid)} USDT
          </p>
        </div>
      </div>

      {/* Mobile: vertical stacked layout */}
      <div className="md:hidden flex flex-col items-center gap-4 pt-8">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={logo}
              alt="Holypot Logo"
              className="h-16 w-16 object-contain drop-shadow-2xl animate-float"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-holy">Holypot Trading</h1>
            <p className="text-xs text-gray-300">{t('landing.tagline')}</p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-400">{t('landing.totalPaid')}</p>
          <p className="text-2xl font-bold text-holy">{formatNumber(totalPaid)} USDT</p>
        </div>

        {top3.length === 0 ? (
          <div className="text-center py-2">
            <Trophy className="w-10 h-10 mx-auto text-gray-600 mb-2" />
            <p className="text-sm text-gray-400">{t('landing.noWinners')}</p>
          </div>
        ) : (
          <div className="flex gap-2 flex-wrap justify-center">
            {top3.slice(0, 3).map((w, i) => (
              <Card key={i} className="bg-cardDark border border-borderSubtle shadow-md p-2 w-28 text-center">
                <p className="text-xs font-bold">#{i + 1} {w.nickname}</p>
                <p className="text-xs text-gray-400">{formatNumber(w.prize)} USDT</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingHeaderWinners;

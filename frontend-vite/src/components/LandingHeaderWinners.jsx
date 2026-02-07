import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from "@/components/ui/card";           // ← Card solo
import { Button } from "@/components/ui/button";         // ← Button separado
import { Trophy } from "lucide-react";
import { Link } from "react-router-dom";                 // ← Para navegación
import logo from "@/assets/Holypot-logo.webp";

const API_BASE = 'http://localhost:5000/api';

const LandingHeaderWinners = () => {
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
    <div className="relative flex items-center justify-between w-full max-w-7xl mx-auto px-6">
      {/* BOTÓN INICIAR SESIÓN - pequeño, arriba derecha */}
      <Button
        asChild
        className="absolute top-4 right-6 text-sm py-2 px-6 bg-gradient-to-r from-holy to-purple-600 text-black font-bold rounded-full shadow-lg hover:scale-105 transition duration-300 z-10"
      >
        <Link to="/login">Iniciar Sesión</Link>
      </Button>

      {/* IZQUIERDA: LOGO + TEXTO */}
      <div className="text-left flex items-center gap-8">
        <div className="relative">
          <img 
            src={logo} 
            alt="Holypot Logo" 
            className="h-32 w-32 object-contain drop-shadow-2xl animate-float"
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/128/0A0A0A/FFFFFF?text=Holypot";
            }}
          />
          <div className="absolute -inset-8 rounded-full bg-holy/20 blur-3xl animate-pulse-slow-halo" />
        </div>

        <div>
          <h1 className="text-5xl font-bold text-holy">Holypot Trading</h1>
          <p className="text-xl text-gray-300 max-w-md">
            Compite por premios diarios • Bajo riesgo • Ganancias rápidas el mismo día 🚀
          </p>
        </div>
      </div>

      {/* CENTRO: TOP3 ROTATIVO */}
      <div className="flex flex-col items-center">
        <p className="text-lg text-gray-400 mb-4">Ganadores {levelNames[currentLevel]} (cambia cada hora)</p>
        {top3.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="w-20 h-20 mx-auto text-gray-600 mb-4" />
            <p className="text-2xl text-gray-400">Próximamente los primeros ganadores reales 🔥</p>
            <p className="text-lg text-gray-500 mt-2">¡Sé el primero en aparecer aquí!</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            {top3[0] && (
              <Card className="bg-cardDark border border-borderSubtle shadow-md hover:shadow-xl transition p-5 w-72">
                <Trophy className="w-14 h-14 mx-auto text-yellow-500 mb-2" />
                <p className="text-center font-bold text-xl">1er 🥇 {top3[0].nickname}</p>
                <p className="text-center text-sm text-gray-400">Premio: {formatNumber(top3[0].prize)} USDT</p>
              </Card>
            )}
            <div className="flex gap-6">
              {top3[1] && (
                <Card className="bg-cardDark border border-borderSubtle shadow-md hover:shadow-xl transition p-4 w-56">
                  <p className="text-center font-bold text-lg">2do 🥈 {top3[1].nickname}</p>
                  <p className="text-center text-sm text-gray-400">Premio: {formatNumber(top3[1].prize)} USDT</p>
                </Card>
              )}
              {top3[2] && (
                <Card className="bg-cardDark border border-borderSubtle shadow-md hover:shadow-xl transition p-4 w-56">
                  <p className="text-center font-bold text-lg">3er 🥉 {top3[2].nickname}</p>
                  <p className="text-center text-sm text-gray-400">Premio: {formatNumber(top3[2].prize)} USDT</p>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {/* DERECHA: TOTAL PREMIOS */}
      <div className="text-right">
        <p className="text-xl text-gray-400">Total premios pagados</p>
        <p className="text-5xl font-bold text-holy">
          {formatNumber(totalPaid)} USDT
        </p>
      </div>
    </div>
  );
};

export default LandingHeaderWinners;

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Crown, PartyPopper } from "lucide-react";
import Confetti from 'react-confetti';
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : 'http://localhost:5000/api';

// Sonidos
const soundClose = new Audio('https://freesound.org/data/previews/276/276950_5123856-lq.mp3'); // fanfare cierre
const soundWin = new Audio('https://freesound.org/data/previews/269/269026_5123856-lq.mp3'); // cha-ching ganador

const CompetitionEndModal = ({ open, onOpenChange, userPosition, userPrize, userReturn, top3MyLevel }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(userPrize?.status || 'pendiente');
  const isWinner = userPosition <= 3 && userPrize > 0;

  // Efecto y sonido cada vez que se abre (cierre competencia)
  useEffect(() => {
    if (open) {
      soundClose.play().catch(() => {});
      if (isWinner) {
        setShowConfetti(true);
        soundWin.play().catch(() => {});
        setTimeout(() => setShowConfetti(false), 10000); // 10s confetti
      }
    }
  }, [open, isWinner]);

  // Poll estado pago si ganador
  useEffect(() => {
    if (!open || !isWinner) return;

    const pollPayment = async () => {
      try {
        const res = await axios.get(`${API_BASE}/my-payouts`);
        const latest = res.data[0];
        if (latest && latest.status !== paymentStatus) {
          setPaymentStatus(latest.status);
        }
      } catch (err) {
        console.error('Error polling payout', err);
      }
    };

    const interval = setInterval(pollPayment, 10000);
    return () => clearInterval(interval);
  }, [open, isWinner, paymentStatus]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={500} />}
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto bg-black/95 backdrop-blur-2xl border border-holy/50 text-white">
        <DialogHeader className="text-center pb-8">
          <DialogTitle className="text-5xl font-bold text-holy animate-pulse">
            ¡Competencia cerrada! 🏆
          </DialogTitle>
          {isWinner && (
            <div className="mt-6">
              <PartyPopper className="w-24 h-24 mx-auto text-holy animate-bounce" />
              <p className="text-4xl font-bold text-profit mt-4">
                ¡GANASTE {userPrize?.toFixed(2) || 0} USDT!
              </p>
              <Badge className="text-2xl px-6 py-3 mt-4 bg-profit text-black">
                Estado pago: {paymentStatus === 'confirmed' ? 'Confirmado ✅' : paymentStatus === 'sent' ? 'Enviado ⏳' : 'Pendiente ⏳'}
              </Badge>
            </div>
          )}
          <p className="text-3xl mt-6">
            Tu posición: #{userPosition || 'Calculando'} ({userReturn >= 0 ? '+' : ''}{userReturn}%)
          </p>
        </DialogHeader>

        {/* Top 3 mi nivel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {top3MyLevel.map((winner, i) => (
            <div key={i} className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-holy/30 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition" />
              <div className="relative bg-black/60 backdrop-blur-xl border border-holy/40 rounded-3xl p-8 text-center hover:scale-105 transition-all">
                <Crown className={`w-16 h-16 mx-auto mb-4 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : 'text-orange-600'}`} />
                <p className="text-4xl font-bold text-holy">#{i + 1}</p>
                <p className="text-2xl mt-4">{winner.nickname || 'Anónimo'}</p>
                <p className={`text-3xl font-bold mt-4 ${winner.return >= 0 ? 'text-profit' : 'text-red-500'}`}>
                  {winner.return >= 0 ? '+' : ''}{winner.return}%
                </p>
                {i === 0 && <Trophy className="w-12 h-12 mx-auto mt-4 text-yellow-400 animate-pulse" />}
              </div>
            </div>
          ))}
        </div>

        {/* Botones */}
        <div className="flex flex-col md:flex-row gap-6 justify-center mb-8">
          <Button className="text-2xl py-8 px-12 bg-gradient-to-r from-holy to-purple-600">
            Ver ranking completo de mi nivel
          </Button>
          <Button variant="outline" className="text-2xl py-8 px-12 border-holy/50 hover:bg-holy/20">
            Ver ganadores otras competencias
          </Button>
        </div>

        <Button 
          onClick={onOpenChange} 
          className="w-full text-2xl py-8 bg-gradient-to-r from-profit to-green-600"
        >
          ¡Seguir compitiendo mañana! 🚀
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default CompetitionEndModal;

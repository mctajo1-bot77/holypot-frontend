import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import axios from "axios";

const API_BASE = 'http://localhost:5000/api';

const soundWin = new Audio('https://freesound.org/data/previews/269/269026_5123856-lq.mp3'); // cha-ching

const CompetitionEndModal = ({ open, onOpenChange, userPosition, userPrize, competitionLevel }) => {
  const [paymentStatus, setPaymentStatus] = useState('pendiente');
  const isConfirmed = paymentStatus === 'confirmed';

  // Sonido al abrir (solo ganador)
  useEffect(() => {
    if (open) {
      soundWin.currentTime = 0;
      soundWin.play().catch(() => {});
    }
  }, [open]);

  // Poll estado pago cada 10 segundos
  useEffect(() => {
    if (!open) return;

    const pollPayment = async () => {
      try {
        const res = await axios.get(`${API_BASE}/my-payouts`);
        const latest = res.data.find(p => p.level === competitionLevel && p.position === userPosition);
        if (latest && latest.status) {
          setPaymentStatus(latest.status);
        }
      } catch (err) {
        console.error('Error polling payout', err);
      }
    };

    pollPayment();
    const interval = setInterval(pollPayment, 10000);
    return () => clearInterval(interval);
  }, [open, competitionLevel, userPosition]);

  return (
    <Dialog open={open} onOpenChange={isConfirmed ? onOpenChange : undefined}>
      <DialogContent className="max-w-md bg-black/95 backdrop-blur-2xl border border-holy/50 text-white">
        <DialogHeader className="text-center pb-8">
          <DialogTitle className="text-4xl font-bold text-holy animate-pulse">
            ¡FELICIDADES, GANASTE! 🏆
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 text-center">
          <p className="text-2xl font-bold text-profit">
            Posición #{userPosition} en {competitionLevel.toUpperCase()}
          </p>
          <p className="text-3xl font-bold text-profit">
            Premio: {userPrize.toFixed(2)} USDT
          </p>

          <div className="mt-8">
            <Badge className="text-2xl px-8 py-4" variant={isConfirmed ? "default" : "secondary"}>
              Estado pago: {isConfirmed ? 'Confirmado ✅' : paymentStatus === 'sent' ? 'Enviado ⏳' : 'Pendiente ⏳'}
            </Badge>
          </div>

          <p className="text-lg text-gray-300 mt-6">
            {isConfirmed 
              ? '¡El USDT ya está en tu wallet! Puedes cerrar esta ventana.' 
              : 'Espera a que el pago se confirme para cerrar.'
            }
          </p>

          <Button 
            onClick={onOpenChange} 
            disabled={!isConfirmed}
            className="w-full text-xl py-6 bg-gradient-to-r from-holy to-purple-600 disabled:opacity-50"
          >
            {isConfirmed ? 'Cerrar y seguir compitiendo 🚀' : 'Esperando confirmación...'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompetitionEndModal;
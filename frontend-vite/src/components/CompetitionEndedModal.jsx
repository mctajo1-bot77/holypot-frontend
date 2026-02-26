import React, { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";

// medalPosition: 1 → 🥇  2 → 🥈  3 → 🥉
const medal = (pos) => ['🥇', '🥈', '🥉'][pos - 1] || `${pos}º`;

const CompetitionEndedModal = ({ open, onClose, results, userEntryId, userLevel, myAdvice }) => {
  const [generating, setGenerating] = useState(false);

  if (!results || !userLevel) return null;

  const levelData = results[userLevel];
  if (!levelData) return null;

  // Posición del usuario en el ranking de su nivel
  const myRank = levelData.rollover
    ? null
    : levelData.ranking?.findIndex(r => r.entryId === userEntryId) + 1 || null;

  const myWin = !levelData.rollover && myRank >= 1 && myRank <= 3
    ? levelData.top3?.[myRank - 1]
    : null;

  const isRollover = levelData.rollover;

  const downloadCertificate = async () => {
    setGenerating(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 900;
      canvas.height = 520;
      const ctx = canvas.getContext('2d');

      // Background
      const bg = ctx.createLinearGradient(0, 0, 900, 520);
      bg.addColorStop(0, '#050a18');
      bg.addColorStop(1, '#0c1428');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 900, 520);

      // Gold outer border
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 3;
      ctx.strokeRect(12, 12, 876, 496);
      // Inner thin border
      ctx.strokeStyle = 'rgba(212,175,55,0.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(22, 22, 856, 476);

      // Corner decorations
      [{ x: 30, y: 30 }, { x: 870, y: 30 }, { x: 30, y: 490 }, { x: 870, y: 490 }].forEach(({ x, y }) => {
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const dx = x < 450 ? 1 : -1;
        const dy = y < 260 ? 1 : -1;
        ctx.moveTo(x, y + dy * 18); ctx.lineTo(x, y); ctx.lineTo(x + dx * 18, y);
        ctx.stroke();
      });

      // HOLYPOT title
      ctx.fillStyle = '#D4AF37';
      ctx.font = 'bold 44px serif';
      ctx.textAlign = 'center';
      ctx.fillText('HOLYPOT', 450, 80);
      ctx.fillStyle = 'rgba(212,175,55,0.5)';
      ctx.font = '13px sans-serif';
      ctx.fillText('TRADING COMPETITION CERTIFICATE', 450, 106);

      // Divider
      const grad1 = ctx.createLinearGradient(80, 0, 820, 0);
      grad1.addColorStop(0, 'transparent');
      grad1.addColorStop(0.5, 'rgba(212,175,55,0.4)');
      grad1.addColorStop(1, 'transparent');
      ctx.strokeStyle = grad1;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(80, 122); ctx.lineTo(820, 122); ctx.stroke();

      // Position
      const posLabel = myRank === 1 ? '1er LUGAR' : myRank === 2 ? '2do LUGAR' : '3er LUGAR';
      const posColor = myRank === 1 ? '#FFD700' : myRank === 2 ? '#C0C0C0' : '#CD7F32';
      ctx.fillStyle = posColor;
      ctx.font = 'bold 54px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(posLabel, 450, 195);

      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '12px sans-serif';
      ctx.fillText('GANADOR', 450, 220);

      // Nickname
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(myWin?.nickname || 'Trader', 450, 272);

      // Stats
      const statsY1 = 320, statsY2 = 358;
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = '11px sans-serif';
      ctx.fillText('RETORNO', 240, statsY1);
      ctx.fillText('PREMIO', 450, statsY1);
      ctx.fillText('NIVEL', 660, statsY1);

      const retorno = myWin?.retorno ?? 0;
      ctx.fillStyle = retorno >= 0 ? '#00C853' : '#f87171';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText(`${retorno >= 0 ? '+' : ''}${retorno}%`, 240, statsY2);

      ctx.fillStyle = '#D4AF37';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText(`$${(myWin?.prize ?? 0).toFixed(2)} USDT`, 450, statsY2);

      ctx.fillStyle = '#60A5FA';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText((userLevel || 'BASIC').toUpperCase(), 660, statsY2);

      // Date
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = '12px sans-serif';
      ctx.fillText(new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }), 450, 398);

      // Bottom divider
      const grad2 = ctx.createLinearGradient(80, 0, 820, 0);
      grad2.addColorStop(0, 'transparent');
      grad2.addColorStop(0.5, 'rgba(212,175,55,0.2)');
      grad2.addColorStop(1, 'transparent');
      ctx.strokeStyle = grad2;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(80, 415); ctx.lineTo(820, 415); ctx.stroke();

      // URL text
      const platformUrl = window.location.origin;
      ctx.fillStyle = 'rgba(212,175,55,0.6)';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${platformUrl} · Únete y compite`, 40, 460);
      ctx.textAlign = 'center';

      // Try loading QR code
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=88x88&data=${encodeURIComponent(platformUrl)}&bgcolor=050a18&color=D4AF37&margin=2`;
      await new Promise((resolve) => {
        const qrImg = new Image();
        qrImg.crossOrigin = 'anonymous';
        qrImg.onload = () => { ctx.drawImage(qrImg, 798, 418, 88, 88); resolve(); };
        qrImg.onerror = () => resolve();
        setTimeout(resolve, 5000);
        qrImg.src = qrUrl;
      });

      // Download
      const link = document.createElement('a');
      link.download = `holypot-winner-${myRank}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Certificate error:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-[#060606] border border-holy/30 text-white p-0 rounded-2xl overflow-hidden">

        {/* Header */}
        <div className={`px-6 py-5 text-center ${myWin ? 'bg-gradient-to-b from-holy/20 to-transparent' : 'bg-gradient-to-b from-white/5 to-transparent'}`}>
          <p className="text-4xl mb-2">
            {isRollover ? '🔄' : myWin ? '🏆' : '🏁'}
          </p>
          <h2 className="text-xl font-bold text-white">
            {isRollover
              ? 'Competición sin suficientes participantes'
              : myWin
                ? `¡Felicitaciones, quedaste ${medal(myRank)}!`
                : 'La competición del día ha terminado'}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {isRollover
              ? 'Se activa el repechaje gratuito para mañana'
              : 'Las operaciones están bloqueadas hasta las 00:00 UTC'}
          </p>
        </div>

        <div className="px-6 pb-6 space-y-5">

          {/* Resultado personal */}
          {!isRollover && myRank && (
            <div className={`rounded-xl p-4 text-center border ${
              myWin
                ? 'bg-holy/10 border-holy/40'
                : 'bg-white/5 border-white/10'
            }`}>
              {myWin ? (
                <>
                  <p className="text-3xl font-bold text-holy">{medal(myRank)} {myRank === 1 ? '1er' : myRank === 2 ? '2do' : '3er'} lugar</p>
                  <p className="text-2xl font-bold text-profit mt-1">+ ${myWin.prize?.toFixed(2)} USDT</p>
                  <p className="text-xs text-gray-400 mt-1">Retorno: {myWin.retorno >= 0 ? '+' : ''}{myWin.retorno}% · El pago se enviará a las 02:00 UTC</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-semibold text-gray-300">Terminaste en <span className="text-white font-bold">{myRank}º lugar</span></p>
                  {levelData.ranking?.[myRank - 1] && (
                    <p className="text-sm text-gray-500 mt-1">
                      Retorno: {levelData.ranking[myRank - 1].retorno >= 0 ? '+' : ''}{levelData.ranking[myRank - 1].retorno}%
                    </p>
                  )}
                  <p className="text-xs text-gray-600 mt-2">¡Sigue entrenando — el próximo ciclo empieza a las 00:00 UTC!</p>
                </>
              )}
            </div>
          )}

          {/* Top 3 ganadores */}
          {!isRollover && levelData.top3?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                Ganadores — Nivel {userLevel.charAt(0).toUpperCase() + userLevel.slice(1)} · Pozo: ${levelData.prizePool?.toFixed(2)} USDT
              </p>
              <div className="space-y-2">
                {levelData.top3.map((t) => (
                  <div
                    key={t.entryId}
                    className={`flex items-center justify-between rounded-lg px-4 py-2.5 ${
                      t.entryId === userEntryId
                        ? 'bg-holy/15 border border-holy/40'
                        : 'bg-white/5 border border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{medal(t.position)}</span>
                      <span className="font-semibold text-sm">{t.nickname}</span>
                      {t.entryId === userEntryId && (
                        <span className="text-[10px] bg-holy/30 text-holy px-1.5 py-0.5 rounded font-bold">TÚ</span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-profit">+${t.prize?.toFixed(2)}</p>
                      <p className="text-[10px] text-gray-500">{t.retorno >= 0 ? '+' : ''}{t.retorno}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rollover message */}
          {isRollover && (
            <div className="rounded-xl bg-blue-500/10 border border-blue-500/30 px-4 py-3 text-center">
              <p className="text-sm text-blue-300">
                Menos de 5 participantes en nivel <strong>{userLevel}</strong>.<br />
                Tu inscripción se renueva gratis para mañana — no necesitas volver a pagar.
              </p>
            </div>
          )}

          {/* Consejos IA */}
          <div className="rounded-xl bg-purple-900/20 border border-purple-500/30 px-4 py-3 space-y-2">
            <p className="text-xs text-purple-300 font-bold flex items-center gap-1.5">
              💡 Consejos de tu IA
              {!myAdvice && <span className="text-[10px] text-gray-500 font-normal animate-pulse">generando...</span>}
            </p>
            {myAdvice ? (
              myAdvice.split('\n').filter(l => l.trim()).map((line, i) => (
                <p key={i} className="text-sm text-gray-300 leading-snug">{line}</p>
              ))
            ) : (
              <p className="text-xs text-gray-600">Los consejos llegarán en unos segundos al terminar el análisis de tu sesión.</p>
            )}
          </div>

          {/* Certificado ganador */}
          {myWin && (
            <button
              onClick={downloadCertificate}
              disabled={generating}
              className="w-full bg-gradient-to-r from-[#D4AF37]/90 to-yellow-600/90 hover:from-[#D4AF37] hover:to-yellow-500 text-black font-bold py-3 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Generando certificado...
                </>
              ) : (
                '🏆 Descargar certificado · Compartir en redes'
              )}
            </button>
          )}

          {/* CTA */}
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-holy/80 to-purple-600/80 hover:from-holy hover:to-purple-600 text-black font-bold py-3 rounded-xl transition"
          >
            Entendido
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompetitionEndedModal;

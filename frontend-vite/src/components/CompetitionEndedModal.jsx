import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";

// medalPosition: 1 → 🥇  2 → 🥈  3 → 🥉
const medal = (pos) => ['🥇', '🥈', '🥉'][pos - 1] || `${pos}º`;

const CompetitionEndedModal = ({ open, onClose, results, userEntryId, userLevel }) => {
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

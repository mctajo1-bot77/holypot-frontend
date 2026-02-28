import React from 'react';
import { Trophy, TrendingUp } from 'lucide-react';

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

// position: 1 | 2 | 3
const PODIUM_CONFIG = {
  1: {
    height: 'h-32 md:h-40',
    bg: 'bg-gradient-to-b from-[#FFD700]/20 to-[#D4AF37]/5',
    border: 'border-[#FFD700]/50',
    label: 'text-[#FFD700]',
    medal: '🥇',
    order: 'order-2',
    avatar: 'w-16 h-16 md:w-20 md:h-20 border-[#FFD700]',
    nameColor: 'text-white',
    prizeColor: 'text-[#FFD700]',
    glow: 'shadow-[0_0_30px_rgba(212,175,55,0.25)]',
    podiumNum: '1',
    podiumBg: 'bg-[#D4AF37]',
  },
  2: {
    height: 'h-24 md:h-32',
    bg: 'bg-gradient-to-b from-gray-400/10 to-gray-600/5',
    border: 'border-gray-400/30',
    label: 'text-gray-300',
    medal: '🥈',
    order: 'order-1',
    avatar: 'w-14 h-14 md:w-16 md:h-16 border-gray-400',
    nameColor: 'text-gray-200',
    prizeColor: 'text-gray-300',
    glow: '',
    podiumNum: '2',
    podiumBg: 'bg-gray-500',
  },
  3: {
    height: 'h-20 md:h-28',
    bg: 'bg-gradient-to-b from-orange-800/10 to-orange-900/5',
    border: 'border-orange-600/30',
    label: 'text-orange-400',
    medal: '🥉',
    order: 'order-3',
    avatar: 'w-12 h-12 md:w-14 md:h-14 border-orange-600',
    nameColor: 'text-gray-300',
    prizeColor: 'text-orange-400',
    glow: '',
    podiumNum: '3',
    podiumBg: 'bg-orange-800',
  },
};

function PodiumCard({ trader, position, levelColor }) {
  const cfg = PODIUM_CONFIG[position];
  if (!trader) return null;

  const flag = COUNTRY_FLAGS[trader.country] || '';
  const prizeAmt = typeof trader.prize === 'number' ? trader.prize.toFixed(2) : '0.00';
  const retorno = typeof trader.retorno === 'number'
    ? `${trader.retorno >= 0 ? '+' : ''}${trader.retorno.toFixed(2)}%`
    : null;

  return (
    <div className={`flex flex-col items-center ${cfg.order}`}>
      {/* Avatar / medal */}
      <div className="relative mb-2 md:mb-3">
        <div className={`${cfg.avatar} rounded-full border-2 flex items-center justify-center bg-[#0F172A] text-3xl md:text-4xl select-none`}>
          {flag || <Trophy className="w-6 h-6 text-gray-500" />}
        </div>
        <span className="absolute -bottom-1 -right-1 text-lg leading-none">{cfg.medal}</span>
      </div>

      {/* Name + return */}
      <p className={`font-bold text-sm md:text-base text-center truncate max-w-[100px] md:max-w-[130px] ${cfg.nameColor}`}>
        {trader.nickname || 'Anónimo'}
      </p>
      {retorno && (
        <div className="flex items-center gap-1 mt-0.5">
          <TrendingUp className={`w-3 h-3 ${trader.retorno >= 0 ? 'text-[#00C853]' : 'text-red-400'}`} />
          <span className={`text-xs font-semibold tabular-nums ${trader.retorno >= 0 ? 'text-[#00C853]' : 'text-red-400'}`}>
            {retorno}
          </span>
        </div>
      )}
      {parseFloat(prizeAmt) > 0 && (
        <p className={`text-xs md:text-sm font-extrabold tabular-nums mt-0.5 ${cfg.prizeColor}`}>
          +{prizeAmt} USDT
        </p>
      )}

      {/* Podium block */}
      <div className={`w-20 md:w-28 ${cfg.height} mt-3 rounded-t-xl ${cfg.bg} border ${cfg.border} ${cfg.glow} flex items-center justify-center`}>
        <span className={`text-2xl md:text-3xl font-extrabold opacity-30 ${cfg.label}`}>{cfg.podiumNum}</span>
      </div>
    </div>
  );
}

/**
 * TopWinnersPyramid
 * Props:
 *   top3: array of { nickname, country?, prize, retorno, position }
 *   level: 'basic' | 'medium' | 'premium'
 *   date?: string  – competition date label
 *   prizePool?: number
 */
export default function TopWinnersPyramid({ top3 = [], level = 'basic', date, prizePool }) {
  const levelColors = {
    basic:   { text: 'text-[#00C853]', border: 'border-[#00C853]/25', badge: 'bg-[#00C853]/10 text-[#00C853]' },
    medium:  { text: 'text-blue-400',  border: 'border-blue-500/25',  badge: 'bg-blue-500/10 text-blue-400'  },
    premium: { text: 'text-[#D4AF37]', border: 'border-[#D4AF37]/25', badge: 'bg-[#D4AF37]/10 text-[#D4AF37]'},
  };
  const lc = levelColors[level] || levelColors.basic;

  const byPosition = {};
  top3.forEach(t => { byPosition[t.position] = t; });

  const isEmpty = top3.length === 0;

  return (
    <div className={`relative rounded-2xl border ${lc.border} bg-[#0F172A]/60 backdrop-blur-xl p-5 md:p-8 overflow-hidden`}>
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Trophy className={`w-5 h-5 ${lc.text}`} />
          <span className={`font-bold text-sm uppercase tracking-wider ${lc.text}`}>
            Top 3 – {level.charAt(0).toUpperCase() + level.slice(1)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {prizePool > 0 && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${lc.badge}`}>
              Pool: {prizePool.toFixed(2)} USDT
            </span>
          )}
          {date && <span className="text-xs text-gray-500">{date}</span>}
        </div>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <Trophy className="w-10 h-10 text-gray-700" />
          <p className="text-gray-500 text-sm text-center">
            Aún no hay resultados para esta categoría.<br />
            <span className="text-gray-600 text-xs">¡Compite hoy y aparece aquí!</span>
          </p>
        </div>
      ) : (
        <div className="flex items-end justify-center gap-4 md:gap-8">
          <PodiumCard trader={byPosition[2]} position={2} levelColor={lc} />
          <PodiumCard trader={byPosition[1]} position={1} levelColor={lc} />
          <PodiumCard trader={byPosition[3]} position={3} levelColor={lc} />
        </div>
      )}
    </div>
  );
}

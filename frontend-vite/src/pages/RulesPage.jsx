import React from 'react';
import background from "@/assets/background.jpg";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { useI18n, LanguageToggle } from '@/i18n';

const RulesPage = () => {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* Fondo */}
      <div className="fixed inset-0 -z-10">
        <img src={background} alt="Fondo" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Language Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageToggle />
      </div>

      {/* Contenido principal */}
      <div className="max-w-4xl mx-auto px-8 py-32">
        <h1 className="text-5xl font-bold text-holy text-center mb-8">
          {t('rules.title')}
        </h1>
        <p className="text-xl text-center text-gray-300 mb-12">
          {t('rules.lastUpdate')}
        </p>

        <p className="text-lg leading-relaxed mb-16 text-gray-200">
          {t('rules.platformDesc')}
        </p>

        <ol className="space-y-12 text-lg text-gray-200 list-decimal pl-8 marker:text-holy marker:font-bold">
          <li>
            <h3 className="text-2xl text-holy mb-4">1. {t('rules.type')}</h3>
            <p>{t('rules.typeDesc')}</p>
          </li>

          <li>
            <h3 className="text-2xl text-holy mb-4">2. {t('rules.levels')}</h3>
            <p>{t('rules.levelsIntro')}</p>
            <ul className="list-disc pl-10 mt-4 space-y-3 text-gray-300">
              <li>
                <strong>Basic</strong>: {t('landing.entry')} 12 USDT, {t('landing.virtualCapital')} 10.000 USDT.
              </li>
              <li>
                <strong>Medium</strong>: {t('landing.entry')} 54 USDT, {t('landing.virtualCapital')} 50.000 USDT.
              </li>
              <li>
                <strong>Premium</strong>: {t('landing.entry')} 107 USDT, {t('landing.virtualCapital')} 100.000 USDT.
              </li>
            </ul>
            <p className="mt-4">{t('rules.levelsFooter')}</p>
          </li>

          <li>
            <h3 className="text-2xl text-holy mb-4">3. {t('rules.schedule')}</h3>
            <ul className="list-disc pl-10 mt-4 space-y-3 text-gray-300">
              <li>{t('rules.schedule_open')}</li>
              <li>{t('rules.schedule_min')}</li>
              <li>{t('rules.schedule_last')}</li>
              <li>{t('rules.schedule_close')}</li>
              <li>{t('rules.schedule_rollover')}</li>
            </ul>
          </li>

          <li>
            <h3 className="text-2xl text-holy mb-4">4. {t('rules.payment')}</h3>
            <p>{t('rules.paymentDesc')}</p>
          </li>

          <li>
            <h3 className="text-2xl text-holy mb-4">5. {t('rules.distribution')}</h3>
            <p>{t('rules.distributionFormula')}</p>
            <p className="mt-3">{t('rules.distributionStandard')}</p>
            <ul className="list-disc pl-10 mt-3 space-y-2 text-gray-300">
              <li>1er lugar / 1st place: 50%</li>
              <li>2do lugar / 2nd place: 30%</li>
              <li>3er lugar / 3rd place: 20%</li>
            </ul>
          </li>

          <li>
            <h3 className="text-2xl text-holy mb-4">6. {t('rules.tradingRules')}</h3>
            <ul className="list-disc pl-10 mt-4 space-y-3 text-gray-300">
              <li>{t('rules.trading_data')}</li>
              <li>{t('rules.trading_longshort')}</li>
              <li>{t('rules.trading_tpsl')}</li>
              <li>{t('rules.trading_lotsize')}</li>
              <li>{t('rules.trading_minclosed')}</li>
              <li className="text-red-400 font-semibold">{t('rules.trading_drawdown')}</li>
            </ul>
          </li>

          <li>
            <h3 className="text-2xl text-holy mb-4">7. {t('rules.calcReturn')}</h3>
            <p>{t('rules.calcFormula')}</p>
          </li>

          <li>
            <h3 className="text-2xl text-holy mb-4">8. {t('rules.tiebreak')}</h3>
            <p>{t('rules.tiebreakIntro')}</p>
            <ol className="list-decimal pl-10 mt-4 space-y-3 text-gray-300">
              <li>{t('rules.tiebreak1')}</li>
              <li>{t('rules.tiebreak2')}</li>
              <li>{t('rules.tiebreak3')}</li>
              <li>{t('rules.tiebreak4')}</li>
            </ol>
          </li>

          <li>
            <h3 className="text-2xl text-holy mb-4">9. {t('rules.prizePayout')}</h3>
            <p>{t('rules.prizePayoutDesc')}</p>
          </li>

          <li>
            <h3 className="text-2xl text-holy mb-4">10. {t('rules.prohibited')}</h3>
            <p>{t('rules.prohibitedDesc')}</p>
          </li>
        </ol>

        <p className="mt-16 text-center text-gray-400 italic">
          {t('rules.disclaimer')}
        </p>

        {/* BOTÓN VOLVER AL INICIO */}
        <div className="text-center mt-20">
          <Button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-holy to-purple-600 text-black text-2xl px-12 py-6 font-bold rounded-full shadow-lg hover:shadow-holy/50 hover:scale-105 transition duration-300"
          >
            {t('rules.backBtn')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RulesPage;

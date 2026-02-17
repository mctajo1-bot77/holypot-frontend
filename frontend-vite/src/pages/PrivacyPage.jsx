import React from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import background from "@/assets/background.jpg";
import { useI18n, LanguageToggle } from '@/i18n';

const PrivacyPage = () => {
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
          {t('privacy.title')}
        </h1>
        <p className="text-xl text-center text-gray-300 mb-12">
          {t('privacy.lastUpdate')}
        </p>

        <div className="space-y-12 text-lg text-gray-200">
          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">{t('privacy.sec1_title')}</h2>
            <ul className="list-disc pl-8 space-y-3">
              <li>{t('privacy.sec1_li1')}</li>
              <li>{t('privacy.sec1_li2')}</li>
              <li>{t('privacy.sec1_li3')}</li>
              <li>{t('privacy.sec1_li4')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">{t('privacy.sec2_title')}</h2>
            <ul className="list-disc pl-8 space-y-3">
              <li>{t('privacy.sec2_li1')}</li>
              <li>{t('privacy.sec2_li2')}</li>
              <li>{t('privacy.sec2_li3')}</li>
              <li>{t('privacy.sec2_li4')}</li>
              <li>{t('privacy.sec2_li5')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">{t('privacy.sec3_title')}</h2>
            <p>{t('privacy.sec3_content')}</p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">{t('privacy.sec4_title')}</h2>
            <p className="mb-4">{t('privacy.sec4_intro')}</p>
            <ul className="list-disc pl-8 space-y-3">
              <li>{t('privacy.sec4_li1')}</li>
              <li>{t('privacy.sec4_li2')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">{t('privacy.sec5_title')}</h2>
            <p>{t('privacy.sec5_content')}</p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">{t('privacy.sec6_title')}</h2>
            <p>{t('privacy.sec6_content')}</p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">{t('privacy.sec7_title')}</h2>
            <p>{t('privacy.sec7_content')}</p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">{t('privacy.sec8_title')}</h2>
            <p>{t('privacy.sec8_content')}</p>
          </section>
        </div>

        {/* BOTÓN VOLVER AL INICIO */}
        <div className="text-center mt-20">
          <Button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-holy to-purple-600 text-black text-2xl px-12 py-6 font-bold rounded-full shadow-lg hover:shadow-holy/50 hover:scale-105 transition duration-300"
          >
            {t('privacy.backBtn')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;

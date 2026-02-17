import React from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import background from "@/assets/background.jpg";
import { useI18n, LanguageToggle } from '@/i18n';

const TermsPage = () => {
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
          {t('terms.title')}
        </h1>
        <p className="text-xl text-center text-gray-300 mb-12">
          {t('terms.lastUpdate')}
        </p>

        <div className="space-y-12 text-lg text-gray-200">
          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">{t('terms.sec1_title')}</h2>
            <p>{t('terms.sec1_content')}</p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">{t('terms.sec2_title')}</h2>
            <ul className="list-disc pl-8 space-y-3">
              <li>{t('terms.sec2_li1')}</li>
              <li>{t('terms.sec2_li2')}</li>
              <li>{t('terms.sec2_li3')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">{t('terms.sec3_title')}</h2>
            <p className="mb-4">{t('terms.sec3_p1')}</p>
            <p className="mb-4">{t('terms.sec3_p2')}</p>
            <p className="mb-4">{t('terms.sec3_p3')}</p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">{t('terms.sec4_title')}</h2>
            <ul className="list-disc pl-8 space-y-3">
              <li>{t('terms.sec4_li1')}</li>
              <li>{t('terms.sec4_li2')}</li>
              <li>{t('terms.sec4_li3')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">{t('terms.sec5_title')}</h2>
            <ul className="list-disc pl-8 space-y-3">
              <li>{t('terms.sec5_li1')}</li>
              <li>{t('terms.sec5_li2')}</li>
              <li>{t('terms.sec5_li3')}</li>
              <li>{t('terms.sec5_li4')}</li>
              <li>{t('terms.sec5_li5')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">{t('terms.sec6_title')}</h2>
            <ul className="list-disc pl-8 space-y-3">
              <li>{t('terms.sec6_li1')}</li>
              <li>{t('terms.sec6_li2')}</li>
              <li>{t('terms.sec6_li3')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">{t('terms.sec7_title')}</h2>
            <p>{t('terms.sec7_content')}</p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">{t('terms.sec8_title')}</h2>
            <p>{t('terms.sec8_content')}</p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">{t('terms.sec9_title')}</h2>
            <p>{t('terms.sec9_content')}</p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">{t('terms.sec10_title')}</h2>
            <p>{t('terms.sec10_content')}</p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">{t('terms.sec11_title')}</h2>
            <p>{t('terms.sec11_content')}</p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">{t('terms.sec12_title')}</h2>
            <p>{t('terms.sec12_content')}</p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">{t('terms.sec13_title')}</h2>
            <p>{t('terms.sec13_content')}</p>
          </section>
        </div>

        {/* BOTÓN VOLVER AL INICIO */}
        <div className="text-center mt-20">
          <Button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-holy to-purple-600 text-black text-2xl px-12 py-6 font-bold rounded-full shadow-lg hover:shadow-holy/50 hover:scale-105 transition duration-300"
          >
            {t('terms.backBtn')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;

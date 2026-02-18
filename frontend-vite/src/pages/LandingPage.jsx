import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import LandingHeaderWinners from '../components/LandingHeaderWinners';
import background from "@/assets/background.jpg";
import { useNavigate } from 'react-router-dom';
import { X } from "lucide-react";
import { useI18n, LanguageToggle } from '@/i18n';

// ✅ API_BASE DINÁMICA – funciona local y producción
const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : 'http://localhost:5000/api';

const HCAPTCHA_SITEKEY = 'a0b26f92-ba34-47aa-be42-c936e488a6f4';

const LandingPage = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [competitions, setCompetitions] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('');
  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '', walletAddress: '',
    fullName: '', country: '', birthDate: '', level: '', acceptTerms: false
  });
  const [nickname, setNickname] = useState('');
  const [captchaToken, setCaptchaToken] = useState(null);
  const captchaRef = useRef(null);
  const [selectedNetwork, setSelectedNetwork] = useState('polygon');

  const NETWORKS = [
    { id: 'polygon',  label: 'Polygon',  fee: '~$0.50', color: 'from-purple-500 to-violet-700', walletHint: '0x... (Polygon)' },
    { id: 'trc20',    label: 'TRC-20',   fee: '~$4.50', color: 'from-red-500 to-red-700',       walletHint: 'T... (Tron)'    },
    { id: 'ethereum', label: 'Ethereum', fee: '~$17.50', color: 'from-blue-500 to-blue-700',    walletHint: '0x... (Ethereum)' }
  ];

  // COUNTDOWN LIVE TICKING (cierre 21:00 UTC)
  const [countdown, setCountdown] = useState('00h 00m 00s');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const utcNow = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
      let closeTime = new Date(utcNow);
      closeTime.setUTCHours(21, 0, 0, 0);

      if (utcNow > closeTime) {
        closeTime.setUTCDate(closeTime.getUTCDate() + 1);
      }

      const diff = closeTime - utcNow;
      const hours = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const minutes = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const seconds = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');

      setCountdown(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        const res = await axios.get(`${API_BASE}/competitions/active`);
        const comps = {};
        res.data.forEach(c => {
          comps[c.level] = c;
        });
        setCompetitions(comps);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchCompetitions();
    const interval = setInterval(fetchCompetitions, 60000);
    return () => clearInterval(interval);
  }, []);

  const openForm = (level) => {
    setSelectedLevel(level);
    setForm({ ...form, level });
    setShowForm(true);
    setCaptchaToken(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return alert('Las contraseñas no coinciden');
    if (!form.level) return alert('Elige un nivel');
    if (!form.walletAddress) return alert('Wallet obligatoria para la red seleccionada');
    if (!nickname) return alert('Nickname obligatorio – será tu nombre visible en el ranking');
    if (!captchaToken) return alert('Completa el CAPTCHA');

    try {
      const res = await axios.post(`${API_BASE}/create-payment`, {
        ...form,
        nickname,
        hCaptchaToken: captchaToken,
        paymentNetwork: selectedNetwork
      });
      localStorage.setItem('holypotToken', res.data.token);
      localStorage.setItem('holypotEntryId', res.data.entryId);
      window.open(res.data.paymentUrl, '_blank');
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
    }
  };

  const formatNumber = (num) => new Intl.NumberFormat('es-ES').format(num || 0);

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* FONDO */}
      <div className="fixed inset-0 -z-10">
        <img
          src={background}
          alt="Fondo Holypot"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* HEADER */}
      <header className="relative bg-primary/65 backdrop-blur-md border-b border-holy/20 shadow-md py-4 md:py-8">
        <div className="max-w-7xl mx-auto px-3 md:px-6">
          <div className="flex justify-end mb-2 md:mb-0 md:absolute md:top-4 md:right-6 z-20">
            <LanguageToggle />
          </div>
          <LandingHeaderWinners />
        </div>
      </header>

      {/* COMPETENCIAS ACTIVAS */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-2 md:mb-4 text-holy">
          {t('landing.title')}
        </h2>
        <p className="text-lg md:text-2xl text-center mb-6 md:mb-12 text-gray-300">
          {t('landing.subtitle')} – {t('landing.timeLeft')}: <span className="text-red-500 font-bold">{countdown}</span>!
        </p>

        {loading ? (
          <p className="text-center text-xl md:text-2xl text-gray-400">{t('landing.loading')}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-12">
            {[
              { key: 'basic', color: 'profit', border: 'profit/40', price: 12, capital: '10.000', btnClass: 'from-profit to-green-600 text-black', btnText: t('landing.signupBasic') },
              { key: 'medium', color: 'blue-500', border: 'blue-500/40', price: 54, capital: '50.000', titleColor: 'text-blue-400', btnClass: 'from-blue-500 to-blue-700 text-white', btnText: t('landing.signupMedium') },
              { key: 'premium', color: 'holy', border: 'holy/50', price: 107, capital: '100.000', btnClass: 'from-holy to-purple-600 text-black', btnText: t('landing.signupPremium') }
            ].map(({ key, color, border, price, capital, titleColor, btnClass, btnText }) => (
              <div key={key} className="relative group">
                <div className={`absolute inset-0 bg-gradient-to-br from-${color}/30 to-transparent rounded-2xl md:rounded-3xl blur-xl group-hover:blur-2xl transition duration-700`} />
                <div className={`relative bg-black/30 backdrop-blur-xl border border-${border} rounded-2xl md:rounded-3xl p-6 md:p-10 text-center shadow-2xl hover:md:scale-105 transition-all duration-500`}>
                  <h3 className={`text-2xl md:text-4xl font-bold ${titleColor || `text-${color}`} mb-4 md:mb-6`}>{key.toUpperCase()}</h3>
                  <p className="text-base md:text-xl text-gray-200 mb-2 md:mb-4">{t('landing.entry')}: ${price} USDT</p>
                  <p className="text-base md:text-xl text-gray-200 mb-2 md:mb-4">{t('landing.virtualCapital')}: {capital} USDT</p>
                  <p className="text-base md:text-xl text-gray-200 mb-2 md:mb-4">{t('landing.participants')}: {competitions[key]?.participants || 0}</p>
                  <p className="text-xl md:text-3xl font-bold text-holy mb-4 md:mb-8">
                    {t('landing.prizePool')}: {formatNumber(competitions[key]?.prizePool || 0)} USDT
                  </p>
                  <Button
                    onClick={() => openForm(key)}
                    className={`w-full bg-gradient-to-r ${btnClass} text-lg md:text-2xl py-4 md:py-6 font-bold rounded-full shadow-lg hover:scale-105 transition duration-300`}
                  >
                    {btnText}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECCIÓN REGLAS */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-holy/20 to-transparent rounded-2xl md:rounded-3xl blur-xl group-hover:blur-2xl transition" />
          <div className="relative bg-black/30 backdrop-blur-xl border border-holy/40 rounded-2xl md:rounded-3xl shadow-2xl p-6 md:p-12 hover:md:scale-105 transition-all duration-500">
            <h2 className="text-2xl md:text-4xl font-bold text-center text-holy mb-6 md:mb-12">
              {t('landing.rules')} – {t('landing.rulesSubtitle')}
            </h2>
            <p className="text-base md:text-xl text-center text-gray-300 mb-6 md:mb-12">
              {t('rules.lastUpdate')}
            </p>

            <p className="text-sm md:text-lg leading-relaxed mb-8 md:mb-16 text-gray-200">
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
                  <li><strong>Basic</strong>: {t('landing.entry')} 12 USDT, {t('landing.virtualCapital')} 10.000 USDT.</li>
                  <li><strong>Medium</strong>: {t('landing.entry')} 54 USDT, {t('landing.virtualCapital')} 50.000 USDT.</li>
                  <li><strong>Premium</strong>: {t('landing.entry')} 107 USDT, {t('landing.virtualCapital')} 100.000 USDT.</li>
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

            {/* BOTÓN VER REGLAS COMPLETAS */}
            <div className="text-center mt-10 md:mt-20">
              <Button
                onClick={() => navigate('/rules')}
                className="bg-gradient-to-r from-holy to-purple-600 text-black text-lg md:text-2xl px-8 md:px-12 py-4 md:py-6 font-bold rounded-full shadow-lg hover:shadow-holy/50 hover:scale-105 transition duration-300"
              >
                {t('landing.viewRules')} →
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER LINKS */}
      <footer className="mt-16 md:mt-32 pb-8 md:pb-16 text-center text-gray-300 space-y-3 md:space-y-4 px-4">
        <p className="text-sm md:text-lg flex flex-wrap justify-center gap-2 md:gap-4">
          <a href="/terms" target="_blank" className="text-holy underline hover:text-holyGlow">
            {t('landing.terms')}
          </a>
          <a href="/privacy" target="_blank" className="text-holy underline hover:text-holyGlow">
            {t('landing.privacy')}
          </a>
          <a href="/rules" target="_blank" className="text-holy underline hover:text-holyGlow">
            {t('landing.rulesLink')}
          </a>
        </p>
        <p className="text-xs md:text-sm">
          Holypot Trading © 2026 – {t('landing.footer')}
        </p>
      </footer>

      {/* MODAL FORMULARIO */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-black/40 backdrop-blur-xl border border-borderSubtle rounded-2xl md:rounded-3xl shadow-2xl p-5 md:p-10 max-w-lg w-full max-h-[95vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-3 right-3 md:top-4 md:right-4 text-white hover:text-gray-300 transition z-10"
              aria-label="Close"
            >
              <X className="w-7 h-7 md:w-10 md:h-10" />
            </button>

            <h2 className="text-2xl md:text-4xl font-bold text-center mb-4 md:mb-8 text-holy">
              {t('landing.signupTitle')} {selectedLevel.toUpperCase()}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              <Input type="email" placeholder={t('form.email')} required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="bg-black/40 border-borderSubtle text-white" />
              <Input type="password" placeholder={t('form.password')} required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="bg-black/40 border-borderSubtle text-white" />
              <Input type="password" placeholder={t('form.confirmPassword')} required value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} className="bg-black/40 border-borderSubtle text-white" />

              {/* SELECTOR DE RED */}
              <div>
                <p className="text-white text-sm md:text-base mb-2 font-semibold">Red de pago USDT</p>
                <div className="grid grid-cols-3 gap-2">
                  {NETWORKS.map(net => (
                    <button
                      key={net.id}
                      type="button"
                      onClick={() => setSelectedNetwork(net.id)}
                      className={`rounded-xl py-2 px-1 text-center border-2 transition-all duration-200 ${
                        selectedNetwork === net.id
                          ? 'border-holy bg-holy/20 scale-105'
                          : 'border-borderSubtle bg-black/30 hover:border-holy/50'
                      }`}
                    >
                      <p className="text-white font-bold text-xs md:text-sm">{net.label}</p>
                      <p className={`text-xs mt-0.5 ${selectedNetwork === net.id ? 'text-holy' : 'text-gray-400'}`}>fee {net.fee}</p>
                    </button>
                  ))}
                </div>
              </div>

              <Input
                type="text"
                placeholder={NETWORKS.find(n => n.id === selectedNetwork)?.walletHint || t('form.wallet')}
                required
                value={form.walletAddress}
                onChange={e => setForm({ ...form, walletAddress: e.target.value })}
                className="bg-black/40 border-borderSubtle text-white"
              />

              <div>
                <Label htmlFor="nickname" className="text-white text-sm md:text-base">{t('form.nickname')}</Label>
                <Input
                  id="nickname"
                  required
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  placeholder={t('form.nicknamePlaceholder')}
                  className="bg-black/40 border-borderSubtle text-white mt-2"
                />
              </div>

              <Input type="text" placeholder={t('form.fullName')} value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="bg-black/40 border-borderSubtle text-white" />
              <Input type="text" placeholder={t('form.country')} value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} className="bg-black/40 border-borderSubtle text-white" />
              <Input type="date" value={form.birthDate} onChange={e => setForm({ ...form, birthDate: e.target.value })} className="bg-black/40 border-borderSubtle text-white" />

              <div className="flex justify-center mt-4 md:mt-8">
                <HCaptcha
                  sitekey={HCAPTCHA_SITEKEY}
                  onVerify={(token) => setCaptchaToken(token)}
                  ref={captchaRef}
                />
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox id="terms" checked={form.acceptTerms} onCheckedChange={checked => setForm({ ...form, acceptTerms: checked })} />
                <Label htmlFor="terms" className="text-white text-sm md:text-base">
                  {t('form.acceptTerms')} <a href="/terms" className="text-holy underline">{t('form.termsLink')}</a>
                </Label>
              </div>

              <div className="flex gap-3 md:gap-6 pt-4 md:pt-6">
                <Button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-base md:text-xl py-4 md:py-5 rounded-full">
                  {t('form.cancel')}
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-holy to-purple-600 text-black text-base md:text-xl py-4 md:py-5 font-bold rounded-full hover:scale-105 transition"
                  disabled={!captchaToken}
                >
                  {t('form.payAndCompete')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;

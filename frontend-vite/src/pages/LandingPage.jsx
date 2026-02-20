import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import LandingHeaderWinners from '../components/LandingHeaderWinners';
import HowItWorks from '../components/HowItWorks';
import background from "@/assets/background.jpg";
import logo from "@/assets/Holypot-logo.webp";
import { useNavigate, Link } from 'react-router-dom';
import { X, Shield, Lock, CheckCircle2, Clock, ChevronDown } from "lucide-react";
import { useI18n, LanguageToggle } from '@/i18n';

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
    { id: 'polygon',  label: 'Polygon',  fee: '~$0.50', walletHint: 'Wallet Polygon (0x...)' },
    { id: 'trc20',    label: 'TRC-20',   fee: '~$4.50', walletHint: 'Wallet TRC-20 (T...)'   },
    { id: 'ethereum', label: 'Ethereum', fee: '~$17.50', walletHint: 'Wallet Ethereum (0x...)' }
  ];

  const [countdown, setCountdown] = useState('00h 00m 00s');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const utcNow = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
      let closeTime = new Date(utcNow);
      closeTime.setUTCHours(21, 0, 0, 0);
      if (utcNow > closeTime) closeTime.setUTCDate(closeTime.getUTCDate() + 1);
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
        res.data.forEach(c => { comps[c.level] = c; });
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
    <div className="min-h-screen text-white">

      {/* FONDO */}
      <div className="fixed inset-0 -z-10">
        <img src={background} alt="Fondo Holypot" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/85 via-black/75 to-black/95" />
      </div>

      {/* ── HEADER FIJO ── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-[72px] bg-[#0F172A]/95 backdrop-blur-md border-b border-[#D4AF37]/20 shadow-lg shadow-black/30">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <img src={logo} alt="Holypot" className="h-9 w-9 object-contain drop-shadow-lg" />
            <span className="text-lg font-bold tracking-tight hidden sm:block">
              <span className="text-[#D4AF37]">Holypot</span>
              <span className="text-white"> Trading</span>
            </span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Button
              asChild
              className="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black font-bold px-5 h-9 rounded-full text-sm shadow-lg hover:scale-105 transition duration-200"
            >
              <Link to="/login">{t('nav.login')}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="pt-[72px]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 text-center">

          {/* Credibility chip */}
          <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full px-4 py-1.5 mb-6">
            <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="text-xs md:text-sm text-[#D4AF37] font-semibold tracking-wide">
              {t('landing.skillBased')}
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-extrabold mb-5 leading-tight tracking-tight">
            <span className="text-white">{t('landing.compete')}</span>
            {' '}
            <span className="text-[#D4AF37]">{t('landing.earn')}</span>
            {' '}
            <span className="text-white">{t('landing.withdraw')}</span>
          </h1>

          <p className="text-lg md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            {t('landing.tagline')} – {t('landing.subtitle2')}
          </p>

          {/* Countdown badge */}
          <div className="inline-flex items-center gap-3 bg-black/50 border border-[#D4AF37]/20 rounded-2xl px-5 py-3 mb-8 shadow-inner">
            <Clock className="w-5 h-5 text-[#D4AF37] shrink-0" />
            <span className="text-gray-400 text-sm">{t('landing.subtitle')} – {t('landing.timeLeft')}:</span>
            <span className="text-red-400 font-bold text-lg tracking-widest tabular-nums">{countdown}</span>
          </div>

          {/* Trust strip */}
          <div className="flex flex-wrap justify-center gap-5 mb-10">
            {[
              { icon: <Shield className="w-4 h-4" />, label: t('landing.trustSkill') },
              { icon: <Lock className="w-4 h-4" />, label: t('landing.trustPayment') },
              { icon: <CheckCircle2 className="w-4 h-4" />, label: t('landing.trustAuditable') },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-gray-400 text-sm">
                <span className="text-[#D4AF37]">{icon}</span>
                {label}
              </div>
            ))}
          </div>

          {/* CTA */}
          <Button
            onClick={() => document.getElementById('competitions')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black text-lg md:text-xl px-10 py-6 font-extrabold rounded-full shadow-2xl shadow-[#D4AF37]/20 hover:scale-105 transition duration-300"
          >
            {t('landing.seeCompetitions')} <ChevronDown className="ml-2 w-5 h-5" />
          </Button>
        </div>

        {/* Winners strip */}
        <div className="border-t border-b border-[#D4AF37]/12 bg-[#0F172A]/60 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
            <LandingHeaderWinners />
          </div>
        </div>
      </section>

      {/* ── COMPETENCIAS ── */}
      <section id="competitions" className="max-w-7xl mx-auto px-4 md:px-8 py-14 md:py-24">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-xs md:text-sm text-[#D4AF37] font-bold uppercase tracking-widest mb-2">
            {t('landing.subtitle')}
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-3">
            {t('landing.title')}
          </h2>
          <p className="text-gray-400 text-base md:text-lg">
            {t('landing.timeLeft')}:{' '}
            <span className="text-red-400 font-bold tabular-nums">{countdown}</span>
          </p>
        </div>

        {loading ? (
          <p className="text-center text-xl text-gray-400">{t('landing.loading')}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">

            {/* BASIC */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00C853]/15 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition duration-700" />
              <div className="relative bg-[#0F172A]/80 backdrop-blur-xl border border-[#00C853]/30 rounded-3xl p-7 md:p-10 flex flex-col hover:border-[#00C853]/60 transition-all duration-300">
                <div className="text-center mb-7">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-[#00C853] bg-[#00C853]/10 border border-[#00C853]/25 rounded-full px-3 py-1">
                    BASIC
                  </span>
                  <p className="text-5xl font-extrabold text-white mt-5">
                    $12 <span className="text-sm font-normal text-gray-500">USDT</span>
                  </p>
                  <p className="text-gray-500 text-xs mt-1 uppercase tracking-wider">{t('landing.entry')}</p>
                </div>
                <div className="space-y-0 text-sm flex-1 divide-y divide-[#2A2A2A]">
                  <div className="flex justify-between py-3">
                    <span className="text-gray-500">{t('landing.virtualCapital')}</span>
                    <span className="font-semibold text-white">10.000 USDT</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-gray-500">{t('landing.participants')}</span>
                    <span className="font-semibold text-white">{competitions.basic?.participants || 0}</span>
                  </div>
                </div>
                <div className="mt-6 text-center py-4 bg-[#00C853]/5 rounded-2xl border border-[#00C853]/15">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">{t('landing.prizePool')}</p>
                  <p className="text-2xl md:text-3xl font-extrabold text-[#00C853]">
                    {formatNumber(competitions.basic?.prizePoolReal || 0)} USDT
                  </p>
                </div>
                <Button
                  onClick={() => openForm('basic')}
                  className="mt-5 w-full bg-gradient-to-r from-[#00C853] to-green-600 text-black text-base md:text-lg py-5 font-extrabold rounded-2xl hover:scale-105 transition duration-300 shadow-lg shadow-[#00C853]/10"
                >
                  {t('landing.signupBasic')}
                </Button>
              </div>
            </div>

            {/* MEDIUM — highlighted */}
            <div className="relative group md:-translate-y-4">
              <div className="absolute -top-5 inset-x-0 flex justify-center z-10">
                <span className="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black text-xs font-extrabold uppercase tracking-wider px-5 py-1.5 rounded-full shadow-lg shadow-[#D4AF37]/30">
                  MÁS POPULAR
                </span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition duration-700" />
              <div className="relative bg-[#0F172A]/90 backdrop-blur-xl border-2 border-blue-500/50 rounded-3xl p-7 md:p-10 flex flex-col hover:border-blue-400/80 transition-all duration-300 shadow-xl shadow-blue-500/8">
                <div className="text-center mb-7">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/25 rounded-full px-3 py-1">
                    MEDIUM
                  </span>
                  <p className="text-5xl font-extrabold text-white mt-5">
                    $54 <span className="text-sm font-normal text-gray-500">USDT</span>
                  </p>
                  <p className="text-gray-500 text-xs mt-1 uppercase tracking-wider">{t('landing.entry')}</p>
                </div>
                <div className="space-y-0 text-sm flex-1 divide-y divide-[#2A2A2A]">
                  <div className="flex justify-between py-3">
                    <span className="text-gray-500">{t('landing.virtualCapital')}</span>
                    <span className="font-semibold text-white">50.000 USDT</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-gray-500">{t('landing.participants')}</span>
                    <span className="font-semibold text-white">{competitions.medium?.participants || 0}</span>
                  </div>
                </div>
                <div className="mt-6 text-center py-4 bg-blue-500/5 rounded-2xl border border-blue-500/15">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">{t('landing.prizePool')}</p>
                  <p className="text-2xl md:text-3xl font-extrabold text-blue-400">
                    {formatNumber(competitions.medium?.prizePoolReal || 0)} USDT
                  </p>
                </div>
                <Button
                  onClick={() => openForm('medium')}
                  className="mt-5 w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white text-base md:text-lg py-5 font-extrabold rounded-2xl hover:scale-105 transition duration-300 shadow-lg shadow-blue-500/15"
                >
                  {t('landing.signupMedium')}
                </Button>
              </div>
            </div>

            {/* PREMIUM */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/20 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition duration-700" />
              <div className="relative bg-[#0F172A]/80 backdrop-blur-xl border border-[#D4AF37]/35 rounded-3xl p-7 md:p-10 flex flex-col hover:border-[#D4AF37]/65 transition-all duration-300">
                <div className="text-center mb-7">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/25 rounded-full px-3 py-1">
                    PREMIUM
                  </span>
                  <p className="text-5xl font-extrabold text-white mt-5">
                    $107 <span className="text-sm font-normal text-gray-500">USDT</span>
                  </p>
                  <p className="text-gray-500 text-xs mt-1 uppercase tracking-wider">{t('landing.entry')}</p>
                </div>
                <div className="space-y-0 text-sm flex-1 divide-y divide-[#2A2A2A]">
                  <div className="flex justify-between py-3">
                    <span className="text-gray-500">{t('landing.virtualCapital')}</span>
                    <span className="font-semibold text-white">100.000 USDT</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-gray-500">{t('landing.participants')}</span>
                    <span className="font-semibold text-white">{competitions.premium?.participants || 0}</span>
                  </div>
                </div>
                <div className="mt-6 text-center py-4 bg-[#D4AF37]/5 rounded-2xl border border-[#D4AF37]/15">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">{t('landing.prizePool')}</p>
                  <p className="text-2xl md:text-3xl font-extrabold text-[#D4AF37]">
                    {formatNumber(competitions.premium?.prizePoolReal || 0)} USDT
                  </p>
                </div>
                <Button
                  onClick={() => openForm('premium')}
                  className="mt-5 w-full bg-gradient-to-r from-[#D4AF37] to-purple-600 text-black text-base md:text-lg py-5 font-extrabold rounded-2xl hover:scale-105 transition duration-300 shadow-lg shadow-[#D4AF37]/10"
                >
                  {t('landing.signupPremium')}
                </Button>
              </div>
            </div>

          </div>
        )}
      </section>

      {/* ── HOW IT WORKS ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <HowItWorks />
      </div>

      {/* ── REGLAS (resumen) ── */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/8 to-transparent rounded-3xl blur-2xl" />
          <div className="relative bg-[#0F172A]/75 backdrop-blur-xl border border-[#D4AF37]/25 rounded-3xl p-8 md:p-14 shadow-2xl">

            <p className="text-xs text-[#D4AF37] font-bold uppercase tracking-widest text-center mb-2">
              {t('landing.rulesSubtitle')}
            </p>
            <h2 className="text-2xl md:text-4xl font-bold text-center text-white mb-10">
              {t('landing.rules')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
              {[
                { num: '1', title: t('rules.type'), desc: 'Competencias diarias skill-based en trading simulado de divisas, cripto, oro e índices. El resultado depende 100% de tu habilidad.' },
                { num: '5', title: t('rules.distribution'), desc: '1er lugar: 50% · 2do lugar: 30% · 3er lugar: 20% del prize pool total.' },
                { num: '6', title: t('rules.tradingRules'), desc: t('rules.trading_data') + ' Long/Short con TP y SL opcionales. Mín. 1 trade cerrado para aparecer en ranking.' },
                { num: '9', title: t('rules.prizePayout'), desc: t('rules.prizePayoutDesc') },
              ].map(({ num, title, desc }) => (
                <div
                  key={num}
                  className="flex gap-4 p-4 md:p-5 bg-black/25 rounded-2xl border border-[#2A2A2A] hover:border-[#D4AF37]/20 transition-colors"
                >
                  <span className="text-2xl font-extrabold text-[#D4AF37]/35 shrink-0 w-7 pt-0.5">
                    {num}
                  </span>
                  <div>
                    <h3 className="font-bold text-white mb-1.5 text-sm md:text-base">{title}</h3>
                    <p className="text-xs md:text-sm text-gray-400 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Button
                onClick={() => navigate('/rules')}
                className="bg-gradient-to-r from-[#D4AF37] to-purple-600 text-black text-base md:text-xl px-10 py-5 font-extrabold rounded-full shadow-xl hover:scale-105 transition duration-300"
              >
                {t('landing.viewRules')} →
              </Button>
            </div>

          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#D4AF37]/10 mt-4 md:mt-8 py-10 md:py-14 px-4">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <img src={logo} alt="Holypot" className="h-6 w-6 object-contain opacity-50" />
            <span className="text-gray-500 text-sm font-semibold">Holypot Trading © 2026</span>
          </div>
          <p className="text-sm flex flex-wrap justify-center gap-x-6 gap-y-2">
            <a href="/terms" target="_blank" className="text-[#D4AF37]/80 hover:text-[#FFD700] transition underline underline-offset-2">
              {t('landing.terms')}
            </a>
            <a href="/privacy" target="_blank" className="text-[#D4AF37]/80 hover:text-[#FFD700] transition underline underline-offset-2">
              {t('landing.privacy')}
            </a>
            <a href="/rules" target="_blank" className="text-[#D4AF37]/80 hover:text-[#FFD700] transition underline underline-offset-2">
              {t('landing.rulesLink')}
            </a>
          </p>
          <p className="text-xs text-gray-600">{t('landing.footer')}</p>
        </div>
      </footer>

      {/* ── MODAL FORMULARIO ── */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-[#0F172A]/95 backdrop-blur-xl border border-[#D4AF37]/20 rounded-2xl md:rounded-3xl shadow-2xl p-5 md:p-10 max-w-lg w-full max-h-[98vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-3 right-3 md:top-4 md:right-4 text-gray-400 hover:text-white transition z-10"
              aria-label="Close"
            >
              <X className="w-6 h-6 md:w-8 md:h-8" />
            </button>

            <h2 className="text-xl md:text-3xl font-extrabold text-center mb-1 text-white">
              {t('landing.signupTitle')}
            </h2>
            <p className="text-center text-[#D4AF37] font-bold mb-6 md:mb-8 text-lg md:text-xl">
              {selectedLevel.toUpperCase()}
            </p>

            <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
              <Input type="email" placeholder={t('form.email')} required value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="bg-black/40 border-[#2A2A2A] text-white" />
              <Input type="password" placeholder={t('form.password')} required value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="bg-black/40 border-[#2A2A2A] text-white" />
              <Input type="password" placeholder={t('form.confirmPassword')} required value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                className="bg-black/40 border-[#2A2A2A] text-white" />

              {/* Payment Network */}
              <div>
                <p className="text-white text-sm mb-2 font-semibold">{t('form.paymentNetwork')}</p>
                <div className="grid grid-cols-3 gap-2">
                  {NETWORKS.map(net => (
                    <button
                      key={net.id}
                      type="button"
                      onClick={() => setSelectedNetwork(net.id)}
                      className={`rounded-xl py-2 px-1 text-center border-2 transition-all duration-200 ${
                        selectedNetwork === net.id
                          ? 'border-[#D4AF37] bg-[#D4AF37]/15 scale-105'
                          : 'border-[#2A2A2A] bg-black/30 hover:border-[#D4AF37]/40'
                      }`}
                    >
                      <p className="text-white font-bold text-xs">{net.label}</p>
                      <p className={`text-xs mt-0.5 ${selectedNetwork === net.id ? 'text-[#D4AF37]' : 'text-gray-500'}`}>
                        fee {net.fee}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white text-sm">
                  Wallet USDT – {NETWORKS.find(n => n.id === selectedNetwork)?.label}
                </Label>
                <Input
                  type="text"
                  placeholder={NETWORKS.find(n => n.id === selectedNetwork)?.walletHint || t('form.wallet')}
                  required
                  value={form.walletAddress}
                  onChange={e => setForm({ ...form, walletAddress: e.target.value })}
                  className="bg-black/40 border-[#2A2A2A] text-white mt-2"
                />
              </div>

              <div>
                <Label htmlFor="nickname" className="text-white text-sm">{t('form.nickname')}</Label>
                <Input
                  id="nickname"
                  required
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  placeholder={t('form.nicknamePlaceholder')}
                  className="bg-black/40 border-[#2A2A2A] text-white mt-2"
                />
              </div>

              <Input type="text" placeholder={t('form.fullName')} value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })}
                className="bg-black/40 border-[#2A2A2A] text-white" />
              <Input type="text" placeholder={t('form.country')} value={form.country}
                onChange={e => setForm({ ...form, country: e.target.value })}
                className="bg-black/40 border-[#2A2A2A] text-white" />
              <Input type="date" value={form.birthDate}
                onChange={e => setForm({ ...form, birthDate: e.target.value })}
                className="bg-black/40 border-[#2A2A2A] text-white" />

              <div className="flex justify-center mt-2 mb-2">
                <HCaptcha
                  sitekey={HCAPTCHA_SITEKEY}
                  onVerify={(token) => setCaptchaToken(token)}
                  ref={captchaRef}
                />
              </div>

              <div className="flex items-start space-x-2 mt-3 mb-3 p-2 bg-black/30 rounded-lg border border-[#2A2A2A]">
                <Checkbox id="terms" checked={form.acceptTerms}
                  onCheckedChange={checked => setForm({ ...form, acceptTerms: checked })}
                  className="mt-1 shrink-0"
                />
                <Label htmlFor="terms" className="text-gray-300 text-xs md:text-sm cursor-pointer">
                  {t('form.acceptTerms')}{' '}
                  <a href="/terms" className="text-[#D4AF37] underline hover:text-[#FFD700]">{t('form.termsLink')}</a>
                </Label>
              </div>

              <div className="flex gap-2 md:gap-3 pt-1">
                <Button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-[#1E293B] hover:bg-[#2A3A4A] text-white text-sm md:text-base py-3 md:py-4 rounded-xl md:rounded-2xl border border-[#2A2A2A] font-semibold"
                >
                  {t('form.cancel')}
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#D4AF37] to-purple-600 text-black text-sm md:text-base py-3 md:py-4 font-extrabold rounded-xl md:rounded-2xl hover:scale-105 transition"
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

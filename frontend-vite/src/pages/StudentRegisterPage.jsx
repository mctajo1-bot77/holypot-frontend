// ============================================================
// HOLYPOT — STUDENT REGISTER PAGE
// Registration for Student/Demo mode (no payment required)
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import apiClient from '@/api';
import { toast, Toaster } from '@/components/Toaster';
import { GraduationCap, BookOpen, Trophy, TrendingUp, AlertTriangle, CheckCircle2, ArrowRight, Coins } from 'lucide-react';
import logo from '@/assets/Holypot-logo.webp';
import HCaptcha from '@hcaptcha/react-hcaptcha';

const HCAPTCHA_SITEKEY = 'a0b26f92-ba34-47aa-be42-c936e488a6f4';

// Modo estudiante: solo nivel básico (10,000 USDT virtual)
const LEVELS = [
  { id: 'basic', label: 'Basic', capital: '10,000', desc: 'Capital virtual $10,000 USDT', color: 'text-yellow-400 border-yellow-400' },
];

const COUNTRIES = [
  { code: 'AR', name: 'Argentina' }, { code: 'BO', name: 'Bolivia' }, { code: 'BR', name: 'Brasil' },
  { code: 'CL', name: 'Chile' }, { code: 'CO', name: 'Colombia' }, { code: 'CR', name: 'Costa Rica' },
  { code: 'CU', name: 'Cuba' }, { code: 'DO', name: 'Rep. Dominicana' }, { code: 'EC', name: 'Ecuador' },
  { code: 'SV', name: 'El Salvador' }, { code: 'GT', name: 'Guatemala' }, { code: 'HN', name: 'Honduras' },
  { code: 'MX', name: 'México' }, { code: 'NI', name: 'Nicaragua' }, { code: 'PA', name: 'Panamá' },
  { code: 'PY', name: 'Paraguay' }, { code: 'PE', name: 'Perú' }, { code: 'PR', name: 'Puerto Rico' },
  { code: 'UY', name: 'Uruguay' }, { code: 'VE', name: 'Venezuela' }, { code: 'ES', name: 'España' },
  { code: 'US', name: 'USA' }, { code: 'CA', name: 'Canadá' }, { code: 'DE', name: 'Alemania' },
  { code: 'FR', name: 'Francia' }, { code: 'GB', name: 'Reino Unido' }, { code: 'OTHER', name: 'Otro' },
];

export default function StudentRegisterPage() {
  const navigate = useNavigate();
  const captchaRef = useRef(null);

  const [step, setStep] = useState('form'); // 'form' | 'verify-email' | 'success'
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('basic');
  const [existingUser, setExistingUser] = useState(false);
  const [emailVerifiedReturn, setEmailVerifiedReturn] = useState(false);

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    country: 'OTHER',
  });
  const [errors, setErrors] = useState({});

  // If already logged in check for student entry
  useEffect(() => {
    const token = localStorage.getItem('holypotToken');
    const studentEntryId = localStorage.getItem('holypotStudentEntryId');
    if (token && studentEntryId) {
      navigate('/student-dashboard');
    }
  }, [navigate]);

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email requerido';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Email inválido';
    if (!existingUser) {
      if (!form.password || form.password.length < 8) errs.password = 'Mínimo 8 caracteres';
      if (form.password !== form.confirmPassword) errs.confirmPassword = 'Las contraseñas no coinciden';
      if (!form.nickname || form.nickname.length < 3) errs.nickname = 'Mínimo 3 caracteres';
    }
    if (!captchaToken) errs.captcha = 'Completa el captcha';
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);

    try {
      const payload = {
        email: form.email,
        level: selectedLevel,
        hCaptchaToken: captchaToken,
      };
      if (!existingUser) {
        payload.password = form.password;
        payload.nickname = form.nickname;
        payload.country = form.country;
      } else {
        payload.password = form.password;
      }

      const res = await apiClient.post('/student/join', payload);

      // Nuevo usuario: requiere verificación de email
      if (res.data.requireEmailVerification) {
        setStep('verify-email');
        return;
      }

      const { token, studentEntryId } = res.data;
      localStorage.setItem('holypotToken', token);
      localStorage.setItem('holypotStudentEntryId', studentEntryId);

      setStep('success');
      setTimeout(() => navigate('/student-dashboard'), 2000);
    } catch (err) {
      const code = err.response?.data?.code;
      const msg = err.response?.data?.error || 'Error al registrarse';

      if (code === 'SURVEY_REQUIRED') {
        toast.error('Debes completar la encuesta de la competencia anterior para volver a participar.');
      } else if (code === 'EMAIL_NOT_VERIFIED') {
        setStep('verify-email');
      } else {
        toast.error(msg);
      }
      captchaRef.current?.resetCaptcha();
      setCaptchaToken('');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'verify-email') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0A' }}>
        <Toaster />
        <div className="text-center space-y-5 p-8 max-w-md w-full">
          <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto border border-blue-500/30">
            <span className="text-4xl">📧</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Verifica tu email</h2>
          <p className="text-gray-400">
            Te enviamos un enlace a <span className="text-blue-400 font-semibold">{form.email}</span>.
            Haz clic en él para activar tu cuenta.
          </p>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-sm text-yellow-300 text-left space-y-1">
            <p className="font-semibold">¿No llegó el email?</p>
            <ul className="list-disc list-inside text-xs text-yellow-200/80 space-y-1">
              <li>Revisa tu carpeta de <strong>spam / correo no deseado</strong></li>
              <li>Espera 1-2 minutos y vuelve a revisar</li>
              <li>El asunto es: <em>"Confirma tu email - Holypot Trading"</em></li>
            </ul>
          </div>
          <button
            className="w-full py-2.5 px-4 rounded-lg border border-blue-500/40 text-blue-400 hover:bg-blue-500/10 transition text-sm font-medium"
            onClick={async () => {
              try {
                await apiClient.post('/resend-verification', { email: form.email });
                toast.success('Email reenviado', 'Revisa tu bandeja de entrada y spam.');
              } catch (e) {
                toast.error('No se pudo reenviar', e.response?.data?.error || 'Intenta de nuevo en unos minutos.');
              }
            }}
          >
            🔁 Reenviar email de verificación
          </button>
          <button
            className="w-full py-3 px-4 rounded-lg font-semibold text-sm transition"
            style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)', color: '#4ade80' }}
            onClick={() => { setEmailVerifiedReturn(true); setExistingUser(true); setStep('form'); }}
          >
            ✅ Ya verifiqué mi email → Continuar
          </button>
          <button
            className="text-gray-500 underline text-sm hover:text-gray-300"
            onClick={() => setStep('form')}
          >
            ← Volver al formulario
          </button>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0A' }}>
        <Toaster />
        <div className="text-center space-y-4 p-8">
          <CheckCircle2 className="w-20 h-20 text-green-400 mx-auto" />
          <h2 className="text-2xl font-bold text-white">¡Bienvenido al Modo Estudiante!</h2>
          <p className="text-gray-400">Redirigiendo al dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0A', color: '#fff' }}>
      <Toaster />

      {/* Header */}
      <header className="border-b border-gray-800 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Holypot" className="h-8 w-auto" />
            <span className="font-bold text-[#FFD700]">Holypot</span>
          </Link>
          <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/40">
            <GraduationCap className="w-3 h-3 mr-1" /> Modo Estudiante
          </Badge>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3 pt-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <GraduationCap className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold">Practica sin riesgo</h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Únete al modo estudiante y experimenta toda la plataforma con capital virtual.
            Sin pagos, sin riesgo — compite, aprende y decide si quieres competir por dinero real.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { icon: <Coins className="w-5 h-5 text-yellow-400" />, text: 'Capital virtual gratuito' },
            { icon: <TrendingUp className="w-5 h-5 text-green-400" />, text: 'Trading real simulado' },
            { icon: <BookOpen className="w-5 h-5 text-blue-400" />, text: 'IA te da 3 consejos diarios' },
          ].map((b, i) => (
            <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-lg text-center"
              style={{ background: '#161616', border: '1px solid #2A2A2A' }}>
              {b.icon}
              <span className="text-xs text-gray-300">{b.text}</span>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Competencia única */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-300">Competencia Modo Estudiante</h3>

            <div className="w-full text-left p-4 rounded-lg border-2 border-yellow-400 text-yellow-400 bg-white/5">
              <div className="flex items-center justify-between">
                <span className="font-bold">Basic — Capital Virtual</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <p className="text-sm mt-1 opacity-80">$10,000 USDT virtual · Sin costo</p>
            </div>

            <div className="p-3 rounded-lg text-sm" style={{ background: '#1a1a2e', border: '1px solid #3a3a6e' }}>
              <AlertTriangle className="w-4 h-4 text-yellow-400 inline mr-2" />
              <span className="text-yellow-400 font-semibold">Modo Estudiante:</span>
              <span className="text-gray-300"> No se realizan pagos reales. El capital es 100% virtual.</span>
            </div>
          </div>

          {/* Registration form */}
          <Card style={{ background: '#161616', border: '1px solid #2A2A2A' }}>
            <CardHeader>
              <CardTitle className="text-white text-lg">
                {existingUser ? 'Inicia sesión para unirte' : 'Crear cuenta de estudiante'}
              </CardTitle>
              <div className="flex items-center gap-3 mt-1">
                <button
                  className="text-xs text-blue-400 underline"
                  onClick={() => { setExistingUser(!existingUser); setErrors({}); }}
                >
                  {existingUser ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
                </button>
                {existingUser && (
                  <Link to="/forgot-password" className="text-xs text-gray-500 hover:text-gray-300 underline">
                    ¿Olvidaste tu contraseña?
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {emailVerifiedReturn && (
                <div className="mb-3 p-3 rounded-lg text-sm" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.35)', color: '#4ade80' }}>
                  ✅ ¡Email verificado! Ingresa tu contraseña, resuelve el captcha y haz clic en <strong>Continuar</strong>.
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <Label className="text-gray-400 text-xs">Email</Label>
                  <Input name="email" type="email" value={form.email} onChange={handleChange}
                    placeholder="tu@email.com"
                    className="mt-1 bg-black/40 border-gray-700 text-white focus:border-blue-500" />
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                </div>

                {!existingUser && (
                  <div>
                    <Label className="text-gray-400 text-xs">Nickname (público)</Label>
                    <Input name="nickname" value={form.nickname} onChange={handleChange}
                      placeholder="TraderPro123"
                      className="mt-1 bg-black/40 border-gray-700 text-white focus:border-blue-500" />
                    {errors.nickname && <p className="text-red-400 text-xs mt-1">{errors.nickname}</p>}
                  </div>
                )}

                <div>
                  <Label className="text-gray-400 text-xs">Contraseña</Label>
                  <Input name="password" type="password" value={form.password} onChange={handleChange}
                    placeholder="••••••••"
                    className="mt-1 bg-black/40 border-gray-700 text-white focus:border-blue-500" />
                  {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
                </div>

                {!existingUser && (
                  <>
                    <div>
                      <Label className="text-gray-400 text-xs">Confirmar contraseña</Label>
                      <Input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange}
                        placeholder="••••••••"
                        className="mt-1 bg-black/40 border-gray-700 text-white focus:border-blue-500" />
                      {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
                    </div>

                    <div>
                      <Label className="text-gray-400 text-xs">País</Label>
                      <select name="country" value={form.country} onChange={handleChange}
                        className="mt-1 w-full px-3 py-2 rounded-md text-white text-sm focus:border-blue-500 focus:outline-none"
                        style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #374151' }}>
                        {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                      </select>
                    </div>
                  </>
                )}

                <div className="flex justify-center pt-1">
                  <HCaptcha
                    ref={captchaRef}
                    sitekey={HCAPTCHA_SITEKEY}
                    theme="dark"
                    onVerify={(token) => { setCaptchaToken(token); setErrors(prev => ({ ...prev, captcha: undefined })); }}
                    onExpire={() => setCaptchaToken('')}
                  />
                </div>
                {errors.captcha && <p className="text-red-400 text-xs text-center">{errors.captcha}</p>}

                <Button type="submit" disabled={loading}
                  className="w-full font-bold py-2.5"
                  style={{ background: loading ? '#333' : '#3b82f6', color: 'white' }}>
                  {loading ? 'Registrando...' : (
                    <span className="flex items-center justify-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      Unirse al Modo Estudiante
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Al registrarte aceptas los{' '}
                  <Link to="/terms" className="text-blue-400 underline">Términos y Condiciones</Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

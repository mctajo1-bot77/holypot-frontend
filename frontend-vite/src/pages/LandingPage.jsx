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

const API_BASE = 'http://localhost:5000/api';
const HCAPTCHA_SITEKEY = 'a0b26f92-ba34-47aa-be42-c936e488a6f4';

const LandingPage = () => {
  const navigate = useNavigate();
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
    if (!form.walletAddress) return alert('Wallet USDT TRC-20 obligatoria');
    if (!nickname) return alert('Nickname obligatorio – será tu nombre visible en el ranking');
    if (!captchaToken) return alert('Completa el CAPTCHA');

    try {
      const res = await axios.post(`${API_BASE}/create-payment`, {
        ...form,
        nickname,
        hCaptchaToken: captchaToken
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
      <header className="relative bg-primary/65 backdrop-blur-md border-b border-holy/20 shadow-md py-8">
        <div className="max-w-7xl mx-auto px-6">
          <LandingHeaderWinners />
        </div>
      </header>

      {/* COMPETENCIAS ACTIVAS */}
      <div className="max-w-7xl mx-auto px-8 py-16">
        <h2 className="text-5xl font-bold text-center mb-4 text-holy">
          Competencias Activas Hoy
        </h2>
        <p className="text-2xl text-center mb-12 text-gray-300">
          Cierre diario a las 21:00 UTC – ¡Tiempo restante: <span className="text-red-500 font-bold">{countdown}</span>!
        </p>

        {loading ? (
          <p className="text-center text-2xl text-gray-400">Cargando competencias...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* BASIC */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-profit/30 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition duration-700" />
              <div className="relative bg-black/30 backdrop-blur-xl border border-profit/40 rounded-3xl p-10 text-center shadow-2xl hover:shadow-profit/30 hover:scale-105 transition-all duration-500">
                <h3 className="text-4xl font-bold text-profit mb-6">BASIC</h3>
                <p className="text-xl text-gray-200 mb-4">Entrada: $12 USDT</p>
                <p className="text-xl text-gray-200 mb-4">Capital virtual: 10.000 USDT</p>
                <p className="text-xl text-gray-200 mb-4">Participantes: {competitions.basic?.participants || 0}</p>
                <p className="text-3xl font-bold text-holy mb-8">
                  Prize pool: {formatNumber(competitions.basic?.prizePool || 0)} USDT
                </p>
                <Button 
                  onClick={() => openForm('basic')}
                  className="w-full bg-gradient-to-r from-profit to-green-600 text-black text-2xl py-6 font-bold rounded-full shadow-lg hover:shadow-profit/50 hover:scale-105 transition duration-300"
                >
                  INSCRIBIRSE BASIC
                </Button>
              </div>
            </div>

            {/* MEDIUM */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition duration-700" />
              <div className="relative bg-black/30 backdrop-blur-xl border border-blue-500/40 rounded-3xl p-10 text-center shadow-2xl hover:shadow-blue-500/30 hover:scale-105 transition-all duration-500">
                <h3 className="text-4xl font-bold text-blue-400 mb-6">MEDIUM</h3>
                <p className="text-xl text-gray-200 mb-4">Entrada: $54 USDT</p>
                <p className="text-xl text-gray-200 mb-4">Capital virtual: 50.000 USDT</p>
                <p className="text-xl text-gray-200 mb-4">Participantes: {competitions.medium?.participants || 0}</p>
                <p className="text-3xl font-bold text-holy mb-8">
                  Prize pool: {formatNumber(competitions.medium?.prizePool || 0)} USDT
                </p>
                <Button 
                  onClick={() => openForm('medium')}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white text-2xl py-6 font-bold rounded-full shadow-lg hover:shadow-blue-500/50 hover:scale-105 transition duration-300"
                >
                  INSCRIBIRSE MEDIUM
                </Button>
              </div>
            </div>

            {/* PREMIUM */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-holy/40 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition duration-700" />
              <div className="relative bg-black/30 backdrop-blur-xl border border-holy/50 rounded-3xl p-10 text-center shadow-2xl hover:shadow-holy/40 hover:scale-105 transition-all duration-500">
                <h3 className="text-4xl font-bold text-holy mb-6">PREMIUM</h3>
                <p className="text-xl text-gray-200 mb-4">Entrada: $107 USDT</p>
                <p className="text-xl text-gray-200 mb-4">Capital virtual: 100.000 USDT</p>
                <p className="text-xl text-gray-200 mb-4">Participantes: {competitions.premium?.participants || 0}</p>
                <p className="text-3xl font-bold text-holy mb-8">
                  Prize pool: {formatNumber(competitions.premium?.prizePool || 0)} USDT
                </p>
                <Button 
                  onClick={() => openForm('premium')}
                  className="w-full bg-gradient-to-r from-holy to-purple-600 text-black text-2xl py-6 font-bold rounded-full shadow-lg hover:shadow-holy/50 hover:scale-105 transition duration-300"
                >
                  INSCRIBIRSE PREMIUM
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECCIÓN REGLAS + DESEMPATE ACTUALIZADA */}
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-holy/20 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition" />
          <div className="relative bg-black/30 backdrop-blur-xl border border-holy/40 rounded-3xl shadow-2xl p-12 hover:scale-105 transition-all duration-500">
            <h2 className="text-4xl font-bold text-center text-holy mb-12">
              Reglas de las Competencias – Holypot Trading
            </h2>
            <p className="text-xl text-center text-gray-300 mb-12">
              Última actualización: 25 de enero de 2026
            </p>

            <p className="text-lg leading-relaxed mb-16 text-gray-200">
              La Plataforma Holypot Trading actúa exclusivamente como proveedor neutral de infraestructura técnica, árbitro imparcial y facilitador de pagos en escrow. No organiza ni promueve competencias directamente; facilita competencias diarias abiertas por nivel que se generan y activan únicamente cuando los usuarios alcanzan el mínimo requerido de participantes pagados.
            </p>

            <ol className="space-y-12 text-lg text-gray-200 list-decimal pl-8 marker:text-holy marker:font-bold">
              <li>
                <h3 className="text-2xl text-holy mb-4">1. Tipo de competencia</h3>
                <p>
                  Competencias diarias skill-based 100% en trading simulado de divisas (FX), pares mayores, oro e índices seleccionados. El resultado depende exclusivamente de la habilidad, estrategia y gestión de riesgo del participante. No existe componente de azar.
                </p>
              </li>

              <li>
                <h3 className="text-2xl text-holy mb-4">2. Niveles de competencia</h3>
                <p>Existen tres niveles diarios independientes y abiertos:</p>
                <ul className="list-disc pl-10 mt-4 space-y-3 text-gray-300">
                  <li><strong>Basic</strong>: entrada de 12 USDT, capital virtual inicial de 10.000 USDT.</li>
                  <li><strong>Medium</strong>: entrada de 54 USDT, capital virtual inicial de 50.000 USDT.</li>
                  <li><strong>Premium</strong>: entrada de 107 USDT, capital virtual inicial de 100.000 USDT.</li>
                </ul>
                <p className="mt-4">
                  Cada nivel tiene su propia competencia diaria y prize pool independiente, generado exclusivamente por las inscripciones de los usuarios.
                </p>
              </li>

              <li>
                <h3 className="text-2xl text-holy mb-4">3. Horario diario (UTC)</h3>
                <ul className="list-disc pl-10 mt-4 space-y-3 text-gray-300">
                  <li>Apertura: 00:00 UTC.</li>
                  <li>Mínimo requerido: 5 participantes pagados para que la competencia se active y sea válida.</li>
                  <li>Última inscripción permitida: 18:00 UTC.</li>
                  <li>Cierre definitivo: 21:00 UTC.</li>
                  <li>Si a las 18:00 UTC no se alcanzan 5 participantes, las entradas pagadas se trasladan automáticamente y sin costo adicional al mismo nivel del día siguiente (rollover). No hay devolución de la entrada.</li>
                </ul>
              </li>

              <li>
                <h3 className="text-2xl text-holy mb-4">4. Inscripción y pago</h3>
                <p>
                  El pago se realiza exclusivamente en USDT (red TRC20) a través del procesador NOWPayments. Una vez confirmado el pago, la inscripción es definitiva y no reembolsable (salvo rollover por falta de mínimo).
                </p>
              </li>

              <li>
                <h3 className="text-2xl text-holy mb-4">5. Prize pool y distribución</h3>
                <p>
                  El prize pool de cada nivel se calcula como: total de entradas recolectadas − comisión de la plataforma (~10%).
                </p>
                <p className="mt-3">Distribución estándar (top 3):</p>
                <ul className="list-disc pl-10 mt-3 space-y-2 text-gray-300">
                  <li>1er lugar: 50%</li>
                  <li>2do lugar: 30%</li>
                  <li>3er lugar: 20%</li>
                </ul>
              </li>

              <li>
                <h3 className="text-2xl text-holy mb-4">6. Reglas de trading simulado</h3>
                <ul className="list-disc pl-10 mt-4 space-y-3 text-gray-300">
                  <li>Datos en tiempo real proporcionados por Finnhub y/o OANDA.</li>
                  <li>Operaciones LONG/SHORT con precio de entrada exacto.</li>
                  <li>Take Profit (TP) y Stop Loss (SL) opcionales y editables.</li>
                  <li>Tamaño de lote ajustable (porcentaje de riesgo en vivo).</li>
                  <li>Requisito mínimo: cerrar al menos 1 operación durante la competencia para aparecer en el ranking.</li>
                </ul>
              </li>

              <li>
                <h3 className="text-2xl text-holy mb-4">7. Cálculo de rendimiento</h3>
                <p>
                  Retorno % = (capital final − capital inicial) / capital inicial × 100.
                </p>
              </li>

              <li>
                <h3 className="text-2xl text-holy mb-4">8. Métodos de desempate (orden secuencial)</h3>
                <p>En caso de empate exacto en retorno %:</p>
                <ol className="list-decimal pl-10 mt-4 space-y-3 text-gray-300">
                  <li>Menor riesgo promedio utilizado (suma total de lot size o % riesgo promedio).</li>
                  <li>Menor cantidad de operaciones realizadas.</li>
                  <li>Menor drawdown máximo (%) durante la competencia.</li>
                  <li>Timestamp más temprano de inscripción pagada.</li>
                </ol>
              </li>

              <li>
                <h3 className="text-2xl text-holy mb-4">9. Pago de premios</h3>
                <p>
                  Los premios se abonan automáticamente (o manualmente en fase inicial) en USDT a la wallet del usuario inmediatamente después del cierre de la competencia válida.
                </p>
              </li>

              <li>
                <h3 className="text-2xl text-holy mb-4">10. Conducta prohibida</h3>
                <p>
                  Queda estrictamente prohibido el uso de bots, cuentas múltiples, colusión, manipulación de resultados o cualquier conducta fraudulenta. La Plataforma se reserva el derecho de descalificar participantes y retener premios en caso de incumplimiento.
                </p>
              </li>
            </ol>

            <p className="mt-16 text-center text-gray-400 italic">
              Estas reglas forman parte integrante de los Términos y Condiciones de Uso de Holypot Trading SAS y pueden ser modificadas con notificación previa.
            </p>

            {/* BOTÓN VER REGLAS COMPLETAS */}
            <div className="text-center mt-20">
              <Button 
                onClick={() => navigate('/rules')}
                className="bg-gradient-to-r from-holy to-purple-600 text-black text-2xl px-12 py-6 font-bold rounded-full shadow-lg hover:shadow-holy/50 hover:scale-105 transition duration-300"
              >
                Ver reglas completas →
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER LINKS */}
      <footer className="mt-32 pb-16 text-center text-gray-300 space-y-4">
        <p className="text-lg">
          <a href="/terms" target="_blank" className="text-holy underline hover:text-holyGlow mx-4">
            Términos y Condiciones
          </a>
          <a href="/privacy" target="_blank" className="text-holy underline hover:text-holyGlow mx-4">
            Política de Privacidad
          </a>
          <a href="/rules" target="_blank" className="text-holy underline hover:text-holyGlow mx-4">
            Reglas Competencias
          </a>
        </p>
        <p className="text-sm">
          Holypot Trading © 2026 – Competencias de habilidad, no gambling. Edad mínima 18 años.
        </p>
      </footer>

      {/* MODAL FORMULARIO - MEJORADO: SCROLL + CIERRE X + CLICK FUERA */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowForm(false)} // cierre clic fuera
        >
          <div
            className="bg-black/40 backdrop-blur-xl border border-borderSubtle rounded-3xl shadow-2xl p-10 max-w-lg w-full max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()} // evita cierre al clickear dentro
          >
            {/* Botón cerrar X */}
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition z-10"
              aria-label="Cerrar formulario"
            >
              <X className="w-10 h-10" />
            </button>

            <h2 className="text-4xl font-bold text-center mb-8 text-holy">
              Inscribirse en {selectedLevel.toUpperCase()}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input type="email" placeholder="Email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="bg-black/40 border-borderSubtle text-white" />
              <Input type="password" placeholder="Contraseña" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="bg-black/40 border-borderSubtle text-white" />
              <Input type="password" placeholder="Confirmar contraseña" required value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} className="bg-black/40 border-borderSubtle text-white" />
              <Input type="text" placeholder="Wallet USDT TRC-20 (obligatorio)" required value={form.walletAddress} onChange={e => setForm({ ...form, walletAddress: e.target.value })} className="bg-black/40 border-borderSubtle text-white" />

              <div>
                <Label htmlFor="nickname" className="text-white">Nickname (obligatorio – visible en ranking)</Label>
                <Input
                  id="nickname"
                  required
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  placeholder="ej: PipKiller"
                  className="bg-black/40 border-borderSubtle text-white mt-2"
                />
              </div>

              <Input type="text" placeholder="Nombre completo (opcional)" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="bg-black/40 border-borderSubtle text-white" />
              <Input type="text" placeholder="País (opcional)" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} className="bg-black/40 border-borderSubtle text-white" />
              <Input type="date" value={form.birthDate} onChange={e => setForm({ ...form, birthDate: e.target.value })} className="bg-black/40 border-borderSubtle text-white" />

              {/* HCAPTCHA */}
              <div className="flex justify-center mt-8">
                <HCaptcha
                  sitekey={HCAPTCHA_SITEKEY}
                  onVerify={(token) => setCaptchaToken(token)}
                  ref={captchaRef}
                />
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox id="terms" checked={form.acceptTerms} onCheckedChange={checked => setForm({ ...form, acceptTerms: checked })} />
                <Label htmlFor="terms" className="text-white">
                  Acepto los <a href="/terms" className="text-holy underline">términos y condiciones</a>
                </Label>
              </div>

              <div className="flex gap-6 pt-6">
                <Button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xl py-5 rounded-full">
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-holy to-purple-600 text-black text-xl py-5 font-bold rounded-full hover:scale-105 transition"
                  disabled={!captchaToken}
                >
                  PAGAR Y COMPETIR
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

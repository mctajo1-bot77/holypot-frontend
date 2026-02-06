import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import background from "@/assets/background.jpg";

axios.defaults.withCredentials = true;

const API_BASE = 'http://localhost:5000/api';

const levelsConfig = {
  basic:   { name: "Basic",   entryPrice: 12,  initialCapital: 10000 },
  medium:  { name: "Medium",  entryPrice: 54,  initialCapital: 50000 },
  premium: { name: "Premium", entryPrice: 107, initialCapital: 100000 }
};

const formatNumber = (num) => new Intl.NumberFormat('es-ES').format(num || 0);

const LandingPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [level, setLevel] = useState('basic');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!acceptTerms) return alert('Debes aceptar términos y condiciones');

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/create-payment`, {
        email,
        password,
        walletAddress,
        level,
        acceptTerms
      }, { withCredentials: true }); // cookie segura

      // Backend ya crea user + set cookie token – no login extra
      window.open(res.data.paymentUrl, '_blank');
      navigate('/dashboard'); // redirige dashboard (cookie lleva auth)
    } catch (err) {
      alert('Error inscripción: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* FONDO ESPACIO + OVERLAY DARK */}
      <div className="fixed inset-0 -z-10">
        <img 
          src={background} 
          alt="Fondo Holypot" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* HEADER SIMPLE */}
      <header className="relative z-10 py-8 text-center">
        <h1 className="text-6xl font-bold text-holy animate-pulse">Holypot Trading 🚀</h1>
        <p className="text-2xl text-gray-300 mt-4">Compite diario, gana real el mismo día – mínimo 500% ROI</p>
      </header>

      {/* CARD INSCRIPCIÓN CENTRAL GLASS */}
      <div className="max-w-4xl mx-auto px-8 py-16">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-holy/30 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition duration-700" />
          <Card className="relative bg-black/30 backdrop-blur-xl border border-holy/40 rounded-3xl shadow-2xl p-12 hover:scale-105 transition-all duration-500">
            <CardHeader className="text-center">
              <CardTitle className="text-4xl font-bold text-holy mb-8">
                ¡Únete hoy y compite por premios increíbles!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-8">
                <div>
                  <Label htmlFor="email" className="text-gray-200">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-black/40 border-borderSubtle text-white mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-gray-200">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-black/40 border-borderSubtle text-white mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="wallet" className="text-gray-200">Wallet TRC20 (USDT)</Label>
                  <Input
                    id="wallet"
                    type="text"
                    required
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="ej: TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"
                    className="bg-black/40 border-borderSubtle text-white mt-2"
                  />
                </div>

                <div>
                  <Label className="text-gray-200">Nivel competencia</Label>
                  <div className="grid grid-cols-3 gap-6 mt-4">
                    {Object.entries(levelsConfig).map(([key, config]) => (
                      <Button
                        key={key}
                        type="button"
                        variant={level === key ? "default" : "outline"}
                        className={`h-24 text-xl font-bold rounded-3xl transition-all ${
                          level === key ? 'bg-holy text-black shadow-holy/50' : 'bg-black/40 border-holy/40 text-white hover:bg-holy/20'
                        }`}
                        onClick={() => setLevel(key)}
                      >
                        {config.name}<br />
                        ${config.entryPrice} entrada<br />
                        {formatNumber(config.initialCapital)} capital
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <Checkbox 
                    id="terms" 
                    checked={acceptTerms}
                    onCheckedChange={setAcceptTerms}
                  />
                  <Label htmlFor="terms" className="text-gray-200 cursor-pointer">
                    Acepto los{' '}
                    <a href="/terms" target="_blank" className="text-holy underline hover:text-holyGlow">
                      Términos y Condiciones
                    </a>{' '}
                    y{' '}
                    <a href="/privacy" target="_blank" className="text-holy underline hover:text-holyGlow">
                      Política de Privacidad
                    </a>
                  </Label>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-holy to-purple-600 text-black text-3xl py-10 font-bold rounded-full shadow-lg hover:shadow-holy/50 hover:scale-105 transition duration-300"
                  disabled={loading || !acceptTerms}
                >
                  {loading ? 'Procesando...' : 'INSCRIBIRME Y COMPETIR'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* SECCIÓN REGLAS COMPETENCIAS */}
        <div className="mt-32 relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-holy/20 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition" />
          <Card className="relative bg-black/30 backdrop-blur-xl border border-holy/40 rounded-3xl shadow-2xl p-12 hover:scale-105 transition-all duration-500">
            <CardHeader className="text-center">
              <CardTitle className="text-4xl font-bold text-holy mb-8">
                Reglas Competencias + Desempate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 text-lg text-gray-200">
              <div>
                <h3 className="text-2xl text-holy mb-4">Ciclo Diario</h3>
                <p>Competencias inician 00:00 UTC y cierran 23:59 UTC. Resultados + payouts inmediatos.</p>
              </div>

              <div>
                <h3 className="text-2xl text-holy mb-4">Trading</h3>
                <ul className="list-disc pl-8 space-y-2">
                  <li>Máximo 20 trades/día.</li>
                  <li>LotSize 0.01-1.0 (risk 0.1%-10%).</li>
                  <li>Órdenes market/limit/stop.</li>
                  <li>Capital virtual inicial según level.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-2xl text-holy mb-4">Ranking y Ganadores</h3>
                <p>Ranking basado en % retorno sobre capital inicial.</p>
                <p>Prize pool = inscripciones - comisión plataforma.</p>
                <p>Distribución: 1er 50%, 2do 30%, 3ro 20%.</p>
              </div>

              <div>
                <h3 className="text-2xl text-holy mb-4">Desempate</h3>
                <ol className="list-decimal pl-8 space-y-2">
                  <li>Mayor capital final absoluto.</li>
                  <li>Menor riesgo abierto al cierre.</li>
                  <li>Más trades ganadores.</li>
                  <li>Menor número total trades (eficiencia).</li>
                </ol>
              </div>

              <div>
                <h3 className="text-2xl text-holy mb-4">Payouts</h3>
                <p>Premios reales USDT TRC20 directo wallet – mismo día cierre.</p>
                <p>Mínimo 5 participantes o rollover gratis.</p>
              </div>

              <div className="text-center mt-12">
                <a href="/rules" className="text-holy text-2xl underline hover:text-holyGlow">
                  Ver reglas completas →
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FOOTER LINKS */}
        <footer className="mt-32 text-center text-gray-300 space-y-4">
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
      </div>
    </div>
  );
};

export default LandingPage;
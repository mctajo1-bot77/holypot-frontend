// ============================================================
// HOLYPOT — FORGOT PASSWORD PAGE
// Flow: Enter email → Enter 6-digit code + new password
// ============================================================
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import apiClient from '@/api';
import { toast, Toaster } from '@/components/Toaster';
import background from '@/assets/background.jpg';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // 'email' | 'code'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await apiClient.post('/forgot-password', { email });
      setStep('code');
      toast.success('Código enviado', 'Revisa tu bandeja de entrada y carpeta de spam.');
    } catch (err) {
      toast.error('Error', err.response?.data?.error || 'No se pudo enviar el código. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('La contraseña debe tener mínimo 8 caracteres');
      return;
    }
    if (code.length !== 6) {
      toast.error('El código debe tener 6 dígitos');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/reset-password', { email, code, newPassword });
      toast.success('¡Contraseña actualizada!', 'Ahora puedes iniciar sesión con tu nueva contraseña.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      toast.error('Error', err.response?.data?.error || 'Código inválido o expirado. Solicita uno nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden flex items-center justify-center">
      <Toaster />

      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <img src={background} alt="Fondo" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/65" />
      </div>

      <div className="w-full max-w-md px-4">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/30 to-transparent rounded-2xl blur-xl" />
          <Card className="relative bg-black/30 backdrop-blur-xl border border-yellow-500/40 rounded-2xl shadow-2xl p-6">
            <CardHeader className="text-center pb-2">
              <div className="text-4xl mb-2">🔐</div>
              <CardTitle className="text-2xl font-bold text-[#D4AF37]">
                {step === 'email' ? 'Recuperar contraseña' : 'Verificar código'}
              </CardTitle>
              <p className="text-gray-400 text-sm mt-1">
                {step === 'email'
                  ? 'Te enviaremos un código de 6 dígitos a tu email'
                  : `Ingresa el código que enviamos a ${email}`}
              </p>
            </CardHeader>

            <CardContent className="pt-4">
              {step === 'email' ? (
                <form onSubmit={handleSendCode} className="space-y-4">
                  <div>
                    <Label className="text-gray-300">Email</Label>
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="mt-1 bg-black/40 border-gray-600 text-white focus:border-yellow-500"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full font-bold py-3"
                    style={{ background: loading ? '#333' : 'linear-gradient(135deg, #D4AF37, #FFD700)', color: '#000' }}
                  >
                    {loading ? 'Enviando...' : 'Enviar código'}
                  </Button>

                  <div className="text-center">
                    <Link to="/login" className="text-gray-400 text-sm hover:text-gray-200 underline">
                      ← Volver al login
                    </Link>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <Label className="text-gray-300">Código de 6 dígitos</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="mt-1 bg-black/40 border-gray-600 text-white text-center text-2xl tracking-widest focus:border-yellow-500"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300">Nueva contraseña</Label>
                    <Input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="mt-1 bg-black/40 border-gray-600 text-white focus:border-yellow-500"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300">Confirmar contraseña</Label>
                    <Input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite la contraseña"
                      className="mt-1 bg-black/40 border-gray-600 text-white focus:border-yellow-500"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full font-bold py-3"
                    style={{ background: loading ? '#333' : 'linear-gradient(135deg, #D4AF37, #FFD700)', color: '#000' }}
                  >
                    {loading ? 'Actualizando...' : 'Cambiar contraseña'}
                  </Button>

                  <div className="flex justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => setStep('email')}
                      className="text-gray-400 hover:text-gray-200 underline"
                    >
                      ← Cambiar email
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleSendCode}
                      className="text-yellow-400 hover:text-yellow-300 underline"
                    >
                      Reenviar código
                    </button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

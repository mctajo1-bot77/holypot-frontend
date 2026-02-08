import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import background from "@/assets/background.jpg";

// ✅ API_BASE DINÁMICA – funciona local y producción
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:5000/api';

const AdminLogin = () => {
  const [email, setEmail] = useState('admin@holypot.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ CORREGIDO: paréntesis en lugar de backticks
      const res = await axios.post(`${API_BASE}/admin-login`, { email, password }, { withCredentials: true });
      
      // Guardar indicador de sesión admin
      localStorage.setItem('holypotAdminToken', 'true');
      
      // Redirigir al admin dashboard
      navigate('/admin', { replace: true });
      
    } catch (err) {
      alert('Error login admin: ' + (err.response?.data?.error || err.message || 'Network Error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden flex items-center justify-center">
      {/* FONDO */}
      <div className="fixed inset-0 -z-10">
        <img
          src={background}
          alt="Fondo Holypot"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* CARD CENTRAL */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-holy/30 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition duration-700" />
        <Card className="relative bg-black/30 backdrop-blur-xl border border-holy/40 rounded-3xl shadow-2xl p-10 max-w-md w-full hover:scale-105 transition-all duration-500">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-bold text-holy mb-4">
              Login Admin – Holypot Trading
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-8">
              <Input
                type="email"
                value={email}
                disabled
                className="bg-black/40 border-borderSubtle text-gray-200 text-center text-lg"
              />

              <Input
                type="password"
                placeholder="Password admin"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-black/40 border-borderSubtle text-white text-lg"
              />

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-holy to-purple-600 text-black text-2xl py-7 font-bold rounded-full shadow-lg hover:shadow-holy/50 hover:scale-105 transition duration-300"
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'LOGIN ADMIN'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;

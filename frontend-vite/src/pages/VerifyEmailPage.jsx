import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import background from '@/assets/background.jpg';

const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : 'http://localhost:5000/api';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Token no encontrado en la URL');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token) => {
    try {
      const response = await axios.get(`${API_BASE}/verify-email?token=${token}`);
      
      setStatus('success');
      setMessage(response.data.message || '¡Email verificado correctamente!');
      
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.error || 'Error al verificar el email');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* FONDO */}
      <div className="fixed inset-0 -z-10">
        <img src={background} alt="Fondo" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/70" />
      </div>

      {/* CONTENIDO */}
      <div className="relative bg-black/40 backdrop-blur-xl border border-holy/40 rounded-3xl shadow-2xl p-16 text-center max-w-2xl mx-4">
        {status === 'verifying' && (
          <>
            <div className="text-8xl mb-8 animate-spin">⏳</div>
            <h2 className="text-4xl font-bold text-white mb-4">
              Verificando tu email...
            </h2>
            <p className="text-xl text-gray-300">
              Por favor espera un momento
            </p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="text-8xl mb-8">✅</div>
            <h2 className="text-4xl font-bold text-profit mb-4">
              ¡Email Verificado!
            </h2>
            <p className="text-2xl text-white mb-6">{message}</p>
            <p className="text-xl text-gray-400">
              Redirigiendo al login en 3 segundos...
            </p>
            <div className="mt-8 w-full bg-gray-700 rounded-full h-3 overflow-hidden">
              <div className="bg-profit h-full animate-progress" style={{ width: '100%' }}></div>
            </div>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="text-8xl mb-8">❌</div>
            <h2 className="text-4xl font-bold text-red-500 mb-4">
              Error en la Verificación
            </h2>
            <p className="text-xl text-gray-300 mb-8">{message}</p>
            <button 
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-gradient-to-r from-holy to-purple-600 text-black text-xl font-bold rounded-full hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-holy/50"
            >
              Ir al Login
            </button>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
        .animate-progress {
          animation: progress 3s linear;
        }
      `}</style>
    </div>
  );
}

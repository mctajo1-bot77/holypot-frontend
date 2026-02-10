import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import.meta.env.VITE_API_URL

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function VerifyEmailPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Verificando tu email...');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/auth/verify-email/${token}`);
        setMessage(response.data.message || '¡Email verificado exitosamente!');
        setIsError(false);
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error) {
        setMessage(
          error.response?.data?.message || 
          'Error al verificar el email. El enlace puede haber expirado.'
        );
        setIsError(true);
      }
    };

    if (token) {
      verifyEmail();
    }
  }, [token, navigate]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        maxWidth: '500px'
      }}>
        <h1 style={{ 
          color: isError ? '#ff4444' : '#4CAF50',
          marginBottom: '1rem'
        }}>
          {isError ? '❌ Error' : '✅ Verificación'}
        </h1>
        <p style={{ fontSize: '1.1rem' }}>{message}</p>
        {!isError && (
          <p style={{ marginTop: '1rem', color: '#888' }}>
            Redirigiendo al login...
          </p>
        )}
      </div>
    </div>
  );
}

export default VerifyEmailPage;

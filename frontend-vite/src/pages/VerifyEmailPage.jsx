import React, { useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      axios.get(`http://localhost:5000/api/verify-email?token=${token}`)
        .then(() => {
          alert('Email verificado – cuenta activada!');
          navigate('/login');
        })
        .catch(() => alert('Error verificación'));
    }
  }, [token]);

  return <p>Verificando email...</p>;
};

export default VerifyEmailPage;
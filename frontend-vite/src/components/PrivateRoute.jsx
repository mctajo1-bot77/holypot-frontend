import React from 'react';
import { Navigate } from 'react-router-dom';

// Función mejorada para detectar autenticación
// Permite:
// - Usuario normal: tiene 'token'
// - Admin en modo "ver como usuario": tiene 'holypotAdminToken' + 'holypotEntryId'
const isAuthenticated = () => {
  const userToken = localStorage.getItem('token');
  if (userToken) return true;

  const adminToken = localStorage.getItem('holypotAdminToken');
  const entryId = localStorage.getItem('holypotEntryId');

  // Admin solo puede entrar a rutas protegidas del usuario si está impersonando (tiene entryId)
  return !!adminToken && !!entryId;
};

const PrivateRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
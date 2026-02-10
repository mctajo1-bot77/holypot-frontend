import axios from 'axios';

// API_BASE dinámica (producción Render)
const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true // Mantiene compatibilidad con cookies
});

// INTERCEPTOR: Envía token como Authorization header en CADA petición
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('holypotToken');
  if (token && token !== 'undefined' && token !== 'null') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;

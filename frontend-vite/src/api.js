import axios from 'axios';

// API_BASE dinámica (producción Render)
const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true // Envía cookie HttpOnly automáticamente
});

export default apiClient;

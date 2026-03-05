import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';  // Tailwind + estilos
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { I18nProvider } from './i18n';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import App from './App';                    // dashboard usuario
import Profile from './pages/Profile';       // página de perfil
import PrivateRoute from './components/PrivateRoute';  // wrapper rutas protegidas (soporta admin impersonando)
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import RulesPage from './pages/RulesPage';
import WinnersPage from './pages/WinnersPage';
import PagosVerificadosPage from './pages/PagosVerificadosPage';
import StudentRegisterPage from './pages/StudentRegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import ForumPage from './pages/ForumPage';
import ForumDetailPage from './pages/ForumDetailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/ganadores" element={<WinnersPage />} />
          <Route path="/pagos-verificados" element={<PagosVerificadosPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* RUTAS ESTUDIANTE */}
          <Route path="/student-register" element={<StudentRegisterPage />} />
          <Route path="/student-dashboard" element={<PrivateRoute><StudentDashboard /></PrivateRoute>} />

          {/* FORO – accesible a todos, comentar requiere auth */}
          <Route path="/forum" element={<ForumPage />} />
          <Route path="/forum/:id" element={<ForumDetailPage />} />

          {/* RUTAS PROTEGIDAS – solo accesibles con token normal o admin impersonando */}
          <Route path="/dashboard" element={<PrivateRoute><App /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

          {/* RUTAS ADMIN */}
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  </React.StrictMode>
);

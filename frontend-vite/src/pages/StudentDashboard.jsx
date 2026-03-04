// ============================================================
// HOLYPOT — STUDENT DASHBOARD WRAPPER
// Sets student mode in localStorage and renders main Dashboard
// ============================================================
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from '@/App';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const studentEntryId = localStorage.getItem('holypotStudentEntryId');
    const token = localStorage.getItem('holypotToken');

    if (!studentEntryId || !token) {
      navigate('/student-register');
      return;
    }

    // Set student mode flags so App.jsx knows we're in student mode
    localStorage.setItem('holypotMode', 'student');

    setReady(true);

    // On unmount: clear student mode flag if navigating away
    return () => {
      // Only clear if navigating to a non-student route
      // (keep it set while still in student section)
    };
  }, [navigate]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0A' }}>
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 text-sm">Cargando modo estudiante...</p>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}

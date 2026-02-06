import React, { useState, useEffect } from 'react';
import holypotLogo from '../assets/holypot-logo.png';

const Header = () => {
  const [countdown, setCountdown] = useState('00h 00m 00s');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const utcNow = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
      let closeTime = new Date(utcNow);
      closeTime.setUTCHours(21, 0, 0, 0);

      if (utcNow > closeTime) {
        closeTime.setUTCDate(closeTime.getUTCDate() + 1);
      }

      const diff = closeTime - utcNow;
      const hours = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const minutes = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const seconds = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');

      setCountdown(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-blue-600 text-white py-8 px-8 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <img src={holypotLogo} alt="Holypot Logo" className="w-24 h-24 object-contain" />
        <div className="text-center flex-1">
          <h1 className="text-4xl font-bold">Holypot Trading 🚀</h1>
          <p className="text-3xl font-bold text-red-400 mt-4">
            Cierre competencia: {countdown}
          </p>
        </div>
        <div className="w-24" /> {/* balance logo */}
      </div>
    </header>
  );
};

export default Header;
import React, { useState, useEffect } from 'react';
import { createChart } from 'lightweight-charts';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api'; // backend local

function App() {
  const [entryId] = useState('TU_ENTRY_ID_CONFIRMADO'); // cambia por real o login futuro
  const [symbol, setSymbol] = useState('EURUSD');
  const [direction, setDirection] = useState('long');
  const [sizePercent, setSizePercent] = useState(5);
  const [positions, setPositions] = useState([]);
  const [ranking, setRanking] = useState([]);

  // Fetch positions P&L live + ranking every 5s
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Positions live (futuro endpoint /api/my-positions?entryId=...)
        const posRes = await axios.get(`${API_BASE}/my-positions`, { params: { entryId } });
        setPositions(posRes.data.positions || []);

        // Ranking live poll admin JSON
        const rankRes = await axios.get('/admin?pass=holypotadmin2026');
        const adminData = rankRes.data;
        const basicRanking = adminData.competenciasPorLevel.basic?.ranking || [];
        setRanking(basicRanking);
      } catch (err) {
        console.error('Error fetch data', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // every 5s live P&L/ranking

    return () => clearInterval(interval);
  }, [entryId]);

  // Open trade API live Finnhub from dashboard
  const openTrade = async () => {
    try {
      const res = await axios.post(`${API_BASE}/open-trade`, {
        entryId,
        symbol,
        direction,
        sizePercent: parseInt(sizePercent)
      });
      alert(res.data.message);
    } catch (err) {
      alert('Error open trade: ' + (err.response?.data?.error || err.message));
    }
  };

  // Close trade API live Finnhub from dashboard
  const closeTrade = async (positionId) => {
    try {
      const res = await axios.post(`${API_BASE}/close-trade`, { positionId });
      alert(res.data.message);
    } catch (err) {
      alert('Error close trade: ' + (err.response?.data?.error || err.message));
    }
  };

  // Gráfico TradingView live embed pro real-time (cambia symbol dinámico)
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      new window.TradingView.widget({
        "width": "100%",
        "height": 500,
        "symbol": `FX:${symbol}`,
        "interval": "D",
        "timezone": "Etc/UTC",
        "theme": "dark",
        "style": "1",
        "locale": "es",
        "toolbar_bg": "#f1f3f6",
        "enable_publishing": false,
        "allow_symbol_change": true,
        "container_id": "tradingview_widget"
      });
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [symbol]);

  return (
    <div className="min-h-screen bg-background text-white">
      <header className="p-8 text-center">
        <h1 className="text-5xl font-bold text-primary mb-4">Holypot Trading 🚀</h1>
        <p className="text-2xl">Prize pool actual: 940 USDT | Participantes: 17 | Tu posición: #1</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-8">
        <div className="lg:col-span-2 bg-card p-6 rounded-xl shadow-2xl">
          <h2 className="text-3xl mb-4">Gráfico {symbol} Live</h2>
          <div id="tradingview_widget" className="rounded-lg"></div>
        </div>

        <div className="bg-card p-6 rounded-xl shadow-2xl">
          <h2 className="text-3xl mb-6">New Trade</h2>
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="w-full bg-accent p-4 rounded mb-4 text-white text-xl">
            <option>EURUSD</option>
            <option>GBPUSD</option>
            <option>USDJPY</option>
            <option>XAUUSD</option>
            <option>SP500</option>
            <option>NASDAQ</option>
          </select>

          <div className="mb-6">
            <p className="text-xl mb-2">Direction</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setDirection('long')} className={`p-4 rounded text-2xl font-bold ${direction === 'long' ? 'bg-primary text-black' : 'bg-accent'}`}>
                LONG
              </button>
              <button onClick={() => setDirection('short')} className={`p-4 rounded text-2xl font-bold ${direction === 'short' ? 'bg-danger text-black' : 'bg-accent'}`}>
                SHORT
              </button>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-xl mb-2">Size % capital (1-10%)</p>
            <input type="range" min="1" max="10" value={sizePercent} onChange={(e) => setSizePercent(e.target.value)} className="w-full" />
            <p className="text-center text-3xl mt-4">{sizePercent}%</p>
          </div>

          <button onClick={openTrade} className="w-full bg-primary text-black font-bold text-3xl py-6 rounded-xl">
            ABRIR TRADE
          </button>
        </div>
      </div>

      <div className="mt-12 px-8 mb-12">
        <h2 className="text-4xl mb-6 text-center">Positions Abiertas</h2>
        <div className="bg-card p-8 rounded-xl shadow-2xl">
          <table className="w-full text-xl">
            <thead>
              <tr className="border-b-2 border-accent">
                <th className="py-4">Symbol</th>
                <th>Direction</th>
                <th>Size %</th>
                <th>Entry Price</th>
                <th>P&L Live</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {positions.map(pos => (
                <tr key={pos.id} className="border-b border-accent text-center">
                  <td className="py-6">{pos.symbol}</td>
                  <td className={pos.direction === 'long' ? 'text-primary' : 'text-danger'}>{pos.direction.toUpperCase()}</td>
                  <td>{pos.sizePercent}%</td>
                  <td>{pos.entryPrice.toFixed(5)}</td>
                  <td className={pos.currentPnl > 0 ? 'text-primary' : 'text-danger'}>{pos.currentPnl.toFixed(4)}%</td>
                  <td><button onClick={() => closeTrade(pos.id)} className="bg-danger px-6 py-3 rounded font-bold">CLOSE</button></td>
                </tr>
              ))}
              {positions.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-400">No positions abiertas – abre tu primer trade 🚀</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-12 px-8 mb-12">
        <h2 className="text-4xl mb-6 text-center">Ranking Live Top 10</h2>
        <div className="bg-card p-8 rounded-xl shadow-2xl">
          <table className="w-full text-xl">
            <thead>
              <tr className="border-b-2 border-accent">
                <th className="py-4">Posición</th>
                <th>Email</th>
                <th>Retorno %</th>
                <th>Capital Live</th>
                <th>Open Positions</th>
                <th>Premio Proyectado</th>
              </tr>
            </thead>
            <tbody>
              {ranking.slice(0, 10).map((r, i) => (
                <tr key={i} className="border-b border-accent text-center">
                  <td className="py-6">#{r.posicion}</td>
                  <td>{r.email}</td>
                  <td className={parseFloat(r.retornoPorcentaje) > 0 ? 'text-primary' : 'text-danger'}>{r.retornoPorcentaje}</td>
                  <td>{r.liveCapital} USDT</td>
                  <td>{r.openPositions}</td>
                  <td className="text-primary font-bold">{r.montoPremio}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
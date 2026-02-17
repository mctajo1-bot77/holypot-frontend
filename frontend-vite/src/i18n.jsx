import React, { createContext, useContext, useState, useCallback } from 'react';

const translations = {
  es: {
    // Header / Nav
    'nav.dashboard': 'Dashboard',
    'nav.profile': 'Mi Perfil',
    'nav.admin': 'Panel Admin',
    'nav.logout': 'Cerrar Sesión',
    'nav.login': 'Iniciar Sesión',

    // Landing
    'landing.title': 'Competencias Activas Hoy',
    'landing.subtitle': 'Cierre diario a las 21:00 UTC',
    'landing.timeLeft': 'Tiempo restante',
    'landing.loading': 'Cargando competencias...',
    'landing.entry': 'Entrada',
    'landing.virtualCapital': 'Capital virtual',
    'landing.participants': 'Participantes',
    'landing.prizePool': 'Prize pool',
    'landing.signupBasic': 'INSCRIBIRSE BASIC',
    'landing.signupMedium': 'INSCRIBIRSE MEDIUM',
    'landing.signupPremium': 'INSCRIBIRSE PREMIUM',
    'landing.signupTitle': 'Inscribirse en',
    'landing.rules': 'Reglas de las Competencias',
    'landing.rulesSubtitle': 'Holypot Trading',
    'landing.viewRules': 'Ver reglas completas',
    'landing.terms': 'Términos y Condiciones',
    'landing.privacy': 'Política de Privacidad',
    'landing.rulesLink': 'Reglas Competencias',
    'landing.footer': 'Competencias de habilidad, no gambling. Edad mínima 18 años.',
    'landing.tagline': 'Compite por premios diarios',
    'landing.totalPaid': 'Total premios pagados',
    'landing.winnersTitle': 'Ganadores',
    'landing.winnersRotate': '(cambia cada hora)',
    'landing.noWinners': 'Próximamente los primeros ganadores reales',
    'landing.beFirst': '¡Sé el primero en aparecer aquí!',

    // Forms
    'form.email': 'Email',
    'form.password': 'Contraseña',
    'form.confirmPassword': 'Confirmar contraseña',
    'form.wallet': 'Wallet USDT TRC-20 (obligatorio)',
    'form.nickname': 'Nickname (obligatorio – visible en ranking)',
    'form.nicknamePlaceholder': 'ej: PipKiller',
    'form.fullName': 'Nombre completo (opcional)',
    'form.country': 'País (opcional)',
    'form.acceptTerms': 'Acepto los',
    'form.termsLink': 'términos y condiciones',
    'form.cancel': 'Cancelar',
    'form.payAndCompete': 'PAGAR Y COMPETIR',
    'form.login': 'INICIAR SESIÓN',
    'form.loggingIn': 'Iniciando...',
    'form.noAccount': '¿No tienes cuenta?',
    'form.registerHere': 'Regístrate aquí',
    'form.loginSubtitle': 'Inicia sesión y vuelve a competir',

    // Dashboard
    'dash.level': 'Nivel',
    'dash.participants': 'Participantes',
    'dash.timeLeft': 'Tiempo restante',
    'dash.prizePool': 'Prize pool',
    'dash.balance': 'Saldo live',
    'dash.aiAdvice': 'Consejo IA del día (by Grok)',
    'dash.aiAdvicePlaceholder': 'Compite hoy para recibir tu consejo personalizado mañana',
    'dash.newTrade': 'New Trade',
    'dash.currentPrice': 'Precio actual',
    'dash.loading': 'Cargando...',
    'dash.symbol': 'Symbol',
    'dash.direction': 'Direction',
    'dash.lotSize': 'LotSize',
    'dash.takeProfit': 'Take Profit (opcional)',
    'dash.stopLoss': 'Stop Loss (opcional)',
    'dash.targetPrice': 'Precio objetivo',
    'dash.openTrade': 'ABRIR TRADE',
    'dash.viewOnly': 'MODO SOLO VISTA',
    'dash.riskTooHigh': 'RIESGO DEMASIADO ALTO',
    'dash.positions': 'Positions Abiertas',
    'dash.noPositions': 'No positions abiertas – abre tu primer trade',
    'dash.adminNoPositions': 'Modo admin - Sin posiciones activas',
    'dash.riskTotal': 'Risk total abierto',
    'dash.ranking': 'Ranking Live Top 10',
    'dash.selectRanking': 'Ver ranking de competencia activa:',
    'dash.loadingRanking': 'Cargando ranking...',
    'dash.adminMode': 'MODO ADMIN - Solo visualización. Inicia sesión como usuario para operar.',
    'dash.viewMode': 'Modo visualización - Sin competencia activa',
    'dash.adminNoTrades': 'No puedes abrir trades en modo admin. Inicia sesión como usuario normal.',
    'dash.riskReal': 'Riesgo REAL',
    'dash.slDistance': 'Distancia SL',
    'dash.highRisk': '¡Alto riesgo!',
    'dash.suggested': 'Sugerido',
    'dash.forRisk': 'para',
    'dash.addSL': 'Añade Stop Loss para ver el riesgo real',
    'dash.calculatingRisk': 'Calculando riesgo...',
    'dash.chart': 'Gráfico',
    'dash.live': 'Live',

    // Positions table
    'pos.symbol': 'Symbol',
    'pos.direction': 'Direction',
    'pos.lotSize': 'LotSize (% risk)',
    'pos.entryPrice': 'Entry Price',
    'pos.pnl': 'P&L Live',
    'pos.tp': 'TP (pips)',
    'pos.sl': 'SL (pips)',
    'pos.action': 'Action',
    'pos.edit': 'Edit',
    'pos.close': 'CLOSE',

    // Ranking table
    'rank.spot': 'Spot #',
    'rank.trader': 'Trader',
    'rank.return': 'Retorno %',
    'rank.capital': 'Capital Live',
    'rank.openPos': 'Open Positions',
    'rank.prize': 'Premio Proyectado',

    // Profile
    'profile.hello': '¡Hola,',
    'profile.position': 'Estás',
    'profile.inCompetition': 'en tu competencia actual',
    'profile.bestRanking': 'Mejor ranking histórico',
    'profile.bias': 'Sesgo comportamiento',
    'profile.ratherBull': 'Rather Bull',
    'profile.ratherBear': 'Rather Bear',
    'profile.buys': 'Compras',
    'profile.sells': 'Ventas',
    'profile.totalOps': 'Operaciones totales',
    'profile.dailyReturn': 'Rendimiento por día de trading',
    'profile.historySoon': 'Historial real pronto – ¡compite más!',
    'profile.profitability': 'Rentabilidad',
    'profile.hitRatio': 'Ratio de aciertos',
    'profile.sessionSuccess': 'Tasas de éxito por sesión',
    'profile.topInstruments': 'Instrumentos más operados',
    'profile.noTrades': 'No trades aún – ¡abre tu primer trade!',
    'profile.history': 'Historial competencias',
    'profile.noHistory': 'No historial aún – ¡compite hoy!',
    'profile.date': 'Fecha',
    'profile.level': 'Level',
    'profile.returnPct': 'Retorno %',
    'profile.positionCol': 'Posición',
    'profile.prizeWon': 'Premio ganado',
    'profile.loadingProfile': 'Cargando perfil...',

    // Win modal
    'win.congrats': '¡FELICIDADES, GANASTE!',
    'win.position': 'Posición',
    'win.inCompetition': 'en competencia',
    'win.date': 'Fecha',
    'win.paymentConfirmed': 'Pago confirmado en blockchain',
    'win.paymentId': 'Payment ID',
    'win.walletMsg': '¡El USDT ya está en tu wallet TRC20! Revisa tu billetera.',
    'win.continue': '¡Genial, seguir compitiendo!',

    // Rules section titles
    'rules.type': 'Tipo de competencia',
    'rules.typeDesc': 'Competencias diarias skill-based 100% en trading simulado de divisas (FX), pares mayores, oro e índices seleccionados. El resultado depende exclusivamente de la habilidad, estrategia y gestión de riesgo del participante. No existe componente de azar.',
    'rules.levels': 'Niveles de competencia',
    'rules.schedule': 'Horario diario (UTC)',
    'rules.payment': 'Inscripción y pago',
    'rules.distribution': 'Prize pool y distribución',
    'rules.tradingRules': 'Reglas de trading simulado',
    'rules.calcReturn': 'Cálculo de rendimiento',
    'rules.tiebreak': 'Métodos de desempate (orden secuencial)',
    'rules.prizePayout': 'Pago de premios',
    'rules.prohibited': 'Conducta prohibida',
    'rules.disclaimer': 'Estas reglas forman parte integrante de los Términos y Condiciones de Uso de Holypot Trading SAS y pueden ser modificadas con notificación previa.',
    'rules.platformDesc': 'La Plataforma Holypot Trading actúa exclusivamente como proveedor neutral de infraestructura técnica, árbitro imparcial y facilitador de pagos en escrow. No organiza ni promueve competencias directamente; facilita competencias diarias abiertas por nivel que se generan y activan únicamente cuando los usuarios alcanzan el mínimo requerido de participantes pagados.',
    'rules.lastUpdate': 'Última actualización: 25 de enero de 2026',

    // Admin
    'admin.title': 'Panel Admin Holypot',
    'admin.totalSignups': 'Inscripciones totales',
    'admin.revenue': 'Revenue plataforma',
    'admin.totalPool': 'Prize pool total',
    'admin.competitions': 'Competencias',
    'admin.users': 'Usuarios',
    'admin.payouts': 'Payouts',
    'admin.exportCSV': 'Exportar CSV pagos top 3',
    'admin.viewAsUser': 'Ver como usuario',
    'admin.noPayouts': 'No hay payouts aún – ¡espera primeras competencias!',
    'admin.loadingAdmin': 'Cargando panel admin...',
    'admin.noData': 'Sin datos disponibles – sesión expirada o error de conexión',
    'admin.userList': 'Lista completa de usuarios (capital live)',
    'admin.payoutsHistory': 'Historial Payouts (premios pagados)',

    // Common
    'common.usdt': 'USDT',
  },

  en: {
    // Header / Nav
    'nav.dashboard': 'Dashboard',
    'nav.profile': 'My Profile',
    'nav.admin': 'Admin Panel',
    'nav.logout': 'Sign Out',
    'nav.login': 'Sign In',

    // Landing
    'landing.title': 'Active Competitions Today',
    'landing.subtitle': 'Daily close at 21:00 UTC',
    'landing.timeLeft': 'Time remaining',
    'landing.loading': 'Loading competitions...',
    'landing.entry': 'Entry',
    'landing.virtualCapital': 'Virtual capital',
    'landing.participants': 'Participants',
    'landing.prizePool': 'Prize pool',
    'landing.signupBasic': 'JOIN BASIC',
    'landing.signupMedium': 'JOIN MEDIUM',
    'landing.signupPremium': 'JOIN PREMIUM',
    'landing.signupTitle': 'Sign up for',
    'landing.rules': 'Competition Rules',
    'landing.rulesSubtitle': 'Holypot Trading',
    'landing.viewRules': 'View full rules',
    'landing.terms': 'Terms & Conditions',
    'landing.privacy': 'Privacy Policy',
    'landing.rulesLink': 'Competition Rules',
    'landing.footer': 'Skill-based competitions, not gambling. Minimum age 18.',
    'landing.tagline': 'Compete for daily prizes',
    'landing.totalPaid': 'Total prizes paid',
    'landing.winnersTitle': 'Winners',
    'landing.winnersRotate': '(rotates hourly)',
    'landing.noWinners': 'First real winners coming soon',
    'landing.beFirst': 'Be the first to appear here!',

    // Forms
    'form.email': 'Email',
    'form.password': 'Password',
    'form.confirmPassword': 'Confirm password',
    'form.wallet': 'Wallet USDT TRC-20 (required)',
    'form.nickname': 'Nickname (required – visible in ranking)',
    'form.nicknamePlaceholder': 'e.g. PipKiller',
    'form.fullName': 'Full name (optional)',
    'form.country': 'Country (optional)',
    'form.acceptTerms': 'I accept the',
    'form.termsLink': 'terms and conditions',
    'form.cancel': 'Cancel',
    'form.payAndCompete': 'PAY & COMPETE',
    'form.login': 'SIGN IN',
    'form.loggingIn': 'Signing in...',
    'form.noAccount': "Don't have an account?",
    'form.registerHere': 'Register here',
    'form.loginSubtitle': 'Sign in and compete again',

    // Dashboard
    'dash.level': 'Level',
    'dash.participants': 'Participants',
    'dash.timeLeft': 'Time left',
    'dash.prizePool': 'Prize pool',
    'dash.balance': 'Live balance',
    'dash.aiAdvice': 'AI Tip of the Day (by Grok)',
    'dash.aiAdvicePlaceholder': 'Compete today to get your personalized tip tomorrow',
    'dash.newTrade': 'New Trade',
    'dash.currentPrice': 'Current price',
    'dash.loading': 'Loading...',
    'dash.symbol': 'Symbol',
    'dash.direction': 'Direction',
    'dash.lotSize': 'LotSize',
    'dash.takeProfit': 'Take Profit (optional)',
    'dash.stopLoss': 'Stop Loss (optional)',
    'dash.targetPrice': 'Target price',
    'dash.openTrade': 'OPEN TRADE',
    'dash.viewOnly': 'VIEW ONLY MODE',
    'dash.riskTooHigh': 'RISK TOO HIGH',
    'dash.positions': 'Open Positions',
    'dash.noPositions': 'No open positions – open your first trade',
    'dash.adminNoPositions': 'Admin mode - No active positions',
    'dash.riskTotal': 'Total open risk',
    'dash.ranking': 'Live Ranking Top 10',
    'dash.selectRanking': 'View active competition ranking:',
    'dash.loadingRanking': 'Loading ranking...',
    'dash.adminMode': 'ADMIN MODE - View only. Sign in as user to trade.',
    'dash.viewMode': 'View mode - No active competition',
    'dash.adminNoTrades': 'Cannot open trades in admin mode. Sign in as a regular user.',
    'dash.riskReal': 'REAL Risk',
    'dash.slDistance': 'SL Distance',
    'dash.highRisk': 'High risk!',
    'dash.suggested': 'Suggested',
    'dash.forRisk': 'for',
    'dash.addSL': 'Add Stop Loss to see real risk',
    'dash.calculatingRisk': 'Calculating risk...',
    'dash.chart': 'Chart',
    'dash.live': 'Live',

    // Positions table
    'pos.symbol': 'Symbol',
    'pos.direction': 'Direction',
    'pos.lotSize': 'LotSize (% risk)',
    'pos.entryPrice': 'Entry Price',
    'pos.pnl': 'P&L Live',
    'pos.tp': 'TP (pips)',
    'pos.sl': 'SL (pips)',
    'pos.action': 'Action',
    'pos.edit': 'Edit',
    'pos.close': 'CLOSE',

    // Ranking table
    'rank.spot': 'Spot #',
    'rank.trader': 'Trader',
    'rank.return': 'Return %',
    'rank.capital': 'Live Capital',
    'rank.openPos': 'Open Positions',
    'rank.prize': 'Projected Prize',

    // Profile
    'profile.hello': 'Hello,',
    'profile.position': "You're",
    'profile.inCompetition': 'in your current competition',
    'profile.bestRanking': 'Best historical ranking',
    'profile.bias': 'Trading Bias',
    'profile.ratherBull': 'Rather Bull',
    'profile.ratherBear': 'Rather Bear',
    'profile.buys': 'Buys',
    'profile.sells': 'Sells',
    'profile.totalOps': 'Total Operations',
    'profile.dailyReturn': 'Return by trading day',
    'profile.historySoon': 'Real history coming soon – keep trading!',
    'profile.profitability': 'Profitability',
    'profile.hitRatio': 'Hit ratio',
    'profile.sessionSuccess': 'Success rates by session',
    'profile.topInstruments': 'Most traded instruments',
    'profile.noTrades': 'No trades yet – open your first trade!',
    'profile.history': 'Competition History',
    'profile.noHistory': 'No history yet – compete today!',
    'profile.date': 'Date',
    'profile.level': 'Level',
    'profile.returnPct': 'Return %',
    'profile.positionCol': 'Position',
    'profile.prizeWon': 'Prize Won',
    'profile.loadingProfile': 'Loading profile...',

    // Win modal
    'win.congrats': 'CONGRATULATIONS, YOU WON!',
    'win.position': 'Position',
    'win.inCompetition': 'in competition',
    'win.date': 'Date',
    'win.paymentConfirmed': 'Payment confirmed on blockchain',
    'win.paymentId': 'Payment ID',
    'win.walletMsg': 'The USDT is already in your TRC20 wallet! Check your balance.',
    'win.continue': 'Awesome, keep competing!',

    // Rules
    'rules.type': 'Competition Type',
    'rules.typeDesc': 'Daily 100% skill-based competitions in simulated forex (FX) trading, major pairs, gold, and selected indices. Results depend exclusively on participant skill, strategy, and risk management. No element of chance.',
    'rules.levels': 'Competition Levels',
    'rules.schedule': 'Daily Schedule (UTC)',
    'rules.payment': 'Registration & Payment',
    'rules.distribution': 'Prize Pool & Distribution',
    'rules.tradingRules': 'Simulated Trading Rules',
    'rules.calcReturn': 'Return Calculation',
    'rules.tiebreak': 'Tiebreak Methods (sequential)',
    'rules.prizePayout': 'Prize Payout',
    'rules.prohibited': 'Prohibited Conduct',
    'rules.disclaimer': 'These rules are an integral part of the Terms and Conditions of Use of Holypot Trading SAS and may be modified with prior notice.',
    'rules.platformDesc': 'Holypot Trading Platform acts exclusively as a neutral provider of technical infrastructure, impartial arbiter, and escrow payment facilitator. It does not organize or promote competitions directly; it facilitates daily open competitions by level that are generated and activated only when users reach the minimum required number of paid participants.',
    'rules.lastUpdate': 'Last updated: January 25, 2026',

    // Admin
    'admin.title': 'Holypot Admin Panel',
    'admin.totalSignups': 'Total Signups',
    'admin.revenue': 'Platform Revenue',
    'admin.totalPool': 'Total Prize Pool',
    'admin.competitions': 'Competitions',
    'admin.users': 'Users',
    'admin.payouts': 'Payouts',
    'admin.exportCSV': 'Export CSV top 3 payments',
    'admin.viewAsUser': 'View as user',
    'admin.noPayouts': 'No payouts yet – wait for first competitions!',
    'admin.loadingAdmin': 'Loading admin panel...',
    'admin.noData': 'No data available – session expired or connection error',
    'admin.userList': 'Complete user list (live capital)',
    'admin.payoutsHistory': 'Payouts History (prizes paid)',

    // Common
    'common.usdt': 'USDT',
  }
};

const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('holypotLang') || 'es';
  });

  const t = useCallback((key) => {
    return translations[lang]?.[key] || translations['es']?.[key] || key;
  }, [lang]);

  const toggleLang = useCallback(() => {
    setLang(prev => {
      const next = prev === 'es' ? 'en' : 'es';
      localStorage.setItem('holypotLang', next);
      return next;
    });
  }, []);

  const setLanguage = useCallback((newLang) => {
    localStorage.setItem('holypotLang', newLang);
    setLang(newLang);
  }, []);

  return (
    <I18nContext.Provider value={{ t, lang, toggleLang, setLanguage }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export function LanguageToggle({ className = '' }) {
  const { lang, toggleLang } = useI18n();

  return (
    <button
      onClick={toggleLang}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium transition-all ${className}`}
      title={lang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
    >
      <span className="text-base">{lang === 'es' ? '🇪🇸' : '🇺🇸'}</span>
      <span>{lang === 'es' ? 'ES' : 'EN'}</span>
    </button>
  );
}

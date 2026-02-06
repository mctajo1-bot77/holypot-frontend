import React from 'react';
import background from "@/assets/background.jpg";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

const RulesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* Fondo */}
      <div className="fixed inset-0 -z-10">
        <img src={background} alt="Fondo" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Contenido principal */}
      <div className="max-w-4xl mx-auto px-8 py-32">
        <h1 className="text-5xl font-bold text-holy text-center mb-8">
          Reglas de las Competencias – Holypot Trading 🚀
        </h1>
        <p className="text-xl text-center text-gray-300 mb-12">
          Última actualización: 25 de enero de 2026
        </p>

        <p className="text-lg leading-relaxed mb-16 text-gray-200">
          La Plataforma Holypot Trading actúa exclusivamente como proveedor neutral de infraestructura técnica, árbitro imparcial y facilitador de pagos en escrow. No organiza ni promueve competencias directamente; facilita competencias diarias abiertas por nivel que se generan y activan únicamente cuando los usuarios alcanzan el mínimo requerido de participantes pagados.
        </p>

        <ol className="space-y-12 text-lg text-gray-200 list-decimal pl-8 marker:text-holy marker:font-bold">
          <li>
            <h3 className="text-2xl text-holy mb-4">1. Tipo de competencia</h3>
            <p>
              Competencias diarias skill-based 100% en trading simulado de divisas (FX), pares mayores, oro e índices seleccionados. El resultado depende exclusivamente de la habilidad, estrategia y gestión de riesgo del participante. No existe componente de azar.
            </p>
          </li>

          <li>
            <h3 className="text-2xl text-holy mb-4">2. Niveles de competencia</h3>
            <p>Existen tres niveles diarios independientes y abiertos:</p>
            <ul className="list-disc pl-10 mt-4 space-y-3 text-gray-300">
              <li>
                <strong>Basic</strong>: entrada de 12 USDT, capital virtual inicial de 10.000 USDT.
              </li>
              <li>
                <strong>Medium</strong>: entrada de 54 USDT, capital virtual inicial de 50.000 USDT.
              </li>
              <li>
                <strong>Premium</strong>: entrada de 107 USDT, capital virtual inicial de 100.000 USDT.
              </li>
            </ul>
            <p className="mt-4">
              Cada nivel tiene su propia competencia diaria y prize pool independiente, generado exclusivamente por las inscripciones de los usuarios.
            </p>
          </li>

          <li>
            <h3 className="text-2xl text-holy mb-4">3. Horario diario (UTC)</h3>
            <ul className="list-disc pl-10 mt-4 space-y-3 text-gray-300">
              <li>Apertura: 00:00 UTC.</li>
              <li>Mínimo requerido: 5 participantes pagados para que la competencia se active y sea válida.</li>
              <li>Última inscripción permitida: 18:00 UTC.</li>
              <li>Cierre definitivo: 21:00 UTC.</li>
              <li>Si a las 18:00 UTC no se alcanzan 5 participantes, las entradas pagadas se trasladan automáticamente y sin costo adicional al mismo nivel del día siguiente (rollover). No hay devolución de la entrada.</li>
            </ul>
          </li>

          <li>
            <h3 className="text-2xl text-holy mb-4">4. Inscripción y pago</h3>
            <p>
              El pago se realiza exclusivamente en USDT (red TRC20) a través del procesador NOWPayments. Una vez confirmado el pago, la inscripción es definitiva y no reembolsable (salvo rollover por falta de mínimo).
            </p>
          </li>

          <li>
            <h3 className="text-2xl text-holy mb-4">5. Prize pool y distribución</h3>
            <p>
              El prize pool de cada nivel se calcula como: total de entradas recolectadas − comisión de la plataforma (~10%).
            </p>
            <p className="mt-3">Distribución estándar (top 3):</p>
            <ul className="list-disc pl-10 mt-3 space-y-2 text-gray-300">
              <li>1er lugar: 50%</li>
              <li>2do lugar: 30%</li>
              <li>3er lugar: 20%</li>
            </ul>
          </li>

          <li>
            <h3 className="text-2xl text-holy mb-4">6. Reglas de trading simulado</h3>
            <ul className="list-disc pl-10 mt-4 space-y-3 text-gray-300">
              <li>Datos en tiempo real proporcionados por Finnhub y/o OANDA.</li>
              <li>Operaciones LONG/SHORT con precio de entrada exacto.</li>
              <li>Take Profit (TP) y Stop Loss (SL) opcionales y editables.</li>
              <li>Tamaño de lote ajustable (porcentaje de riesgo en vivo).</li>
              <li>Requisito mínimo: cerrar al menos 1 operación durante la competencia para aparecer en el ranking.</li>
            </ul>
          </li>

          <li>
            <h3 className="text-2xl text-holy mb-4">7. Cálculo de rendimiento</h3>
            <p>
              Retorno % = (capital final − capital inicial) / capital inicial × 100.
            </p>
          </li>

          <li>
            <h3 className="text-2xl text-holy mb-4">8. Métodos de desempate (orden secuencial)</h3>
            <p>En caso de empate exacto en retorno %:</p>
            <ol className="list-decimal pl-10 mt-4 space-y-3 text-gray-300">
              <li>Menor riesgo promedio utilizado (suma total de lot size o % riesgo promedio).</li>
              <li>Menor cantidad de operaciones realizadas.</li>
              <li>Menor drawdown máximo (%) durante la competencia.</li>
              <li>Timestamp más temprano de inscripción pagada.</li>
            </ol>
          </li>

          <li>
            <h3 className="text-2xl text-holy mb-4">9. Pago de premios</h3>
            <p>
              Los premios se abonan automáticamente (o manualmente en fase inicial) en USDT a la wallet del usuario inmediatamente después del cierre de la competencia válida.
            </p>
          </li>

          <li>
            <h3 className="text-2xl text-holy mb-4">10. Conducta prohibida</h3>
            <p>
              Queda estrictamente prohibido el uso de bots, cuentas múltiples, colusión, manipulación de resultados o cualquier conducta fraudulenta. La Plataforma se reserva el derecho de descalificar participantes y retener premios en caso de incumplimiento.
            </p>
          </li>
        </ol>

        <p className="mt-16 text-center text-gray-400 italic">
          Estas reglas forman parte integrante de los Términos y Condiciones de Uso de Holypot Trading SAS y pueden ser modificadas con notificación previa.
        </p>

        {/* BOTÓN VOLVER AL INICIO */}
        <div className="text-center mt-20">
          <Button 
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-holy to-purple-600 text-black text-2xl px-12 py-6 font-bold rounded-full shadow-lg hover:shadow-holy/50 hover:scale-105 transition duration-300"
          >
            ← Volver a Holypot Trading
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RulesPage;
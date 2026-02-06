import React from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import background from "@/assets/background.jpg";

const TermsPage = () => {
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
          Términos y Condiciones de Uso – Holypot Trading
        </h1>
        <p className="text-xl text-center text-gray-300 mb-12">
          Última actualización: 25 de enero de 2026
        </p>

        <div className="space-y-12 text-lg text-gray-200">
          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">1. Aceptación de los Términos</h2>
            <p>
              Al registrarte, acceder o utilizar la plataforma Holypot Trading (en adelante, la “Plataforma”), aceptas vincularte legalmente por estos Términos y Condiciones. Si no estás de acuerdo, no podrás usar la Plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">2. Elegibilidad</h2>
            <ul className="list-disc pl-8 space-y-3">
              <li>Debes tener al menos 18 años de edad o la mayoría de edad legal en tu jurisdicción.</li>
              <li>Quedan excluidos residentes de países o territorios donde las competencias con entrada pagada y premios en dinero estén prohibidas por la ley aplicable.</li>
              <li>La Plataforma se reserva el derecho de rechazar o cancelar cuentas en jurisdicciones restringidas.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">3. Naturaleza de la Plataforma</h2>
            <p className="mb-4">
              Holypot Trading es una plataforma tecnológica que permite competencias privadas de trading simulado de divisas (FX) basadas predominantemente en habilidad, conocimiento y estrategia.
            </p>
            <p className="mb-4">
              La Plataforma actúa exclusivamente como proveedor de infraestructura técnica, árbitro neutral y facilitador de pagos.
            </p>
            <p className="mb-4">
              No se trata de un juego de azar. No existe garantía de ganancias. El riesgo del usuario está limitado a la cuota de inscripción.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">4. Registro y Cuenta</h2>
            <ul className="list-disc pl-8 space-y-3">
              <li>Debes proporcionar información veraz, completa y actualizada.</li>
              <li>Eres responsable de mantener la confidencialidad de tus credenciales.</li>
              <li>La Plataforma podrá requerir verificación de identidad para retiros o cumplimiento legal.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">5. Creación, Inscripción y Reglas de las Competencias</h2>
            <ul className="list-disc pl-8 space-y-3">
              <li>Máximo 20 trades/día por usuario.</li>
              <li>LotSize 0.01-1.0 (risk 0.1%-10%).</li>
              <li>Órdenes market/limit/stop.</li>
              <li>Competencia activa con mínimo 5 participantes.</li>
              <li>Prohibido bots, multi-cuentas, colusión o fraude.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">6. Comisión de la Plataforma y Distribución de Premios</h2>
            <ul className="list-disc pl-8 space-y-3">
              <li>Comisión plataforma 8-10% sobre total cuotas.</li>
              <li>Prize pool restante: 1er 50%, 2do 30%, 3ro 20%.</li>
              <li>Premios reales USDT TRC20 directo wallet – mismo día cierre.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">7. Responsabilidad de los Usuarios</h2>
            <p>
              Cumplir leyes locales. Ganadores declaran/pagan impuestos aplicables.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">8. Retiros</h2>
            <p>
              Procesados vía métodos habilitados. Mínimo retiro + comisiones externas. Verificación adicional posible.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">9. Limitación de Responsabilidad</h2>
            <p>
              Plataforma “tal cual” sin garantías. Responsabilidad máxima limitada a comisiones pagadas últimos 30 días.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">10. Propiedad Intelectual</h2>
            <p>
              Todo contenido, software, marcas y diseño propiedad exclusiva Holypot Trading.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">11. Terminación y Suspensión</h2>
            <p>
              Suspensión/cierre cuentas por incumplimiento, fraude o riesgo legal.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">12. Ley Aplicable y Jurisdicción</h2>
            <p>
              Leyes República de Colombia. Tribunales Pereira, Risaralda.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">13. Modificaciones</h2>
            <p>
              Modificaciones notificadas con 15 días antelación por email/plataforma.
            </p>
          </section>
        </div>

        {/* BOTÓN VOLVER AL INICIO – EL QUE TE ENCANTÓ */}
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

export default TermsPage;
import React from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import background from "@/assets/background.jpg";

const PrivacyPage = () => {
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
          Política de Privacidad – Holypot Trading
        </h1>
        <p className="text-xl text-center text-gray-300 mb-12">
          Última actualización: 25 de enero de 2026
        </p>

        <div className="space-y-12 text-lg text-gray-200">
          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">1. Información que recolectamos</h2>
            <ul className="list-disc pl-8 space-y-3">
              <li>Datos de registro: email, contraseña, wallet TRC20, nickname, fecha nacimiento (verificación edad mayor 18).</li>
              <li>Datos transacciones: historial inscripciones, trades, payouts.</li>
              <li>Datos técnicos: IP, dispositivo, navegador (mejora servicio y seguridad).</li>
              <li>Datos KYC opcional: documento identidad (solo retiros altos o requerimiento legal).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">2. Finalidad del tratamiento</h2>
            <ul className="list-disc pl-8 space-y-3">
              <li>Prestar servicio plataforma (inscripciones, trading simulado, payouts reales).</li>
              <li>Cumplir obligaciones legales (AML, reporte tributario si aplica).</li>
              <li>Mejorar experiencia y seguridad (análisis uso, prevención fraude).</li>
              <li>Comunicaciones operativas (confirmación pago, resultados competencia).</li>
              <li>No marketing sin consentimiento expreso.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">3. Base legal</h2>
            <p>
              Ejecución contrato (Términos Uso), cumplimiento legal y consentimiento usuario.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">4. Compartición datos</h2>
            <p className="mb-4">Solo compartimos con:</p>
            <ul className="list-disc pl-8 space-y-3">
              <li>Procesadores pago (NOWPayments) y proveedores técnicos.</li>
              <li>Autoridades cuando ley lo exija.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">5. Seguridad</h2>
            <p>
              SSL, encriptación datos sensibles, acceso restringido, monitoreo constante.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">6. Derechos titular</h2>
            <p>
              Acceso, rectificación, supresión, revocación consentimiento. Envía solicitud a soporte@holypottrading.com.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">7. Transferencias internacionales</h2>
            <p>
              Proveedores (AWS, NOWPayments) fuera Colombia – estándares protección equivalentes GDPR-like.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-holy mb-6">8. Cambios política</h2>
            <p>
              Notificaremos modificaciones con antelación por email o plataforma.
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

export default PrivacyPage;
// ============================================================
// HOLYPOT — STUDENT SURVEY MODAL
// Shown at end of student competition. Submit survey to re-enter.
// ============================================================
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import apiClient from '@/api';
import { toast } from '@/components/Toaster';
import { GraduationCap, Star, Trophy, Send, AlertCircle } from 'lucide-react';

const STAR_LABELS = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', '¡Excelente!'];

export default function StudentSurveyModal({ data, onClose }) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [form, setForm] = useState({ likes: '', dislikes: '', suggestions: '', bugReport: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { toast.error('Por favor selecciona una calificación'); return; }
    if (!form.likes.trim()) { toast.error('Por favor indica qué te gustó'); return; }
    if (!form.dislikes.trim()) { toast.error('Por favor indica qué no te gustó'); return; }
    if (!form.suggestions.trim()) { toast.error('Por favor deja tus sugerencias'); return; }

    setLoading(true);
    try {
      await apiClient.post('/student/survey', {
        rating,
        likes: form.likes,
        dislikes: form.dislikes,
        suggestions: form.suggestions,
        bugReport: form.bugReport || undefined
      });
      setSubmitted(true);
      toast.success('¡Gracias por tu feedback! Ya puedes participar de nuevo mañana.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error enviando encuesta');
    } finally {
      setLoading(false);
    }
  };

  const myPosition = data?.myPosition;
  const myReturn = parseFloat(data?.myRetorno || 0);

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto"
        style={{ background: '#161616', border: '1px solid #2A2A2A', color: '#fff' }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-400">
            <GraduationCap className="w-5 h-5" /> Competencia Estudiante Finalizada
          </DialogTitle>
        </DialogHeader>

        {!submitted ? (
          <div className="space-y-4">
            {/* Results summary */}
            <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}>
              <div className="flex items-center justify-center gap-3 mb-2">
                {myPosition && myPosition <= 3 && <Trophy className="w-6 h-6 text-yellow-400" />}
                <span className="text-xl font-bold text-white">
                  {myReturn >= 0 ? '+' : ''}{myReturn.toFixed(2)}%
                </span>
              </div>
              {myPosition && (
                <p className="text-sm text-gray-400">
                  Terminaste en posición <span className="font-bold text-blue-300">#{myPosition}</span>
                </p>
              )}
              {data?.top3 && data.top3.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs text-gray-500 mb-2">Top 3 — Lo que habrías ganado en modo real:</p>
                  {data.top3.map(w => (
                    <div key={w.position} className="flex justify-between text-xs px-2">
                      <span className="text-gray-400">#{w.position} {w.nickname}</span>
                      <span className="text-yellow-400">~${w.realEquivalentPrize?.toFixed(2)} USDT</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg p-3 flex gap-2" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
              <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-300">
                Completa esta encuesta para poder participar en la siguiente competencia estudiante.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star rating */}
              <div>
                <label className="text-sm text-gray-400 block mb-2">¿Cómo calificarías tu experiencia?</label>
                <div className="flex gap-2 items-center">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className="w-7 h-7"
                        fill={(hoveredStar || rating) >= star ? '#FFD700' : 'none'}
                        stroke={(hoveredStar || rating) >= star ? '#FFD700' : '#6B7280'}
                      />
                    </button>
                  ))}
                  {(hoveredStar || rating) > 0 && (
                    <span className="text-xs text-gray-400 ml-1">{STAR_LABELS[hoveredStar || rating]}</span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">¿Qué te gustó de la plataforma? *</label>
                <textarea
                  name="likes"
                  value={form.likes}
                  onChange={handleChange}
                  rows={2}
                  placeholder="La interfaz, la facilidad de uso, los instrumentos..."
                  className="w-full px-3 py-2 rounded-md text-white text-sm resize-none focus:outline-none focus:border-blue-500"
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #374151' }}
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">¿Qué mejorarías o no te gustó? *</label>
                <textarea
                  name="dislikes"
                  value={form.dislikes}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Lo que se podría mejorar..."
                  className="w-full px-3 py-2 rounded-md text-white text-sm resize-none focus:outline-none focus:border-blue-500"
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #374151' }}
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Sugerencias para nosotros *</label>
                <textarea
                  name="suggestions"
                  value={form.suggestions}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Tus ideas y sugerencias..."
                  className="w-full px-3 py-2 rounded-md text-white text-sm resize-none focus:outline-none focus:border-blue-500"
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #374151' }}
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">¿Notaste algún error? (opcional)</label>
                <textarea
                  name="bugReport"
                  value={form.bugReport}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Describe el error si encontraste alguno..."
                  className="w-full px-3 py-2 rounded-md text-white text-sm resize-none focus:outline-none focus:border-blue-500"
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #374151' }}
                />
              </div>

              <Button type="submit" disabled={loading}
                className="w-full font-bold"
                style={{ background: loading ? '#333' : '#3b82f6', color: 'white' }}>
                {loading ? 'Enviando...' : (
                  <span className="flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" />
                    Enviar encuesta y confirmar participación
                  </span>
                )}
              </Button>
            </form>
          </div>
        ) : (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto">
              <GraduationCap className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white">¡Gracias por tu feedback!</h3>
            <p className="text-gray-400 text-sm">Tu participación nos ayuda a mejorar la plataforma.</p>
            <p className="text-blue-300 text-sm">Ya puedes inscribirte en la siguiente competencia estudiante.</p>
            <Button onClick={onClose} className="mt-4" style={{ background: '#3b82f6', color: 'white' }}>
              Cerrar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

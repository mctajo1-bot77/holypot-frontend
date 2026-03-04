// ============================================================
// HOLYPOT — FORUM PAGE
// Community discussion forum list
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import apiClient from '@/api';
import { toast, Toaster } from '@/components/Toaster';
import {
  MessageSquare, Users, Eye, ThumbsUp, Plus, Search, ArrowLeft,
  Clock, Tag, ImagePlus, X, TrendingUp
} from 'lucide-react';
import logo from '@/assets/Holypot-logo.webp';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function ForumCard({ forum, onClick }) {
  return (
    <button
      onClick={() => onClick(forum.id)}
      className="w-full text-left rounded-xl p-4 transition-all hover:border-gray-600 group"
      style={{ background: '#161616', border: '1px solid #2A2A2A' }}>
      <div className="flex gap-3">
        {forum.imageUrls?.[0] ? (
          <img src={forum.imageUrls[0]} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center text-2xl"
            style={{ background: '#1e1e2e' }}>
            💬
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm leading-tight group-hover:text-[#FFD700] transition-colors line-clamp-2">
            {forum.title}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{forum.content}</p>
          {forum.tags?.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-1.5">
              {forum.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,215,0,0.1)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.2)' }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{forum.commentCount || 0}</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{forum.memberCount || 0}</span>
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{forum.viewCount || 0}</span>
            <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{forum.likeCount || 0}</span>
            <span className="text-gray-600">•</span>
            <span className="text-gray-500">por {forum.creator}</span>
            <span className="ml-auto flex items-center gap-1">
              <Clock className="w-3 h-3" />{timeAgo(forum.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function ForumPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('holypotToken');

  const [forums, setForums] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create forum form
  const [createForm, setCreateForm] = useState({ title: '', content: '', tags: '', imageUrls: '' });
  const [creating, setCreating] = useState(false);

  const fetchForums = useCallback(async (p = 1, s = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p });
      if (s) params.set('search', s);
      const res = await apiClient.get(`/forum?${params}`);
      setForums(res.data.forums || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
      setPage(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchForums(1, '');
  }, [fetchForums]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchForums(1, search);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.title.trim() || !createForm.content.trim()) {
      toast.error('Título y contenido son requeridos');
      return;
    }
    if (!token) {
      toast.error('Inicia sesión para crear un foro');
      return;
    }
    setCreating(true);
    try {
      const tags = createForm.tags.split(',').map(t => t.trim()).filter(Boolean);
      const imageUrls = createForm.imageUrls.split(',').map(u => u.trim()).filter(Boolean);
      await apiClient.post('/forum', { title: createForm.title, content: createForm.content, tags, imageUrls });
      toast.success('¡Foro creado exitosamente!');
      setShowCreateModal(false);
      setCreateForm({ title: '', content: '', tags: '', imageUrls: '' });
      fetchForums(1, search);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error creando foro');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0A', color: '#fff' }}>
      <Toaster />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-800/60" style={{ background: 'rgba(10,10,10,0.95)' }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-gray-400 hover:text-white transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <img src={logo} alt="Holypot" className="h-7 w-auto" />
            <div>
              <span className="font-bold text-white">Foros</span>
              <p className="text-xs text-gray-500">Comunidad Holypot</p>
            </div>
          </div>
          {token && (
            <Button
              onClick={() => setShowCreateModal(true)}
              size="sm"
              className="flex items-center gap-1.5 font-semibold"
              style={{ background: '#FFD700', color: '#000' }}>
              <Plus className="w-4 h-4" />
              Nuevo Foro
            </Button>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Stats bar */}
        <div className="flex gap-4 text-sm text-gray-400">
          <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4" />{total} foros</span>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar foros..."
              className="pl-9 bg-gray-900/50 border-gray-700 text-white focus:border-yellow-500"
            />
          </div>
          <Button type="submit" variant="outline" className="border-gray-700 text-gray-300">
            Buscar
          </Button>
        </form>

        {/* Forum list */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-500 text-sm mt-2">Cargando foros...</p>
          </div>
        ) : forums.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <MessageSquare className="w-12 h-12 text-gray-700 mx-auto" />
            <p className="text-gray-500">No hay foros todavía.</p>
            {token && (
              <Button onClick={() => setShowCreateModal(true)} style={{ background: '#FFD700', color: '#000' }}>
                ¡Crea el primero!
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {forums.map(forum => (
              <ForumCard key={forum.id} forum={forum} onClick={(id) => navigate(`/forum/${id}`)} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex justify-center gap-2 pt-4">
            <Button
              onClick={() => fetchForums(page - 1, search)}
              disabled={page <= 1}
              variant="outline"
              size="sm"
              className="border-gray-700 text-gray-300 disabled:opacity-30">
              ← Anterior
            </Button>
            <span className="text-gray-400 text-sm flex items-center px-4">{page} / {pages}</span>
            <Button
              onClick={() => fetchForums(page + 1, search)}
              disabled={page >= pages}
              variant="outline"
              size="sm"
              className="border-gray-700 text-gray-300 disabled:opacity-30">
              Siguiente →
            </Button>
          </div>
        )}
      </div>

      {/* Create Forum Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg" style={{ background: '#161616', border: '1px solid #2A2A2A', color: '#fff' }}>
          <DialogHeader>
            <DialogTitle className="text-white">Crear nuevo foro</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Título *</label>
              <Input
                value={createForm.title}
                onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Título del foro..."
                maxLength={200}
                className="bg-black/40 border-gray-700 text-white focus:border-yellow-500"
              />
              <p className="text-xs text-gray-600 mt-1">{createForm.title.length}/200</p>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Contenido *</label>
              <textarea
                value={createForm.content}
                onChange={(e) => setCreateForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Escribe el contenido de tu foro... Comparte ideas, análisis, preguntas sobre trading en Holypot."
                rows={5}
                maxLength={5000}
                className="w-full px-3 py-2 rounded-md text-white text-sm resize-none focus:outline-none focus:border-yellow-500"
                style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #374151' }}
              />
              <p className="text-xs text-gray-600 mt-1">{createForm.content.length}/5000</p>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                <Tag className="w-3 h-3 inline mr-1" />
                Tags (separados por coma)
              </label>
              <Input
                value={createForm.tags}
                onChange={(e) => setCreateForm(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="trading, análisis, estrategia"
                className="bg-black/40 border-gray-700 text-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                <ImagePlus className="w-3 h-3 inline mr-1" />
                URLs de imágenes (separadas por coma, opcional)
              </label>
              <Input
                value={createForm.imageUrls}
                onChange={(e) => setCreateForm(prev => ({ ...prev, imageUrls: e.target.value }))}
                placeholder="https://imagen1.com/img.png, https://imagen2.com/img.jpg"
                className="bg-black/40 border-gray-700 text-white"
              />
            </div>
            <div className="text-xs text-gray-500 rounded-lg p-2" style={{ background: '#1a1a1a', border: '1px solid #2A2A2A' }}>
              ⚠️ No se permite publicidad de otras plataformas de trading.
            </div>
            <div className="flex gap-2">
              <Button type="button" onClick={() => setShowCreateModal(false)} variant="outline"
                className="flex-1 border-gray-700 text-gray-300">
                Cancelar
              </Button>
              <Button type="submit" disabled={creating} className="flex-1 font-bold"
                style={{ background: '#FFD700', color: '#000' }}>
                {creating ? 'Creando...' : 'Publicar Foro'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

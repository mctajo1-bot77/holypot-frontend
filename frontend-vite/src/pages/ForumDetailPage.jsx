// ============================================================
// HOLYPOT — FORUM DETAIL PAGE
// Individual forum thread with comments, likes, members
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import apiClient from '@/api';
import { toast, Toaster } from '@/components/Toaster';
import {
  ArrowLeft, ThumbsUp, ThumbsDown, MessageSquare, Users, Eye,
  Send, UserPlus, UserMinus, ImagePlus, Flag, Clock
} from 'lucide-react';
import logo from '@/assets/Holypot-logo.webp';

const COUNTRY_FLAGS = {
  AR: '🇦🇷', BO: '🇧🇴', BR: '🇧🇷', CL: '🇨🇱', CO: '🇨🇴', CR: '🇨🇷',
  MX: '🇲🇽', PE: '🇵🇪', VE: '🇻🇪', ES: '🇪🇸', US: '🇺🇸', OTHER: '🌍'
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function LikeBar({ likeCount, dislikeCount, userLike, onLike, onDislike, compact = false }) {
  const total = likeCount + dislikeCount;
  const likePercent = total > 0 ? (likeCount / total) * 100 : 50;

  return (
    <div className={`flex items-center gap-2 ${compact ? 'text-xs' : 'text-sm'}`}>
      <button
        onClick={onLike}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all ${
          userLike === 'like'
            ? 'bg-green-500/20 text-green-400 border border-green-500/40'
            : 'bg-gray-800/50 text-gray-400 hover:text-green-400 border border-transparent'
        }`}>
        <ThumbsUp className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
        <span>{likeCount}</span>
      </button>
      <button
        onClick={onDislike}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all ${
          userLike === 'dislike'
            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
            : 'bg-gray-800/50 text-gray-400 hover:text-red-400 border border-transparent'
        }`}>
        <ThumbsDown className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
        <span>{dislikeCount}</span>
      </button>
      {!compact && total > 0 && (
        <div className="flex-1 max-w-24 h-1.5 rounded-full bg-gray-700 overflow-hidden">
          <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${likePercent}%` }} />
        </div>
      )}
    </div>
  );
}

export default function ForumDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('holypotToken');

  const [forum, setForum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [commentImageUrl, setCommentImageUrl] = useState('');
  const [posting, setPosting] = useState(false);
  const [joiningForum, setJoiningForum] = useState(false);

  const fetchForum = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/forum/${id}`);
      setForum(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Error cargando el foro');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchForum();
  }, [fetchForum]);

  const handleForumLike = async (type) => {
    if (!token) { toast.error('Inicia sesión para interactuar'); return; }
    try {
      const res = await apiClient.post(`/forum/${id}/like`, { type });
      setForum(prev => {
        const wasLike = prev.userLike === 'like';
        const wasDislike = prev.userLike === 'dislike';
        let likeCount = prev.likeCount;
        let dislikeCount = prev.dislikeCount;

        if (res.data.action === 'removed') {
          if (type === 'like') likeCount--;
          else dislikeCount--;
        } else if (res.data.action === 'added') {
          if (type === 'like') likeCount++;
          else dislikeCount++;
        } else if (res.data.action === 'changed') {
          if (type === 'like') { likeCount++; dislikeCount--; }
          else { dislikeCount++; likeCount--; }
        }

        return { ...prev, userLike: res.data.type, likeCount: Math.max(0, likeCount), dislikeCount: Math.max(0, dislikeCount) };
      });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  const handleCommentLike = async (commentId, type) => {
    if (!token) { toast.error('Inicia sesión para interactuar'); return; }
    try {
      const res = await apiClient.post(`/forum/comment/${commentId}/like`, { type });
      setForum(prev => ({
        ...prev,
        comments: prev.comments.map(c => {
          if (c.id !== commentId) return c;
          let likeCount = c.likeCount;
          let dislikeCount = c.dislikeCount;
          if (res.data.action === 'removed') {
            if (type === 'like') likeCount--; else dislikeCount--;
          } else if (res.data.action === 'added') {
            if (type === 'like') likeCount++; else dislikeCount++;
          } else {
            if (type === 'like') { likeCount++; dislikeCount--; } else { dislikeCount++; likeCount--; }
          }
          return { ...c, userLike: res.data.type, likeCount: Math.max(0, likeCount), dislikeCount: Math.max(0, dislikeCount) };
        })
      }));
    } catch (err) {
      toast.error('Error');
    }
  };

  const handleJoin = async () => {
    if (!token) { toast.error('Inicia sesión para unirte'); return; }
    setJoiningForum(true);
    try {
      const res = await apiClient.post(`/forum/${id}/join`);
      const joined = res.data.action === 'joined';
      setForum(prev => ({
        ...prev,
        isMember: joined,
        memberCount: joined ? prev.memberCount + 1 : Math.max(0, prev.memberCount - 1)
      }));
      toast.success(joined ? 'Te uniste al foro' : 'Saliste del foro');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    } finally {
      setJoiningForum(false);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!token) { toast.error('Inicia sesión para comentar'); return; }
    if (!commentText.trim()) { toast.error('El comentario no puede estar vacío'); return; }
    setPosting(true);
    try {
      const res = await apiClient.post(`/forum/${id}/comment`, {
        content: commentText.trim(),
        imageUrl: commentImageUrl.trim() || undefined
      });
      setForum(prev => ({
        ...prev,
        comments: [...prev.comments, res.data.comment],
        commentCount: prev.commentCount + 1
      }));
      setCommentText('');
      setCommentImageUrl('');
      toast.success('Comentario publicado');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error publicando comentario');
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0A' }}>
        <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!forum) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0A' }}>
        <div className="text-center space-y-3">
          <p className="text-gray-400">Foro no encontrado</p>
          <Link to="/forum"><Button variant="outline">← Volver al foro</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0A', color: '#fff' }}>
      <Toaster />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-800/60" style={{ background: 'rgba(10,10,10,0.95)' }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/forum" className="text-gray-400 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <img src={logo} alt="Holypot" className="h-6 w-auto" />
          <span className="text-sm text-gray-400 truncate">Foros</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Forum post */}
        <div className="rounded-2xl p-6 space-y-4" style={{ background: '#161616', border: '1px solid #2A2A2A' }}>
          {/* Meta */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white leading-tight">{forum.title}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                <span>{COUNTRY_FLAGS[forum.creator?.country] || '🌍'} {forum.creator?.nickname || 'Anónimo'}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(forum.createdAt)}</span>
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{forum.viewCount}</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{forum.memberCount} miembros</span>
                <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{forum.commentCount}</span>
              </div>
            </div>
            {token && !forum.isCreator && (
              <Button
                onClick={handleJoin}
                disabled={joiningForum}
                size="sm"
                className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold ${forum.isMember ? 'bg-gray-700 text-gray-300' : ''}`}
                style={forum.isMember ? {} : { background: '#FFD700', color: '#000' }}>
                {forum.isMember ? <><UserMinus className="w-3.5 h-3.5" />Salir</> : <><UserPlus className="w-3.5 h-3.5" />Unirse</>}
              </Button>
            )}
          </div>

          {/* Tags */}
          {forum.tags?.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {forum.tags.map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,215,0,0.1)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.2)' }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Content */}
          <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap border-t border-gray-800 pt-4">
            {forum.content}
          </div>

          {/* Images */}
          {forum.imageUrls?.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {forum.imageUrls.map((url, i) => (
                <img key={i} src={url} alt={`imagen ${i + 1}`} className="rounded-lg w-full object-cover max-h-60" />
              ))}
            </div>
          )}

          {/* Like bar */}
          <div className="border-t border-gray-800 pt-4">
            <LikeBar
              likeCount={forum.likeCount}
              dislikeCount={forum.dislikeCount}
              userLike={forum.userLike}
              onLike={() => handleForumLike('like')}
              onDislike={() => handleForumLike('dislike')}
            />
          </div>
        </div>

        {/* Comments section */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-300 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            {forum.commentCount} comentario{forum.commentCount !== 1 ? 's' : ''}
          </h2>

          {/* Post comment form */}
          {token ? (
            <form onSubmit={handlePostComment} className="rounded-xl p-4 space-y-3"
              style={{ background: '#161616', border: '1px solid #2A2A2A' }}>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Escribe tu comentario..."
                rows={3}
                maxLength={2000}
                className="w-full px-3 py-2 rounded-md text-white text-sm resize-none focus:outline-none focus:border-yellow-500"
                style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #374151' }}
              />
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={commentImageUrl}
                  onChange={(e) => setCommentImageUrl(e.target.value)}
                  placeholder="URL de imagen (opcional)"
                  className="flex-1 px-3 py-1.5 rounded-md text-white text-xs focus:outline-none focus:border-yellow-500"
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #374151' }}
                />
                <Button type="submit" disabled={posting} size="sm"
                  className="flex items-center gap-1.5 font-semibold"
                  style={{ background: '#FFD700', color: '#000' }}>
                  <Send className="w-3.5 h-3.5" />
                  {posting ? 'Publicando...' : 'Comentar'}
                </Button>
              </div>
              <p className="text-xs text-gray-600">{commentText.length}/2000 · No se permite publicidad de otras plataformas</p>
            </form>
          ) : (
            <div className="rounded-xl p-4 text-center text-sm text-gray-500"
              style={{ background: '#161616', border: '1px solid #2A2A2A' }}>
              <Link to="/login" className="text-yellow-400 underline">Inicia sesión</Link> para comentar
            </div>
          )}

          {/* Comments list */}
          <div className="space-y-3">
            {forum.comments?.length === 0 && (
              <p className="text-center text-gray-600 py-8">Sé el primero en comentar</p>
            )}
            {forum.comments?.map(comment => (
              <div key={comment.id} className="rounded-xl p-4 space-y-3"
                style={{ background: '#161616', border: '1px solid #2A2A2A' }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: '#2A2A2A' }}>
                    {(comment.author || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-200">
                      {COUNTRY_FLAGS[comment.country] || '🌍'} {comment.author}
                    </span>
                    <span className="text-xs text-gray-600 ml-2">{timeAgo(comment.createdAt)}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{comment.content}</p>
                {comment.imageUrl && (
                  <img src={comment.imageUrl} alt="captura" className="rounded-lg max-h-60 object-cover" />
                )}
                <LikeBar
                  likeCount={comment.likeCount}
                  dislikeCount={comment.dislikeCount}
                  userLike={comment.userLike}
                  onLike={() => handleCommentLike(comment.id, 'like')}
                  onDislike={() => handleCommentLike(comment.id, 'dislike')}
                  compact
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

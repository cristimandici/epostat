'use client';
import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Send, Search, BadgeCheck, ArrowLeft, MessageCircle, ImagePlus, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { timeAgo } from '@/lib/data';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=100&auto=format';

interface Conversation {
  id: string;
  ad_id: string;
  ad_title: string;
  ad_image: string;
  buyer_id: string;
  seller_id: string;
  last_message: string | null;
  last_message_at: string;
  my_unread: number;
  other_name: string;
  other_avatar: string | null;
  other_verified: boolean;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string | null;
  type?: 'text' | 'image';
  media_url?: string | null;
  created_at: string;
}

function Avatar({ name, avatar, size = 'md' }: { name: string; avatar: string | null; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'w-9 h-9 text-sm' : 'w-11 h-11 text-sm';
  return avatar ? (
    <img src={avatar} alt={name} className={`${cls} rounded-full border border-slate-200 object-cover shrink-0`} />
  ) : (
    <div className={`${cls} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0`}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [userId, setUserId] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [pendingDeleteMsg, setPendingDeleteMsg] = useState<Message | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const touchStartX = useRef(0);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const mobileMessagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);

  const activeConv = conversations.find(c => c.id === activeId);

  const scrollToBottom = () => {
    [messagesContainerRef, mobileMessagesContainerRef].forEach(ref => {
      if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
    });
  };

  const loadConversations = useCallback(async (uid: string) => {
    const { data: convData } = await supabase
      .from('conversations')
      .select('*, ads(title, images)')
      .or(`buyer_id.eq.${uid},seller_id.eq.${uid}`)
      .order('last_message_at', { ascending: false });

    if (!convData) return;

    const otherIds = convData.map(c => c.buyer_id === uid ? c.seller_id : c.buyer_id);
    const uniqueIds = [...new Set(otherIds)];

    const { data: profiles } = uniqueIds.length > 0
      ? await supabase.from('profiles').select('id, name, avatar_url, verified').in('id', uniqueIds)
      : { data: [] };

    const profMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));

    const mapped: Conversation[] = convData.map(c => {
      const otherId = c.buyer_id === uid ? c.seller_id : c.buyer_id;
      const other = profMap[otherId];
      const ad = c.ads as { title: string; images: string[] } | null;
      return {
        id: c.id,
        ad_id: c.ad_id,
        ad_title: ad?.title || 'Anunț șters',
        ad_image: ad?.images?.[0] || PLACEHOLDER_IMG,
        buyer_id: c.buyer_id,
        seller_id: c.seller_id,
        last_message: c.last_message,
        last_message_at: c.last_message_at || c.created_at,
        my_unread: c.buyer_id === uid ? (c.buyer_unread || 0) : (c.seller_unread || 0),
        other_name: other?.name || 'Utilizator',
        other_avatar: other?.avatar_url || null,
        other_verified: other?.verified || false,
      };
    });

    setConversations(mapped);
  }, [supabase]);

  const loadMessages = useCallback(async (convId: string) => {
    setMessagesLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    setMessages((data || []) as Message[]);
    setMessagesLoading(false);

    await supabase.rpc('mark_conversation_read', { p_conversation_id: convId });
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, my_unread: 0 } : c));
  }, [supabase]);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login?redirect=/mesaje'); return; }
      setUserId(user.id);
      await loadConversations(user.id);
      setLoading(false);

      const convFromUrl = searchParams.get('conv');
      if (convFromUrl) {
        setActiveId(convFromUrl);
        setMobileView('chat');
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (activeId && userId) loadMessages(activeId);
  }, [activeId, userId]);

  useEffect(() => {
    if (!activeId || !userId) return;
    const channel = supabase
      .channel(`messages_conv_${activeId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${activeId}`,
      }, payload => {
        const newMsg = payload.new as Message;
        setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
        if (newMsg.sender_id !== userId) {
          supabase.rpc('mark_conversation_read', { p_conversation_id: activeId });
        }
      })
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${activeId}`,
      }, payload => {
        const deletedId = (payload.old as { id: string }).id;
        if (deletedId) setMessages(prev => prev.filter(m => m.id !== deletedId));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeId, userId]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`conversations_user_${userId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' }, () => loadConversations(userId))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversations' }, () => loadConversations(userId))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, loadConversations]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const imageMessages = messages.filter(m => m.type === 'image' && m.media_url);

  useEffect(() => {
    if (lightboxIdx === null) { document.body.style.overflow = ''; return; }
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIdx(null);
      if (e.key === 'ArrowLeft') setLightboxIdx(i => (i !== null && i > 0 ? i - 1 : i));
      if (e.key === 'ArrowRight') setLightboxIdx(i => (i !== null && i < imageMessages.length - 1 ? i + 1 : i));
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [lightboxIdx, imageMessages.length]);

  const openConversation = (id: string) => {
    setActiveId(id);
    setMobileView('chat');
    setTimeout(() => mobileInputRef.current?.focus(), 150);
  };

  const sendMessage = async (fromMobile = false) => {
    const text = input.trim();
    if (!text || !activeId || sending) return;
    setSending(true);
    setInput('');

    const { data: msgId, error } = await supabase.rpc('send_message', {
      p_conversation_id: activeId,
      p_text: text,
    });

    if (!error && msgId) {
      const tempMsg: Message = {
        id: msgId as string,
        conversation_id: activeId,
        sender_id: userId,
        text,
        type: 'text',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => prev.some(m => m.id === tempMsg.id) ? prev : [...prev, tempMsg]);
      setConversations(prev =>
        prev.map(c => c.id === activeId ? { ...c, last_message: text, last_message_at: new Date().toISOString() } : c)
          .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
      );
    }

    setSending(false);
    (fromMobile ? mobileInputRef : inputRef).current?.focus();
  };

  const handleImageUpload = async (file: File, fromMobile = false) => {
    if (!activeId || uploadingImage) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 10 * 1024 * 1024) return;

    setUploadingImage(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${userId}/${activeId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-images')
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (uploadError) { setUploadingImage(false); return; }

    const { data: urlData } = supabase.storage.from('chat-images').getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    const { data: msgId, error } = await supabase.rpc('send_message', {
      p_conversation_id: activeId,
      p_text: null,
      p_type: 'image',
      p_media_url: publicUrl,
    });

    if (!error && msgId) {
      const tempMsg: Message = {
        id: msgId as string,
        conversation_id: activeId,
        sender_id: userId,
        text: null,
        type: 'image',
        media_url: publicUrl,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => prev.some(m => m.id === tempMsg.id) ? prev : [...prev, tempMsg]);
      setConversations(prev =>
        prev.map(c => c.id === activeId ? { ...c, last_message: '📷 Imagine', last_message_at: new Date().toISOString() } : c)
          .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
      );
    }

    setUploadingImage(false);
    (fromMobile ? mobileFileInputRef : fileInputRef).current && ((fromMobile ? mobileFileInputRef : fileInputRef).current!.value = '');
    (fromMobile ? mobileInputRef : inputRef).current?.focus();
  };

  const deleteMessage = async (msg: Message) => {
    if (deletingMessageId) return;
    setDeletingMessageId(msg.id);
    const { error } = await supabase.rpc('delete_message', { p_message_id: msg.id });
    if (!error) {
      setMessages(prev => prev.filter(m => m.id !== msg.id));
      if (msg.type === 'image' && msg.media_url) {
        const marker = '/chat-images/';
        const idx = msg.media_url.indexOf(marker);
        if (idx !== -1) {
          await supabase.storage.from('chat-images').remove([msg.media_url.slice(idx + marker.length)]);
        }
      }
    }
    setDeletingMessageId(null);
  };

  const startLongPress = (msg: Message) => {
    longPressTimer.current = setTimeout(() => setPendingDeleteMsg(msg), 500);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };
  const confirmDelete = async () => {
    if (!pendingDeleteMsg) return;
    const msg = pendingDeleteMsg;
    setPendingDeleteMsg(null);
    await deleteMessage(msg);
  };

  const filteredConvs = conversations.filter(c =>
    !searchQuery ||
    c.other_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.ad_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const otherId = activeConv
    ? (activeConv.buyer_id === userId ? activeConv.seller_id : activeConv.buyer_id)
    : '';

  const MessageBubbles = () => (
    <>
      {messagesLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
          <MessageCircle className="w-10 h-10 opacity-30" />
          <p className="text-sm">Niciun mesaj. Începe conversația!</p>
        </div>
      ) : messages.map(msg => {
        const isMe = msg.sender_id === userId;
        const isDeleting = deletingMessageId === msg.id;
        return (
          <div
            key={msg.id}
            className={cn('flex items-end gap-2 group', isMe ? 'justify-end' : 'justify-start')}
            onTouchStart={() => isMe && startLongPress(msg)}
            onTouchEnd={cancelLongPress}
            onTouchMove={cancelLongPress}
            onTouchCancel={cancelLongPress}
            onContextMenu={e => isMe && e.preventDefault()}
          >
            {!isMe && activeConv && (
              <Link href={`/utilizator/${otherId}`} className="shrink-0 mb-0.5" title={`Vezi profilul ${activeConv.other_name}`}>
                {activeConv.other_avatar ? (
                  <img src={activeConv.other_avatar} alt={activeConv.other_name}
                    className="w-7 h-7 rounded-full border border-slate-200 object-cover hover:opacity-80 transition" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs hover:opacity-80 transition">
                    {activeConv.other_name[0]?.toUpperCase()}
                  </div>
                )}
              </Link>
            )}
            {isMe && (
              <button
                onClick={() => setPendingDeleteMsg(msg)}
                disabled={!!deletingMessageId}
                className="hidden sm:flex opacity-0 group-hover:opacity-100 p-1.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition shrink-0 mb-0.5"
                aria-label="Șterge mesaj"
              >
                {isDeleting
                  ? <div className="w-3.5 h-3.5 border border-slate-400 border-t-transparent rounded-full animate-spin" />
                  : <Trash2 className="w-3.5 h-3.5" />
                }
              </button>
            )}
            <div className={cn(
              'max-w-[75%] rounded-2xl text-sm overflow-hidden',
              msg.type === 'image' ? '' : 'px-4 py-2.5',
              isMe ? 'bg-[#2563EB] text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'
            )}>
              {msg.type === 'image' && msg.media_url ? (
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      const idx = imageMessages.findIndex(m => m.id === msg.id);
                      if (idx !== -1) setLightboxIdx(idx);
                    }}
                    className="block w-full cursor-zoom-in"
                  >
                    <img src={msg.media_url} alt="Imagine" className="max-w-full max-h-60 object-cover block" />
                  </button>
                  <p className={cn('text-xs px-3 py-1.5', isMe ? 'text-blue-200' : 'text-slate-400')}>
                    {timeAgo(msg.created_at)}
                  </p>
                </div>
              ) : (
                <>
                  <p className="break-words whitespace-pre-wrap">{msg.text}</p>
                  <p className={cn('text-xs mt-1', isMe ? 'text-blue-200' : 'text-slate-400')}>
                    {timeAgo(msg.created_at)}
                  </p>
                </>
              )}
            </div>
          </div>
        );
      })}
    </>
  );

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      {/* ── LIGHTBOX ── */}
      {lightboxIdx !== null && imageMessages[lightboxIdx] && (
        <div
          className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-md flex items-center justify-center"
          onClick={() => setLightboxIdx(null)}
          onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={e => {
            const diff = touchStartX.current - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) {
              if (diff > 0) setLightboxIdx(i => (i !== null && i < imageMessages.length - 1 ? i + 1 : i));
              else setLightboxIdx(i => (i !== null && i > 0 ? i - 1 : i));
            }
          }}
        >
          <button
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition z-10"
            onClick={() => setLightboxIdx(null)}
            aria-label="Închide"
          >
            <X className="w-6 h-6" />
          </button>

          {imageMessages.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium select-none">
              {lightboxIdx + 1} / {imageMessages.length}
            </div>
          )}

          {lightboxIdx > 0 && (
            <button
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition z-10"
              onClick={e => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}
              aria-label="Anterioară"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {lightboxIdx < imageMessages.length - 1 && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition z-10"
              onClick={e => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}
              aria-label="Următoarea"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          <img
            src={imageMessages[lightboxIdx].media_url!}
            alt="Imagine"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* ── DELETE CONFIRMATION ── */}
      {pendingDeleteMsg && (
        <div
          className="fixed inset-0 z-[500] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPendingDeleteMsg(null)}
        >
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-xs" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-slate-900 text-base mb-1">Ștergi mesajul?</h3>
            <p className="text-slate-500 text-sm mb-5">Acțiunea nu poate fi anulată.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setPendingDeleteMsg(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
              >
                Anulează
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition"
              >
                Șterge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE FULL-SCREEN CHAT ── */}
      {mobileView === 'chat' && activeConv && (
        <div
          className="sm:hidden fixed inset-0 z-[200] bg-white flex flex-col"
          style={{ height: '100dvh' }}
        >
          {/* Header */}
          <div className="shrink-0 px-4 border-b border-slate-200 bg-white flex items-center gap-3"
            style={{ paddingTop: 'max(12px, env(safe-area-inset-top))', paddingBottom: '12px' }}>
            <button
              onClick={() => setMobileView('list')}
              className="p-2 -ml-1 rounded-xl text-slate-500 hover:bg-slate-100 transition"
              aria-label="Înapoi"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Link href={`/utilizator/${otherId}`} className="hover:opacity-80 transition">
              <Avatar name={activeConv.other_name} avatar={activeConv.other_avatar} size="sm" />
            </Link>
            <Link href={`/utilizator/${otherId}`} className="flex-1 min-w-0 hover:opacity-70 transition">
              <p className="font-bold text-slate-900 text-sm leading-tight">{activeConv.other_name}</p>
              <p className="text-xs text-slate-500 truncate">{activeConv.ad_title}</p>
            </Link>
          </div>

          {/* Messages */}
          <div ref={mobileMessagesContainerRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            <MessageBubbles />
          </div>

          {/* Input */}
          <div
            className="shrink-0 p-3 border-t border-slate-200 bg-white"
            style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
          >
            <input
              ref={mobileFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, true); }}
            />
            <form onSubmit={e => { e.preventDefault(); sendMessage(true); }} className="flex gap-2">
              <button
                type="button"
                onClick={() => mobileFileInputRef.current?.click()}
                disabled={uploadingImage || !activeId}
                className="w-12 h-12 rounded-xl border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 transition shrink-0"
                aria-label="Trimite imagine"
              >
                {uploadingImage ? (
                  <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ImagePlus className="w-5 h-5" />
                )}
              </button>
              <input
                ref={mobileInputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Scrie un mesaj..."
                disabled={sending}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                style={{ fontSize: '16px' }}
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="w-12 h-12 rounded-xl bg-[#2563EB] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[#1D4ED8] transition shrink-0"
                aria-label="Trimite"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── MAIN LAYOUT (desktop split + mobile list) ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-black text-slate-900 mb-6">Mesaje</h1>

        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm flex" style={{ height: 'min(600px, calc(100dvh - 180px))' }}>
          {/* Conversation list */}
          <div className="w-full sm:w-72 border-r border-slate-200 flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Caută conversații..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConvs.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Nicio conversație</p>
                  <p className="text-xs mt-1 leading-relaxed">Apasă „Trimite mesaj" pe un anunț pentru a începe</p>
                </div>
              ) : filteredConvs.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => openConversation(conv.id)}
                  className={cn(
                    'w-full text-left p-4 flex gap-3 border-b border-slate-100 hover:bg-slate-50 transition',
                    activeId === conv.id && 'bg-blue-50 border-blue-100'
                  )}
                >
                  <div className="relative shrink-0">
                    <Avatar name={conv.other_name} avatar={conv.other_avatar} />
                    {conv.other_verified && (
                      <BadgeCheck className="absolute -bottom-0.5 -right-0.5 w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-semibold text-slate-900 text-sm truncate">{conv.other_name}</p>
                      <span className="text-xs text-slate-400 shrink-0">{timeAgo(conv.last_message_at)}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{conv.ad_title}</p>
                    <p className={cn('text-xs mt-0.5 truncate', conv.my_unread > 0 ? 'font-semibold text-slate-800' : 'text-slate-400')}>
                      {conv.last_message || '—'}
                    </p>
                  </div>
                  {conv.my_unread > 0 && (
                    <span className="shrink-0 self-start mt-1 w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                      {conv.my_unread > 9 ? '9+' : conv.my_unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop chat panel */}
          <div className="hidden sm:flex flex-1 flex-col min-w-0">
            {activeConv ? (
              <>
                <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-3 shrink-0">
                  <Link href={`/utilizator/${otherId}`} className="hover:opacity-80 transition">
                    <Avatar name={activeConv.other_name} avatar={activeConv.other_avatar} size="sm" />
                  </Link>
                  <Link href={`/utilizator/${otherId}`} className="flex-1 min-w-0 hover:opacity-70 transition">
                    <p className="font-bold text-slate-900 text-sm">{activeConv.other_name}</p>
                    <p className="text-xs text-slate-500 truncate">{activeConv.ad_title}</p>
                  </Link>
                </div>

                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                  <MessageBubbles />
                </div>

                <div className="p-3 border-t border-slate-200 shrink-0">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, false); }}
                  />
                  <form onSubmit={e => { e.preventDefault(); sendMessage(false); }} className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage || !activeId}
                      className="w-10 h-10 rounded-xl border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 transition shrink-0"
                      aria-label="Trimite imagine"
                    >
                      {uploadingImage ? (
                        <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <ImagePlus className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      placeholder="Scrie un mesaj..."
                      disabled={sending}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || sending}
                      className="w-10 h-10 rounded-xl bg-[#2563EB] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[#1D4ED8] transition shrink-0"
                      aria-label="Trimite"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 p-8 text-center">
                <MessageCircle className="w-14 h-14 opacity-20" />
                <p className="font-medium text-slate-600">Selectează o conversație</p>
                <p className="text-sm">Alege din lista din stânga sau trimite un mesaj dintr-un anunț</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="max-w-5xl mx-auto px-4 py-20 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}

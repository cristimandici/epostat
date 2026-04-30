'use client';
import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Send, Search, BadgeCheck, ArrowLeft, MessageCircle } from 'lucide-react';
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
  text: string;
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
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const mobileMessagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

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
        return (
          <div key={msg.id} className={cn('flex items-end gap-2', isMe ? 'justify-end' : 'justify-start')}>
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
            <div className={cn(
              'max-w-[75%] px-4 py-2.5 rounded-2xl text-sm',
              isMe ? 'bg-[#2563EB] text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'
            )}>
              <p className="break-words whitespace-pre-wrap">{msg.text}</p>
              <p className={cn('text-xs mt-1', isMe ? 'text-blue-200' : 'text-slate-400')}>
                {timeAgo(msg.created_at)}
              </p>
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
            <form onSubmit={e => { e.preventDefault(); sendMessage(true); }} className="flex gap-2">
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
                  <form onSubmit={e => { e.preventDefault(); sendMessage(false); }} className="flex gap-2">
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

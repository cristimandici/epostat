'use client';
import { useState } from 'react';
import { Send, Search, BadgeCheck, ArrowLeft } from 'lucide-react';
import { DEMO_CONVERSATIONS } from '@/lib/data';
import { Conversation, Message } from '@/lib/types';
import { timeAgo } from '@/lib/data';
import { cn } from '@/lib/utils';

const ME_ID = 'u3';

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>(DEMO_CONVERSATIONS);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  const active = conversations.find((c) => c.id === activeId);

  const openConversation = (id: string) => {
    setActiveId(id);
    setMobileView('chat');
    // Mark as read
    setConversations((prev) => prev.map((c) => c.id === id
      ? { ...c, unread: 0, messages: c.messages.map((m) => ({ ...m, read: true })) }
      : c
    ));
  };

  const sendMessage = () => {
    if (!input.trim() || !activeId) return;
    const newMsg: Message = {
      id: Date.now().toString(),
      fromId: ME_ID,
      fromName: 'Eu',
      text: input.trim(),
      timestamp: new Date().toISOString(),
      read: true,
    };
    setConversations((prev) => prev.map((c) => c.id === activeId
      ? { ...c, messages: [...c.messages, newMsg], lastMessage: newMsg.text, lastMessageAt: newMsg.timestamp }
      : c
    ));
    setInput('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-black text-slate-900 mb-6">Mesaje</h1>

      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm flex" style={{ height: '600px' }}>
        {/* Conversation list */}
        <div className={cn(
          'w-full sm:w-72 border-r border-slate-200 flex flex-col',
          mobileView === 'chat' && 'hidden sm:flex'
        )}>
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="search"
                placeholder="Caută conversații..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <p className="text-4xl mb-2">💬</p>
                <p className="text-sm">Nicio conversație</p>
              </div>
            ) : conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => openConversation(conv.id)}
                className={cn(
                  'w-full text-left p-4 flex gap-3 border-b border-slate-100 hover:bg-slate-50 transition',
                  activeId === conv.id && 'bg-blue-50 border-blue-100'
                )}
              >
                <div className="relative shrink-0">
                  <img
                    src={conv.otherUser.avatar || ''}
                    alt={conv.otherUser.name}
                    className="w-11 h-11 rounded-full border border-slate-200"
                  />
                  {conv.otherUser.verified && (
                    <BadgeCheck className="absolute -bottom-0.5 -right-0.5 w-4 h-4 text-blue-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-semibold text-slate-900 text-sm truncate">{conv.otherUser.name}</p>
                    <span className="text-xs text-slate-400 shrink-0">{timeAgo(conv.lastMessageAt)}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{conv.adTitle}</p>
                  <p className={cn('text-xs mt-0.5 truncate', conv.unread > 0 ? 'font-semibold text-slate-800' : 'text-slate-400')}>
                    {conv.lastMessage}
                  </p>
                </div>
                {conv.unread > 0 && (
                  <span className="shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                    {conv.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat panel */}
        <div className={cn('flex-1 flex flex-col', mobileView === 'list' && 'hidden sm:flex')}>
          {active ? (
            <>
              {/* Chat header */}
              <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-3">
                <button
                  className="sm:hidden p-1 rounded-lg text-slate-500 hover:bg-slate-100 transition"
                  onClick={() => setMobileView('list')}
                  aria-label="Înapoi"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <img src={active.otherUser.avatar || ''} alt={active.otherUser.name} className="w-9 h-9 rounded-full border border-slate-200" />
                <div>
                  <p className="font-bold text-slate-900 text-sm">{active.otherUser.name}</p>
                  <p className="text-xs text-slate-500 truncate max-w-[200px]">{active.adTitle}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {active.messages.map((msg) => {
                  const isMe = msg.fromId === ME_ID;
                  return (
                    <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                      <div className={cn(
                        'max-w-[75%] px-4 py-2.5 rounded-2xl text-sm',
                        isMe ? 'bg-[#2563EB] text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                      )}>
                        <p>{msg.text}</p>
                        <p className={cn('text-xs mt-1', isMe ? 'text-blue-200' : 'text-slate-400')}>
                          {timeAgo(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input */}
              <div className="p-3 border-t border-slate-200">
                <form
                  onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Scrie un mesaj..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="w-10 h-10 rounded-xl bg-[#2563EB] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[#1D4ED8] transition"
                    aria-label="Trimite"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <div className="text-5xl mb-4">💬</div>
              <p className="font-medium">Selectează o conversație</p>
              <p className="text-sm mt-1">Alege din lista din stânga</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Send, MessageCircle, ArrowLeft } from 'lucide-react';
import { API_URL } from '../../config';
import { fetchWithAuth } from '../../auth';
import { useWhatsapp } from '../../whatsapp-context';
import type { WhatsAppChat, WhatsAppMessage } from '../../types';

export function ChatPanel({ companyId }: { companyId: string }) {
  const { socket } = useWhatsapp();
  const [chats, setChats] = useState<WhatsAppChat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadChats = () => {
    fetchWithAuth(`${API_URL}/whatsapp/${companyId}/chats`)
      .then((res) => res.json())
      .then(setChats)
      .catch(() => {});
  };

  useEffect(() => {
    loadChats();
    setSelectedChatId(null);
    setMessages([]);
  }, [companyId]);

  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      return;
    }
    fetchWithAuth(`${API_URL}/whatsapp/${companyId}/chats/${selectedChatId}/messages`)
      .then((res) => res.json())
      .then((data: WhatsAppMessage[]) => setMessages([...data].reverse()))
      .catch(() => {});
  }, [companyId, selectedChatId]);

  useEffect(() => {
    if (!socket) return;
    const handler = ({ chat, message }: { chat: WhatsAppChat; message: WhatsAppMessage }) => {
      setChats((prev) => {
        const others = prev.filter((c) => c.id !== chat.id);
        return [chat, ...others].sort((a, b) => (b.lastMessageAt || '').localeCompare(a.lastMessageAt || ''));
      });
      if (chat.id === selectedChatId) {
        setMessages((prev) => [...prev, message]);
      }
    };
    socket.on('whatsapp:message', handler);
    return () => {
      socket.off('whatsapp:message', handler);
    };
  }, [socket, selectedChatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !selectedChatId) return;
    setSending(true);
    try {
      await fetchWithAuth(`${API_URL}/whatsapp/${companyId}/chats/${selectedChatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      setText('');
    } finally {
      setSending(false);
    }
  };

  const activeChat = chats.find(c => c.id === selectedChatId);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 flex h-[580px] overflow-hidden shadow-xs">
      {/* Chats List Sidebar (full width on mobile when no chat is selected) */}
      <div className={`w-full md:w-64 shrink-0 border-r border-slate-200 overflow-y-auto ${selectedChatId ? 'hidden md:block' : 'block'}`}>
        <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-600 uppercase tracking-wider">
          Conversaciones ({chats.length})
        </div>
        {chats.length === 0 && (
          <p className="text-sm text-slate-400 p-6 text-center">Sin conversaciones todavía</p>
        )}
        {chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => setSelectedChatId(chat.id)}
            className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
              selectedChatId === chat.id ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : ''
            }`}
          >
            <p className="font-bold text-sm text-slate-800 truncate">{chat.contactName || chat.waJid.split('@')[0]}</p>
            <p className="text-xs text-slate-500 truncate mt-0.5">{chat.lastMessagePreview || '—'}</p>
          </button>
        ))}
      </div>

      {/* Active Conversation Container */}
      <div className={`flex-1 flex-col ${selectedChatId ? 'flex' : 'hidden md:flex'}`}>
        {!selectedChatId ? (
          <div className="flex-1 flex items-center justify-center text-slate-300 flex-col gap-2 p-6">
            <MessageCircle className="w-12 h-12 text-slate-300" />
            <p className="text-sm font-medium text-slate-400">Selecciona un chat para responder</p>
          </div>
        ) : (
          <>
            {/* Header with Back Button on Mobile */}
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedChatId(null)}
                  className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 font-bold text-xs flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4 text-indigo-600" />
                  <span>Chats</span>
                </button>
                <div>
                  <h3 className="font-bold text-sm text-slate-800 truncate">
                    {activeChat?.contactName || activeChat?.waJid.split('@')[0] || 'Chat'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">{activeChat?.waJid.split('@')[0]}</p>
                </div>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50/40">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.direction === 'out' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] px-3.5 py-2 rounded-2xl text-xs sm:text-sm whitespace-pre-wrap shadow-2xs ${
                      msg.direction === 'out'
                        ? 'bg-indigo-600 text-white rounded-br-xs'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                    }`}
                  >
                    {msg.body}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Text Input Footer */}
            <div className="border-t border-slate-200 p-3 bg-white flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Escribe un mensaje…"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
              <button
                onClick={handleSend}
                disabled={sending || !text.trim()}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white disabled:opacity-50 hover:bg-indigo-700 transition-colors font-bold text-xs flex items-center justify-center shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

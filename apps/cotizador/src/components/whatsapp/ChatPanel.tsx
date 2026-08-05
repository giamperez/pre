import { useEffect, useRef, useState } from 'react';
import { Send, MessageCircle } from 'lucide-react';
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 flex h-[560px] overflow-hidden">
      <div className="w-64 shrink-0 border-r border-slate-200 overflow-y-auto">
        {chats.length === 0 && (
          <p className="text-sm text-slate-400 p-4 text-center">Sin conversaciones todavía</p>
        )}
        {chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => setSelectedChatId(chat.id)}
            className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
              selectedChatId === chat.id ? 'bg-indigo-50' : ''
            }`}
          >
            <p className="font-medium text-sm text-slate-800 truncate">{chat.contactName || chat.waJid.split('@')[0]}</p>
            <p className="text-xs text-slate-400 truncate">{chat.lastMessagePreview || '—'}</p>
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col">
        {!selectedChatId ? (
          <div className="flex-1 flex items-center justify-center text-slate-300">
            <MessageCircle className="w-10 h-10" />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.direction === 'out' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                      msg.direction === 'out' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {msg.body}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="border-t border-slate-200 p-3 flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Escribe un mensaje…"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleSend}
                disabled={sending || !text.trim()}
                className="px-3 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50 hover:bg-indigo-700 transition-colors"
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

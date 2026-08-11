import { useState, useEffect, useRef } from 'react';
import { Bot, User, Send, Pause, Play, RefreshCw, CheckCircle2, UserCheck, Share2, Unlock, XCircle, FileText, CheckSquare, Lock, Calendar, ArrowLeft } from 'lucide-react';
import { API_URL } from '../config';
import { getUser } from '../auth';
import { CalendarPicker } from '../components/CalendarPicker';

interface CatalogItem {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  isAddon: boolean;
  category: string;
}

interface ChatSession {
  id: string;
  companyId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  status: 'BOT_ACTIVE' | 'HUMAN_TAKEOVER' | 'CLOSED';
  assignedUserId?: string | null;
  assignedUserName?: string | null;
  unreadCountSales: number;
  lastMessageAt: string;
  summary?: string;
  analysisResult?: any;
  company: {
    id: string;
    name: string;
    slug: string;
    colorPrimary?: string;
    catalogItems?: CatalogItem[];
  };
  messages?: any[];
}

function formatChatMessageText(text: string, isSales: boolean) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={index} className={`font-black ${isSales ? 'text-white' : 'text-slate-900'}`}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export function PrecotizadorChatPage() {
  const currentUser = getUser();
  const isAdmin = currentUser?.role === 'admin';

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('all');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [salesAgentsList, setSalesAgentsList] = useState<Array<{ id: string; name: string; email: string; role: string }>>([]);
  const [selectedTransferAgentId, setSelectedTransferAgentId] = useState<string>('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [mobileViewTab, setMobileViewTab] = useState<'chat' | 'formulario'>('chat');

  const [selectedMainService, setSelectedMainService] = useState<string | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({ name: '', businessName: '', phone: '', email: '', notes: '', budget: '' });

  // Booking / Calendar state for sales rep
  const [booking, setBooking] = useState<{ date: string; time: string } | null>(null);
  const [showCalendarInPanel, setShowCalendarInPanel] = useState(false);

  const isUnassigned = activeSession ? (!activeSession.assignedUserId && !activeSession.assignedUserName) : true;
  const isAssignedToMe = activeSession ? (
    (activeSession.assignedUserId && activeSession.assignedUserId === currentUser?.userId) ||
    (activeSession.assignedUserName && activeSession.assignedUserName === currentUser?.name)
  ) : false;

  const canInteract = isUnassigned || isAssignedToMe || isAdmin;

  const chatEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const prevMessageCountRef = useRef(0);
  const selectedSessionIdRef = useRef<string | null>(null);
  selectedSessionIdRef.current = selectedSessionId;

  // Quick Reply Templates
  const quickReplies = [
    '¡Hola! 👋 Te habla el equipo de ventas. ¿En qué te podemos ayudar hoy?',
    'Con mucho gusto te ayudo a calcular y personalizar tu cotización.',
    '¡Listo! Hemos registrado tus datos y generado tu precotización.',
    'Gracias por contactarnos. Quedamos a tu entera disposición. ¡Que tengas excelente día!',
  ];

  // Fetch session list
  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_URL}/precotizador-chat/sessions`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
        if (!selectedSessionIdRef.current && data.length > 0) {
          setSelectedSessionId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error cargando chats:', err);
    }
  };

  // Fetch active session details & mark read
  const fetchActiveSession = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/precotizador-chat/sessions/${id}`);
      if (res.ok) {
        const data: ChatSession = await res.json();
        setActiveSession(data);

        setFormData(prev => ({
          ...prev,
          name: data.customerName !== 'Cliente Precotizador' ? (data.customerName || '') : prev.name,
          email: data.customerEmail || prev.email,
          phone: data.customerPhone || prev.phone,
          notes: data.summary || prev.notes,
        }));

        if (data.analysisResult && data.analysisResult.mainServiceId) {
          setSelectedMainService(data.analysisResult.mainServiceId);
        }
        if (data.analysisResult && data.analysisResult.addonIds) {
          setSelectedAddons(new Set(data.analysisResult.addonIds));
        }

        if (data.unreadCountSales > 0) {
          fetch(`${API_URL}/precotizador-chat/sessions/${id}/read`, { method: 'POST' });
        }
      }
    } catch (err) {
      console.error('Error cargando detalles del chat:', err);
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      prevMessageCountRef.current = 0;
      isNearBottomRef.current = true;
      fetchActiveSession(selectedSessionId);
      const interval = setInterval(() => fetchActiveSession(selectedSessionId), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedSessionId]);

  const handleChatScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const threshold = 80;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  };

  const scrollToBottomIfNear = (force = false) => {
    if (force || isNearBottomRef.current) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const count = activeSession?.messages?.length || 0;
    if (count > prevMessageCountRef.current) {
      scrollToBottomIfNear(false);
    }
    prevMessageCountRef.current = count;
  }, [activeSession?.messages?.length]);

  const handleSendReply = async (customText?: string) => {
    if (!selectedSessionId || loading || !canInteract) return;
    const text = (customText || replyText).trim();
    if (!text) return;

    if (!customText) setReplyText('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/precotizador-chat/sessions/${selectedSessionId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: currentUser?.name || 'Asesor de Ventas',
          agentId: currentUser?.userId,
          content: text,
        }),
      });

      if (res.ok) {
        await fetchActiveSession(selectedSessionId);
        await fetchSessions();
        setTimeout(() => scrollToBottomIfNear(true), 100);
      }
    } catch (err) {
      console.error('Error enviando respuesta:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimChat = async () => {
    if (!selectedSessionId || !currentUser) return;
    try {
      const res = await fetch(`${API_URL}/precotizador-chat/sessions/${selectedSessionId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetAgentName: currentUser.name,
          targetAgentId: currentUser.userId,
        }),
      });

      if (res.ok) {
        await fetchActiveSession(selectedSessionId);
        await fetchSessions();
      }
    } catch (err) {
      console.error('Error al tomar chat:', err);
    }
  };

  const handleToggleBot = async () => {
    if (!selectedSessionId || !canInteract) return;
    try {
      const res = await fetch(`${API_URL}/precotizador-chat/sessions/${selectedSessionId}/toggle-bot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        await fetchActiveSession(selectedSessionId);
        await fetchSessions();
      }
    } catch (err) {
      console.error('Error alternando bot:', err);
    }
  };

  const openTransferModal = async () => {
    if (!canInteract) return;
    try {
      const res = await fetch(`${API_URL}/precotizador-chat/sales-agents`);
      if (res.ok) {
        const agents = await res.json();
        setSalesAgentsList(agents);
      }
    } catch (err) {
      console.error('Error cargando asesores:', err);
    }
    setShowTransferModal(true);
  };

  const handleTransferSubmit = async () => {
    if (!selectedSessionId || !selectedTransferAgentId) return;
    const targetAgent = salesAgentsList.find(a => a.id === selectedTransferAgentId);
    try {
      const res = await fetch(`${API_URL}/precotizador-chat/sessions/${selectedSessionId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetAgentName: targetAgent?.name,
          targetAgentId: targetAgent?.id,
        }),
      });

      if (res.ok) {
        setShowTransferModal(false);
        setSelectedTransferAgentId('');
        await fetchActiveSession(selectedSessionId);
        await fetchSessions();
      }
    } catch (err) {
      console.error('Error al transferir:', err);
    }
  };

  const handleRelease = async () => {
    if (!selectedSessionId || !canInteract) return;
    try {
      const res = await fetch(`${API_URL}/precotizador-chat/sessions/${selectedSessionId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetAgentName: null,
          targetAgentId: null,
        }),
      });

      if (res.ok) {
        await fetchActiveSession(selectedSessionId);
        await fetchSessions();
      }
    } catch (err) {
      console.error('Error al liberar chat:', err);
    }
  };

  const handleCloseSession = async () => {
    if (!selectedSessionId || !canInteract) return;
    try {
      const res = await fetch(`${API_URL}/precotizador-chat/sessions/${selectedSessionId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        await fetchActiveSession(selectedSessionId);
        await fetchSessions();
      }
    } catch (err) {
      console.error('Error al cerrar chat:', err);
    }
  };

  // Submit Lead via Side Precotizador Form
  const handleSideFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !selectedMainService) return;
    setFormSubmitting(true);

    const catalog = activeSession.company.catalogItems || [];
    const mainServiceObj = catalog.find(i => i.id === selectedMainService);
    const addonObjs = catalog.filter(i => selectedAddons.has(i.id));

    const subtotal = (mainServiceObj ? mainServiceObj.basePrice : 0) + addonObjs.reduce((sum, item) => sum + item.basePrice, 0);
    const igv = subtotal * 0.18;
    const total = subtotal + igv;

    try {
      const payload = {
        name: formData.name || activeSession.customerName || 'Cliente',
        businessName: formData.businessName,
        phone: formData.phone || activeSession.customerPhone,
        email: formData.email || activeSession.customerEmail,
        companyId: activeSession.companyId,
        source: 'precotizador-asesor-chat',
        notes: formData.notes,
        answers: {
          serviciosPrincipales: mainServiceObj ? [{ name: mainServiceObj.name, price: mainServiceObj.basePrice }] : [],
          addons: addonObjs.map(a => ({ name: a.name, price: a.basePrice })),
          subtotal,
          igv,
          total,
          ...(formData.budget ? { presupuestoEstimadoCliente: formData.budget } : {}),
        },
      };

      const res = await fetch(`${API_URL}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (booking) {
          try {
            await fetch(`${API_URL}/bookings`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                companySlug: activeSession.company.slug,
                clientName: formData.name || activeSession.customerName || 'Cliente',
                clientEmail: formData.email || activeSession.customerEmail || 'cliente@ejemplo.com',
                clientPhone: formData.phone || activeSession.customerPhone,
                date: booking.date,
                time: booking.time,
                notes: formData.notes || 'Agendado por Asesor comercial'
              })
            });
          } catch (e) {
            console.error('Error al guardar booking:', e);
          }
        }

        setFormSubmitted(true);
        const bookingMsg = booking ? ` 📅 Cita confirmada para el ${booking.date} a las ${booking.time}.` : '';
        await handleSendReply(`✅ ¡Hemos generado tu precotización formal en el sistema!${bookingMsg} Total estimado: PEN ${total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}.`);
      }
    } catch (err) {
      console.error('Error enviando formulario lateral:', err);
    } finally {
      setFormSubmitting(false);
    }
  };

  const toggleAddon = (id: string) => {
    const next = new Set(selectedAddons);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedAddons(next);
  };

  const filteredSessions = sessions.filter(s => {
    if (selectedCompanyFilter === 'all') return true;
    return s.companyId === selectedCompanyFilter;
  });

  const companiesList = Array.from(
    new Map(sessions.map(s => [s.company.id, s.company])).values()
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-200">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Chat Precotizaciones Web</h1>
            <p className="text-sm text-slate-500">Atención de consultas en tiempo real por los asesores de ventas</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCompanyFilter}
            onChange={e => setSelectedCompanyFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
          >
            <option value="all">Todas las empresas</option>
            {companiesList.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={fetchSessions}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            title="Recargar chats"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 h-[720px]">
        <div className={`lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex-col overflow-hidden ${selectedSessionId ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 text-sm">Chats ({filteredSessions.length})</h2>
            <span className="text-[11px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-md">
              En Vivo
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredSessions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No hay conversaciones.</div>
            ) : (
              filteredSessions.map(session => {
                const isSelected = session.id === selectedSessionId;
                const hasUnread = session.unreadCountSales > 0;
                return (
                  <button
                    key={session.id}
                    onClick={() => {
                      setSelectedSessionId(session.id);
                      setMobileViewTab('chat');
                      setFormSubmitted(false);
                    }}
                    className={`w-full text-left p-4 transition-colors flex flex-col gap-1.5 relative ${
                      isSelected ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-sm truncate">{session.customerName || 'Cliente Anónimo'}</span>
                      <span className="text-[10px] text-slate-400">{new Date(session.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="text-xs text-slate-500 truncate">{session.company.name}</div>
                    {hasUnread && <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce">{session.unreadCountSales}</span>}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className={`lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex-col overflow-hidden ${
          selectedSessionId && mobileViewTab === 'chat' ? 'flex' : selectedSessionId ? 'hidden lg:flex' : 'hidden lg:flex'
        }`}>
          {activeSession ? (
            <>
              <div className="lg:hidden flex items-center justify-between border-b border-slate-200 px-3 py-2 bg-slate-100/70">
                <button
                  onClick={() => setSelectedSessionId(null)}
                  className="text-slate-600 font-bold text-xs flex items-center gap-1 hover:text-slate-900"
                >
                  <ArrowLeft className="w-4 h-4 text-indigo-600" />
                  <span>Chats</span>
                </button>
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setMobileViewTab('chat')}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                      mobileViewTab === 'chat' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    💬 Chat
                  </button>
                  <button
                    onClick={() => setMobileViewTab('formulario')}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                      mobileViewTab === 'formulario' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    📋 Precotizar
                  </button>
                </div>
              </div>

              <div className="p-3.5 border-b border-slate-200 bg-slate-50/80 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 shrink-0">
                      <User className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm truncate">{activeSession.customerName}</h3>
                      <p className="text-[11px] text-slate-500">{activeSession.company.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isUnassigned && (
                      <button onClick={handleClaimChat} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-[11px] shadow-sm flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Tomar Chat</span>
                      </button>
                    )}
                    {canInteract && (
                      <>
                        <button
                          onClick={handleToggleBot}
                          className={`px-2 py-1 rounded-lg font-bold text-[10px] flex items-center gap-1 text-white ${
                            activeSession.status === 'HUMAN_TAKEOVER' ? 'bg-emerald-600' : 'bg-amber-500'
                          }`}
                        >
                          {activeSession.status === 'HUMAN_TAKEOVER' ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                          <span>{activeSession.status === 'HUMAN_TAKEOVER' ? 'Bot' : 'Pausar'}</span>
                        </button>
                        <button onClick={openTransferModal} className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100" title="Transferir"><Share2 className="w-4 h-4 text-slate-600" /></button>
                        <button onClick={handleRelease} className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100" title="Liberar"><Unlock className="w-4 h-4 text-slate-600" /></button>
                        <button onClick={handleCloseSession} className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600" title="Cerrar"><XCircle className="w-4 h-4" /></button>
                      </>
                    )}
                  </div>
                </div>
                {!canInteract && (
                  <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md flex items-center gap-1 self-start">
                    <Lock className="w-3 h-3" /> Solo Lectura
                  </span>
                )}
              </div>

              <div ref={scrollContainerRef} onScroll={handleChatScroll} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                {activeSession.messages?.map((msg: any) => {
                  const isCustomer = msg.sender === 'user' || msg.sender === 'customer';
                  const isSales = msg.sender === 'agent' || msg.sender === 'sales';
                  const isBot = msg.sender === 'bot';
                  const messageText = msg.content || msg.text || '';

                  return (
                    <div key={msg.id} className={`flex gap-2.5 max-w-[85%] ${isSales ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white ${
                        isCustomer ? 'bg-slate-700' : isBot ? 'bg-indigo-600' : 'bg-purple-600'
                      }`}>
                        {isCustomer ? <User className="w-4 h-4" /> : isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className={`flex items-center gap-2 ${isSales ? 'justify-end' : ''}`}>
                          <span className="text-[10px] font-bold text-slate-500">
                            {isCustomer ? activeSession.customerName : isBot ? 'Asistente IA' : msg.senderName || 'Asesor'}
                          </span>
                          {msg.createdAt && (
                            <span className="text-[9px] text-slate-400">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <div className={`p-3 rounded-2xl text-xs sm:text-sm whitespace-pre-wrap leading-relaxed shadow-2xs ${
                          isSales 
                            ? 'bg-purple-600 text-white' 
                            : isBot 
                            ? 'bg-indigo-50 text-indigo-950 border border-indigo-100'
                            : 'bg-white border border-slate-200 text-slate-800'
                        }`}>
                          {formatChatMessageText(messageText, isSales)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Quick replies strip */}
              {canInteract && activeSession.status === 'HUMAN_TAKEOVER' && (
                <div className="p-2 border-t border-slate-100 bg-white flex gap-1.5 overflow-x-auto no-scrollbar">
                  {quickReplies.map((reply, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendReply(reply)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-[11px] font-medium rounded-full shrink-0 transition-colors border border-slate-200"
                    >
                      {reply.slice(0, 25)}...
                    </button>
                  ))}
                </div>
              )}

              {canInteract ? (
                <div className="p-3 bg-white border-t border-slate-200 flex gap-2 items-center">
                  <input
                    type="text"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendReply()}
                    placeholder="Escribe tu mensaje..."
                    className="flex-1 bg-slate-100 text-slate-800 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button onClick={() => handleSendReply()} disabled={!replyText.trim() || loading} className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1">
                    <span>Enviar</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-slate-400 text-sm">Selecciona una conversación.</div>
          )}
        </div>

        <div className={`lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex-col overflow-hidden ${
          selectedSessionId && mobileViewTab === 'formulario' ? 'flex' : 'hidden lg:flex'
        }`}>
          <div className="lg:hidden flex items-center justify-between border-b border-slate-200 px-3 py-2 bg-slate-100/70">
            <button onClick={() => setSelectedSessionId(null)} className="text-slate-600 font-bold text-xs flex items-center gap-1 hover:text-slate-900">
              <ArrowLeft className="w-4 h-4 text-indigo-600" />
              <span>Chats</span>
            </button>
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
              <button onClick={() => setMobileViewTab('chat')} className={`px-3 py-1 rounded-md text-[11px] font-bold ${mobileViewTab === 'chat' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}>💬 Chat</button>
              <button onClick={() => setMobileViewTab('formulario')} className={`px-3 py-1 rounded-md text-[11px] font-bold ${mobileViewTab === 'formulario' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}>📋 Precotizar</button>
            </div>
          </div>
          <div className="p-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Precotización del Asesor</span>
            </div>
            <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">
              Formulario
            </span>
          </div>

          {activeSession ? (
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {!canInteract && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>🔒 Formulario bloqueado (en atención por <strong>{activeSession.assignedUserName}</strong>)</span>
                </div>
              )}

              {formSubmitted ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2 my-4">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-slate-800 text-sm">¡Precotización Registrada!</h4>
                  <p className="text-xs text-slate-600">Se ha guardado la solicitud de cotización formal y notificado al cliente.</p>
                  <button
                    onClick={() => setFormSubmitted(false)}
                    className="text-xs font-bold text-indigo-600 underline mt-2"
                  >
                    Editar / Crear otra
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSideFormSubmit} className="space-y-4 text-xs">
                  {/* Select Main Service */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">
                      1. Servicio Principal *
                    </label>
                    <select
                      disabled={!canInteract}
                      required
                      value={selectedMainService || ''}
                      onChange={e => setSelectedMainService(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-medium outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      <option value="">-- Seleccionar servicio --</option>
                      {activeSession.company.catalogItems?.filter(i => !i.isAddon).map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} — S/ {item.basePrice.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Addon Checkboxes */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">
                      2. Complementos / Addons
                    </label>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                      {activeSession.company.catalogItems?.filter(i => i.isAddon).map(addon => (
                        <label key={addon.id} className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900">
                          <input
                            disabled={!canInteract}
                            type="checkbox"
                            checked={selectedAddons.has(addon.id)}
                            onChange={() => toggleAddon(addon.id)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="truncate">{addon.name} (+S/ {addon.basePrice})</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <label className="font-bold text-slate-700 block">3. Datos del Cliente</label>
                    <input
                      disabled={!canInteract}
                      required
                      type="text"
                      placeholder="Nombre del cliente *"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    />
                    <input
                      disabled={!canInteract}
                      type="text"
                      placeholder="Empresa / Negocio (Opcional)"
                      value={formData.businessName}
                      onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        disabled={!canInteract}
                        type="email"
                        placeholder="Correo"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full p-2 rounded-lg border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                      />
                      <input
                        disabled={!canInteract}
                        type="text"
                        placeholder="Teléfono / WA"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full p-2 rounded-lg border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Project Notes & Budget */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <input
                      disabled={!canInteract}
                      type="text"
                      placeholder="Presupuesto disponible (ej. S/ 3000)"
                      value={formData.budget}
                      onChange={e => setFormData({ ...formData, budget: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    />
                    <textarea
                      disabled={!canInteract}
                      rows={3}
                      placeholder="Observaciones / Requerimientos detallados..."
                      value={formData.notes}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-indigo-500 resize-y disabled:opacity-50"
                    />
                  </div>

                  {/* Agendamiento de Citas con Calendario para Asesor */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        <span>4. Agendar Cita / Reunión</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowCalendarInPanel(!showCalendarInPanel)}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md transition-colors"
                      >
                        {showCalendarInPanel ? 'Ocultar' : '📅 Abrir Calendario'}
                      </button>
                    </div>

                    {booking && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 font-semibold">
                        <span>📅 Cita: {booking.date} a las {booking.time}</span>
                        <button
                          type="button"
                          onClick={() => setBooking(null)}
                          className="text-[10px] text-red-600 underline font-bold"
                        >
                          Quitar
                        </button>
                      </div>
                    )}

                    {showCalendarInPanel && (
                      <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                        <CalendarPicker
                          companySlug={activeSession.company.slug}
                          colorPrimary="#4f46e5"
                          onSelectBooking={(d, t) => {
                            setBooking({ date: d, time: t });
                            setShowCalendarInPanel(false);
                          }}
                          onClearBooking={() => setBooking(null)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    disabled={!selectedMainService || formSubmitting || !canInteract}
                    type="submit"
                    className="w-full mt-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-100"
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span>{formSubmitting ? 'Procesando...' : 'Generar / Solicitar Cotización Formal'}</span>
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 text-center text-slate-400 text-xs">
              Selecciona un chat para completar la precotización.
            </div>
          )}
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <h3 className="font-bold text-slate-800 text-base">Transferir Chat a otro Asesor</h3>
            <p className="text-xs text-slate-500">Selecciona el asesor de ventas al cual deseas reasignar esta conversación:</p>

            <select
              value={selectedTransferAgentId}
              onChange={e => setSelectedTransferAgentId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="">-- Selecciona un asesor --</option>
              {salesAgentsList.map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} ({agent.email}) {agent.role === 'admin' ? '⭐ Admin' : '👤 Ventas'}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleTransferSubmit}
                disabled={!selectedTransferAgentId}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
              >
                Transferir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

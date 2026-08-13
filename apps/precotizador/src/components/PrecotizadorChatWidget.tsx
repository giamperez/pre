import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles, Laptop, Truck, Building2, CheckCircle2, ChevronDown, UserCheck } from 'lucide-react';
import { API_URL } from '../config';

interface CompanyInfo {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  colorPrimary?: string | null;
  colorSecondary?: string | null;
}

interface PrecotizadorChatWidgetProps {
  company: CompanyInfo;
  onConfirmRecommendation: (recommendation: {
    mainServiceId?: string;
    addonIds?: string[];
    summary?: string;
    explanation?: string;
    mainServiceName?: string;
  }) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'bot' | 'agent';
  senderName?: string;
  content: string;
  createdAt: string;
  metadata?: any;
}

export function PrecotizadorChatWidget({ company, onConfirmRecommendation }: PrecotizadorChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPreviewBubble, setShowPreviewBubble] = useState(true);
  const [unreadCount, setUnreadCount] = useState(1);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(() => {
    return sessionStorage.getItem(`precotizador_chat_session_${company.id}`) || null;
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isBotPaused, setIsBotPaused] = useState(false);
  const [dismissedAdvisorOffers, setDismissedAdvisorOffers] = useState<Set<string>>(new Set());

  const chatEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const prevMessageCountRef = useRef(0);

  // Formatter for bold text
  const renderFormattedContent = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');

    return lines.map((line, lineIdx) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);

      const formattedLine = parts.map((part, partIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const boldText = part.slice(2, -2);
          return (
            <strong key={partIdx} className="font-bold text-slate-900 bg-amber-50 px-1 py-0.5 rounded border border-amber-200/60">
              {boldText}
            </strong>
          );
        }
        return part;
      });

      return (
        <span key={lineIdx} className="block my-0.5">
          {formattedLine}
        </span>
      );
    });
  };

  // Avatar Icon per company
  const renderCompanyAvatar = () => {
    const slug = (company.slug || '').toLowerCase();
    const name = (company.name || '').toLowerCase();

    if (company.logoUrl) {
      return (
        <img
          src={`${API_URL}/public${company.logoUrl}`}
          alt={company.name}
          className="w-10 h-10 rounded-full object-cover border-2 border-white/50 bg-white"
        />
      );
    }

    if (slug.includes('vertex') || name.includes('developers') || name.includes('tech') || name.includes('soft')) {
      return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-white shadow-md">
          <Laptop className="w-5 h-5" />
        </div>
      );
    }

    if (slug.includes('pyramid') || name.includes('structures') || name.includes('construc') || name.includes('ingenieria')) {
      return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-orange-600 flex items-center justify-center text-white shadow-md">
          <Truck className="w-5 h-5" />
        </div>
      );
    }

    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
        <Building2 className="w-5 h-5" />
      </div>
    );
  };

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeText = `¡Hola! 👋 Te doy la bienvenida a **${company.name}**.\n\n¿En qué tipo de proyecto te gustaría cotizar hoy?`;
      setMessages([
        {
          id: 'welcome-1',
          sender: 'bot',
          senderName: getBotName(),
          content: welcomeText,
          createdAt: new Date().toISOString(),
          metadata: {
            suggestionChips: ['Cotizar servicio', 'Ver opciones'],
          },
        },
      ]);
    }
  }, [company.id]);

  const handleChatScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
  };

  const scrollToBottomIfNear = (force = false) => {
    if (force || isNearBottomRef.current) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      scrollToBottomIfNear(false);
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length]);

  // Polling for replies
  useEffect(() => {
    if (!sessionId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/precotizador-chat/sessions/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.messages) {
            setMessages(data.messages);
            setIsBotPaused(data.status === 'HUMAN_TAKEOVER');
          }
        }
      } catch (err) {
        // Silent poll
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [sessionId]);

  const getBotName = () => {
    const slug = (company.slug || '').toLowerCase();
    if (slug.includes('vertex')) return 'Asistente Vertex';
    if (slug.includes('pyramid')) return 'Asistente Pyramid';
    return `Asistente ${company.name}`;
  };

  const handleOpenChat = () => {
    setIsOpen(true);
    setShowPreviewBubble(false);
    setUnreadCount(0);
    setTimeout(() => scrollToBottomIfNear(true), 100);
  };

  const sendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || inputMessage).trim();
    if (!messageText || loading) return;

    setInputMessage('');
    setShowPreviewBubble(false);

    const userMsgId = `usr-${Date.now()}`;
    const newMsg: Message = {
      id: userMsgId,
      sender: 'user',
      content: messageText,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newMsg]);
    setLoading(true);
    setTimeout(() => scrollToBottomIfNear(true), 50);

    try {
      const res = await fetch(`${API_URL}/precotizador-chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          sessionId: sessionId || undefined,
          message: messageText,
        }),
      });

      if (!res.ok) throw new Error('Error al conectar con el asistente');

      const data = await res.json();

      if (data.session && data.session.id) {
        setSessionId(data.session.id);
        sessionStorage.setItem(`precotizador_chat_session_${company.id}`, data.session.id);
        setIsBotPaused(data.session.status === 'HUMAN_TAKEOVER');
        if (data.session.messages) {
          setMessages(data.session.messages);
        }
      } else if (data.reply) {
        setMessages(prev => [...prev, data.reply]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'bot',
          senderName: getBotName(),
          content: 'Lo siento, tuve un problema de conexión. ¿Puedes intentar de nuevo?',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollToBottomIfNear(true), 100);
    }
  };

  const handleConfirmAction = (metadata: any) => {
    if (!metadata) return;

    onConfirmRecommendation({
      mainServiceId: metadata.mainServiceId,
      addonIds: metadata.addonIds || [],
      summary: metadata.summary,
      explanation: metadata.explanation,
      mainServiceName: metadata.mainServiceName,
    });

    setMessages(prev => [
      ...prev,
      {
        id: `conf-${Date.now()}`,
        sender: 'bot',
        senderName: getBotName(),
        content: `✅ ¡Excelente! He cargado tus opciones recomendadas en el formulario de precotización. Solo completa tus datos de contacto más abajo para finalizar.`,
        createdAt: new Date().toISOString(),
      },
    ]);
    setTimeout(() => scrollToBottomIfNear(true), 100);
  };

  const primaryColor = company.colorPrimary || '#0284c7';
  const secondaryColor = company.colorSecondary || '#0369a1';

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {/* Closed State Bubble */}
      {!isOpen && (
        <div className="relative flex flex-col items-end">
          {showPreviewBubble && (
            <div className="mb-3 max-w-xs bg-white rounded-2xl p-4 shadow-xl border border-slate-200 text-left animate-bounceIn relative">
              <button
                onClick={() => setShowPreviewBubble(false)}
                className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 p-1"
                title="Cerrar vista previa"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">{renderCompanyAvatar()}</div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{company.name}</h4>
                  <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                    ¡Hola! 👋 Bienvenido. ¿En qué podemos ayudarte a cotizar hoy?
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <button
                      onClick={() => {
                        handleOpenChat();
                        sendMessage('Quiero cotizar un servicio');
                      }}
                      className="text-xs text-blue-600 font-semibold bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-full transition-colors"
                    >
                      Cotizar servicio
                    </button>
                    <button
                      onClick={() => {
                        handleOpenChat();
                        sendMessage('Ver opciones disponibles');
                      }}
                      className="text-xs text-blue-600 font-semibold bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-full transition-colors"
                    >
                      Ver opciones
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Floating Action Button */}
          <button
            onClick={handleOpenChat}
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            }}
            className="w-14 h-14 rounded-full text-white shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 group relative border-2 border-white/30"
          >
            <span className="absolute -inset-1 rounded-full bg-blue-400 opacity-40 animate-ping pointer-events-none" />
            <MessageSquare className="w-7 h-7 fill-white/20 transition-transform group-hover:rotate-12" />

            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white font-black text-[11px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-md animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Expanded Chat Window */}
      {isOpen && (
        <div className="w-[90vw] sm:w-[380px] h-[550px] max-h-[82vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-slideUp">
          {/* Header */}
          <div
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            }}
            className="p-4 text-white relative flex-shrink-0"
          >
            <div className="flex items-center justify-between z-10 relative">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {renderCompanyAvatar()}
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm text-white tracking-wide">{getBotName()}</h3>
                    <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-spin-slow" />
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-white/80">
                    <span>{isBotPaused ? '👤 Atención Humana' : '🟢 En línea'}</span>
                    <span className="opacity-50">•</span>
                    <span>{company.name}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-white/80">
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                  title="Minimizar chat"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-white/10 text-[11px] text-white/90 font-medium flex items-center justify-between">
              <span>¡Asistencia inteligente para tu cotización!</span>
            </div>
          </div>

          {/* Messages Container */}
          <div ref={scrollContainerRef} onScroll={handleChatScroll} className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 pt-4">
            {messages.map(msg => {
              const isUser = msg.sender === 'user';
              const isAgent = msg.sender === 'agent';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5 animate-fadeIn`}
                >
                  <div className={`flex items-start gap-2 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!isUser && (
                      <div className="flex-shrink-0 mt-1">{renderCompanyAvatar()}</div>
                    )}

                    <div>
                      {/* Message Bubble */}
                      <div
                        className={`rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                          isUser
                            ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-tr-none'
                            : isAgent
                            ? 'bg-amber-50 border border-amber-200 text-slate-800 rounded-tl-none'
                            : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-none'
                        }`}
                      >
                        {msg.senderName && !isUser && (
                          <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                            {msg.senderName}
                          </p>
                        )}
                        <div>{renderFormattedContent(msg.content)}</div>
                      </div>

                      {/* Confirmation Prompt Card */}
                      {msg.metadata && msg.metadata.isConfirmable && (
                        <div className="mt-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 shadow-sm">
                          <div className="flex items-center gap-1.5 text-blue-700 font-bold text-xs mb-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Propuesta de Precotización Lista</span>
                          </div>
                          <p className="text-xs text-slate-600 mb-3">
                            Servicio sugerido: <strong>{msg.metadata.mainServiceName}</strong>
                          </p>

                          <div className="space-y-1.5">
                            <button
                              onClick={() => handleConfirmAction(msg.metadata)}
                              className="w-full text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2 px-3 rounded-lg shadow-md flex items-center justify-center gap-1.5 transition-all transform hover:scale-[1.02]"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>✨ Sí, autocompletar precotización</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Human Advisor Offer */}
                      {msg.metadata && msg.metadata.offerAdvisor && !dismissedAdvisorOffers.has(msg.id) && (
                        <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-3 shadow-sm">
                          <div className="flex items-center gap-1.5 text-amber-700 font-bold text-xs mb-2">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>¿Prefieres hablar con un asesor?</span>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => sendMessage('Quiero hablar con un asesor humano')}
                              className="flex-1 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white py-2 px-3 rounded-lg shadow-sm transition-all"
                            >
                              Sí, conectarme
                            </button>
                            <button
                              onClick={() => setDismissedAdvisorOffers(prev => new Set(prev).add(msg.id))}
                              className="flex-1 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 py-2 px-3 rounded-lg transition-all"
                            >
                              Seguir con el bot
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Suggestion Chips */}
                      {msg.metadata && msg.metadata.suggestionChips && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {msg.metadata.suggestionChips.map((chip: string, i: number) => (
                            <button
                              key={i}
                              onClick={() => sendMessage(chip)}
                              className="text-xs text-blue-600 bg-white hover:bg-blue-50 border border-blue-200 font-medium px-2.5 py-1 rounded-full transition-colors shadow-2xs"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs bg-white border border-slate-200 rounded-2xl p-3 w-fit animate-pulse">
                <Bot className="w-4 h-4 text-blue-500 animate-spin-slow" />
                <span>{getBotName()} está analizando...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Bottom Bar Input Area */}
          <div className="p-3 bg-white border-t border-slate-200 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Escribe tu mensaje..."
                className="flex-1 bg-slate-100 text-slate-800 text-xs sm:text-sm px-3.5 py-2.5 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />

              <button
                onClick={() => sendMessage()}
                disabled={!inputMessage.trim() || loading}
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                }}
                className="w-10 h-10 rounded-full text-white flex items-center justify-center shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all transform active:scale-95 shrink-0"
                title="Enviar mensaje"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Footer Branding */}
            <div className="flex items-center justify-end text-[10px] text-slate-400 px-1 pt-0.5">
              <div className="flex items-center gap-1 font-semibold text-slate-400">
                <span>POWERED BY</span>
                <span className="text-blue-600 font-bold">VERTEX</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

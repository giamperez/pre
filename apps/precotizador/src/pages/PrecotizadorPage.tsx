import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Send, CheckCircle2, Briefcase, Phone, Mail, User, ArrowLeft, CheckSquare, MessageSquare, MessageCircle, DollarSign, Play, Film } from 'lucide-react';
import { useCatalog } from '../hooks/useCatalog';
import { API_URL } from '../config';
import { CalendarPicker } from '../components/CalendarPicker';
import { QuoteSummaryModal } from '../components/QuoteSummaryModal';
import { COUNTRY_CODES } from '../constants/countryCodes';
import { PrecotizadorChatWidget } from '../components/PrecotizadorChatWidget';
import { AiAnalysisCard } from '../components/AiAnalysisCard';
import { VideoDemoModal, parseVideoUrl } from '../components/VideoDemoModal';

function ServiceVideoThumbnail({
  imageUrl,
  videoUrl,
  isHovered,
  onHoverStart,
  onHoverEnd,
  onOpen,
}: {
  imageUrl?: string | null;
  videoUrl?: string | null;
  isHovered: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onOpen: (e: React.MouseEvent) => void;
}) {
  const formattedImageUrl = imageUrl
    ? (imageUrl.startsWith('http') || imageUrl.startsWith('data:') ? imageUrl : `${API_URL}/public${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`)
    : null;

  const videoInfo = parseVideoUrl(videoUrl);

  return (
    <div
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onClick={onOpen}
      className="group/thumb relative mb-3 aspect-[21/9] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer"
    >
      {isHovered && videoInfo?.type === 'direct' ? (
        <video
          src={videoInfo.url}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        />
      ) : isHovered && videoInfo?.type === 'iframe' && videoInfo.embedUrl ? (
        <iframe
          src={videoInfo.embedUrl}
          className="w-full h-full border-0 pointer-events-none"
          title="Vista previa demo"
        />
      ) : formattedImageUrl ? (
        <img
          src={formattedImageUrl}
          alt="Portada del servicio"
          className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 group-hover/thumb:text-slate-500 transition-colors">
          <Film className="w-5 h-5 mb-1" />
          <span className="text-[11px] font-medium">Haz clic para ver el video demo</span>
        </div>
      )}

      {videoInfo && (
        <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold backdrop-blur-xs pointer-events-none">
          <Play className="w-2.5 h-2.5 fill-white" /> {isHovered ? 'Reproduciendo...' : videoInfo.isDrive ? 'Drive Video' : videoInfo.isYoutube ? 'YouTube' : 'Demo 30s'}
        </span>
      )}
    </div>
  );
}

export function PrecotizadorPage() {
  const { companySlug } = useParams();
  const { company, items, loading, error } = useCatalog(companySlug);

  const [selectedMainService, setSelectedMainService] = useState<string | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());

  const [submitting, setSubmitting] = useState(false);
  const [countryCode, setCountryCode] = useState('+51');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formData, setFormData] = useState({ name: '', businessName: '', phone: '', email: '', notes: '', budget: '' });
  const [submitted, setSubmitted] = useState(false);
  const [booking, setBooking] = useState<{ date: string, time: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quoteRequested, setQuoteRequested] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    mainServiceName?: string;
    summary?: string;
    explanation?: string;
    addonNames?: string[];
  } | null>(null);
  const [activeVideoModal, setActiveVideoModal] = useState<{
    serviceName: string;
    videoUrl: string;
    onSelect?: () => void;
    isSelected?: boolean;
  } | null>(null);
  const [hoveredPreviewId, setHoveredPreviewId] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);

  const scheduleHoverPreview = (id: string) => {
    if (hoverTimeoutRef.current) window.clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = window.setTimeout(() => setHoveredPreviewId(id), 250);
  };
  const cancelHoverPreview = () => {
    if (hoverTimeoutRef.current) window.clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = null;
    setHoveredPreviewId(null);
  };

  const contactSectionRef = useRef<HTMLDivElement>(null);

  const [aiObservationDetails, setAiObservationDetails] = useState('');

  const handleConfirmRecommendation = (rec: {
    mainServiceId?: string;
    addonIds?: string[];
    summary?: string;
    explanation?: string;
    mainServiceName?: string;
    booking?: { date: string; time: string };
  }) => {
    if (rec.mainServiceId) {
      setSelectedMainService(rec.mainServiceId);
    }
    if (rec.addonIds) {
      setSelectedAddons(new Set(rec.addonIds));
    }
    if (rec.booking) {
      setBooking({ date: rec.booking.date, time: rec.booking.time });
    }

    const matchedAddonNames = (rec.addonIds || [])
      .map(id => items.find(i => i.id === id)?.name)
      .filter(Boolean) as string[];

    const mainName = rec.mainServiceName || items.find(i => i.id === rec.mainServiceId)?.name;

    setAiAnalysis({
      mainServiceName: mainName,
      summary: rec.summary,
      explanation: rec.explanation,
      addonNames: matchedAddonNames,
    });

    // Guardar detalles en variable interna no visible para el formulario
    if (rec.summary || rec.explanation) {
      const summaryText = `[Asistente Virtual IA]: ${rec.summary || ''}${rec.explanation ? ` - Razón: ${rec.explanation}` : ''}`;
      setAiObservationDetails(summaryText);
    }

    setTimeout(() => {
      contactSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="text-xl font-medium text-slate-500">Cargando catálogo...</p></div>;
  if (error || !company) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 max-w-md w-full text-center shadow-xl space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-2xl font-bold">
          ⚠️
        </div>
        <h2 className="text-xl font-bold text-slate-800">Precotizador No Disponible</h2>
        <p className="text-sm text-slate-500">
          Esta empresa se encuentra archivada o deshabilitada y no está disponible para recibir precotizaciones en este momento.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al Inicio
        </Link>
      </div>
    </div>
  );

  const mainServices = items.filter(i => !i.isAddon);
  const addonServices = items.filter(i => i.isAddon);

  const toggleAddon = (id: string) => {
    const next = new Set(selectedAddons);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedAddons(next);
  };

  const selectedMainServiceObj = mainServices.find(i => i.id === selectedMainService);
  const selectedAddonObjs = addonServices.filter(i => selectedAddons.has(i.id));

  const subtotal = (selectedMainServiceObj ? selectedMainServiceObj.basePrice : 0) +
    selectedAddonObjs.reduce((sum, item) => sum + item.basePrice, 0);
  const igv = subtotal * 0.18;
  const total = subtotal + igv;
  const showPrice = quoteRequested || submitted;

  const handleOpenModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMainServiceObj) return;
    setQuoteRequested(true);
    setIsModalOpen(true);
  };

  const handleConfirmSubmission = async () => {
    if (!selectedMainServiceObj) return;
    setSubmitting(true);

    try {
      const activeSessionId = sessionStorage.getItem(`precotizador_chat_session_${company.id}`) || null;

      const payload = {
        ...formData,
        companyId: company.id,
        source: 'precotizador-web',
        answers: {
          serviciosPrincipales: selectedMainServiceObj ? [{ name: selectedMainServiceObj.name, price: selectedMainServiceObj.basePrice }] : [],
          addons: selectedAddonObjs.map(a => ({ name: a.name, price: a.basePrice })),
          subtotal,
          igv,
          total,
          ...(formData.budget ? { presupuestoEstimadoCliente: formData.budget } : {}),
          ...(formData.notes ? { detallesProyecto: formData.notes } : {}),
          ...(aiObservationDetails ? { observacionesIA: aiObservationDetails } : {}),
          ...(booking ? { booking } : {}),
          ...(activeSessionId ? { chatSessionId: activeSessionId } : {}),
        }
      };

      const res = await fetch(`${API_URL}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Error al enviar la solicitud de cotización');

      if (booking) {
        const bookingRes = await fetch(`${API_URL}/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companySlug: company.slug,
            clientName: formData.name,
            clientEmail: formData.email,
            clientPhone: formData.phone,
            date: booking.date,
            time: booking.time,
            notes: formData.notes || 'Desde precotizador web'
          })
        });
        if (!bookingRes.ok) console.error('Error al guardar booking');
      }

      setSubmitted(true);
      setIsModalOpen(false);
    } catch (err) {
      alert('Hubo un error al enviar tu solicitud. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <Link to="/" className="text-slate-400 hover:text-slate-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              {company.logoUrl ? (
                <img src={`${API_URL}/public${company.logoUrl}`} alt={company.name} className="h-10 object-contain" />
              ) : (
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: company.colorPrimary }}>
                  {company.name.charAt(0)}
                </div>
              )}
              <h1 className="text-xl font-bold text-slate-800">{company.name}</h1>
            </div>
          </div>
          <div className="text-right w-full sm:w-auto">
            {showPrice ? (
              <>
                <p className="text-sm text-slate-500 font-medium">Cotización Estimada (Inc. IGV)</p>
                <p className="text-2xl font-black" style={{ color: company.colorPrimary }}>
                  PEN {total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </p>
              </>
            ) : (
              <div className="bg-slate-100/80 border border-slate-200 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 inline-block text-center sm:text-right">
                Llena los datos y solicita cotización formal para ver el monto.
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-12">
        {/* Main Services Selection */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Servicio Principal</h2>
            <p className="text-slate-500">Selecciona el paquete base para tu proyecto (elige uno).</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {mainServices.map(item => {
              const isSelected = selectedMainService === item.id;
              const videoUrl = (item as any).videoUrl || null;
              const imageUrl = (item as any).imageUrl || company.coverImageUrl;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedMainService(item.id)}
                  className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 group bg-white
                    ${isSelected ? 'shadow-md' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'}
                  `}
                  style={isSelected ? { borderColor: company.colorPrimary, boxShadow: `0 0 0 4px ${company.colorPrimary}15` } : {}}
                >
                  {(videoUrl || imageUrl) && (
                    <ServiceVideoThumbnail
                      imageUrl={imageUrl}
                      videoUrl={videoUrl}
                      isHovered={hoveredPreviewId === item.id}
                      onHoverStart={() => scheduleHoverPreview(item.id)}
                      onHoverEnd={cancelHoverPreview}
                      onOpen={(e) => {
                        e.stopPropagation();
                        if (videoUrl) {
                          setActiveVideoModal({
                            serviceName: item.name,
                            videoUrl,
                            onSelect: () => setSelectedMainService(item.id),
                            isSelected,
                          });
                        }
                      }}
                    />
                  )}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1" style={isSelected ? { color: company.colorPrimary } : { color: '#1e293b' }}>
                        {item.name}
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed mb-3">{item.description}</p>
                    </div>
                    <div className="shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors"
                      style={isSelected ? { borderColor: company.colorPrimary, backgroundColor: company.colorPrimary, color: '#fff' } : { borderColor: '#cbd5e1' }}>
                      {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                    </div>
                  </div>
                  {showPrice && (
                    <div className="flex items-center justify-end mt-3 pt-2 border-t border-slate-100">
                      <span className="font-bold text-slate-800 text-sm">
                        {item.currency} {item.basePrice.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Addon Services Selection */}
        {addonServices.length > 0 && (
          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Servicios Adicionales</h2>
              <p className="text-slate-500">Potencia tu paquete con estas opciones (puedes elegir varios).</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {addonServices.map(item => {
                const isSelected = selectedAddons.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleAddon(item.id)}
                    className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 group bg-white
                      ${isSelected ? 'shadow-md' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'}
                    `}
                    style={isSelected ? { borderColor: company.colorSecondary, boxShadow: `0 0 0 4px ${company.colorSecondary}15` } : {}}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold" style={isSelected ? { color: company.colorSecondary } : { color: '#1e293b' }}>
                            {item.name}
                          </h3>
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed mb-3">{item.description}</p>
                      </div>
                      <div className="shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors"
                        style={isSelected ? { borderColor: company.colorSecondary, backgroundColor: company.colorSecondary, color: '#fff' } : { borderColor: '#cbd5e1' }}>
                        {isSelected && <CheckSquare className="w-4 h-4" />}
                      </div>
                    </div>
                    {showPrice && (
                      <div className="flex items-center justify-end mt-3 pt-2 border-t border-slate-100">
                        <span className="font-bold text-slate-800 text-sm">
                          + {item.currency} {item.basePrice.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Calendar Picker Section */}
        <section>
          <CalendarPicker
            companySlug={company.slug}
            colorPrimary={company.colorPrimary || '#0ea5e9'}
            onSelectBooking={(date, time) => setBooking({ date, time })}
            onClearBooking={() => setBooking(null)}
          />
        </section>

        {/* SECCIÓN AI ANALYSIS CARD (SI FUE RECOMENDADO POR EL BOT) */}
        {aiAnalysis && (
          <AiAnalysisCard
            analysis={aiAnalysis}
            colorPrimary={company.colorPrimary || '#0ea5e9'}
            onClear={() => setAiAnalysis(null)}
          />
        )}

        {/* PASO 3: TUS DATOS */}
        <section ref={contactSectionRef} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: company.colorPrimary }}>
              3
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Tus Datos de Contacto</h2>
              <p className="text-sm text-slate-500">Completa tus datos para enviarte la propuesta formal.</p>
            </div>
          </div>

          {submitted ? (
            <div className="text-center py-12 px-4 rounded-2xl border" style={{ backgroundColor: `${company.colorPrimary}10`, borderColor: `${company.colorPrimary}30` }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg text-white" style={{ backgroundColor: company.colorPrimary, boxShadow: `0 4px 14px 0 ${company.colorPrimary}50` }}>
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">¡Solicitud Recibida!</h3>
              <p className="text-slate-600 mb-6">Nos pondremos en contacto contigo pronto.</p>

              {booking && (
                <div className="bg-white p-4 rounded-xl border border-green-200 text-left max-w-sm mx-auto shadow-sm mb-6 flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Reunión confirmada</p>
                    <p className="text-slate-600 text-xs">Para el {booking.date} a las {booking.time}</p>
                  </div>
                </div>
              )}

              <div className="bg-white p-6 rounded-xl border border-slate-200 text-left max-w-sm mx-auto shadow-sm">
                <p className="font-semibold text-slate-800 mb-4 text-center">Resumen de Pre-Cotización</p>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">Subtotal:</span>
                  <span className="font-medium text-slate-800">PEN {subtotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">IGV (18%):</span>
                  <span className="font-medium text-slate-800">PEN {igv.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-bold text-base mt-4 pt-4 border-t border-slate-100 items-center">
                  <span className="text-slate-800 text-xs sm:text-sm">Cotización Estimada (Inc. IGV):</span>
                  <span className="text-lg font-black" style={{ color: company.colorPrimary }}>PEN {total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
                  <p>
                    <strong>Nota:</strong> Esta es una estimación basada en la información proporcionada. El precio final puede variar después de la reunión de levantamiento de requerimientos.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 text-sm text-center space-y-3">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Contacto de la empresa</p>

                  {company.contactPhone && (
                    <a
                      href={`https://wa.me/${company.contactPhone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 text-slate-800 font-bold hover:text-emerald-600 transition-colors group"
                      title="Enviar mensaje por WhatsApp"
                    >
                      <img
                        src={`${API_URL}/public/companies/images/whatsapp.png`}
                        alt="WhatsApp"
                        className="w-5 h-5 object-contain group-hover:scale-110 transition-transform shrink-0"
                      />
                      <span>{company.contactPhone}</span>
                    </a>
                  )}

                  {company.contactEmail && (
                    <div className="text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5 pt-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{company.contactEmail}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleOpenModal} className="space-y-5">
              {(() => {
                const activeTemplate = (company as any)?.templates?.[0] || (company as any)?.quoteTemplates?.[0];
                const fc = activeTemplate?.projectData?.fieldConfigs || {};

                return (
                  <div className="grid sm:grid-cols-2 gap-5">
                    {fc.nombre?.enabled !== false && (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" /> {fc.nombre?.label || 'Nombre'}
                        </label>
                        <input required type="text" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 outline-none transition-all focus:ring-2 focus:border-transparent text-sm"
                          style={{ '--tw-ring-color': company.colorPrimary } as React.CSSProperties}
                          value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder={fc.nombre?.placeholder || "Tu nombre"} />
                      </div>
                    )}

                    {fc.empresa?.enabled !== false && (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-slate-400" /> {fc.empresa?.label || 'Empresa / Negocio'}
                        </label>
                        <input type="text" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 outline-none transition-all focus:ring-2 focus:border-transparent text-sm"
                          style={{ '--tw-ring-color': company.colorPrimary } as React.CSSProperties}
                          value={formData.businessName} onChange={e => setFormData({ ...formData, businessName: e.target.value })} placeholder={fc.empresa?.placeholder || "Opcional"} />
                      </div>
                    )}

                    {fc.correo?.enabled !== false && (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-400" /> {fc.correo?.label || 'Correo'}
                        </label>
                        <input required type="email" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 outline-none transition-all focus:ring-2 focus:border-transparent text-sm"
                          style={{ '--tw-ring-color': company.colorPrimary } as React.CSSProperties}
                          value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder={fc.correo?.placeholder || "tucorreo@ejemplo.com"} />
                      </div>
                    )}

                    {fc.telefono?.enabled !== false && (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-400" /> {fc.telefono?.label || 'WhatsApp'}
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={countryCode}
                            onChange={e => {
                              const newCode = e.target.value;
                              setCountryCode(newCode);
                              setFormData({ ...formData, phone: `${newCode} ${phoneNumber.trim()}` });
                            }}
                            className="px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-medium outline-none transition-all focus:ring-2 focus:border-transparent shrink-0 cursor-pointer shadow-sm"
                            style={{ '--tw-ring-color': company.colorPrimary } as React.CSSProperties}
                          >
                            {COUNTRY_CODES.map(c => (
                              <option key={c.code + c.country} value={c.code}>
                                {c.flag} {c.code} ({c.country})
                              </option>
                            ))}
                          </select>
                          <input
                            required
                            type="tel"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 outline-none transition-all focus:ring-2 focus:border-transparent text-sm"
                            style={{ '--tw-ring-color': company.colorPrimary } as React.CSSProperties}
                            value={phoneNumber}
                            onChange={e => {
                              const val = e.target.value;
                              setPhoneNumber(val);
                              setFormData({ ...formData, phone: `${countryCode} ${val.trim()}` });
                            }}
                            placeholder={fc.telefono?.placeholder || "999 999 999"}
                          />
                        </div>
                      </div>
                    )}

                    {fc.presupuesto?.enabled !== false && (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-slate-400" /> {fc.presupuesto?.label || 'Presupuesto disponible'}
                        </label>
                        <input type="text" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 outline-none transition-all focus:ring-2 focus:border-transparent text-sm"
                          style={{ '--tw-ring-color': company.colorPrimary } as React.CSSProperties}
                          value={formData.budget} onChange={e => setFormData({ ...formData, budget: e.target.value })} placeholder={fc.presupuesto?.placeholder || "Puede ser un monto exacto o un intervalo"} />
                      </div>
                    )}

                    {fc.detalles?.enabled !== false && (
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-slate-400" /> {fc.detalles?.label || 'Detalles de tu proyecto / ¿Qué necesitas?'}
                        </label>
                        <textarea
                          rows={3}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 outline-none transition-all focus:ring-2 focus:border-transparent text-sm resize-y"
                          style={{ '--tw-ring-color': company.colorPrimary } as React.CSSProperties}
                          value={formData.notes}
                          onChange={e => setFormData({ ...formData, notes: e.target.value })}
                          placeholder={fc.detalles?.placeholder || "Describe brevemente tus requerimientos o cualquier detalle importante..."}
                        />
                      </div>
                    )}
                  </div>
                );
              })()}
              <button
                disabled={!selectedMainService || submitting}
                type="submit"
                className="w-full mt-6 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: (!selectedMainService || submitting) ? '#94a3b8' : company.colorPrimary }}
              >
                {submitting ? 'Enviando...' : (
                  <>
                    Solicitar Cotización Formal
                    <Send className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}
        </section>
      </main>

      {/* Modal de Resumen y Confirmación */}
      <QuoteSummaryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmSubmission}
        submitting={submitting}
        company={company}
        selectedMainService={selectedMainServiceObj || null}
        selectedAddonItems={selectedAddonObjs}
        onRemoveMainService={() => setSelectedMainService(null)}
        onRemoveAddon={(id) => toggleAddon(id)}
        formData={formData}
        booking={booking}
      />

      {/* CHATBOT WIDGET FLOTANTE (ESTILO TIDIO) */}
      <PrecotizadorChatWidget
        company={company}
        onConfirmRecommendation={handleConfirmRecommendation}
      />

      {/* MODAL DE VIDEO DEMO (30s) */}
      {activeVideoModal && (
        <VideoDemoModal
          isOpen={Boolean(activeVideoModal)}
          onClose={() => setActiveVideoModal(null)}
          serviceName={activeVideoModal.serviceName}
          videoUrl={activeVideoModal.videoUrl}
          colorPrimary={company.colorPrimary || '#0ea5e9'}
          onSelectService={activeVideoModal.onSelect}
          isSelected={activeVideoModal.isSelected}
        />
      )}
    </div>
  );
}

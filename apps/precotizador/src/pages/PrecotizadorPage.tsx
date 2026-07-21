import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Send, CheckCircle2, Briefcase, Phone, Mail, User, ArrowLeft, CheckSquare } from 'lucide-react';
import { useCatalog } from '../hooks/useCatalog';
import { API_URL } from '../config';

export function PrecotizadorPage() {
  const { companySlug } = useParams();
  const { company, items, loading, error } = useCatalog(companySlug);
  
  const [selectedMainService, setSelectedMainService] = useState<string | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', businessName: '', phone: '', email: '' });
  const [submitted, setSubmitted] = useState(false);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="text-xl font-medium text-slate-500">Cargando catálogo...</p></div>;
  if (error || !company) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="text-xl font-medium text-red-500">{error || 'Empresa no encontrada'}</p></div>;

  const mainServices = items.filter(i => !i.isAddon);
  const addonServices = items.filter(i => i.isAddon);

  const toggleAddon = (id: string) => {
    const next = new Set(selectedAddons);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedAddons(next);
  };

  const selectedMainServiceObj = mainServices.find(i => i.id === selectedMainService);
  const subtotal = (selectedMainServiceObj ? selectedMainServiceObj.basePrice : 0) + 
    addonServices.filter(i => selectedAddons.has(i.id)).reduce((sum, item) => sum + item.basePrice, 0);
  const igv = subtotal * 0.18;
  const total = subtotal + igv;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMainServiceObj) return;
    setSubmitting(true);
    
    try {
      const selectedAddonObjs = addonServices.filter(i => selectedAddons.has(i.id));
      
      const payload = {
        ...formData,
        companyId: company.id,
        source: 'precotizador-web',
        answers: {
          serviciosPrincipales: [selectedMainServiceObj.name],
          addons: selectedAddonObjs.map(a => a.name),
          subtotal,
          igv,
          total
        }
      };

      const res = await fetch(`${API_URL}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Error al enviar la solicitud');
      
      setSubmitted(true);
    } catch (err) {
      alert('Hubo un error al enviar tu solicitud. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
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
            <p className="text-sm text-slate-500 font-medium">Cotización Estimada (Inc. IGV)</p>
            <p className="text-2xl font-black" style={{ color: company.colorPrimary }}>
              PEN {total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </p>
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
              return (
                <div 
                  key={item.id}
                  onClick={() => setSelectedMainService(item.id)}
                  className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 group bg-white
                    ${isSelected ? 'shadow-md' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'}
                  `}
                  style={isSelected ? { borderColor: company.colorPrimary, boxShadow: `0 0 0 4px ${company.colorPrimary}15` } : {}}
                >
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
                  <div className="mt-2 font-bold text-slate-800">
                    {item.currency} {item.basePrice.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </div>
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
                    <div className="mt-2 font-bold text-slate-800">
                      + {item.currency} {item.basePrice.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Contact Form */}
        <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: company.colorPrimary }} />
          
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Completa tu solicitud</h2>
            <p className="text-slate-500">Déjanos tus datos para enviarte la propuesta formal y conversar sobre tu proyecto.</p>
          </div>

          {submitted ? (
            <div className="text-center py-12 px-4 rounded-2xl border" style={{ backgroundColor: `${company.colorPrimary}10`, borderColor: `${company.colorPrimary}30` }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg text-white" style={{ backgroundColor: company.colorPrimary, boxShadow: `0 4px 14px 0 ${company.colorPrimary}50` }}>
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">¡Solicitud Recibida!</h3>
              <p className="text-slate-600 mb-6">Nos pondremos en contacto contigo pronto.</p>
              
              <div className="bg-white p-6 rounded-xl border border-slate-200 text-left max-w-sm mx-auto shadow-sm">
                <p className="font-semibold text-slate-800 mb-4 text-center">Resumen de Cotización</p>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">Subtotal:</span>
                  <span className="font-medium text-slate-800">PEN {subtotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">IGV (18%):</span>
                  <span className="font-medium text-slate-800">PEN {igv.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between font-bold text-lg mt-4 pt-4 border-t border-slate-100">
                  <span className="text-slate-800">Total:</span>
                  <span style={{ color: company.colorPrimary }}>PEN {total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 text-sm text-center space-y-2">
                  <p className="text-slate-500">Contacto de la empresa:</p>
                  <p className="font-medium text-slate-800">{company.contactPhone}</p>
                  <p className="font-medium text-slate-800">{company.contactEmail}</p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" /> Nombre
                  </label>
                  <input required type="text" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 outline-none transition-all focus:ring-2 focus:border-transparent" 
                         style={{ '--tw-ring-color': company.colorPrimary } as React.CSSProperties}
                         value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Tu nombre" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-slate-400" /> Empresa / Negocio
                  </label>
                  <input type="text" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 outline-none transition-all focus:ring-2 focus:border-transparent" 
                         style={{ '--tw-ring-color': company.colorPrimary } as React.CSSProperties}
                         value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} placeholder="Opcional" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" /> Correo
                  </label>
                  <input required type="email" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 outline-none transition-all focus:ring-2 focus:border-transparent" 
                         style={{ '--tw-ring-color': company.colorPrimary } as React.CSSProperties}
                         value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="tucorreo@ejemplo.com" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" /> WhatsApp
                  </label>
                  <input required type="tel" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 outline-none transition-all focus:ring-2 focus:border-transparent" 
                         style={{ '--tw-ring-color': company.colorPrimary } as React.CSSProperties}
                         value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+51 999 999 999" />
                </div>
              </div>
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
    </div>
  );
}

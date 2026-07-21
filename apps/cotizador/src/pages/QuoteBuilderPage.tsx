import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import type { Company, QuoteItem } from '../types';
import { PlusCircle, Trash2, ArrowLeft, Save, X, ImagePlus, ChevronDown, ChevronRight } from 'lucide-react';

// ---------- helpers ----------
const emptyItem = (): QuoteItem & { _key: string } => ({
  _key: Math.random().toString(36).slice(2),
  detalle: '',
  cantidad: 1,
  precioUnitario: 0,
  total: 0,
});

function currency(n: number) {
  return n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ---------- ItemRow ----------
function ItemRow({
  item,
  onChange,
  onRemove,
}: {
  item: QuoteItem & { _key: string };
  onChange: (updated: QuoteItem & { _key: string }) => void;
  onRemove: () => void;
}) {
  const handleField = (field: keyof QuoteItem, val: string | number) => {
    const updated = { ...item, [field]: val };
    if (field === 'cantidad' || field === 'precioUnitario') {
      updated.total = Number(updated.cantidad) * Number(updated.precioUnitario);
    }
    onChange(updated);
  };

  return (
    <tr className="border-b border-slate-100 last:border-0 group">
      <td className="py-2 pr-3">
        <textarea
          rows={2}
          className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 resize-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition-all"
          placeholder="Descripción del ítem"
          value={item.detalle}
          onChange={e => handleField('detalle', e.target.value)}
        />
      </td>
      <td className="py-2 px-2 w-20">
        <input
          type="number"
          min={1}
          className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 text-center focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition-all"
          value={item.cantidad}
          onChange={e => handleField('cantidad', parseFloat(e.target.value) || 0)}
        />
      </td>
      <td className="py-2 px-2 w-32">
        <input
          type="number"
          min={0}
          step={0.01}
          className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 text-right focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition-all"
          value={item.precioUnitario}
          onChange={e => handleField('precioUnitario', parseFloat(e.target.value) || 0)}
        />
      </td>
      <td className="py-2 pl-2 w-28 text-right">
        <span className="text-sm font-medium text-slate-700">S/ {currency(item.total)}</span>
      </td>
      <td className="py-2 pl-2 w-8">
        <button onClick={onRemove} className="text-slate-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

// ---------- ItemsTable ----------
function ItemsTable({
  title,
  items,
  setItems,
  addLabel,
}: {
  title: string;
  items: (QuoteItem & { _key: string })[];
  setItems: React.Dispatch<React.SetStateAction<(QuoteItem & { _key: string })[]>>;
  addLabel: string;
}) {
  const updateItem = (key: string, updated: QuoteItem & { _key: string }) => {
    setItems(prev => prev.map(i => i._key === key ? updated : i));
  };
  const removeItem = (key: string) => setItems(prev => prev.filter(i => i._key !== key));

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">{title}</p>
      {items.length > 0 && (
        <table className="w-full mb-3">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="text-left text-xs font-semibold text-slate-500 pb-2 pr-3">Detalle</th>
              <th className="text-center text-xs font-semibold text-slate-500 pb-2 px-2">Cant.</th>
              <th className="text-right text-xs font-semibold text-slate-500 pb-2 px-2">P. Unitario</th>
              <th className="text-right text-xs font-semibold text-slate-500 pb-2 pl-2">Total</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <ItemRow key={item._key} item={item} onChange={u => updateItem(item._key, u)} onRemove={() => removeItem(item._key)} />
            ))}
          </tbody>
        </table>
      )}
      <button
        type="button"
        onClick={() => setItems(prev => [...prev, emptyItem()])}
        className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
      >
        <PlusCircle className="w-4 h-4" />
        {addLabel}
      </button>
    </div>
  );
}

// ========================
// MAIN PAGE
// ========================
import { useLocation } from 'react-router-dom';

export function QuoteBuilderPage() {
  const { companySlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const leadState = location.state?.leadData;

  const [company, setCompany] = useState<Company | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddons, setShowAddons] = useState(leadState?.additionalItems?.length > 0);

  // Form state
  const [clientData, setClientData] = useState({
    empresa: leadState?.empresa || '',
    ruc: '',
    solicitante: leadState?.solicitante || '',
    direccion: '',
    telefono: leadState?.telefono || '',
    correo: leadState?.correo || '',
  });
  
  const [projectData, setProjectData] = useState({
    nombre: leadState?.proyecto || '',
    modalidad: 'Proyecto por alcance',
    plazo: '45 días calendario',
  });
  
  const [items, setItems] = useState<(QuoteItem & { _key: string })[]>(
    leadState?.items?.length > 0 ? leadState.items.map((i: any) => ({ ...i, _key: Math.random().toString(36).slice(2) })) : [emptyItem()]
  );
  
  const [additionalItems, setAdditionalItems] = useState<(QuoteItem & { _key: string })[]>(
    leadState?.additionalItems?.length > 0 ? leadState.additionalItems.map((i: any) => ({ ...i, _key: Math.random().toString(36).slice(2) })) : []
  );
  const [considerations, setConsiderations] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [validity, setValidity] = useState('15 días calendario');
  const [paymentTerms, setPaymentTerms] = useState('40% adelanto, 30% al aprobar maqueta, 30% al finalizar');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!companySlug) return;
    fetch(`${API_URL}/catalog/${companySlug}`)
      .then(res => res.json())
      .then(data => { const { catalogItems: _, ...co } = data; setCompany(co); setLoadingCompany(false); })
      .catch(() => setLoadingCompany(false));
  }, [companySlug]);

  // Totals
  const itemsSubtotal = items.reduce((s, i) => s + i.total, 0);
  const addonsSubtotal = additionalItems.reduce((s, i) => s + i.total, 0);
  const subtotal = itemsSubtotal + addonsSubtotal;
  const igv = subtotal * 0.18;
  const total = subtotal + igv;

  const hasItems = items.some(i => i.detalle.trim() && i.total > 0);
  const canSave = hasItems && clientData.empresa.trim() && clientData.solicitante.trim() && projectData.nombre.trim();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setImages(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!company || !canSave) return;
    setSaving(true);
    try {
      const payload = {
        companyId: company.id,
        clientData: { empresa: clientData.empresa, ruc: clientData.ruc || undefined, solicitante: clientData.solicitante, direccion: clientData.direccion || undefined, telefono: clientData.telefono || undefined, correo: clientData.correo || undefined },
        projectData: { nombre: projectData.nombre, modalidad: projectData.modalidad || undefined, plazo: projectData.plazo || undefined },
        items: items.filter(i => i.detalle.trim()).map(({ _key, ...rest }) => rest),
        additionalItems: additionalItems.filter(i => i.detalle.trim()).map(({ _key, ...rest }) => rest),
        considerations: considerations || undefined,
        images: images.length > 0 ? images : undefined,
      };

      const res = await fetch(`${API_URL}/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Error al guardar');
      const quote = await res.json();
      alert(`✅ Cotización ${quote.number} guardada exitosamente`);
      navigate('/lista');
    } catch {
      alert('Hubo un error al guardar la cotización. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingCompany) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  );

  const inputCls = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-300";
  const labelCls = "block text-xs font-semibold text-slate-500 mb-1";

  return (
    <div className="max-w-4xl mx-auto pb-16">
      {/* ---- TOP TOOLBAR ---- */}
      <div className="flex items-center justify-between mb-6 sticky top-0 bg-slate-50 py-3 z-10 -mx-6 px-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          {company && (
            <div className="flex items-center gap-3">
              {company.logoUrl ? (
                <img src={`${API_URL}/public${company.logoUrl}`} alt={company.name} className="h-9 object-contain" />
              ) : (
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-base" style={{ backgroundColor: company.colorPrimary }}>
                  {company.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-xs text-slate-400 leading-none">Nueva cotización</p>
                <p className="font-semibold text-slate-800">{company.name}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-400">Total estimado (inc. IGV)</p>
            <p className="font-bold text-slate-800 text-lg">S/ {currency(total)}</p>
          </div>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
            style={{ backgroundColor: company?.colorPrimary || '#1e293b' }}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando…' : 'Guardar y Exportar PDF'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* ---- DATOS DEL CLIENTE ---- */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">1</span>
            Datos del cliente
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Empresa / Cliente <span className="text-red-400">*</span></label>
              <input className={inputCls} placeholder="Nombre de la empresa" value={clientData.empresa} onChange={e => setClientData({ ...clientData, empresa: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>RUC</label>
              <input className={inputCls} placeholder="20XXXXXXXXX" value={clientData.ruc} onChange={e => setClientData({ ...clientData, ruc: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Solicitante <span className="text-red-400">*</span></label>
              <input className={inputCls} placeholder="Nombre completo" value={clientData.solicitante} onChange={e => setClientData({ ...clientData, solicitante: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Dirección</label>
              <input className={inputCls} placeholder="Av. / Calle / Urb." value={clientData.direccion} onChange={e => setClientData({ ...clientData, direccion: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Teléfono</label>
              <input className={inputCls} placeholder="+51 999 000 000" value={clientData.telefono} onChange={e => setClientData({ ...clientData, telefono: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Correo</label>
              <input type="email" className={inputCls} placeholder="correo@empresa.com" value={clientData.correo} onChange={e => setClientData({ ...clientData, correo: e.target.value })} />
            </div>
          </div>
        </section>

        {/* ---- DATOS DEL PROYECTO ---- */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">2</span>
            Detalles del proyecto
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-3">
              <label className={labelCls}>Nombre del proyecto <span className="text-red-400">*</span></label>
              <input className={inputCls} placeholder="Ej: Desarrollo web para Empresa XYZ" value={projectData.nombre} onChange={e => setProjectData({ ...projectData, nombre: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Modalidad</label>
              <input className={inputCls} placeholder="Proyecto por alcance" value={projectData.modalidad} onChange={e => setProjectData({ ...projectData, modalidad: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Plazo estimado</label>
              <input className={inputCls} placeholder="45 días calendario" value={projectData.plazo} onChange={e => setProjectData({ ...projectData, plazo: e.target.value })} />
            </div>
          </div>
        </section>

        {/* ---- DETALLE DE PROPUESTA ---- */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">3</span>
            Detalle de la propuesta
          </h2>

          <ItemsTable title="Paquete base" items={items} setItems={setItems} addLabel="Agregar ítem" />

          {/* Adicionales collapsable */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={() => setShowAddons(!showAddons)}
              className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
            >
              {showAddons ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              Características adicionales
              <span className="text-xs font-normal text-slate-400">(opcional)</span>
            </button>

            {showAddons && (
              <div className="mt-4">
                <ItemsTable title="Características adicionales" items={additionalItems} setItems={setAdditionalItems} addLabel="Agregar adicional" />
              </div>
            )}
          </div>
        </section>

        {/* ---- TOTALES ---- */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">4</span>
            Totales
          </h2>
          <div className="max-w-xs ml-auto space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Sub Total</span>
              <span className="font-medium text-slate-800">S/ {currency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">IGV 18%</span>
              <span className="font-medium text-slate-800">S/ {currency(igv)}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t border-slate-200 pt-2 mt-2">
              <span className="text-slate-800">TOTAL</span>
              <span style={{ color: company?.colorPrimary || '#1e293b' }}>S/ {currency(total)}</span>
            </div>
          </div>
        </section>

        {/* ---- CONSIDERACIONES E IMÁGENES ---- */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">5</span>
            Consideraciones
          </h2>

          <textarea
            rows={5}
            className={`${inputCls} resize-none mb-4`}
            placeholder="Ej: Los precios incluyen IGV. El plazo inicia luego de la aprobación del contrato y pago del adelanto..."
            value={considerations}
            onChange={e => setConsiderations(e.target.value)}
          />

          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300 rounded-lg px-3 py-2 transition-all"
            >
              <ImagePlus className="w-4 h-4" />
              Agregar imagen
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />

            {images.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {images.map((src, idx) => (
                  <div key={idx} className="relative group">
                    <img src={src} alt={`img-${idx}`} className="w-24 h-24 object-cover rounded-xl border border-slate-200" />
                    <button
                      type="button"
                      onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ---- VALIDEZ Y FORMA DE PAGO ---- */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">6</span>
            Condiciones comerciales
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Validez de la oferta</label>
              <input className={inputCls} value={validity} onChange={e => setValidity(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Forma de pago</label>
              <textarea rows={2} className={`${inputCls} resize-none`} value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

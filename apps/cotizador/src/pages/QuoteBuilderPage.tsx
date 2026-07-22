import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { API_URL } from '../config';
import type { Company, QuoteItem } from '../types';
import { PlusCircle, Trash2, ArrowLeft, Save, X, ImagePlus, ChevronDown, ChevronRight, ChevronUp, FileText, LayoutTemplate, Star } from 'lucide-react';

// ---------- helpers ----------
const emptyItem = (): QuoteItem & { _key: string } => ({
  _key: Math.random().toString(36).slice(2),
  detalle: '',
  cantidad: 1,
  precioUnitario: 0,
  total: 0,
});

const defaultSections = [
  {
    title: "Alcance del Servicio",
    content: "El presente servicio comprende el desarrollo e implementación de las funcionalidades descritas en esta cotización, conforme a los requerimientos previamente definidos y aprobados por el cliente.\n\nCualquier modificación al alcance o incorporación de nuevas funcionalidades será evaluada y cotizada por separado.\n\nLa presente cotización comprende únicamente los entregables descritos en este documento. Cualquier componente o activo técnico no contemplado expresamente en la sección «Entrega de Productos Finales» se entenderá excluido del alcance de la presente propuesta, salvo acuerdo escrito entre las partes.",
    enabled: false
  },
  {
    title: "Condiciones para la realización del Servicio",
    content: "El cliente deberá proporcionar oportunamente toda la información necesaria para el desarrollo del proyecto, incluyendo textos, imágenes, logotipos, manual de identidad visual, catálogos de productos y demás recursos requeridos.\n\nEn caso de requerirse acceso a servicios de terceros (hosting, dominio, pasarelas de pago, correos corporativos, APIs, entre otros), el cliente deberá proporcionar las credenciales correspondientes.\n\nLos retrasos ocasionados por la entrega tardía de información, aprobaciones o accesos podrán modificar el cronograma de ejecución sin generar responsabilidad para Vertex Developers.",
    enabled: false
  },
  {
    title: "Responsabilidades del Cliente",
    content: "• Proporcionar oportunamente la información y recursos necesarios.\n- Aprobar los requerimientos funcionales antes del inicio del desarrollo.",
    enabled: false
  },
  {
    title: "Plazos de Ejecución",
    content: "El tiempo estimado para el desarrollo del proyecto es de 45 días calendario, distribuidos de la siguiente manera:\n\n- Análisis y levantamiento de requerimientos: 5 días calendario.\n- Diseño de interfaces (UI/UX): 5 días calendario.\n- Desarrollo de la aplicación: 30 días calendario.\n- Pruebas, ajustes e implementación: 5 días calendario.\n\n*El plazo es referencial a aceptación de servicios de terceros: Pasarelas de pago, APIs externas.",
    enabled: false
  },
  {
    title: "Pruebas y Aceptación",
    content: "Antes de la entrega final se realizarán pruebas funcionales para verificar el correcto funcionamiento de las funcionalidades incluidas en el alcance.\n\nEl cliente dispondrá de un período de revisión de hasta 5 días calendario para reportar observaciones relacionadas con el alcance contratado.\n\nLas observaciones que impliquen nuevas funcionalidades serán consideradas como requerimientos adicionales y serán cotizadas por separado.",
    enabled: false
  },
  {
    title: "Forma de Pago",
    content: "• 40% del monto total al aceptar la cotización, como adelanto para el inicio del proyecto.\n- 30% al aprobar la maqueta funcional (frontend), una vez validado el diseño, la estructura y la experiencia de usuario.\n- 30% restante al concluir el desarrollo, luego de la demostración de las funcionalidades del sistema mediante una reunión virtual y la conformidad del cliente.\n\nLos entregables del proyecto serán entregados una vez confirmado el pago del 100% del monto contratado.\n\nEn caso de retraso en cualquiera de los pagos establecidos, Vertex Developers podrá suspender temporalmente las actividades del proyecto hasta la regularización de los importes pendientes.",
    enabled: false
  },
  {
    title: "Validez de la Cotización",
    content: "La presente cotización tiene una vigencia de 15 días calendario contados desde su fecha de emisión.\n\nLa presente cotización incluye IGV.",
    enabled: false
  },
  {
    title: "Garantía del Servicio",
    content: "Vertex Developers brinda una garantía de 60 días calendario contados a partir de la entrega del proyecto.\n\nLa garantía cubre exclusivamente la corrección de errores de programación relacionados con las funcionalidades incluidas en el alcance aprobado.\n\nLa garantía no incluye:\n- Nuevas funcionalidades.\n- Cambios en los procesos del negocio.\n- Modificaciones solicitadas después de la aprobación del proyecto.\n- Problemas ocasionados por terceros.\n- Fallas derivadas de modificaciones realizadas por personas ajenas a Vertex Developers.\n- Problemas ocasionados por el servidor, hosting, proveedores de Internet o servicios externos.",
    enabled: false
  },
  {
    title: "Licencia de Uso del software",
    content: "Con la entrega del proyecto y una vez efectuado el pago total del servicio, el cliente adquiere una licencia de uso sobre la solución desarrollada, que le permite utilizarla para las actividades propias de su organización conforme al alcance contratado.\n\nLos componentes tecnológicos, librerías, frameworks, plantillas, arquitecturas, metodologías, herramientas internas y demás elementos desarrollados previamente o reutilizables por Vertex Developers continúan siendo de su titularidad, pudiendo ser utilizados en otros proyectos sin afectar los derechos de uso otorgados al cliente.\n\nLa entrega del código fuente únicamente se realizará cuando haya sido expresamente incluida en la presente cotización o acordada posteriormente por escrito entre ambas partes.",
    enabled: false
  },
  {
    title: "Entrega de Productos Finales",
    content: "Al finalizar el proyecto se entregará:\n\n- Aplicación web completamente funcional e implementada.\n- Respaldo de la base de datos (cuando corresponda).\n- Manual de usuario.\n- Documentación funcional incluida en la presente cotización (si aplica).\n- Credenciales de acceso a los servicios contratados por el cliente (cuando corresponda).\n- Capacitación para el personal designado.\n- Acta de conformidad del servicio.\n\nTodos los entregables serán proporcionados en formato digital mediante archivos electrónicos o mediante acceso a la infraestructura del cliente, según corresponda.",
    enabled: false
  }
];

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

export function QuoteBuilderPage() {
  const { companySlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const leadState = location.state?.leadData;

  const [company, setCompany] = useState<Company | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddons, setShowAddons] = useState(leadState?.additionalItems?.length > 0);

  const [templates, setTemplates] = useState<any[]>([]);
  const [showStartModal, setShowStartModal] = useState(true);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateCode, setTemplateCode] = useState('');
  const [templateName, setTemplateName] = useState('');

  const [clientData, setClientData] = useState({
    empresa: leadState?.empresa || '',
    ruc: '',
    solicitante: leadState?.solicitante || '',
    direccion: '',
    telefono: leadState?.telefono || '',
    correo: leadState?.correo || '',
    tipoCliente: '',
    clienteNuevoRecurrente: '',
    fuenteCliente: '',
  });
  
  const [projectData, setProjectData] = useState({
    nombre: leadState?.proyecto || '',
    modalidad: 'Proyecto por alcance',
    plazo: '45 días calendario',
    ubicacionProyecto: '',
    sectorProyecto: '',
    tipoProyecto: '',
    tipoServicio: '',
  });
  
  const [items, setItems] = useState<(QuoteItem & { _key: string })[]>(
    leadState?.items?.length > 0 ? leadState.items.map((i: any) => ({ ...i, _key: Math.random().toString(36).slice(2) })) : [emptyItem()]
  );
  
  const [additionalItems, setAdditionalItems] = useState<(QuoteItem & { _key: string })[]>(
    leadState?.additionalItems?.length > 0 ? leadState.additionalItems.map((i: any) => ({ ...i, _key: Math.random().toString(36).slice(2) })) : []
  );
  const [considerations, setConsiderations] = useState('');
  const [sections, setSections] = useState(defaultSections);
  const [images, setImages] = useState<string[]>([]);
  const [validity, setValidity] = useState('15 días calendario');
  const [paymentTerms, setPaymentTerms] = useState('40% adelanto, 30% al aprobar maqueta, 30% al finalizar');
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!companySlug) return;
    Promise.all([
      fetch(`${API_URL}/catalog/${companySlug}`).then(res => res.json()),
      fetch(`${API_URL}/templates?companySlug=${companySlug}`).then(res => res.json())
    ])
    .then(([data, tpls]) => {
      const { catalogItems: _, ...co } = data;
      setCompany(co);
      setTemplates(tpls);
      setLoadingCompany(false);
    })
    .catch(() => setLoadingCompany(false));
  }, [companySlug]);

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
        ubicacionProyecto: projectData.ubicacionProyecto || undefined,
        sectorProyecto: projectData.sectorProyecto || undefined,
        tipoProyecto: projectData.tipoProyecto || undefined,
        tipoServicio: projectData.tipoServicio || undefined,
        tipoCliente: clientData.tipoCliente || undefined,
        clienteNuevoRecurrente: clientData.clienteNuevoRecurrente || undefined,
        fuenteCliente: clientData.fuenteCliente || undefined,
        items: items.filter(i => i.detalle.trim()).map(({ _key, ...rest }) => rest),
        additionalItems: additionalItems.filter(i => i.detalle.trim()).map(({ _key, ...rest }) => rest),
        considerations: considerations || undefined,
        sections: sections,
        images: images.length > 0 ? images : undefined,
      };

      const res = await fetch(`${API_URL}/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Error al guardar');
      const quote = await res.json();
      window.open(`${API_URL}/quotes/${quote.id}/pdf`, '_blank');
      navigate('/lista');
    } catch {
      alert('Hubo un error al guardar la cotización. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!company || !templateCode.trim() || !templateName.trim()) return;
    try {
      const payload = {
        companyId: company.id,
        code: templateCode,
        name: templateName,
        category: 'personalizada',
        projectData: { nombre: projectData.nombre, modalidad: projectData.modalidad, plazo: projectData.plazo },
        items: items.filter(i => i.detalle.trim()).map(({ _key, ...rest }) => rest),
        sections: sections,
        isCustom: true
      };
      const res = await fetch(`${API_URL}/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setShowSaveTemplateModal(false);
      alert('Plantilla guardada con éxito');
    } catch {
      alert('Error al guardar plantilla');
    }
  };

  const applyTemplate = (tpl: any) => {
    if (tpl.projectData) {
      setProjectData(prev => ({ ...prev, ...tpl.projectData }));
    }
    if (tpl.items?.length > 0) {
      setItems(tpl.items.map((i: any) => ({ ...i, _key: Math.random().toString(36).slice(2) })));
    }
    if (tpl.sections && Array.isArray(tpl.sections)) {
      // Build a Map keyed by normalized title for O(1) lookup
      const templateSectionsMap = new Map<string, any>(
        tpl.sections.map((s: any) => [s.title.toLowerCase().trim(), s])
      );

      // Map each default section, matching by normalized title
      const mergedSections = defaultSections.map(defaultSection => {
        const key = defaultSection.title.toLowerCase().trim();
        const match = templateSectionsMap.get(key);
        if (match) {
          templateSectionsMap.delete(key); // consumed
          return { title: defaultSection.title, content: match.content, enabled: Boolean(match.enabled) };
        }
        return { ...defaultSection, enabled: false };
      });

      // Append extra sections that exist in the template but not in defaultSections
      templateSectionsMap.forEach((extraSection) => {
        mergedSections.push({
          title: extraSection.title,
          content: extraSection.content,
          enabled: Boolean(extraSection.enabled),
        });
      });

      setSections(mergedSections);
    }
    setShowStartModal(false);
  };

  if (loadingCompany) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  );

  const inputCls = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-300";
  const labelCls = "block text-xs font-semibold text-slate-500 mb-1";
  const selectCls = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition-all bg-white";

  return (
    <div className="max-w-4xl mx-auto pb-16 relative">
      {/* Modals */}
      {showStartModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">¿Cómo quieres empezar?</h2>
              <button onClick={() => setShowStartModal(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <button 
                onClick={() => setShowStartModal(false)}
                className="group border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-2xl p-8 text-center transition-all h-full flex flex-col items-center justify-center"
              >
                <div className="w-16 h-16 bg-slate-100 group-hover:bg-indigo-100 rounded-full flex items-center justify-center mb-4 transition-colors">
                  <FileText className="w-8 h-8 text-slate-400 group-hover:text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Cotización en blanco</h3>
                <p className="text-slate-500 text-sm">Empieza desde cero sin ítems ni contenido pre-llenado.</p>
              </button>
              
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                  <LayoutTemplate className="w-4 h-4" /> Usar plantilla predeterminada
                </h3>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {templates.map(tpl => (
                    <button
                      key={tpl.id}
                      onClick={() => applyTemplate(tpl)}
                      className="w-full text-left bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md rounded-xl p-4 transition-all group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="inline-block px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-md">
                          {tpl.code}
                        </span>
                        {tpl.isCustom && <Star className="w-4 h-4 text-yellow-400" />}
                      </div>
                      <p className="font-semibold text-slate-800 text-sm mb-1 group-hover:text-indigo-600 transition-colors">{tpl.name}</p>
                      <p className="text-xs text-slate-500">{tpl.category}</p>
                    </button>
                  ))}
                  {templates.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No hay plantillas disponibles</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Guardar como plantilla</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className={labelCls}>Código único</label>
                <input className={inputCls} placeholder="Ej: COT-TIP-CUSTOM-01" value={templateCode} onChange={e => setTemplateCode(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Nombre de la plantilla</label>
                <input className={inputCls} placeholder="Ej: Mi plantilla estructural" value={templateName} onChange={e => setTemplateName(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowSaveTemplateModal(false)} className="flex-1 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
              <button onClick={handleSaveTemplate} className="flex-1 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">Guardar</button>
            </div>
          </div>
        </div>
      )}

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
          {hasItems && (
            <button
              onClick={() => setShowSaveTemplateModal(true)}
              className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors hidden sm:block"
            >
              Guardar como plantilla
            </button>
          )}
          <div className="text-right hidden sm:block ml-4 border-l border-slate-200 pl-4">
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
            <div>
              <label className={labelCls}>Tipo de cliente</label>
              <select className={selectCls} value={clientData.tipoCliente} onChange={e => setClientData({ ...clientData, tipoCliente: e.target.value })}>
                <option value="">Seleccionar...</option>
                <option value="Persona natural">Persona natural</option>
                <option value="Empresa privada">Empresa privada</option>
                <option value="Entidad pública">Entidad pública</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Recurrencia</label>
              <select className={selectCls} value={clientData.clienteNuevoRecurrente} onChange={e => setClientData({ ...clientData, clienteNuevoRecurrente: e.target.value })}>
                <option value="">Seleccionar...</option>
                <option value="Nuevo">Nuevo</option>
                <option value="Recurrente">Recurrente</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Fuente del cliente</label>
              <select className={selectCls} value={clientData.fuenteCliente} onChange={e => setClientData({ ...clientData, fuenteCliente: e.target.value })}>
                <option value="">Seleccionar...</option>
                <option value="Referido">Referido</option>
                <option value="Redes sociales">Redes sociales</option>
                <option value="Web">Web</option>
                <option value="Anuncio">Anuncio</option>
                <option value="Directo">Directo</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">2</span>
            Clasificación del proyecto
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Ubicación del proyecto</label>
              <input className={inputCls} placeholder="Ciudad, Distrito" value={projectData.ubicacionProyecto} onChange={e => setProjectData({ ...projectData, ubicacionProyecto: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Sector</label>
              <select className={selectCls} value={projectData.sectorProyecto} onChange={e => setProjectData({ ...projectData, sectorProyecto: e.target.value })}>
                <option value="">Seleccionar...</option>
                <option value="Residencial">Residencial</option>
                <option value="Comercial">Comercial</option>
                <option value="Industrial">Industrial</option>
                <option value="Educativo">Educativo</option>
                <option value="Salud">Salud</option>
                <option value="Institucional">Institucional</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Tipo de proyecto</label>
              <select className={selectCls} value={projectData.tipoProyecto} onChange={e => setProjectData({ ...projectData, tipoProyecto: e.target.value })}>
                <option value="">Seleccionar...</option>
                <option value="Edificio">Edificio</option>
                <option value="Nave industrial">Nave industrial</option>
                <option value="Vivienda unifamiliar">Vivienda unifamiliar</option>
                <option value="Puente">Puente</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Tipo de servicio</label>
              <select className={selectCls} value={projectData.tipoServicio} onChange={e => setProjectData({ ...projectData, tipoServicio: e.target.value })}>
                <option value="">Seleccionar...</option>
                <option value="Diseño estructural">Diseño estructural</option>
                <option value="Revisión">Revisión</option>
                <option value="Inspección y evaluación">Inspección y evaluación</option>
                <option value="Construcción">Construcción</option>
                <option value="Costos y presupuestos">Costos y presupuestos</option>
                <option value="Software/Web">Software/Web</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">3</span>
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

        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">4</span>
            Detalle de la propuesta
          </h2>

          <ItemsTable title="Paquete base" items={items} setItems={setItems} addLabel="Agregar ítem" />

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

        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">5</span>
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

        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">6</span>
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

        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">7</span>
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

        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">8</span>
              Secciones Legales / Condiciones
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSections(prev => prev.map(s => ({ ...s, enabled: true })))}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                Activar todas
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => setSections(prev => prev.map(s => ({ ...s, enabled: false })))}
                className="text-xs font-medium text-slate-500 hover:text-slate-700 hover:underline"
              >
                Desactivar todas
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {sections.map((section, idx) => {
              const isExpanded = expandedSections[idx];
              return (
                <div key={idx} className={`border rounded-xl overflow-hidden transition-colors ${section.enabled ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-75'}`}>
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        type="button"
                        onClick={() => setSections(prev => prev.map((s, i) => i === idx ? { ...s, enabled: !s.enabled } : s))}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${section.enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${section.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                      <span className={`text-sm font-semibold ${section.enabled ? 'text-slate-800' : 'text-slate-500'}`}>
                        {idx + 1}. {section.title}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpandedSections(prev => ({ ...prev, [idx]: !prev[idx] }))}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="p-3 border-t border-slate-100 bg-slate-50/50">
                      <textarea
                        rows={6}
                        className={inputCls + " resize-none text-xs"}
                        value={section.content}
                        onChange={e => setSections(prev => prev.map((s, i) => i === idx ? { ...s, content: e.target.value } : s))}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}

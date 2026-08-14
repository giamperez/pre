import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { API_URL } from '../config';
import type { Company } from '../types';
import { fetchWithAuth, getUser } from '../auth';
import { getDefaultSections, type LegalSection } from '../constants/legalSections';
import { CompanyCustomFieldsEditor, type CustomFieldDefinition } from '../components/company/CompanyCustomFieldsEditor';
import {
  ArrowLeft, Save, Plus, Trash2, ChevronUp, ChevronDown, ChevronRight, LayoutTemplate,
  Bot, Search, PlusCircle, Layers, Power, Sparkles,
  ShieldAlert, ImagePlus, Sliders, Film, Calendar, Check, Contact
} from 'lucide-react';

const REFERENCE_COMPANY_SLUG = 'vertex-developers';

interface ReusableItem {
  id: string;
  titulo: string;
  contenido: string;
  precioUnitario: number;
  source: string;
}

interface ReusableCard {
  id: string;
  serviceName: string;
  subtitle: string;
  whyIdeal: string;
  includedAddons: string[];
  source: string;
}

interface TemplateItem {
  _key: string;
  titulo: string;
  contenido: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

interface PrequoteCard {
  _key: string;
  serviceName: string;
  subtitle: string;
  whyIdeal: string;
  includedAddons: string[];
  basePrice?: number;
  ctaText?: string;
  imageUrl?: string;
  videoUrl?: string;
  catalogItemId?: string;
}

interface PrequoteAddon {
  _key: string;
  name: string;
  description: string;
  basePrice: number;
}

const emptyItem = (): TemplateItem => ({
  _key: Math.random().toString(36).slice(2),
  titulo: '',
  contenido: '',
  cantidad: 1,
  precioUnitario: 0,
  total: 0,
});

const emptyPrequoteCard = (): PrequoteCard => ({
  _key: Math.random().toString(36).slice(2),
  serviceName: '',
  subtitle: '',
  whyIdeal: '',
  includedAddons: [],
  basePrice: 0,
  ctaText: 'Precotizar paquete',
  imageUrl: '',
  videoUrl: '',
});

const emptyPrequoteAddon = (): PrequoteAddon => ({
  _key: Math.random().toString(36).slice(2),
  name: '',
  description: '',
  basePrice: 0,
});

function currency(n: number) {
  return n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export interface FieldConfig {
  label: string;
  defaultValue?: string;
  placeholder?: string;
  enabled: boolean;
  options?: string[];
}

const defaultFieldConfigs: Record<string, FieldConfig> = {
  nombre: { label: 'Nombre', defaultValue: '', placeholder: 'Tu nombre', enabled: true },
  empresa: { label: 'Empresa / Negocio', defaultValue: '', placeholder: 'Opcional', enabled: true },
  correo: { label: 'Correo', defaultValue: '', placeholder: 'tucorreo@ejemplo.com', enabled: true },
  telefono: { label: 'WhatsApp', defaultValue: '', placeholder: '999 999 999', enabled: true },
  presupuesto: { label: 'Presupuesto disponible', defaultValue: '', placeholder: 'Puede ser un monto exacto o un intervalo', enabled: true },
  detalles: { label: 'Detalles de tu proyecto / ¿Qué necesitas?', defaultValue: '', placeholder: 'Describe brevemente tus requerimientos...', enabled: true },
  ruc: { label: 'RUC / DNI', defaultValue: '', placeholder: '20XXXXXXXXX / DNI', enabled: true },
  solicitante: { label: 'Solicitante', defaultValue: '', placeholder: 'Nombre completo', enabled: true },
  direccion: { label: 'Dirección', defaultValue: '', placeholder: 'Av. / Calle / Urb.', enabled: true },
  tipoCliente: {
    label: 'Tipo de cliente',
    defaultValue: '',
    enabled: true,
    options: ['Persona natural', 'Empresa privada', 'Entidad pública'],
  },
  recurrencia: {
    label: 'Recurrencia',
    defaultValue: '',
    enabled: true,
    options: ['Nuevo', 'Recurrente'],
  },
  fuenteCliente: {
    label: 'Fuente del cliente',
    defaultValue: '',
    enabled: true,
    options: ['Referido', 'Redes sociales', 'Web', 'Anuncio', 'Directo', 'Otro'],
  },
  ubicacionProyecto: { label: 'Ubicación del proyecto', defaultValue: '', placeholder: 'Ciudad, Distrito', enabled: true },
  sectorProyecto: {
    label: 'Sector',
    defaultValue: '',
    enabled: true,
    options: ['Residencial', 'Comercial', 'Industrial', 'Educativo', 'Salud', 'Institucional', 'Otro'],
  },
  tipoProyecto: {
    label: 'Tipo de proyecto',
    defaultValue: '',
    enabled: true,
    options: ['Edificio', 'Nave industrial', 'Vivienda unifamiliar', 'Puente', 'Otro'],
  },
  tipoServicio: {
    label: 'Tipo de servicio',
    defaultValue: '',
    enabled: true,
    options: ['Diseño estructural', 'Revisión', 'Inspección y evaluación', 'Construcción', 'Costos y presupuestos', 'Otro'],
  },
  nombreProyecto: { label: 'Nombre del proyecto', defaultValue: '', placeholder: 'Ej: Desarrollo web para Empresa XYZ', enabled: true },
  modalidad: { label: 'Modalidad', defaultValue: 'Proyecto por alcance', placeholder: 'Proyecto por alcance', enabled: true },
  plazo: { label: 'Plazo estimado', defaultValue: '45 días calendario', placeholder: '45 días calendario', enabled: true },
};

export function TemplateEditorPage() {
  const { templateId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isEditMode = Boolean(templateId);
  const paramCompanySlug = searchParams.get('company') || '';
  const paramType = searchParams.get('type') || 'cotizacion';

  const [company, setCompany] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // General Template Information
  const [type, setType] = useState<'cotizacion' | 'precotizacion'>(
    paramType === 'precotizacion' ? 'precotizacion' : 'cotizacion'
  );

  useEffect(() => {
    if (paramType === 'precotizacion') {
      setType('precotizacion');
    }
  }, [paramType]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('General');
  const [showInPrequote, setShowInPrequote] = useState(true);
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  const [fieldConfigs, setFieldConfigs] = useState<Record<string, FieldConfig>>(defaultFieldConfigs);

  const updateFieldConfig = (key: string, updates: Partial<FieldConfig>) => {
    setFieldConfigs(prev => ({
      ...prev,
      [key]: { ...(prev[key] || { label: key, enabled: true }), ...updates }
    }));
  };

  const renderFieldEditor = (key: string, isSelect = false) => {
    const cfg = fieldConfigs[key] || { label: key, enabled: true };
    return (
      <div key={key} className={`p-3.5 rounded-xl border transition-all ${cfg.enabled ? 'border-slate-200 bg-slate-50/50 hover:border-slate-300' : 'border-dashed border-slate-200 bg-slate-100/50 opacity-60'}`}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-1">
            <input
              type="text"
              className="text-xs font-bold text-slate-800 bg-transparent border-b border-dashed border-slate-300 hover:border-indigo-400 focus:border-indigo-600 outline-none px-1 py-0.5 w-full"
              value={cfg.label}
              onChange={e => updateFieldConfig(key, { label: e.target.value })}
              title="Haz clic para renombrar el campo"
            />
          </div>
          <button
            type="button"
            onClick={() => updateFieldConfig(key, { enabled: !cfg.enabled })}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
              cfg.enabled ? 'text-red-500 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'
            }`}
            title={cfg.enabled ? 'Eliminar / Ocultar campo de la plantilla' : 'Restaurar campo'}
          >
            {cfg.enabled ? <Trash2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {cfg.enabled ? 'Eliminar' : 'Restaurar'}
          </button>
        </div>

        {cfg.enabled && (
          <div className="space-y-2 mt-2">
            {isSelect ? (
              <>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                    Opciones del desplegable (separadas por coma)
                  </label>
                  <input
                    type="text"
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none bg-white"
                    value={(cfg.options || []).join(', ')}
                    onChange={e => updateFieldConfig(key, {
                      options: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                    placeholder="Ej: Opción 1, Opción 2, Opción 3"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                    Valor por defecto seleccionado
                  </label>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-300 outline-none bg-white"
                    value={cfg.defaultValue || ''}
                    onChange={e => updateFieldConfig(key, { defaultValue: e.target.value })}
                  >
                    <option value="">Sin selección predeterminada</option>
                    {(cfg.options || []).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                  Texto / Valor por defecto (pre-llenado)
                </label>
                <input
                  type="text"
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none bg-white placeholder:text-slate-300"
                  placeholder={cfg.placeholder || `Texto predeterminado para ${cfg.label}`}
                  value={cfg.defaultValue || ''}
                  onChange={e => updateFieldConfig(key, { defaultValue: e.target.value })}
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Section 1: Datos del cliente (defaults & custom fields)
  const [clientData, setClientData] = useState({
    empresa: '',
    ruc: '',
    solicitante: '',
    direccion: '',
    telefono: '',
    correo: '',
    tipoCliente: '',
    clienteNuevoRecurrente: '',
    fuenteCliente: '',
  });
  const [customClientFields, setCustomClientFields] = useState<CustomFieldDefinition[]>([]);

  // Section 2: Clasificación del proyecto (defaults & custom fields)
  const [projectClassification, setProjectClassification] = useState({
    ubicacionProyecto: '',
    sectorProyecto: '',
    tipoProyecto: '',
    tipoServicio: '',
  });
  const [customProjectFields, setCustomProjectFields] = useState<CustomFieldDefinition[]>([]);

  // Section 3: Detalles del proyecto (defaults & custom fields)
  const [projectDetails, setProjectDetails] = useState({
    nombre: '',
    modalidad: 'Proyecto por alcance',
    plazo: '45 días calendario',
  });
  const [customDetailsFields, setCustomDetailsFields] = useState<CustomFieldDefinition[]>([]);

  // Section 4: Detalle de la propuesta (Items base & adicionales)
  const [items, setItems] = useState<TemplateItem[]>([emptyItem()]);
  const [additionalItems, setAdditionalItems] = useState<TemplateItem[]>([]);
  const [showAddons, setShowAddons] = useState(false);

  // Section 6: Consideraciones e imágenes
  const [considerations, setConsiderations] = useState(
    'Ej: Los precios incluyen IGV. El plazo inicia luego de la aprobación del contrato y pago del adelanto...'
  );
  const [images, setImages] = useState<string[]>([]);
  const [customConsiderationFields, setCustomConsiderationFields] = useState<CustomFieldDefinition[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Section 7: Condiciones comerciales
  const [commercialConditions, setCommercialConditions] = useState({
    validity: '15 días calendario',
    paymentTerms: '40% adelanto, 30% al aprobar maqueta, 30% al finalizar',
  });
  const [customCommercialFields, setCustomCommercialFields] = useState<CustomFieldDefinition[]>([]);

  // Section 8: Secciones Legales / Condiciones
  const [sections, setSections] = useState<LegalSection[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});

  // Global / Precotización state
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [botEnabled, setBotEnabled] = useState(true);
  const [botWelcome, setBotWelcome] = useState(
    '¡Hola! Soy el asistente virtual comercial de la empresa. ¿En qué solución o proyecto estás interesado hoy?'
  );
  const [botPrompt, setBotPrompt] = useState(
    'Eres el asistente comercial virtual de la empresa. Tu objetivo es saludar cordialmente, consultar los datos de contacto del cliente y guiarlo a través de nuestras opciones y paquetes de servicio.'
  );
  const [botTone, setBotTone] = useState('comercial');
  const [mandatoryFields, setMandatoryFields] = useState<string[]>(['nombre', 'telefono', 'correo', 'empresa']);
  const [prequoteCards, setPrequoteCards] = useState<PrequoteCard[]>([emptyPrequoteCard()]);
  const [prequoteAddons, setPrequoteAddons] = useState<PrequoteAddon[]>([]);

  const addPrequoteAddon = () => setPrequoteAddons(prev => [...prev, emptyPrequoteAddon()]);
  const removePrequoteAddon = (key: string) => setPrequoteAddons(prev => prev.filter(a => a._key !== key));
  const updatePrequoteAddon = (key: string, field: keyof PrequoteAddon, value: any) => {
    setPrequoteAddons(prev => prev.map(a => a._key === key ? { ...a, [field]: value } : a));
  };

  // Reusable Items Drawer State
  const [reusableItems, setReusableItems] = useState<ReusableItem[]>([]);
  const [reuseSearch, setReuseSearch] = useState('');
  const [showReuseDrawer, setShowReuseDrawer] = useState(false);

  // Load Companies
  useEffect(() => {
    fetchWithAuth(`${API_URL}/companies`)
      .then(res => res.json())
      .then(data => {
        setCompanies(data);
        if (data.length > 0) {
          const match = data.find((c: any) => c.slug === paramCompanySlug) || data[0];
          setCompany(match);
          setSelectedCompanyId(match.id);
          if (!sections || sections.length === 0) {
            setSections(getDefaultSections(match.slug));
          }
        }
        if (!templateId) {
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        if (!templateId) {
          setLoading(false);
        }
      });
  }, [paramCompanySlug, templateId]);

  // Load Reusable Items/Cards
  useEffect(() => {
    if (!company?.slug) return;
    const slugs = Array.from(new Set([company.slug, REFERENCE_COMPANY_SLUG]));

    Promise.all(
      slugs.map(slug =>
        fetchWithAuth(`${API_URL}/templates?companySlug=${slug}`)
          .then(res => (res.ok ? res.json() : []))
          .catch(() => [])
      )
    ).then(results => {
      const otherTemplates = results.flat().filter((t: any) => t.id !== templateId);

      const itemsByKey = new Map<string, ReusableItem>();
      const cardsByKey = new Map<string, ReusableCard>();

      otherTemplates.forEach((tpl: any) => {
        (Array.isArray(tpl.items) ? tpl.items : []).forEach((it: any) => {
          const titulo = (it.titulo || it.detalle || '').trim();
          const key = titulo.toLowerCase();
          if (!titulo || itemsByKey.has(key)) return;
          itemsByKey.set(key, {
            id: `${tpl.id}-${key}`,
            titulo,
            contenido: it.contenido || '',
            precioUnitario: Number(it.precioUnitario) || 0,
            source: tpl.name,
          });
        });

        (Array.isArray(tpl.cardsConfig?.cards) ? tpl.cardsConfig.cards : []).forEach((c: any) => {
          const serviceName = (c.serviceName || '').trim();
          const key = serviceName.toLowerCase();
          if (!serviceName || cardsByKey.has(key)) return;
          cardsByKey.set(key, {
            id: `${tpl.id}-${key}`,
            serviceName,
            subtitle: c.subtitle || '',
            whyIdeal: c.whyIdeal || '',
            includedAddons: Array.isArray(c.includedAddons) ? c.includedAddons : [],
            source: tpl.name,
          });
        });
      });

      setReusableItems(Array.from(itemsByKey.values()));
    });
  }, [company?.slug, templateId]);

  // Load Existing Template if Edit Mode
  useEffect(() => {
    if (templateId) {
      setLoading(true);
      fetchWithAuth(`${API_URL}/templates/${templateId}`)
        .then(res => res.json())
        .then(tpl => {
          if (!tpl || tpl.message) throw new Error('Plantilla no encontrada');
          setName(tpl.name || '');
          setCode(tpl.code || '');
          setCategory(tpl.category || 'General');
          setType(tpl.type === 'precotizacion' ? 'precotizacion' : 'cotizacion');

          if (tpl.company) {
            setCompany(tpl.company);
            setSelectedCompanyId(tpl.company.id);
          }

          if (tpl.projectData) {
            const pd = tpl.projectData as any;
            if (pd.showInPrequote !== undefined) setShowInPrequote(Boolean(pd.showInPrequote));
            if (pd.fieldConfigs) setFieldConfigs(prev => ({ ...prev, ...pd.fieldConfigs }));
            if (pd.modalidad || pd.plazo || pd.nombre) {
              setProjectDetails({
                nombre: pd.nombre || '',
                modalidad: pd.modalidad || 'Proyecto por alcance',
                plazo: pd.plazo || '45 días calendario',
              });
            }
            if (pd.ubicacionProyecto || pd.sectorProyecto || pd.tipoProyecto || pd.tipoServicio) {
              setProjectClassification({
                ubicacionProyecto: pd.ubicacionProyecto || '',
                sectorProyecto: pd.sectorProyecto || '',
                tipoProyecto: pd.tipoProyecto || '',
                tipoServicio: pd.tipoServicio || '',
              });
            }
            if (pd.clientData) setClientData(prev => ({ ...prev, ...pd.clientData }));
            if (pd.considerations) setConsiderations(pd.considerations);
            if (pd.validity || pd.paymentTerms) {
              setCommercialConditions({
                validity: pd.validity || '15 días calendario',
                paymentTerms: pd.paymentTerms || '40% adelanto, 30% al aprobar maqueta, 30% al finalizar',
              });
            }
            if (pd.images && Array.isArray(pd.images)) setImages(pd.images);

            if (pd.customClientFields && Array.isArray(pd.customClientFields)) setCustomClientFields(pd.customClientFields);
            if (pd.customProjectFields && Array.isArray(pd.customProjectFields)) setCustomProjectFields(pd.customProjectFields);
            if (pd.customDetailsFields && Array.isArray(pd.customDetailsFields)) setCustomDetailsFields(pd.customDetailsFields);
            if (pd.customConsiderationFields && Array.isArray(pd.customConsiderationFields)) setCustomConsiderationFields(pd.customConsiderationFields);
            if (pd.customCommercialFields && Array.isArray(pd.customCommercialFields)) setCustomCommercialFields(pd.customCommercialFields);
          }

          if (tpl.items && Array.isArray(tpl.items) && tpl.items.length > 0) {
            setItems(tpl.items.map((i: any) => ({
              _key: Math.random().toString(36).slice(2),
              titulo: i.titulo || i.detalle || '',
              contenido: i.contenido || '',
              cantidad: Number(i.cantidad) || 1,
              precioUnitario: Number(i.precioUnitario) || 0,
              total: Number(i.total) || (Number(i.cantidad || 1) * Number(i.precioUnitario || 0)),
            })));
          }

          if (tpl.additionalItems && Array.isArray(tpl.additionalItems) && tpl.additionalItems.length > 0) {
            setAdditionalItems(tpl.additionalItems.map((i: any) => ({
              _key: Math.random().toString(36).slice(2),
              titulo: i.titulo || i.detalle || '',
              contenido: i.contenido || '',
              cantidad: Number(i.cantidad) || 1,
              precioUnitario: Number(i.precioUnitario) || 0,
              total: Number(i.total) || (Number(i.cantidad || 1) * Number(i.precioUnitario || 0)),
            })));
            setShowAddons(true);
          }

          if (tpl.sections && Array.isArray(tpl.sections)) {
            setSections(tpl.sections);
          } else if (tpl.company?.slug) {
            setSections(getDefaultSections(tpl.company.slug));
          }

          if (tpl.customFields && Array.isArray(tpl.customFields)) {
            setCustomFields(tpl.customFields);
          }

          if (tpl.cardsConfig) {
            if (typeof tpl.cardsConfig.botEnabled === 'boolean') setBotEnabled(tpl.cardsConfig.botEnabled);
            if (tpl.cardsConfig.botWelcome) setBotWelcome(tpl.cardsConfig.botWelcome);
            if (tpl.cardsConfig.botPrompt) setBotPrompt(tpl.cardsConfig.botPrompt);
            if (tpl.cardsConfig.botTone) setBotTone(tpl.cardsConfig.botTone);
            if (Array.isArray(tpl.cardsConfig.mandatoryFields)) setMandatoryFields(tpl.cardsConfig.mandatoryFields);
            if (Array.isArray(tpl.cardsConfig.cards)) {
              setPrequoteCards(tpl.cardsConfig.cards.map((c: any) => ({
                _key: Math.random().toString(36).slice(2),
                serviceName: c.serviceName || '',
                subtitle: c.subtitle || '',
                whyIdeal: c.whyIdeal || '',
                includedAddons: Array.isArray(c.includedAddons) ? c.includedAddons : [],
                basePrice: Number(c.basePrice) || 0,
                ctaText: c.ctaText || 'Precotizar paquete',
                imageUrl: c.imageUrl || '',
                videoUrl: c.videoUrl || '',
                catalogItemId: c.catalogItemId || undefined,
              })));
            }
            if (Array.isArray(tpl.cardsConfig.addons)) {
              setPrequoteAddons(tpl.cardsConfig.addons.map((a: any) => ({
                _key: Math.random().toString(36).slice(2),
                name: a.name || '',
                description: a.description || '',
                basePrice: Number(a.basePrice) || 0,
              })));
            }
          }

          setLoading(false);
        })
        .catch(err => {
          alert(err.message || 'Error al cargar la plantilla');
          setLoading(false);
          navigate('/');
        });
    } else {
      setLoading(false);
    }
  }, [templateId, navigate]);

  // Totals calculations
  const itemsSubtotal = items.reduce((s, i) => s + (Number(i.total) || (Number(i.cantidad || 1) * Number(i.precioUnitario || 0))), 0);
  const addonsSubtotal = additionalItems.reduce((s, i) => s + (Number(i.total) || (Number(i.cantidad || 1) * Number(i.precioUnitario || 0))), 0);
  const subtotal = itemsSubtotal + (showAddons ? addonsSubtotal : 0);
  const igv = subtotal * 0.18;
  const total = subtotal + igv;

  // Handlers for Items
  const addItem = (source?: ReusableItem, target: 'base' | 'addons' = 'base') => {
    const newItem: TemplateItem = {
      _key: Math.random().toString(36).slice(2),
      titulo: source ? source.titulo : '',
      contenido: source ? source.contenido : '',
      cantidad: 1,
      precioUnitario: source ? source.precioUnitario : 0,
      total: source ? source.precioUnitario : 0,
    };
    if (target === 'base') {
      setItems(prev => [...prev, newItem]);
    } else {
      setAdditionalItems(prev => [...prev, newItem]);
    }
  };

  const updateItem = (key: string, field: keyof TemplateItem, value: any, target: 'base' | 'addons' = 'base') => {
    const setter = target === 'base' ? setItems : setAdditionalItems;
    setter(prev => prev.map(item => {
      if (item._key === key) {
        const updated = { ...item, [field]: value };
        if (field === 'cantidad' || field === 'precioUnitario') {
          updated.total = Number(updated.cantidad) * Number(updated.precioUnitario);
        }
        return updated;
      }
      return item;
    }));
  };

  const removeItem = (key: string, target: 'base' | 'addons' = 'base') => {
    const setter = target === 'base' ? setItems : setAdditionalItems;
    setter(prev => prev.filter(i => i._key !== key));
  };

  const moveItem = (index: number, direction: 'up' | 'down', target: 'base' | 'addons' = 'base') => {
    const currentList = target === 'base' ? items : additionalItems;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= currentList.length) return;
    const newList = [...currentList];
    const [moved] = newList.splice(index, 1);
    newList.splice(targetIdx, 0, moved);
    if (target === 'base') setItems(newList);
    else setAdditionalItems(newList);
  };

  // Handlers for Image Uploads
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setImages(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };
  const removeImage = (idx: number) => setImages(prev => prev.filter((_, i) => i !== idx));

  // Handlers for Legal Sections
  const toggleSectionEnabled = (idx: number) => {
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, enabled: !s.enabled } : s));
  };

  const updateSection = (idx: number, updates: Partial<LegalSection>) => {
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, ...updates } : s));
  };

  const removeSection = (idx: number) => {
    setSections(prev => prev.filter((_, i) => i !== idx));
  };

  const addSection = () => {
    setSections(prev => [...prev, { title: 'Nueva Sección', content: '', enabled: true, fields: [] }]);
    setExpandedSections(prev => ({ ...prev, [sections.length]: true }));
  };

  // Handlers for Prequote Cards
  const addPrequoteCard = () => setPrequoteCards(prev => [...prev, emptyPrequoteCard()]);
  const removePrequoteCard = (key: string) => setPrequoteCards(prev => prev.filter(c => c._key !== key));
  const updatePrequoteCard = (key: string, field: keyof PrequoteCard, value: any) => {
    setPrequoteCards(prev => prev.map(c => c._key === key ? { ...c, [field]: value } : c));
  };

  // Save Template Action
  const handleSave = async () => {
    if (!name.trim()) return alert('Por favor ingresa el nombre de la plantilla.');
    if (!selectedCompanyId) return alert('Por favor selecciona una empresa.');

    setSaving(true);
    try {
      const generatedCode = code.trim() || `TPL-${company?.slug.toUpperCase() || 'CUSTOM'}-${Math.floor(100 + Math.random() * 900)}`;

      const payload = {
        companyId: selectedCompanyId,
        code: generatedCode,
        name: name.trim(),
        category: category.trim() || 'General',
        type,
        projectData: {
          showInPrequote,
          nombre: projectDetails.nombre.trim(),
          modalidad: projectDetails.modalidad.trim() || 'Proyecto por alcance',
          plazo: projectDetails.plazo.trim() || '45 días calendario',
          ubicacionProyecto: projectClassification.ubicacionProyecto.trim(),
          sectorProyecto: projectClassification.sectorProyecto.trim(),
          tipoProyecto: projectClassification.tipoProyecto.trim(),
          tipoServicio: projectClassification.tipoServicio.trim(),
          clientData,
          fieldConfigs,
          considerations,
          validity: commercialConditions.validity,
          paymentTerms: commercialConditions.paymentTerms,
          images,
          customClientFields,
          customProjectFields,
          customDetailsFields,
          customConsiderationFields,
          customCommercialFields,
          additionalItems: type === 'cotizacion'
            ? additionalItems.filter(i => i.titulo.trim()).map(({ _key, ...rest }) => rest)
            : [],
        },
        items: type === 'cotizacion'
          ? items.filter(i => i.titulo.trim()).map(({ _key, ...rest }) => rest)
          : [],
        sections: type === 'cotizacion' ? sections : undefined,
        cardsConfig: type === 'precotizacion'
          ? {
              botEnabled,
              botWelcome,
              botPrompt,
              botTone,
              mandatoryFields,
              cards: prequoteCards,
              addons: prequoteAddons.filter(a => a.name.trim()).map(({ _key, ...rest }) => rest),
            }
          : undefined,
        customFields: customFields.length > 0 ? customFields : undefined,
        isCustom: true,
      };

      const url = isEditMode ? `${API_URL}/templates/${templateId}` : `${API_URL}/templates`;
      const method = isEditMode ? 'PATCH' : 'POST';

      const res = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al guardar la plantilla');
      }

      navigate(`/empresa/${company?.slug || ''}?tab=plantillas`);
    } catch (err: any) {
      alert(err.message || 'Error al guardar la plantilla');
    } finally {
      setSaving(false);
    }
  };

  const userRole = getUser()?.role;
  if (userRole !== 'admin' && userRole !== 'superadmin') {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto my-12 shadow-sm">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800 mb-2">Acceso Restringido</h3>
        <p className="text-slate-500 text-sm mb-6">
          Solo los usuarios administradores pueden crear y editar las plantillas de cotización.
        </p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-all shadow-sm"
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  );

  const filteredReusableItems = reusableItems.filter(it =>
    it.titulo.toLowerCase().includes(reuseSearch.toLowerCase())
  );

  const headerBgColor = company?.colorPrimary || 'rgb(26, 107, 138)';

  return (
    <main className="flex-1 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto pb-16 relative">
        {/* Sticky Header matching exact prompt HTML structure */}
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-slate-50 py-3 z-10 -mx-6 px-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Link
              to={company?.slug ? `/empresa/${company.slug}?tab=plantillas` : '/'}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              {company?.logoUrl ? (
                <img
                  alt={company.name}
                  className="h-9 object-contain"
                  src={`${API_URL}/public${company.logoUrl}`}
                />
              ) : (
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-base"
                  style={{ backgroundColor: headerBgColor }}
                >
                  {company?.name ? company.name.charAt(0) : 'P'}
                </div>
              )}
              <div>
                <p className="text-xs text-slate-400 leading-none">
                  {isEditMode ? 'Editando Plantilla' : 'Nueva plantilla de cotización'}
                </p>
                <p className="font-semibold text-slate-800">
                  {name.trim() || company?.name || 'Nombre de la Plantilla'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowConfigPanel(!showConfigPanel)}
              className="text-xs font-semibold text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300 rounded-xl px-3 py-2 transition-all hidden md:flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5" />
              {showConfigPanel ? 'Ocultar Config.' : 'Ajustes de Plantilla'}
            </button>

            <div className="text-right hidden sm:block ml-2 border-l border-slate-200 pl-4">
              <p className="text-xs text-slate-400">Total estimado (inc. IGV)</p>
              <p className="font-bold text-slate-800 text-lg">S/ {currency(total)}</p>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] shadow-md shadow-indigo-100"
              style={{ backgroundColor: headerBgColor }}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar Plantilla'}
            </button>
          </div>
        </div>

        {/* Collapsible / Top Template Metadata Settings */}
        {(showConfigPanel || !name.trim()) && (
          <div className="mb-6 bg-gradient-to-r from-indigo-50/70 via-white to-slate-50 border border-indigo-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4 text-indigo-600" /> Configuración Principal de la Plantilla
              </h3>
              <span className="text-[11px] text-slate-400">Define nombre, código y empresa destino</span>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nombre de la Plantilla <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  type="text"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-300 outline-none"
                  placeholder="Ej: Cotización Base de Ingeniería y Estructuras"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Empresa Destino</label>
                <select
                  disabled={isEditMode}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-300 outline-none"
                  value={selectedCompanyId}
                  onChange={e => {
                    setSelectedCompanyId(e.target.value);
                    const co = companies.find(c => c.id === e.target.value);
                    if (co) setCompany(co);
                  }}
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo de Plantilla</label>
                <select
                  disabled={isEditMode}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-300 outline-none"
                  value={type}
                  onChange={e => setType(e.target.value as any)}
                >
                  <option value="cotizacion">Cotización Formal</option>
                  <option value="precotizacion">Precotización</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Código Único (Opcional)</label>
                <input
                  type="text"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-300 outline-none"
                  placeholder="Ej: COT-PYRAMID-01"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Categoría</label>
                <input
                  type="text"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-300 outline-none"
                  placeholder="Ej. Estructuras, Comercial, Residencial"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-2 pt-2">
                <div className="flex items-center gap-2 bg-white border border-slate-200 hover:border-indigo-300 px-3.5 py-2 rounded-xl transition-all shadow-2xs">
                  <input
                    type="checkbox"
                    id="showInPrequoteCheckbox"
                    checked={showInPrequote}
                    onChange={e => setShowInPrequote(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="showInPrequoteCheckbox" className="text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-indigo-600" />
                    <span>Aparecer / Disponible en el Precotizador</span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => setShowReuseDrawer(!showReuseDrawer)}
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 font-semibold px-3 py-2 rounded-xl transition-colors border border-indigo-200"
                >
                  <Search className="w-3.5 h-3.5" /> Reutilizar ítems
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sections Container matching exact prompt HTML structure */}
        {type === 'precotizacion' ? (
          <div className="space-y-6">
            {/* Panel 1: Asistente Virtual (Bot IA) */}
            <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Asistente Virtual (Bot de IA)</h2>
                    <p className="text-xs text-slate-500">Configura el comportamiento, prompt y reglas del chatbot de precotización.</p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                  <input
                    type="checkbox"
                    checked={botEnabled}
                    onChange={e => setBotEnabled(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Power className={`w-3.5 h-3.5 ${botEnabled ? 'text-emerald-500' : 'text-slate-400'}`} />
                    {botEnabled ? 'Bot Habilitado' : 'Bot Desactivado'}
                  </span>
                </label>
              </div>

              {botEnabled && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Saludo / Mensaje Inicial del Bot
                    </label>
                    <input
                      type="text"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-300 outline-none"
                      placeholder="Ej: ¡Hola! Soy el asistente virtual comercial. ¿En qué solución estás interesado hoy?"
                      value={botWelcome}
                      onChange={e => setBotWelcome(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-indigo-500" /> Instrucciones / Prompt Personalizado del Bot
                    </label>
                    <textarea
                      rows={4}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono focus:ring-2 focus:ring-indigo-300 outline-none"
                      placeholder="Instrucciones del bot..."
                      value={botPrompt}
                      onChange={e => setBotPrompt(e.target.value)}
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Define cómo debe responder la IA, guiar a prospectos y calificar clientes potenciales.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Tono de Comunicación del Bot</label>
                      <select
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 bg-white focus:ring-2 focus:ring-indigo-300 outline-none"
                        value={botTone}
                        onChange={e => setBotTone(e.target.value)}
                      >
                        <option value="comercial">Comercial y Persuasivo</option>
                        <option value="tecnico">Técnico e Ingenieril</option>
                        <option value="amigable">Amigable y Cercano</option>
                        <option value="formal">Formal y Corporativo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Campos Obligatorios a Solicitar por Chat</label>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {[
                          { id: 'nombre', label: 'Nombre' },
                          { id: 'telefono', label: 'Teléfono' },
                          { id: 'correo', label: 'Correo' },
                          { id: 'empresa', label: 'Empresa' },
                          { id: 'presupuesto', label: 'Presupuesto' },
                          { id: 'plazo', label: 'Plazo' },
                        ].map(f => {
                          const isChecked = (mandatoryFields || []).includes(f.id);
                          return (
                            <label key={f.id} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border cursor-pointer transition-all ${
                              isChecked ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500'
                            }`}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  setMandatoryFields(prev =>
                                    isChecked ? (prev || []).filter(x => x !== f.id) : [...(prev || []), f.id]
                                  );
                                }}
                                className="rounded text-indigo-600 focus:ring-indigo-500 w-3 h-3"
                              />
                              {f.label}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Panel 2: Tarjetas de Soluciones / Paquetes */}
            <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Tarjetas de Soluciones / Servicios</h2>
                    <p className="text-xs text-slate-500">Configura los paquetes y recomendaciones de la precotización.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addPrequoteCard}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Agregar Tarjeta
                </button>
              </div>

              <div className="space-y-4">
                {(prequoteCards || []).map((card, cIdx) => (
                  <div key={card._key} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Tarjeta / Paquete #{cIdx + 1}
                      </span>
                      {prequoteCards.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePrequoteCard(card._key)}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Eliminar
                        </button>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre del Servicio Principal</label>
                        <input
                          type="text"
                          className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white font-semibold outline-none focus:ring-2 focus:ring-indigo-300"
                          placeholder="Ej: Desarrollo Web Responsive & PWA"
                          value={card.serviceName}
                          onChange={e => updatePrequoteCard(card._key, 'serviceName', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Subtítulo / Breve Explicación</label>
                        <input
                          type="text"
                          className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white outline-none focus:ring-2 focus:ring-indigo-300 text-slate-600"
                          placeholder="Ej: UX/UI + SEO + Hosting + Mantenimiento"
                          value={card.subtitle}
                          onChange={e => updatePrequoteCard(card._key, 'subtitle', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Precio Base Estimado (S/)</label>
                        <input
                          type="number"
                          min={0}
                          className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white outline-none focus:ring-2 focus:ring-indigo-300 text-slate-600"
                          placeholder="1500.00"
                          value={card.basePrice || ''}
                          onChange={e => updatePrequoteCard(card._key, 'basePrice', parseFloat(e.target.value) || 0)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">¿Por qué es ideal para el cliente?</label>
                        <input
                          type="text"
                          className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white outline-none focus:ring-2 focus:ring-indigo-300 text-slate-600"
                          placeholder="Ej: Ideal para pequeñas y medianas empresas..."
                          value={card.whyIdeal}
                          onChange={e => updatePrequoteCard(card._key, 'whyIdeal', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 bg-white p-3.5 rounded-xl border border-slate-200/80">
                      {/* Subida de Imagen de Portada */}
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <ImagePlus className="w-3.5 h-3.5 text-indigo-600" /> Imagen de Portada (Miniatura)
                          </span>
                          <label className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-colors">
                            📁 Subir imagen...
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = ev => updatePrequoteCard(card._key, 'imageUrl', ev.target?.result as string);
                                  reader.readAsDataURL(file);
                                }
                                e.target.value = '';
                              }}
                            />
                          </label>
                        </label>

                        <input
                          type="text"
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-slate-50 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-300 text-slate-600 font-mono"
                          placeholder="Ruta local o URL (Ej: /companies/...) o sube tu archivo"
                          value={card.imageUrl || ''}
                          onChange={e => updatePrequoteCard(card._key, 'imageUrl', e.target.value)}
                        />

                        {card.imageUrl && (
                          <div className="relative aspect-[21/9] rounded-lg overflow-hidden border border-slate-200 bg-slate-100 group/img">
                            <img
                              src={
                                card.imageUrl.startsWith('data:') || card.imageUrl.startsWith('http')
                                  ? card.imageUrl
                                  : `${API_URL}/public${card.imageUrl.startsWith('/') ? '' : '/'}${card.imageUrl}`
                              }
                              alt="Portada seleccionada"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => updatePrequoteCard(card._key, 'imageUrl', '')}
                              className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-red-600 text-white p-1 rounded-md text-[10px] font-bold backdrop-blur-xs transition-colors"
                              title="Quitar imagen"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Subida de Video Demostrativo (Hover) */}
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Film className="w-3.5 h-3.5 text-purple-600" /> Video Demostrativo (Hover)
                          </span>
                          <label className="text-[11px] text-purple-600 hover:text-purple-800 font-bold cursor-pointer bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-md transition-colors">
                            🎥 Subir video...
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = ev => updatePrequoteCard(card._key, 'videoUrl', ev.target?.result as string);
                                  reader.readAsDataURL(file);
                                }
                                e.target.value = '';
                              }}
                            />
                          </label>
                        </label>

                        <input
                          type="text"
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-slate-50 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-300 text-slate-600 font-mono"
                          placeholder="Pega enlace de Google Drive, YouTube, URL directa (.mp4) o sube tu archivo"
                          value={card.videoUrl || ''}
                          onChange={e => updatePrequoteCard(card._key, 'videoUrl', e.target.value)}
                        />

                        {card.videoUrl && (
                          <div className="relative aspect-[21/9] rounded-lg overflow-hidden border border-slate-200 bg-black group/vid">
                            <video
                              src={
                                card.videoUrl.startsWith('data:') || card.videoUrl.startsWith('http')
                                  ? card.videoUrl
                                  : `${API_URL}/public${card.videoUrl.startsWith('/') ? '' : '/'}${card.videoUrl}`
                              }
                              controls
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => updatePrequoteCard(card._key, 'videoUrl', '')}
                              className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-red-600 text-white p-1 rounded-md text-[10px] font-bold backdrop-blur-xs transition-colors"
                              title="Quitar video"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      💡 <strong>Comportamiento:</strong> La imagen de portada se muestra fija por defecto; el video se reproducirá automáticamente al pasar el cursor (hover).
                    </p>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Características Incluidas (separadas por coma)
                      </label>
                      <input
                        type="text"
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white outline-none focus:ring-2 focus:ring-indigo-300 text-slate-600"
                        placeholder="Ej: Maquetación, SEO Básico, SSL Gratuito, Integración WhatsApp"
                        value={(card.includedAddons || []).join(', ')}
                        onChange={e => updatePrequoteCard(card._key, 'includedAddons', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Panel 2.5: Servicios Adicionales (Addons) del Precotizador */}
            <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Servicios Adicionales (Addons) de Precotización</h2>
                    <p className="text-xs text-slate-500">
                      Personaliza los adicionales disponibles para que los clientes complementen su paquete principal.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addPrequoteAddon}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <Plus className="w-4 h-4" /> Agregar Servicio Adicional
                </button>
              </div>

              {prequoteAddons.length === 0 ? (
                <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                  <p className="text-xs text-slate-500">No hay servicios adicionales configurados expresamente en esta plantilla.</p>
                  <button
                    type="button"
                    onClick={addPrequoteAddon}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl text-xs font-bold border border-purple-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar primer adicional
                  </button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {prequoteAddons.map((addon, idx) => (
                    <div key={addon._key} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 relative group">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                        <span className="text-xs font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded-md">
                          Adicional #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removePrequoteAddon(addon._key)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded-md transition-colors"
                          title="Eliminar adicional"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Nombre del Adicional</label>
                        <input
                          type="text"
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-purple-300 outline-none bg-white font-semibold"
                          placeholder="Ej: Pasarela de pagos, Hosting por 1 año..."
                          value={addon.name}
                          onChange={e => updatePrequoteAddon(addon._key, 'name', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Descripción Breve</label>
                        <textarea
                          rows={2}
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-purple-300 outline-none bg-white resize-y"
                          placeholder="Descripción corta del servicio adicional..."
                          value={addon.description}
                          onChange={e => updatePrequoteAddon(addon._key, 'description', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Precio Base (S/)</label>
                        <input
                          type="number"
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-purple-300 outline-none bg-white font-bold"
                          placeholder="Ej: 500"
                          value={addon.basePrice || ''}
                          onChange={e => updatePrequoteAddon(addon._key, 'basePrice', Number(e.target.value))}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Panel 3: Agendamiento / Calendario de Contacto */}
            <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Calendario de Agendamiento</h2>
                    <p className="text-xs text-slate-500">Sección opcional para que los clientes agenden fecha y hora de llamada.</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-bold">
                  <Check className="w-3.5 h-3.5" /> Habilitado
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Esta sección permite a tus clientes seleccionar un día y horario disponible según los parámetros configurados en el panel de Disponibilidad de la Empresa.
              </p>
            </section>

            {/* Panel 4: Campos del Formulario de Precotización */}
            <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Contact className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Campos del Formulario de Precotización (Paso 3: Tus Datos de Contacto)</h2>
                  <p className="text-xs text-slate-500">
                    Personaliza las etiquetas, valores por defecto y opciones desplegables que completará el cliente.
                  </p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {renderFieldEditor('nombre')}
                {renderFieldEditor('empresa')}
                {renderFieldEditor('correo')}
                {renderFieldEditor('telefono')}
                {renderFieldEditor('presupuesto')}
                {renderFieldEditor('detalles')}
              </div>

              {/* Campos Personalizados Adicionales */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <CompanyCustomFieldsEditor
                  customFields={customFields || []}
                  onChange={setCustomFields}
                  heading="Campos Personalizados Adicionales para el Precotizador"
                />
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-6">
            {/* SECTION 1: Datos del cliente */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">
                1
              </span>
              Datos del cliente
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Personaliza el nombre, texto predeterminado u opciones de cada campo. Usa el botón "Eliminar" para ocultar campos no deseados.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {renderFieldEditor('empresa')}
              {renderFieldEditor('ruc')}
              {renderFieldEditor('solicitante')}
              {renderFieldEditor('direccion')}
              {renderFieldEditor('telefono')}
              {renderFieldEditor('correo')}
              {renderFieldEditor('tipoCliente', true)}
              {renderFieldEditor('recurrencia', true)}
              {renderFieldEditor('fuenteCliente', true)}
            </div>

            {/* Custom fields editor for Section 1 */}
            <div className="mt-6">
              <CompanyCustomFieldsEditor
                customFields={customClientFields}
                onChange={setCustomClientFields}
                hideCategory={true}
                heading="Campos Personalizados adicionales para Datos del cliente"
                description="Crea cuadros de texto, áreas multilinea, desplegables, números o casillas (checkbox) adicionales para los datos del cliente."
                emptyLabel="No hay campos adicionales en Datos del cliente."
              />
            </div>
          </section>

          {/* SECTION 2: Clasificación del proyecto */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">
                2
              </span>
              Clasificación del proyecto
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Configura los nombres de campos y desplegables de clasificación para esta plantilla.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {renderFieldEditor('ubicacionProyecto')}
              {renderFieldEditor('sectorProyecto', true)}
              {renderFieldEditor('tipoProyecto', true)}
              {renderFieldEditor('tipoServicio', true)}
            </div>

            {/* Custom fields editor for Section 2 */}
            <div className="mt-6">
              <CompanyCustomFieldsEditor
                customFields={customProjectFields}
                onChange={setCustomProjectFields}
                hideCategory={true}
                heading="Campos Personalizados adicionales para Clasificación del proyecto"
                description="Crea cuadros de texto, desplegables, casillas (checkbox) o números requeridos para la clasificación."
                emptyLabel="No hay campos adicionales en Clasificación del proyecto."
              />
            </div>
          </section>

          {/* SECTION 3: Detalles del proyecto */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">
                3
              </span>
              Detalles del proyecto
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Establece el nombre predeterminado, modalidad o plazos estándar para este tipo de cotización.
            </p>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="sm:col-span-3">
                {renderFieldEditor('nombreProyecto')}
              </div>
              <div>{renderFieldEditor('modalidad')}</div>
              <div className="sm:col-span-2">{renderFieldEditor('plazo')}</div>
            </div>

            {/* Custom fields editor for Section 3 */}
            <div className="mt-6">
              <CompanyCustomFieldsEditor
                customFields={customDetailsFields}
                onChange={setCustomDetailsFields}
                hideCategory={true}
                heading="Campos Personalizados adicionales para Detalles del proyecto"
                description="Agrega más cuadros de texto, desplegables o casillas de verificación para especificar detalles del proyecto."
                emptyLabel="No hay campos adicionales en Detalles del proyecto."
              />
            </div>
          </section>

          {/* SECTION 4: Detalle de la propuesta */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">
                4
              </span>
              Detalle de la propuesta
            </h2>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Paquete base</p>
              
              <table className="w-full mb-3">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left text-xs font-semibold text-slate-500 pb-2 pr-3">Detalle</th>
                    <th className="text-center text-xs font-semibold text-slate-500 pb-2 px-2">Cant.</th>
                    <th className="text-right text-xs font-semibold text-slate-500 pb-2 px-2">P. Unitario</th>
                    <th className="text-right text-xs font-semibold text-slate-500 pb-2 pl-2">Total</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item._key} className="border-b border-slate-100 last:border-0 group align-top">
                      <td className="py-2 pr-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5">
                            <input
                              className="w-full text-sm font-semibold border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition-all"
                              placeholder="Título del ítem"
                              value={item.titulo}
                              onChange={e => updateItem(item._key, 'titulo', e.target.value, 'base')}
                            />
                            <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => moveItem(idx, 'up', 'base')}
                                disabled={idx === 0}
                                className="p-0.5 text-slate-400 hover:text-indigo-600 disabled:opacity-20"
                              >
                                <ChevronUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveItem(idx, 'down', 'base')}
                                disabled={idx === items.length - 1}
                                className="p-0.5 text-slate-400 hover:text-indigo-600 disabled:opacity-20"
                              >
                                <ChevronDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <textarea
                            rows={2}
                            className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 resize-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition-all text-slate-600"
                            placeholder="Contenido descriptivo (opcional)"
                            value={item.contenido}
                            onChange={e => updateItem(item._key, 'contenido', e.target.value, 'base')}
                          />
                        </div>
                      </td>

                      <td className="py-2 px-2 w-20">
                        <input
                          min={1}
                          type="number"
                          className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 text-center focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition-all"
                          value={item.cantidad}
                          onChange={e => updateItem(item._key, 'cantidad', parseFloat(e.target.value) || 1, 'base')}
                        />
                      </td>

                      <td className="py-2 px-2 w-32">
                        <input
                          min={0}
                          step={0.01}
                          type="number"
                          className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 text-right focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition-all"
                          value={item.precioUnitario}
                          onChange={e => updateItem(item._key, 'precioUnitario', parseFloat(e.target.value) || 0, 'base')}
                        />
                      </td>

                      <td className="py-2 pl-2 w-28 text-right">
                        <span className="text-sm font-medium text-slate-700">
                          S/ {currency(Number(item.total) || (Number(item.cantidad || 1) * Number(item.precioUnitario || 0)))}
                        </span>
                      </td>

                      <td className="py-2 pl-2 w-8">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(item._key, 'base')}
                            className="text-slate-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => addItem(undefined, 'base')}
                  className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  Agregar ítem
                </button>

                <button
                  type="button"
                  onClick={() => setShowReuseDrawer(!showReuseDrawer)}
                  className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-medium hover:underline"
                >
                  <Search className="w-3.5 h-3.5" /> Reutilizar de otras plantillas
                </button>
              </div>
            </div>

            {/* Características Adicionales Toggle & Section */}
            <div className="mt-6 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => setShowAddons(!showAddons)}
                className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
              >
                <ChevronRight className={`w-4 h-4 transition-transform ${showAddons ? 'rotate-90' : ''}`} />
                Características adicionales
                <span className="text-xs font-normal text-slate-400">(opcional)</span>
              </button>

              {showAddons && (
                <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50/50 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Servicios o módulos adicionales</p>
                  {additionalItems.length > 0 && (
                    <table className="w-full mb-3">
                      <thead>
                        <tr className="border-b-2 border-slate-200">
                          <th className="text-left text-xs font-semibold text-slate-500 pb-2 pr-3">Detalle Adicional</th>
                          <th className="text-center text-xs font-semibold text-slate-500 pb-2 px-2">Cant.</th>
                          <th className="text-right text-xs font-semibold text-slate-500 pb-2 px-2">P. Unitario</th>
                          <th className="text-right text-xs font-semibold text-slate-500 pb-2 pl-2">Total</th>
                          <th className="w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {additionalItems.map((item) => (
                          <tr key={item._key} className="border-b border-slate-100 last:border-0 group align-top">
                            <td className="py-2 pr-3">
                              <div className="space-y-2">
                                <input
                                  className="w-full text-sm font-semibold border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-indigo-300 outline-none"
                                  placeholder="Título del servicio adicional"
                                  value={item.titulo}
                                  onChange={e => updateItem(item._key, 'titulo', e.target.value, 'addons')}
                                />
                                <textarea
                                  rows={2}
                                  className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 resize-none bg-white focus:ring-2 focus:ring-indigo-300 outline-none text-slate-600"
                                  placeholder="Descripción de la característica opcional..."
                                  value={item.contenido}
                                  onChange={e => updateItem(item._key, 'contenido', e.target.value, 'addons')}
                                />
                              </div>
                            </td>
                            <td className="py-2 px-2 w-20">
                              <input
                                min={1}
                                type="number"
                                className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 text-center bg-white"
                                value={item.cantidad}
                                onChange={e => updateItem(item._key, 'cantidad', parseFloat(e.target.value) || 1, 'addons')}
                              />
                            </td>
                            <td className="py-2 px-2 w-32">
                              <input
                                min={0}
                                step={0.01}
                                type="number"
                                className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 text-right bg-white"
                                value={item.precioUnitario}
                                onChange={e => updateItem(item._key, 'precioUnitario', parseFloat(e.target.value) || 0, 'addons')}
                              />
                            </td>
                            <td className="py-2 pl-2 w-28 text-right">
                              <span className="text-sm font-medium text-slate-700">
                                S/ {currency(Number(item.total) || (Number(item.cantidad || 1) * Number(item.precioUnitario || 0)))}
                              </span>
                            </td>
                            <td className="py-2 pl-2 w-8">
                              <button
                                type="button"
                                onClick={() => removeItem(item._key, 'addons')}
                                className="text-slate-300 hover:text-red-400 transition-colors p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  <button
                    type="button"
                    onClick={() => addItem(undefined, 'addons')}
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold pt-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Agregar Ítem Adicional
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* SECTION 5: Totales */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">
                5
              </span>
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
                <span style={{ color: headerBgColor }}>
                  S/ {currency(total)}
                </span>
              </div>
            </div>
          </section>

          {/* SECTION 6: Consideraciones */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">
                6
              </span>
              Consideraciones
            </h2>
            <textarea
              rows={5}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-300 resize-none mb-4"
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
              <input
                ref={fileInputRef}
                accept="image/*"
                multiple
                className="hidden"
                type="file"
                onChange={handleImageUpload}
              />
            </div>

            {images.length > 0 && (
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                    <img src={img} alt={`Adjunto ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute inset-0 bg-slate-900/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4 text-red-300" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Custom fields editor for Section 6 */}
            <div className="mt-6">
              <CompanyCustomFieldsEditor
                customFields={customConsiderationFields}
                onChange={setCustomConsiderationFields}
                hideCategory={true}
                heading="Campos Personalizados adicionales para Consideraciones"
                description="Agrega más cuadros de texto, desplegables o casillas de verificación en las consideraciones."
                emptyLabel="No hay campos adicionales en Consideraciones."
              />
            </div>
          </section>

          {/* SECTION 7: Condiciones comerciales */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">
                7
              </span>
              Condiciones comerciales
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Validez de la oferta</label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-300"
                  value={commercialConditions.validity}
                  onChange={e => setCommercialConditions(prev => ({ ...prev, validity: e.target.value }))}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Forma de pago</label>
                <textarea
                  rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-300 resize-none"
                  value={commercialConditions.paymentTerms}
                  onChange={e => setCommercialConditions(prev => ({ ...prev, paymentTerms: e.target.value }))}
                />
              </div>
            </div>

            {/* Custom fields editor for Section 7 */}
            <div className="mt-6">
              <CompanyCustomFieldsEditor
                customFields={customCommercialFields}
                onChange={setCustomCommercialFields}
                hideCategory={true}
                heading="Campos Personalizados adicionales para Condiciones comerciales"
                description="Agrega más cuadros de texto, desplegables o casillas de verificación para términos comerciales."
                emptyLabel="No hay campos adicionales en Condiciones comerciales."
              />
            </div>
          </section>

          {/* SECTION 8: Secciones Legales / Condiciones */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">
                  8
                </span>
                Secciones Legales / Condiciones
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
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
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={addSection}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar Sección
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {sections.map((sec, idx) => {
                const isExpanded = Boolean(expandedSections[idx]);

                return (
                  <div
                    key={idx}
                    className={`border rounded-xl overflow-hidden transition-colors ${
                      sec.enabled ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50/70 opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => toggleSectionEnabled(idx)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            sec.enabled ? 'bg-indigo-600' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              sec.enabled ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>

                        <input
                          type="text"
                          className="text-sm font-semibold text-slate-800 bg-transparent outline-none flex-1 px-1 py-0.5 border-b border-transparent hover:border-slate-200 focus:border-indigo-400 transition-colors"
                          value={sec.title}
                          onChange={e => updateSection(idx, { title: e.target.value })}
                        />
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setExpandedSections(prev => ({ ...prev, [idx]: !prev[idx] }))}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => removeSection(idx)}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar sección"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 pt-2 border-t border-slate-100 space-y-4 bg-slate-50/40">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">
                            Texto / Contenido de la sección
                          </label>
                          <textarea
                            rows={4}
                            className="w-full border border-slate-200 rounded-lg p-3 text-xs outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all text-slate-700 bg-white"
                            value={sec.content}
                            onChange={e => updateSection(idx, { content: e.target.value })}
                          />
                        </div>

                        <CompanyCustomFieldsEditor
                          customFields={sec.fields || []}
                          onChange={fields => updateSection(idx, { fields })}
                          hideCategory={true}
                          heading={`Campos personalizados en "${sec.title}"`}
                          description="Diseña cuadros de texto, áreas multilinea, desplegables, casillas (checkboxes) o números específicos para esta sección."
                          emptyLabel="Esta sección no tiene campos personalizados adicionales."
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {sections.length === 0 && (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6 text-center">
                  <p className="text-xs text-slate-400">
                    No hay secciones legales configuradas. Haz clic en <b>Agregar Sección</b> para añadir una.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      </div>

      {/* Drawer Overlay for Reusable Items */}
      {showReuseDrawer && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full p-6 shadow-2xl flex flex-col space-y-4 overflow-hidden animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Search className="w-4 h-4 text-indigo-600" />
                Biblioteca de Ítems Reutilizables
              </h3>
              <button
                type="button"
                onClick={() => setShowReuseDrawer(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Haz clic en <b>+ Agregar</b> para importar de forma inmediata un ítem o servicio creado en otras plantillas.
            </p>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nombre de ítem o servicio..."
                value={reuseSearch}
                onChange={e => setReuseSearch(e.target.value)}
                className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredReusableItems.map(item => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                      {item.titulo}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {item.source} • S/ {item.precioUnitario.toLocaleString('es-PE')}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        addItem(item, 'base');
                        setShowReuseDrawer(false);
                      }}
                      className="inline-flex items-center gap-1 bg-white hover:bg-indigo-600 text-indigo-600 hover:text-white border border-indigo-200 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all shadow-xs"
                    >
                      <Plus className="w-3 h-3" /> Base
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        addItem(item, 'addons');
                        setShowAddons(true);
                        setShowReuseDrawer(false);
                      }}
                      className="inline-flex items-center gap-1 bg-white hover:bg-slate-700 text-slate-600 hover:text-white border border-slate-200 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all shadow-xs"
                    >
                      + Extra
                    </button>
                  </div>
                </div>
              ))}

              {filteredReusableItems.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No se encontraron ítems reutilizables en otras plantillas.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

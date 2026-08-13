import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { API_URL } from '../config';
import type { Company, QuoteItem } from '../types';
import { PlusCircle, Trash2, ArrowLeft, Save, X, ImagePlus, ChevronDown, ChevronRight, ChevronUp, FileText, LayoutTemplate, Star, Pencil, Shield, ScrollText } from 'lucide-react';
import { fetchWithAuth, getToken } from '../auth';
import { getTiposProyecto, getTiposServicio } from '../constants/projectTypes';
import { getDefaultSections } from '../constants/legalSections';
import { QuoteAuditModal } from '../components/QuoteAuditModal';
import { GenerateContractModal } from '../components/contracts/GenerateContractModal';

// ---------- helpers ----------
const emptyItem = (): QuoteItem & { _key: string } => ({
  _key: Math.random().toString(36).slice(2),
  titulo: '',
  contenido: '',
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
    <tr className="border-b border-slate-100 last:border-0 group align-top">
      <td className="py-2 pr-3">
        <div className="space-y-2">
          <input
            className="w-full text-sm font-semibold border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition-all"
            placeholder="Título del ítem"
            value={item.titulo || item.detalle}
            onChange={e => onChange({ ...item, titulo: e.target.value, detalle: e.target.value })}
          />
          <textarea
            rows={2}
            className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 resize-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition-all text-slate-600"
            placeholder="Contenido descriptivo (opcional)"
            value={item.contenido || ''}
            onChange={e => handleField('contenido', e.target.value)}
          />
        </div>
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
  const { companySlug: paramCompanySlug, quoteId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const leadState = location.state?.leadData;

  const [company, setCompany] = useState<Company | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddons, setShowAddons] = useState(leadState?.additionalItems?.length > 0);
  const [quoteNumber, setQuoteNumber] = useState<string | null>(null);

  const [showStartModal, setShowStartModal] = useState(!leadState && !quoteId);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [currentQuoteObj, setCurrentQuoteObj] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
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
  const [sections, setSections] = useState(() => getDefaultSections(paramCompanySlug));
  const [images, setImages] = useState<string[]>([]);
  const [validity, setValidity] = useState('15 días calendario');
  const [paymentTerms, setPaymentTerms] = useState('40% adelanto, 30% al aprobar maqueta, 30% al finalizar');
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});

  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [activeTemplateCustomFields, setActiveTemplateCustomFields] = useState<any[]>([]);
  const [fieldLabels, setFieldLabels] = useState<Record<string, string>>({});
  const [fieldConfigs, setFieldConfigs] = useState<Record<string, any>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoTemplateAppliedRef = useRef(false);

  useEffect(() => {
    if (quoteId) {
      setLoadingCompany(true);
      fetchWithAuth(`${API_URL}/quotes/${quoteId}`)
        .then(res => res.json())
        .then(quote => {
          if (!quote || quote.message) throw new Error('Cotización no encontrada');
          
          setCompany(quote.company);
          setQuoteNumber(quote.number);
          setCurrentQuoteObj(quote);
          setShowStartModal(false);

          const cData = quote.clientData || {};
          setClientData({
            empresa: cData.empresa || '',
            ruc: cData.ruc || '',
            solicitante: cData.solicitante || '',
            direccion: cData.direccion || '',
            telefono: cData.telefono || '',
            correo: cData.correo || '',
            tipoCliente: quote.tipoCliente || cData.tipoCliente || '',
            clienteNuevoRecurrente: quote.clienteNuevoRecurrente || cData.clienteNuevoRecurrente || '',
            fuenteCliente: quote.fuenteCliente || cData.fuenteCliente || '',
          });

          setClientData(quote.clientData || {});
          setProjectData(quote.projectData || {});
          if (quote.ubicacionProyecto) setProjectData(prev => ({ ...prev, ubicacionProyecto: quote.ubicacionProyecto }));
          if (quote.sectorProyecto) setProjectData(prev => ({ ...prev, sectorProyecto: quote.sectorProyecto }));
          if (quote.tipoProyecto) setProjectData(prev => ({ ...prev, tipoProyecto: quote.tipoProyecto }));
          if (quote.tipoServicio) setProjectData(prev => ({ ...prev, tipoServicio: quote.tipoServicio }));

          if (quote.company) setCompany(quote.company);

          if (quote.items && Array.isArray(quote.items)) {
            setItems(quote.items.map((i: any) => ({ ...i, _key: Math.random().toString(36).slice(2) })));
          }
          if (quote.additionalItems && Array.isArray(quote.additionalItems)) {
            setAdditionalItems(quote.additionalItems.map((i: any) => ({ ...i, _key: Math.random().toString(36).slice(2) })));
          }

          if (quote.considerations) setConsiderations(quote.considerations);
          if (quote.sections) setSections(quote.sections);
          if (quote.images) setImages(quote.images);
          if (quote.metadata && (quote.metadata as any).customFields) {
            setCustomFieldValues((quote.metadata as any).customFields);
          }

          if (quote.company?.slug) {
            fetchWithAuth(`${API_URL}/templates?companySlug=${quote.company.slug}`)
              .then(res => res.json())
              .then(setTemplates)
              .catch(() => {});

          }

          setLoadingCompany(false);
        })
        .catch(err => {
          alert(err.message || 'Error al cargar la cotización.');
          setLoadingCompany(false);
          navigate('/lista');
        });
    } else if (paramCompanySlug) {
      Promise.all([
        fetch(`${API_URL}/catalog/${paramCompanySlug}`).then(res => res.json()),
        fetchWithAuth(`${API_URL}/templates?companySlug=${paramCompanySlug}`).then(res => res.json())
      ])
      .then(([data, tpls]) => {
        const { catalogItems: _, ...co } = data;
        setCompany(co);
        setTemplates(tpls);
        setSections(getDefaultSections(co.slug));
        if (co.slug === 'pyramid-structures') {
          setPaymentTerms('50% adelanto, 30% aprobación de planos, 20% entregable final');
        } else {
          setPaymentTerms('40% adelanto, 30% al aprobar maqueta, 30% al finalizar');
        }
        setLoadingCompany(false);
      })
      .catch(() => setLoadingCompany(false));
    }
  }, [quoteId, paramCompanySlug]);

  // Si la cotización viene de un lead, busca la plantilla cuyo nombre coincide con el
  // servicio principal que eligió el cliente en el precotizador y la aplica automáticamente,
  // conservando los datos de contacto/proyecto ya cargados desde el lead.
  useEffect(() => {
    if (autoTemplateAppliedRef.current) return;
    if (!leadState?.matchServiceName || templates.length === 0) return;
    autoTemplateAppliedRef.current = true;

    const target = String(leadState.matchServiceName).toLowerCase().trim();
    const match =
      templates.find((t) => t.name?.toLowerCase().trim() === target) ||
      templates.find((t) => {
        const tname = t.name?.toLowerCase().trim() || '';
        return tname && (target.includes(tname) || tname.includes(target));
      });

    if (match) {
      applyTemplate(match);
      if (leadState.proyecto) {
        setProjectData((prev) => ({ ...prev, nombre: leadState.proyecto }));
      }
    }
  }, [templates, leadState]);

  const tiposProyecto = getTiposProyecto(company?.slug);
  const tiposServicio = getTiposServicio(company?.slug);

  const itemsSubtotal = items.reduce((s, i) => s + i.total, 0);
  const addonsSubtotal = additionalItems.reduce((s, i) => s + i.total, 0);
  const subtotal = itemsSubtotal + addonsSubtotal;
  const igv = subtotal * 0.18;
  const total = subtotal + igv;

  const processedItems = items
    .filter(i => (i.titulo?.trim() || i.detalle?.trim()))
    .map(({ _key, ...rest }) => ({
      ...rest,
      titulo: rest.titulo || rest.detalle || '',
      detalle: rest.detalle || rest.titulo || '',
      contenido: rest.contenido || '',
      cantidad: Number(rest.cantidad) || 1,
      precioUnitario: Number(rest.precioUnitario) || 0,
      total: Number(rest.total) > 0 ? Number(rest.total) : (Number(rest.cantidad || 1) * Number(rest.precioUnitario || 0))
    }));

  const processedAdditionalItems = additionalItems
    .filter(i => (i.titulo?.trim() || i.detalle?.trim()))
    .map(({ _key, ...rest }) => ({
      ...rest,
      titulo: rest.titulo || rest.detalle || '',
      detalle: rest.detalle || rest.titulo || '',
      contenido: rest.contenido || '',
      cantidad: Number(rest.cantidad) || 1,
      precioUnitario: Number(rest.precioUnitario) || 0,
      total: Number(rest.total) > 0 ? Number(rest.total) : (Number(rest.cantidad || 1) * Number(rest.precioUnitario || 0))
    }));

  const hasItems = processedItems.length > 0;
  const canSave = hasItems && Boolean(clientData.empresa.trim()) && Boolean(clientData.solicitante.trim()) && Boolean(projectData.nombre.trim());

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
    if (!company) return;
    if (!clientData.empresa.trim()) return alert('Por favor ingresa la Empresa del cliente.');
    if (!clientData.solicitante.trim()) return alert('Por favor ingresa el Solicitante.');
    if (!projectData.nombre.trim()) return alert('Por favor ingresa el Nombre del proyecto.');
    if (!hasItems) return alert('Por favor agrega al menos un ítem a la cotización.');

    setSaving(true);
    try {
      const payload = {
        companyId: company.id,
        clientData: { empresa: clientData.empresa, ruc: clientData.ruc || undefined, solicitante: clientData.solicitante, direccion: clientData.direccion || undefined, telefono: clientData.telefono || undefined, correo: clientData.correo || undefined },
        projectData: { nombre: projectData.nombre, modalidad: projectData.modalidad || undefined, plazo: projectData.plazo || undefined, fieldLabels },
        ubicacionProyecto: projectData.ubicacionProyecto || undefined,
        sectorProyecto: projectData.sectorProyecto || undefined,
        tipoProyecto: projectData.tipoProyecto || undefined,
        tipoServicio: projectData.tipoServicio || undefined,
        tipoCliente: clientData.tipoCliente || undefined,
        clienteNuevoRecurrente: clientData.clienteNuevoRecurrente || undefined,
        fuenteCliente: clientData.fuenteCliente || undefined,
        items: processedItems,
        additionalItems: processedAdditionalItems,
        considerations: considerations || undefined,
        sections: sections,
        images: images.length > 0 ? images : undefined,
        metadata: { customFields: customFieldValues, fieldLabels },
      };

      const url = quoteId ? `${API_URL}/quotes/${quoteId}` : `${API_URL}/quotes`;
      const method = quoteId ? 'PATCH' : 'POST';

      const res = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Error al guardar la cotización:', errorData);
        throw new Error(errorData.message || 'Error al guardar la cotización');
      }

      const quote = await res.json();
      
      const token = getToken();
      const pdfRes = await fetch(`${API_URL}/quotes/${quote.id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (pdfRes.ok) {
        const blob = await pdfRes.blob();
        window.open(URL.createObjectURL(blob), '_blank');
      } else {
        alert('Cotización guardada, pero hubo un error al mostrar el PDF.');
      }
      
      navigate('/lista');
    } catch (err: any) {
      alert(err?.message || 'Hubo un error al guardar la cotización. Intenta nuevamente.');
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
        items: items.filter(i => i.titulo?.trim() || i.detalle?.trim()).map(({ _key, ...rest }) => rest),
        sections: sections,
        isCustom: true
      };
      const res = await fetchWithAuth(`${API_URL}/templates`, {
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
      if (tpl.projectData.fieldLabels) {
        setFieldLabels(tpl.projectData.fieldLabels);
      }
      if (tpl.projectData.fieldConfigs) {
        setFieldConfigs(tpl.projectData.fieldConfigs);
        const fc = tpl.projectData.fieldConfigs;
        setClientData(prev => ({
          ...prev,
          ...(fc.empresa?.defaultValue ? { empresa: fc.empresa.defaultValue } : {}),
          ...(fc.ruc?.defaultValue ? { ruc: fc.ruc.defaultValue } : {}),
          ...(fc.solicitante?.defaultValue ? { solicitante: fc.solicitante.defaultValue } : {}),
          ...(fc.direccion?.defaultValue ? { direccion: fc.direccion.defaultValue } : {}),
          ...(fc.telefono?.defaultValue ? { telefono: fc.telefono.defaultValue } : {}),
          ...(fc.correo?.defaultValue ? { correo: fc.correo.defaultValue } : {}),
          ...(fc.tipoCliente?.defaultValue ? { tipoCliente: fc.tipoCliente.defaultValue } : {}),
          ...(fc.recurrencia?.defaultValue ? { clienteNuevoRecurrente: fc.recurrencia.defaultValue } : {}),
          ...(fc.fuenteCliente?.defaultValue ? { fuenteCliente: fc.fuenteCliente.defaultValue } : {}),
        }));
        setProjectData(prev => ({
          ...prev,
          ...(fc.nombreProyecto?.defaultValue ? { nombre: fc.nombreProyecto.defaultValue } : {}),
          ...(fc.modalidad?.defaultValue ? { modalidad: fc.modalidad.defaultValue } : {}),
          ...(fc.plazo?.defaultValue ? { plazo: fc.plazo.defaultValue } : {}),
          ...(fc.ubicacionProyecto?.defaultValue ? { ubicacionProyecto: fc.ubicacionProyecto.defaultValue } : {}),
          ...(fc.sectorProyecto?.defaultValue ? { sectorProyecto: fc.sectorProyecto.defaultValue } : {}),
          ...(fc.tipoProyecto?.defaultValue ? { tipoProyecto: fc.tipoProyecto.defaultValue } : {}),
          ...(fc.tipoServicio?.defaultValue ? { tipoServicio: fc.tipoServicio.defaultValue } : {}),
        }));
      }
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
      const baseSections = getDefaultSections(company?.slug || paramCompanySlug);
      const mergedSections = baseSections.map(defaultSection => {
        const key = defaultSection.title.toLowerCase().trim();
        const match = templateSectionsMap.get(key);
        if (match) {
          templateSectionsMap.delete(key); // consumed
          return { title: defaultSection.title, content: match.content, enabled: Boolean(match.enabled) };
        }
        return { ...defaultSection, enabled: false };
      });

      // Append extra sections that exist in the template but not in baseSections
      templateSectionsMap.forEach((extraSection) => {
        mergedSections.push({
          title: extraSection.title,
          content: extraSection.content,
          enabled: Boolean(extraSection.enabled),
        });
      });

      setSections(mergedSections);
    }
    if (tpl.customFields && Array.isArray(tpl.customFields)) {
      setActiveTemplateCustomFields(tpl.customFields);
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

  const allCustomFields = activeTemplateCustomFields.length > 0 ? activeTemplateCustomFields : ((company?.customFields as any[]) || []);
  const customClientFields = allCustomFields.filter(f => f.category === 'client');
  const customProjectFields = allCustomFields.filter(f => f.category === 'project');

  const renderCustomField = (f: any) => {
    const val = customFieldValues[f.id] || '';
    const handleChange = (v: any) => setCustomFieldValues(prev => ({ ...prev, [f.id]: v }));

    if (f.type === 'textarea') {
      return (
        <div key={f.id} className="sm:col-span-2">
          <label className={labelCls}>{f.label} {f.required && <span className="text-red-400">*</span>}</label>
          <textarea
            rows={2}
            className={`${inputCls} resize-none`}
            placeholder={`Ingresa ${f.label.toLowerCase()}`}
            value={val}
            onChange={e => handleChange(e.target.value)}
          />
        </div>
      );
    }

    if (f.type === 'select') {
      return (
        <div key={f.id}>
          <label className={labelCls}>{f.label} {f.required && <span className="text-red-400">*</span>}</label>
          <select className={selectCls} value={val} onChange={e => handleChange(e.target.value)}>
            <option value="">Seleccionar...</option>
            {(f.options || []).map((opt: string) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    }

    if (f.type === 'checkbox') {
      return (
        <div key={f.id} className="flex items-center pt-5">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={Boolean(val)}
              onChange={e => handleChange(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            {f.label} {f.required && <span className="text-red-400">*</span>}
          </label>
        </div>
      );
    }

    return (
      <div key={f.id}>
        <label className={labelCls}>{f.label} {f.required && <span className="text-red-400">*</span>}</label>
        <input
          type={f.type === 'number' ? 'number' : 'text'}
          className={inputCls}
          placeholder={`Ingresa ${f.label.toLowerCase()}`}
          value={val}
          onChange={e => handleChange(e.target.value)}
        />
      </div>
    );
  };

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
                    <div
                      key={tpl.id}
                      className="bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md rounded-xl p-4 transition-all group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="inline-block px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-md">
                            {tpl.code}
                          </span>
                          {tpl.isCustom && <Star className="w-4 h-4 text-yellow-400" />}
                        </div>
                        <p className="font-semibold text-slate-800 text-sm mb-1 group-hover:text-indigo-600 transition-colors">{tpl.name}</p>
                        <p className="text-xs text-slate-500 capitalize">{tpl.category}</p>
                      </div>

                      <div className="flex items-center gap-2 pt-3 mt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => applyTemplate(tpl)}
                          className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors text-center shadow-xs"
                        >
                          Usar plantilla
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            applyTemplate(tpl);
                            setShowStartModal(false);
                          }}
                          className="py-1.5 px-3 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shrink-0"
                          title="Cargar y editar esta plantilla para la cotización"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Editar
                        </button>
                      </div>
                    </div>
                  ))}
                  {templates.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No hay plantillas disponibles</p>}
                </div>

                <div className="pt-3 mt-3 border-t border-slate-200/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">¿Deseas crear o modificar plantillas maestras?</span>
                  <Link
                    to={`/empresa/${company?.slug || paramCompanySlug}?tab=plantillas`}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 hover:underline"
                  >
                    Gestor de Plantillas ↗
                  </Link>
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
                <p className="text-xs text-slate-400 leading-none">
                  {quoteId ? `Editando Cotización N° ${quoteNumber || ''}` : 'Nueva cotización'}
                </p>
                <p className="font-semibold text-slate-800">{company.name}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {quoteId && (
            <>
              <button
                onClick={() => setContractModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-semibold transition-colors"
                title="Generar Contrato o Acta de Conformidad"
              >
                <ScrollText className="w-4 h-4 text-emerald-600" />
                Generar Contrato
              </button>
              <button
                onClick={() => setAuditModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold transition-colors"
                title="Ver historial de auditoría de esta cotización"
              >
                <Shield className="w-4 h-4 text-indigo-600" />
                Auditoría
              </button>
            </>
          )}
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
            {saving ? 'Guardando…' : quoteId ? 'Guardar Cambios y PDF' : 'Guardar y Exportar PDF'}
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
            {fieldConfigs.empresa?.enabled !== false && (
              <div>
                <label className={labelCls}>{fieldConfigs.empresa?.label || fieldLabels.empresaLabel || 'Empresa / Cliente'} <span className="text-red-400">*</span></label>
                <input className={inputCls} placeholder={fieldConfigs.empresa?.placeholder || "Nombre de la empresa"} value={clientData.empresa} onChange={e => setClientData({ ...clientData, empresa: e.target.value })} />
              </div>
            )}

            {fieldConfigs.ruc?.enabled !== false && (
              <div>
                <label className={labelCls}>{fieldConfigs.ruc?.label || fieldLabels.rucLabel || 'RUC'}</label>
                <input className={inputCls} placeholder={fieldConfigs.ruc?.placeholder || "20XXXXXXXXX"} value={clientData.ruc} onChange={e => setClientData({ ...clientData, ruc: e.target.value })} />
              </div>
            )}

            {fieldConfigs.solicitante?.enabled !== false && (
              <div>
                <label className={labelCls}>{fieldConfigs.solicitante?.label || fieldLabels.solicitanteLabel || 'Solicitante'} <span className="text-red-400">*</span></label>
                <input className={inputCls} placeholder={fieldConfigs.solicitante?.placeholder || "Nombre completo"} value={clientData.solicitante} onChange={e => setClientData({ ...clientData, solicitante: e.target.value })} />
              </div>
            )}

            {fieldConfigs.direccion?.enabled !== false && (
              <div>
                <label className={labelCls}>{fieldConfigs.direccion?.label || fieldLabels.direccionLabel || 'Dirección'}</label>
                <input className={inputCls} placeholder={fieldConfigs.direccion?.placeholder || "Av. / Calle / Urb."} value={clientData.direccion} onChange={e => setClientData({ ...clientData, direccion: e.target.value })} />
              </div>
            )}

            {fieldConfigs.telefono?.enabled !== false && (
              <div>
                <label className={labelCls}>{fieldConfigs.telefono?.label || fieldLabels.telefonoLabel || 'Teléfono'}</label>
                <input className={inputCls} placeholder={fieldConfigs.telefono?.placeholder || "+51 999 000 000"} value={clientData.telefono} onChange={e => setClientData({ ...clientData, telefono: e.target.value })} />
              </div>
            )}

            {fieldConfigs.correo?.enabled !== false && (
              <div>
                <label className={labelCls}>{fieldConfigs.correo?.label || fieldLabels.correoLabel || 'Correo'}</label>
                <input type="email" className={inputCls} placeholder={fieldConfigs.correo?.placeholder || "correo@empresa.com"} value={clientData.correo} onChange={e => setClientData({ ...clientData, correo: e.target.value })} />
              </div>
            )}

            {fieldConfigs.tipoCliente?.enabled !== false && (
              <div>
                <label className={labelCls}>{fieldConfigs.tipoCliente?.label || fieldLabels.tipoClienteLabel || 'Tipo de cliente'}</label>
                <select className={selectCls} value={clientData.tipoCliente} onChange={e => setClientData({ ...clientData, tipoCliente: e.target.value })}>
                  <option value="">Seleccionar...</option>
                  {(fieldConfigs.tipoCliente?.options || ['Persona natural', 'Empresa privada', 'Entidad pública']).map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            )}

            {fieldConfigs.recurrencia?.enabled !== false && (
              <div>
                <label className={labelCls}>{fieldConfigs.recurrencia?.label || fieldLabels.recurrenciaLabel || 'Recurrencia'}</label>
                <select className={selectCls} value={clientData.clienteNuevoRecurrente} onChange={e => setClientData({ ...clientData, clienteNuevoRecurrente: e.target.value })}>
                  <option value="">Seleccionar...</option>
                  {(fieldConfigs.recurrencia?.options || ['Nuevo', 'Recurrente']).map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            )}

            {fieldConfigs.fuenteCliente?.enabled !== false && (
              <div>
                <label className={labelCls}>{fieldConfigs.fuenteCliente?.label || fieldLabels.fuenteClienteLabel || 'Fuente del cliente'}</label>
                <select className={selectCls} value={clientData.fuenteCliente} onChange={e => setClientData({ ...clientData, fuenteCliente: e.target.value })}>
                  <option value="">Seleccionar...</option>
                  {(fieldConfigs.fuenteCliente?.options || ['Referido', 'Redes sociales', 'Web', 'Anuncio', 'Directo', 'Otro']).map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            )}
            {customClientFields.map(renderCustomField)}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">2</span>
            Clasificación del proyecto
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {fieldConfigs.ubicacionProyecto?.enabled !== false && (
              <div>
                <label className={labelCls}>{fieldConfigs.ubicacionProyecto?.label || fieldLabels.ubicacionLabel || 'Ubicación del proyecto'}</label>
                <input className={inputCls} placeholder={fieldConfigs.ubicacionProyecto?.placeholder || "Ciudad, Distrito"} value={projectData.ubicacionProyecto} onChange={e => setProjectData({ ...projectData, ubicacionProyecto: e.target.value })} />
              </div>
            )}

            {fieldConfigs.sectorProyecto?.enabled !== false && (
              <div>
                <label className={labelCls}>{fieldConfigs.sectorProyecto?.label || fieldLabels.sectorLabel || 'Sector'}</label>
                <select className={selectCls} value={projectData.sectorProyecto} onChange={e => setProjectData({ ...projectData, sectorProyecto: e.target.value })}>
                  <option value="">Seleccionar...</option>
                  {(fieldConfigs.sectorProyecto?.options || ['Residencial', 'Comercial', 'Industrial', 'Educativo', 'Salud', 'Institucional', 'Otro']).map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            )}

            {fieldConfigs.tipoProyecto?.enabled !== false && (
              <div>
                <label className={labelCls}>{fieldConfigs.tipoProyecto?.label || fieldLabels.tipoProyectoLabel || 'Tipo de proyecto'}</label>
                <select className={selectCls} value={projectData.tipoProyecto} onChange={e => setProjectData({ ...projectData, tipoProyecto: e.target.value })}>
                  <option value="">Seleccionar...</option>
                  {(fieldConfigs.tipoProyecto?.options || (tiposProyecto.map(t => t.label))).map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            )}

            {fieldConfigs.tipoServicio?.enabled !== false && (
              <div>
                <label className={labelCls}>{fieldConfigs.tipoServicio?.label || fieldLabels.tipoServicioLabel || 'Tipo de servicio'}</label>
                <select className={selectCls} value={projectData.tipoServicio} onChange={e => setProjectData({ ...projectData, tipoServicio: e.target.value })}>
                  <option value="">Seleccionar...</option>
                  {(fieldConfigs.tipoServicio?.options || (tiposServicio.map(t => t.label))).map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">3</span>
            Detalles del proyecto
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {fieldConfigs.nombreProyecto?.enabled !== false && (
              <div className="sm:col-span-3">
                <label className={labelCls}>{fieldConfigs.nombreProyecto?.label || fieldLabels.nombreProyectoLabel || 'Nombre del proyecto'} <span className="text-red-400">*</span></label>
                <input className={inputCls} placeholder={fieldConfigs.nombreProyecto?.placeholder || "Ej: Desarrollo web para Empresa XYZ"} value={projectData.nombre} onChange={e => setProjectData({ ...projectData, nombre: e.target.value })} />
              </div>
            )}
            {fieldConfigs.modalidad?.enabled !== false && (
              <div>
                <label className={labelCls}>{fieldConfigs.modalidad?.label || fieldLabels.modalidadLabel || 'Modalidad'}</label>
                <input className={inputCls} placeholder={fieldConfigs.modalidad?.placeholder || "Proyecto por alcance"} value={projectData.modalidad} onChange={e => setProjectData({ ...projectData, modalidad: e.target.value })} />
              </div>
            )}
            {fieldConfigs.plazo?.enabled !== false && (
              <div>
                <label className={labelCls}>{fieldConfigs.plazo?.label || fieldLabels.plazoLabel || 'Plazo estimado'}</label>
                <input className={inputCls} placeholder={fieldConfigs.plazo?.placeholder || "45 días calendario"} value={projectData.plazo} onChange={e => setProjectData({ ...projectData, plazo: e.target.value })} />
              </div>
            )}
            {customProjectFields.map(renderCustomField)}
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
                    <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-3">
                      <textarea
                        rows={6}
                        className={inputCls + " resize-none text-xs"}
                        value={section.content}
                        onChange={e => setSections(prev => prev.map((s, i) => i === idx ? { ...s, content: e.target.value } : s))}
                      />

                      {activeTemplateCustomFields.filter(f => f.category === `section_${section.title}`).length > 0 && (
                        <div className="pt-2 border-t border-slate-200 grid sm:grid-cols-2 gap-3">
                          {activeTemplateCustomFields
                            .filter(f => f.category === `section_${section.title}`)
                            .map(renderCustomField)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

      </div>
      {/* Quote Audit Log Modal */}
      <QuoteAuditModal
        isOpen={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
        quoteId={quoteId}
        quoteNumber={quoteNumber || undefined}
      />

      {/* Generate Contract Modal */}
      <GenerateContractModal
        isOpen={contractModalOpen}
        onClose={() => setContractModalOpen(false)}
        quote={currentQuoteObj}
      />
    </div>
  );
}

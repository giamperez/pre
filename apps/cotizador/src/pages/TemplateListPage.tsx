import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { fetchWithAuth, getUser } from '../auth';
import {
  LayoutTemplate, Plus, Pencil, Trash2, Bot, FileText,
  Search, Layers, Check, ShieldAlert, Sparkles, Power, Calendar, Contact, Copy
} from 'lucide-react';

interface TemplateListPageProps {
  companySlug: string;
}

export function TemplateListPage({ companySlug }: TemplateListPageProps) {
  const navigate = useNavigate();
  const isAdmin = getUser()?.role === 'admin';

  const navigateToNewTemplate = (type: 'cotizacion' | 'precotizacion') =>
    navigate(`/plantillas/nueva?company=${companySlug}&type=${type}`);

  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'cotizacion' | 'precotizacion'>('cotizacion');
  const [search, setSearch] = useState('');

  // Load templates for this company
  const loadTemplates = useCallback(() => {
    if (!companySlug) return;
    setLoading(true);
    fetchWithAuth(`${API_URL}/templates?companySlug=${companySlug}`)
      .then(res => res.json())
      .then(data => {
        setTemplates(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [companySlug]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  if (!isAdmin) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto my-12 shadow-sm">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800 mb-2">Acceso Restringido</h3>
        <p className="text-slate-500 text-sm mb-6">
          Solo los usuarios administradores pueden crear y gestionar las plantillas de cotización y precotización.
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

  const handleDeleteTemplate = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar la plantilla "${name}"?`)) return;
    try {
      const res = await fetchWithAuth(`${API_URL}/templates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTemplates(prev => prev.filter(t => t.id !== id));
      }
    } catch (err) {
      alert('Error al eliminar la plantilla');
    }
  };

  const handleDuplicateTemplate = async (tpl: any) => {
    try {
      const copyPayload = {
        companyId: tpl.companyId,
        code: `${tpl.code || 'TPL'}-COPY-${Math.floor(100 + Math.random() * 900)}`,
        name: `${tpl.name} (Copia)`,
        category: tpl.category || 'General',
        type: tpl.type || 'cotizacion',
        projectData: tpl.projectData || {},
        items: tpl.items || [],
        additionalItems: tpl.additionalItems || [],
        sections: tpl.sections || [],
        cardsConfig: tpl.cardsConfig || undefined,
        customFields: tpl.customFields || undefined,
        isCustom: true,
      };

      const res = await fetchWithAuth(`${API_URL}/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(copyPayload),
      });

      if (!res.ok) throw new Error('Error al duplicar la plantilla');
      loadTemplates();
    } catch (err: any) {
      alert(err.message || 'Error al duplicar la plantilla');
    }
  };

  const prequoteTemplate = templates.find(t => t.type === 'precotizacion');

  const filteredTemplates = templates.filter(t => {
    const isTypeMatch = activeTab === 'precotizacion' ? t.type === 'precotizacion' : (t.type !== 'precotizacion');
    const isSearchMatch = (t.name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (t.code || '').toLowerCase().includes(search.toLowerCase()) ||
                          (t.category || '').toLowerCase().includes(search.toLowerCase());
    return isTypeMatch && isSearchMatch;
  });

  return (
    <div>
      {/* Tabs & Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <div className="flex bg-slate-200/70 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab('cotizacion')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'cotizacion'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            Cotizaciones Formales
          </button>
          <button
            onClick={() => setActiveTab('precotizacion')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'precotizacion'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bot className="w-4 h-4" />
            Precotización (Chatbot Único)
          </button>
        </div>

        {activeTab === 'cotizacion' && (
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar plantilla..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-indigo-300 outline-none"
              />
            </div>

            <button
              onClick={() => navigateToNewTemplate('cotizacion')}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-md shadow-indigo-200 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              Nueva plantilla de cotización
            </button>
          </div>
        )}
      </div>

      {/* Templates List */}
      {loading ? (
        <div className="flex items-center justify-center h-48 bg-white border border-slate-200 rounded-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : activeTab === 'precotizacion' ? (
        /* SINGLE MASTER PRECOTIZACIÓN CARD FOR THIS COMPANY */
        prequoteTemplate ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-md uppercase">
                      {prequoteTemplate.code || 'PRECOT-BOT'}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      prequoteTemplate.cardsConfig?.botEnabled !== false
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      <Power className="w-3 h-3" />
                      {prequoteTemplate.cardsConfig?.botEnabled !== false ? 'Bot Habilitado' : 'Bot Desactivado'}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg mt-1">
                    {prequoteTemplate.name || 'Configuración de Precotización con Asistente Bot'}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => navigate(`/plantillas/editar/${prequoteTemplate.id}`)}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-md shadow-indigo-200 transition-all shrink-0"
              >
                <Pencil className="w-4 h-4" />
                Editar Bot y Precotización
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Prompt e Instrucciones para el Bot
                </span>
                <p className="text-xs text-slate-700 italic line-clamp-3">
                  "{prequoteTemplate.cardsConfig?.botPrompt || 'Asistente comercial inteligente para atención al cliente y generación de precotizaciones.'}"
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Datos Obligatorios por Defecto
                </span>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Fecha de Emisión
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700">
                    <Contact className="w-3.5 h-3.5 text-indigo-500" /> Datos del Cliente (Nombre, Teléfono, Correo)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
              <span className="flex items-center gap-1 font-medium">
                <Layers className="w-4 h-4 text-indigo-500" />
                {Array.isArray(prequoteTemplate.cardsConfig?.cards) ? prequoteTemplate.cardsConfig.cards.length : 0} Opción(es) / Tarjeta(s) de Precotización configurada(s)
              </span>
              <span className="text-slate-400 text-[11px]">Única plantilla de precotización autorizada para esta empresa</span>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-xl mx-auto">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              Configurar Bot de Precotización
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              Esta empresa aún no tiene configurada su plantilla de precotización ni el prompt para el Bot Asistente.
            </p>
            <button
              onClick={() => navigateToNewTemplate('precotizacion')}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              Configurar Bot de Precotización
            </button>
          </div>
        )
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LayoutTemplate className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            No hay plantillas de cotización
          </h3>
          <p className="text-slate-500 text-sm mb-6">
            Empieza creando una plantilla personalizada para esta empresa.
          </p>
          <button
            onClick={() => navigateToNewTemplate('cotizacion')}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            Crear plantilla de cotización
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(tpl => {
            const itemsCount = Array.isArray(tpl.items) ? tpl.items.length : 0;
            const sectionsCount = Array.isArray(tpl.sections) ? tpl.sections.filter((s: any) => s.enabled).length : 0;

            return (
              <div
                key={tpl.id}
                className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-md group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg">
                      {tpl.code || 'COT-BASE'}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      {tpl.category || 'General'}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-800 text-base mb-1 group-hover:text-indigo-600 transition-colors">
                    {tpl.name}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                    {tpl.type === 'precotizacion' ? (
                      <div className="flex items-center gap-1 text-slate-600">
                        <Bot className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Precotización Chatbot</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          <span>{itemsCount} ítem(s)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{sectionsCount} sección(es)</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-100">
                  <button
                    onClick={() => navigate(`/plantillas/editar/${tpl.id}`)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-xl text-xs font-semibold transition-all"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Editar
                  </button>

                  <button
                    onClick={() => handleDuplicateTemplate(tpl)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                    title="Duplicar plantilla"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Eliminar plantilla"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';
import type { Quote } from '../types';
import { ArrowLeft, ExternalLink, Plus, Search, X, Filter, ChevronDown, Upload, Loader2, FileText } from 'lucide-react';
import { fetchWithAuth, getUser, getToken } from '../auth';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function currency(n: number) {
  return n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const ESTADOS = [
  { value: '', label: 'Todos los estados' },
  { value: 'borrador', label: 'Borrador' },
  { value: 'enviada', label: 'Enviada' },
  { value: 'aprobada', label: 'Aprobada' },
  { value: 'rechazada', label: 'Rechazada' },
  { value: 'vencida', label: 'Vencida' },
];

const TIPOS_SERVICIO = [
  { value: '', label: 'Todos los servicios' },
  { value: 'Diseño estructural', label: 'Diseño estructural' },
  { value: 'Revisión', label: 'Revisión' },
  { value: 'Inspección y evaluación', label: 'Inspección y evaluación' },
  { value: 'Construcción', label: 'Construcción' },
  { value: 'Costos y presupuestos', label: 'Costos y presupuestos' },
  { value: 'Software/Web', label: 'Software/Web' },
  { value: 'Otro', label: 'Otro' },
];

const ESTADO_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  borrador:  { label: 'Borrador',  bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  enviada:   { label: 'Enviada',   bg: 'bg-blue-50',   text: 'text-blue-700',  dot: 'bg-blue-500' },
  aprobada:  { label: 'Aprobada',  bg: 'bg-green-50',  text: 'text-green-700', dot: 'bg-green-500' },
  rechazada: { label: 'Rechazada', bg: 'bg-red-50',    text: 'text-red-700',   dot: 'bg-red-500' },
  vencida:   { label: 'Vencida',   bg: 'bg-orange-50', text: 'text-orange-700',dot: 'bg-orange-400' },
};

function EstadoBadge({ estado }: { estado: string }) {
  const cfg = ESTADO_CONFIG[estado] || ESTADO_CONFIG.borrador;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function EstadoDropdown({ quoteId, currentEstado, onUpdate }: { quoteId: string; currentEstado: string; onUpdate: (id: string, estado: string) => void }) {
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleChange = async (newEstado: string) => {
    if (newEstado === currentEstado) { setOpen(false); return; }
    setUpdating(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newEstado }),
      });
      if (res.ok) {
        onUpdate(quoteId, newEstado);
      }
    } finally {
      setUpdating(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={updating}
        className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
        title="Cambiar estado"
      >
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden py-1">
            {ESTADOS.slice(1).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleChange(value)}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors ${currentEstado === value ? 'font-bold text-indigo-600' : 'text-slate-700'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function QuoteListPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [companyId, setCompanyId] = useState('');
  const [estado, setEstado] = useState('');
  const [tipoServicio, setTipoServicio] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{importadas: number, errores: number, detalles: string[]} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = getUser();
  const isAdmin = user?.role === 'admin';

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (companyId) params.set('companyId', companyId);
    if (estado) params.set('estado', estado);
    if (tipoServicio) params.set('tipoServicio', tipoServicio);
    if (search) params.set('search', search);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const q = params.toString();
    return `${API_URL}/quotes${q ? '?' + q : ''}`;
  }, [companyId, estado, tipoServicio, search, from, to]);

  const loadQuotes = useCallback(() => {
    setLoading(true);
    fetchWithAuth(buildUrl())
      .then(res => res.json())
      .then(data => { setQuotes(data); setLoading(false); })
      .catch(() => { setError('No se pudieron cargar las cotizaciones'); setLoading(false); });
  }, [buildUrl]);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const clearFilters = () => {
    setCompanyId('');
    setEstado('');
    setTipoServicio('');
    setSearch('');
    setSearchInput('');
    setFrom('');
    setTo('');
  };

  const handleEstadoUpdate = (id: string, newEstado: string) => {
    setQuotes(prev => prev.map(q => q.id === id ? { ...q, estado: newEstado } as any : q));
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetchWithAuth(`${API_URL}/quotes/import`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Error al importar cotizaciones');
      const data = await res.json();
      setImportResult(data);
      loadQuotes();
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al importar');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openPdf = async (quoteId: string) => {
    const token = getToken();
    const response = await fetch(`${API_URL}/quotes/${quoteId}/pdf`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!response.ok) {
      alert('Error al generar el PDF');
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const hasFilters = companyId || estado || tipoServicio || search || from || to;
  const inputCls = "border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition-all bg-white";

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Cotizaciones</h1>
            <p className="text-sm text-slate-400">
              {loading ? '…' : `${quotes.length} cotización${quotes.length !== 1 ? 'es' : ''} encontrada${quotes.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls" className="hidden" />
              <button onClick={handleImportClick} disabled={importing} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50">
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Importar Excel
              </button>
            </>
          )}
          <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4" /> Nueva cotización
          </Link>
        </div>
      </div>

      {importResult && (
        <div className={`mb-6 p-4 rounded-xl border ${importResult.errores > 0 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`font-semibold ${importResult.errores > 0 ? 'text-orange-800' : 'text-green-800'}`}>Importación completada</h3>
            <button onClick={() => setImportResult(null)} className="text-slate-400 hover:text-slate-600">×</button>
          </div>
          <p className="text-sm text-slate-700"><strong>{importResult.importadas}</strong> cotizaciones importadas. {importResult.errores > 0 && <span><strong>{importResult.errores}</strong> errores.</span>}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-600">Filtros</span>
          {hasFilters && (
            <button onClick={clearFilters} className="ml-auto flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 transition-colors">
              <X className="w-3.5 h-3.5" />
              Limpiar filtros
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Search */}
          <form onSubmit={handleSearch} className="col-span-2 flex gap-2">
            <input
              type="text"
              placeholder="Buscar número, cliente, proyecto..."
              className={`${inputCls} flex-1 min-w-0`}
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            <button type="submit" className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex-shrink-0">
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Estado */}
          <select className={inputCls} value={estado} onChange={e => setEstado(e.target.value)}>
            {ESTADOS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          {/* Tipo de servicio */}
          <select className={inputCls} value={tipoServicio} onChange={e => setTipoServicio(e.target.value)}>
            {TIPOS_SERVICIO.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          {/* Desde */}
          <input type="date" className={inputCls} value={from} onChange={e => setFrom(e.target.value)} />

          {/* Hasta */}
          <input type="date" className={inputCls} value={to} onChange={e => setTo(e.target.value)} />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">{error}</div>
      )}

      {!loading && !error && quotes.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <p className="text-slate-400 text-base">No hay cotizaciones que coincidan con los filtros.</p>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-4 inline-flex items-center gap-2 text-indigo-600 font-medium hover:underline">
              <X className="w-4 h-4" /> Limpiar filtros
            </button>
          )}
        </div>
      )}

      {!loading && !error && quotes.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">N° Cotización</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Empresa</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Cliente</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Proyecto</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Estado</th>
                <th className="text-right text-xs font-semibold text-slate-500 px-4 py-3">Total</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Fecha</th>
                <th className="text-center text-xs font-semibold text-slate-500 px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q: any, idx) => {
                const clientData = typeof q.clientData === 'object' ? q.clientData as any : {};
                const projectData = typeof q.projectData === 'object' ? q.projectData as any : {};
                return (
                  <tr key={q.id} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                        {q.number}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {q.company?.logoUrl && (
                          <img src={`${API_URL}/public${q.company.logoUrl}`} alt="" className="h-6 w-10 object-contain" />
                        )}
                        <span className="text-sm text-slate-700">{q.company?.name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{clientData.empresa || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 max-w-[180px] truncate">{projectData.nombre || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <EstadoBadge estado={q.estado || 'borrador'} />
                        <EstadoDropdown quoteId={q.id} currentEstado={q.estado || 'borrador'} onUpdate={handleEstadoUpdate} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold text-slate-800">S/ {currency(q.total)}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{formatDate(q.createdAt)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => openPdf(q.id)}
                        className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium border border-indigo-200 hover:border-indigo-400 px-2.5 py-1.5 rounded-lg transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Ver PDF
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

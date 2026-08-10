import { useState, useEffect } from 'react';
import { X, Search, Shield, PlusCircle, Pencil, RefreshCw, FileSpreadsheet, FileText, ChevronDown, ChevronUp, Calendar, Hash } from 'lucide-react';
import { API_URL } from '../config';
import { fetchWithAuth } from '../auth';
import type { QuoteAuditLog } from '../types';

interface QuoteAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteId?: string;
  quoteNumber?: string;
}

const ACTION_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; icon: any }> = {
  CREACION:       { label: 'Creación',       bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: PlusCircle },
  EDICION:        { label: 'Edición',        bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   icon: Pencil },
  CAMBIO_ESTADO:  { label: 'Estado',         bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    icon: RefreshCw },
  IMPORTACION:    { label: 'Importación',    bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200',  icon: FileSpreadsheet },
  DESCARGA_PDF:   { label: 'Descarga PDF',   bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    icon: FileText },
};

function formatAuditDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function QuoteAuditModal({ isOpen, onClose, quoteId, quoteNumber }: QuoteAuditModalProps) {
  const [logs, setLogs] = useState<QuoteAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLogIds, setExpandedLogIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    setError(null);

    const url = quoteId
      ? `${API_URL}/quotes/${quoteId}/audit-logs`
      : `${API_URL}/quotes/audit-logs`;

    fetchWithAuth(url)
      .then(res => {
        if (!res.ok) throw new Error('No se pudo obtener la auditoría');
        return res.json();
      })
      .then(data => {
        setLogs(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Error al cargar registros de auditoría');
        setLoading(false);
      });
  }, [isOpen, quoteId]);

  if (!isOpen) return null;

  const toggleExpand = (id: string) => {
    setExpandedLogIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredLogs = logs.filter(log => {
    if (actionFilter && log.action !== actionFilter) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const matchDesc = log.description.toLowerCase().includes(s);
      const matchUser = (log.userName && log.userName.toLowerCase().includes(s)) || (log.userEmail && log.userEmail.toLowerCase().includes(s));
      const matchQuoteNum = log.quote?.number && log.quote.number.toLowerCase().includes(s);
      return matchDesc || matchUser || matchQuoteNum;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Registro de Auditoría</h2>
                {quoteNumber ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                    <Hash className="w-3 h-3" /> {quoteNumber}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    General
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Historial trazable de cambios, ediciones y actividades
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por usuario, acción o cotización..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition-all"
            />
          </div>

          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-indigo-300 outline-none"
          >
            <option value="">Todas las acciones</option>
            <option value="CREACION">Creaciones</option>
            <option value="EDICION">Ediciones</option>
            <option value="CAMBIO_ESTADO">Cambios de Estado</option>
            <option value="IMPORTACION">Importaciones Excel</option>
            <option value="DESCARGA_PDF">Descargas PDF</option>
          </select>

          <div className="text-xs font-semibold text-slate-500">
            {filteredLogs.length} evento{filteredLogs.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Body Content - Timeline */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          {!loading && !error && filteredLogs.length === 0 && (
            <div className="text-center py-16">
              <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium text-sm">No hay registros de auditoría disponibles.</p>
              <p className="text-slate-400 text-xs mt-1">Los cambios futuros aparecerán en esta sección.</p>
            </div>
          )}

          {!loading && !error && filteredLogs.length > 0 && (
            <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 pl-6">
              {filteredLogs.map(log => {
                const actionCfg = ACTION_CONFIG[log.action] || {
                  label: log.action,
                  bg: 'bg-slate-100',
                  text: 'text-slate-700',
                  border: 'border-slate-200',
                  icon: Shield,
                };
                const IconComponent = actionCfg.icon;
                const isExpanded = !!expandedLogIds[log.id];
                const initialName = log.userName ? log.userName.charAt(0).toUpperCase() : (log.userEmail ? log.userEmail.charAt(0).toUpperCase() : 'U');

                return (
                  <div key={log.id} className="relative group">
                    {/* Node Dot Icon */}
                    <div className={`absolute -left-[37px] top-0 w-8 h-8 rounded-full ${actionCfg.bg} ${actionCfg.border} border-2 flex items-center justify-center ${actionCfg.text} shadow-sm group-hover:scale-110 transition-transform`}>
                      <IconComponent className="w-4 h-4" />
                    </div>

                    {/* Log Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${actionCfg.bg} ${actionCfg.text} border ${actionCfg.border}`}>
                            {actionCfg.label}
                          </span>

                          {log.quote?.number && !quoteNumber && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-lg">
                              <Hash className="w-3 h-3" /> Cotización {log.quote.number}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatAuditDate(log.createdAt)}
                        </div>
                      </div>

                      <p className="text-sm font-medium text-slate-800 my-1.5 leading-relaxed">
                        {log.description}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2 text-xs">
                        <div className="flex items-center gap-2 text-slate-600">
                          <div className="w-5 h-5 rounded-full bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center">
                            {initialName}
                          </div>
                          <span className="font-semibold text-slate-700">
                            {log.userName || log.userEmail || 'Usuario del Sistema'}
                          </span>
                          {log.userEmail && log.userName && (
                            <span className="text-slate-400">({log.userEmail})</span>
                          )}
                        </div>

                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <button
                            onClick={() => toggleExpand(log.id)}
                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
                          >
                            {isExpanded ? 'Ocultar detalles' : 'Ver detalles'}
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>

                      {/* Metadata / Details Panel */}
                      {isExpanded && log.metadata && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 animate-fade-in">
                          {log.metadata.estadoAnterior && (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-600">Transición de Estado:</span>
                              <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                                {log.metadata.estadoAnterior}
                              </span>
                              <span>➔</span>
                              <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold">
                                {log.metadata.estadoNuevo}
                              </span>
                            </div>
                          )}

                          {log.metadata.totalAnterior !== undefined && log.metadata.totalNuevo !== undefined && (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-600">Cambio en Total:</span>
                              <span className="text-slate-500 line-through">S/ {log.metadata.totalAnterior.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                              <span>➔</span>
                              <span className="font-bold text-emerald-600">S/ {log.metadata.totalNuevo.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                            </div>
                          )}

                          <pre className="p-2 bg-slate-900 text-slate-200 rounded-lg text-[11px] overflow-x-auto font-mono">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { X, ShieldCheck, Clock, User, Layers, Lock, PenTool, Edit3, Download, Sparkles, FileText } from 'lucide-react';
import { API_URL } from '../../config';
import { fetchWithAuth } from '../../auth';
import type { ContractAuditLog } from '../../types';

interface ContractAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId?: string;
  contractNumber?: string;
  contractTitle?: string;
  version?: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getActionBadge(action: string) {
  switch (action) {
    case 'CREACION':
      return {
        label: 'Creación',
        cls: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <Sparkles className="w-3.5 h-3.5 text-blue-600" />,
      };
    case 'EDICION_TEXTO':
      return {
        label: 'Edición',
        cls: 'bg-amber-100 text-amber-800 border-amber-200',
        icon: <Edit3 className="w-3.5 h-3.5 text-amber-600" />,
      };
    case 'NUEVA_VERSION':
      return {
        label: 'Nueva Versión',
        cls: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: <Layers className="w-3.5 h-3.5 text-emerald-600" />,
      };
    case 'FIRMA':
      return {
        label: 'Firma Digital',
        cls: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: <PenTool className="w-3.5 h-3.5 text-purple-600" />,
      };
    case 'BLOQUEO_EMISION':
      return {
        label: 'Emitido / Bloqueado',
        cls: 'bg-slate-900 text-white border-slate-700',
        icon: <Lock className="w-3.5 h-3.5 text-slate-300" />,
      };
    case 'DESCARGA_PDF':
      return {
        label: 'PDF Visto',
        cls: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        icon: <Download className="w-3.5 h-3.5 text-indigo-600" />,
      };
    default:
      return {
        label: action,
        cls: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: <FileText className="w-3.5 h-3.5 text-slate-500" />,
      };
  }
}

export function ContractAuditModal({
  isOpen,
  onClose,
  contractId,
  contractNumber,
  contractTitle,
  version,
}: ContractAuditModalProps) {
  const [logs, setLogs] = useState<ContractAuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && contractId) {
      setLoading(true);
      fetchWithAuth(`${API_URL}/contracts/${contractId}/audit`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setLogs(data);
          else setLogs([]);
        })
        .catch(() => setLogs([]))
        .finally(() => setLoading(false));
    }
  }, [isOpen, contractId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <div>
              <h3 className="font-bold text-base text-white">Historial de Auditoría de Contrato</h3>
              <p className="text-xs text-slate-400">
                {contractNumber ? `N° ${contractNumber}` : ''} {version ? `(Versión v${version})` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contract Summary Bar */}
        {contractTitle && (
          <div className="px-6 py-2.5 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between text-xs shrink-0">
            <span className="font-semibold text-slate-700 truncate max-w-md">{contractTitle}</span>
            <span className="px-2 py-0.5 bg-indigo-200 text-indigo-800 rounded font-mono font-bold">
              v{version || '1.0'}
            </span>
          </div>
        )}

        {/* Timeline Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm font-medium">
              Cargando historial de auditoría...
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No hay registros de auditoría para este contrato.
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {logs.map((log) => {
                const badge = getActionBadge(log.action);
                return (
                  <div key={log.id} className="relative group">
                    {/* Node Dot */}
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-slate-400 group-hover:border-indigo-600 flex items-center justify-center transition-colors">
                      <div className="w-2 h-2 rounded-full bg-indigo-600" />
                    </div>

                    {/* Card Content */}
                    <div className="bg-slate-50 hover:bg-indigo-50/40 p-4 rounded-2xl border border-slate-200 transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${badge.cls}`}
                          >
                            {badge.icon}
                            {badge.label}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[11px] font-mono font-bold">
                            v{log.version || '1.0'}
                          </span>
                        </div>

                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(log.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                        {log.description}
                      </p>

                      {(log.userName || log.userEmail) && (
                        <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-xs text-slate-500">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            Realizado por:{' '}
                            <strong className="text-slate-700">{log.userName || log.userEmail}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
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

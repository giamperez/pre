import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { fetchWithAuth } from '../auth';
import type { ContractDocument, Company } from '../types';
import { ScrollText, ExternalLink, Pencil, Search, X, Filter, Lock, FileCheck, Hash, Trash2, Shield, Layers } from 'lucide-react';
import { ContractAuditModal } from '../components/contracts/ContractAuditModal';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function currency(n: number) {
  return n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ContractActionsModal({
  isOpen,
  onClose,
  contract,
  onOpenAudit,
  onCreateNewVersion,
  onDelete,
}: {
  isOpen: boolean;
  onClose: () => void;
  contract?: ContractDocument | null;
  onOpenAudit: () => void;
  onCreateNewVersion: () => void;
  onDelete: () => void;
}) {
  if (!isOpen || !contract) return null;
  const nextVer = parseInt(contract.version?.split('.')[0] || '1', 10) + 1;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-700">
                {contract.number}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-800 text-white">
                v{contract.version || '1.0'}
              </span>
            </div>
            <h3 className="font-bold text-slate-800 text-base mt-1 truncate max-w-xs">{contract.title}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => { onClose(); onOpenAudit(); }}
            className="w-full flex items-center gap-3 p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-2xl font-bold text-sm transition-colors border border-indigo-200"
          >
            <Shield className="w-5 h-5 text-indigo-600" />
            <span>Historial de Auditoría</span>
          </button>

          <Link
            to={`/contratos/editar/${contract.id}`}
            onClick={onClose}
            className="w-full flex items-center gap-3 p-3 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-2xl font-bold text-sm transition-colors border border-amber-200"
          >
            <Pencil className="w-5 h-5 text-amber-600" />
            <span>{contract.isLocked ? 'Ver Documento' : 'Editar Borrador'}</span>
          </Link>

          {contract.isLocked && (
            <button
              onClick={() => { onClose(); onCreateNewVersion(); }}
              className="w-full flex items-center gap-3 p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-2xl font-bold text-sm transition-colors border border-emerald-200"
            >
              <Layers className="w-5 h-5 text-emerald-600" />
              <span>Habilitar Versión v{nextVer}.0</span>
            </button>
          )}

          <a
            href={`${API_URL}/contracts/${contract.id}/pdf`}
            target="_blank"
            rel="noreferrer"
            onClick={onClose}
            className="w-full flex items-center gap-3 p-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-sm transition-colors border border-slate-200"
          >
            <ExternalLink className="w-5 h-5 text-slate-600" />
            <span>Ver / Descargar PDF</span>
          </a>

          <button
            onClick={() => { onClose(); onDelete(); }}
            className="w-full flex items-center gap-3 p-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-2xl font-bold text-sm transition-colors border border-red-200"
          >
            <Trash2 className="w-5 h-5 text-red-600" />
            <span>Eliminar Documento</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-100 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-200 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export function ContractsListPage() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<ContractDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [selectedAuditContract, setSelectedAuditContract] = useState<ContractDocument | null>(null);

  const [actionsModalOpen, setActionsModalOpen] = useState(false);
  const [selectedActionsContract, setSelectedActionsContract] = useState<ContractDocument | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/catalog`)
      .then(res => res.json())
      .then(setCompanies)
      .catch(() => {});
  }, []);

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (companyId) params.set('companyId', companyId);
    if (typeFilter) params.set('type', typeFilter);
    if (statusFilter) params.set('status', statusFilter);
    if (search) params.set('search', search);
    const q = params.toString();
    return `${API_URL}/contracts${q ? '?' + q : ''}`;
  }, [companyId, typeFilter, statusFilter, search]);

  const loadContracts = useCallback(() => {
    setLoading(true);
    fetchWithAuth(buildUrl())
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setContracts(data);
          setError(null);
        } else {
          setContracts([]);
          setError(data.message || 'Error al cargar contratos');
        }
      })
      .catch(() => {
        setContracts([]);
        setError('Error de conexión al cargar contratos');
      })
      .finally(() => setLoading(false));
  }, [buildUrl]);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const handleCreateNewVersion = async (contract: ContractDocument) => {
    if (!window.confirm(`¿Deseas generar la Versión v${parseInt(contract.version?.split('.')[0] || '1', 10) + 1}.0 de este documento para realizar adendas y modificaciones?`)) return;

    try {
      const res = await fetchWithAuth(`${API_URL}/contracts/${contract.id}/new-version`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('No se pudo generar la nueva versión');
      const updated = await res.json();
      navigate(`/contratos/editar/${updated.id}`);
    } catch (e: any) {
      alert(e.message || 'Error al generar nueva versión');
    }
  };

  const handleDelete = async (id: string, number: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar el documento N° ${number}? Esta acción no se puede deshacer.`)) return;

    try {
      const res = await fetchWithAuth(`${API_URL}/contracts/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        loadContracts();
      } else {
        alert('Error al eliminar documento');
      }
    } catch {
      alert('Error de red al eliminar documento');
    }
  };

  return (
    <div className="p-3 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-slate-800 flex items-center gap-2.5">
            <ScrollText className="w-7 h-7 text-indigo-600 shrink-0" />
            Contratos y Conformidades
          </h1>
          <p className="text-slate-500 font-medium text-xs sm:text-sm mt-1">
            Gestiona, edita y firma digitalmente contratos y actas emitidas desde cotizaciones.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2.5">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por N° contrato, cliente o solicitante..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => { setSearchInput(''); setSearch(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={companyId}
              onChange={e => setCompanyId(e.target.value)}
              className="flex-1 sm:flex-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 outline-none"
            >
              <option value="">Todas las empresas</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="flex-1 sm:flex-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 outline-none"
            >
              <option value="">Todos los tipos</option>
              <option value="contrato">Contrato de Servicio</option>
              <option value="conformidad">Acta de Conformidad</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="flex-1 sm:flex-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 outline-none"
            >
              <option value="">Todos los estados</option>
              <option value="borrador">Borrador</option>
              <option value="emitido">Emitido</option>
              <option value="firmado">Firmado</option>
            </select>

            <button
              type="submit"
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-colors flex items-center gap-1"
            >
              <Filter className="w-3.5 h-3.5" /> Filtrar
            </button>
          </div>
        </form>
      </div>

      {/* Content Table */}
      {loading && (
        <div className="py-16 text-center text-slate-400 font-medium text-sm">
          Cargando documentos de contratos...
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-xs font-semibold">
          {error}
        </div>
      )}

      {!loading && !error && contracts.length === 0 && (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-sm">
          <ScrollText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium text-base">No hay contratos ni actas registradas.</p>
          <p className="text-slate-400 text-xs mt-1">Genera un contrato desde cualquier cotización en el sistema.</p>
        </div>
      )}

      {!loading && !error && contracts.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-sm">
          <table className="w-full min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">N° Documento</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Tipo</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Empresa</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Cliente</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Estado</th>
                <th className="text-right text-xs font-semibold text-slate-500 px-4 py-3">Total</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Fecha</th>
                <th className="text-center text-xs font-semibold text-slate-500 px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c: any, idx) => {
                const clientData = typeof c.clientData === 'object' ? c.clientData : {};
                const isConformity = c.type === 'conformidad';
                return (
                  <tr key={c.id} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                          <Hash className="w-3 h-3" /> {c.number}
                        </span>
                        <span className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded text-[10px] font-mono font-bold">
                          v{c.version || '1.0'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isConformity ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <FileCheck className="w-3 h-3" /> Conformidad
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <ScrollText className="w-3 h-3" /> Contrato
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 font-medium">
                      {c.company?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 font-medium">{clientData.empresa || '—'}</td>
                    <td className="px-4 py-3">
                      {c.isLocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <Lock className="w-3 h-3 text-emerald-600" /> Inmutable
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Borrador
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold text-slate-800">S/ {currency(c.totalAmount)}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-3 text-center">
                      {/* Desktop Buttons */}
                      <div className="hidden lg:flex items-center justify-center gap-1">
                        <button
                          onClick={() => { setSelectedAuditContract(c); setAuditModalOpen(true); }}
                          title="Ver historial de auditoría y versiones del contrato"
                          className="inline-flex items-center gap-1 text-xs text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 font-medium border border-indigo-200 px-2 py-1 rounded-lg transition-all"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          Auditoría
                        </button>

                        <Link
                          to={`/contratos/editar/${c.id}`}
                          className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 font-medium border border-amber-200 px-2 py-1 rounded-lg transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          {c.isLocked ? 'Ver' : 'Editar'}
                        </Link>

                        {c.isLocked && (
                          <button
                            onClick={() => handleCreateNewVersion(c)}
                            title="Crear una nueva versión (v2.0, v3.0...) para realizar adendas"
                            className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 font-medium border border-emerald-200 px-2 py-1 rounded-lg transition-all"
                          >
                            <Layers className="w-3.5 h-3.5 text-emerald-600" />
                            Nueva v{parseInt(c.version?.split('.')[0] || '1', 10) + 1}.0
                          </button>
                        )}

                        <a
                          href={`${API_URL}/contracts/${c.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-slate-700 hover:text-slate-900 font-medium border border-slate-200 hover:border-slate-400 px-2 py-1 rounded-lg transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          PDF
                        </a>

                        <button
                          onClick={() => handleDelete(c.id, c.number)}
                          title="Eliminar documento"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Mobile Trigger Button */}
                      <button
                        onClick={() => { setSelectedActionsContract(c); setActionsModalOpen(true); }}
                        className="lg:hidden inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-slate-800 transition-colors"
                      >
                        <span>Acciones ▾</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile Actions Drawer Modal */}
      <ContractActionsModal
        isOpen={actionsModalOpen}
        onClose={() => setActionsModalOpen(false)}
        contract={selectedActionsContract}
        onOpenAudit={() => { setSelectedAuditContract(selectedActionsContract); setAuditModalOpen(true); }}
        onCreateNewVersion={() => selectedActionsContract && handleCreateNewVersion(selectedActionsContract)}
        onDelete={() => selectedActionsContract && handleDelete(selectedActionsContract.id, selectedActionsContract.number)}
      />

      {/* Contract Audit Modal */}
      <ContractAuditModal
        isOpen={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
        contractId={selectedAuditContract?.id}
        contractNumber={selectedAuditContract?.number}
        contractTitle={selectedAuditContract?.title}
        version={selectedAuditContract?.version}
      />
    </div>
  );
}

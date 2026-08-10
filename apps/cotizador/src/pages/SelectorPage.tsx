import { Link } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../config';
import type { Company } from '../types';
import { getUser, fetchWithAuth } from '../auth';
import { ArrowRight, FileText, Plus, Pencil, Archive, ArchiveRestore, ChevronDown } from 'lucide-react';
import { CreateCompanyModal } from '../components/company/CreateCompanyModal';
import { EditCompanyModal } from '../components/company/EditCompanyModal';

export function SelectorPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const isAdmin = getUser()?.role === 'admin';

  const loadCompanies = useCallback(() => {
    setLoading(true);
    const request = isAdmin ? fetchWithAuth(`${API_URL}/companies`) : fetch(`${API_URL}/catalog`);
    request
      .then(res => res.json())
      .then(data => { setCompanies(data); setLoading(false); })
      .catch(() => { setError('No se pudieron cargar las empresas'); setLoading(false); });
  }, [isAdmin]);

  useEffect(() => { loadCompanies(); }, [loadCompanies]);

  const upsertCompany = (updated: Company) => {
    setCompanies(prev => {
      const exists = prev.some(c => c.id === updated.id);
      const next = exists ? prev.map(c => c.id === updated.id ? updated : c) : [...prev, updated];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
  };

  const toggleActive = async (company: Company) => {
    setTogglingId(company.id);
    try {
      const res = await fetchWithAuth(`${API_URL}/companies/${company.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !company.isActive }),
      });
      if (res.ok) upsertCompany(await res.json());
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  );

  if (error) return (
    <div className="text-center py-16 text-red-500">{error}</div>
  );

  const activeCompanies = companies.filter(c => c.isActive !== false);
  const archivedCompanies = companies.filter(c => c.isActive === false);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Selecciona la empresa</h1>
          <p className="text-slate-500 mt-1">¿Para qué empresa deseas crear una nueva cotización?</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> Agregar empresa
          </button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {activeCompanies.map(company => (
          <div key={company.id} className="relative group">
            <Link
              to={`/empresa/${company.slug}`}
              className="block bg-white border-2 border-slate-200 hover:border-indigo-400 rounded-2xl p-6 flex items-center gap-4 transition-all hover:shadow-md"
            >
              {company.logoUrl ? (
                <img src={`${API_URL}/public${company.logoUrl}`} alt={company.name} className="h-14 w-24 object-contain shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shrink-0" style={{ backgroundColor: company.colorPrimary }}>
                  {company.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 truncate">{company.name}</p>
                <p className="text-sm text-slate-400 mt-0.5">Cotizaciones y plantillas</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 transition-colors shrink-0" />
            </Link>
            {isAdmin && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={e => { e.preventDefault(); e.stopPropagation(); setEditCompany(company); }}
                  className="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 rounded-lg shadow-sm transition-colors"
                  title="Editar"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={e => { e.preventDefault(); e.stopPropagation(); toggleActive(company); }}
                  disabled={togglingId === company.id}
                  className="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-300 rounded-lg shadow-sm transition-colors disabled:opacity-30"
                  title="Archivar"
                >
                  <Archive className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {isAdmin && archivedCompanies.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-200">
          <button
            onClick={() => setShowArchived(v => !v)}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${showArchived ? 'rotate-180' : ''}`} />
            Empresas archivadas ({archivedCompanies.length})
          </button>
          {showArchived && (
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              {archivedCompanies.map(company => (
                <div key={company.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex items-center gap-4 opacity-75">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shrink-0" style={{ backgroundColor: company.colorPrimary || '#94a3b8' }}>
                    {company.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-600 truncate">{company.name}</p>
                    <p className="text-sm text-slate-400 mt-0.5">Archivada</p>
                  </div>
                  <button
                    onClick={() => toggleActive(company)}
                    disabled={togglingId === company.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-green-600 hover:border-green-300 rounded-lg text-xs font-medium shadow-sm transition-colors disabled:opacity-30 shrink-0"
                    title="Desarchivar"
                  >
                    <ArchiveRestore className="w-3.5 h-3.5" /> Desarchivar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-8 pt-8 border-t border-slate-200">
        <Link
          to="/lista"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium transition-colors"
        >
          <FileText className="w-4 h-4" />
          Ver cotizaciones guardadas
        </Link>
      </div>

      {showCreateModal && (
        <CreateCompanyModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(company) => { upsertCompany(company); setEditCompany(company); }}
        />
      )}
      {editCompany && (
        <EditCompanyModal
          company={editCompany}
          onClose={() => setEditCompany(null)}
          onUpdated={upsertCompany}
        />
      )}
    </div>
  );
}

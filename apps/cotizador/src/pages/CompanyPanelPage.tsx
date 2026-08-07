import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { API_URL } from '../config';
import type { Company } from '../types';
import { fetchWithAuth, getUser } from '../auth';
import { TemplateListPage } from './TemplateListPage';
import { ArrowRight, FileText, LayoutTemplate, ChevronRight } from 'lucide-react';

export function CompanyPanelPage() {
  const { companySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = getUser()?.role === 'admin';

  const activeTab = searchParams.get('tab') === 'plantillas' ? 'plantillas' : 'cotizacion';
  const setTab = (tab: 'cotizacion' | 'plantillas') => {
    setSearchParams(tab === 'plantillas' ? { tab: 'plantillas' } : {});
  };

  useEffect(() => {
    if (!companySlug) return;
    setLoading(true);
    const request = isAdmin ? fetchWithAuth(`${API_URL}/companies`) : fetch(`${API_URL}/catalog`);
    request
      .then(res => res.json())
      .then((data: Company[]) => {
        setCompany(data.find(c => c.slug === companySlug) || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [companySlug, isAdmin]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  );

  if (!company) return (
    <div className="text-center py-16 text-slate-500">
      Empresa no encontrada. <Link to="/" className="text-indigo-600 hover:underline">Volver a Inicio</Link>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-16">
      <div className="flex items-center gap-2 text-slate-400 text-xs mb-3">
        <Link to="/" className="hover:text-slate-600">Inicio</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-600 font-medium">{company.name}</span>
      </div>

      <div className="flex items-center gap-4 mb-6">
        {company.logoUrl ? (
          <img src={`${API_URL}/public${company.logoUrl}`} alt={company.name} className="h-12 w-20 object-contain shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0" style={{ backgroundColor: company.colorPrimary }}>
            {company.name.charAt(0)}
          </div>
        )}
        <h1 className="text-2xl font-bold text-slate-800">{company.name}</h1>
      </div>

      <div className="flex bg-slate-200/70 p-1 rounded-xl w-fit mb-6">
        <button
          onClick={() => setTab('cotizacion')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'cotizacion' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          Cotizaciones
        </button>
        <button
          onClick={() => setTab('plantillas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'plantillas' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <LayoutTemplate className="w-4 h-4" />
          Plantillas
        </button>
      </div>

      {activeTab === 'cotizacion' ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">Crea una cotización para {company.name}</h3>
          <p className="text-slate-500 text-sm mb-6">Empieza desde cero o usa una de sus plantillas guardadas.</p>
          <Link
            to={`/nueva/${company.slug}`}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md"
          >
            Nueva cotización <ArrowRight className="w-4 h-4" />
          </Link>
          <div className="mt-6">
            <Link to="/lista" className="text-xs text-slate-500 hover:text-indigo-600 hover:underline">
              Ver cotizaciones guardadas
            </Link>
          </div>
        </div>
      ) : (
        <TemplateListPage companySlug={company.slug} />
      )}
    </div>
  );
}

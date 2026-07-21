import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import type { Company } from '../types';
import { ArrowRight, FileText } from 'lucide-react';

export function SelectorPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/catalog`)
      .then(res => res.json())
      .then(data => { setCompanies(data); setLoading(false); })
      .catch(() => { setError('No se pudieron cargar las empresas'); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  );

  if (error) return (
    <div className="text-center py-16 text-red-500">{error}</div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Selecciona la empresa</h1>
        <p className="text-slate-500 mt-1">¿Para qué empresa deseas crear una nueva cotización?</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {companies.map(company => (
          <Link
            key={company.id}
            to={`/nueva/${company.slug}`}
            className="group bg-white border-2 border-slate-200 hover:border-indigo-400 rounded-2xl p-6 flex items-center gap-4 transition-all hover:shadow-md"
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
              <p className="text-sm text-slate-400 mt-0.5">Nueva cotización</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 transition-colors shrink-0" />
          </Link>
        ))}
      </div>

      <div className="mt-8 pt-8 border-t border-slate-200">
        <Link
          to="/lista"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium transition-colors"
        >
          <FileText className="w-4 h-4" />
          Ver cotizaciones guardadas
        </Link>
      </div>
    </div>
  );
}

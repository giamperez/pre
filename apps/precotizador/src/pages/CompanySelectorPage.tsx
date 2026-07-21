import { Link } from 'react-router-dom';
import { useCatalog } from '../hooks/useCatalog';
import { API_URL } from '../config';

export function CompanySelectorPage() {
  const { companies, loading, error } = useCatalog();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="text-xl font-medium text-slate-500">Cargando empresas...</p></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="text-xl font-medium text-red-500">{error}</p></div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-800 mb-4">Selecciona tu Empresa</h1>
          <p className="text-slate-500">Elige con qué empresa deseas cotizar servicios.</p>
        </div>
        
        <div className="grid sm:grid-cols-2 gap-6">
          {companies.map(company => (
            <Link 
              key={company.id} 
              to={`/catalog/${company.slug}`}
              className="bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-slate-400 hover:shadow-md transition-all group flex flex-col items-center text-center"
              style={{ '--hover-color': company.colorPrimary } as React.CSSProperties}
            >
              {company.logoUrl ? (
                <img src={`${API_URL}/public${company.logoUrl}`} alt={company.name} className="h-20 object-contain mb-4" />
              ) : (
                <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl mb-4" style={{ backgroundColor: company.colorPrimary }}>
                  {company.name.charAt(0)}
                </div>
              )}
              <h2 className="text-xl font-bold text-slate-800 mb-2">{company.name}</h2>
              <p className="text-sm text-slate-500">Haz clic para ver el catálogo y cotizar</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

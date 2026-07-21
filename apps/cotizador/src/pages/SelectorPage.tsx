import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  slug: string;
}

export function SelectorPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Mock fetch GET /catalog
    setCompanies([
      { id: '1', name: 'Agencia Digital Pro', slug: 'agencia-digital-pro' },
      { id: '2', name: 'Consultora Tech', slug: 'consultora-tech' }
    ]);
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-black text-slate-800 mb-4">Selecciona tu Empresa</h1>
        <p className="text-slate-500">Elige con qué perfil quieres generar tu cotización hoy.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {companies.map(company => (
          <div 
            key={company.id}
            onClick={() => navigate('/cotizaciones/nueva', { state: { company } })}
            className="group cursor-pointer bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-500 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">{company.name}</h2>
            <p className="text-sm text-slate-500 mb-4">Slug: {company.slug}</p>
            <div className="flex items-center text-indigo-600 font-semibold text-sm group-hover:gap-2 transition-all">
              Generar cotización <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

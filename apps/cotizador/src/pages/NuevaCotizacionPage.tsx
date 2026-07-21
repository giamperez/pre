import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function NuevaCotizacionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const company = location.state?.company;

  if (!company) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-4">No has seleccionado una empresa.</p>
        <button onClick={() => navigate('/')} className="text-indigo-600 font-bold hover:underline">
          Volver al selector
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 min-h-[600px] flex flex-col">
      <div className="p-6 border-b border-slate-100 flex items-center gap-4">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Nueva Cotización</h1>
          <p className="text-sm text-slate-500">Empresa: {company.name}</p>
        </div>
      </div>
      
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl mx-auto mb-4 flex items-center justify-center text-slate-400">
            {/* Placeholder icon */}
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Workspace Preparado</h2>
          <p className="text-slate-500 leading-relaxed">
            Aquí irá el editor complejo de cotizaciones (plantillas, módulos adicionales, generador PDF). Para la siguiente iteración.
          </p>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';
import type { Quote } from '../types';
import { ArrowLeft, ExternalLink, Plus } from 'lucide-react';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function currency(n: number) {
  return n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function QuoteListPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/quotes`)
      .then(res => res.json())
      .then(data => { setQuotes(data); setLoading(false); })
      .catch(() => { setError('No se pudieron cargar las cotizaciones'); setLoading(false); });
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Cotizaciones guardadas</h1>
            <p className="text-sm text-slate-400">{quotes.length} cotización{quotes.length !== 1 ? 'es' : ''} en total</p>
          </div>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva cotización
        </Link>
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
          <p className="text-slate-400 text-base">No hay cotizaciones guardadas aún.</p>
          <Link to="/" className="mt-4 inline-flex items-center gap-2 text-indigo-600 font-medium hover:underline">
            <Plus className="w-4 h-4" /> Crear la primera cotización
          </Link>
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
                <th className="text-right text-xs font-semibold text-slate-500 px-4 py-3">Total</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">Fecha</th>
                <th className="text-center text-xs font-semibold text-slate-500 px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q, idx) => {
                const clientData = typeof q.clientData === 'object' ? q.clientData as any : {};
                const projectData = typeof q.projectData === 'object' ? q.projectData as any : {};
                return (
                  <tr key={q.id} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
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
                    <td className="px-4 py-3 text-sm text-slate-500 max-w-[200px] truncate">{projectData.nombre || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold text-slate-800">S/ {currency(q.total)}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{formatDate(q.createdAt)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => alert(`ID de cotización: ${q.id}\nNúmero: ${q.number}`)}
                        className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium border border-indigo-200 hover:border-indigo-400 px-2.5 py-1.5 rounded-lg transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Ver
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

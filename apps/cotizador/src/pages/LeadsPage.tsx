import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import type { Lead, Company } from '../types';
import { Search, X, ChevronRight, FileText, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../auth';

export function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [leadsRes, catalogRes] = await Promise.all([
        fetchWithAuth(`${API_URL}/leads`),
        fetch(`${API_URL}/catalog`)
      ]);
      const leadsData = await leadsRes.json();
      const catalogData = await catalogRes.json();
      setLeads(leadsData);
      setCompanies(catalogData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = (lead.name || '').toLowerCase().includes(search.toLowerCase()) || 
                          (lead.businessName || '').toLowerCase().includes(search.toLowerCase());
    const matchesCompany = companyFilter ? lead.companyId === companyFilter : true;
    const matchesStatus = statusFilter ? lead.classification === statusFilter : true;
    return matchesSearch && matchesCompany && matchesStatus;
  });

  const updateClassification = async (id: string, classification: string) => {
    try {
      await fetchWithAuth(`${API_URL}/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classification })
      });
      setLeads(leads.map(l => l.id === id ? { ...l, classification: classification as any } : l));
      if (selectedLead?.id === id) {
        setSelectedLead({ ...selectedLead, classification: classification as any });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const saveNotes = async () => {
    if (!selectedLead) return;
    setSavingNotes(true);
    try {
      await fetchWithAuth(`${API_URL}/leads/${selectedLead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
      setLeads(leads.map(l => l.id === selectedLead.id ? { ...l, notes } : l));
      setSelectedLead({ ...selectedLead, notes });
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNotes(false);
    }
  };

  const createQuote = () => {
    if (!selectedLead || !selectedLead.company) return;
    
    // Parse answers to create quote items
    const answers = selectedLead.answers || {};
    const items = (answers.serviciosPrincipales || []).map((s: any) => ({
      detalle: s.name,
      cantidad: 1,
      precioUnitario: s.price,
      total: s.price
    }));
    
    const additionalItems = (answers.addons || []).map((s: any) => ({
      detalle: s.name,
      cantidad: 1,
      precioUnitario: s.price,
      total: s.price
    }));

    navigate(`/nueva/${selectedLead.company.slug}`, {
      state: {
        leadData: {
          empresa: selectedLead.businessName,
          solicitante: selectedLead.name,
          telefono: selectedLead.phone,
          correo: selectedLead.email,
          proyecto: 'Proyecto web',
          items,
          additionalItems
        }
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'calificado': return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Calificado</span>;
      case 'no_calificado': return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">No calificado</span>;
      default: return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Pendiente</span>;
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const formatCurrency = (val: number) => `S/ ${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Leads ({filteredLeads.length})</h1>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o empresa..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
        </div>
        <select 
          value={companyFilter}
          onChange={e => setCompanyFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Todas las empresas</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select 
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="calificado">Calificado</option>
          <option value="no_calificado">No calificado</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Cargando leads...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <tr>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Empresa (Catálogo)</th>
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Negocio</th>
                  <th className="px-6 py-4">Teléfono</th>
                  <th className="px-6 py-4">Origen</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-500">{formatDate(lead.createdAt)}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: lead.company?.colorPrimary }} />
                        {lead.company?.name || '---'}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">{lead.name}</td>
                    <td className="px-6 py-4 text-slate-600">{lead.businessName || '-'}</td>
                    <td className="px-6 py-4 text-slate-600">{lead.phone || '-'}</td>
                    <td className="px-6 py-4 text-slate-500 capitalize">{lead.source?.replace('_', ' ') || '-'}</td>
                    <td className="px-6 py-4">{getStatusBadge(lead.classification)}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => { setSelectedLead(lead); setNotes(lead.notes || ''); }}
                        className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                      >
                        Ver detalle <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-500">No se encontraron leads.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal / Panel lateral */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-8">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Detalle del Lead</h2>
              <button onClick={() => setSelectedLead(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <section className="space-y-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                  Datos de Contacto
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-slate-500 mb-1">Nombre</span>
                    <span className="font-medium text-slate-800">{selectedLead.name}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 mb-1">Empresa / Negocio</span>
                    <span className="font-medium text-slate-800">{selectedLead.businessName || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 mb-1">Teléfono</span>
                    <span className="font-medium text-slate-800">{selectedLead.phone || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 mb-1">Correo</span>
                    <span className="font-medium text-slate-800">{selectedLead.email || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 mb-1">Fecha de registro</span>
                    <span className="font-medium text-slate-800">{formatDate(selectedLead.createdAt)}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 mb-1">Origen</span>
                    <span className="font-medium text-slate-800 capitalize">{selectedLead.source?.replace('_', ' ') || '-'}</span>
                  </div>
                </div>
              </section>

              {selectedLead.answers && (
                <section className="space-y-4">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                    Cotización Estimada (Precotizador)
                  </h3>
                  
                  {selectedLead.answers.serviciosPrincipales?.length > 0 && (
                    <div className="mb-4">
                      <span className="block text-sm font-medium text-slate-700 mb-2">Servicios principales:</span>
                      <ul className="space-y-2">
                        {selectedLead.answers.serviciosPrincipales.map((s: any, i: number) => (
                          <li key={i} className="flex justify-between text-sm bg-slate-50 p-2 rounded border border-slate-100">
                            <span className="text-slate-700">{s.name}</span>
                            <span className="font-medium text-slate-900">{formatCurrency(s.price)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedLead.answers.addons?.length > 0 && (
                    <div className="mb-4">
                      <span className="block text-sm font-medium text-slate-700 mb-2">Adicionales:</span>
                      <ul className="space-y-2">
                        {selectedLead.answers.addons.map((s: any, i: number) => (
                          <li key={i} className="flex justify-between text-sm bg-indigo-50 p-2 rounded border border-indigo-100 text-indigo-900">
                            <span>{s.name}</span>
                            <span className="font-medium">{formatCurrency(s.price)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-slate-800 text-white p-4 rounded-xl space-y-1">
                    <div className="flex justify-between text-slate-300 text-sm">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(selectedLead.answers.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-300 text-sm">
                      <span>IGV (18%):</span>
                      <span>{formatCurrency(selectedLead.answers.igv)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-slate-700 mt-2">
                      <span>Total estimado:</span>
                      <span>{formatCurrency(selectedLead.answers.total)}</span>
                    </div>
                  </div>
                </section>
              )}

              <section className="space-y-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                  Gestión Comercial
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estado de clasificación</label>
                  <select
                    value={selectedLead.classification}
                    onChange={(e) => updateClassification(selectedLead.id, e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="calificado">Calificado</option>
                    <option value="no_calificado">No calificado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notas internas</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Agrega notas sobre la reunión, requerimientos extra, etc..."
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
                  />
                  <div className="flex justify-end mt-2">
                    <button 
                      onClick={saveNotes}
                      disabled={savingNotes}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      {savingNotes ? 'Guardando...' : 'Guardar notas'}
                    </button>
                  </div>
                </div>
              </section>
            </div>
            
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-3">
              <button 
                onClick={() => setSelectedLead(null)}
                className="flex-1 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
              >
                Cerrar
              </button>
              {selectedLead.company && (
                <button 
                  onClick={createQuote}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <FileText className="w-4 h-4" />
                  Crear cotización
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';
import { API_URL } from '../config';

type Booking = {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string;
  time: string;
  status: 'pendiente' | 'confirmada' | 'cancelada';
  notes: string;
};

export function AgendaPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const companyId = localStorage.getItem('companyId') || user.companyId;

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/bookings?companyId=${companyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setBookings(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, [companyId]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`${API_URL}/bookings/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setSelectedBooking(null);
        fetchBookings();
      }
    } catch (e) {
      alert('Error updating status');
    }
  };

  // UI helpers for weekly calendar
  // Since we don't have a full calendar library, we will group by date for a simple list view.
  const groupedBookings = bookings.reduce((acc, b) => {
    if (!acc[b.date]) acc[b.date] = [];
    acc[b.date].push(b);
    return acc;
  }, {} as Record<string, Booking[]>);

  const dates = Object.keys(groupedBookings).sort();

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Agenda de Reuniones</h1>
          <p className="text-slate-500">Administra las reuniones solicitadas desde el precotizador.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Cargando agenda...</div>
        ) : dates.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No hay reuniones agendadas.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {dates.map(date => {
              const dateObj = new Date(`${date}T00:00:00`);
              return (
                <div key={date} className="p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 capitalize">
                    {dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupedBookings[date].map(b => (
                      <div 
                        key={b.id} 
                        onClick={() => setSelectedBooking(b)}
                        className={`p-4 rounded-xl border cursor-pointer hover:shadow-md transition-shadow ${
                          b.status === 'pendiente' ? 'bg-amber-50 border-amber-200' :
                          b.status === 'confirmada' ? 'bg-green-50 border-green-200' :
                          'bg-slate-50 border-slate-200 opacity-60'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-slate-800">{b.time}</span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            b.status === 'pendiente' ? 'bg-amber-100 text-amber-700' :
                            b.status === 'confirmada' ? 'bg-green-100 text-green-700' :
                            'bg-slate-200 text-slate-600'
                          }`}>
                            {b.status}
                          </span>
                        </div>
                        <p className="font-medium text-slate-800">{b.clientName}</p>
                        <p className="text-sm text-slate-500">{b.clientEmail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedBooking && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl relative">
            <button onClick={() => setSelectedBooking(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-slate-800 mb-4">Detalles de Reunión</h2>
            
            <div className="space-y-4 mb-8">
              <div>
                <p className="text-sm text-slate-500">Cliente</p>
                <p className="font-medium">{selectedBooking.clientName}</p>
                <p className="text-sm">{selectedBooking.clientEmail}</p>
                <p className="text-sm">{selectedBooking.clientPhone || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Fecha y Hora</p>
                <p className="font-medium">{selectedBooking.date} a las {selectedBooking.time}</p>
              </div>
              {selectedBooking.notes && (
                <div>
                  <p className="text-sm text-slate-500">Notas</p>
                  <p className="text-sm bg-slate-50 p-2 rounded border border-slate-100">{selectedBooking.notes}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {selectedBooking.status !== 'confirmada' && (
                <button onClick={() => updateStatus(selectedBooking.id, 'confirmada')} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" /> Confirmar
                </button>
              )}
              {selectedBooking.status !== 'cancelada' && (
                <button onClick={() => updateStatus(selectedBooking.id, 'cancelada')} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                  <XCircle className="w-5 h-5" /> Cancelar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

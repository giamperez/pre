import { useState, useEffect, useMemo } from 'react';
import { X, CheckCircle, XCircle, ChevronLeft, ChevronRight, Calendar, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';
import type { Company } from '../types';

type Booking = {
  id: string;
  leadId?: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  status: 'pendiente' | 'confirmada' | 'cancelada';
  notes: string;
};

// Helpers for date math
const getStartOfWeek = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (d: Date, days: number) => {
  const date = new Date(d);
  date.setDate(date.getDate() + days);
  return date;
};

const formatDateStr = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatHour = (h: number, m: number) => {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export function AgendaPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const initialCompanyId = localStorage.getItem('companyId') || user.companyId || '';
  
  const [companyFilter, setCompanyFilter] = useState(initialCompanyId);
  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));

  const fetchCompanies = async () => {
    try {
      const res = await fetch(`${API_URL}/catalog`);
      if (res.ok) {
        setCompanies(await res.json());
      }
    } catch (e) {
      console.error('Error fetching companies', e);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/bookings?companyId=${companyFilter}`, {
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
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (companyFilter) {
      fetchBookings();
    } else {
      setBookings([]);
    }
  }, [companyFilter]);

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

  // Generate days for the current week (Monday to Sunday)
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  // Generate time slots (08:00 to 19:00, every 30 mins)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = 8; h <= 19; h++) {
      slots.push(formatHour(h, 0));
      if (h !== 19) slots.push(formatHour(h, 30));
    }
    return slots;
  }, []);

  // Filter bookings for the current week
  const thisWeekBookings = useMemo(() => {
    const startStr = formatDateStr(weekDays[0]);
    const endStr = formatDateStr(weekDays[6]);
    return bookings.filter(b => b.date >= startStr && b.date <= endStr);
  }, [bookings, weekDays]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: thisWeekBookings.length,
      pendientes: thisWeekBookings.filter(b => b.status === 'pendiente').length,
      confirmadas: thisWeekBookings.filter(b => b.status === 'confirmada').length,
    };
  }, [thisWeekBookings]);

  // Helper to place booking in grid
  const getBookingForSlot = (date: Date, time: string) => {
    const dateStr = formatDateStr(date);
    return thisWeekBookings.find(b => b.date === dateStr && b.time === time);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col h-[calc(100vh-80px)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Agenda Semanal</h1>
          <p className="text-slate-500 font-medium">
            {stats.total} reuniones esta semana ({stats.pendientes} pendientes, {stats.confirmadas} confirmadas)
          </p>
        </div>
        
        <div className="flex gap-4 items-center">
          <select 
            value={companyFilter}
            onChange={e => setCompanyFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 shadow-sm"
          >
            <option value="">Selecciona una empresa...</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm shrink-0">
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentWeekStart(addDays(currentWeekStart, -7))}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 flex items-center gap-1 font-medium"
          >
            <ChevronLeft className="w-5 h-5" /> Anterior
          </button>
          <button 
            onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 flex items-center gap-1 font-medium"
          >
            Siguiente <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="font-bold text-slate-700 uppercase tracking-wide">
          {weekDays[0].toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        </div>
        <button 
          onClick={() => setCurrentWeekStart(getStartOfWeek(new Date()))}
          className="px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" /> Hoy
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col min-h-0">
        {/* Header Days */}
        <div className="grid grid-cols-8 border-b border-slate-200 shrink-0 bg-slate-50">
          <div className="p-3 border-r border-slate-200 text-center font-semibold text-slate-400 text-xs flex items-center justify-center">
            HORA
          </div>
          {weekDays.map(date => {
            const isToday = formatDateStr(date) === formatDateStr(new Date());
            return (
              <div key={date.toISOString()} className={`p-3 text-center border-r border-slate-200 last:border-0 ${isToday ? 'bg-indigo-50/50' : ''}`}>
                <div className="text-xs font-bold uppercase text-slate-400 mb-1">
                  {date.toLocaleDateString('es-ES', { weekday: 'short' })}
                </div>
                <div className={`text-lg font-bold ${isToday ? 'text-indigo-600' : 'text-slate-700'}`}>
                  {date.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Grid Slots */}
        <div className="flex-1 overflow-y-auto">
          {loading && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center font-bold text-slate-500">Cargando...</div>}
          <div className="grid grid-cols-8 min-w-[800px]">
            {timeSlots.map((time, rowIdx) => (
              <div key={time} className="contents group">
                <div className="p-2 border-r border-b border-slate-100 text-center text-xs font-medium text-slate-400 flex items-start justify-center pt-3 bg-white sticky left-0 z-20">
                  {time}
                </div>
                {weekDays.map((date, colIdx) => {
                  const booking = getBookingForSlot(date, time);
                  return (
                    <div 
                      key={`${colIdx}-${rowIdx}`} 
                      className={`border-r border-b border-slate-100 relative min-h-[60px] p-1 transition-colors hover:bg-slate-50`}
                    >
                      {booking && (
                        <div 
                          onClick={() => setSelectedBooking(booking)}
                          className={`absolute inset-1 p-2 rounded-lg border text-xs cursor-pointer overflow-hidden transition-transform hover:scale-[1.02] shadow-sm z-10 flex flex-col justify-between ${
                            booking.status === 'pendiente' ? 'bg-yellow-50 border-yellow-200' :
                            booking.status === 'confirmada' ? 'bg-green-100 border-green-300' :
                            'bg-slate-100 border-slate-300 opacity-60'
                          }`}
                        >
                          <div>
                            <div className={`font-bold truncate ${
                              booking.status === 'pendiente' ? 'text-yellow-800' :
                              booking.status === 'confirmada' ? 'text-green-900' :
                              'text-slate-600 line-through'
                            }`}>
                              {booking.clientName}
                            </div>
                          </div>
                          <div className={`text-[10px] uppercase font-bold tracking-wider mt-1 ${
                            booking.status === 'pendiente' ? 'text-yellow-600' :
                            booking.status === 'confirmada' ? 'text-green-700' :
                            'text-slate-500'
                          }`}>
                            {booking.status}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedBooking && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-800">Detalles de Reunión</h2>
              <button onClick={() => setSelectedBooking(null)} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-md transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-5 mb-8">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-400 mb-1 tracking-wider">Cliente</p>
                  <p className="font-semibold text-slate-800 text-lg">{selectedBooking.clientName}</p>
                  <div className="flex flex-col text-sm text-slate-600 mt-1 space-y-1">
                    <span>{selectedBooking.clientEmail}</span>
                    <span>{selectedBooking.clientPhone || 'Sin teléfono'}</span>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase text-slate-400 mb-1 tracking-wider">Fecha</p>
                    <p className="font-semibold text-slate-800">{selectedBooking.date}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase text-slate-400 mb-1 tracking-wider">Hora</p>
                    <p className="font-semibold text-slate-800">{selectedBooking.time}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase text-slate-400 mb-1 tracking-wider">Estado</p>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    selectedBooking.status === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                    selectedBooking.status === 'confirmada' ? 'bg-green-100 text-green-800' :
                    'bg-slate-200 text-slate-700'
                  }`}>
                    {selectedBooking.status}
                  </span>
                </div>

                {selectedBooking.notes && (
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400 mb-1 tracking-wider">Notas</p>
                    <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                      {selectedBooking.notes}
                    </p>
                  </div>
                )}
                
                {selectedBooking.leadId && (
                  <div className="pt-2">
                    <Link 
                      to="/leads" 
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" /> Ver en Leads
                    </Link>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                {selectedBooking.status !== 'confirmada' && (
                  <button onClick={() => updateStatus(selectedBooking.id, 'confirmada')} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-xl transition-all hover:shadow-lg flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5" /> Confirmar
                  </button>
                )}
                {selectedBooking.status !== 'cancelada' && (
                  <button onClick={() => updateStatus(selectedBooking.id, 'cancelada')} className="flex-1 bg-white border-2 border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2">
                    <XCircle className="w-5 h-5" /> Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

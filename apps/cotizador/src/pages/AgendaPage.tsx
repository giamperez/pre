import { useState, useEffect, useMemo } from 'react';
import { X, CheckCircle, XCircle, ChevronLeft, ChevronRight, Calendar, ExternalLink, Plus, Trash2, Mail, Phone, Building, Clock3, StickyNote } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';
import { fetchWithAuth } from '../auth';
import type { Company } from '../types';

type Booking = {
  id: string;
  leadId?: string;
  companyId?: string;
  company?: {
    id: string;
    name: string;
    slug: string;
    colorPrimary?: string;
  };
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  status: 'pendiente' | 'confirmada' | 'cancelada';
  notes?: string;
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
  const [newBookingModal, setNewBookingModal] = useState(false);

  // New Booking Form State
  const [formCompanyId, setFormCompanyId] = useState('');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDate, setFormDate] = useState(formatDateStr(new Date()));
  const [formTime, setFormTime] = useState('10:00');
  const [formNotes, setFormNotes] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);

  const [companyFilter, setCompanyFilter] = useState('');
  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

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
      const q = companyFilter ? `?companyId=${companyFilter}` : '';
      const res = await fetchWithAuth(`${API_URL}/bookings${q}`);
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
    fetchBookings();
  }, [companyFilter]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetchWithAuth(`${API_URL}/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setSelectedBooking(null);
        fetchBookings();
      }
    } catch (e) {
      alert('Error al actualizar estado');
    }
  };

  const deleteBooking = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta reunión de la agenda?')) return;
    try {
      const res = await fetchWithAuth(`${API_URL}/bookings/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSelectedBooking(null);
        fetchBookings();
      }
    } catch (e) {
      alert('Error al eliminar reunión');
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formDate || !formTime) {
      alert('Por favor completa los campos obligatorios');
      return;
    }

    setSubmittingBooking(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: formCompanyId || undefined,
          clientName: formName,
          clientEmail: formEmail || 'cliente@ejemplo.com',
          clientPhone: formPhone,
          date: formDate,
          time: formTime,
          notes: formNotes || 'Reunión agendada manualmente desde la Agenda',
        }),
      });

      if (!res.ok) throw new Error('Error al agendar reunión');

      setNewBookingModal(false);
      setFormName('');
      setFormEmail('');
      setFormPhone('');
      setFormNotes('');
      fetchBookings();
    } catch (err: any) {
      alert(err.message || 'No se pudo agendar la reunión');
    } finally {
      setSubmittingBooking(false);
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

  // Selected Day Bookings
  const selectedDayBookings = useMemo(() => {
    const dayStr = formatDateStr(selectedDay);
    return bookings.filter(b => b.date === dayStr);
  }, [bookings, selectedDay]);

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
    <div className="p-3 sm:p-8 max-w-[1400px] mx-auto flex flex-col min-h-[calc(100vh-100px)] space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md shadow-indigo-200">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-800">
              Agenda de Reuniones
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              {stats.total} reuniones esta semana
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-100">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              {stats.pendientes} pendientes
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {stats.confirmadas} confirmadas
            </span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
          <select 
            value={companyFilter}
            onChange={e => setCompanyFilter(e.target.value)}
            className="flex-1 md:flex-none bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs outline-none"
          >
            <option value="">Todas las empresas</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <button
            onClick={() => setNewBookingModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200 hover:shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Nueva Reunión
          </button>
        </div>
      </div>

      {/* Week Navigator */}
      <div className="flex items-center justify-between bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <button 
              onClick={() => {
                const prev = addDays(currentWeekStart, -7);
                setCurrentWeekStart(prev);
                setSelectedDay(prev);
              }}
              className="p-2 sm:px-3 sm:py-1.5 hover:bg-slate-100 rounded-xl transition-all text-slate-600 flex items-center gap-1 font-bold text-xs"
            >
              <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">Anterior</span>
            </button>
            <button 
              onClick={() => {
                const next = addDays(currentWeekStart, 7);
                setCurrentWeekStart(next);
                setSelectedDay(next);
              }}
              className="p-2 sm:px-3 sm:py-1.5 hover:bg-slate-100 rounded-xl transition-all text-slate-600 flex items-center gap-1 font-bold text-xs"
            >
              <span className="hidden sm:inline">Siguiente</span> <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button 
            onClick={() => {
              const now = new Date();
              setCurrentWeekStart(getStartOfWeek(now));
              setSelectedDay(now);
            }}
            className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-bold rounded-xl text-xs flex items-center gap-1"
          >
            <Calendar className="w-3.5 h-3.5" /> Hoy
          </button>
        </div>

        <div className="font-extrabold text-slate-800 uppercase tracking-wider text-xs sm:text-sm flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          {weekDays[0].toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* MOBILE DAY VIEW (PHONE ONLY: md:hidden) */}
      <div className="md:hidden space-y-3 flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar shrink-0">
          {weekDays.map(date => {
            const isSelected = formatDateStr(date) === formatDateStr(selectedDay);
            const isToday = formatDateStr(date) === formatDateStr(new Date());
            const dateBookingsCount = bookings.filter(b => b.date === formatDateStr(date)).length;

            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDay(date)}
                className={`flex-1 min-w-[55px] py-2 px-1.5 rounded-2xl flex flex-col items-center justify-center transition-all border ${
                  isSelected
                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white border-indigo-600 shadow-md shadow-indigo-200 scale-[1.02]'
                    : isToday
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="text-[10px] uppercase font-extrabold opacity-80">
                  {date.toLocaleDateString('es-ES', { weekday: 'short' })}
                </span>
                <span className="text-sm font-extrabold">{date.getDate()}</span>
                {dateBookingsCount > 0 && (
                  <span className={`mt-0.5 text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-white/30 text-white' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {dateBookingsCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs space-y-3 flex-1">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-800 text-sm sm:text-base capitalize flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              {selectedDay.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            <span className="text-xs text-slate-500 font-bold bg-slate-100 px-2.5 py-1 rounded-full">
              {selectedDayBookings.length} reunión{selectedDayBookings.length !== 1 ? 'es' : ''}
            </span>
          </div>

          {selectedDayBookings.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-slate-500 font-medium text-sm">Sin reuniones agendadas para este día.</p>
              <button
                onClick={() => { setFormDate(formatDateStr(selectedDay)); setNewBookingModal(true); }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Agendar para hoy
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 pt-1">
              {timeSlots.map(time => {
                const booking = getBookingForSlot(selectedDay, time);
                if (!booking) return null;

                return (
                  <div
                    key={booking.id}
                    onClick={() => setSelectedBooking(booking)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                      booking.status === 'confirmada'
                        ? 'bg-gradient-to-r from-emerald-50/70 to-teal-50/70 border-emerald-200'
                        : booking.status === 'pendiente'
                        ? 'bg-gradient-to-r from-amber-50/70 to-orange-50/70 border-amber-200'
                        : 'bg-slate-50 border-slate-200 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-white rounded-lg text-xs font-extrabold text-slate-800 shadow-xs border border-slate-200">
                          <Clock3 className="w-3 h-3 inline-block mr-1 text-indigo-600" />
                          {booking.time}
                        </span>
                        <h4 className="font-extrabold text-slate-800 text-sm">{booking.clientName}</h4>
                      </div>
                      <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full ${
                        booking.status === 'confirmada' ? 'bg-emerald-100 text-emerald-800' :
                        booking.status === 'pendiente' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {booking.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                      <span className="flex items-center gap-1 font-medium">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {booking.clientEmail}
                      </span>
                      {booking.company?.name && (
                        <span className="px-2 py-0.5 bg-white/80 rounded-md font-bold text-[10px] text-slate-700 border border-slate-200">
                          {booking.company.name}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* DESKTOP WEEKLY GRID (PC ONLY: hidden md:flex) */}
      <div className="hidden md:flex flex-col flex-1 bg-white rounded-[28px] shadow-xl shadow-slate-200/60 border border-slate-200 overflow-x-auto min-h-0">
        <div className="min-w-[850px] flex-1 flex flex-col">
          <div className="grid grid-cols-8 border-b border-slate-200 shrink-0 bg-gradient-to-b from-slate-50 to-white">
            <div className="p-4 border-r border-slate-200 text-center font-bold text-slate-400 text-[11px] flex items-center justify-center tracking-wider uppercase bg-gradient-to-r from-slate-50 to-white">
              Hora
            </div>
            {weekDays.map(date => {
              const isToday = formatDateStr(date) === formatDateStr(new Date());
              return (
                <div key={date.toISOString()} className={`p-4 text-center border-r border-slate-200 last:border-0 transition-colors ${isToday ? 'bg-gradient-to-b from-indigo-50 to-indigo-50/40' : ''}`}>
                  <div className="text-[10px] font-extrabold uppercase text-slate-400 mb-1 tracking-widest">
                    {date.toLocaleDateString('es-ES', { weekday: 'short' })}
                  </div>
                  <div className={`inline-flex items-center justify-center w-9 h-9 rounded-2xl font-extrabold text-sm transition-all ${
                    isToday 
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200 ring-4 ring-indigo-100' 
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}>
                    {date.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto relative">
            {loading && <div className="absolute inset-0 bg-white/80 backdrop-blur-md z-20 flex items-center justify-center font-bold text-slate-500 text-sm">
              <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-2xl shadow-lg border border-slate-100">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                Cargando reuniones...
              </div>
            </div>}
            <div className="grid grid-cols-8">
            {timeSlots.map((time, rowIdx) => (
              <div key={time} className="contents group">
                <div className="p-2 border-r border-b border-slate-100 text-center text-[11px] font-semibold text-slate-400 flex items-start justify-center pt-4 bg-gradient-to-r from-white to-slate-50/50 sticky left-0 z-10">
                  {time}
                </div>
                {weekDays.map((date, colIdx) => {
                  const booking = getBookingForSlot(date, time);
                  const isToday = formatDateStr(date) === formatDateStr(new Date());
                  return (
                    <div 
                      key={`${colIdx}-${rowIdx}`} 
                      className={`border-r border-b relative min-h-[60px] p-1 transition-colors ${
                        isToday ? 'bg-indigo-50/20 hover:bg-indigo-50/40' : 'border-slate-100 hover:bg-slate-50/70'
                      } ${isToday ? 'border-indigo-100' : 'border-slate-100'}`}
                    >
                      {booking && (
                        <div 
                          onClick={() => setSelectedBooking(booking)}
                          className={`absolute inset-1.5 p-2.5 rounded-2xl text-xs cursor-pointer overflow-hidden transition-all duration-200 hover:scale-[1.03] hover:shadow-lg z-10 flex flex-col justify-between group ${
                            booking.status === 'pendiente' 
                              ? 'bg-gradient-to-br from-amber-50 to-orange-50 text-amber-900 shadow-md shadow-amber-100 ring-1 ring-amber-200/60 hover:shadow-amber-200' :
                            booking.status === 'confirmada' 
                              ? 'bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-900 shadow-md shadow-emerald-100 ring-1 ring-emerald-200/60 hover:shadow-emerald-200' :
                              'bg-gradient-to-br from-slate-100 to-slate-50 opacity-70 text-slate-600 ring-1 ring-slate-200'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <div className={`w-2 h-2 rounded-full shrink-0 mt-1 ${
                                booking.status === 'pendiente' ? 'bg-amber-500' :
                                booking.status === 'confirmada' ? 'bg-emerald-500' :
                                'bg-slate-400'
                              }`}></div>
                              <p className="font-extrabold truncate text-[11px] leading-tight flex-1">
                                {booking.clientName}
                              </p>
                            </div>
                            {booking.company?.name && (
                              <div className="text-[10px] opacity-75 truncate font-semibold flex items-center gap-1">
                                <Building className="w-2.5 h-2.5 shrink-0 opacity-60" />
                                {booking.company.name}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-1.5 gap-1">
                            <span className={`inline-flex items-center gap-1 font-black text-[10px] px-2 py-0.5 rounded-lg ${
                              booking.status === 'pendiente' ? 'bg-amber-200/70 text-amber-800' :
                              booking.status === 'confirmada' ? 'bg-emerald-200/70 text-emerald-800' :
                              'bg-slate-200 text-slate-600'
                            }`}>
                              <Clock3 className="w-2.5 h-2.5" />
                              {booking.time}
                            </span>
                            <span className={`text-[9px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded-md ${
                              booking.status === 'pendiente' ? 'bg-amber-100 text-amber-700' :
                              booking.status === 'confirmada' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-slate-200/70 text-slate-500'
                            }`}>
                              {booking.status}
                            </span>
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
    </div>

      {/* Selected Booking Modal */}
      {selectedBooking && (() => {
        const statusStyles = {
          pendiente: { 
            badge: 'bg-amber-100 text-amber-800 border-amber-200', 
            dot: 'bg-amber-500', 
            accentFrom: '#f59e0b', 
            accentTo: '#ea580c', 
            label: 'Pendiente',
            shadowColor: 'shadow-amber-500/20'
          },
          confirmada: { 
            badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', 
            dot: 'bg-emerald-500', 
            accentFrom: '#10b981', 
            accentTo: '#059669', 
            label: 'Confirmada',
            shadowColor: 'shadow-emerald-500/20'
          },
          cancelada: { 
            badge: 'bg-slate-200 text-slate-600 border-slate-300', 
            dot: 'bg-slate-500', 
            accentFrom: '#64748b', 
            accentTo: '#475569', 
            label: 'Cancelada',
            shadowColor: 'shadow-slate-500/20'
          },
        } as const;
        const s = statusStyles[selectedBooking.status];
        const initials = selectedBooking.clientName.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase()).join('') || '?';
        const dateFormatted = new Date(`${selectedBooking.date}T00:00:00`).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-[28px] w-full max-w-md shadow-2xl relative flex flex-col overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="px-6 pt-5 pb-6 relative shrink-0" style={{ background: `linear-gradient(135deg, ${s.accentFrom}, ${s.accentTo})` }}>
                <div className={`absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/10 blur-2xl`}></div>
                <div className={`absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-white/10 blur-xl`}></div>
                <button onClick={() => setSelectedBooking(null)} className="absolute top-4 right-4 w-9 h-9 rounded-2xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all backdrop-blur-sm hover:scale-105">
                  <X className="w-4.5 h-4.5" />
                </button>
                <span className={`relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-white mb-4 border border-white/20 shadow-lg`}>
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  {s.label}
                </span>
                <div className="relative flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/25 text-white font-black text-lg flex items-center justify-center shrink-0 backdrop-blur-md border border-white/30 shadow-xl">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-white text-xl leading-tight truncate drop-shadow-sm">{selectedBooking.clientName}</p>
                    {selectedBooking.company?.name && (
                      <p className="text-white/85 text-xs font-semibold flex items-center gap-1.5 mt-1 truncate">
                        <Building className="w-3.5 h-3.5 shrink-0 opacity-90" /> {selectedBooking.company.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto">
                {/* Date & time */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Fecha
                    </p>
                    <p className="font-extrabold text-slate-800 text-sm capitalize leading-snug">{dateFormatted}</p>
                  </div>
                  <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-1.5">
                      <Clock3 className="w-3.5 h-3.5 text-purple-500" /> Hora
                    </p>
                    <p className="font-extrabold text-slate-800 text-sm">{selectedBooking.time}</p>
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-2.5 bg-gradient-to-br from-slate-50/80 to-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Información de Contacto</p>
                  <div className="flex items-center gap-3 text-xs text-slate-700">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-indigo-500" />
                    </div>
                    <span className="truncate font-semibold">{selectedBooking.clientEmail}</span>
                  </div>
                  {selectedBooking.clientPhone && (
                    <div className="flex items-center gap-3 text-xs text-slate-700">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4 text-emerald-500" />
                      </div>
                      <span className="font-semibold">{selectedBooking.clientPhone}</span>
                    </div>
                  )}
                </div>

                {selectedBooking.notes && (
                  <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/50 rounded-2xl p-4 border border-amber-200/50 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-2 flex items-center gap-1.5">
                      <StickyNote className="w-3.5 h-3.5" /> Notas
                    </p>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {selectedBooking.notes}
                    </p>
                  </div>
                )}

                {selectedBooking.leadId && (
                  <Link
                    to="/leads"
                    className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-4 py-2.5 rounded-2xl border border-indigo-100 hover:bg-indigo-100 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Ver en módulo de Leads
                  </Link>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 px-6 py-5 border-t border-slate-100 bg-gradient-to-b from-white to-slate-50/80 shrink-0">
                {selectedBooking.status !== 'confirmada' && (
                  <button onClick={() => updateStatus(selectedBooking.id, 'confirmada')} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs py-3 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5">
                    <CheckCircle className="w-4.5 h-4.5" /> Confirmar
                  </button>
                )}
                {selectedBooking.status !== 'cancelada' && (
                  <button onClick={() => updateStatus(selectedBooking.id, 'cancelada')} className="flex-1 bg-white border-2 border-slate-200 text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-600 font-bold text-xs py-3 rounded-2xl transition-all flex items-center justify-center gap-2 hover:shadow-md">
                    <XCircle className="w-4.5 h-4.5" /> Cancelar
                  </button>
                )}
                <button
                  onClick={() => deleteBooking(selectedBooking.id)}
                  className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border-2 border-transparent hover:border-red-100 hover:shadow-md"
                  title="Eliminar de la agenda"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* New Booking Modal */}
      {newBookingModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[28px] w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-indigo-500/20 blur-3xl"></div>
              <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-purple-500/20 blur-2xl"></div>
              <div className="relative flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl shadow-lg shadow-indigo-500/30">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">Agendar Reunión</h3>
                  <p className="text-slate-400 text-xs font-medium mt-0.5">Completa los datos para crear una nueva cita</p>
                </div>
              </div>
              <button onClick={() => setNewBookingModal(false)} className="relative w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all backdrop-blur-sm">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 text-[11px]">Empresa</label>
                <select
                  value={formCompanyId}
                  onChange={e => setFormCompanyId(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all hover:border-slate-300 bg-white"
                >
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5 text-[11px]">Nombre del Cliente <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Juan Pérez"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all hover:border-slate-300 placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 text-[11px]">Correo</label>
                  <input
                    type="email"
                    placeholder="cliente@ejemplo.com"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all hover:border-slate-300 placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 text-[11px]">Teléfono</label>
                  <input
                    type="tel"
                    placeholder="+51 999 999 999"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all hover:border-slate-300 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 text-[11px]">Fecha</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all hover:border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 text-[11px]">Hora</label>
                  <input
                    type="time"
                    required
                    value={formTime}
                    onChange={e => setFormTime(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all hover:border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5 text-[11px]">Notas / Motivo</label>
                <textarea
                  rows={3}
                  placeholder="Reunión comercial, presentación de propuesta, seguimiento..."
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all hover:border-slate-300 resize-none placeholder:text-slate-400"
                />
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setNewBookingModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs transition-all hover:shadow-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingBooking}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-2xl disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 text-xs flex items-center gap-1.5"
                >
                  {submittingBooking ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Agendando...
                    </>
                  ) : 'Agendar Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


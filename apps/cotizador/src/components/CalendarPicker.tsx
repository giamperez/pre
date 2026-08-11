import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle2, HelpCircle } from 'lucide-react';
import { API_URL } from '../config';

type MonthStatus = { date: string; status: 'disponible' | 'consultar' | 'ocupado' | 'no-laboral' };
type Slot = { time: string; status: 'disponible' | 'consultar' | 'ocupado' };

interface CalendarPickerProps {
  companySlug: string;
  colorPrimary?: string;
  onSelectBooking: (date: string, time: string) => void;
  onClearBooking: () => void;
}

export function CalendarPicker({ companySlug, colorPrimary = '#4f46e5', onSelectBooking, onClearBooking }: CalendarPickerProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthStatuses, setMonthStatuses] = useState<MonthStatus[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<{ date: string; time: string } | null>(null);

  const fetchMonth = async (date: Date) => {
    setLoadingMonth(true);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    try {
      const res = await fetch(`${API_URL}/bookings/availability/${companySlug}?month=${month}`);
      if (res.ok) {
        setMonthStatuses(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingMonth(false);
  };

  useEffect(() => {
    if (companySlug) {
      fetchMonth(currentDate);
    }
  }, [currentDate, companySlug]);

  const fetchSlots = async (dateStr: string) => {
    setLoadingSlots(true);
    try {
      const res = await fetch(`${API_URL}/bookings/availability/${companySlug}?date=${dateStr}`);
      if (res.ok) {
        setSlots(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingSlots(false);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };

  const handleDateClick = (dateStr: string, status: string) => {
    if (status === 'ocupado' || status === 'no-laboral') return;
    setSelectedDate(dateStr);
    fetchSlots(dateStr);
  };

  const handleSlotClick = (time: string, status: string) => {
    if (status === 'ocupado') return;
    setConfirmedBooking({ date: selectedDate!, time });
    onSelectBooking(selectedDate!, time);
  };

  const clearSelection = () => {
    setConfirmedBooking(null);
    onClearBooking();
  };

  if (confirmedBooking) {
    const d = new Date(`${confirmedBooking.date}T00:00:00`);
    const dateFormatted = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    return (
      <div
        className="rounded-2xl p-4 border shadow-xs flex items-center justify-between gap-3"
        style={{ borderColor: `${colorPrimary}30`, background: `linear-gradient(135deg, ${colorPrimary}12, ${colorPrimary}05)` }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm" style={{ backgroundColor: colorPrimary }}>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-xs sm:text-sm">Cita Agendada para Cliente</p>
            <p className="text-xs text-slate-600 font-medium capitalize truncate">{dateFormatted} · {confirmedBooking.time}</p>
          </div>
        </div>
        <button onClick={clearSelection} className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 bg-white border border-slate-200 rounded-lg transition-colors shadow-2xs shrink-0">
          Cambiar
        </button>
      </div>
    );
  }

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isCurrentMonth = currentDate.getFullYear() === now.getFullYear() && currentDate.getMonth() === now.getMonth();

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 text-xs">
      <div className="mb-4 flex justify-between items-center border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0" style={{ backgroundColor: colorPrimary }}>
            <CalendarIcon className="w-3.5 h-3.5" />
          </div>
          <h3 className="font-bold text-slate-800 text-xs sm:text-sm">Agendamiento de Cita / Reunión</h3>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Calendar */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <button type="button" onClick={handlePrevMonth} className="p-1.5 hover:bg-slate-100 active:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              disabled={isCurrentMonth}
              className="font-bold text-slate-800 capitalize text-xs px-2 py-1 rounded-lg hover:bg-slate-100 disabled:hover:bg-transparent transition-colors"
              title={isCurrentMonth ? undefined : 'Volver al mes actual'}
            >
              {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </button>
            <button type="button" onClick={handleNextMonth} className="p-1.5 hover:bg-slate-100 active:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-1.5">
            {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => <div key={i}>{d}</div>)}
          </div>

          <div className={`grid grid-cols-7 gap-1 transition-opacity ${loadingMonth ? 'opacity-40' : ''}`}>
            {emptyDays.map(d => <div key={`empty-${d}`} />)}
            {daysArray.map(d => {
              const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const isPast = dateStr < todayStr;
              const isToday = dateStr === todayStr;

              const statusObj = monthStatuses.find(m => m.date === dateStr);
              const status = isPast ? 'ocupado' : (statusObj?.status || 'no-laboral');
              const isSelected = selectedDate === dateStr;

              let bgColor = 'bg-transparent';
              let textColor = 'text-slate-300';
              let cursor = 'cursor-not-allowed';
              let extra = '';

              if (status === 'disponible') {
                bgColor = 'bg-emerald-50 hover:bg-emerald-100';
                textColor = 'text-emerald-700 font-semibold';
                cursor = 'cursor-pointer';
              } else if (status === 'consultar') {
                bgColor = 'bg-amber-50 hover:bg-amber-100';
                textColor = 'text-amber-700 font-semibold';
                cursor = 'cursor-pointer';
              }

              if (isToday && !isSelected) {
                extra = 'ring-1 ring-inset ring-indigo-300';
              }

              if (isSelected) {
                bgColor = '';
                textColor = 'text-white font-bold scale-105 shadow-sm';
              }

              return (
                <button
                  type="button"
                  key={d}
                  onClick={() => handleDateClick(dateStr, status)}
                  disabled={status === 'ocupado' || status === 'no-laboral'}
                  style={isSelected ? { backgroundColor: colorPrimary } : {}}
                  className={`aspect-square rounded-lg flex items-center justify-center text-xs transition-all duration-150 ${bgColor} ${textColor} ${cursor} ${extra}`}
                >
                  {d}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-slate-100 text-[9px] font-medium text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Disponible</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Consultar</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300" /> No disp.</span>
          </div>
        </div>

        {/* Time Slots */}
        <div className="pt-3 border-t border-slate-100">
          {!selectedDate ? (
            <div className="flex flex-col items-center justify-center py-4 gap-1.5 text-center">
              <Clock className="w-5 h-5 text-slate-300" />
              <p className="text-slate-400 text-[11px]">Selecciona un día disponible en el calendario</p>
            </div>
          ) : (
            <div>
              <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-1.5 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                Horarios para {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </h4>

              {loadingSlots ? (
                <p className="text-slate-400 text-[11px]">Cargando horarios...</p>
              ) : slots.length === 0 ? (
                <p className="text-slate-400 text-[11px]">No hay horarios disponibles.</p>
              ) : (
                <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {slots.map((slot, i) => {
                    const isAvailable = slot.status === 'disponible';
                    const isConsultar = slot.status === 'consultar';
                    const isOccupied = slot.status === 'ocupado';

                    let bgCls = '';
                    if (isAvailable) bgCls = 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200';
                    else if (isConsultar) bgCls = 'bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200';
                    else bgCls = 'bg-slate-50 text-slate-300 cursor-not-allowed border-slate-100 line-through';

                    return (
                      <button
                        type="button"
                        key={i}
                        onClick={() => handleSlotClick(slot.time, slot.status)}
                        disabled={isOccupied}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all border text-center flex items-center justify-center gap-1 ${bgCls}`}
                      >
                        {isConsultar && <HelpCircle className="w-3 h-3 shrink-0" />}
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

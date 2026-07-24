import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { API_URL } from '../config';

type MonthStatus = { date: string; status: 'disponible' | 'consultar' | 'ocupado' | 'no-laboral' };
type Slot = { time: string; status: 'disponible' | 'ocupado' };

interface CalendarPickerProps {
  companySlug: string;
  colorPrimary: string;
  onSelectBooking: (date: string, time: string) => void;
  onClearBooking: () => void;
}

export function CalendarPicker({ companySlug, colorPrimary, onSelectBooking, onClearBooking }: CalendarPickerProps) {
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
    fetchMonth(currentDate);
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
      <div className="bg-white rounded-2xl p-5 border shadow-sm flex items-center justify-between" style={{ borderColor: `${colorPrimary}40`, backgroundColor: `${colorPrimary}05` }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: colorPrimary }}>
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-lg">Reunión agendada</p>
            <p className="text-slate-600 capitalize">{dateFormatted} a las {confirmedBooking.time}</p>
          </div>
        </div>
        <button onClick={clearSelection} className="text-slate-400 hover:text-slate-600 px-3 py-1 bg-white border rounded-lg text-sm transition-colors">
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

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">¿Cuándo te podemos contactar?</h2>
          <p className="text-slate-500">Selecciona una fecha y hora para conversar (Opcional)</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Calendar */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-4">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="font-semibold text-lg text-slate-800 capitalize">
              {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 mb-2">
            {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map(d => <div key={d}>{d}</div>)}
          </div>
          
          <div className={`grid grid-cols-7 gap-1 ${loadingMonth ? 'opacity-50' : ''}`}>
            {emptyDays.map(d => <div key={`empty-${d}`} />)}
            {daysArray.map(d => {
              const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const isPast = dateStr < todayStr;
              
              const statusObj = monthStatuses.find(m => m.date === dateStr);
              const status = isPast ? 'ocupado' : (statusObj?.status || 'no-laboral');
              
              const isSelected = selectedDate === dateStr;
              
              let bgColor = 'bg-slate-50';
              let textColor = 'text-slate-400';
              let cursor = 'cursor-not-allowed opacity-50';

              if (status === 'disponible') {
                bgColor = 'bg-green-100 hover:bg-green-200';
                textColor = 'text-green-800';
                cursor = 'cursor-pointer';
              } else if (status === 'consultar') {
                bgColor = 'bg-slate-200 hover:bg-slate-300';
                textColor = 'text-slate-800';
                cursor = 'cursor-pointer';
              }

              if (isSelected) {
                bgColor = '';
                textColor = 'text-white shadow-md font-bold scale-110 relative z-10';
              }

              return (
                <div 
                  key={d}
                  onClick={() => handleDateClick(dateStr, status)}
                  className={`aspect-square rounded-full flex items-center justify-center text-sm transition-all ${bgColor} ${textColor} ${cursor}`}
                  style={isSelected ? { backgroundColor: colorPrimary } : {}}
                  title={status === 'consultar' ? 'Pocos horarios disponibles' : ''}
                >
                  {d}
                </div>
              );
            })}
          </div>
          
          <div className="flex gap-4 mt-6 text-xs text-slate-500 justify-center">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-200"></div> Disponible</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-slate-200"></div> Consultar</div>
          </div>
        </div>

        {/* Time Slots */}
        <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-200 pt-6 md:pt-0 md:pl-8">
          {!selectedDate ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 min-h-[200px]">
              <Clock className="w-12 h-12 mb-3 opacity-20" />
              <p>Selecciona un día para ver horarios</p>
            </div>
          ) : (
            <div>
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                Horarios disponibles
              </h3>
              
              {loadingSlots ? (
                <p className="text-slate-400 text-sm">Cargando horarios...</p>
              ) : slots.length === 0 ? (
                <p className="text-slate-400 text-sm">No hay horarios disponibles para este día.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {slots.map((slot, i) => {
                    const isAvailable = slot.status === 'disponible';
                    return (
                      <button
                        key={i}
                        onClick={() => handleSlotClick(slot.time, slot.status)}
                        disabled={!isAvailable}
                        className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                          isAvailable 
                          ? 'bg-green-50 text-green-700 hover:bg-green-100 hover:shadow-sm border border-green-200' 
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 opacity-60 line-through'
                        }`}
                      >
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
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
}

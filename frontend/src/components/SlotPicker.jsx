import { useEffect, useMemo, useState } from 'react';
import { getAvailability } from '../api/doctors';

const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_LABELS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function pad(n) {
  return String(n).padStart(2, '0');
}
function dateStr(y, m, d) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}
function daysInMonth(y, m) {
  return new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
}
function firstWeekday(y, m) {
  return new Date(Date.UTC(y, m, 1)).getUTCDay();
}
function todayParts() {
  const now = new Date();
  return { y: now.getFullYear(), m: now.getMonth(), str: dateStr(now.getFullYear(), now.getMonth(), now.getDate()) };
}
function formatLongDate(fecha) {
  const [y, m, d] = fecha.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
}

// Calendario mensual: al elegir un día se muestran las horas libres de ese doctor, calculadas
// en el backend a partir de su horario laboral recurrente, las excepciones y las citas ya tomadas.
export default function SlotPicker({ doctorId, onSelect, selected }) {
  const today = todayParts();
  const [visible, setVisible] = useState({ y: today.y, m: today.m });
  const [slotsByDate, setSlotsByDate] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeDate, setActiveDate] = useState(null);

  useEffect(() => {
    setVisible({ y: today.y, m: today.m });
    setActiveDate(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId]);

  useEffect(() => {
    if (!doctorId) return;
    setLoading(true);
    setError('');
    const isCurrentMonth = visible.y === today.y && visible.m === today.m;
    const from = isCurrentMonth ? today.str : dateStr(visible.y, visible.m, 1);
    const to = dateStr(visible.y, visible.m, daysInMonth(visible.y, visible.m));
    getAvailability(doctorId, from, to)
      .then((data) => {
        const map = {};
        data.forEach((day) => {
          map[day.fecha] = day.slots;
        });
        setSlotsByDate(map);
      })
      .catch(() => setError('No se pudo cargar la disponibilidad.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId, visible.y, visible.m]);

  const weeks = useMemo(() => {
    const total = daysInMonth(visible.y, visible.m);
    const leading = firstWeekday(visible.y, visible.m);
    const cells = Array(leading).fill(null);
    for (let d = 1; d <= total; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    const rows = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [visible]);

  const canGoPrev = visible.y > today.y || (visible.y === today.y && visible.m > today.m);
  const goPrevMonth = () => setVisible((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }));
  const goNextMonth = () => setVisible((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }));

  const activeSlots = activeDate ? slotsByDate[activeDate] || [] : [];

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={goPrevMonth}
            disabled={!canGoPrev}
            className="w-8 h-8 rounded-full flex items-center justify-center text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:hover:bg-transparent transition"
            aria-label="Mes anterior"
          >
            ‹
          </button>
          <p className="font-semibold text-navy-900">
            {MONTH_LABELS[visible.m]} {visible.y}
          </p>
          <button
            type="button"
            onClick={goNextMonth}
            className="w-8 h-8 rounded-full flex items-center justify-center text-indigo-600 hover:bg-indigo-50 transition"
            aria-label="Mes siguiente"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400 mb-2">
          {WEEKDAY_LABELS.map((w) => (
            <div key={w}>{w}</div>
          ))}
        </div>

        {loading ? (
          <p className="text-slate-500 text-sm py-10 text-center">Cargando calendario...</p>
        ) : error ? (
          <p className="text-red-600 text-sm py-10 text-center">{error}</p>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {weeks.flat().map((day, idx) => {
              if (day === null) return <div key={`blank-${idx}`} />;
              const fecha = dateStr(visible.y, visible.m, day);
              const isPast = fecha < today.str;
              const hasSlots = (slotsByDate[fecha] || []).length > 0;
              const isToday = fecha === today.str;
              const isActive = fecha === activeDate;
              const disabled = isPast || !hasSlots;
              return (
                <button
                  key={fecha}
                  type="button"
                  disabled={disabled}
                  onClick={() => setActiveDate(fecha)}
                  className={`h-9 rounded-full text-sm transition ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow'
                      : disabled
                      ? 'text-slate-300 cursor-not-allowed'
                      : isToday
                      ? 'text-coral-500 font-semibold hover:bg-indigo-50'
                      : 'text-slate-700 hover:bg-indigo-50'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        {!activeDate ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-10 text-slate-400">
            <span className="text-4xl mb-3">🗓️</span>
            <p className="text-sm max-w-[220px]">
              Haz clic en un día del calendario para ver las horas disponibles.
            </p>
          </div>
        ) : activeSlots.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-10 text-slate-400">
            <span className="text-4xl mb-3">🚫</span>
            <p className="text-sm">No hay horarios disponibles este día.</p>
          </div>
        ) : (
          <div key={activeDate} className="animate-fade-in">
            <p className="font-semibold text-navy-900 mb-3 capitalize">{formatLongDate(activeDate)}</p>
            <div className="grid grid-cols-3 gap-2">
              {activeSlots.map((slot) => {
                const isSelected = selected?.fecha === activeDate && selected?.horaInicio === slot.horaInicio;
                return (
                  <button
                    key={slot.horaInicio}
                    type="button"
                    onClick={() => onSelect({ fecha: activeDate, horaInicio: slot.horaInicio })}
                    className={`px-3 py-2 rounded-xl text-sm border transition ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-400 hover:text-indigo-700'
                    }`}
                  >
                    {slot.horaInicio.slice(0, 5)}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

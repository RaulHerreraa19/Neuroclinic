import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, ChevronLeft, ChevronRight, Mail, Phone, Plus, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { listDoctorAppointments, listSchedules } from '../api/doctors';
import { updateAppointmentStatus, getAppointmentPayment } from '../api/appointments';
import { fetchMyReminders } from '../api/auth';
import Avatar from '../components/Avatar';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import NewAppointmentModal from '../components/NewAppointmentModal';
import ChargeAppointmentModal from '../components/ChargeAppointmentModal';
import DoctorLayout from '../components/DoctorLayout';
import { ESTADO_STYLES, ESTADO_LABELS } from '../utils/appointmentStatus';

const DAY_LABELS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const HOUR_HEIGHT = 64; // px — calendario grande, un vistazo claro de bloques por hora
const BLOCK_STYLES = {
  pendiente: 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-900 dark:text-amber-300',
  confirmada: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-300',
  cancelada: 'bg-slate-100 dark:bg-slate-800 border-slate-400 text-slate-500 dark:text-slate-400 line-through',
  completada: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-300',
  no_asistio: 'bg-red-50 dark:bg-red-950/40 border-red-400 text-red-900 dark:text-red-300',
};
const STATUS_ACTIONS = [
  { estado: 'confirmada', label: 'Confirmar' },
  { estado: 'completada', label: 'Marcar completada' },
  { estado: 'no_asistio', label: 'No asistió' },
  { estado: 'cancelada', label: 'Cancelar' },
];

function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function startOfWeek(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d.toISOString().slice(0, 10);
}

function timeToMinutes(hhmm) {
  const [h, m] = hhmm.slice(0, 5).split(':').map(Number);
  return h * 60 + m;
}

function formatLongDate(fecha) {
  const d = new Date(`${fecha}T00:00:00Z`);
  return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
}

function formatWeekRange(weekStart) {
  const start = new Date(`${weekStart}T00:00:00Z`);
  const end = new Date(`${addDays(weekStart, 6)}T00:00:00Z`);
  const opts = { day: 'numeric', month: 'short', timeZone: 'UTC' };
  const startLabel = start.toLocaleDateString('es-MX', opts);
  const endLabel = end.toLocaleDateString('es-MX', { ...opts, year: 'numeric' });
  return `${startLabel} – ${endLabel}`;
}

function calculateAge(fechaNacimiento) {
  if (!fechaNacimiento) return null;
  const birth = new Date(`${fechaNacimiento}T00:00:00Z`);
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - birth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < birth.getUTCDate())) age--;
  return age;
}

export default function DoctorAgenda() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const [weekStart, setWeekStart] = useState(startOfWeek(today));
  const [appointments, setAppointments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [newAppointment, setNewAppointment] = useState(null); // { fecha, initialMinutes } | null
  const [tomorrowCount, setTomorrowCount] = useState(0);

  useEffect(() => {
    fetchMyReminders().then((r) => setTomorrowCount(r.tomorrowCount || 0));
  }, []);

  const load = () => {
    setLoading(true);
    return listDoctorAppointments(user.id, weekStart, addDays(weekStart, 6))
      .then(setAppointments)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  useEffect(() => {
    listSchedules(user.id).then(setSchedules);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStatus = async (id, estado) => {
    await updateAppointmentStatus(id, estado);
    showToast('Estado de la cita actualizado.', { type: 'success' });
    setActiveAppointment((a) => (a ? { ...a, estado } : a));
    load();
  };

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const { startHour, endHour } = useMemo(() => {
    if (schedules.length === 0) return { startHour: 8, endHour: 18 };
    const starts = schedules.map((s) => timeToMinutes(s.horaInicio));
    const ends = schedules.map((s) => timeToMinutes(s.horaFin));
    return {
      startHour: Math.max(0, Math.floor(Math.min(...starts) / 60)),
      endHour: Math.min(24, Math.ceil(Math.max(...ends) / 60)),
    };
  }, [schedules]);

  const hours = useMemo(
    () => Array.from({ length: Math.max(endHour - startHour, 1) }, (_, i) => startHour + i),
    [startHour, endHour]
  );
  const gridHeight = hours.length * HOUR_HEIGHT;
  const gridStartMinutes = startHour * 60;
  const gridEndMinutes = endHour * 60;

  const appointmentsByDay = useMemo(() => {
    const map = {};
    for (const a of appointments) {
      if (!map[a.fecha]) map[a.fecha] = [];
      map[a.fecha].push(a);
    }
    return map;
  }, [appointments]);

  const blockStyle = (a) => {
    const start = Math.min(Math.max(timeToMinutes(a.horaInicio), gridStartMinutes), gridEndMinutes);
    const end = Math.min(Math.max(timeToMinutes(a.horaFin), gridStartMinutes), gridEndMinutes);
    const top = ((start - gridStartMinutes) / 60) * HOUR_HEIGHT;
    const height = Math.max(((end - start) / 60) * HOUR_HEIGHT, 30);
    return { top: `${top}px`, height: `${height}px` };
  };

  const handleColumnClick = (fecha) => (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const minutes = Math.round(gridStartMinutes + (offsetY / HOUR_HEIGHT) * 60);
    setNewAppointment({ fecha, initialMinutes: minutes });
  };

  return (
    <DoctorLayout>
      <PageHeader
        eyebrow="Vista médico"
        title="Mi agenda"
        subtitle="Calendario semanal de tus citas. Haz clic en un bloque para ver al paciente."
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setNewAppointment({ fecha: today, initialMinutes: null })}
              className="btn-primary text-sm"
            >
              <Plus size={16} aria-hidden="true" /> Nueva cita
            </button>
            <button
              type="button"
              onClick={() => setWeekStart(startOfWeek(today))}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-sand-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-navy-300 dark:hover:border-navy-500 hover:text-navy-700 dark:hover:text-white transition"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => setWeekStart((w) => addDays(w, -7))}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 hover:bg-sand-200 dark:hover:bg-indigo-950/40 transition"
              aria-label="Semana anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <p className="text-sm font-semibold text-navy-900 dark:text-white capitalize w-40 text-center">
              {formatWeekRange(weekStart)}
            </p>
            <button
              type="button"
              onClick={() => setWeekStart((w) => addDays(w, 7))}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 hover:bg-sand-200 dark:hover:bg-indigo-950/40 transition"
              aria-label="Semana siguiente"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        }
      />

      {tomorrowCount > 0 && (
        <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 px-4 py-3 text-sm text-indigo-800 dark:text-indigo-300">
          <Bell size={16} aria-hidden="true" className="flex-shrink-0" />
          Mañana tienes <strong>{tomorrowCount}</strong> paciente{tomorrowCount === 1 ? '' : 's'} agendado{tomorrowCount === 1 ? '' : 's'}.
        </div>
      )}

      {loading && <p className="text-slate-500 dark:text-slate-400">Cargando...</p>}

      {!loading && (
        <div className="calendar-surface overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[820px]">
              {/* Encabezado de días */}
              <div className="grid" style={{ gridTemplateColumns: '64px repeat(7, minmax(0,1fr))' }}>
                <div className="border-b border-sand-200 dark:border-slate-700" />
                {weekDays.map((fecha) => {
                  const isToday = fecha === today;
                  const d = new Date(`${fecha}T00:00:00Z`);
                  return (
                    <div
                      key={fecha}
                      className={`text-center py-3 border-b border-l border-sand-200 dark:border-slate-700 ${
                        isToday ? 'bg-indigo-50/70 dark:bg-indigo-950/30' : ''
                      }`}
                    >
                      <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                        {DAY_LABELS_SHORT[d.getUTCDay()]}
                      </p>
                      <p
                        className={`text-lg font-bold ${
                          isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-navy-900 dark:text-white'
                        }`}
                      >
                        {d.getUTCDate()}
                      </p>
                      {(appointmentsByDay[fecha]?.length || 0) > 0 && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          {appointmentsByDay[fecha].length} cita{appointmentsByDay[fecha].length === 1 ? '' : 's'}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Cuadrícula de horas */}
              <div className="grid" style={{ gridTemplateColumns: '64px repeat(7, minmax(0,1fr))' }}>
                <div className="relative" style={{ height: gridHeight }}>
                  {hours.map((h, i) => (
                    <div
                      key={h}
                      className="absolute right-2 text-[11px] text-slate-400 dark:text-slate-500 -translate-y-1/2"
                      style={{ top: i * HOUR_HEIGHT }}
                    >
                      {String(h).padStart(2, '0')}:00
                    </div>
                  ))}
                </div>

                {weekDays.map((fecha) => {
                  const isToday = fecha === today;
                  return (
                    <div
                      key={fecha}
                      onClick={handleColumnClick(fecha)}
                      className={`relative border-l border-sand-200 dark:border-slate-700 cursor-pointer hover:bg-sand-200/60 dark:hover:bg-indigo-950/20 transition-colors ${
                        isToday ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''
                      }`}
                      style={{ height: gridHeight }}
                    >
                      {hours.map((h, i) => (
                        <div
                          key={h}
                          className="absolute left-0 right-0 border-t border-sand-200 dark:border-slate-700 pointer-events-none"
                          style={{ top: i * HOUR_HEIGHT }}
                        />
                      ))}
                      {(appointmentsByDay[fecha] || []).map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveAppointment(a);
                          }}
                          style={blockStyle(a)}
                          className={`absolute left-1 right-1 rounded-lg border-l-4 px-2 py-1 text-left overflow-hidden shadow-sm hover:shadow-md hover:brightness-95 transition ${
                            BLOCK_STYLES[a.estado] || BLOCK_STYLES.confirmada
                          }`}
                        >
                          <p className="text-[11px] font-bold leading-tight">{a.horaInicio.slice(0, 5)}</p>
                          <p className="text-[11px] leading-tight truncate">
                            {a.patient?.nombre} {a.patient?.apellidoPaterno}
                          </p>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={Boolean(activeAppointment)}
        onClose={() => setActiveAppointment(null)}
        title="Detalles del paciente"
        subtitle={
          activeAppointment &&
          `${formatLongDate(activeAppointment.fecha)} · ${activeAppointment.horaInicio.slice(0, 5)}`
        }
      >
        {activeAppointment && <PatientDetail appointment={activeAppointment} onStatusChange={handleStatus} />}
      </Modal>

      <NewAppointmentModal
        open={Boolean(newAppointment)}
        onClose={() => setNewAppointment(null)}
        doctorId={user.id}
        fecha={newAppointment?.fecha}
        initialMinutes={newAppointment?.initialMinutes}
        onCreated={load}
      />
    </DoctorLayout>
  );
}

function PatientDetail({ appointment, onStatusChange }) {
  const patient = appointment.patient || {};
  const profile = patient.patientProfile || {};
  const age = calculateAge(profile.fechaNacimiento);
  const [payment, setPayment] = useState(null);
  const [chargeOpen, setChargeOpen] = useState(false);

  useEffect(() => {
    if (appointment.estado !== 'completada') return;
    getAppointmentPayment(appointment.id).then(setPayment);
  }, [appointment.id, appointment.estado]);

  return (
    <div>
      <div className="flex items-center gap-3 pb-4 border-b border-sand-200 dark:border-slate-700">
        <Avatar nombre={patient.nombre} apellido={patient.apellidoPaterno} size="lg" />
        <div className="min-w-0">
          <p className="font-bold text-navy-900 dark:text-white text-lg truncate">
            {patient.nombre} {patient.apellidoPaterno} {patient.apellidoMaterno}
          </p>
          <span
            className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full capitalize mt-1 ${
              ESTADO_STYLES[appointment.estado] || ''
            }`}
          >
            {ESTADO_LABELS[appointment.estado] || appointment.estado}
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <Section title="Contacto">
          <div className="flex flex-wrap items-center gap-2">
            {patient.telefono ? (
              <a href={`tel:${patient.telefono}`} className="btn-primary text-sm !bg-emerald-600 hover:!bg-emerald-700">
                <Phone size={15} aria-hidden="true" /> Llamar {patient.telefono}
              </a>
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500">Sin teléfono registrado.</p>
            )}
          </div>
          {patient.email && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
              <Mail size={14} aria-hidden="true" /> {patient.email}
            </p>
          )}
        </Section>

        <Section title="Datos personales">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {age !== null ? `${age} años` : 'Edad no registrada'}
            {profile.direccion ? ` · ${profile.direccion}` : ''}
          </p>
        </Section>

        {(profile.contactoEmergenciaNombre || profile.contactoEmergenciaTelefono) && (
          <Section title="Contacto de emergencia">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {profile.contactoEmergenciaNombre || 'Sin nombre registrado'}
              </p>
              {profile.contactoEmergenciaTelefono && (
                <a
                  href={`tel:${profile.contactoEmergenciaTelefono}`}
                  className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline whitespace-nowrap flex items-center gap-1"
                >
                  <Phone size={13} aria-hidden="true" /> {profile.contactoEmergenciaTelefono}
                </a>
              )}
            </div>
          </Section>
        )}

        {appointment.motivoConsulta && (
          <Section title="Motivo de consulta">
            <p className="text-sm text-slate-600 dark:text-slate-300">{appointment.motivoConsulta}</p>
          </Section>
        )}

        {appointment.estado === 'completada' && (
          <Section title="Cobro">
            {payment ? (
              <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                Cobrado: ${Number(payment.monto).toFixed(2)} MXN · {payment.concepto}
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setChargeOpen(true)}
                className="btn-primary text-sm !bg-emerald-600 hover:!bg-emerald-700"
              >
                <Wallet size={15} aria-hidden="true" /> Cobrar consulta
              </button>
            )}
          </Section>
        )}
      </div>

      <ChargeAppointmentModal
        open={chargeOpen}
        onClose={() => setChargeOpen(false)}
        appointment={appointment}
        onCharged={() => getAppointmentPayment(appointment.id).then(setPayment)}
      />

      <div className="mt-6 pt-4 border-t border-sand-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
        <Link
          to={`/pacientes/${patient.id}`}
          state={{ patientName: `${patient.nombre ?? ''} ${patient.apellidoPaterno ?? ''}` }}
          className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
        >
          Ver expediente clínico →
        </Link>
        <select
          onChange={(e) => e.target.value && onStatusChange(appointment.id, e.target.value)}
          defaultValue=""
          className="text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="" disabled>
            Cambiar estado
          </option>
          {STATUS_ACTIONS.map((s) => (
            <option key={s.estado} value={s.estado}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-navy-600 dark:text-navy-300 mb-1.5">{title}</p>
      {children}
    </div>
  );
}

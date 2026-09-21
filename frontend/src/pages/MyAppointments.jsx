import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listMyAppointments, cancelAppointment } from '../api/appointments';
import { fetchMyReminders } from '../api/auth';
import AppointmentCard from '../components/AppointmentCard';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('proximas');
  const [tomorrowAppointment, setTomorrowAppointment] = useState(null);

  const load = () => listMyAppointments().then(setAppointments).finally(() => setLoading(false));

  useEffect(() => {
    load();
    fetchMyReminders().then((r) => setTomorrowAppointment(r.appointment || null));
  }, []);

  const handleCancel = async (id) => {
    await cancelAppointment(id);
    load();
  };

  const today = new Date().toISOString().slice(0, 10);
  const { proximas, pasadas } = useMemo(() => {
    const proximas = appointments.filter((a) => a.fecha >= today);
    const pasadas = appointments.filter((a) => a.fecha < today);
    return { proximas, pasadas };
  }, [appointments, today]);

  const visibles = tab === 'proximas' ? proximas : pasadas;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <PageHeader
        eyebrow="Tu seguimiento"
        title="Mis citas"
        subtitle="Historial y próximas citas con tus doctores."
        action={
          <Link
            to="/"
            className="px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
          >
            + Agendar nueva cita
          </Link>
        }
      />

      {tomorrowAppointment && (
        <div className="mb-6 flex items-center gap-2.5 rounded-2xl bg-indigo-50 border border-indigo-100 px-4 py-3 text-sm text-indigo-800">
          <span aria-hidden="true">🔔</span>
          Mañana tienes cita con {tomorrowAppointment.doctor?.nombre} {tomorrowAppointment.doctor?.apellidoPaterno} a las{' '}
          {tomorrowAppointment.horaInicio.slice(0, 5)}.
        </div>
      )}

      <div className="flex gap-2 mb-5">
        <TabButton label={`Próximas (${proximas.length})`} active={tab === 'proximas'} onClick={() => setTab('proximas')} />
        <TabButton label={`Pasadas (${pasadas.length})`} active={tab === 'pasadas'} onClick={() => setTab('pasadas')} />
      </div>

      {loading && <p className="text-slate-500">Cargando...</p>}

      <div className="space-y-3">
        {visibles.map((a) => (
          <AppointmentCard
            key={a.id}
            appointment={a}
            personLabel="Doctor"
            personName={`${a.doctor?.nombre ?? ''} ${a.doctor?.apellidoPaterno ?? ''}`}
            avatarNombre={a.doctor?.nombre}
            avatarApellido={a.doctor?.apellidoPaterno}
            actions={
              tab === 'proximas' &&
              ['pendiente', 'confirmada'].includes(a.estado) && (
                <button
                  onClick={() => handleCancel(a.id)}
                  className="text-sm text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-full transition"
                >
                  Cancelar
                </button>
              )
            }
          />
        ))}
        {!loading && visibles.length === 0 && (
          <EmptyState
            icon="🗓️"
            message={
              tab === 'proximas'
                ? 'No tienes citas próximas. Agenda la primera desde la página de inicio.'
                : 'Todavía no tienes citas pasadas.'
            }
          />
        )}
      </div>
    </div>
  );
}

function TabButton({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-sm px-4 py-2 rounded-full border transition ${
        active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
      }`}
    >
      {label}
    </button>
  );
}

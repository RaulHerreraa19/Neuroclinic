import { useEffect, useMemo, useState } from 'react';
import { listAllAppointments } from '../api/admin';
import AppointmentCard from '../components/AppointmentCard';
import AdminLayout from '../components/AdminLayout';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { ESTADO_LABELS } from '../utils/appointmentStatus';

const ESTADOS = ['pendiente', 'confirmada', 'completada', 'cancelada', 'no_asistio'];

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todas');

  useEffect(() => {
    listAllAppointments().then(setAppointments).finally(() => setLoading(false));
  }, []);

  const visibles = useMemo(
    () => (filtro === 'todas' ? appointments : appointments.filter((a) => a.estado === filtro)),
    [appointments, filtro]
  );

  return (
    <AdminLayout>
      <PageHeader eyebrow="Panel admin" title="Citas de tus doctores" subtitle="Agenda de los doctores que tú diste de alta." />

      {loading && <p className="text-slate-500">Cargando...</p>}

      {!loading && (
        <div className="flex flex-wrap gap-2 mb-6">
          <FilterChip label={`Todas (${appointments.length})`} active={filtro === 'todas'} onClick={() => setFiltro('todas')} />
          {ESTADOS.map((estado) => {
            const count = appointments.filter((a) => a.estado === estado).length;
            if (count === 0) return null;
            return (
              <FilterChip
                key={estado}
                label={`${ESTADO_LABELS[estado] || estado} (${count})`}
                active={filtro === estado}
                onClick={() => setFiltro(estado)}
              />
            );
          })}
        </div>
      )}

      <div className="space-y-3">
        {visibles.map((a) => (
          <AppointmentCard
            key={a.id}
            appointment={a}
            personLabel="Paciente / Doctor"
            personName={`${a.patient?.nombre ?? ''} ${a.patient?.apellidoPaterno ?? ''} / ${a.doctor?.nombre ?? ''} ${a.doctor?.apellidoPaterno ?? ''}`}
            avatarNombre={a.patient?.nombre}
            avatarApellido={a.patient?.apellidoPaterno}
          />
        ))}
        {!loading && visibles.length === 0 && <EmptyState icon="📅" message="No hay citas para este filtro." />}
      </div>
    </AdminLayout>
  );
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-sm capitalize px-3.5 py-1.5 rounded-full border transition ${
        active
          ? 'bg-indigo-600 text-white border-indigo-600'
          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
      }`}
    >
      {label}
    </button>
  );
}

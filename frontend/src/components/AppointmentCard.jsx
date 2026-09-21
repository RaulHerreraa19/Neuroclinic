import Avatar from './Avatar';
import { ESTADO_STYLES, ESTADO_LABELS } from '../utils/appointmentStatus';

export default function AppointmentCard({ appointment, personLabel, personName, avatarNombre, avatarApellido, actions }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar nombre={avatarNombre ?? personName} apellido={avatarApellido} />
        <div className="min-w-0">
          <p className="font-semibold text-navy-900">
            {appointment.fecha} · {appointment.horaInicio.slice(0, 5)}
          </p>
          <p className="text-sm text-slate-500 truncate">
            {personLabel}: {personName}
          </p>
          {appointment.motivoConsulta && (
            <p className="text-sm text-slate-400 truncate">Motivo: {appointment.motivoConsulta}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${ESTADO_STYLES[appointment.estado] || ''}`}>
          {ESTADO_LABELS[appointment.estado] || appointment.estado}
        </span>
        {actions}
      </div>
    </div>
  );
}

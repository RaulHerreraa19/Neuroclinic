import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { createAppointment } from '../api/appointments';

const emptyForm = {
  email: '',
  nombre: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  telefono: '',
  fechaNacimiento: '',
  sexo: 'otro',
  curp: '',
  direccion: '',
  contactoEmergenciaNombre: '',
  contactoEmergenciaTelefono: '',
  avisoPrivacidadAceptado: false,
  motivoConsulta: '',
};

// Último paso del agendado: si ya hay sesión de paciente solo confirma el horario elegido;
// si es la primera vez, captura sus datos, crea su cuenta (con contraseña generada en el
// servidor y enviada por correo) y agenda la cita, todo en una sola llamada.
export default function BookingStep({ doctorId, doctorNombre, fecha, horaInicio, onBack }) {
  const navigate = useNavigate();
  const { user, registerPatient } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState(emptyForm);
  const [motivoConsulta, setMotivoConsulta] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleExistingPatientSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await createAppointment({ doctorId, fecha, horaInicio, motivoConsulta });
      setConfirmed(true);
      showToast('Tu cita quedó confirmada.', { type: 'success' });
    } catch (err) {
      const message = err.response?.data?.error || 'No se pudo agendar la cita.';
      setError(message);
      showToast(message, { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFirstTimeSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const data = await registerPatient({
        ...form,
        appointment: { doctorId, fecha, horaInicio, motivoConsulta: form.motivoConsulta },
      });
      setEmailEnviado(Boolean(data.emailEnviado));
      setConfirmed(true);
      showToast('¡Cuenta creada y cita agendada!', { type: 'success' });
    } catch (err) {
      const message = err.response?.data?.error || 'No se pudo completar el registro.';
      setError(message);
      showToast(message, { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmed) {
    return (
      <div className="text-center py-2">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center animate-pop">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-8 h-8 text-emerald-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-navy-900 mt-4">¡Cita agendada!</h3>
        <p className="text-slate-500 mt-2">
          Tu cita con {doctorNombre} quedó registrada para el {fecha} a las {horaInicio.slice(0, 5)}.
        </p>
        {!user && (
          <p className="text-slate-500 mt-2 text-sm bg-slate-50 rounded-xl p-3">
            {emailEnviado
              ? '📧 Te enviamos un correo con tu contraseña temporal para que puedas dar seguimiento a tus citas.'
              : 'Creamos tu cuenta, pero no pudimos enviarte el correo con tu contraseña. Contacta a la clínica para recuperarla.'}
          </p>
        )}
        <button
          onClick={() => navigate('/mis-citas')}
          className="mt-6 px-6 py-2.5 rounded-full bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
        >
          Ver mis citas
        </button>
      </div>
    );
  }

  if (user?.roles?.includes('paciente')) {
    return (
      <div>
        <StepHeader doctorNombre={doctorNombre} fecha={fecha} horaInicio={horaInicio} onBack={onBack} />
        <form onSubmit={handleExistingPatientSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Motivo de consulta (opcional)</label>
            <textarea
              value={motivoConsulta}
              onChange={(e) => setMotivoConsulta(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              rows={3}
            />
          </div>
          {error && <Alert>{error}</Alert>}
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {submitting ? 'Agendando...' : 'Confirmar cita'}
          </button>
        </form>
      </div>
    );
  }

  if (user) {
    return <div className="text-slate-600">Solo los pacientes pueden agendar citas desde esta pantalla.</div>;
  }

  return (
    <div>
      <StepHeader doctorNombre={doctorNombre} fecha={fecha} horaInicio={horaInicio} onBack={onBack} />
      <p className="text-slate-500 mt-1 text-sm">
        Como es tu primera vez, cuéntanos de ti. Con estos datos creamos tu cuenta y te enviamos por correo tu
        contraseña de acceso para futuras citas y seguimiento — no necesitas inventar una.
      </p>

      <form onSubmit={handleFirstTimeSubmit} className="mt-5 space-y-5">
        <FormSection title="Datos personales">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nombre(s)" value={form.nombre} onChange={update('nombre')} required />
            <Field label="Apellido paterno" value={form.apellidoPaterno} onChange={update('apellidoPaterno')} required />
            <Field label="Apellido materno" value={form.apellidoMaterno} onChange={update('apellidoMaterno')} />
            <Field label="Teléfono" value={form.telefono} onChange={update('telefono')} />
            <Field
              label="Fecha de nacimiento"
              type="date"
              value={form.fechaNacimiento}
              onChange={update('fechaNacimiento')}
              required
            />
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Sexo</label>
              <select
                value={form.sexo}
                onChange={update('sexo')}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              >
                <option value="femenino">Femenino</option>
                <option value="masculino">Masculino</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <Field label="CURP (opcional)" value={form.curp} onChange={update('curp')} />
            <Field label="Correo electrónico" type="email" value={form.email} onChange={update('email')} required />
          </div>
        </FormSection>

        <FormSection title="Dirección y contacto de emergencia">
          <Field label="Dirección" value={form.direccion} onChange={update('direccion')} />
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <Field
              label="Contacto de emergencia"
              value={form.contactoEmergenciaNombre}
              onChange={update('contactoEmergenciaNombre')}
            />
            <Field
              label="Teléfono de emergencia"
              value={form.contactoEmergenciaTelefono}
              onChange={update('contactoEmergenciaTelefono')}
            />
          </div>
        </FormSection>

        <FormSection title="Tu consulta">
          <label className="block text-sm font-medium text-slate-600 mb-1">Motivo de consulta (opcional)</label>
          <textarea
            value={form.motivoConsulta}
            onChange={update('motivoConsulta')}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
            rows={3}
          />
        </FormSection>

        <label className="flex items-start gap-2 text-sm text-slate-600 bg-indigo-50/60 rounded-xl p-3">
          <input
            type="checkbox"
            checked={form.avisoPrivacidadAceptado}
            onChange={update('avisoPrivacidadAceptado')}
            className="mt-1 accent-indigo-600"
          />
          <span>
            Acepto el aviso de privacidad y el manejo de mis datos personales y de salud conforme a la
            normativa aplicable.
          </span>
        </label>

        {error && <Alert>{error}</Alert>}

        <button
          type="submit"
          disabled={submitting || !form.avisoPrivacidadAceptado}
          className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          {submitting ? 'Agendando...' : 'Crear cuenta y agendar cita'}
        </button>
      </form>
    </div>
  );
}

function StepHeader({ doctorNombre, fecha, horaInicio, onBack }) {
  return (
    <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
      <div>
        <h3 className="text-lg font-bold text-navy-900">Confirma tu cita</h3>
        <p className="text-slate-500 text-sm mt-1">
          {doctorNombre} · {fecha} a las {horaInicio.slice(0, 5)}
        </p>
      </div>
      {onBack && (
        <button type="button" onClick={onBack} className="text-sm text-indigo-600 hover:underline whitespace-nowrap">
          Cambiar horario
        </button>
      )}
    </div>
  );
}

function FormSection({ title, children }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500 mb-2">{title}</p>
      {children}
    </div>
  );
}

function Alert({ children }) {
  return (
    <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
      <span className="font-bold">!</span>
      <span>{children}</span>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
      <input
        {...props}
        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
      />
    </div>
  );
}

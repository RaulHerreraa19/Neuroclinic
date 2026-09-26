import { useEffect, useState } from 'react';
import Modal from './Modal';
import Avatar from './Avatar';
import { getAvailability } from '../api/doctors';
import { searchPatients } from '../api/patients';
import { createAppointmentForDoctor } from '../api/appointments';
import { registerPatientByStaff } from '../api/auth';
import { useToast } from '../context/ToastContext';

const emptyPatientForm = {
  nombre: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  telefono: '',
  email: '',
  fechaNacimiento: '',
  sexo: 'otro',
  avisoPrivacidadAceptado: false,
};

function formatLongDate(fecha) {
  if (!fecha) return '';
  const d = new Date(`${fecha}T00:00:00Z`);
  return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
}

// Modal para que el médico agende una cita desde su calendario: elige un horario libre de ese
// día y busca a un paciente ya registrado, o da de alta a uno nuevo, sin salir de la agenda.
export default function NewAppointmentModal({ open, onClose, doctorId, fecha, initialMinutes, onCreated }) {
  const { showToast } = useToast();
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [mode, setMode] = useState('existing');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientForm, setPatientForm] = useState(emptyPatientForm);
  const [motivoConsulta, setMotivoConsulta] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !doctorId || !fecha) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    getAvailability(doctorId, fecha, fecha)
      .then((data) => {
        const daySlots = data[0]?.slots || [];
        setSlots(daySlots);
        if (daySlots.length === 0) return;
        if (initialMinutes == null) {
          setSelectedSlot(daySlots[0]);
          return;
        }
        let closest = daySlots[0];
        let bestDiff = Infinity;
        for (const s of daySlots) {
          const [h, m] = s.horaInicio.slice(0, 5).split(':').map(Number);
          const diff = Math.abs(h * 60 + m - initialMinutes);
          if (diff < bestDiff) {
            bestDiff = diff;
            closest = s;
          }
        }
        setSelectedSlot(closest);
      })
      .finally(() => setLoadingSlots(false));
  }, [open, doctorId, fecha, initialMinutes]);

  useEffect(() => {
    if (open) return;
    setMode('existing');
    setQuery('');
    setResults([]);
    setSelectedPatient(null);
    setPatientForm(emptyPatientForm);
    setMotivoConsulta('');
    setError('');
  }, [open]);

  useEffect(() => {
    if (mode !== 'existing' || selectedPatient) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return undefined;
    }
    setSearching(true);
    const handle = setTimeout(() => {
      searchPatients(q)
        .then(setResults)
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [query, mode, selectedPatient]);

  const updatePatientField = (field) => (e) =>
    setPatientForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Elige un horario disponible.');
      return;
    }
    if (mode === 'existing' && !selectedPatient) {
      setError('Busca y selecciona un paciente.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      if (mode === 'existing') {
        await createAppointmentForDoctor({
          patientId: selectedPatient.id,
          fecha,
          horaInicio: selectedSlot.horaInicio,
          motivoConsulta,
        });
        showToast('Cita agendada.', { type: 'success' });
      } else {
        const data = await registerPatientByStaff({
          ...patientForm,
          appointment: { fecha, horaInicio: selectedSlot.horaInicio, motivoConsulta },
        });
        showToast(
          data.emailEnviado
            ? 'Paciente registrado y cita agendada. Le enviamos su contraseña por correo.'
            : 'Paciente registrado y cita agendada.',
          { type: 'success' }
        );
      }
      onCreated();
      onClose();
    } catch (err) {
      const message = err.response?.data?.error || 'No se pudo agendar la cita.';
      setError(message);
      showToast(message, { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Nueva cita" subtitle={formatLongDate(fecha)} maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Section title="Horario">
          {loadingSlots ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Cargando horarios disponibles...</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No tienes horarios disponibles este día.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => (
                <button
                  key={s.horaInicio}
                  type="button"
                  onClick={() => setSelectedSlot(s)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                    selectedSlot?.horaInicio === s.horaInicio
                      ? 'bg-navy-900 dark:bg-navy-700 text-white border-navy-900 dark:border-navy-700'
                      : 'bg-sand-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-navy-400 dark:hover:border-navy-500'
                  }`}
                >
                  {s.horaInicio.slice(0, 5)}
                </button>
              ))}
            </div>
          )}
        </Section>

        <div>
          <div className="flex gap-2 mb-3">
            <TabButton active={mode === 'existing'} onClick={() => setMode('existing')}>
              Paciente existente
            </TabButton>
            <TabButton active={mode === 'new'} onClick={() => setMode('new')}>
              Paciente nuevo
            </TabButton>
          </div>

          {mode === 'existing' ? (
            <div>
              <input
                type="text"
                placeholder="Buscar por nombre o correo..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedPatient(null);
                }}
                className="input-field"
              />
              {selectedPatient ? (
                <div className="mt-2 flex items-center gap-3 bg-navy-50 dark:bg-navy-900/40 rounded-lg p-3">
                  <Avatar nombre={selectedPatient.nombre} apellido={selectedPatient.apellidoPaterno} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-navy-900 dark:text-white text-sm truncate">
                      {selectedPatient.nombre} {selectedPatient.apellidoPaterno}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{selectedPatient.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPatient(null);
                      setQuery('');
                    }}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex-shrink-0"
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                  {searching && <p className="text-xs text-slate-400 dark:text-slate-500 px-1">Buscando...</p>}
                  {!searching && query.trim().length >= 2 && results.length === 0 && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 px-1">Sin resultados. Prueba "Paciente nuevo".</p>
                  )}
                  {results.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedPatient(p);
                        setResults([]);
                      }}
                      className="w-full flex items-center gap-3 text-left px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                    >
                      <Avatar nombre={p.nombre} apellido={p.apellidoPaterno} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm text-navy-900 dark:text-white truncate">
                          {p.nombre} {p.apellidoPaterno}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{p.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Nombre(s)" value={patientForm.nombre} onChange={updatePatientField('nombre')} required />
                <Field
                  label="Apellido paterno"
                  value={patientForm.apellidoPaterno}
                  onChange={updatePatientField('apellidoPaterno')}
                  required
                />
                <Field
                  label="Apellido materno"
                  value={patientForm.apellidoMaterno}
                  onChange={updatePatientField('apellidoMaterno')}
                />
                <Field label="Teléfono" value={patientForm.telefono} onChange={updatePatientField('telefono')} />
                <Field
                  label="Correo"
                  type="email"
                  value={patientForm.email}
                  onChange={updatePatientField('email')}
                  required
                />
                <Field
                  label="Fecha de nacimiento"
                  type="date"
                  value={patientForm.fechaNacimiento}
                  onChange={updatePatientField('fechaNacimiento')}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Sexo</label>
                  <select value={patientForm.sexo} onChange={updatePatientField('sexo')} className="input-field">
                    <option value="femenino">Femenino</option>
                    <option value="masculino">Masculino</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>
              <label className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300 bg-navy-50/60 dark:bg-navy-900/40 rounded-lg p-3">
                <input
                  type="checkbox"
                  checked={patientForm.avisoPrivacidadAceptado}
                  onChange={updatePatientField('avisoPrivacidadAceptado')}
                  className="mt-1 accent-navy-700"
                />
                <span>Confirmo que el paciente aceptó el aviso de privacidad (en persona o por teléfono).</span>
              </label>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
            Motivo de consulta (opcional)
          </label>
          <textarea value={motivoConsulta} onChange={(e) => setMotivoConsulta(e.target.value)} rows={2} className="input-field" />
        </div>

        {error && (
          <p className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-lg px-3 py-2.5">
            <span className="font-bold">!</span> {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !selectedSlot || (mode === 'new' && !patientForm.avisoPrivacidadAceptado)}
          className="btn-primary w-full sm:w-auto disabled:opacity-50"
        >
          {submitting ? 'Agendando...' : 'Agendar cita'}
        </button>
      </form>
    </Modal>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-navy-600 dark:text-navy-300 mb-2">{title}</p>
      {children}
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-lg text-sm font-medium border transition ${
        active
          ? 'bg-navy-900 dark:bg-navy-700 text-white border-navy-900 dark:border-navy-700'
          : 'bg-sand-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
      }`}
    >
      {children}
    </button>
  );
}

function Field({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{label}</label>
      <input {...props} className="input-field" />
    </div>
  );
}

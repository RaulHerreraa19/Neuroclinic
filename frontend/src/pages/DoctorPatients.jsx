import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listPatientsCatalog, updatePatient } from '../api/patients';
import { registerPatientByStaff } from '../api/auth';
import { useToast } from '../context/ToastContext';
import DoctorLayout from '../components/DoctorLayout';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { UserRound } from 'lucide-react';
import Avatar from '../components/Avatar';
import Modal from '../components/Modal';

const emptyNewPatient = {
  nombre: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  telefono: '',
  email: '',
  fechaNacimiento: '',
  sexo: 'otro',
  direccion: '',
  contactoEmergenciaNombre: '',
  contactoEmergenciaTelefono: '',
  avisoPrivacidadAceptado: false,
};

export default function DoctorPatients() {
  const { showToast } = useToast();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);

  const load = () => listPatientsCatalog().then(setPatients).finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const visibles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) =>
      `${p.nombre} ${p.apellidoPaterno} ${p.apellidoMaterno} ${p.email}`.toLowerCase().includes(q)
    );
  }, [patients, query]);

  return (
    <DoctorLayout>
      <PageHeader
        eyebrow="Vista médico"
        title="Pacientes"
        subtitle={`${patients.length} paciente${patients.length === 1 ? '' : 's'} registrado${patients.length === 1 ? '' : 's'}.`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              placeholder="Buscar por nombre o correo..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input-field w-full sm:w-56 text-sm"
            />
            <button type="button" onClick={() => setCreateOpen(true)} className="btn-primary text-sm whitespace-nowrap">
              + Nuevo paciente
            </button>
          </div>
        }
      />

      {loading && <p className="text-slate-500 dark:text-slate-400">Cargando...</p>}

      <div className="grid sm:grid-cols-2 gap-4">
        {visibles.map((p) => (
          <div key={p.id} className={`card-surface p-4 hover:shadow-md transition ${p.isActive ? '' : 'opacity-60'}`}>
            <div className="flex items-start gap-3">
              <Avatar nombre={p.nombre} apellido={p.apellidoPaterno} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-navy-900 dark:text-white truncate">
                    {p.nombre} {p.apellidoPaterno} {p.apellidoMaterno}
                  </p>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      p.isActive
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                        : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}
                  >
                    {p.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{p.email}</p>
                {p.telefono && <p className="text-sm text-slate-400 dark:text-slate-500 truncate">{p.telefono}</p>}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4 pl-14">
              <button
                type="button"
                onClick={() => setEditingPatient(p)}
                className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
              >
                Editar
              </button>
              <Link
                to={`/pacientes/${p.id}`}
                state={{ patientName: `${p.nombre} ${p.apellidoPaterno}` }}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline"
              >
                Expediente →
              </Link>
            </div>
          </div>
        ))}
        {!loading && visibles.length === 0 && (
          <div className="sm:col-span-2">
            <EmptyState icon={UserRound} message={query ? 'No hay pacientes que coincidan con tu búsqueda.' : 'Todavía no tienes pacientes registrados.'} />
          </div>
        )}
      </div>

      <CreatePatientModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          showToast('Paciente registrado.', { type: 'success' });
          load();
        }}
      />

      <EditPatientModal patient={editingPatient} onClose={() => setEditingPatient(null)} onSaved={load} />
    </DoctorLayout>
  );
}

function CreatePatientModal({ open, onClose, onCreated }) {
  const { showToast } = useToast();
  const [form, setForm] = useState(emptyNewPatient);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) setForm(emptyNewPatient);
  }, [open]);

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const data = await registerPatientByStaff(form);
      showToast(
        data.emailEnviado
          ? 'Paciente registrado. Le enviamos su contraseña por correo.'
          : 'Paciente registrado.',
        { type: 'success' }
      );
      onCreated();
      onClose();
    } catch (err) {
      const message = err.response?.data?.error || 'No se pudo registrar al paciente.';
      setError(message);
      showToast(message, { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo paciente"
      subtitle="Se le enviará una contraseña temporal por correo para que dé seguimiento a sus citas."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nombre(s)" value={form.nombre} onChange={update('nombre')} required />
          <Field label="Apellido paterno" value={form.apellidoPaterno} onChange={update('apellidoPaterno')} required />
          <Field label="Apellido materno" value={form.apellidoMaterno} onChange={update('apellidoMaterno')} />
          <Field label="Teléfono" value={form.telefono} onChange={update('telefono')} />
          <Field label="Correo" type="email" value={form.email} onChange={update('email')} required />
          <Field
            label="Fecha de nacimiento"
            type="date"
            value={form.fechaNacimiento}
            onChange={update('fechaNacimiento')}
            required
          />
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Sexo</label>
            <select value={form.sexo} onChange={update('sexo')} className="input-field">
              <option value="femenino">Femenino</option>
              <option value="masculino">Masculino</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>

        <Field label="Dirección (opcional)" value={form.direccion} onChange={update('direccion')} />
        <div className="grid sm:grid-cols-2 gap-4">
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

        <label className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300 bg-navy-50/60 dark:bg-navy-900/40 rounded-lg p-3">
          <input
            type="checkbox"
            checked={form.avisoPrivacidadAceptado}
            onChange={update('avisoPrivacidadAceptado')}
            className="mt-1 accent-navy-700"
          />
          <span>Confirmo que el paciente aceptó el aviso de privacidad (en persona o por teléfono).</span>
        </label>

        {error && <Alert>{error}</Alert>}

        <button type="submit" disabled={submitting || !form.avisoPrivacidadAceptado} className="btn-primary w-full sm:w-auto disabled:opacity-50">
          {submitting ? 'Registrando...' : 'Registrar paciente'}
        </button>
      </form>
    </Modal>
  );
}

function EditPatientModal({ patient, onClose, onSaved }) {
  const { showToast } = useToast();
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!patient) {
      setForm(null);
      return;
    }
    setForm({
      nombre: patient.nombre || '',
      apellidoPaterno: patient.apellidoPaterno || '',
      apellidoMaterno: patient.apellidoMaterno || '',
      telefono: patient.telefono || '',
      isActive: patient.isActive,
      direccion: patient.patientProfile?.direccion || '',
      contactoEmergenciaNombre: patient.patientProfile?.contactoEmergenciaNombre || '',
      contactoEmergenciaTelefono: patient.patientProfile?.contactoEmergenciaTelefono || '',
    });
    setError('');
  }, [patient]);

  if (!patient || !form) return <Modal open={false} onClose={onClose} />;

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await updatePatient(patient.id, form);
      showToast('Datos del paciente actualizados.', { type: 'success' });
      onSaved();
      onClose();
    } catch (err) {
      const message = err.response?.data?.error || 'No se pudo actualizar al paciente.';
      setError(message);
      showToast(message, { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={Boolean(patient)} onClose={onClose} title="Editar paciente" subtitle={patient.email}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nombre(s)" value={form.nombre} onChange={update('nombre')} required />
          <Field label="Apellido paterno" value={form.apellidoPaterno} onChange={update('apellidoPaterno')} required />
          <Field label="Apellido materno" value={form.apellidoMaterno} onChange={update('apellidoMaterno')} />
          <Field label="Teléfono" value={form.telefono} onChange={update('telefono')} />
        </div>

        <Field label="Dirección" value={form.direccion} onChange={update('direccion')} />
        <div className="grid sm:grid-cols-2 gap-4">
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

        <label className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
          <span className="text-sm text-slate-600 dark:text-slate-300">
            Paciente{' '}
            <span className="font-semibold text-navy-900 dark:text-white">{form.isActive ? 'activo' : 'inactivo'}</span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={form.isActive}
            onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
            className={`relative w-11 h-6 rounded-full transition ${form.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                form.isActive ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </label>

        {error && <Alert>{error}</Alert>}

        <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto disabled:opacity-50">
          {submitting ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </Modal>
  );
}

function Alert({ children }) {
  return (
    <p className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-lg px-3 py-2.5">
      <span className="font-bold">!</span> {children}
    </p>
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

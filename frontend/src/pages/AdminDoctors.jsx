import { useEffect, useState } from 'react';
import { createDoctor, listMyDoctors } from '../api/admin';
import { resolveUploadUrl } from '../api/client';
import { useToast } from '../context/ToastContext';
import Avatar from '../components/Avatar';
import AdminLayout from '../components/AdminLayout';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { Stethoscope } from 'lucide-react';
import Modal from '../components/Modal';

const emptyForm = {
  email: '',
  password: '',
  nombre: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  telefono: '',
  cedulaProfesional: '',
  especialidad: '',
  biografia: '',
  duracionCitaMinutos: 45,
};

export default function AdminDoctors() {
  const { showToast } = useToast();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => listMyDoctors().then(setDoctors).finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const doctor = await createDoctor({ ...form, duracionCitaMinutos: Number(form.duracionCitaMinutos) });
      showToast(`Doctor creado: ${doctor.nombre}`, { type: 'success' });
      setForm(emptyForm);
      setModalOpen(false);
      load();
    } catch (err) {
      const message = err.response?.data?.error || 'No se pudo crear el doctor.';
      setError(message);
      showToast(message, { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="Panel admin"
        title="Doctores"
        subtitle={`${doctors.length} doctor${doctors.length === 1 ? '' : 'es'} activo${doctors.length === 1 ? '' : 's'}.`}
        action={
          <button type="button" onClick={() => setModalOpen(true)} className="btn-primary text-sm">
            + Nuevo doctor
          </button>
        }
      />

      {loading && <p className="text-slate-500 dark:text-slate-400">Cargando...</p>}

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {doctors.map((d) => (
          <div key={d.id} className="flex gap-3 card-surface p-4 hover:shadow-md transition">
            <Avatar nombre={d.user?.nombre} apellido={d.user?.apellidoPaterno} src={resolveUploadUrl(d.user?.avatarUrl)} />
            <div className="min-w-0">
              <p className="font-semibold text-navy-900 dark:text-white truncate">
                {d.user?.nombre} {d.user?.apellidoPaterno} {d.user?.apellidoMaterno}
              </p>
              <p className="text-sm text-indigo-600 dark:text-indigo-400 truncate">{d.especialidad}</p>
              {d.biografia && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{d.biografia}</p>}
            </div>
          </div>
        ))}
        {!loading && doctors.length === 0 && (
          <div className="sm:col-span-2 xl:col-span-3">
            <EmptyState icon={Stethoscope} message="Todavía no hay doctores dados de alta." />
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Dar de alta un doctor"
        subtitle="Crea su cuenta y perfil profesional. Podrá configurar su horario al iniciar sesión."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nombre(s)" value={form.nombre} onChange={update('nombre')} required />
            <Field label="Apellido paterno" value={form.apellidoPaterno} onChange={update('apellidoPaterno')} required />
            <Field label="Apellido materno" value={form.apellidoMaterno} onChange={update('apellidoMaterno')} />
            <Field label="Teléfono" value={form.telefono} onChange={update('telefono')} />
            <Field label="Correo" type="email" value={form.email} onChange={update('email')} required />
            <Field
              label="Contraseña temporal"
              type="password"
              value={form.password}
              onChange={update('password')}
              required
              minLength={8}
            />
            <Field label="Cédula profesional" value={form.cedulaProfesional} onChange={update('cedulaProfesional')} required />
            <Field label="Especialidad" value={form.especialidad} onChange={update('especialidad')} required />
            <Field
              label="Duración de cita (minutos)"
              type="number"
              value={form.duracionCitaMinutos}
              onChange={update('duracionCitaMinutos')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              Biografía (opcional)
            </label>
            <textarea value={form.biografia} onChange={update('biografia')} rows={3} className="input-field" />
          </div>

          {error && (
            <p className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-lg px-3 py-2.5">
              <span className="font-bold">!</span> {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto disabled:opacity-50">
            {submitting ? 'Creando...' : 'Crear doctor'}
          </button>
        </form>
      </Modal>
    </AdminLayout>
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

import { useEffect, useState } from 'react';
import { createDoctor, listMyDoctors, setDoctorStatus, updateDoctor } from '../api/admin';
import { listCatalog } from '../api/priceCatalog';
import { resolveUploadUrl } from '../api/client';
import { useToast } from '../context/ToastContext';
import Avatar from '../components/Avatar';
import AdminLayout from '../components/AdminLayout';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import ServicePicker from '../components/ServicePicker';
import { Pencil, Power, Stethoscope } from 'lucide-react';
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
  servicioIds: [],
};

const FILTERS = [
  { value: 'activos', label: 'Activos' },
  { value: 'inactivos', label: 'Inactivos' },
  { value: 'todos', label: 'Todos' },
];

function formFromDoctor(d) {
  return {
    email: d.user?.email || '',
    password: '',
    nombre: d.user?.nombre || '',
    apellidoPaterno: d.user?.apellidoPaterno || '',
    apellidoMaterno: d.user?.apellidoMaterno || '',
    telefono: d.user?.telefono || '',
    cedulaProfesional: d.cedulaProfesional || '',
    especialidad: d.especialidad || '',
    biografia: d.biografia || '',
    duracionCitaMinutos: d.duracionCitaMinutos,
    servicioIds: (d.servicios || []).map((s) => s.id),
  };
}

export default function AdminDoctors() {
  const { showToast } = useToast();
  const [doctors, setDoctors] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('activos');
  // null = cerrado; { mode: 'create' } o { mode: 'edit', doctor }
  const [editor, setEditor] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => listMyDoctors().then(setDoctors).finally(() => setLoading(false));

  useEffect(() => {
    load();
    listCatalog().then(setCatalog).catch(() => setCatalog([]));
  }, []);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const openCreate = () => {
    setForm(emptyForm);
    setError('');
    setEditor({ mode: 'create' });
  };

  const openEdit = (doctor) => {
    setForm(formFromDoctor(doctor));
    setError('');
    setEditor({ mode: 'edit', doctor });
  };

  const isEdit = editor?.mode === 'edit';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const { password, ...rest } = form;
      const payload = { ...rest, duracionCitaMinutos: Number(form.duracionCitaMinutos) };
      if (isEdit) {
        await updateDoctor(editor.doctor.userId, payload);
        showToast('Doctor actualizado.', { type: 'success' });
      } else {
        const doctor = await createDoctor({ ...payload, password });
        showToast(`Doctor creado: ${doctor.nombre}`, { type: 'success' });
      }
      setEditor(null);
      load();
    } catch (err) {
      const data = err.response?.data;
      const message = data?.details?.[0]?.msg || data?.error || 'No se pudo guardar el doctor.';
      setError(message);
      showToast(message, { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    const target = statusTarget;
    const nextActive = !target.user.isActive;
    setSubmitting(true);
    try {
      await setDoctorStatus(target.userId, nextActive);
      showToast(nextActive ? 'Doctor reactivado.' : 'Doctor desactivado.', { type: 'success' });
      setStatusTarget(null);
      load();
    } catch (err) {
      showToast(err.response?.data?.error || 'No se pudo cambiar el estado.', { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const activeCount = doctors.filter((d) => d.user?.isActive).length;
  const visible = doctors.filter((d) =>
    filter === 'todos' ? true : filter === 'activos' ? d.user?.isActive : !d.user?.isActive
  );

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="Panel admin"
        title="Doctores"
        subtitle={`${activeCount} activo${activeCount === 1 ? '' : 's'} de ${doctors.length} registrado${doctors.length === 1 ? '' : 's'}.`}
        action={
          <button type="button" onClick={openCreate} className="btn-primary text-sm">
            + Nuevo doctor
          </button>
        }
      />

      <div className="flex gap-2 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition ${
              filter === f.value
                ? 'bg-navy-900 dark:bg-navy-700 text-white border-navy-900 dark:border-navy-700'
                : 'bg-sand-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-navy-300 dark:hover:border-navy-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-slate-500 dark:text-slate-400">Cargando...</p>}

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {visible.map((d) => {
          const active = d.user?.isActive;
          return (
            <div key={d.id} className={`card-surface p-4 flex flex-col gap-3 transition ${active ? 'hover:shadow-md' : 'opacity-70'}`}>
              <div className="flex gap-3">
                <Avatar nombre={d.user?.nombre} apellido={d.user?.apellidoPaterno} src={resolveUploadUrl(d.user?.avatarUrl)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-navy-900 dark:text-white truncate">
                      {d.user?.nombre} {d.user?.apellidoPaterno} {d.user?.apellidoMaterno}
                    </p>
                    <StatusBadge active={active} />
                  </div>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400 truncate">{d.especialidad}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Consulta de {d.duracionCitaMinutos} min · {d.citasFuturas} cita{d.citasFuturas === 1 ? '' : 's'} próxima{d.citasFuturas === 1 ? '' : 's'}
                  </p>
                </div>
              </div>

              {d.servicios?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {d.servicios.map((s) => (
                    <span key={s.id} className="text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                      {s.nombre}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2 mt-auto pt-3 border-t border-sand-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => openEdit(d)}
                  className="flex items-center gap-1.5 text-sm font-medium text-navy-700 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-900/40 px-3 py-1.5 rounded-lg transition"
                >
                  <Pencil size={14} aria-hidden="true" /> Editar
                </button>
                <button
                  type="button"
                  onClick={() => setStatusTarget(d)}
                  className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition ${
                    active
                      ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
                      : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                  }`}
                >
                  <Power size={14} aria-hidden="true" /> {active ? 'Desactivar' : 'Reactivar'}
                </button>
              </div>
            </div>
          );
        })}
        {!loading && visible.length === 0 && (
          <div className="sm:col-span-2 xl:col-span-3">
            <EmptyState
              icon={Stethoscope}
              message={doctors.length === 0 ? 'Todavía no hay doctores dados de alta.' : 'No hay doctores en este filtro.'}
            />
          </div>
        )}
      </div>

      <Modal
        open={Boolean(editor)}
        onClose={() => setEditor(null)}
        maxWidth="max-w-2xl"
        title={isEdit ? 'Editar doctor' : 'Dar de alta un doctor'}
        subtitle={
          isEdit
            ? 'Actualiza sus datos, su consulta y los servicios que ofrece.'
            : 'Crea su cuenta y perfil profesional. Podrá configurar su horario al iniciar sesión.'
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nombre(s)" value={form.nombre} onChange={update('nombre')} required />
            <Field label="Apellido paterno" value={form.apellidoPaterno} onChange={update('apellidoPaterno')} required />
            <Field label="Apellido materno" value={form.apellidoMaterno} onChange={update('apellidoMaterno')} />
            <Field label="Teléfono" value={form.telefono} onChange={update('telefono')} />
            <Field label="Correo" type="email" value={form.email} onChange={update('email')} required />
            {!isEdit && (
              <Field
                label="Contraseña temporal"
                type="password"
                value={form.password}
                onChange={update('password')}
                required
                minLength={8}
              />
            )}
            <Field label="Cédula profesional" value={form.cedulaProfesional} onChange={update('cedulaProfesional')} required />
            <Field label="Especialidad" value={form.especialidad} onChange={update('especialidad')} required />
            <Field
              label="Duración de consulta (minutos)"
              type="number"
              min={10}
              max={240}
              step={5}
              value={form.duracionCitaMinutos}
              onChange={update('duracionCitaMinutos')}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              Biografía (opcional)
            </label>
            <textarea value={form.biografia} onChange={update('biografia')} rows={3} className="input-field" />
          </div>
          <div>
            <p className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Servicios que ofrece</p>
            <ServicePicker
              catalog={catalog}
              selectedIds={form.servicioIds}
              onChange={(servicioIds) => setForm((f) => ({ ...f, servicioIds }))}
            />
          </div>

          {error && (
            <p className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-lg px-3 py-2.5">
              <span className="font-bold">!</span> {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto disabled:opacity-50">
            {submitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear doctor'}
          </button>
        </form>
      </Modal>

      <Modal
        open={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        title={statusTarget?.user?.isActive ? 'Desactivar doctor' : 'Reactivar doctor'}
      >
        {statusTarget && (
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
            {statusTarget.user.isActive ? (
              <>
                <p>
                  <strong className="text-navy-900 dark:text-white">
                    {statusTarget.user.nombre} {statusTarget.user.apellidoPaterno}
                  </strong>{' '}
                  ya no podrá iniciar sesión ni aparecerá para agendar citas. Su expediente, citas y cobros se conservan
                  (no se borra nada) y puedes reactivarlo cuando quieras.
                </p>
                {statusTarget.citasFuturas > 0 && (
                  <p className="bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    Tiene <strong>{statusTarget.citasFuturas}</strong> cita{statusTarget.citasFuturas === 1 ? '' : 's'} próxima
                    {statusTarget.citasFuturas === 1 ? '' : 's'} que <strong>no se cancelan automáticamente</strong>. Revisa la
                    sección de Citas para reasignarlas o avisar a los pacientes.
                  </p>
                )}
              </>
            ) : (
              <p>
                <strong className="text-navy-900 dark:text-white">
                  {statusTarget.user.nombre} {statusTarget.user.apellidoPaterno}
                </strong>{' '}
                podrá volver a iniciar sesión y aparecerá de nuevo para que los pacientes agenden con su horario actual.
              </p>
            )}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setStatusTarget(null)}
                className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-sand-100 dark:hover:bg-slate-700 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleToggleStatus}
                className={`px-4 py-2 rounded-lg text-white font-semibold transition disabled:opacity-50 ${
                  statusTarget.user.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {statusTarget.user.isActive ? 'Desactivar' : 'Reactivar'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className={`flex-shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
        active
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
          : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
      }`}
    >
      {active ? 'Activo' : 'Inactivo'}
    </span>
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

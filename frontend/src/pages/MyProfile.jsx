import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { changePassword, uploadAvatar } from '../api/auth';
import { getDoctor } from '../api/doctors';
import { resolveUploadUrl } from '../api/client';
import Avatar from '../components/Avatar';
import PageHeader from '../components/PageHeader';

const ROLE_LABELS = { admin: 'Administrador', medico: 'Médico', paciente: 'Paciente' };

export default function MyProfile() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState(null);

  useEffect(() => {
    if (user?.roles?.includes('medico')) {
      getDoctor(user.id).then((d) => setDoctorProfile(d.doctorProfile));
    }
  }, [user]);

  if (!user) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadAvatar(file);
      await refreshUser();
      showToast('Foto de perfil actualizada.', { type: 'success' });
    } catch (err) {
      showToast(err.response?.data?.error || 'No se pudo subir la imagen.', { type: 'error' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <PageHeader eyebrow="Tu cuenta" title="Mi perfil" subtitle="Datos personales, foto de perfil y contraseña." />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card-surface p-5 flex flex-col items-center text-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="relative group"
          >
            <Avatar nombre={user.nombre} apellido={user.apellidoPaterno} src={resolveUploadUrl(user.avatarUrl)} size="lg" />
            <span className="absolute inset-0 rounded-full bg-navy-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-semibold transition">
              {uploading ? '...' : 'Cambiar'}
            </span>
          </button>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} hidden />
          <p className="font-semibold text-navy-900 dark:text-white mt-3">
            {user.nombre} {user.apellidoPaterno}
          </p>
          <div className="flex flex-wrap justify-center gap-1.5 mt-2">
            {user.roles.map((r) => (
              <span
                key={r}
                className="text-[11px] font-medium bg-navy-50 text-navy-700 dark:bg-navy-800 dark:text-navy-100 px-2 py-0.5 rounded-full"
              >
                {ROLE_LABELS[r] || r}
              </span>
            ))}
          </div>
        </div>

        <div className="card-surface p-5">
          <h2 className="font-semibold text-navy-900 dark:text-white mb-3">Datos personales</h2>
          <dl className="space-y-2.5 text-sm">
            <Row label="Nombre completo" value={`${user.nombre} ${user.apellidoPaterno} ${user.apellidoMaterno || ''}`} />
            <Row label="Correo" value={user.email} />
            <Row label="Teléfono" value={user.telefono || '—'} />
          </dl>
        </div>

        {doctorProfile && (
          <div className="card-surface p-5">
            <h2 className="font-semibold text-navy-900 dark:text-white mb-3">Perfil profesional</h2>
            <dl className="space-y-2.5 text-sm">
              <Row label="Especialidad" value={doctorProfile.especialidad} />
              <Row label="Duración de cita" value={`${doctorProfile.duracionCitaMinutos} min`} />
            </dl>
          </div>
        )}

        <ChangePasswordCard />
      </div>
    </div>
  );
}

const EMPTY_PASSWORD_FORM = { currentPassword: '', newPassword: '', confirmPassword: '' };

function ChangePasswordCard() {
  const { showToast } = useToast();
  const [form, setForm] = useState(EMPTY_PASSWORD_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('Las contraseñas nuevas no coinciden.');
      return;
    }
    setSaving(true);
    try {
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm(EMPTY_PASSWORD_FORM);
      showToast('Contraseña actualizada.', { type: 'success' });
    } catch (err) {
      const data = err.response?.data;
      setError(data?.details?.[0]?.msg || data?.error || 'No se pudo cambiar la contraseña.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card-surface p-5 lg:col-span-3">
      <h2 className="font-semibold text-navy-900 dark:text-white mb-3">Cambiar contraseña</h2>
      <div className="grid sm:grid-cols-3 gap-3">
        <PasswordField label="Contraseña actual" name="currentPassword" value={form.currentPassword} onChange={handleChange} autoComplete="current-password" />
        <PasswordField label="Nueva contraseña" name="newPassword" value={form.newPassword} onChange={handleChange} autoComplete="new-password" />
        <PasswordField label="Repite la nueva contraseña" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} autoComplete="new-password" />
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400 mt-3">{error}</p>}
      <div className="flex justify-end mt-4">
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Guardando...' : 'Actualizar contraseña'}
        </button>
      </div>
    </form>
  );
}

function PasswordField({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{label}</label>
      <input type="password" required className="input-field" {...props} />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-2">
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-navy-900 dark:text-white text-right">{value}</dd>
    </div>
  );
}

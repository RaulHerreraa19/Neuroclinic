import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { uploadAvatar } from '../api/auth';
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
      <PageHeader eyebrow="Tu cuenta" title="Mi perfil" subtitle="Datos personales y foto de perfil." />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col items-center text-center">
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
          <p className="font-semibold text-navy-900 mt-3">
            {user.nombre} {user.apellidoPaterno}
          </p>
          <div className="flex flex-wrap justify-center gap-1.5 mt-2">
            {user.roles.map((r) => (
              <span key={r} className="text-[11px] font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                {ROLE_LABELS[r] || r}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-navy-900 mb-3">Datos personales</h2>
          <dl className="space-y-2.5 text-sm">
            <Row label="Nombre completo" value={`${user.nombre} ${user.apellidoPaterno} ${user.apellidoMaterno || ''}`} />
            <Row label="Correo" value={user.email} />
            <Row label="Teléfono" value={user.telefono || '—'} />
          </dl>
        </div>

        {doctorProfile && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="font-semibold text-navy-900 mb-3">Perfil profesional</h2>
            <dl className="space-y-2.5 text-sm">
              <Row label="Especialidad" value={doctorProfile.especialidad} />
              <Row label="Duración de cita" value={`${doctorProfile.duracionCitaMinutos} min`} />
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-navy-900 text-right">{value}</dd>
    </div>
  );
}

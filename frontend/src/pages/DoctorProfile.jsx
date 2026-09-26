import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDoctor } from '../api/doctors';
import SlotPicker from '../components/SlotPicker';
import Footer from '../components/Footer';

export default function DoctorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getDoctor(id).then(setDoctor);
  }, [id]);

  const handleContinue = () => {
    if (!selected) return;
    navigate('/booking', {
      state: { doctorId: id, doctorNombre: `${doctor.nombre} ${doctor.apellidoPaterno}`, ...selected },
    });
  };

  if (!doctor) return <div className="max-w-3xl mx-auto px-4 py-10 text-slate-500 dark:text-slate-400">Cargando...</div>;

  return (
    <div>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-4">
          <span className="w-14 h-14 flex-shrink-0 rounded-full bg-navy-800 dark:bg-navy-700 text-white text-lg font-semibold flex items-center justify-center">
            {doctor.nombre?.[0]}
            {doctor.apellidoPaterno?.[0]}
          </span>
          <div>
            <h1 className="text-2xl font-bold text-navy-900 dark:text-white">
              {doctor.nombre} {doctor.apellidoPaterno} {doctor.apellidoMaterno}
            </h1>
            <p className="text-indigo-600 dark:text-indigo-400">{doctor.doctorProfile?.especialidad}</p>
          </div>
        </div>
        {doctor.doctorProfile?.biografia && (
          <p className="text-slate-600 dark:text-slate-300 mt-4">{doctor.doctorProfile.biografia}</p>
        )}
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
          Consultas de {doctor.doctorProfile?.duracionCitaMinutos} minutos
        </p>
        {doctor.doctorProfile?.servicios?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {doctor.doctorProfile.servicios.map((s) => (
              <span
                key={s.id}
                className="text-sm bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full"
              >
                {s.nombre}
              </span>
            ))}
          </div>
        )}

        <h2 className="text-lg font-semibold text-navy-900 dark:text-white mt-8 mb-3">Elige un horario disponible</h2>
        <SlotPicker doctorId={id} selected={selected} onSelect={setSelected} />

        <button
          type="button"
          disabled={!selected}
          onClick={handleContinue}
          className="btn-primary mt-6 w-full sm:w-auto disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continuar con la cita
        </button>
      </div>
      <Footer />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDoctor } from '../api/doctors';
import SlotPicker from '../components/SlotPicker';

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

  if (!doctor) return <div className="max-w-3xl mx-auto px-4 py-10 text-slate-500">Cargando...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-4">
        <span className="w-14 h-14 flex-shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-400 text-white text-lg font-semibold flex items-center justify-center">
          {doctor.nombre?.[0]}
          {doctor.apellidoPaterno?.[0]}
        </span>
        <div>
          <h1 className="text-2xl font-bold text-navy-900">
            {doctor.nombre} {doctor.apellidoPaterno} {doctor.apellidoMaterno}
          </h1>
          <p className="text-indigo-600">{doctor.doctorProfile?.especialidad}</p>
        </div>
      </div>
      {doctor.doctorProfile?.biografia && <p className="text-slate-600 mt-4">{doctor.doctorProfile.biografia}</p>}

      <h2 className="text-lg font-semibold text-navy-900 mt-8 mb-3">Elige un horario disponible</h2>
      <SlotPicker doctorId={id} selected={selected} onSelect={setSelected} />

      <button
        type="button"
        disabled={!selected}
        onClick={handleContinue}
        className="mt-6 w-full sm:w-auto px-6 py-2.5 rounded-full bg-indigo-600 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 transition"
      >
        Continuar con la cita
      </button>
    </div>
  );
}

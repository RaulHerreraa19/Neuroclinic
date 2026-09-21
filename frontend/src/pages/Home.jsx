import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { listDoctors } from '../api/doctors';
import SlotPicker from '../components/SlotPicker';
import BookingStep from '../components/BookingStep';
import Modal from '../components/Modal';

const SERVICES = [
  {
    icon: '📋',
    title: 'Evaluación Cognitiva',
    description: 'Diagnóstico preciso de atención, memoria y funciones ejecutivas.',
  },
  {
    icon: '🧩',
    title: 'Terapia de Conducta',
    description: 'Intervención personalizada para el desarrollo y bienestar emocional.',
  },
  {
    icon: '💚',
    title: 'Neurorehabilitación',
    description: 'Acompañamiento clínico para recuperar el bienestar integral.',
  },
];

function doctorNombreCompleto(doctor) {
  return [doctor.nombre, doctor.apellidoPaterno, doctor.apellidoMaterno].filter(Boolean).join(' ');
}

function initials(doctor) {
  return `${doctor.nombre?.[0] || ''}${doctor.apellidoPaterno?.[0] || ''}`.toUpperCase();
}

export default function Home() {
  const location = useLocation();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    listDoctors()
      .then(setDoctors)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!location.hash) return;
    const el = document.querySelector(location.hash);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.hash]);

  const handleSelectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setSelectedSlot(null);
  };

  const scrollToAgenda = () => {
    document.getElementById('agenda')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-lavender-50">
        <div className="max-w-6xl mx-auto px-4 py-16 grid lg:grid-cols-[1.3fr_1fr] gap-10 items-center">
          <div className="animate-fade-in-up">
            <span className="inline-block bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              Ciencia que comprende
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-navy-900 mt-4 leading-tight">
              Rehabilitación Neuropsicológica para <span className="text-indigo-500">tu bienestar</span>
            </h1>
            <p className="text-slate-500 mt-4 max-w-lg">
              En NeuroClinic integramos ciencia, empatía y propósito. Ofrecemos evaluaciones precisas y
              terapias personalizadas para acompañarte en tu desarrollo cognitivo y emocional.
            </p>
            <button
              type="button"
              onClick={scrollToAgenda}
              className="mt-7 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-coral-500 text-white font-semibold shadow-lg shadow-coral-500/30 hover:bg-coral-600 hover:-translate-y-0.5 transition"
            >
              📅 Consultar Disponibilidad
            </button>
          </div>

          <div className="animate-fade-in-up rounded-3xl bg-indigo-100/70 p-10 flex flex-col items-center justify-center text-center min-h-[220px]">
            <span className="text-5xl">🧑‍🤝‍🧑</span>
            <p className="text-indigo-500 font-medium mt-4">Atención integral y empática</p>
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section id="servicios" className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid sm:grid-cols-3 gap-5">
          {SERVICES.map((service, i) => (
            <div
              key={service.title}
              style={{ animationDelay: `${i * 90}ms` }}
              className="animate-fade-in-up bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md hover:-translate-y-0.5 transition"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center text-xl">
                {service.icon}
              </div>
              <h3 className="font-semibold text-navy-900 mt-4">{service.title}</h3>
              <p className="text-slate-500 text-sm mt-1.5">{service.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Agenda */}
      <section id="agenda" className="bg-lavender-50 py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy-900">Agenda tu Evaluación</h2>
            <p className="text-slate-500 mt-2">
              Elige a tu doctor, selecciona un día en el calendario según su horario laboral y confirma. Si
              es tu primera vez, creamos tu cuenta y te enviamos tu contraseña por correo.
            </p>
          </div>

          <ol className="flex items-center justify-center gap-2 sm:gap-6 mt-8 text-sm">
            <StepPill n={1} label="Doctor" active={!selectedDoctor} done={Boolean(selectedDoctor)} />
            <Connector />
            <StepPill n={2} label="Fecha y hora" active={Boolean(selectedDoctor) && !selectedSlot} done={Boolean(selectedSlot)} />
            <Connector />
            <StepPill n={3} label="Confirmar" active={Boolean(selectedSlot)} done={false} />
          </ol>

          <div className="mt-8">
            {loading && <p className="text-slate-500 text-center">Cargando doctores...</p>}
            {!loading && doctors.length === 0 && (
              <p className="text-slate-500 text-center">Todavía no hay doctores disponibles.</p>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              {doctors.map((doctor, i) => {
                const isSelected = selectedDoctor?.id === doctor.id;
                return (
                  <button
                    key={doctor.id}
                    type="button"
                    onClick={() => handleSelectDoctor(doctor)}
                    style={{ animationDelay: `${i * 70}ms` }}
                    className={`animate-fade-in-up text-left rounded-2xl p-5 bg-white border shadow-sm transition flex gap-4 items-start ${
                      isSelected
                        ? 'border-indigo-500 ring-2 ring-indigo-200'
                        : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
                    }`}
                  >
                    <span className="w-11 h-11 flex-shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-400 text-white font-semibold flex items-center justify-center">
                      {initials(doctor)}
                    </span>
                    <div>
                      <p className="font-semibold text-navy-900">{doctorNombreCompleto(doctor)}</p>
                      <p className="text-indigo-600 text-sm mt-0.5">{doctor.doctorProfile?.especialidad}</p>
                      {doctor.doctorProfile?.biografia && (
                        <p className="text-slate-500 text-sm mt-2 line-clamp-2">{doctor.doctorProfile.biografia}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedDoctor && (
            <div className="mt-10 animate-fade-in-up">
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-500 text-sm">
                  Selecciona un día en el calendario para ver las horas disponibles de{' '}
                  <span className="font-medium text-navy-900">{doctorNombreCompleto(selectedDoctor)}</span>.
                </p>
                <button
                  type="button"
                  onClick={() => handleSelectDoctor(null)}
                  className="text-sm text-indigo-600 hover:underline whitespace-nowrap"
                >
                  Cambiar doctor
                </button>
              </div>
              <SlotPicker doctorId={selectedDoctor.id} selected={selectedSlot} onSelect={setSelectedSlot} />
            </div>
          )}
        </div>
      </section>

      <Modal
        open={Boolean(selectedDoctor && selectedSlot)}
        onClose={() => setSelectedSlot(null)}
        maxWidth="max-w-xl"
      >
        {selectedDoctor && selectedSlot && (
          <BookingStep
            doctorId={selectedDoctor.id}
            doctorNombre={doctorNombreCompleto(selectedDoctor)}
            fecha={selectedSlot.fecha}
            horaInicio={selectedSlot.horaInicio}
            onBack={() => setSelectedSlot(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function StepPill({ n, label, active, done }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition ${
          done
            ? 'bg-indigo-600 text-white'
            : active
            ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500'
            : 'bg-slate-100 text-slate-400'
        }`}
      >
        {done ? '✓' : n}
      </span>
      <span className={active || done ? 'text-navy-900 font-medium' : 'text-slate-400'}>{label}</span>
    </li>
  );
}

function Connector() {
  return <span className="w-6 sm:w-10 h-px bg-slate-300" aria-hidden="true" />;
}

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { listDoctors } from '../api/doctors';
import SlotPicker from '../components/SlotPicker';
import BookingStep from '../components/BookingStep';
import Modal from '../components/Modal';
import Footer from '../components/Footer';
import {
  Check,
  ClipboardList,
  Puzzle,
  HeartPulse,
  CalendarCheck,
  ShieldCheck,
  Award,
  Users,
} from 'lucide-react';

const SERVICES = [
  {
    icon: ClipboardList,
    iconBg: 'bg-navy-50 dark:bg-navy-800 text-navy-700 dark:text-navy-100',
    title: 'Evaluación Cognitiva',
    description: 'Diagnóstico preciso de atención, memoria y funciones ejecutivas.',
  },
  {
    icon: Puzzle,
    iconBg: 'bg-coral-400/10 dark:bg-coral-500/20 text-coral-600 dark:text-coral-400',
    title: 'Terapia de Conducta',
    description: 'Intervención personalizada para el desarrollo y bienestar emocional.',
  },
  {
    icon: HeartPulse,
    iconBg: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    title: 'Neurorehabilitación',
    description: 'Acompañamiento clínico para recuperar el bienestar integral.',
  },
];

const CREDENTIALS = [
  { icon: ShieldCheck, label: 'Cumplimiento NOM-024' },
  { icon: Award, label: 'Evaluaciones basadas en evidencia' },
  { icon: Users, label: 'Atención personalizada' },
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
      <section className="bg-sand-200 dark:bg-navy-900">
        <div className="max-w-6xl mx-auto px-4 py-16 grid lg:grid-cols-[1.3fr_1fr] gap-10 items-center">
          <div className="animate-fade-in-up">
            <span className="badge-eyebrow">Ciencia que comprende</span>
            <h1 className="text-4xl sm:text-5xl font-bold text-navy-900 dark:text-white mt-4 leading-tight tracking-tight">
              Rehabilitación Neuropsicológica para <span className="text-indigo-600 dark:text-indigo-400">tu bienestar</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-300 mt-4 max-w-lg">
              En NeuroClinic integramos ciencia, empatía y propósito. Ofrecemos evaluaciones precisas y
              terapias personalizadas para acompañarte en tu desarrollo cognitivo y emocional.
            </p>
            <button type="button" onClick={scrollToAgenda} className="btn-cta mt-7">
              <CalendarCheck size={18} aria-hidden="true" /> Consultar Disponibilidad
            </button>
          </div>

          <div className="animate-fade-in-up rounded-xl bg-navy-900 dark:bg-navy-950 text-white p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">Atención integral y empática</p>
            <div className="mt-5 space-y-4">
              {CREDENTIALS.map((c) => (
                <div key={c.label} className="flex items-center gap-3">
                  <span className="w-9 h-9 flex-shrink-0 rounded-lg bg-white/10 flex items-center justify-center">
                    <c.icon size={18} aria-hidden="true" />
                  </span>
                  <p className="text-sm font-medium">{c.label}</p>
                </div>
              ))}
            </div>
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
              className="animate-fade-in-up card-surface p-6 hover:shadow-md transition"
            >
              <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${service.iconBg}`}>
                <service.icon size={20} aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-navy-900 dark:text-white mt-4">{service.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5">{service.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Agenda */}
      <section id="agenda" className="bg-sand-200 dark:bg-navy-900 py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 dark:text-white tracking-tight">
              Agenda tu Evaluación
            </h2>
            <p className="text-slate-500 dark:text-slate-300 mt-2">
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
            {loading && <p className="text-slate-500 dark:text-slate-400 text-center">Cargando doctores...</p>}
            {!loading && doctors.length === 0 && (
              <p className="text-slate-500 dark:text-slate-400 text-center">Todavía no hay doctores disponibles.</p>
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
                    className={`animate-fade-in-up text-left rounded-xl p-5 bg-sand-50 dark:bg-slate-800 border shadow-sm transition flex gap-4 items-start ${
                      isSelected
                        ? 'border-navy-700 dark:border-navy-400 ring-2 ring-navy-100 dark:ring-navy-800'
                        : 'border-slate-200 dark:border-slate-700 hover:border-navy-300 dark:hover:border-navy-600 hover:shadow-md'
                    }`}
                  >
                    <span className="w-11 h-11 flex-shrink-0 rounded-full bg-navy-800 dark:bg-navy-700 text-white font-semibold flex items-center justify-center">
                      {initials(doctor)}
                    </span>
                    <div>
                      <p className="font-semibold text-navy-900 dark:text-white">{doctorNombreCompleto(doctor)}</p>
                      <p className="text-indigo-600 dark:text-indigo-400 text-sm mt-0.5">
                        {doctor.doctorProfile?.especialidad}
                      </p>
                      {doctor.doctorProfile?.biografia && (
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 line-clamp-2">
                          {doctor.doctorProfile.biografia}
                        </p>
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
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Selecciona un día en el calendario para ver las horas disponibles de{' '}
                  <span className="font-medium text-navy-900 dark:text-white">{doctorNombreCompleto(selectedDoctor)}</span>.
                </p>
                <button
                  type="button"
                  onClick={() => handleSelectDoctor(null)}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap"
                >
                  Cambiar doctor
                </button>
              </div>
              <SlotPicker doctorId={selectedDoctor.id} selected={selectedSlot} onSelect={setSelectedSlot} />
            </div>
          )}
        </div>
      </section>

      <Footer />

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
            ? 'bg-navy-900 dark:bg-navy-700 text-white'
            : active
            ? 'bg-navy-100 dark:bg-navy-800 text-navy-700 dark:text-navy-200 ring-2 ring-navy-700 dark:ring-navy-500'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
        }`}
      >
        {done ? <Check size={14} aria-hidden="true" /> : n}
      </span>
      <span className={active || done ? 'text-navy-900 dark:text-white font-medium' : 'text-slate-400 dark:text-slate-500'}>
        {label}
      </span>
    </li>
  );
}

function Connector() {
  return <span className="w-6 sm:w-10 h-px bg-slate-300 dark:bg-slate-700" aria-hidden="true" />;
}

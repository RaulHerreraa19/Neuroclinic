import { useNavigate, useLocation } from 'react-router-dom';
import BookingStep from '../components/BookingStep';

// Punto de entrada por enlace directo (p. ej. desde el perfil de un doctor). El flujo principal
// de agendado vive integrado en la página de inicio (Home.jsx), dentro de un modal.
export default function Booking() {
  const location = useLocation();
  const navigate = useNavigate();
  const { doctorId, doctorNombre, fecha, horaInicio } = location.state || {};

  if (!doctorId || !fecha || !horaInicio) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center">
          <p className="text-slate-600">
            Primero elige un doctor y un horario disponible desde la página principal.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-5 py-2.5 rounded-full bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
          >
            Ir a elegir doctor
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <BookingStep
          doctorId={doctorId}
          doctorNombre={doctorNombre || 'tu doctor'}
          fecha={fecha}
          horaInicio={horaInicio}
          onBack={() => navigate(-1)}
        />
      </div>
    </div>
  );
}

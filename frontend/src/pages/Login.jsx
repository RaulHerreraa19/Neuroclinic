import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// Orden de prioridad cuando un usuario tiene varios roles: admin > médico > paciente.
const ROLE_PRIORITY = [
  ['admin', '/admin/panel'],
  ['medico', '/agenda'],
  ['paciente', '/mis-citas'],
];

function homeForRoles(roles = []) {
  const match = ROLE_PRIORITY.find(([role]) => roles.includes(role));
  return match ? match[1] : '/';
}

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const user = await login({ email, password });
      showToast('¡Bienvenido de vuelta!', { type: 'success' });
      navigate(homeForRoles(user.roles));
    } catch (err) {
      const message = err.response?.data?.error || 'No se pudo iniciar sesión.';
      setError(message);
      showToast(message, { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] bg-lavender-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg border border-slate-100 p-8 animate-fade-in-up">
        <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-400 flex items-center justify-center text-white font-bold mx-auto">
          NC
        </span>
        <h1 className="text-xl font-bold text-navy-900 mb-1 mt-4 text-center">Iniciar sesión</h1>
        <p className="text-slate-500 text-sm text-center mb-6">Accede para dar seguimiento a tus citas.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Correo electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
            />
          </div>
          {error && (
            <p className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
              <span className="font-bold">!</span> {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full px-5 py-2.5 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

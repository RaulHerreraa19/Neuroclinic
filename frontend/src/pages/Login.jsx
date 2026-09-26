import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Footer from '../components/Footer';
import Logo from '../components/Logo';

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
    <div>
    <div className="min-h-[80vh] bg-sand-200 dark:bg-navy-900 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm panel-elevated border border-slate-100 dark:border-slate-700 p-8 animate-fade-in-up">
        <Logo className="w-12 h-12 rounded-full mx-auto" />
        <h1 className="text-xl font-bold text-navy-900 dark:text-white mb-1 mt-4 text-center">Iniciar sesión</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-6">
          Accede para dar seguimiento a tus citas.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              Correo electrónico
            </label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
            />
          </div>
          {error && (
            <p className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-lg px-3 py-2.5">
              <span className="font-bold">!</span> {error}
            </p>
          )}
          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
    <Footer />
    </div>
  );
}

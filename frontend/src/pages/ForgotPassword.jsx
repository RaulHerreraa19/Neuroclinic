import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { requestPasswordReset, confirmPasswordReset } from '../api/auth';
import Footer from '../components/Footer';
import Logo from '../components/Logo';
import { homeForRoles } from './Login';

function ErrorMessage({ children }) {
  return (
    <p className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-lg px-3 py-2.5">
      <span className="font-bold">!</span> {children}
    </p>
  );
}

function errorText(err, fallback) {
  const data = err.response?.data;
  return data?.details?.[0]?.msg || data?.error || fallback;
}

// Dos pasos: 1) correo o celular → se envía un código de 6 dígitos (por correo o SMS según lo
// que se escribió); 2) código + contraseña nueva → queda con sesión iniciada.
export default function ForgotPassword() {
  const { refreshUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState('request');
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const viaSms = !identifier.includes('@');

  const handleRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const data = await requestPasswordReset(identifier.trim());
      setInfo(data.message);
      setStep('confirm');
    } catch (err) {
      setError(errorText(err, 'No se pudo enviar el código.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setSubmitting(true);
    try {
      await confirmPasswordReset({ identifier: identifier.trim(), code: code.trim(), newPassword });
      const user = await refreshUser();
      showToast('Listo, tu contraseña se actualizó.', { type: 'success' });
      navigate(homeForRoles(user.roles));
    } catch (err) {
      setError(errorText(err, 'No se pudo cambiar la contraseña.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="min-h-[80vh] bg-sand-200 dark:bg-navy-900 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm panel-elevated border border-slate-100 dark:border-slate-700 p-8 animate-fade-in-up">
          <Logo className="w-12 h-12 rounded-full mx-auto" />
          <h1 className="text-xl font-bold text-navy-900 dark:text-white mb-1 mt-4 text-center">Recuperar contraseña</h1>

          {step === 'request' ? (
            <>
              <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-6">
                Escribe tu correo o tu celular. Te enviaremos un código para crear una contraseña nueva.
              </p>
              <form onSubmit={handleRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Correo o celular (10 dígitos)
                  </label>
                  <input
                    required
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="input-field"
                    placeholder="tu@correo.com o 3121234567"
                  />
                </div>
                {error && <ErrorMessage>{error}</ErrorMessage>}
                <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
                  {submitting ? 'Enviando...' : 'Enviar código'}
                </button>
              </form>
            </>
          ) : (
            <>
              <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-6">
                {info} {viaSms ? 'El SMS puede tardar un par de minutos.' : ''}
              </p>
              <form onSubmit={handleConfirm} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Código de 6 dígitos
                  </label>
                  <input
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    pattern="\d{6}"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    className="input-field tracking-[0.4em] text-center font-mono text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Contraseña nueva (mínimo 8 caracteres)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Repite la contraseña
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field"
                  />
                </div>
                {error && <ErrorMessage>{error}</ErrorMessage>}
                <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
                  {submitting ? 'Guardando...' : 'Cambiar contraseña'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep('request');
                    setCode('');
                    setError('');
                  }}
                  className="w-full text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  No me llegó el código / usar otro dato
                </button>
              </form>
            </>
          )}

          <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-6">
            ¿No tienes acceso ni a tu correo ni a tu celular? Comunícate con la clínica y te daremos una contraseña
            temporal.
          </p>
          <p className="text-center mt-3">
            <Link to="/login" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
              Volver a iniciar sesión
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

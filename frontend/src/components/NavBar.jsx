import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { resolveUploadUrl } from '../api/client';
import Avatar from './Avatar';
import ThemeToggle from './ThemeToggle';

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-navy-900 dark:text-white">
          <span className="w-9 h-9 rounded-lg bg-navy-900 dark:bg-navy-700 flex items-center justify-center text-white text-sm shadow-sm">
            NC
          </span>
          NeuroClinic
        </Link>

        <div className="flex items-center gap-1 sm:gap-2 text-sm">
          {!user && (
            <>
              <NavLink to="/">Inicio</NavLink>
              <NavLink to="/#servicios">Servicios</NavLink>
              <NavLink to="/#agenda" pill>
                Agendar Cita
              </NavLink>
            </>
          )}
          {user?.roles?.includes('paciente') && <NavLink to="/mis-citas">Mis citas</NavLink>}
          {user?.roles?.includes('medico') && <NavLink to="/agenda">Mi panel</NavLink>}
          {user?.roles?.includes('admin') && (
            <>
              <NavLink to="/admin/panel">Panel</NavLink>
              <NavLink to="/admin/doctores">Doctores</NavLink>
              <NavLink to="/admin/citas">Citas</NavLink>
            </>
          )}

          <ThemeToggle />

          {!user ? (
            <Link
              to="/login"
              className="ml-1 sm:ml-2 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-navy-900 dark:bg-navy-700 text-white font-medium hover:bg-navy-700 dark:hover:bg-navy-600 transition"
            >
              <LogIn size={15} aria-hidden="true" /> Iniciar Sesión
            </Link>
          ) : (
            <UserMenu user={user} onLogout={handleLogout} />
          )}
        </div>
      </div>
    </nav>
  );
}

function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative ml-1 sm:ml-2" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
      >
        <Avatar nombre={user.nombre} apellido={user.apellidoPaterno} src={resolveUploadUrl(user.avatarUrl)} size="sm" />
        <span className="hidden sm:inline text-slate-700 dark:text-slate-200 font-medium max-w-[8rem] truncate">
          {user.nombre}
        </span>
        <ChevronDown size={14} aria-hidden="true" className="text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-lg py-1.5 animate-fade-in-up">
          <Link
            to="/perfil"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-navy-900 dark:hover:text-white transition"
          >
            Mi perfil
          </Link>
          <button
            onClick={onLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
          >
            Salir
          </button>
        </div>
      )}
    </div>
  );
}

function NavLink({ to, children, pill }) {
  return (
    <Link
      to={to}
      className={
        pill
          ? 'px-4 py-2 rounded-lg bg-navy-50 text-navy-700 dark:bg-navy-800 dark:text-navy-100 font-medium hover:bg-navy-100 dark:hover:bg-navy-700 transition'
          : 'px-3 py-2 rounded-md text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition'
      }
    >
      {children}
    </Link>
  );
}

import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/agenda', label: 'Citas', icon: '🗓️' },
  { to: '/pacientes', label: 'Pacientes', icon: '🧑‍⚕️' },
  { to: '/horario', label: 'Horario', icon: '⏰' },
];

const DISABLED_NAV_ITEMS = [{ label: 'Seguimiento', icon: '📋', badge: 'Próximamente' }];

// Nav lateral persistente para el área de trabajo del médico (citas, pacientes, horario).
export default function DoctorLayout({ children }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-6">
      <aside className="md:w-52 flex-shrink-0">
        <nav className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-visible pb-2 md:pb-0 md:sticky md:top-20">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white hover:text-indigo-700'
                }`
              }
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
          {DISABLED_NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              type="button"
              disabled
              title={item.badge}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap text-slate-400 cursor-not-allowed"
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
              <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                {item.badge}
              </span>
            </button>
          ))}
        </nav>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/admin/panel', label: 'Panel', icon: '📊' },
  { to: '/admin/doctores', label: 'Doctores', icon: '🩺' },
  { to: '/admin/citas', label: 'Citas', icon: '🗓️' },
  { to: '/admin/catalogo-precios', label: 'Catálogo de precios', icon: '💲' },
];

// Nav lateral persistente para el área de trabajo del admin: solo sus propios doctores,
// nunca un listado de pacientes (el admin no gestiona pacientes en este MVP).
export default function AdminLayout({ children }) {
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
        </nav>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

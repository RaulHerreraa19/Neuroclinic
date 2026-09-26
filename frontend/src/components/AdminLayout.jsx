import { NavLink } from 'react-router-dom';
import { BarChart3, CalendarDays, DollarSign, Stethoscope } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/admin/panel', label: 'Panel', icon: BarChart3 },
  { to: '/admin/doctores', label: 'Doctores', icon: Stethoscope },
  { to: '/admin/citas', label: 'Citas', icon: CalendarDays },
  { to: '/admin/catalogo-precios', label: 'Catálogo de precios', icon: DollarSign },
];

// Nav lateral persistente para el área de trabajo del admin: solo sus propios doctores,
// nunca un listado de pacientes (el admin no gestiona pacientes en este MVP).
export default function AdminLayout({ children }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-6">
      <aside className="md:w-52 flex-shrink-0">
        <nav className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-visible pb-2 md:pb-0 md:sticky md:top-20 bg-sand-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  isActive
                    ? 'bg-navy-900 dark:bg-navy-700 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-navy-900 dark:hover:text-white'
                }`
              }
            >
              <item.icon size={16} aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

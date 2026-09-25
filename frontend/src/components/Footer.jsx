import { Link } from 'react-router-dom';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';

// Footer estático para las páginas públicas — sin lógica, solo cierre visual/institucional.
// Los datos de contacto/horario son placeholder hasta que la clínica los confirme.
export default function Footer() {
  return (
    <footer className="bg-navy-900 dark:bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 font-bold">
            <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm">NC</span>
            NeuroClinic
          </div>
          <p className="text-sm text-slate-300 dark:text-slate-400 mt-3 max-w-xs">
            Rehabilitación neuropsicológica con ciencia, empatía y propósito.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Contacto</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-300 dark:text-slate-400">
            <li className="flex items-center gap-2">
              <Phone size={14} aria-hidden="true" /> (55) 0000 0000
            </li>
            <li className="flex items-center gap-2">
              <Mail size={14} aria-hidden="true" /> contacto@neuroclinic.test
            </li>
            <li className="flex items-center gap-2">
              <MapPin size={14} aria-hidden="true" /> Ciudad de México, México
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Horario de atención</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-300 dark:text-slate-400">
            <li className="flex items-center gap-2">
              <Clock size={14} aria-hidden="true" /> Lunes a viernes: 9:00–18:00
            </li>
            <li className="flex items-center gap-2">
              <Clock size={14} aria-hidden="true" /> Sábados: 9:00–13:00
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Legal</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-300 dark:text-slate-400">
            <li>
              <Link to="/#" className="hover:text-white transition">
                Aviso de Privacidad
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-navy-700 dark:border-slate-800">
        <p className="max-w-6xl mx-auto px-4 py-4 text-xs text-slate-400 text-center">
          © {new Date().getFullYear()} NeuroClinic. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}

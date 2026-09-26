import { Check } from 'lucide-react';

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

// Selección múltiple de servicios del catálogo de la clínica (admin al editar un doctor, o el
// propio doctor al configurar su consulta).
export default function ServicePicker({ catalog, selectedIds, onChange }) {
  if (catalog.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400 bg-sand-100 dark:bg-slate-900/40 rounded-lg p-3">
        La clínica todavía no tiene servicios en su catálogo de precios.
      </p>
    );
  }

  const toggle = (id) =>
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);

  return (
    <div className="grid sm:grid-cols-2 gap-2">
      {catalog.map((item) => {
        const checked = selectedIds.includes(item.id);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => toggle(item.id)}
            aria-pressed={checked}
            className={`flex items-center gap-3 text-left rounded-lg border px-3 py-2.5 text-sm transition ${
              checked
                ? 'border-navy-700 bg-navy-50 dark:bg-navy-900/50 dark:border-navy-400'
                : 'border-sand-300 dark:border-slate-600 hover:border-navy-300 dark:hover:border-navy-500'
            }`}
          >
            <span
              className={`w-5 h-5 flex-shrink-0 rounded-md flex items-center justify-center border ${
                checked ? 'bg-navy-900 border-navy-900 text-white dark:bg-navy-600 dark:border-navy-600' : 'border-slate-300 dark:border-slate-500'
              }`}
            >
              {checked && <Check size={13} aria-hidden="true" />}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-medium text-navy-900 dark:text-white truncate">{item.nombre}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">{money.format(Number(item.precio))}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

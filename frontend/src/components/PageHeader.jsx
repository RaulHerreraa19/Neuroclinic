// Encabezado consistente para las páginas de catálogo (admin y médico): título navy,
// texto de apoyo y un slot a la derecha para la acción principal (botón, buscador, etc.).
export default function PageHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
      <div>
        {eyebrow && <span className="badge-eyebrow mb-2">{eyebrow}</span>}
        <h1 className="text-2xl font-bold text-navy-900 dark:text-white">{title}</h1>
        {subtitle && <p className="text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

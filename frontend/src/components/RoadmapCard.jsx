// Tarjeta de roadmap: marca funcionalidad planeada pero no construida todavía. Sin lógica de
// negocio — solo comunica que está en el radar, hasta que llegue el diseño/esquema definitivo.
export default function RoadmapCard({ icon: Icon, title, description }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 p-4">
      <div className="flex items-start gap-3">
        {Icon && <Icon size={20} className="text-slate-400 dark:text-slate-500 flex-shrink-0 mt-0.5" aria-hidden="true" />}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-navy-900 dark:text-white">{title}</p>
            <span className="text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
              Próximamente
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}

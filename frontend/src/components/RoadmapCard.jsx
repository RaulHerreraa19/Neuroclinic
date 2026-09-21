// Tarjeta de roadmap: marca funcionalidad planeada pero no construida todavía. Sin lógica de
// negocio — solo comunica que está en el radar, hasta que llegue el diseño/esquema definitivo.
export default function RoadmapCard({ icon, title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4">
      <div className="flex items-start gap-3">
        <span className="text-xl" aria-hidden="true">
          {icon}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-navy-900">{title}</p>
            <span className="text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
              Próximamente
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}

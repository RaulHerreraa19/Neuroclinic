export default function EmptyState({ icon = '📭', message }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-4 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
      <span className="text-4xl mb-3">{icon}</span>
      <p className="text-sm max-w-xs">{message}</p>
    </div>
  );
}

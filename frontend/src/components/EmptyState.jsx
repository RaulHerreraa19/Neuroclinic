import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, message }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-4 text-slate-400 dark:text-slate-500 bg-sand-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
      <Icon size={32} className="mb-3" aria-hidden="true" />
      <p className="text-sm max-w-xs">{message}</p>
    </div>
  );
}

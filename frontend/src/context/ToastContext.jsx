import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);
let idCounter = 0;

const ICONS = { success: '✓', error: '!', info: 'i' };
const STYLES = {
  success: 'bg-emerald-600',
  error: 'bg-red-600',
  info: 'bg-navy-800',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message, { type = 'info', duration = 4500 } = {}) => {
      const id = ++idCounter;
      setToasts((current) => [...current, { id, message, type }]);
      if (duration) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast, dismiss }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto animate-slide-in-right rounded-xl shadow-lg text-white px-4 py-3 flex items-start gap-3 ${
              STYLES[toast.type] || STYLES.info
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
              {ICONS[toast.type] || ICONS.info}
            </span>
            <span className="flex-1 text-sm font-medium leading-snug">{toast.message}</span>
            <button
              onClick={() => dismiss(toast.id)}
              className="text-white/70 hover:text-white leading-none text-lg"
              aria-label="Cerrar aviso"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>.');
  return ctx;
}

import { useEffect, useState } from 'react';
import { listCatalog } from '../api/priceCatalog';
import { chargeAppointment } from '../api/appointments';
import { useToast } from '../context/ToastContext';
import Modal from './Modal';

const PRECIO_SUGERIDO_DEFAULT = 500;

// Cobro de una consulta ya completada: sugiere el ítem marcado como default del catálogo del
// admin dueño de la clínica, o $500 MXN si todavía no hay catálogo cargado.
export default function ChargeAppointmentModal({ open, onClose, appointment, onCharged }) {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [priceCatalogItemId, setPriceCatalogItemId] = useState('');
  const [monto, setMonto] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    listCatalog().then((catalog) => {
      setItems(catalog);
      const defaultItem = catalog.find((i) => i.esDefault);
      if (defaultItem) {
        setPriceCatalogItemId(defaultItem.id);
        setMonto('');
      } else {
        setPriceCatalogItemId('');
        setMonto(String(PRECIO_SUGERIDO_DEFAULT));
      }
    });
  }, [open]);

  const handleItemChange = (e) => {
    const value = e.target.value;
    setPriceCatalogItemId(value);
    if (value) setMonto('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await chargeAppointment(appointment.id, {
        ...(priceCatalogItemId ? { priceCatalogItemId } : { monto: Number(monto) }),
        metodoPago,
      });
      showToast('Cobro registrado.', { type: 'success' });
      onCharged?.();
      onClose();
    } catch (err) {
      const message = err.response?.data?.error || 'No se pudo registrar el cobro.';
      setError(message);
      showToast(message, { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Cobrar consulta" subtitle="Registra el pago de esta cita completada." maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Concepto</label>
          <select value={priceCatalogItemId} onChange={handleItemChange} className="input-field">
            <option value="">Monto libre</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nombre} — ${Number(item.precio).toFixed(2)}
              </option>
            ))}
          </select>
        </div>

        {!priceCatalogItemId && (
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Monto (MXN)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder={`Sugerido: $${PRECIO_SUGERIDO_DEFAULT} MXN`}
              className="input-field"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Método de pago</label>
          <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} className="input-field">
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="transferencia">Transferencia</option>
          </select>
        </div>

        {error && (
          <p className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-lg px-3 py-2.5">
            <span className="font-bold">!</span> {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full !bg-emerald-600 hover:!bg-emerald-700 disabled:opacity-50"
        >
          {submitting ? 'Registrando...' : 'Registrar cobro'}
        </button>
      </form>
    </Modal>
  );
}

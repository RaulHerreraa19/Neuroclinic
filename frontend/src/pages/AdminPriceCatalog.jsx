import { useEffect, useState } from 'react';
import { listCatalog, createItem, updateItem, deactivateItem } from '../api/priceCatalog';
import { useToast } from '../context/ToastContext';
import AdminLayout from '../components/AdminLayout';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';

const emptyForm = { nombre: '', precio: '', esDefault: false };

export default function AdminPriceCatalog() {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => listCatalog().then(setItems).finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const update = (field) => (e) => {
    const value = field === 'esDefault' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await createItem({ ...form, precio: Number(form.precio) });
      showToast('Ítem de catálogo creado.', { type: 'success' });
      setForm(emptyForm);
      setModalOpen(false);
      load();
    } catch (err) {
      const message = err.response?.data?.error || 'No se pudo crear el ítem.';
      setError(message);
      showToast(message, { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefault = async (item) => {
    await updateItem(item.id, { esDefault: true });
    showToast(`"${item.nombre}" ahora es el precio sugerido.`, { type: 'success' });
    load();
  };

  const handleDeactivate = async (item) => {
    await deactivateItem(item.id);
    showToast('Ítem desactivado.', { type: 'success' });
    load();
  };

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="Panel admin"
        title="Catálogo de precios"
        subtitle="Precios que tus doctores pueden elegir al cobrar una consulta."
        action={
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
          >
            + Nuevo ítem
          </button>
        }
      />

      {loading && <p className="text-slate-500">Cargando...</p>}

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-navy-900">{item.nombre}</p>
              {item.esDefault && (
                <span className="text-[10px] font-semibold uppercase tracking-wide bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  Sugerido
                </span>
              )}
            </div>
            <p className="text-xl font-bold text-indigo-600 mt-1">${Number(item.precio).toFixed(2)}</p>
            <div className="flex items-center gap-3 mt-3 text-sm">
              {!item.esDefault && (
                <button type="button" onClick={() => handleSetDefault(item)} className="text-indigo-600 font-medium hover:underline">
                  Marcar como sugerido
                </button>
              )}
              <button type="button" onClick={() => handleDeactivate(item)} className="text-red-600 font-medium hover:underline">
                Desactivar
              </button>
            </div>
          </div>
        ))}
        {!loading && items.length === 0 && (
          <div className="sm:col-span-2 xl:col-span-3">
            <EmptyState icon="💲" message="Todavía no hay ítems en el catálogo. El precio sugerido por defecto es $500 MXN." />
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo ítem de catálogo" subtitle="Ej. Primera consulta, Seguimiento.">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nombre" value={form.nombre} onChange={update('nombre')} required />
          <Field label="Precio (MXN)" type="number" min="0" step="0.01" value={form.precio} onChange={update('precio')} required />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={form.esDefault} onChange={update('esDefault')} className="rounded" />
            Marcar como precio sugerido por defecto
          </label>

          {error && (
            <p className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
              <span className="font-bold">!</span> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {submitting ? 'Creando...' : 'Crear ítem'}
          </button>
        </form>
      </Modal>
    </AdminLayout>
  );
}

function Field({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
      <input
        {...props}
        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
      />
    </div>
  );
}

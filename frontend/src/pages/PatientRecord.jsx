import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { listClinicalRecords, createClinicalRecord } from '../api/clinicalRecords';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { ClipboardList, FileText, Plus } from 'lucide-react';
import Modal from '../components/Modal';
import DoctorLayout from '../components/DoctorLayout';
import RoadmapCard from '../components/RoadmapCard';

const emptyForm = { motivo: '', evaluacion: '', diagnostico: '', planTratamiento: '', notasPrivadas: '' };

export default function PatientRecord() {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const load = () => listClinicalRecords(id).then(setRecords).finally(() => setLoading(false));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await createClinicalRecord(id, form);
      showToast('Nota clínica guardada.', { type: 'success' });
      setForm(emptyForm);
      setModalOpen(false);
      load();
    } catch (err) {
      const message = err.response?.data?.error || 'No se pudo guardar la nota clínica.';
      setError(message);
      showToast(message, { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const content = (
    <div className={user?.roles?.includes('medico') ? 'max-w-3xl' : 'max-w-3xl mx-auto px-4 py-10'}>
      <PageHeader
        eyebrow="Expediente clínico"
        title={location.state?.patientName || 'Expediente clínico'}
        subtitle="Historial de notas de consulta. Las notas no pueden editarse una vez guardadas."
        action={
          <button type="button" onClick={() => setModalOpen(true)} className="btn-primary text-sm">
            <Plus size={16} aria-hidden="true" /> Nueva nota
          </button>
        }
      />

      {loading && <p className="text-slate-500 dark:text-slate-400">Cargando...</p>}

      <div className="relative space-y-6">
        {records.length > 0 && (
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
        )}
        {records.map((r) => (
          <div key={r.id} className="relative pl-7">
            <span className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full bg-navy-700 dark:bg-navy-500 ring-4 ring-navy-100 dark:ring-navy-900" />
            <div className="card-surface p-4">
              <p className="text-xs font-semibold text-navy-700 dark:text-navy-300">{r.fecha}</p>
              <p className="mt-1.5 text-sm text-navy-900 dark:text-white">
                <span className="font-semibold">Motivo:</span> {r.motivo}
              </p>
              {r.evaluacion && (
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  <span className="font-semibold text-navy-900 dark:text-white">Evaluación:</span> {r.evaluacion}
                </p>
              )}
              {r.diagnostico && (
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  <span className="font-semibold text-navy-900 dark:text-white">Diagnóstico:</span> {r.diagnostico}
                </p>
              )}
              {r.planTratamiento && (
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  <span className="font-semibold text-navy-900 dark:text-white">Plan de tratamiento:</span>{' '}
                  {r.planTratamiento}
                </p>
              )}
            </div>
          </div>
        ))}
        {!loading && records.length === 0 && <EmptyState icon={ClipboardList} message="Sin notas clínicas todavía." />}
      </div>

      <div className="mt-8 space-y-3">
        <RoadmapCard
          icon={FileText}
          title="Expediente clínico ampliado (NOM-004)"
          description="Se ampliará este expediente con antecedentes, exploración física y evoluciones estructuradas conforme a NOM-004-SSA3."
        />
        <RoadmapCard
          icon={ClipboardList}
          title="Seguimiento a pacientes"
          description="Módulo para asignar y dar seguimiento a tareas/ejercicios en casa del paciente."
        />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nueva nota de consulta"
        subtitle="Se guarda de forma permanente en el expediente del paciente."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <TextArea label="Motivo" value={form.motivo} onChange={update('motivo')} required />
          <TextArea label="Evaluación" value={form.evaluacion} onChange={update('evaluacion')} />
          <TextArea label="Diagnóstico" value={form.diagnostico} onChange={update('diagnostico')} />
          <TextArea label="Plan de tratamiento" value={form.planTratamiento} onChange={update('planTratamiento')} />
          <TextArea label="Notas privadas" value={form.notasPrivadas} onChange={update('notasPrivadas')} />
          {error && (
            <p className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-lg px-3 py-2.5">
              <span className="font-bold">!</span> {error}
            </p>
          )}
          <button type="submit" disabled={submitting} className="btn-primary text-sm disabled:opacity-50">
            {submitting ? 'Guardando...' : 'Guardar nota'}
          </button>
        </form>
      </Modal>
    </div>
  );

  return user?.roles?.includes('medico') ? <DoctorLayout>{content}</DoctorLayout> : content;
}

function TextArea({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{label}</label>
      <textarea {...props} rows={2} className="input-field" />
    </div>
  );
}

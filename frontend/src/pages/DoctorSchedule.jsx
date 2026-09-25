import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  listSchedules,
  createSchedule,
  deleteSchedule,
  listScheduleExceptions,
  createScheduleException,
  deleteScheduleException,
} from '../api/doctors';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { CalendarOff, Palmtree, Plus, X } from 'lucide-react';
import Modal from '../components/Modal';
import DoctorLayout from '../components/DoctorLayout';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DIAS_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function DoctorSchedule() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [schedules, setSchedules] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [scheduleForm, setScheduleForm] = useState({ diaSemana: '1', horaInicio: '09:00', horaFin: '14:00' });
  const [exceptionForm, setExceptionForm] = useState({ fecha: '', horaInicio: '', horaFin: '', tipo: 'bloqueo', motivo: '' });
  const [error, setError] = useState('');
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [exceptionModalOpen, setExceptionModalOpen] = useState(false);

  const loadSchedules = () => listSchedules(user.id).then(setSchedules);
  const loadExceptions = () => listScheduleExceptions(user.id).then(setExceptions);

  useEffect(() => {
    loadSchedules();
    loadExceptions();
  }, []);

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createSchedule(user.id, { ...scheduleForm, diaSemana: Number(scheduleForm.diaSemana) });
      showToast('Horario agregado.', { type: 'success' });
      setScheduleModalOpen(false);
      loadSchedules();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo agregar el horario.');
    }
  };

  const handleAddException = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createScheduleException(user.id, {
        ...exceptionForm,
        horaInicio: exceptionForm.horaInicio || null,
        horaFin: exceptionForm.horaFin || null,
      });
      showToast('Excepción agregada.', { type: 'success' });
      setExceptionForm({ fecha: '', horaInicio: '', horaFin: '', tipo: 'bloqueo', motivo: '' });
      setExceptionModalOpen(false);
      loadExceptions();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo agregar la excepción.');
    }
  };

  return (
    <DoctorLayout>
      <div className="max-w-3xl space-y-10">
      <div>
        <PageHeader
          eyebrow="Vista médico"
          title="Mi horario"
          subtitle="Horario semanal recurrente en el que estás disponible para citas."
          action={
            <button type="button" onClick={() => setScheduleModalOpen(true)} className="btn-primary text-sm">
              <Plus size={16} aria-hidden="true" /> Agregar horario
            </button>
          }
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {DIAS_CORTO.map((label, i) => {
            const dayBlocks = schedules.filter((s) => s.diaSemana === i);
            return (
              <div key={i} className="card-surface p-3 min-h-[110px]">
                <p className="text-xs font-semibold text-navy-900 dark:text-white mb-2">{label}</p>
                <div className="space-y-1.5">
                  {dayBlocks.map((s) => (
                    <div
                      key={s.id}
                      className="group flex items-center justify-between gap-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-lg px-2 py-1"
                    >
                      <span>
                        {s.horaInicio.slice(0, 5)}–{s.horaFin.slice(0, 5)}
                      </span>
                      <button
                        onClick={() => deleteSchedule(s.id).then(loadSchedules)}
                        className="text-indigo-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                        aria-label="Eliminar horario"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                  {dayBlocks.length === 0 && <p className="text-xs text-slate-300 dark:text-slate-600">Sin horario</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <PageHeader
          eyebrow="Excepciones"
          title="Bloqueos y vacaciones"
          subtitle="Excepciones puntuales que anulan tu horario recurrente."
          action={
            <button type="button" onClick={() => setExceptionModalOpen(true)} className="btn-primary text-sm !bg-navy-800 dark:!bg-navy-700 hover:!bg-navy-700 dark:hover:!bg-navy-600">
              <Plus size={16} aria-hidden="true" /> Agregar excepción
            </button>
          }
        />

        <div className="space-y-3">
          {exceptions.map((ex) => (
            <div key={ex.id} className="flex items-center justify-between gap-4 card-surface p-4">
              <div className="flex items-center gap-3">
                <span
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    ex.tipo === 'vacaciones'
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                      : 'bg-coral-400/20 dark:bg-coral-500/20 text-coral-600 dark:text-coral-400'
                  }`}
                >
                  {ex.tipo === 'vacaciones' ? <Palmtree size={16} aria-hidden="true" /> : <CalendarOff size={16} aria-hidden="true" />}
                </span>
                <div>
                  <p className="font-medium text-navy-900 dark:text-white">
                    {ex.fecha} · <span className="capitalize">{ex.tipo}</span>
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {ex.horaInicio ? `${ex.horaInicio.slice(0, 5)}–${ex.horaFin.slice(0, 5)}` : 'Todo el día'}
                    {ex.motivo ? ` · ${ex.motivo}` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => deleteScheduleException(ex.id).then(loadExceptions)}
                className="text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 px-3 py-1.5 rounded-lg transition"
              >
                Eliminar
              </button>
            </div>
          ))}
          {exceptions.length === 0 && <EmptyState icon={CalendarOff} message="Sin excepciones registradas." />}
        </div>
      </div>

      <Modal open={scheduleModalOpen} onClose={() => setScheduleModalOpen(false)} title="Agregar horario">
        <form onSubmit={handleAddSchedule} className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Día</label>
              <select
                value={scheduleForm.diaSemana}
                onChange={(e) => setScheduleForm((f) => ({ ...f, diaSemana: e.target.value }))}
                className="input-field text-sm"
              >
                {DIAS.map((d, i) => (
                  <option key={i} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Inicio</label>
              <input
                type="time"
                value={scheduleForm.horaInicio}
                onChange={(e) => setScheduleForm((f) => ({ ...f, horaInicio: e.target.value }))}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Fin</label>
              <input
                type="time"
                value={scheduleForm.horaFin}
                onChange={(e) => setScheduleForm((f) => ({ ...f, horaFin: e.target.value }))}
                className="input-field text-sm"
              />
            </div>
          </div>
          {error && <Alert>{error}</Alert>}
          <button type="submit" className="btn-primary text-sm">
            Agregar
          </button>
        </form>
      </Modal>

      <Modal open={exceptionModalOpen} onClose={() => setExceptionModalOpen(false)} title="Agregar excepción">
        <form onSubmit={handleAddException} className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Fecha</label>
            <input
              type="date"
              required
              value={exceptionForm.fecha}
              onChange={(e) => setExceptionForm((f) => ({ ...f, fecha: e.target.value }))}
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Tipo</label>
            <select
              value={exceptionForm.tipo}
              onChange={(e) => setExceptionForm((f) => ({ ...f, tipo: e.target.value }))}
              className="input-field text-sm"
            >
              <option value="bloqueo">Bloqueo puntual</option>
              <option value="vacaciones">Vacaciones</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Hora inicio (vacío = todo el día)
            </label>
            <input
              type="time"
              value={exceptionForm.horaInicio}
              onChange={(e) => setExceptionForm((f) => ({ ...f, horaInicio: e.target.value }))}
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Hora fin</label>
            <input
              type="time"
              value={exceptionForm.horaFin}
              onChange={(e) => setExceptionForm((f) => ({ ...f, horaFin: e.target.value }))}
              className="input-field text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Motivo (opcional)</label>
            <input
              value={exceptionForm.motivo}
              onChange={(e) => setExceptionForm((f) => ({ ...f, motivo: e.target.value }))}
              className="input-field text-sm"
            />
          </div>
          {error && (
            <div className="sm:col-span-2">
              <Alert>{error}</Alert>
            </div>
          )}
          <button
            type="submit"
            className="btn-primary text-sm sm:col-span-2 !bg-navy-800 dark:!bg-navy-700 hover:!bg-navy-700 dark:hover:!bg-navy-600"
          >
            Agregar excepción
          </button>
        </form>
      </Modal>
      </div>
    </DoctorLayout>
  );
}

function Alert({ children }) {
  return (
    <div className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-lg px-3 py-2.5">
      <span className="font-bold">!</span>
      <span>{children}</span>
    </div>
  );
}

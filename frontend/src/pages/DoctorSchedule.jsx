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
            <button
              type="button"
              onClick={() => setScheduleModalOpen(true)}
              className="px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
            >
              + Agregar horario
            </button>
          }
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {DIAS_CORTO.map((label, i) => {
            const dayBlocks = schedules.filter((s) => s.diaSemana === i);
            return (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-3 shadow-sm min-h-[110px]">
                <p className="text-xs font-semibold text-navy-900 mb-2">{label}</p>
                <div className="space-y-1.5">
                  {dayBlocks.map((s) => (
                    <div
                      key={s.id}
                      className="group flex items-center justify-between gap-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg px-2 py-1"
                    >
                      <span>
                        {s.horaInicio.slice(0, 5)}–{s.horaFin.slice(0, 5)}
                      </span>
                      <button
                        onClick={() => deleteSchedule(s.id).then(loadSchedules)}
                        className="text-indigo-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                        aria-label="Eliminar horario"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {dayBlocks.length === 0 && <p className="text-xs text-slate-300">Sin horario</p>}
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
            <button
              type="button"
              onClick={() => setExceptionModalOpen(true)}
              className="px-4 py-2 rounded-full bg-navy-800 text-white text-sm font-semibold hover:bg-navy-700 transition"
            >
              + Agregar excepción
            </button>
          }
        />

        <div className="space-y-3">
          {exceptions.map((ex) => (
            <div
              key={ex.id}
              className="flex items-center justify-between gap-4 bg-white rounded-2xl border border-slate-100 p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm ${
                    ex.tipo === 'vacaciones' ? 'bg-emerald-100' : 'bg-coral-400/20'
                  }`}
                >
                  {ex.tipo === 'vacaciones' ? '🌴' : '🚫'}
                </span>
                <div>
                  <p className="font-medium text-navy-900">
                    {ex.fecha} · <span className="capitalize">{ex.tipo}</span>
                  </p>
                  <p className="text-sm text-slate-500">
                    {ex.horaInicio ? `${ex.horaInicio.slice(0, 5)}–${ex.horaFin.slice(0, 5)}` : 'Todo el día'}
                    {ex.motivo ? ` · ${ex.motivo}` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => deleteScheduleException(ex.id).then(loadExceptions)}
                className="text-sm text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-full transition"
              >
                Eliminar
              </button>
            </div>
          ))}
          {exceptions.length === 0 && <EmptyState icon="🌴" message="Sin excepciones registradas." />}
        </div>
      </div>

      <Modal open={scheduleModalOpen} onClose={() => setScheduleModalOpen(false)} title="Agregar horario">
        <form onSubmit={handleAddSchedule} className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Día</label>
              <select
                value={scheduleForm.diaSemana}
                onChange={(e) => setScheduleForm((f) => ({ ...f, diaSemana: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {DIAS.map((d, i) => (
                  <option key={i} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Inicio</label>
              <input
                type="time"
                value={scheduleForm.horaInicio}
                onChange={(e) => setScheduleForm((f) => ({ ...f, horaInicio: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Fin</label>
              <input
                type="time"
                value={scheduleForm.horaFin}
                onChange={(e) => setScheduleForm((f) => ({ ...f, horaFin: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>
          {error && <Alert>{error}</Alert>}
          <button type="submit" className="px-5 py-2.5 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition">
            Agregar
          </button>
        </form>
      </Modal>

      <Modal open={exceptionModalOpen} onClose={() => setExceptionModalOpen(false)} title="Agregar excepción">
        <form onSubmit={handleAddException} className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Fecha</label>
            <input
              type="date"
              required
              value={exceptionForm.fecha}
              onChange={(e) => setExceptionForm((f) => ({ ...f, fecha: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
            <select
              value={exceptionForm.tipo}
              onChange={(e) => setExceptionForm((f) => ({ ...f, tipo: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="bloqueo">Bloqueo puntual</option>
              <option value="vacaciones">Vacaciones</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Hora inicio (vacío = todo el día)</label>
            <input
              type="time"
              value={exceptionForm.horaInicio}
              onChange={(e) => setExceptionForm((f) => ({ ...f, horaInicio: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Hora fin</label>
            <input
              type="time"
              value={exceptionForm.horaFin}
              onChange={(e) => setExceptionForm((f) => ({ ...f, horaFin: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Motivo (opcional)</label>
            <input
              value={exceptionForm.motivo}
              onChange={(e) => setExceptionForm((f) => ({ ...f, motivo: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          {error && (
            <div className="sm:col-span-2">
              <Alert>{error}</Alert>
            </div>
          )}
          <button
            type="submit"
            className="sm:col-span-2 px-5 py-2.5 rounded-full bg-navy-800 text-white text-sm font-semibold hover:bg-navy-700 transition"
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
    <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
      <span className="font-bold">!</span>
      <span>{children}</span>
    </div>
  );
}

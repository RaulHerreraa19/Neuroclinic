const { DoctorSchedule, ScheduleException } = require('../models');
const { assertDoctorOwnedByAdmin } = require('../services/ownership');

// Un doctor solo puede administrar su propio horario; el admin solo el de sus propios doctores.
async function assertCanManage(req, doctorId) {
  if (req.user.hasRole('medico') && req.user.id === doctorId) return;
  if (req.user.hasRole('admin')) {
    await assertDoctorOwnedByAdmin(doctorId, req.user.id);
    return;
  }
  const err = new Error('No puedes administrar el horario de otro doctor.');
  err.status = 403;
  throw err;
}

async function listSchedules(req, res) {
  const schedules = await DoctorSchedule.findAll({
    where: { doctorId: req.params.doctorId },
    order: [['diaSemana', 'ASC'], ['horaInicio', 'ASC']],
  });
  res.json({ schedules });
}

async function createSchedule(req, res) {
  await assertCanManage(req, req.params.doctorId);
  const { diaSemana, horaInicio, horaFin } = req.body;
  if (horaInicio >= horaFin) {
    return res.status(400).json({ error: 'La hora de inicio debe ser antes que la hora de fin.' });
  }
  const schedule = await DoctorSchedule.create({
    doctorId: req.params.doctorId,
    diaSemana,
    horaInicio,
    horaFin,
  });
  res.status(201).json({ schedule });
}

async function updateSchedule(req, res) {
  const schedule = await DoctorSchedule.findByPk(req.params.id);
  if (!schedule) return res.status(404).json({ error: 'Horario no encontrado.' });
  await assertCanManage(req, schedule.doctorId);
  const { diaSemana, horaInicio, horaFin, activo } = req.body;
  await schedule.update({ diaSemana, horaInicio, horaFin, activo });
  res.json({ schedule });
}

async function deleteSchedule(req, res) {
  const schedule = await DoctorSchedule.findByPk(req.params.id);
  if (!schedule) return res.status(404).json({ error: 'Horario no encontrado.' });
  await assertCanManage(req, schedule.doctorId);
  await schedule.destroy();
  res.status(204).send();
}

async function listExceptions(req, res) {
  const exceptions = await ScheduleException.findAll({
    where: { doctorId: req.params.doctorId },
    order: [['fecha', 'ASC']],
  });
  res.json({ exceptions });
}

async function createException(req, res) {
  await assertCanManage(req, req.params.doctorId);
  const { fecha, horaInicio, horaFin, tipo, motivo } = req.body;
  const exception = await ScheduleException.create({
    doctorId: req.params.doctorId,
    fecha,
    horaInicio: horaInicio || null,
    horaFin: horaFin || null,
    tipo,
    motivo,
  });
  res.status(201).json({ exception });
}

async function deleteException(req, res) {
  const exception = await ScheduleException.findByPk(req.params.id);
  if (!exception) return res.status(404).json({ error: 'Excepción no encontrada.' });
  await assertCanManage(req, exception.doctorId);
  await exception.destroy();
  res.status(204).send();
}

module.exports = {
  listSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  listExceptions,
  createException,
  deleteException,
};

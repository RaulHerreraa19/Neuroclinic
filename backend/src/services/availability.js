const { Op } = require('sequelize');
const { DoctorProfile, DoctorSchedule, ScheduleException, Appointment } = require('../models');
const { timeToMinutes, minutesToTime, weekdayOf, todayDateOnly } = require('../utils/timeUtils');

function enumerateDates(fromDateStr, toDateStr) {
  const dates = [];
  const [fy, fm, fd] = fromDateStr.split('-').map(Number);
  const [ty, tm, td] = toDateStr.split('-').map(Number);
  const cursor = new Date(Date.UTC(fy, fm - 1, fd));
  const end = new Date(Date.UTC(ty, tm - 1, td));
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function overlaps(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

// Calcula los huecos disponibles de un doctor entre fromDateStr y toDateStr (ambos "YYYY-MM-DD"),
// a partir de su horario recurrente, restando excepciones (bloqueos/vacaciones) y citas ya ocupadas.
async function getAvailableSlots(doctorId, fromDateStr, toDateStr) {
  const doctorProfile = await DoctorProfile.findOne({ where: { userId: doctorId } });
  if (!doctorProfile) {
    const err = new Error('Doctor no encontrado.');
    err.status = 404;
    throw err;
  }
  const slotMinutes = doctorProfile.duracionCitaMinutos;

  const [schedules, exceptions, appointments] = await Promise.all([
    DoctorSchedule.findAll({ where: { doctorId, activo: true } }),
    ScheduleException.findAll({
      where: { doctorId, fecha: { [Op.between]: [fromDateStr, toDateStr] } },
    }),
    Appointment.findAll({
      where: {
        doctorId,
        fecha: { [Op.between]: [fromDateStr, toDateStr] },
        estado: { [Op.ne]: 'cancelada' },
      },
    }),
  ]);

  const today = todayDateOnly();
  const nowMinutes = timeToMinutes(new Date().toTimeString().slice(0, 5));

  const results = [];

  for (const fecha of enumerateDates(fromDateStr, toDateStr)) {
    const weekday = weekdayOf(fecha);
    const blocksForDay = schedules.filter((s) => s.diaSemana === weekday);
    if (blocksForDay.length === 0) {
      results.push({ fecha, slots: [] });
      continue;
    }

    const exceptionsForDate = exceptions.filter((e) => e.fecha === fecha);
    const wholeDayBlocked = exceptionsForDate.some((e) => !e.horaInicio && !e.horaFin);
    if (wholeDayBlocked) {
      results.push({ fecha, slots: [] });
      continue;
    }
    const partialBlocks = exceptionsForDate
      .filter((e) => e.horaInicio && e.horaFin)
      .map((e) => [timeToMinutes(e.horaInicio), timeToMinutes(e.horaFin)]);

    const bookedStarts = new Set(
      appointments.filter((a) => a.fecha === fecha).map((a) => timeToMinutes(a.horaInicio))
    );

    const slots = [];
    for (const block of blocksForDay) {
      const blockStart = timeToMinutes(block.horaInicio);
      const blockEnd = timeToMinutes(block.horaFin);
      for (let start = blockStart; start + slotMinutes <= blockEnd; start += slotMinutes) {
        const end = start + slotMinutes;

        if (fecha === today && start <= nowMinutes) continue;
        if (bookedStarts.has(start)) continue;
        if (partialBlocks.some(([bStart, bEnd]) => overlaps(start, end, bStart, bEnd))) continue;

        slots.push({ horaInicio: minutesToTime(start), horaFin: minutesToTime(end) });
      }
    }
    results.push({ fecha, slots });
  }

  return results;
}

module.exports = { getAvailableSlots };

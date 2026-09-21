const { timeToMinutes, minutesToTime } = require('../utils/timeUtils');
const { getAvailableSlots } = require('./availability');

function computeAppointmentSlot(horaInicio, duracionMinutos) {
  const startMinutes = timeToMinutes(horaInicio);
  return {
    horaInicio: minutesToTime(startMinutes),
    horaFin: minutesToTime(startMinutes + duracionMinutos),
  };
}

// Vuelve a calcular la disponibilidad justo antes de agendar, para dar un mensaje claro
// si el horario ya se ocupó entre que el paciente lo vio y confirmó (evita condiciones de carrera obvias;
// el índice único en la base de datos es la última línea de defensa).
async function isSlotAvailable(doctorId, fecha, horaInicio) {
  const [dayAvailability] = await getAvailableSlots(doctorId, fecha, fecha);
  return dayAvailability.slots.some((slot) => slot.horaInicio === minutesToTime(timeToMinutes(horaInicio)));
}

module.exports = { computeAppointmentSlot, isSlotAvailable };

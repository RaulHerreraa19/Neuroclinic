// Utilidades mínimas para trabajar con horas "HH:MM" o "HH:MM:SS" sin depender de una librería externa.

function timeToMinutes(time) {
  const [h, m] = String(time).split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(totalMinutes) {
  const h = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, '0');
  const m = (totalMinutes % 60).toString().padStart(2, '0');
  return `${h}:${m}:00`;
}

// Nombre de día de la semana de Sequelize DATEONLY (0=domingo ... 6=sábado), calculado en UTC
// para evitar corrimientos de zona horaria al parsear "YYYY-MM-DD".
function weekdayOf(dateOnlyString) {
  const [y, m, d] = dateOnlyString.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function todayDateOnly() {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

function isSameOrFutureDate(dateOnlyString) {
  return dateOnlyString >= todayDateOnly();
}

module.exports = { timeToMinutes, minutesToTime, weekdayOf, todayDateOnly, isSameOrFutureDate };

const { Op } = require('sequelize');
const { User, DoctorProfile } = require('../models');
const { getAvailableSlots } = require('../services/availability');

// Listado público de doctores activos, para que el paciente elija con quién agendar.
async function listDoctors(req, res) {
  const doctors = await User.findAll({
    where: { roles: { [Op.contains]: ['medico'] }, isActive: true },
    attributes: ['id', 'nombre', 'apellidoPaterno', 'apellidoMaterno'],
    include: [
      {
        model: DoctorProfile,
        as: 'doctorProfile',
        attributes: ['especialidad', 'biografia', 'duracionCitaMinutos'],
      },
    ],
  });
  res.json({ doctors });
}

async function getDoctor(req, res) {
  const doctor = await User.findOne({
    where: { id: req.params.id, roles: { [Op.contains]: ['medico'] }, isActive: true },
    attributes: ['id', 'nombre', 'apellidoPaterno', 'apellidoMaterno'],
    include: [
      {
        model: DoctorProfile,
        as: 'doctorProfile',
        attributes: ['especialidad', 'biografia', 'duracionCitaMinutos'],
      },
    ],
  });
  if (!doctor) return res.status(404).json({ error: 'Doctor no encontrado.' });
  res.json({ doctor });
}

async function getAvailability(req, res) {
  const { from, to } = req.query;
  if (!from || !to) {
    return res.status(400).json({ error: 'Debes indicar los parámetros "from" y "to" (YYYY-MM-DD).' });
  }
  const availability = await getAvailableSlots(req.params.id, from, to);
  res.json({ availability });
}

module.exports = { listDoctors, getDoctor, getAvailability };

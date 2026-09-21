const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Horario semanal recurrente de un doctor (ej. lunes 09:00-14:00).
const DoctorSchedule = sequelize.define(
  'DoctorSchedule',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    doctorId: { type: DataTypes.UUID, allowNull: false, field: 'doctor_id' },
    diaSemana: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'dia_semana',
      validate: { min: 0, max: 6 },
    },
    horaInicio: { type: DataTypes.TIME, allowNull: false, field: 'hora_inicio' },
    horaFin: { type: DataTypes.TIME, allowNull: false, field: 'hora_fin' },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: 'doctor_schedules',
    underscored: true,
  }
);

module.exports = DoctorSchedule;

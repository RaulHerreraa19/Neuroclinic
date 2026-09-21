const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Bloqueo puntual o vacaciones que anulan el horario recurrente en una fecha específica.
const ScheduleException = sequelize.define(
  'ScheduleException',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    doctorId: { type: DataTypes.UUID, allowNull: false, field: 'doctor_id' },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    horaInicio: { type: DataTypes.TIME, allowNull: true, field: 'hora_inicio' },
    horaFin: { type: DataTypes.TIME, allowNull: true, field: 'hora_fin' },
    tipo: {
      type: DataTypes.ENUM('bloqueo', 'vacaciones'),
      allowNull: false,
      defaultValue: 'bloqueo',
    },
    motivo: { type: DataTypes.STRING, allowNull: true },
  },
  {
    tableName: 'schedule_exceptions',
    underscored: true,
  }
);

module.exports = ScheduleException;

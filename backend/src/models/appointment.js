const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database');

const Appointment = sequelize.define(
  'Appointment',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    patientId: { type: DataTypes.UUID, allowNull: false, field: 'patient_id' },
    doctorId: { type: DataTypes.UUID, allowNull: false, field: 'doctor_id' },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    horaInicio: { type: DataTypes.TIME, allowNull: false, field: 'hora_inicio' },
    horaFin: { type: DataTypes.TIME, allowNull: false, field: 'hora_fin' },
    estado: {
      type: DataTypes.ENUM('pendiente', 'confirmada', 'cancelada', 'completada', 'no_asistio'),
      allowNull: false,
      defaultValue: 'pendiente',
    },
    esPrimeraVez: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'es_primera_vez' },
    motivoConsulta: { type: DataTypes.STRING, allowNull: true, field: 'motivo_consulta' },
  },
  {
    tableName: 'appointments',
    underscored: true,
    indexes: [
      {
        // Solo un turno activo por doctor/fecha/hora; una vez cancelado, el hueco vuelve a estar libre.
        unique: true,
        fields: ['doctor_id', 'fecha', 'hora_inicio'],
        name: 'appointments_doctor_slot_unique',
        where: { estado: { [Op.ne]: 'cancelada' } },
      },
    ],
  }
);

module.exports = Appointment;

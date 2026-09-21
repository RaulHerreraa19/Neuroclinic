const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DoctorProfile = sequelize.define(
  'DoctorProfile',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, unique: true, field: 'user_id' },
    ownerAdminId: { type: DataTypes.UUID, allowNull: true, field: 'owner_admin_id' },
    cedulaProfesional: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'cedula_profesional',
    },
    especialidad: { type: DataTypes.STRING, allowNull: false },
    biografia: { type: DataTypes.TEXT, allowNull: true },
    duracionCitaMinutos: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 45,
      field: 'duracion_cita_minutos',
    },
  },
  {
    tableName: 'doctor_profiles',
    underscored: true,
  }
);

module.exports = DoctorProfile;

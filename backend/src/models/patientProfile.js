const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PatientProfile = sequelize.define(
  'PatientProfile',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, unique: true, field: 'user_id' },
    fechaNacimiento: { type: DataTypes.DATEONLY, allowNull: false, field: 'fecha_nacimiento' },
    sexo: { type: DataTypes.ENUM('masculino', 'femenino', 'otro'), allowNull: false },
    curp: { type: DataTypes.STRING, allowNull: true, unique: true },
    direccion: { type: DataTypes.TEXT, allowNull: true },
    contactoEmergenciaNombre: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'contacto_emergencia_nombre',
    },
    contactoEmergenciaTelefono: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'contacto_emergencia_telefono',
    },
    avisoPrivacidadAceptadoEn: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'aviso_privacidad_aceptado_en',
    },
  },
  {
    tableName: 'patient_profiles',
    underscored: true,
  }
);

module.exports = PatientProfile;

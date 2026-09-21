const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { encrypt, decrypt } = require('../services/encryption');

// Campos con datos clínicos sensibles: se cifran (AES-256-GCM) antes de guardarse
// y se descifran al leerse, vía getters/setters. Nunca se borran físicamente (paranoid).
function encryptedField(fieldName, columnName) {
  return {
    type: DataTypes.TEXT,
    allowNull: true,
    field: columnName,
    get() {
      return decrypt(this.getDataValue(fieldName));
    },
    set(value) {
      this.setDataValue(fieldName, encrypt(value));
    },
  };
}

const ClinicalRecord = sequelize.define(
  'ClinicalRecord',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    patientId: { type: DataTypes.UUID, allowNull: false, field: 'patient_id' },
    doctorId: { type: DataTypes.UUID, allowNull: false, field: 'doctor_id' },
    appointmentId: { type: DataTypes.UUID, allowNull: true, field: 'appointment_id' },
    fecha: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
    motivo: { type: DataTypes.TEXT, allowNull: false },
    evaluacion: { type: DataTypes.TEXT, allowNull: true },
    diagnostico: encryptedField('diagnostico', 'diagnostico'),
    planTratamiento: encryptedField('planTratamiento', 'plan_tratamiento'),
    notasPrivadas: encryptedField('notasPrivadas', 'notas_privadas'),
  },
  {
    tableName: 'clinical_records',
    underscored: true,
    paranoid: true, // soft-delete: conserva el registro (retención NOM-004), nunca DELETE físico
  }
);

module.exports = ClinicalRecord;

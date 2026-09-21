const sequelize = require('../config/database');
const User = require('./user');
const PatientProfile = require('./patientProfile');
const DoctorProfile = require('./doctorProfile');
const DoctorSchedule = require('./doctorSchedule');
const ScheduleException = require('./scheduleException');
const Appointment = require('./appointment');
const ClinicalRecord = require('./clinicalRecord');
const AuditLog = require('./auditLog');
const PriceCatalogItem = require('./priceCatalogItem');
const Payment = require('./payment');

// User <-> PatientProfile (1:1)
User.hasOne(PatientProfile, { foreignKey: 'userId', as: 'patientProfile', onDelete: 'CASCADE' });
PatientProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> DoctorProfile (1:1)
User.hasOne(DoctorProfile, { foreignKey: 'userId', as: 'doctorProfile', onDelete: 'CASCADE' });
DoctorProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Admin (User) <-> DoctorProfile (1:N): de qué admin es dueño cada doctor (modelo multi-clínica).
User.hasMany(DoctorProfile, { foreignKey: 'ownerAdminId', as: 'ownedDoctorProfiles' });
DoctorProfile.belongsTo(User, { foreignKey: 'ownerAdminId', as: 'ownerAdmin' });

// Doctor (User) <-> DoctorSchedule (1:N)
User.hasMany(DoctorSchedule, { foreignKey: 'doctorId', as: 'schedules', onDelete: 'CASCADE' });
DoctorSchedule.belongsTo(User, { foreignKey: 'doctorId', as: 'doctor' });

// Doctor (User) <-> ScheduleException (1:N)
User.hasMany(ScheduleException, { foreignKey: 'doctorId', as: 'scheduleExceptions', onDelete: 'CASCADE' });
ScheduleException.belongsTo(User, { foreignKey: 'doctorId', as: 'doctor' });

// Appointment belongs to a patient and a doctor (both Users)
User.hasMany(Appointment, { foreignKey: 'patientId', as: 'appointmentsAsPatient' });
Appointment.belongsTo(User, { foreignKey: 'patientId', as: 'patient' });

User.hasMany(Appointment, { foreignKey: 'doctorId', as: 'appointmentsAsDoctor' });
Appointment.belongsTo(User, { foreignKey: 'doctorId', as: 'doctor' });

// ClinicalRecord belongs to patient, doctor, and optionally an appointment
User.hasMany(ClinicalRecord, { foreignKey: 'patientId', as: 'clinicalRecordsAsPatient' });
ClinicalRecord.belongsTo(User, { foreignKey: 'patientId', as: 'patient' });

User.hasMany(ClinicalRecord, { foreignKey: 'doctorId', as: 'clinicalRecordsAsDoctor' });
ClinicalRecord.belongsTo(User, { foreignKey: 'doctorId', as: 'doctor' });

Appointment.hasOne(ClinicalRecord, { foreignKey: 'appointmentId', as: 'clinicalRecord' });
ClinicalRecord.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });

// AuditLog references the acting user (nullable for system actions)
User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Admin (User) <-> PriceCatalogItem (1:N): catálogo de precios propio de cada admin/clínica.
User.hasMany(PriceCatalogItem, { foreignKey: 'ownerAdminId', as: 'priceCatalogItems' });
PriceCatalogItem.belongsTo(User, { foreignKey: 'ownerAdminId', as: 'ownerAdmin' });

// Appointment <-> Payment (1:1): el cobro de una consulta.
Appointment.hasOne(Payment, { foreignKey: 'appointmentId', as: 'payment' });
Payment.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });
Payment.belongsTo(PriceCatalogItem, { foreignKey: 'priceCatalogItemId', as: 'priceCatalogItem' });

// User <-> Payment (1:N): quién registró el cobro (doctor o admin dueño).
User.hasMany(Payment, { foreignKey: 'cobradoPorUserId', as: 'paymentsCollected' });
Payment.belongsTo(User, { foreignKey: 'cobradoPorUserId', as: 'cobradoPor' });

module.exports = {
  sequelize,
  User,
  PatientProfile,
  DoctorProfile,
  DoctorSchedule,
  ScheduleException,
  Appointment,
  ClinicalRecord,
  AuditLog,
  PriceCatalogItem,
  Payment,
};

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Tabla puente: qué servicios del catálogo de la clínica ofrece cada doctor.
const DoctorService = sequelize.define(
  'DoctorService',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    doctorProfileId: { type: DataTypes.UUID, allowNull: false, field: 'doctor_profile_id' },
    priceCatalogItemId: { type: DataTypes.UUID, allowNull: false, field: 'price_catalog_item_id' },
  },
  {
    tableName: 'doctor_services',
    underscored: true,
  }
);

module.exports = DoctorService;

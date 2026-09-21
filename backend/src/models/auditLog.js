const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define(
  'AuditLog',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: true, field: 'user_id' },
    entidad: { type: DataTypes.STRING, allowNull: false },
    entidadId: { type: DataTypes.STRING, allowNull: true, field: 'entidad_id' },
    accion: {
      type: DataTypes.ENUM('create', 'read', 'update', 'delete'),
      allowNull: false,
    },
    ipAddress: { type: DataTypes.STRING, allowNull: true, field: 'ip_address' },
    detalles: { type: DataTypes.JSONB, allowNull: true },
  },
  {
    tableName: 'audit_logs',
    underscored: true,
    updatedAt: false,
  }
);

module.exports = AuditLog;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Código de recuperación de contraseña. Nunca se guarda el código en claro, solo su HMAC
// (ver services/passwordReset.js).
const PasswordResetCode = sequelize.define(
  'PasswordResetCode',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
    channel: { type: DataTypes.ENUM('sms', 'email'), allowNull: false },
    codeHash: { type: DataTypes.STRING, allowNull: false, field: 'code_hash' },
    expiresAt: { type: DataTypes.DATE, allowNull: false, field: 'expires_at' },
    attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    usedAt: { type: DataTypes.DATE, allowNull: true, field: 'used_at' },
  },
  {
    tableName: 'password_reset_codes',
    underscored: true,
  }
);

module.exports = PasswordResetCode;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'password_hash',
    },
    // LEGACY: reemplazado por `roles` (array). Se conserva de solo lectura hasta una limpieza
    // posterior; ningún código nuevo debe volver a escribirlo.
    role: {
      type: DataTypes.ENUM('admin', 'medico', 'paciente'),
      allowNull: false,
    },
    roles: {
      type: DataTypes.ARRAY(DataTypes.ENUM('admin', 'medico', 'paciente')),
      allowNull: false,
    },
    nombre: { type: DataTypes.STRING, allowNull: false },
    apellidoPaterno: { type: DataTypes.STRING, allowNull: false, field: 'apellido_paterno' },
    apellidoMaterno: { type: DataTypes.STRING, allowNull: true, field: 'apellido_materno' },
    telefono: { type: DataTypes.STRING, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' },
    avatarUrl: { type: DataTypes.STRING, allowNull: true, field: 'avatar_url' },
  },
  {
    tableName: 'users',
    underscored: true,
  }
);

User.prototype.hasRole = function hasRole(role) {
  return this.roles.includes(role);
};

module.exports = User;

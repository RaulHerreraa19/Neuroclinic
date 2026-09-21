const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PriceCatalogItem = sequelize.define(
  'PriceCatalogItem',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    ownerAdminId: { type: DataTypes.UUID, allowNull: false, field: 'owner_admin_id' },
    nombre: { type: DataTypes.STRING, allowNull: false },
    precio: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    esDefault: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'es_default' },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: 'price_catalog',
    underscored: true,
  }
);

module.exports = PriceCatalogItem;

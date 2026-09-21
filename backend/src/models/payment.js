const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define(
  'Payment',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    appointmentId: { type: DataTypes.UUID, allowNull: false, unique: true, field: 'appointment_id' },
    priceCatalogItemId: { type: DataTypes.UUID, allowNull: true, field: 'price_catalog_item_id' },
    monto: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    concepto: { type: DataTypes.STRING, allowNull: false },
    cobradoPorUserId: { type: DataTypes.UUID, allowNull: false, field: 'cobrado_por_user_id' },
    metodoPago: {
      type: DataTypes.ENUM('efectivo', 'tarjeta', 'transferencia'),
      allowNull: false,
      defaultValue: 'efectivo',
      field: 'metodo_pago',
    },
    fechaCobro: { type: DataTypes.DATEONLY, allowNull: false, field: 'fecha_cobro' },
  },
  {
    tableName: 'payments',
    underscored: true,
  }
);

module.exports = Payment;

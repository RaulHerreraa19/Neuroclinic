'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payments', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      appointment_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'appointments', key: 'id' },
        onDelete: 'RESTRICT',
      },
      price_catalog_item_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'price_catalog', key: 'id' },
        onDelete: 'SET NULL',
      },
      monto: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      concepto: { type: Sequelize.STRING, allowNull: false },
      cobrado_por_user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
      },
      metodo_pago: {
        type: Sequelize.ENUM('efectivo', 'tarjeta', 'transferencia'),
        allowNull: false,
        defaultValue: 'efectivo',
      },
      fecha_cobro: { type: Sequelize.DATEONLY, allowNull: false, defaultValue: Sequelize.NOW },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('payments', ['cobrado_por_user_id']);
    await queryInterface.addIndex('payments', ['fecha_cobro']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('payments');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_payments_metodo_pago";');
  },
};

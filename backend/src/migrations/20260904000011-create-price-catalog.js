'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('price_catalog', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      owner_admin_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
      },
      nombre: { type: Sequelize.STRING, allowNull: false },
      precio: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      es_default: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('price_catalog', ['owner_admin_id']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('price_catalog');
  },
};

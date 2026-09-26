'use strict';

// Servicios que ofrece cada doctor, elegidos del catálogo de precios de su admin/clínica.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('doctor_services', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      doctor_profile_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'doctor_profiles', key: 'id' },
        onDelete: 'CASCADE',
      },
      price_catalog_item_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'price_catalog', key: 'id' },
        onDelete: 'CASCADE',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('doctor_services', ['doctor_profile_id', 'price_catalog_item_id'], { unique: true });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('doctor_services');
  },
};

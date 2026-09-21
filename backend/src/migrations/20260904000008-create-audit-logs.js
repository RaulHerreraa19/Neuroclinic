'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('audit_logs', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      entidad: { type: Sequelize.STRING, allowNull: false },
      entidad_id: { type: Sequelize.STRING, allowNull: true },
      accion: { type: Sequelize.ENUM('create', 'read', 'update', 'delete'), allowNull: false },
      ip_address: { type: Sequelize.STRING, allowNull: true },
      detalles: { type: Sequelize.JSONB, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('audit_logs', ['entidad', 'entidad_id']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('audit_logs');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_audit_logs_accion";');
  },
};

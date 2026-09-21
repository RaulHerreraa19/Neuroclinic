'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('schedule_exceptions', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      doctor_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      fecha: { type: Sequelize.DATEONLY, allowNull: false },
      hora_inicio: { type: Sequelize.TIME, allowNull: true },
      hora_fin: { type: Sequelize.TIME, allowNull: true },
      tipo: { type: Sequelize.ENUM('bloqueo', 'vacaciones'), allowNull: false, defaultValue: 'bloqueo' },
      motivo: { type: Sequelize.STRING, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('schedule_exceptions', ['doctor_id', 'fecha']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('schedule_exceptions');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_schedule_exceptions_tipo";');
  },
};

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('doctor_schedules', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      doctor_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      dia_semana: { type: Sequelize.INTEGER, allowNull: false },
      hora_inicio: { type: Sequelize.TIME, allowNull: false },
      hora_fin: { type: Sequelize.TIME, allowNull: false },
      activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('doctor_schedules', ['doctor_id', 'dia_semana']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('doctor_schedules');
  },
};

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('doctor_profiles', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      cedula_profesional: { type: Sequelize.STRING, allowNull: false, unique: true },
      especialidad: { type: Sequelize.STRING, allowNull: false },
      biografia: { type: Sequelize.TEXT, allowNull: true },
      duracion_cita_minutos: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 45 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('doctor_profiles');
  },
};

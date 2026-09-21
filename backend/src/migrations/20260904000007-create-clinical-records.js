'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('clinical_records', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      patient_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
      },
      doctor_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
      },
      appointment_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'appointments', key: 'id' },
        onDelete: 'SET NULL',
      },
      fecha: { type: Sequelize.DATEONLY, allowNull: false },
      motivo: { type: Sequelize.TEXT, allowNull: false },
      evaluacion: { type: Sequelize.TEXT, allowNull: true },
      diagnostico: { type: Sequelize.TEXT, allowNull: true },
      plan_tratamiento: { type: Sequelize.TEXT, allowNull: true },
      notas_privadas: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('clinical_records', ['patient_id']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('clinical_records');
  },
};

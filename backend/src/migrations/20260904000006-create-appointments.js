'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('appointments', {
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
      fecha: { type: Sequelize.DATEONLY, allowNull: false },
      hora_inicio: { type: Sequelize.TIME, allowNull: false },
      hora_fin: { type: Sequelize.TIME, allowNull: false },
      estado: {
        type: Sequelize.ENUM('pendiente', 'confirmada', 'cancelada', 'completada', 'no_asistio'),
        allowNull: false,
        defaultValue: 'pendiente',
      },
      es_primera_vez: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      motivo_consulta: { type: Sequelize.STRING, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('appointments', ['doctor_id', 'fecha', 'hora_inicio'], {
      unique: true,
      name: 'appointments_doctor_slot_unique',
      where: { estado: { [Sequelize.Op.ne]: 'cancelada' } },
    });
    await queryInterface.addIndex('appointments', ['patient_id']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('appointments');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_appointments_estado";');
  },
};

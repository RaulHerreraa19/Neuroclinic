'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('patient_profiles', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      fecha_nacimiento: { type: Sequelize.DATEONLY, allowNull: false },
      sexo: { type: Sequelize.ENUM('masculino', 'femenino', 'otro'), allowNull: false },
      curp: { type: Sequelize.STRING, allowNull: true, unique: true },
      direccion: { type: Sequelize.TEXT, allowNull: true },
      contacto_emergencia_nombre: { type: Sequelize.STRING, allowNull: true },
      contacto_emergencia_telefono: { type: Sequelize.STRING, allowNull: true },
      aviso_privacidad_aceptado_en: { type: Sequelize.DATE, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('patient_profiles');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_patient_profiles_sexo";');
  },
};

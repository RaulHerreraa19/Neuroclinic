'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('doctor_profiles', 'owner_admin_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'RESTRICT',
    });
    await queryInterface.addIndex('doctor_profiles', ['owner_admin_id']);
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('doctor_profiles', 'owner_admin_id');
  },
};

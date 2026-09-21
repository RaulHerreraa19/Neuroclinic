'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'roles', {
      type: Sequelize.ARRAY(Sequelize.ENUM('admin', 'medico', 'paciente')),
      allowNull: true,
    });

    // Backfill: cada usuario existente conserva su único rol legado como primer elemento del array.
    await queryInterface.sequelize.query(
      "UPDATE users SET roles = ARRAY[role::text]::enum_users_roles[] WHERE roles IS NULL;"
    );

    // Se usa SQL crudo (en vez de changeColumn) para fijar NOT NULL: Sequelize regenera mal el
    // tipo de columna ARRAY(ENUM) al hacer changeColumn solo por nullability.
    await queryInterface.sequelize.query('ALTER TABLE users ALTER COLUMN roles SET NOT NULL;');
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('users', 'roles');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_roles";');
  },
};

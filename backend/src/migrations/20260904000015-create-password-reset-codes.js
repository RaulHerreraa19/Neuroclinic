'use strict';

// Recuperación de contraseña: códigos de un solo uso (solo se guarda su hash) y la fecha del
// último cambio de contraseña, para invalidar sesiones abiertas antes de ese cambio.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('password_reset_codes', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      channel: { type: Sequelize.ENUM('sms', 'email'), allowNull: false },
      code_hash: { type: Sequelize.STRING, allowNull: false },
      expires_at: { type: Sequelize.DATE, allowNull: false },
      attempts: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      used_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('password_reset_codes', ['user_id', 'created_at']);

    await queryInterface.addColumn('users', 'password_changed_at', { type: Sequelize.DATE, allowNull: true });

    // Normaliza los teléfonos existentes a 10 dígitos (celular MX) para poder buscarlos al
    // recuperar por SMS. Los que no encajan (incompletos, extranjeros) se dejan como estaban.
    await queryInterface.sequelize.query(`
      UPDATE users SET telefono = CASE
        WHEN length(d) = 10 THEN d
        WHEN length(d) = 12 AND d LIKE '52%' THEN right(d, 10)
        WHEN length(d) = 13 AND d LIKE '521%' THEN right(d, 10)
        ELSE telefono
      END
      FROM (SELECT id AS uid, regexp_replace(telefono, '\\D', '', 'g') AS d FROM users WHERE telefono IS NOT NULL) AS t
      WHERE users.id = t.uid;
    `);
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('users', 'password_changed_at');
    await queryInterface.dropTable('password_reset_codes');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_password_reset_codes_channel";');
  },
};

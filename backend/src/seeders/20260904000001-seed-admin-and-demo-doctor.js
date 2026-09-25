'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const adminId = uuidv4();
    const doctorId = uuidv4();
    const passwordHash = await bcrypt.hash('Nueroclinic12345', 10);

    // Insert crudo (no bulkInsert) para poder castear `roles` como ARRAY(ENUM) en el mismo
    // statement: bulkInsert no sabe formatear ese tipo y `roles` es NOT NULL.
    await queryInterface.sequelize.query(
      `INSERT INTO users
        (id, email, password_hash, role, roles, nombre, apellido_paterno, apellido_materno, telefono, is_active, created_at, updated_at)
       VALUES
        (:adminId, :adminEmail, :passwordHash, 'admin', ARRAY['admin']::enum_users_roles[], 'Admin', 'Principal', NULL, NULL, true, now(), now()),
        (:doctorId, :doctorEmail, :passwordHash, 'medico', ARRAY['medico']::enum_users_roles[], 'Ana', 'García', 'López', '5555555555', true, now(), now());`,
      {
        replacements: {
          adminId,
          doctorId,
          adminEmail: 'admin@neuroclinic.com',
          doctorEmail: 'doctor@neuroclinic.com',
          passwordHash,
        },
        type: Sequelize.QueryTypes.INSERT,
      }
    );

    await queryInterface.bulkInsert('doctor_profiles', [
      {
        id: uuidv4(),
        user_id: doctorId,
        owner_admin_id: adminId,
        cedula_profesional: '00000000',
        especialidad: 'Neurorehabilitación psicológica',
        biografia: 'Perfil de doctor de demostración para pruebas del MVP.',
        duracion_cita_minutos: 45,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('doctor_profiles', null, {});
    await queryInterface.bulkDelete('users', {
      email: ['admin@neuroclinic.com', 'doctor@neuroclinic.com'],
    });
  },
};

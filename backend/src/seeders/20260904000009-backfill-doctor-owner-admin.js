'use strict';

// Backfill de transición: puebla `roles` a partir de `role` y asigna `owner_admin_id` a los
// doctor_profiles que quedaron sin dueño tras la migración 20260904000010. Idempotente: solo
// toca filas que aún no tienen el dato nuevo, así que es seguro re-ejecutarlo.
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(
      "UPDATE users SET roles = ARRAY[role::text]::enum_users_roles[] WHERE roles IS NULL OR roles = '{}';"
    );

    // Solo es correcto asignar automáticamente al admin más antiguo cuando hay UN admin en la
    // base (el caso real al migrar este MVP). Con más de un admin ya existente, este backfill
    // no puede adivinar a quién pertenece cada doctor huérfano — se avisa en vez de asignar mal.
    const [[{ count }]] = await queryInterface.sequelize.query(
      "SELECT COUNT(*)::int AS count FROM users WHERE 'admin' = ANY(roles);"
    );
    if (Number(count) > 1) {
      console.warn(
        '[seed] Hay más de un admin en la base: no se asignó owner_admin_id automáticamente a los doctores huérfanos. Asígnalo manualmente.'
      );
      return;
    }

    await queryInterface.sequelize.query(`
      UPDATE doctor_profiles
      SET owner_admin_id = (
        SELECT id FROM users WHERE 'admin' = ANY(roles) ORDER BY created_at ASC LIMIT 1
      )
      WHERE owner_admin_id IS NULL;
    `);
  },
  down: async () => {
    // Backfill de datos, no reversible de forma segura (no se puede distinguir un
    // owner_admin_id asignado por este seeder de uno asignado manualmente después).
  },
};

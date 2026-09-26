// Cambia la contraseña de un usuario existente (admin, médico o paciente).
// Uso:  npm run reset-password -- correo@dominio.com
// La nueva contraseña se pide por consola (no se pasa como argumento para que no quede
// en el historial de la terminal). Usa la base de datos configurada en .env (DB_*).
require('dotenv').config();
const readline = require('readline');
const bcrypt = require('bcryptjs');
const sequelize = require('../src/config/database');
const { User } = require('../src/models');

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    })
  );
}

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Uso: npm run reset-password -- correo@dominio.com');
    process.exitCode = 1;
    return;
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    console.error(`No existe un usuario con el correo ${email}.`);
    process.exitCode = 1;
    return;
  }

  console.log(`Base de datos: ${process.env.DB_HOST}/${process.env.DB_NAME}`);
  console.log(`Usuario: ${user.nombre} ${user.apellidoPaterno} (${user.roles.join(', ')})`);

  const password = await ask('Nueva contraseña (mínimo 8 caracteres): ');
  if (password.length < 8) {
    console.error('La contraseña debe tener al menos 8 caracteres.');
    process.exitCode = 1;
    return;
  }
  const confirm = await ask('Repite la contraseña: ');
  if (password !== confirm) {
    console.error('Las contraseñas no coinciden.');
    process.exitCode = 1;
    return;
  }

  user.passwordHash = await bcrypt.hash(password, 10);
  await user.save();
  console.log('Contraseña actualizada.');
}

main()
  .catch((err) => {
    console.error('Error al cambiar la contraseña:', err.message);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());

# Neuroclinic

MVP para una clínica de **neurorehabilitación psicológica** ("NeuroClinic"): los pacientes agendan cita en línea sin llamar (eligen doctor, ven horarios disponibles, y si es su primera vez capturan sus datos y quedan registrados como usuarios para citas y seguimiento futuro). Los doctores configuran su horario y capturan un expediente clínico básico. Hay un rol admin para dar de alta doctores.

El usuario que dirige este proyecto es dueño/gestor de la clínica, no un ingeniero de software — escribe en español, dirige decisiones de arquitectura con seguridad, y le importa que el cumplimiento normativo mexicano quede integrado desde el inicio, no parchado después. Responde en español salvo que pida lo contrario.

## Stack (decisión explícita del usuario — no cambiar sin confirmar)

- Backend: Node.js + Express, **JavaScript puro, sin TypeScript**.
- Frontend: React + Tailwind + Vite, **JavaScript puro** (`.jsx`, no `.tsx`).
- Base de datos: PostgreSQL, ORM Sequelize (migraciones vía `sequelize-cli`, ver `backend/.sequelizerc`).
- Auth: JWT en cookie httpOnly+secure, roles `admin` / `medico` / `paciente`.
- Los roles son deliberadamente genéricos porque una fase futura permitirá que los doctores asignen tareas/ejercicios en casa a los pacientes — no reducir el modelo de roles a solo agendamiento.

## Marco regulatorio (no es solo un detalle, es un requisito del producto)

- **NOM-004-SSA3**: contenido y manejo del expediente clínico (qué debe registrarse, conservación mínima, que las notas no se alteren una vez creadas).
- **NOM-024-SSA3**: sistemas de información de registro electrónico para la salud — seguridad, confidencialidad, trazabilidad de accesos. Es esta la que aplica al "expediente clínico virtual" (el usuario originalmente pensó que era NOM-025, que en realidad trata sobre hospitalización psiquiátrica y no aplica aquí).

Controles ya implementados por esas normas:
- `audit_logs` (`backend/src/middleware/auditLog.js`, llamado explícitamente desde los controladores): registra creación **y lectura** de `clinical_records`, y altas/cambios de `appointments`/`users`.
- Cifrado de campos clínicos sensibles (`diagnostico`, `plan_tratamiento`, `notas_privadas`) con AES-256-GCM a nivel de aplicación, vía getters/setters en `backend/src/models/clinicalRecord.js` + `backend/src/services/encryption.js`. La clave vive en `CLINICAL_ENCRYPTION_KEY` (64 hex chars / 32 bytes) — nunca hardcodear ni loguear.
- `clinical_records` usa `paranoid: true` (borrado lógico) — nunca se hace DELETE físico de un registro clínico.
- Aceptación de aviso de privacidad obligatoria al registrar paciente (`patient_profiles.aviso_privacidad_aceptado_en`).
- RBAC estricto: solo el médico tratante o un admin ven/editan el expediente de un paciente; el paciente no accede a su expediente crudo desde este MVP (pendiente de decisión clínica/legal sobre exponerlo directamente).

Al agregar cualquier funcionalidad que toque datos de salud, pensar primero en estos tres controles (auditoría, cifrado, retención) antes de escribir el endpoint.

## Arquitectura

```
backend/src/
  config/        conexión a Postgres (config/database.js), config de sequelize-cli
  models/        modelos Sequelize + asociaciones (models/index.js)
  migrations/    sequelize-cli, orden secuencial 20260904000001...8
  seeders/       admin + doctor de demostración
  controllers/   lógica de negocio por recurso
  routes/        Express routers, montados en routes/index.js bajo /api
  middleware/    auth (JWT), roles (RBAC), auditLog, validate (express-validator), errorHandler
  services/      availability.js (cálculo de huecos), appointments.js (slot/duración), encryption.js
frontend/src/
  api/           cliente axios (withCredentials:true) + funciones por recurso
  context/       AuthContext (fetch /auth/me al montar)
  components/    SlotPicker, AppointmentCard, NavBar, ProtectedRoute
  pages/         una página por ruta (ver App.jsx para el mapa completo de rutas)
```

Modelo de datos clave (todo con UUID como PK): `users` (con `role`), `patient_profiles` / `doctor_profiles` (1:1 con users), `doctor_schedules` (horario semanal recurrente), `schedule_exceptions` (bloqueos/vacaciones puntuales), `appointments` (con índice único parcial doctor+fecha+hora excluyendo `cancelada`, para permitir reagendar el mismo hueco tras cancelar), `clinical_records`, `audit_logs`.

El flujo estrella del producto es `POST /api/auth/register-patient` (`backend/src/controllers/authController.js`): crea la cuenta del paciente **y** su primera cita en una sola transacción Sequelize — es la respuesta directa al requisito de "agendar sin llamar".

## Puesta en marcha local

Ver `README.md` para el detalle completo. Resumen:
```
docker compose up -d          # Postgres en el puerto 5433 (no 5432: ver nota abajo)
cd backend && cp .env.example .env   # generar JWT_SECRET y CLINICAL_ENCRYPTION_KEY reales
npm install && npm run migrate && npm run seed && npm run dev
cd ../frontend && cp .env.example .env && npm install && npm run dev
```
Usuarios sembrados (contraseña `CambiarEste123!`): `admin@neuroclinic.test`, `doctor.demo@neuroclinic.test`.

**Nota de entorno importante**: en la máquina de desarrollo ya hay un Postgres nativo de Windows escuchando en el puerto 5432. El `docker-compose.yml` de este repo publica su Postgres en **5433** a propósito para no chocar con él — si algo falla con "autenticación password" al conectar, confirmar primero qué proceso tiene el 5432 antes de tocar credenciales.

## Diseño / marca (ver `image.png` en la raíz)

El usuario proporcionó un mockup de referencia para el diseño visual de la landing pública ("NeuroClinic"). La implementación actual del frontend (Tailwind con `teal`/`slate` genéricos) **todavía no sigue esta paleta** — es un pendiente de restyle, no algo ya aplicado. Paleta observada en el mockup (aproximada, afinar contra la imagen al implementar):

- Texto/encabezados: navy oscuro (~`#1E2358`–`#1B2A4A`, tipo `slate-900` con tinte azul).
- Acento primario (parte del texto del héroe, links, botón oscuro "Iniciar sesión"): índigo (~`#4F5FE0`–`#6366F1`).
- Acento secundario (badge "Ciencia que comprende", fondos de íconos de servicios): menta/teal (~`#34D399`–`#10B981` sobre fondo `#D1FAE5`-ish).
- Acento de llamada a la acción ("Consultar Disponibilidad"): coral/naranja (~`#FF7A50`–`#FB923C`).
- Fondo de página: lavanda muy claro (~`#F4F5FB`), no blanco puro.
- Tarjetas: blancas, bordes redondeados grandes, sombra suave.
- Botones tipo "pill" (totalmente redondeados) tanto para CTAs como para nav.

Estructura de la landing en el mockup: navbar (logo + Inicio/Servicios/Agendar Cita/Iniciar Sesión) → hero con badge + título + CTA + panel ilustrativo lateral → 3 tarjetas de servicios (Evaluación Cognitiva, Terapia de Conducta, Neurorehabilitación) → sección "Agenda tu Evaluación" con calendario mensual + panel de horas disponibles del día seleccionado. Esto es más elaborado que el `Home.jsx`/`DoctorProfile.jsx` actuales (que son funcionales pero genéricos) — si el usuario pide "aplicar el diseño", implica reestilizar estas páginas y extender `tailwind.config.js` con esta paleta, no reconstruir la lógica de negocio.

## Convenciones al extender el código

- Nunca usar TypeScript ni renombrar archivos a `.ts`/`.tsx`.
- Todo campo clínico sensible nuevo debe cifrarse igual que `diagnostico` (patrón `encryptedField` en `clinicalRecord.js`), nunca guardarse en texto plano.
- Toda mutación o lectura de `clinical_records` debe llamar a `recordAudit(...)`.
- Nuevas rutas protegidas: usar `authenticate` + `authorize(...roles)` de `backend/src/middleware/`, siguiendo el patrón ya usado en `routes/*.js`.

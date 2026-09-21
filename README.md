# Neuroclinic — MVP de agendamiento y expediente clínico

MVP para una clínica de neurorehabilitación psicológica: los pacientes agendan cita en línea (eligen doctor, ven horarios disponibles y, si es su primera vez, crean su cuenta al agendar), los doctores configuran su horario y capturan un expediente clínico básico, y el admin da de alta doctores.

Stack: Node.js + Express (JavaScript puro) · PostgreSQL + Sequelize · React + Vite + Tailwind (JavaScript puro).

## Requisitos

- Node.js 18+
- Docker Desktop (para levantar Postgres) o un Postgres propio

## Puesta en marcha

### 1. Base de datos

```bash
docker compose up -d
```

Esto levanta Postgres en **el puerto 5433** del host (no 5432, para no chocar con una instalación local de Postgres que ya exista en tu máquina).

### 2. Backend

```bash
cd backend
cp .env.example .env
```

Edita `.env` y genera valores reales para `JWT_SECRET` y `CLINICAL_ENCRYPTION_KEY`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"   # JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # CLINICAL_ENCRYPTION_KEY (debe medir 64 caracteres)
```

Instala dependencias, corre migraciones y siembra un admin + un doctor de demostración:

```bash
npm install
npm run migrate
npm run seed
npm run dev
```

El backend queda en `http://localhost:4000`. Usuarios de prueba (contraseña `CambiarEste123!`):

- `admin@neuroclinic.test` (rol admin)
- `doctor.demo@neuroclinic.test` (rol médico — configura su horario en `/horario` antes de que aparezcan huecos disponibles)

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Abre `http://localhost:5173`.

## Flujo para probar manualmente

1. Inicia sesión como `doctor.demo@neuroclinic.test` y configura su horario semanal en **Mi horario**.
2. Cierra sesión, entra a la página principal, elige al doctor y un horario disponible.
3. Llena el formulario de "primera vez" (crea la cuenta del paciente y agenda la cita en un solo paso).
4. Inicia sesión como ese paciente y revisa **Mis citas**.
5. Inicia sesión de nuevo como el doctor, ve la cita en **Mi agenda** y abre el **Expediente** del paciente para capturar una nota clínica.

## Cumplimiento normativo (NOM-004 / NOM-024)

- **Auditoría**: toda lectura y escritura sobre `clinical_records` (y altas/cambios de citas y usuarios) queda registrada en `audit_logs` (quién, qué, cuándo, desde qué IP).
- **Cifrado**: los campos clínicos sensibles (`diagnostico`, `plan_tratamiento`, `notas_privadas`) se cifran con AES-256-GCM a nivel de aplicación antes de guardarse; nunca se almacenan en texto plano.
- **Retención**: `clinical_records` usa borrado lógico (`paranoid`) — nunca se elimina físicamente un registro clínico.
- **Consentimiento**: el registro de paciente exige aceptar el aviso de privacidad, y se guarda la fecha/hora de aceptación.
- **Control de acceso**: solo el médico tratante o un admin pueden ver/editar el expediente de un paciente; el paciente no accede a su expediente crudo desde este MVP (pendiente de decisión clínica/legal sobre qué tanto exponerle directamente).

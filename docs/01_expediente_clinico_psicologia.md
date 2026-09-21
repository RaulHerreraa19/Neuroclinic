# 01 — Especificación funcional: Expediente clínico digital para Psicología

## Objetivo

Definir el comportamiento y la estructura funcional del expediente clínico digital de una aplicación SaaS orientada a profesionales de psicología en México.

El expediente debe permitir documentar de forma ordenada, confidencial, trazable y longitudinal la atención de cada paciente.

> Referencia normativa principal: NOM-004-SSA3-2012, especialmente el numeral 5.16 para expedientes de atención psicológica. La implementación legal final debe ser validada por un especialista en regulación sanitaria y protección de datos.

## Principios funcionales

1. Un paciente debe tener un expediente único dentro de cada organización.
2. El expediente debe conservar el historial clínico y las notas de evolución.
3. Las notas clínicas no deben sobrescribirse silenciosamente.
4. Toda modificación relevante debe poder rastrearse.
5. El acceso debe depender del rol y permisos del usuario.
6. Los datos clínicos deben estar separados conceptualmente de datos administrativos.
7. El sistema debe permitir consentimiento informado y gestión de documentos.
8. El expediente debe funcionar longitudinalmente: alta inicial → evaluación → tratamiento → sesiones → evolución → cierre/archivo.
9. El sistema no debe convertir automáticamente una métrica de actividad en un diagnóstico o conclusión clínica.
10. El profesional es responsable de la interpretación clínica.

## Estructura del expediente

### 1. Identificación del paciente

Campos sugeridos:

- PatientId
- Nombre
- Apellidos
- Fecha de nacimiento
- Sexo/género cuando resulte pertinente
- Teléfono
- Correo electrónico
- Domicilio, si es necesario
- Ocupación
- Estado civil, si resulta clínicamente pertinente
- Contacto de emergencia
- Relación con el contacto de emergencia
- Fecha de alta
- Estado: activo, inactivo, archivado

Evitar solicitar datos que no tengan una finalidad definida.

### 2. Motivo de consulta

Debe permitir documentar:

- Motivo expresado por el paciente
- Fecha de inicio
- Problema principal
- Síntomas o dificultades referidas
- Contexto
- Expectativas del paciente
- Fuente de la información

Debe existir un campo de texto clínico libre y, cuando sea útil, campos estructurados.

### 3. Antecedentes

Separar por categorías:

- Antecedentes personales
- Antecedentes familiares
- Antecedentes médicos relevantes
- Antecedentes psicológicos/psiquiátricos
- Medicación relevante
- Consumo de sustancias
- Contexto familiar
- Contexto social
- Contexto académico/laboral
- Otros antecedentes relevantes

No todos los campos deben ser obligatorios.

### 4. Evaluación inicial

Debe permitir registrar:

- Fecha
- Profesional
- Motivo
- Técnicas/instrumentos utilizados
- Resultados
- Observaciones
- Interpretación clínica
- Documentos adjuntos
- Conclusión de evaluación

Importante: distinguir entre el resultado bruto de un instrumento y la interpretación profesional.

### 5. Diagnóstico / problemas clínicos

Debe permitir:

- Diagnóstico o problema clínico
- Código, cuando corresponda
- Fecha
- Profesional que lo registra
- Estado
- Observaciones

No generar diagnósticos automáticamente a partir de cuestionarios o actividades.

### 6. Plan terapéutico

Cada plan debe poder contener:

- Objetivo general
- Objetivos específicos
- Intervenciones propuestas
- Frecuencia
- Modalidad
- Fecha de inicio
- Fecha de revisión
- Estado
- Observaciones

Los objetivos deben poder medirse cuando tenga sentido.

Ejemplo:

Objetivo:
"Mejorar la adherencia a rutinas de sueño."

Indicador:
"Registrar rutina al menos 5 días por semana."

La métrica no debe interpretarse automáticamente como mejoría clínica.

## Sesiones clínicas

Cada sesión debe ser un registro independiente.

Campos:

- SessionId
- PatientId
- ProfessionalId
- Fecha y hora
- Duración
- Modalidad: presencial/remota/otra
- Motivo u objetivo
- Intervenciones realizadas
- Respuesta del paciente
- Observaciones clínicas
- Acuerdos
- Tareas
- Plan para próxima sesión
- Estado de la sesión

### Regla crítica

Una nota clínica finalizada no debe editarse silenciosamente.

Si se requiere modificarla:

- Crear una nueva versión o corrección.
- Mantener la versión anterior.
- Registrar usuario.
- Registrar fecha/hora.
- Registrar motivo de modificación.

## Notas de evolución

Una nota de evolución debe permitir documentar:

- Fecha
- Profesional
- Estado desde la última sesión
- Cambios relevantes
- Intervención
- Respuesta
- Evolución observada
- Plan

Se puede ofrecer una plantilla estructurada, pero debe existir espacio para documentación clínica libre.

## Consentimientos y documentos

El expediente debe soportar:

- Aviso de privacidad
- Consentimiento informado
- Consentimiento para modalidad remota, cuando corresponda
- Consentimientos adicionales
- Contratos, si aplican
- Evaluaciones
- Informes
- Documentos proporcionados por el paciente

Cada documento debe guardar:

- Tipo
- Nombre
- Versión
- Fecha
- Usuario que lo generó/subió
- Estado
- Referencia al paciente
- Hash o mecanismo de integridad, si aplica
- Historial de versiones

## Control de acceso

Roles iniciales sugeridos:

### Administrador
Puede administrar organización, usuarios, configuraciones y permisos. No debe obtener automáticamente acceso al contenido clínico solo por ser administrador.

### Psicólogo / profesional
Puede acceder a pacientes asignados y registrar información clínica según sus permisos.

### Recepción
Puede administrar citas y datos administrativos autorizados, pero no debe tener acceso automático a notas, diagnósticos o información clínica sensible.

### Supervisor
Puede acceder a expedientes de profesionales bajo su ámbito si la organización lo autoriza.

La autorización debe implementarse en backend.

## Auditoría

Registrar como mínimo:

- Usuario
- Organización
- Fecha/hora
- Acción
- Entidad
- Identificador de entidad
- Resultado
- IP cuando sea apropiado
- Información adicional necesaria para investigación de seguridad

Acciones:

- LOGIN
- LOGOUT
- CREATE
- VIEW
- UPDATE
- ARCHIVE
- EXPORT
- DOWNLOAD
- DELETE_REQUEST
- PERMISSION_CHANGE

Las consultas a expedientes clínicos sensibles también pueden registrarse para trazabilidad.

## Multi-tenancy

El sistema debe soportar múltiples organizaciones.

Modelo:

Tenant
- Users
- Patients
- ClinicalRecords
- Sessions
- Documents
- Activities
- AuditLogs

Toda entidad perteneciente a una organización debe estar asociada a TenantId.

El aislamiento debe verificarse en backend y no depender del frontend.

## Eliminación y conservación

No implementar un borrado físico simple del expediente como comportamiento normal.

Usar estados:

- ACTIVE
- INACTIVE
- ARCHIVED

Las políticas de conservación, eliminación y respuesta a solicitudes de derechos deben diseñarse con asesoría jurídica conforme a la normativa aplicable.

La NOM-004 establece un periodo mínimo de conservación del expediente clínico de cinco años contados a partir del último acto médico, por lo que la aplicación debe contemplar políticas de conservación antes de implementar eliminación definitiva.

## Seguridad técnica recomendada

- HTTPS obligatorio.
- Cifrado en tránsito.
- Cifrado de datos sensibles en reposo cuando sea técnicamente viable.
- Contraseñas con hash seguro.
- MFA opcional/obligatorio según política.
- RBAC.
- Gestión de sesiones.
- Rate limiting.
- Protección contra acceso horizontal entre pacientes.
- Backups cifrados.
- Pruebas de restauración.
- Registro de auditoría.
- Gestión segura de secretos.
- No almacenar información clínica sensible en logs de aplicación.
- No enviar contenido clínico a servicios externos sin una base legal y contractual adecuada.

## Regla para IA

Si la aplicación utiliza IA:

1. La IA puede ayudar a estructurar información.
2. La IA puede resumir notas si el profesional lo solicita.
3. La IA puede sugerir organización de información.
4. La IA no debe generar automáticamente diagnósticos clínicos como hechos.
5. La IA no debe modificar el expediente sin intervención/autorización del profesional.
6. Las salidas generadas por IA deben identificarse como asistencia automatizada.
7. El profesional debe revisar el contenido antes de incorporarlo al expediente.
8. No enviar datos clínicos a un proveedor externo sin evaluar privacidad, seguridad, finalidad y base legal.

## Modelo conceptual mínimo

Patient
- PatientId
- TenantId
- PersonalData
- Status
- CreatedAt
- UpdatedAt

ClinicalHistory
- ClinicalHistoryId
- PatientId
- ReasonForConsultation
- PersonalHistory
- FamilyHistory
- PsychologicalHistory
- MedicalHistory
- SocialContext
- CreatedAt
- UpdatedAt

ClinicalAssessment
- AssessmentId
- PatientId
- ProfessionalId
- Date
- Instrument
- RawResult
- Interpretation
- Notes

Diagnosis
- DiagnosisId
- PatientId
- ProfessionalId
- Diagnosis
- Code
- Date
- Status
- Notes

TreatmentPlan
- TreatmentPlanId
- PatientId
- ProfessionalId
- GeneralObjective
- StartDate
- ReviewDate
- Status

TreatmentGoal
- TreatmentGoalId
- TreatmentPlanId
- Description
- MeasurementMethod
- Target
- Status

ClinicalSession
- SessionId
- PatientId
- ProfessionalId
- Date
- Duration
- Modality
- Objective
- Intervention
- PatientResponse
- ClinicalNotes
- Agreements
- Homework
- NextPlan
- Status

ClinicalNoteVersion
- ClinicalNoteVersionId
- SessionId
- Version
- Content
- CreatedBy
- CreatedAt
- ChangeReason

Consent
- ConsentId
- PatientId
- Type
- Version
- AcceptedAt
- SignatureReference
- Status

Document
- DocumentId
- PatientId
- Type
- FileReference
- Version
- UploadedBy
- UploadedAt

AuditLog
- AuditLogId
- TenantId
- UserId
- Action
- EntityType
- EntityId
- Timestamp
- Metadata

## UX recomendada

La vista del paciente debe funcionar como un timeline:

Paciente
→ Datos
→ Historia clínica
→ Evaluaciones
→ Plan terapéutico
→ Sesiones
→ Actividades
→ Resultados
→ Documentos
→ Consentimientos
→ Auditoría según permisos

La información clínica más importante debe ser visible sin obligar al profesional a navegar por múltiples pantallas.

## Referencias normativas

- NOM-004-SSA3-2012, Del expediente clínico.
- NOM-024-SSA3-2012, Sistemas de información de registro electrónico para la salud.
- Ley Federal de Protección de Datos Personales en Posesión de los Particulares y su normativa aplicable.

Estas referencias deben revisarse antes de declarar que el software es jurídicamente "cumplidor".

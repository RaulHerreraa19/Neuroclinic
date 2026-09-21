# 02 — Especificación funcional: Seguimiento de pacientes y actividades inspirado en NeuronUP

## Objetivo

Definir un sistema de seguimiento de intervención psicológica/cognitiva basado en la idea de NeuronUP:

Paciente → actividad → ejecución → resultado → sesión → historial → análisis → nueva intervención.

El objetivo no es copiar NeuronUP, sino implementar un modelo equivalente y adaptable al producto.

NeuronUP actualmente permite crear perfiles de usuarios, asignar actividades, crear sesiones y programas, registrar resultados automáticamente y consultar la evolución del usuario. Los resultados pueden analizarse por actividad, sesión y programa. 

## Conceptos principales

### Paciente

Representa a la persona que recibe la intervención.

Un paciente puede tener:

- Expediente clínico
- Profesional(es) asignado(s)
- Objetivos
- Actividades
- Sesiones
- Programas
- Ejecuciones
- Resultados
- Observaciones
- Informes

### Actividad

Es una intervención o ejercicio individual.

Ejemplos:

- Memoria
- Atención
- Regulación emocional
- Identificación de pensamientos
- Resolución de problemas
- Habilidades sociales
- Tareas de exposición
- Registro de emociones
- Actividades cognitivas
- Tareas para casa

Campos:

- ActivityId
- TenantId
- Name
- Description
- Category
- Objective
- Instructions
- Type
- Difficulty
- EstimatedDuration
- IsDigital
- IsActive

## Categorías

La aplicación debe permitir categorías configurables.

Ejemplo:

- Atención
- Memoria
- Funciones ejecutivas
- Lenguaje
- Habilidades sociales
- Regulación emocional
- Psicoeducación
- Conducta
- Mindfulness
- Actividades de la vida diaria
- Tareas para casa

No asumir que todas las actividades aplican a todos los pacientes.

## Tipo de actividad

Puede existir:

### Juego

Actividad con interacción y puntuación.

### Ficha

Actividad estructurada con respuestas.

### Formulario

Cuestionario o registro.

### Generador

Actividad que puede producir múltiples variantes.

### Tarea abierta

El paciente debe realizar una acción y reportar resultado.

### Actividad clínica personalizada

Creada por el profesional para una necesidad concreta.

## Dificultad

La dificultad debe ser configurable:

- Nivel
- Fase
- Complejidad
- Tiempo
- Número de estímulos
- Número de distractores
- Restricciones

Ejemplo:

Actividad:
Memoria visual

Nivel 1:
4 elementos

Nivel 2:
6 elementos

Nivel 3:
8 elementos

Nivel 4:
10 elementos

No todas las actividades requieren niveles.

## Sesión

Una sesión es un conjunto ordenado de actividades.

NeuronUP describe una sesión como un conjunto de actividades y permite planificarlas, personalizarlas y asignarlas a uno o varios usuarios. Los resultados se registran automáticamente al ejecutarse. 

Modelo:

Session
- SessionId
- TenantId
- Name
- PatientId
- ProfessionalId
- ScheduledDate
- StartAt
- EndAt
- Modality
- Status
- Notes

SessionActivity
- SessionActivityId
- SessionId
- ActivityId
- Order
- AssignedLevel
- Required
- Instructions
- Status

## Estados de sesión

- DRAFT
- SCHEDULED
- AVAILABLE
- IN_PROGRESS
- COMPLETED
- CANCELLED
- EXPIRED

## Ejecución

La ejecución representa lo que realmente ocurrió.

No confundir:

Actividad asignada
con
Actividad realizada.

Una actividad puede ser asignada pero nunca ejecutada.

Modelo:

ActivityExecution
- ExecutionId
- PatientId
- ActivityId
- SessionId
- StartedAt
- CompletedAt
- Duration
- Level
- Attempts
- CorrectAnswers
- IncorrectAnswers
- Score
- CompletionPercentage
- Status

## Estados de ejecución

- NOT_STARTED
- IN_PROGRESS
- COMPLETED
- FAILED
- INCOMPLETE
- CANCELLED

## Resultados

Los resultados deben guardar el dato original.

Ejemplo:

ActivityExecution

Score = 82
Correct = 18
Incorrect = 4
Duration = 482 seconds
Level = 3

No sobrescribir resultados históricos.

Cada ejecución representa una fotografía de ese momento.

## Resultado cualitativo

Además del resultado numérico:

- Observación del profesional
- Comentario del paciente
- Dificultad percibida
- Nivel de ayuda requerido
- Conducta observada
- Adherencia
- Incidencias

Esto es importante porque una métrica cuantitativa no equivale automáticamente a evolución clínica.

## Indicadores

Se pueden mostrar indicadores visuales inspirados en NeuronUP.

Ejemplo:

SUPERADO
El paciente alcanzó el criterio definido.

ACEPTABLE
El paciente completó la actividad con errores dentro de un rango permitido.

NO SUPERADO
No alcanzó el criterio definido.

INCOMPLETO
No terminó la actividad.

SUBIÓ DE NIVEL
Alcanzó el criterio para aumentar dificultad.

BAJÓ DE NIVEL
No mantuvo el desempeño requerido.

Los umbrales deben ser configurables por actividad.

## Regla importante

No definir:

"90% = paciente mejoró clínicamente".

Definir:

"90% = desempeño de 90% en esta actividad bajo estas condiciones".

La interpretación clínica debe pertenecer al profesional.

## Programa

Un programa es una intervención compuesta por múltiples sesiones planificadas.

Modelo:

Program
- ProgramId
- PatientId
- ProfessionalId
- Name
- Description
- StartDate
- EndDate
- Status
- AdaptationMode

ProgramSession
- ProgramSessionId
- ProgramId
- SessionId
- PlannedDate
- Order
- Status

Ejemplo:

Programa:
"Entrenamiento de atención"

Semana 1:
- Sesión 1
- Sesión 2

Semana 2:
- Sesión 3
- Sesión 4

Semana 3:
- Sesión 5
- Sesión 6

NeuronUP utiliza programas para planificar conjuntos de sesiones con antelación y puede ajustar automáticamente el nivel al progreso de cada usuario. 

## Motor de adaptación

La aplicación puede ofrecer adaptación automática.

Ejemplo:

Regla:

Si:
- Score >= 90
- Completed = true
- Errors <= 2
- Durante 2 ejecuciones consecutivas

Entonces:

- Incrementar nivel.

Si:
- Score < 60
- Errors > límite
- Durante 2 ejecuciones consecutivas

Entonces:

- Mantener o disminuir nivel.

Pero:

### La adaptación automática debe ser una configuración

Opciones:

- Manual
- Recomendada
- Automática

En modo recomendado:

El sistema muestra:

"El paciente ha mantenido un desempeño superior al criterio durante 3 ejecuciones. Se recomienda aumentar dificultad."

El profesional decide.

## Seguimiento longitudinal

El perfil del paciente debe mostrar:

### Resumen

- Actividades realizadas
- Sesiones completadas
- Sesiones pendientes
- Adherencia
- Último resultado
- Evolución
- Objetivos activos

### Evolución

Mostrar gráficos por:

- Actividad
- Categoría
- Objetivo
- Periodo
- Nivel
- Score
- Tiempo
- Errores
- Completitud

Ejemplo:

Memoria visual

Semana 1 → 65
Semana 2 → 72
Semana 3 → 79
Semana 4 → 84

## Comparaciones

Permitir comparar:

- Paciente contra su propio histórico
- Primera evaluación vs evaluación posterior
- Periodos
- Actividades
- Categorías
- Objetivos

No utilizar comparaciones poblacionales como conclusión clínica sin validación estadística y contexto apropiado.

## NeuronUP Score como referencia conceptual

NeuronUP utiliza un score para comparar resultados actuales con resultados anteriores y facilitar el seguimiento del progreso. 

Para una aplicación propia, no copiar el nombre ni asumir que la misma fórmula es válida.

Crear un indicador propio, por ejemplo:

PatientProgressMetric

Debe documentar:

- Fórmula
- Variables
- Periodo
- Actividades incluidas
- Normalización
- Fecha de cálculo
- Versión del algoritmo

Si cambia la fórmula, conservar la versión anterior para que los resultados históricos sigan siendo reproducibles.

## Actividades para casa

Debe existir la posibilidad de asignar actividades fuera de consulta.

Modelo:

HomeworkAssignment
- HomeworkId
- PatientId
- ActivityId
- SessionId
- AssignedAt
- DueAt
- Instructions
- Status
- CompletedAt

Estados:

- ASSIGNED
- STARTED
- COMPLETED
- OVERDUE
- CANCELLED

El profesional debe poder ver:

- Qué se asignó
- Cuándo
- Si fue abierto
- Si fue completado
- Resultado
- Tiempo empleado
- Comentarios

NeuronUP ofrece sesiones remotas para mantener la continuidad del trabajo fuera del centro. 

## Adherencia

Separar:

### Adherencia de asistencia

Citas realizadas / citas programadas.

### Adherencia de actividades

Actividades completadas / actividades asignadas.

### Desempeño

Resultado obtenido en las actividades.

No mezclar estas métricas.

Ejemplo:

Paciente:

Asistencia: 90%
Actividades: 70%
Desempeño: 84%

Esto describe tres dimensiones diferentes.

## Observaciones clínicas

Cada sesión puede incluir:

- Observación general
- Conducta
- Estado emocional observado
- Ayudas proporcionadas
- Dificultades
- Comentarios
- Interpretación profesional

Las observaciones deben quedar asociadas a la sesión o ejecución correspondiente.

## Dashboard del profesional

El dashboard del paciente debería mostrar:

### Paciente

Nombre
Profesional
Plan activo

### Objetivos

Objetivo 1
Estado

Objetivo 2
Estado

### Próxima sesión

Fecha
Modalidad
Actividades

### Actividad reciente

Actividad
Fecha
Resultado
Nivel

### Evolución

Gráficas

### Adherencia

Actividades asignadas
Actividades completadas

### Alertas

Ejemplos:

- 3 actividades incompletas
- Disminución sostenida del desempeño
- Programa próximo a vencer
- Sesión pendiente
- Objetivo sin revisión

Las alertas deben ser informativas y configurables, no diagnósticos.

## Flujo completo

### Paso 1

Crear paciente.

### Paso 2

Crear/actualizar expediente.

### Paso 3

Definir objetivos terapéuticos.

### Paso 4

Seleccionar actividades.

### Paso 5

Crear sesión.

### Paso 6

Asignar sesión al paciente.

### Paso 7

Paciente realiza actividades.

### Paso 8

Registrar ejecuciones automáticamente.

### Paso 9

Calcular métricas.

### Paso 10

Profesional revisa resultados.

### Paso 11

Profesional agrega observaciones.

### Paso 12

Profesional decide:

- Mantener
- Aumentar dificultad
- Reducir dificultad
- Cambiar actividad
- Crear nueva sesión
- Modificar objetivo

### Paso 13

Guardar nueva intervención.

### Paso 14

Repetir y comparar evolución.

## Modelo de datos completo

Patient
- PatientId
- TenantId

Professional
- ProfessionalId
- TenantId

Activity
- ActivityId
- TenantId
- Name
- Category
- Type
- Difficulty
- Configuration

Session
- SessionId
- PatientId
- ProfessionalId
- Date
- Status

SessionActivity
- SessionActivityId
- SessionId
- ActivityId
- Order
- AssignedLevel

ActivityExecution
- ExecutionId
- PatientId
- SessionId
- ActivityId
- StartedAt
- CompletedAt
- Duration
- Level
- Attempts
- Correct
- Incorrect
- Score
- Status

ActivityObservation
- ObservationId
- ExecutionId
- ProfessionalId
- Content
- CreatedAt

Program
- ProgramId
- PatientId
- ProfessionalId
- StartDate
- EndDate
- Status

ProgramSession
- ProgramSessionId
- ProgramId
- SessionId
- PlannedDate

HomeworkAssignment
- HomeworkId
- PatientId
- ActivityId
- AssignedAt
- DueAt
- Status

ProgressMetric
- ProgressMetricId
- PatientId
- MetricType
- Value
- PeriodStart
- PeriodEnd
- AlgorithmVersion

## Reglas de negocio

### Regla 1

Nunca modificar una ejecución histórica.

### Regla 2

Una sesión puede existir sin haber sido completada.

### Regla 3

Una actividad asignada no significa que haya sido realizada.

### Regla 4

Un resultado pertenece a una ejecución concreta.

### Regla 5

Los resultados históricos deben poder reconstruirse.

### Regla 6

Cambiar una actividad no debe modificar las ejecuciones anteriores.

### Regla 7

Cambiar la configuración de una actividad debe generar una nueva versión si afecta la interpretación de resultados.

### Regla 8

Las métricas calculadas deben indicar qué algoritmo/versión las produjo.

### Regla 9

El profesional debe poder sobrescribir/revisar una recomendación automática.

### Regla 10

La automatización nunca debe sustituir la decisión clínica.

## IA aplicada al seguimiento

La IA puede ayudar con:

- Resumen de evolución
- Identificación de tendencias
- Comparación de resultados
- Resumen de sesiones
- Generación de borradores
- Sugerencias de actividades
- Detección de baja adherencia
- Preparación de informes

La IA debe devolver:

- Evidencia utilizada
- Datos/periodo analizado
- Nivel de incertidumbre cuando aplique
- Recomendación como borrador

Ejemplo:

"Durante las últimas 4 sesiones el desempeño en la actividad X aumentó de 62 a 81 puntos. La adherencia fue de 75%. Se sugiere revisar si el aumento de dificultad es apropiado."

No:

"El paciente ha mejorado clínicamente."

## Principio de diseño

El sistema debe responder tres preguntas:

1. ¿Qué se le pidió al paciente?
2. ¿Qué hizo realmente?
3. ¿Qué observó e interpretó el profesional?

Separar estas tres capas evita confundir actividad, desempeño y juicio clínico.

## Referencia conceptual de NeuronUP

NeuronUP actualmente estructura su producto alrededor de:

- Perfiles de usuarios
- Actividades
- Sesiones
- Programas
- Resultados digitales
- Seguimiento histórico
- Sesiones remotas
- Informes

Los resultados de actividades y sesiones se registran automáticamente en el perfil del usuario y permiten al profesional revisar la evolución y ajustar la intervención. 

La implementación propia debe tomar estos conceptos como referencia funcional y no asumir que reproduce la arquitectura interna, algoritmos o propiedad intelectual de NeuronUP.

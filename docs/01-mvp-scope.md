# MVP Scope — Plataforma Escolar CFV

## Roles
- Admin (tú): crea usuarios y estructura académica.
- Maestro: gestiona grupos, tareas, asistencia, calificaciones.
- Alumno: consulta tareas, entrega, consulta calificaciones/asistencia.

## Login (sin emails)
- No se usarán correos reales.
- Cada usuario tendrá: username + password.
- Recomendación técnica: usar Supabase Auth con "pseudo-email" (username@cfv.local) solo para login interno, sin enviar correos.

## Funciones MVP v1

### Admin
- CRUD usuarios (alta/baja lógica)
- CRUD grupos
- CRUD materias
- Asignar maestro ↔ materia ↔ grupo
- Inscribir alumno ↔ grupo

### Maestro
- Ver grupos asignados y lista de alumnos
- Crear tareas (título, descripción, fecha límite)
- Ver entregas
- Pasar asistencia por fecha
- Capturar calificaciones

### Alumno
- Ver materias/grupos
- Ver tareas
- Entregar tarea (texto y/o archivo)
- Ver calificaciones y asistencia

## No incluido en MVP (para v2)
- Notificaciones push/email
- Reportes avanzados
- Pagos
- Chats

# Plataforma Escolar CFV — Steps Log

## Done
### Paso 1 — GitHub / colaboración
1.1 Repo creado: plataforma-escolar-cfv  
1.2 Colaboradores agregados  
1.3 Ramas: master (principal), develop (integración)  
1.4 Branch rules: PR requerido (con bypass si aplica)

### Paso 2 — Next.js base
2.1 Node + pnpm instalados  
2.2 Next.js creado (App Router) y corre en localhost:3000  
2.3 Push inicial a master/develop

### Paso 3 — Setup para equipo
3.1 .env.example agregado y mergeado a develop  
3.2 .gitignore ajustado para permitir .env.example

### Paso 4 — Rutas base
4.1 Rutas: /login, /student, /teacher, /admin (placeholders)  
4.2 Home / linkea a /login  
4.3 PR mergeado a develop

## Next
### Paso 5 — Planeación formal
5.1 docs/ con alcance MVP, backlog y este log  
5.2 Definir roles y auth sin emails  
5.3 Definir KPIs de demo

### Paso 6 — DevOps mínimo (evidencia)
6.1 GitHub Actions: lint + typecheck + build  
6.2 Vercel deploy + variables de entorno  
6.3 PR checks como evidencia

### Paso 7 — Backend (Supabase)
7.1 Crear proyecto Supabase  
7.2 Tablas + RLS policies  
7.3 Seed demo (admin/teacher/student)

### Paso 8 — Auth + Roles
8.1 Login real  
8.2 Redirección por rol (admin/teacher/student)  
8.3 Guards + sesiones

### Paso 9 — Módulos MVP
9.1 Admin: usuarios/grupos/materias/asignaciones  
9.2 Maestro: tareas/asistencia/calificaciones  
9.3 Alumno: ver tareas/entregar/ver calificaciones

### Paso 10 — Demo final
10.1 Datos demo listos  
10.2 Script de demo (qué mostrar en 5–8 min)

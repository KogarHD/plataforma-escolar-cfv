\# Plataforma Escolar CFV — Steps Log



\## TL;DR (Estado actual)

\- App: Next.js (App Router) + Supabase.

\- Auth: login con \*\*username + password\*\* (internamente se usa `username@cfv.local`).

\- Roles: `admin`, `teacher`, `student` (rol en `public.profiles.role`).

\- UI: Dashboard con \*\*sidebar\*\* (AppShell) para Admin/Teacher/Student + logout + guards por rol.

\- Admin CRUD:

&nbsp; - ✅ `/admin/programs` (Carreras / `programs`) CRUD funcionando

&nbsp; - ✅ `/admin/terms` (Cuatrimestres / `terms`) CRUD funcionando (tabla real: `program\_id`, `number`, `name`, `start\_date`, `end\_date`, `is\_active`)

\- Supabase:

&nbsp; - ✅ Schema creado + RLS

&nbsp; - ✅ Seed base (program + terms + group + subjects)

&nbsp; - ✅ Usuarios demo creados en Auth y perfiles con rol en `profiles`



---



\## Cómo correr en local

1\) Instalar deps:

\- Git + Node + pnpm



2\) En la raíz del repo, crear `.env.local` (NO se commitea):

```env

NEXT\_PUBLIC\_SUPABASE\_URL=...

NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY=...


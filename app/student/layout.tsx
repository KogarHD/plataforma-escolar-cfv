// C:\Users\KOGARPC\Proyectos\plataforma-escolar-cfv\app\student\layout.tsx
import RequireRole from "@/components/RequireRole";
import AppShell from "@/components/AppShell";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="student">
      <AppShell
        title="Alumno"
        nav={[
          { label: "Inicio", href: "/student" },
          { label: "Mi grupo", href: "/student/group" },
          { label: "Tareas", href: "/student/assignments" },
        ]}
      >
        {children}
      </AppShell>
    </RequireRole>
  );
}
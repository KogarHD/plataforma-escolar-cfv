import RequireRole from "@/components/RequireRole";
import AppShell from "@/components/AppShell";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="student">
      <AppShell
        title="Alumno"
        nav={[
          { label: "Inicio", href: "/student" },
          { label: "Mis materias", href: "/student/subjects" },
          { label: "Tareas", href: "/student/assignments" },
        ]}
      >
        {children}
      </AppShell>
    </RequireRole>
  );
}

import RequireRole from "@/components/RequireRole";
import AppShell from "@/components/AppShell";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="teacher">
      <AppShell
        title="Maestro"
        nav={[
          { label: "Inicio", href: "/teacher" },
          { label: "Mis grupos", href: "/teacher/groups" },
          { label: "Tareas", href: "/teacher/assignments" },
        ]}
      >
        {children}
      </AppShell>
    </RequireRole>
  );
}

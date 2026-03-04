import RequireRole from "@/components/RequireRole";
import AppShell from "@/components/AppShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="admin">
      <AppShell
        title="Administrador"
        nav={[
          { label: "Inicio", href: "/admin" },
          { label: "Usuarios", href: "/admin/users" },
          { label: "Carreras", href: "/admin/programs" },
          { label: "Cuatrimestres", href: "/admin/terms" },
          { label: "Grupos", href: "/admin/groups" },
          { label: "Materias", href: "/admin/subjects" },
          { label: "Asignaciones", href: "/admin/assignments" },
        ]}
      >
        {children}
      </AppShell>
    </RequireRole>
  );
}

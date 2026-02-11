// C:\Users\edgar\Proyectos\plataforma-escolar-cfv\app\admin\layout.tsx
import RequireRole from "@/components/RequireRole";
import LogoutButton from "@/components/LogoutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="admin">
      <div className="min-h-screen bg-white text-slate-900">
        <div className="border-b border-slate-200">
          <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
            <div className="font-semibold">Admin</div>
            <LogoutButton />
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-6 py-6">{children}</div>
      </div>
    </RequireRole>
  );
}

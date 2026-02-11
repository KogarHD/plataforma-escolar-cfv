// C:\Users\edgar\Proyectos\plataforma-escolar-cfv\components\LogoutButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LogoutButton() {
  const router = useRouter();

  return (
    <button
      className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
      onClick={async () => {
        await supabase.auth.signOut();
        router.replace("/login");
      }}
    >
      Cerrar sesión
    </button>
  );
}

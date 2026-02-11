"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Role = "admin" | "teacher" | "student";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toEmail = (u: string) => `${u.trim().toLowerCase()}@cfv.local`;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const email = toEmail(username);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setLoading(false);
      setError("Usuario o contraseña incorrectos.");
      return;
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
const user = userData.user;

if (userError || !user) {
  setLoading(false);
  setError("No se pudo obtener tu sesión. Intenta de nuevo.");
  return;
}

const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", user.id)
  .maybeSingle();

if (profileError) {
  console.log("profileError:", profileError);
}
if (!profile?.role) {
  console.log("profile:", profile);
  setLoading(false);
  setError("No se pudo leer tu rol. Contacta al admin.");
  return;
}

if (profileError || !profile?.role) {
  console.error("profileError:", profileError);
  setLoading(false);
  setError("No se pudo leer tu rol. Contacta al admin.");
  return;
}


    if (profileError || !profile?.role) {
      setLoading(false);
      setError("No se pudo leer tu rol. Contacta al admin.");
      return;
    }

    const role = profile.role as Role;

    setLoading(false);

    if (role === "admin") router.replace("/admin");
    else if (role === "teacher") router.replace("/teacher");
    else router.replace("/student");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-black/20 p-6">
        <h1 className="text-2xl font-bold">Plataforma Escolar CFV</h1>
        <p className="text-sm text-white/70 mt-1">
          Inicia sesión con tu usuario y contraseña.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-white/80">Usuario</label>
            <input
              className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin / profe1 / alumno1"
              autoComplete="username"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-white/80">Contraseña</label>
            <input
              className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              type="password"
              autoComplete="current-password"
            />
          </div>

          {error && <div className="text-sm text-red-400">{error}</div>}

          <button
            disabled={loading}
            className="w-full rounded-lg bg-white text-black font-semibold py-2 disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <p className="text-xs text-white/50">
            * Internamente usamos usuarios @cfv.local (solo para demo).
          </p>
        </form>
      </div>
    </div>
  );
}

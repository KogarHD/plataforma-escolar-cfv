export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl border p-6">
        <h1 className="text-xl font-semibold">Plataforma Escolar CFV</h1>
        <p className="text-sm text-neutral-500 mt-1">Inicio de sesión</p>

        <div className="mt-6 space-y-3">
          <label className="block">
            <span className="text-sm">Usuario</span>
            <input className="mt-1 w-full rounded-md border p-2" placeholder="usuario" />
          </label>

          <label className="block">
            <span className="text-sm">Contraseña</span>
            <input className="mt-1 w-full rounded-md border p-2" type="password" placeholder="••••••••" />
          </label>

          <button className="w-full rounded-md bg-black text-white py-2">
            Entrar
          </button>
        </div>
      </div>
    </main>
  );
}

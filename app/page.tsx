import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="rounded-xl border p-6 text-center">
        <h1 className="text-xl font-semibold">Plataforma Escolar CFV</h1>
        <p className="text-neutral-500 mt-2">Inicio del proyecto</p>
        <Link className="inline-block mt-4 underline" href="/login">
          Ir a Login
        </Link>
      </div>
    </main>
  );
}


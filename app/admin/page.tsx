import AdminDashboardClient from './ui'

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Inicio</h1>
        <p className="text-sm text-muted-foreground">Resumen general de la plataforma.</p>
      </div>

      <AdminDashboardClient />
    </div>
  )
}
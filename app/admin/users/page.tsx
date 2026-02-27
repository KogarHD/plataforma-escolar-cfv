import UsersClient from './ui'

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Usuarios</h1>
        <p className="text-sm text-muted-foreground">Crea usuarios y asigna roles (solo admin).</p>
      </div>

      <UsersClient />
    </div>
  )
}
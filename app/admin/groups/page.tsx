import GroupsClient from './ui'

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Grupos</h1>
        <p className="text-sm text-muted-foreground">Grupos por carrera + cuatrimestre (con modalidad).</p>
      </div>

      <GroupsClient />
    </div>
  )
}
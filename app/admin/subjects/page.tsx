import SubjectsClient from './ui'

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Materias</h1>
        <p className="text-sm text-muted-foreground">Materias por carrera y cuatrimestre (opcional).</p>
      </div>

      <SubjectsClient />
    </div>
  )
}

'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { createGroup, deleteGroup, updateGroup } from './actions'

type Program = { id: string; name: string }
type Term = { id: string; program_id: string; number: number; name: string }
type Group = {
  id: string
  program_id: string
  term_id: string
  code: string
  shift: 'matutino' | 'vespertino' | 'nocturno'
  created_at: string
}

type Shift = Group['shift']

function termLabel(t: Term) {
  return `C${t.number} — ${t.name}`
}

export default function GroupsClient(props: { programs: Program[]; terms: Term[]; groups: Group[] }) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  const programsById = React.useMemo(() => new Map(props.programs.map((p) => [p.id, p])), [props.programs])
  const termsById = React.useMemo(() => new Map(props.terms.map((t) => [t.id, t])), [props.terms])

  const [mode, setMode] = React.useState<'create' | 'edit' | null>(null)
  const [editingId, setEditingId] = React.useState<string>('')

  const [programId, setProgramId] = React.useState('')
  const [termId, setTermId] = React.useState('')
  const [code, setCode] = React.useState('')
  const [shift, setShift] = React.useState<Shift>('matutino')

  const termsForProgram = React.useMemo(() => {
    if (!programId) return []
    return props.terms.filter((t) => t.program_id === programId)
  }, [props.terms, programId])

  function resetForm() {
    setProgramId('')
    setTermId('')
    setCode('')
    setShift('matutino')
    setEditingId('')
  }

  function openCreate() {
    resetForm()
    setMode('create')
  }

  function openEdit(g: Group) {
    setEditingId(g.id)
    setProgramId(g.program_id)
    setTermId(g.term_id)
    setCode(g.code)
    setShift(g.shift)
    setMode('edit')
  }

  function closeModal() {
    setMode(null)
    resetForm()
  }

  async function onSubmit() {
    if (!programId || !termId || !code.trim()) {
      alert('Completa Carrera, Cuatrimestre y Grupo.')
      return
    }

    startTransition(async () => {
      try {
        if (mode === 'create') {
          await createGroup({
            program_id: programId,
            term_id: termId,
            code: code.trim(),
            shift,
          })
        } else if (mode === 'edit') {
          await updateGroup(editingId, {
            program_id: programId,
            term_id: termId,
            code: code.trim(),
            shift,
          })
        }
        closeModal()
        router.refresh()
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Error guardando grupo')
      }
    })
  }

  async function onDelete(id: string) {
    const ok = confirm('¿Eliminar este grupo?')
    if (!ok) return

    startTransition(async () => {
      try {
        await deleteGroup(id)
        router.refresh()
      } catch (e) {
        alert(e instanceof Error ? e.message : 'Error eliminando grupo')
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button
          className="inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          onClick={openCreate}
          disabled={pending}
        >
          Nuevo grupo
        </button>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr className="text-left">
              <th className="p-3">Carrera</th>
              <th className="p-3">Cuatrimestre</th>
              <th className="p-3">Grupo</th>
              <th className="p-3">Turno</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {props.groups.length === 0 ? (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={5}>
                  No hay grupos todavía.
                </td>
              </tr>
            ) : (
              props.groups.map((g) => {
                const p = programsById.get(g.program_id)
                const t = termsById.get(g.term_id)
                return (
                  <tr key={g.id} className="border-b last:border-b-0">
                    <td className="p-3">{p?.name ?? g.program_id}</td>
                    <td className="p-3">{t ? termLabel(t) : g.term_id}</td>
                    <td className="p-3 font-medium">{g.code}</td>
                    <td className="p-3 capitalize">{g.shift}</td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        className="rounded-md border px-3 py-1 text-xs font-medium disabled:opacity-50"
                        onClick={() => openEdit(g)}
                        disabled={pending}
                      >
                        Editar
                      </button>
                      <button
                        className="rounded-md border border-red-600 px-3 py-1 text-xs font-medium text-red-600 disabled:opacity-50"
                        onClick={() => onDelete(g.id)}
                        disabled={pending}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {mode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-background p-4 shadow-lg">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">{mode === 'create' ? 'Nuevo grupo' : 'Editar grupo'}</h2>
              <p className="text-sm text-muted-foreground">Carrera + Cuatrimestre + Grupo + Turno</p>
            </div>

            <div className="grid gap-3">
              <div className="grid gap-1">
                <label className="text-sm font-medium">Carrera</label>
                <select
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={programId}
                  onChange={(e) => {
                    setProgramId(e.target.value)
                    setTermId('')
                  }}
                  disabled={pending}
                >
                  <option value="">Selecciona una carrera</option>
                  {props.programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-1">
                <label className="text-sm font-medium">Cuatrimestre</label>
                <select
                  className="h-10 rounded-md border bg-background px-3 text-sm disabled:opacity-50"
                  value={termId}
                  onChange={(e) => setTermId(e.target.value)}
                  disabled={pending || !programId}
                >
                  <option value="">{programId ? 'Selecciona un cuatrimestre' : 'Primero elige carrera'}</option>
                  {termsForProgram.map((t) => (
                    <option key={t.id} value={t.id}>
                      {termLabel(t)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-1">
                <label className="text-sm font-medium">Grupo</label>
                <input
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ej: 1A, 2B, A..."
                  disabled={pending}
                />
              </div>

              <div className="grid gap-1">
                <label className="text-sm font-medium">Turno</label>
                <select
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={shift}
                  onChange={(e) => setShift(e.target.value as Shift)}
                  disabled={pending}
                >
                  <option value="matutino">matutino</option>
                  <option value="vespertino">vespertino</option>
                  <option value="nocturno">nocturno</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                className="rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50"
                onClick={closeModal}
                disabled={pending}
              >
                Cancelar
              </button>
              <button
                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                onClick={onSubmit}
                disabled={pending || !programId || !termId || !code.trim()}
              >
                {mode === 'create' ? 'Crear' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
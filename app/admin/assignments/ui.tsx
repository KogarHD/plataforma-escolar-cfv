// C:\Users\edgar\Proyectos\plataforma-escolar-cfv\app\admin\assignments\ui.tsx
'use client'

import * as React from 'react'
import { createClient } from '@supabase/supabase-js'

type GroupRow = {
  id: string
  code: string | null
  modality: string | null
  program_name: string | null
  term_name: string | null
}

type SubjectRow = {
  id: string
  name: string
  program_id: string
  term_id: string | null
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw new Error(error.message)
  const token = data.session?.access_token
  if (!token) throw new Error('No autenticado')
  return token
}

function groupLabel(g: GroupRow) {
  const parts = [
    g.code ? `Grupo ${g.code}` : 'Grupo',
    g.program_name ? `• ${g.program_name}` : null,
    g.term_name ? `• ${g.term_name}` : null,
    g.modality ? `• ${g.modality}` : null,
  ].filter(Boolean)
  return parts.join(' ')
}

export default function AssignmentsClient() {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')

  const [groups, setGroups] = React.useState<GroupRow[]>([])
  const [subjects, setSubjects] = React.useState<SubjectRow[]>([])
  const [assignedIds, setAssignedIds] = React.useState<string[]>([])

  const [groupId, setGroupId] = React.useState<string>('')
  const [subjectToAdd, setSubjectToAdd] = React.useState<string>('')

  const loadBase = React.useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const token = await getAccessToken()
      const res = await fetch('/api/admin/groups-subjects', {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = (await res.json()) as {
        groups?: GroupRow[]
        subjects?: SubjectRow[]
        assignedSubjectIds?: string[]
        error?: string
      }
      if (!res.ok) throw new Error(data.error || 'Error cargando datos')

      setGroups(data.groups ?? [])
      setSubjects(data.subjects ?? [])
      setAssignedIds(data.assignedSubjectIds ?? [])

      // Auto-select primer grupo si no hay seleccionado
      if (!groupId && (data.groups?.length ?? 0) > 0) {
        setGroupId(data.groups![0].id)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando datos')
    } finally {
      setLoading(false)
    }
  }, [groupId])

  const loadAssigned = React.useCallback(async (gid: string) => {
    setLoading(true)
    setError('')
    try {
      const token = await getAccessToken()
      const res = await fetch(`/api/admin/groups-subjects?groupId=${encodeURIComponent(gid)}`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = (await res.json()) as {
        groups?: GroupRow[]
        subjects?: SubjectRow[]
        assignedSubjectIds?: string[]
        error?: string
      }
      if (!res.ok) throw new Error(data.error || 'Error cargando asignaciones')
      setGroups(data.groups ?? [])
      setSubjects(data.subjects ?? [])
      setAssignedIds(data.assignedSubjectIds ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando asignaciones')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadBase()
  }, [loadBase])

  React.useEffect(() => {
    if (groupId) void loadAssigned(groupId)
  }, [groupId, loadAssigned])

  const selectedGroup = React.useMemo(
    () => groups.find((g) => g.id === groupId) ?? null,
    [groups, groupId]
  )

  const availableSubjects = React.useMemo(() => {
    if (!selectedGroup) return []
    // Filtramos por program/term desde el lado de UI como UX (DB también valida con trigger)
    // Nota: aquí no tenemos program_id y term_id del group en payload, así que no filtramos fuerte;
    // confiamos en el trigger y mostramos todas para MVP.
    // Si quieres filtrado perfecto, lo hacemos después devolviendo program_id/term_id del group desde API.
    return subjects
      .filter((s) => !assignedIds.includes(s.id))
      .slice(0, 500)
  }, [subjects, assignedIds, selectedGroup])

  const assignedSubjects = React.useMemo(() => {
    const map = new Map(subjects.map((s) => [s.id, s]))
    return assignedIds.map((id) => map.get(id)).filter(Boolean) as SubjectRow[]
  }, [subjects, assignedIds])

  async function onAdd() {
    if (!groupId || !subjectToAdd) return
    try {
      const token = await getAccessToken()
      const res = await fetch('/api/admin/groups-subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ groupId, subjectId: subjectToAdd }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error || 'Error asignando materia')
      setSubjectToAdd('')
      await loadAssigned(groupId)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error asignando materia')
    }
  }

  async function onRemove(subjectId: string) {
    if (!groupId) return
    const ok = confirm('¿Quitar esta materia del grupo?')
    if (!ok) return
    try {
      const token = await getAccessToken()
      const res = await fetch(
        `/api/admin/groups-subjects?groupId=${encodeURIComponent(groupId)}&subjectId=${encodeURIComponent(subjectId)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error || 'Error quitando materia')
      await loadAssigned(groupId)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error quitando materia')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Asignaciones</h1>
        <p className="text-sm text-muted-foreground">Materias por grupo (agregar y quitar).</p>
      </div>

      {error ? (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm">
          <div className="font-medium">Error</div>
          <div className="text-muted-foreground">{error}</div>
        </div>
      ) : null}

      <div className="grid gap-3 rounded-md border p-3">
        <div className="grid gap-1">
          <label className="text-sm font-medium">Grupo</label>
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            disabled={loading}
          >
            {groups.length === 0 ? <option value="">No hay grupos</option> : null}
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {groupLabel(g)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-medium">Agregar materia</label>
          <div className="flex gap-2">
            <select
              className="h-10 flex-1 rounded-md border bg-background px-3 text-sm"
              value={subjectToAdd}
              onChange={(e) => setSubjectToAdd(e.target.value)}
              disabled={loading || !groupId}
            >
              <option value="">Selecciona una materia</option>
              {availableSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <button
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              onClick={() => void onAdd()}
              disabled={loading || !groupId || !subjectToAdd}
            >
              Agregar
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Si eliges una materia de otra carrera/cuatrimestre, la DB la rechazará automáticamente.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr className="text-left">
              <th className="p-3">Materias asignadas</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={2}>
                  Cargando…
                </td>
              </tr>
            ) : !groupId ? (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={2}>
                  Selecciona un grupo.
                </td>
              </tr>
            ) : assignedSubjects.length === 0 ? (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={2}>
                  Este grupo todavía no tiene materias asignadas.
                </td>
              </tr>
            ) : (
              assignedSubjects.map((s) => (
                <tr key={s.id} className="border-b last:border-b-0">
                  <td className="p-3">{s.name}</td>
                  <td className="p-3 text-right">
                    <button
                      className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-500/15"
                      onClick={() => void onRemove(s.id)}
                      disabled={loading}
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
// C:\Users\KOGARPC\Proyectos\plataforma-escolar-cfv\app\admin\assignments\ui.tsx
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

type TeacherRow = {
  id: string
  username: string | null
  email: string | null
}

type AssignmentRow = {
  group_id: string
  subject_id: string
  teacher_id: string
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

function teacherLabel(t: TeacherRow) {
  return t.username ?? t.email ?? 'Profesor'
}

export default function AssignmentsClient() {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')

  const [groups, setGroups] = React.useState<GroupRow[]>([])
  const [subjects, setSubjects] = React.useState<SubjectRow[]>([])
  const [assignedIds, setAssignedIds] = React.useState<string[]>([])

  const [teachers, setTeachers] = React.useState<TeacherRow[]>([])
  const [teacherAssignments, setTeacherAssignments] = React.useState<AssignmentRow[]>([])
  const [teacherSelectionBySubject, setTeacherSelectionBySubject] = React.useState<Record<string, string>>({})

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

      if (!groupId && (data.groups?.length ?? 0) > 0) {
        setGroupId(data.groups![0].id)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando datos')
    } finally {
      setLoading(false)
    }
  }, [groupId])

  const loadAssignedSubjects = React.useCallback(async (gid: string) => {
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
      if (!res.ok) throw new Error(data.error || 'Error cargando asignaciones de materias')
      setGroups(data.groups ?? [])
      setSubjects(data.subjects ?? [])
      setAssignedIds(data.assignedSubjectIds ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando asignaciones de materias')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadTeacherAssignments = React.useCallback(async (gid: string) => {
    try {
      const token = await getAccessToken()
      const res = await fetch(`/api/admin/teacher-assignments?groupId=${encodeURIComponent(gid)}`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = (await res.json()) as {
        teachers?: TeacherRow[]
        assignments?: AssignmentRow[]
        error?: string
      }
      if (!res.ok) throw new Error(data.error || 'Error cargando profesores')

      const teacherList = data.teachers ?? []
      const assignmentList = data.assignments ?? []

      setTeachers(teacherList)
      setTeacherAssignments(assignmentList)

      const selectionMap: Record<string, string> = {}
      for (const assignment of assignmentList) {
        selectionMap[assignment.subject_id] = assignment.teacher_id
      }
      setTeacherSelectionBySubject(selectionMap)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando profesores')
    }
  }, [])

  React.useEffect(() => {
    void loadBase()
  }, [loadBase])

  React.useEffect(() => {
    if (!groupId) return
    void loadAssignedSubjects(groupId)
    void loadTeacherAssignments(groupId)
  }, [groupId, loadAssignedSubjects, loadTeacherAssignments])

  const selectedGroup = React.useMemo(
    () => groups.find((g) => g.id === groupId) ?? null,
    [groups, groupId]
  )

  const availableSubjects = React.useMemo(() => {
    if (!selectedGroup) return []
    return subjects
      .filter((s) => !assignedIds.includes(s.id))
      .slice(0, 500)
  }, [subjects, assignedIds, selectedGroup])

  const assignedSubjects = React.useMemo(() => {
    const map = new Map(subjects.map((s) => [s.id, s]))
    return assignedIds.map((id) => map.get(id)).filter(Boolean) as SubjectRow[]
  }, [subjects, assignedIds])

  async function onAddSubject() {
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
      await loadAssignedSubjects(groupId)
      await loadTeacherAssignments(groupId)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error asignando materia')
    }
  }

  async function onRemoveSubject(subjectId: string) {
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
      await loadAssignedSubjects(groupId)
      await loadTeacherAssignments(groupId)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error quitando materia')
    }
  }

  async function onSaveTeacher(subjectId: string) {
    if (!groupId) return
    const teacherId = teacherSelectionBySubject[subjectId]
    if (!teacherId) {
      alert('Selecciona un profesor.')
      return
    }

    try {
      const token = await getAccessToken()
      const res = await fetch('/api/admin/teacher-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          groupId,
          subjectId,
          teacherId,
        }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error || 'Error guardando asignación')
      await loadTeacherAssignments(groupId)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error guardando asignación')
    }
  }

  async function onRemoveTeacher(subjectId: string) {
    if (!groupId) return
    const ok = confirm('¿Quitar el profesor asignado a esta materia?')
    if (!ok) return

    try {
      const token = await getAccessToken()
      const res = await fetch(
        `/api/admin/teacher-assignments?groupId=${encodeURIComponent(groupId)}&subjectId=${encodeURIComponent(subjectId)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error || 'Error quitando asignación')
      await loadTeacherAssignments(groupId)
      setTeacherSelectionBySubject((prev) => {
        const next = { ...prev }
        delete next[subjectId]
        return next
      })
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error quitando asignación')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Asignaciones</h1>
        <p className="text-sm text-muted-foreground">Materias y profesores por grupo.</p>
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
      </div>

      <div className="grid gap-3 rounded-md border p-3">
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
              onClick={() => void onAddSubject()}
              disabled={loading || !groupId || !subjectToAdd}
            >
              Agregar
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Si eliges una materia de otra carrera/cuatrimestre, la base de datos la rechazará.
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
                      onClick={() => void onRemoveSubject(s.id)}
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

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr className="text-left">
              <th className="p-3">Materia</th>
              <th className="p-3">Profesor</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={3}>
                  Cargando…
                </td>
              </tr>
            ) : !groupId ? (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={3}>
                  Selecciona un grupo.
                </td>
              </tr>
            ) : assignedSubjects.length === 0 ? (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={3}>
                  Primero asigna materias al grupo.
                </td>
              </tr>
            ) : (
              assignedSubjects.map((subject) => (
                <tr key={subject.id} className="border-b last:border-b-0">
                  <td className="p-3">{subject.name}</td>
                  <td className="p-3">
                    <select
                      className="h-10 min-w-[240px] rounded-md border bg-background px-3 text-sm"
                      value={teacherSelectionBySubject[subject.id] ?? ''}
                      onChange={(e) =>
                        setTeacherSelectionBySubject((prev) => ({
                          ...prev,
                          [subject.id]: e.target.value,
                        }))
                      }
                    >
                      <option value="">Selecciona un profesor</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacherLabel(teacher)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        className="rounded-md border px-3 py-1 text-xs font-medium hover:bg-muted"
                        onClick={() => void onSaveTeacher(subject.id)}
                        disabled={!teacherSelectionBySubject[subject.id]}
                      >
                        Guardar
                      </button>
                      <button
                        className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-500/15"
                        onClick={() => void onRemoveTeacher(subject.id)}
                      >
                        Quitar
                      </button>
                    </div>
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
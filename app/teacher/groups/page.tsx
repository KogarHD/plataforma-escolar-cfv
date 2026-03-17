'use client'

import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { useEffect, useMemo, useState } from 'react'

type Assignment = {
  id: string
  teacher_id: string
  group_id: string
  subject_id: string
  group_name: string
  subject_name: string
}

type AssignmentsResponse = {
  assignments: Assignment[]
}

type GroupCard = {
  groupId: string
  groupName: string
  subjects: string[]
}

export default function TeacherGroupsPage() {
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    return createClient(url, anonKey)
  }, [])

  const [data, setData] = useState<AssignmentsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        setLoading(true)
        setError(null)

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError || !session?.access_token) {
          throw new Error('No autenticado')
        }

        const response = await fetch('/api/teacher/assignments', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          cache: 'no-store',
        })

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as
            | { error?: string }
            | null

          throw new Error(body?.error || 'No se pudieron cargar los grupos del maestro')
        }

        const json = (await response.json()) as AssignmentsResponse

        if (!cancelled) {
          setData(json)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error desconocido')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [supabase])

  const groups = useMemo<GroupCard[]>(() => {
    const map = new Map<string, GroupCard>()

    for (const assignment of data?.assignments ?? []) {
      const current = map.get(assignment.group_id)

      if (!current) {
        map.set(assignment.group_id, {
          groupId: assignment.group_id,
          groupName: assignment.group_name,
          subjects: [assignment.subject_name],
        })
        continue
      }

      if (!current.subjects.includes(assignment.subject_name)) {
        current.subjects.push(assignment.subject_name)
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      a.groupName.localeCompare(b.groupName)
    )
  }, [data])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mis grupos</h1>
        <p className="text-sm text-muted-foreground">
          Aquí podrás ver los grupos que tienes asignados.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">
            Cargando grupos del maestro...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-xl border p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-xl border p-4">
          <h2 className="text-base font-semibold">Lista de grupos</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            No tienes grupos asignados todavía.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {groups.map((group) => (
            <div key={group.groupId} className="rounded-xl border p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold">{group.groupName}</h2>
                    <p className="text-sm text-muted-foreground">
                      {group.subjects.length} materia{group.subjects.length === 1 ? '' : 's'} asignada{group.subjects.length === 1 ? '' : 's'}
                    </p>
                  </div>

                  <Link
                    href={`/teacher/groups/${group.groupId}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Ver detalle
                  </Link>
                </div>

                <div>
                  <p className="text-sm font-medium">Materias</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {group.subjects.map((subject) => (
                      <span
                        key={`${group.groupId}-${subject}`}
                        className="rounded-full border px-3 py-1 text-sm"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
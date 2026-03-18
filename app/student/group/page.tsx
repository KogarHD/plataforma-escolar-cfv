'use client'

import { createClient } from '@supabase/supabase-js'
import { useEffect, useMemo, useState } from 'react'

type StudentGroupResponse = {
  student: {
    id: string
    username: string
  }
  group: {
    id: string
    code: string
  } | null
  subjects: Array<{
    id: string
    name: string
  }>
  tasks: Array<{
    id: string
    title: string
    description: string
    due_date: string | null
    created_at: string
    group_id: string
    subject_id: string
    subject_name: string
  }>
  totalSubjects: number
  totalTasks: number
}

function formatDateTime(value: string | null) {
  if (!value) return 'Sin fecha límite'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Fecha inválida'
  }

  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export default function StudentGroupPage() {
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    return createClient(url, anonKey)
  }, [])

  const [data, setData] = useState<StudentGroupResponse | null>(null)
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

        const response = await fetch('/api/student/group', {
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

          throw new Error(body?.error || 'No se pudo cargar la información del grupo')
        }

        const json = (await response.json()) as StudentGroupResponse

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mi grupo</h1>
        <p className="text-sm text-muted-foreground">
          Aquí puedes consultar la información de tu grupo inscrito.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">
            Cargando información del grupo...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-xl border p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : !data || !data.group ? (
        <div className="rounded-xl border p-4">
          <h2 className="text-base font-semibold">Información del grupo</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            No tienes un grupo inscrito actualmente.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">Grupo</p>
              <p className="mt-2 text-2xl font-bold">{data.group.code}</p>
            </div>

            <div className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">Materias</p>
              <p className="mt-2 text-2xl font-bold">{data.totalSubjects}</p>
            </div>

            <div className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">Tareas</p>
              <p className="mt-2 text-2xl font-bold">{data.totalTasks}</p>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <h2 className="text-base font-semibold">Mis materias</h2>

            {data.subjects.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                No hay materias registradas para tu grupo.
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {data.subjects.map((subject) => (
                  <span
                    key={subject.id}
                    className="rounded-full border px-3 py-1 text-sm"
                  >
                    {subject.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border p-4">
            <h2 className="text-base font-semibold">Mis tareas</h2>

            {data.tasks.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                No hay tareas registradas para tu grupo.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {data.tasks.map((task) => (
                  <div key={task.id} className="rounded-lg border p-3">
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {task.subject_name}
                    </p>
                    <p className="mt-2 text-sm">
                      {task.description || 'Sin descripción.'}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatDateTime(task.due_date)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
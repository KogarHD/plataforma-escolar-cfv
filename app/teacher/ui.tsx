// C:\Users\KOGARPC\Proyectos\plataforma-escolar-cfv\app\teacher\ui.tsx
'use client'

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

type SummaryResponse = {
  teacher: {
    id: string
    username: string
  }
  totalGroups: number
  totalSubjects: number
  totalStudents: number
  assignments: Assignment[]
}

export default function TeacherDashboardClient() {
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    return createClient(url, anonKey)
  }, [])

  const [data, setData] = useState<SummaryResponse | null>(null)
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

        const response = await fetch('/api/teacher/summary', {
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

          throw new Error(body?.error || 'No se pudo cargar el resumen del maestro')
        }

        const json = (await response.json()) as SummaryResponse

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

  if (loading) {
    return (
      <div className="rounded-xl border p-4">
        <p className="text-sm text-muted-foreground">
          Cargando resumen del maestro...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border p-4">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-xl border p-4">
        <p className="text-sm text-muted-foreground">
          No se pudo cargar la información.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Mis grupos</p>
          <p className="mt-2 text-3xl font-bold">{data.totalGroups}</p>
        </div>

        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Mis materias</p>
          <p className="mt-2 text-3xl font-bold">{data.totalSubjects}</p>
        </div>

        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Alumnos vinculados</p>
          <p className="mt-2 text-3xl font-bold">{data.totalStudents}</p>
        </div>
      </div>

      <div className="rounded-xl border p-4">
        <h2 className="text-base font-semibold">Resumen de asignaciones</h2>

        {data.assignments.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No tienes asignaciones registradas todavía.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {data.assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="rounded-lg border p-3"
              >
                <p className="text-sm">
                  <span className="font-medium">Grupo:</span> {assignment.group_name}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Materia:</span>{' '}
                  {assignment.subject_name}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
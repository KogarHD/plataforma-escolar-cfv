'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { useEffect, useMemo, useState } from 'react'

type GroupDetailResponse = {
  group: {
    id: string
    code: string
  }
  subjects: Array<{
    id: string
    name: string
  }>
  students: Array<{
    id: string
    username: string
    role: string
  }>
  enrollments: Array<{
    id: string
    student_id: string
    group_id: string
  }>
  totalStudents: number
}

export default function TeacherGroupDetailPage() {
  const params = useParams<{ groupId: string }>()
  const groupId = Array.isArray(params.groupId) ? params.groupId[0] : params.groupId

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    return createClient(url, anonKey)
  }, [])

  const [data, setData] = useState<GroupDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!groupId) return

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

        const response = await fetch(`/api/teacher/groups/${groupId}`, {
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

          throw new Error(body?.error || 'No se pudo cargar el detalle del grupo')
        }

        const json = (await response.json()) as GroupDetailResponse

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
  }, [groupId, supabase])

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/teacher/groups"
          className="text-sm text-primary hover:underline"
        >
          ← Volver a Mis grupos
        </Link>

        <h1 className="mt-2 text-2xl font-semibold">
          {loading ? 'Cargando grupo...' : data ? data.group.code : 'Detalle de grupo'}
        </h1>

        <p className="text-sm text-muted-foreground">
          Aquí puedes ver las materias asignadas y los alumnos inscritos.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">
            Cargando detalle del grupo...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-xl border p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : !data ? (
        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">
            No se pudo cargar la información del grupo.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">Grupo</p>
              <p className="mt-2 text-2xl font-bold">{data.group.code}</p>
            </div>

            <div className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">Alumnos inscritos</p>
              <p className="mt-2 text-2xl font-bold">{data.totalStudents}</p>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <h2 className="text-base font-semibold">Materias asignadas</h2>

            {data.subjects.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                No hay materias registradas para este grupo.
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
            <h2 className="text-base font-semibold">Alumnos inscritos</h2>

            {data.students.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                No hay alumnos inscritos en este grupo.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {data.students.map((student) => (
                  <div
                    key={student.id}
                    className="rounded-lg border p-3"
                  >
                    <p className="text-sm font-medium">@{student.username}</p>
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
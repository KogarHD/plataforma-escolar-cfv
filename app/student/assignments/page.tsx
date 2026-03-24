// C:\Users\edgar\Proyectos\plataforma-escolar-cfv\app\student\assignments\page.tsx
'use client'

import { createClient } from '@supabase/supabase-js'
import { useEffect, useMemo, useState } from 'react'

type Submission = {
  id: string
  task_id: string
  student_id: string
  content: string
  feedback: string
  grade: number | null
  submitted_at: string
  reviewed_at: string | null
  graded_at: string | null
  updated_at: string
}

type Task = {
  id: string
  title: string
  description: string
  due_date: string | null
  created_at: string
  group_id: string
  subject_id: string
  subject_name: string
  submission: Submission | null
  is_submitted: boolean
  is_reviewed: boolean
  is_graded: boolean
}

type StudentTasksResponse = {
  student: {
    id: string
    username: string
  }
  group: {
    id: string
    code: string
  } | null
  tasks: Task[]
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

export default function StudentAssignmentsPage() {
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    return createClient(url, anonKey)
  }, [])

  const [data, setData] = useState<StudentTasksResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [submissionContent, setSubmissionContent] = useState('')
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null)
  const [submittingTaskId, setSubmittingTaskId] = useState<string | null>(null)

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

        const response = await fetch('/api/student/tasks', {
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

          throw new Error(body?.error || 'No se pudieron cargar las tareas')
        }

        const json = (await response.json()) as StudentTasksResponse

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

  function startSubmission(task: Task) {
    setActiveTaskId(task.id)
    setSubmissionError(null)
    setSubmissionSuccess(null)
    setSubmissionContent(task.submission?.content ?? '')
  }

  function cancelSubmission() {
    setActiveTaskId(null)
    setSubmissionError(null)
    setSubmissionSuccess(null)
    setSubmissionContent('')
  }

  async function handleSubmission(task: Task) {
    try {
      setSubmittingTaskId(task.id)
      setSubmissionError(null)
      setSubmissionSuccess(null)

      const content = submissionContent.trim()

      if (!content) {
        setSubmissionError('El contenido de la entrega es obligatorio.')
        return
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        throw new Error('No autenticado')
      }

      const isEditing = Boolean(task.submission)

      const response = await fetch(
        isEditing
          ? `/api/student/submissions/${task.submission!.id}`
          : '/api/student/submissions',
        {
          method: isEditing ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(
            isEditing
              ? {
                  content,
                }
              : {
                  task_id: task.id,
                  content,
                }
          ),
        }
      )

      const body = (await response.json().catch(() => null)) as
        | {
            error?: string
            submission?: Submission
          }
        | null

      if (!response.ok || !body?.submission) {
        throw new Error(body?.error || 'No se pudo guardar la entrega')
      }

      const savedSubmission = body.submission

      setData((prev) => {
        if (!prev) return prev

        return {
          ...prev,
          tasks: prev.tasks.map((currentTask) =>
            currentTask.id === task.id
              ? {
                  ...currentTask,
                  submission: savedSubmission,
                  is_submitted: true,
                  is_reviewed: Boolean(savedSubmission.reviewed_at),
                }
              : currentTask
          ),
        }
      })

      setSubmissionSuccess(
        isEditing
          ? 'Entrega actualizada correctamente.'
          : 'Entrega registrada correctamente.'
      )

      setActiveTaskId(task.id)
      setSubmissionContent(savedSubmission.content)
    } catch (err) {
      setSubmissionError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSubmittingTaskId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tareas</h1>
        <p className="text-sm text-muted-foreground">
          Aquí puedes consultar las tareas asignadas a tu grupo, registrar tu entrega y revisar la retroalimentación del maestro.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">
            Cargando tareas...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-xl border p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : !data || !data.group ? (
        <div className="rounded-xl border p-4">
          <h2 className="text-base font-semibold">Listado de tareas</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            No tienes un grupo inscrito actualmente.
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
              <p className="text-sm text-muted-foreground">Tareas</p>
              <p className="mt-2 text-2xl font-bold">{data.totalTasks}</p>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <h2 className="text-base font-semibold">Listado de tareas</h2>

            {data.tasks.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                No hay tareas registradas para tu grupo.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {data.tasks.map((task) => {
                  const isActive = activeTaskId === task.id
                  const isSubmitting = submittingTaskId === task.id

                  return (
                    <div key={task.id} className="rounded-lg border p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold">{task.title}</h3>

                            <span className="rounded-full border px-2 py-0.5 text-xs">
                              {task.is_submitted ? 'Entregada' : 'Pendiente'}
                            </span>

                            <span className="rounded-full border px-2 py-0.5 text-xs">
                              {task.is_reviewed ? 'Revisada' : 'Sin revisar'}
                            </span>
                            <span className="rounded-full border px-2 py-0.5 text-xs">
  {task.is_graded ? 'Calificada' : 'Sin calificar'}
</span>
                          </div>

                          <p className="mt-1 text-sm text-muted-foreground">
                            {task.subject_name}
                          </p>
                        </div>

                        <div className="text-sm text-muted-foreground">
                          {formatDateTime(task.due_date)}
                        </div>
                      </div>

                      <p className="mt-3 text-sm">
                        {task.description || 'Sin descripción.'}
                      </p>

                      {task.submission ? (
                        <div className="mt-4 rounded-lg border p-3">
                          <p className="text-sm font-medium">Tu entrega</p>
                          <p className="mt-2 text-sm">{task.submission.content}</p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Última actualización: {formatDateTime(task.submission.updated_at)}
                          </p>
                        </div>
                      ) : null}

                      {task.submission ? (
                        <div className="mt-4 rounded-lg border p-3">
  <p className="text-sm font-medium">Calificación</p>
  <p className="mt-2 text-sm text-muted-foreground">
    {task.submission.grade === null ? 'Todavía no hay calificación.' : task.submission.grade}
  </p>

  {task.submission.graded_at ? (
    <p className="mt-2 text-xs text-muted-foreground">
      Calificada: {formatDateTime(task.submission.graded_at)}
    </p>
  ) : null}

  <p className="mt-4 text-sm font-medium">Feedback del maestro</p>
  <p className="mt-2 text-sm text-muted-foreground">
    {task.submission.feedback || 'Todavía no hay retroalimentación.'}
  </p>

  {task.submission.reviewed_at ? (
    <p className="mt-2 text-xs text-muted-foreground">
      Revisada: {formatDateTime(task.submission.reviewed_at)}
    </p>
  ) : null}
</div>
                      ) : null}

                      {!isActive ? (
                        <div className="mt-4">
                          <button
                            type="button"
                            className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
                            onClick={() => startSubmission(task)}
                          >
                            {task.submission ? 'Editar entrega' : 'Entregar tarea'}
                          </button>
                        </div>
                      ) : (
                        <div className="mt-4 rounded-lg border p-4">
                          <div className="space-y-2">
                            <label
                              htmlFor={`submission-${task.id}`}
                              className="text-sm font-medium"
                            >
                              {task.submission ? 'Editar entrega' : 'Nueva entrega'}
                            </label>

                            <textarea
                              id={`submission-${task.id}`}
                              className="min-h-[140px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                              placeholder="Escribe aquí tu respuesta o entrega."
                              value={submissionContent}
                              onChange={(event) => setSubmissionContent(event.target.value)}
                            />
                          </div>

                          {submissionError ? (
                            <p className="mt-3 text-sm text-red-600">{submissionError}</p>
                          ) : null}

                          {submissionSuccess ? (
                            <p className="mt-3 text-sm text-green-600">{submissionSuccess}</p>
                          ) : null}

                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
                              onClick={() => handleSubmission(task)}
                              disabled={isSubmitting}
                            >
                              {isSubmitting
                                ? 'Guardando...'
                                : task.submission
                                  ? 'Guardar cambios'
                                  : 'Enviar entrega'}
                            </button>

                            <button
                              type="button"
                              className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
                              onClick={cancelSubmission}
                              disabled={isSubmitting}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}

                      <p className="mt-3 text-xs text-muted-foreground">
                        Publicada: {formatDateTime(task.created_at)}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
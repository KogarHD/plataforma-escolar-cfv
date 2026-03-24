// C:\Users\edgar\Proyectos\plataforma-escolar-cfv\app\teacher\assignments\page.tsx
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

type AssignmentsResponse = {
  assignments: Assignment[]
}

type Task = {
  id: string
  teacher_id: string
  group_id: string
  subject_id: string
  title: string
  description: string
  due_date: string | null
  created_at: string
  group_name: string
  subject_name: string
}

type TasksResponse = {
  tasks: Task[]
}

type Submission = {
  id: string
  task_id: string
  student_id: string
  content: string
  feedback: string
  submitted_at: string
  reviewed_at: string | null
  updated_at: string
  student_username: string
}

type TaskSubmissionsResponse = {
  task: {
    id: string
    title: string
    group_id: string
    subject_id: string
  }
  totalSubmissions: number
  submissions: Submission[]
}

type FormState = {
  group_id: string
  subject_id: string
  title: string
  description: string
  due_date: string
}

type EditFormState = {
  title: string
  description: string
  due_date: string
}

const initialForm: FormState = {
  group_id: '',
  subject_id: '',
  title: '',
  description: '',
  due_date: '',
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

function toDateTimeLocalValue(value: string | null) {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60 * 1000)

  return localDate.toISOString().slice(0, 16)
}

export default function TeacherAssignmentsPage() {
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    return createClient(url, anonKey)
  }, [])

  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditFormState>({
    title: '',
    description: '',
    due_date: '',
  })
  const [editError, setEditError] = useState<string | null>(null)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)

  const [openSubmissionsTaskId, setOpenSubmissionsTaskId] = useState<string | null>(null)
  const [submissionsLoadingTaskId, setSubmissionsLoadingTaskId] = useState<string | null>(null)
  const [submissionsError, setSubmissionsError] = useState<string | null>(null)
  const [submissionsByTask, setSubmissionsByTask] = useState<
    Record<string, TaskSubmissionsResponse>
  >({})

  const [reviewingSubmissionId, setReviewingSubmissionId] = useState<string | null>(null)
  const [reviewSubmittingId, setReviewSubmittingId] = useState<string | null>(null)
  const [reviewFeedback, setReviewFeedback] = useState('')
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null)

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

        const [assignmentsResponse, tasksResponse] = await Promise.all([
          fetch('/api/teacher/assignments', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            cache: 'no-store',
          }),
          fetch('/api/teacher/tasks', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            cache: 'no-store',
          }),
        ])

        if (!assignmentsResponse.ok) {
          const body = (await assignmentsResponse.json().catch(() => null)) as
            | { error?: string }
            | null

          throw new Error(body?.error || 'No se pudieron cargar las asignaciones')
        }

        if (!tasksResponse.ok) {
          const body = (await tasksResponse.json().catch(() => null)) as
            | { error?: string }
            | null

          throw new Error(body?.error || 'No se pudieron cargar las tareas')
        }

        const assignmentsJson = (await assignmentsResponse.json()) as AssignmentsResponse
        const tasksJson = (await tasksResponse.json()) as TasksResponse

        if (cancelled) return

        setAssignments(assignmentsJson.assignments)
        setTasks(tasksJson.tasks)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Error desconocido')
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

  const groupOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>()

    for (const assignment of assignments) {
      if (!map.has(assignment.group_id)) {
        map.set(assignment.group_id, {
          id: assignment.group_id,
          name: assignment.group_name,
        })
      }
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [assignments])

  const subjectOptions = useMemo(() => {
    const filtered = assignments.filter(
      (assignment) => assignment.group_id === form.group_id
    )

    const map = new Map<string, { id: string; name: string }>()

    for (const assignment of filtered) {
      if (!map.has(assignment.subject_id)) {
        map.set(assignment.subject_id, {
          id: assignment.subject_id,
          name: assignment.subject_name,
        })
      }
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [assignments, form.group_id])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setSubmitting(true)
      setFormError(null)
      setFormSuccess(null)

      if (!form.group_id || !form.subject_id || !form.title.trim()) {
        setFormError('Grupo, materia y título son obligatorios.')
        return
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        throw new Error('No autenticado')
      }

      const response = await fetch('/api/teacher/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          group_id: form.group_id,
          subject_id: form.subject_id,
          title: form.title.trim(),
          description: form.description.trim(),
          due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
        }),
      })

      const body = (await response.json().catch(() => null)) as
        | { error?: string; task?: Task }
        | null

      if (!response.ok || !body?.task) {
        throw new Error(body?.error || 'No se pudo crear la tarea')
      }

      setTasks((prev) => [body.task as Task, ...prev])
      setForm(initialForm)
      setFormSuccess('Tarea creada correctamente.')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSubmitting(false)
    }
  }

  function startEditing(task: Task) {
    setEditingTaskId(task.id)
    setEditError(null)
    setEditForm({
      title: task.title,
      description: task.description ?? '',
      due_date: toDateTimeLocalValue(task.due_date),
    })
  }

  function cancelEditing() {
    setEditingTaskId(null)
    setEditError(null)
    setEditForm({
      title: '',
      description: '',
      due_date: '',
    })
  }

  async function handleEditSubmit(
    event: React.FormEvent<HTMLFormElement>,
    taskId: string
  ) {
    event.preventDefault()

    try {
      setEditSubmitting(true)
      setEditError(null)

      if (!editForm.title.trim()) {
        setEditError('El título es obligatorio.')
        return
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        throw new Error('No autenticado')
      }

      const response = await fetch(`/api/teacher/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: editForm.title.trim(),
          description: editForm.description.trim(),
          due_date: editForm.due_date ? new Date(editForm.due_date).toISOString() : null,
        }),
      })

      const body = (await response.json().catch(() => null)) as
        | { error?: string; task?: Task }
        | null

      if (!response.ok || !body?.task) {
        throw new Error(body?.error || 'No se pudo actualizar la tarea')
      }

      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? (body.task as Task) : task))
      )

      cancelEditing()
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setEditSubmitting(false)
    }
  }

  async function handleDelete(taskId: string) {
    const confirmed = window.confirm(
      '¿Seguro que quieres eliminar esta tarea? Esta acción no se puede deshacer.'
    )

    if (!confirmed) return

    try {
      setDeletingTaskId(taskId)

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        throw new Error('No autenticado')
      }

      const response = await fetch(`/api/teacher/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      const body = (await response.json().catch(() => null)) as
        | { error?: string; ok?: boolean }
        | null

      if (!response.ok) {
        throw new Error(body?.error || 'No se pudo eliminar la tarea')
      }

      setTasks((prev) => prev.filter((task) => task.id !== taskId))

      if (editingTaskId === taskId) {
        cancelEditing()
      }

      setSubmissionsByTask((prev) => {
        const next = { ...prev }
        delete next[taskId]
        return next
      })

      if (openSubmissionsTaskId === taskId) {
        setOpenSubmissionsTaskId(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setDeletingTaskId(null)
    }
  }

  async function toggleSubmissions(taskId: string) {
    if (openSubmissionsTaskId === taskId) {
      setOpenSubmissionsTaskId(null)
      setSubmissionsError(null)
      setReviewingSubmissionId(null)
      setReviewError(null)
      setReviewSuccess(null)
      return
    }

    setOpenSubmissionsTaskId(taskId)
    setSubmissionsError(null)
    setReviewingSubmissionId(null)
    setReviewError(null)
    setReviewSuccess(null)

    if (submissionsByTask[taskId]) {
      return
    }

    try {
      setSubmissionsLoadingTaskId(taskId)

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        throw new Error('No autenticado')
      }

      const response = await fetch(`/api/teacher/tasks/${taskId}/submissions`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: 'no-store',
      })

      const body = (await response.json().catch(() => null)) as
        | ({ error?: string } & Partial<TaskSubmissionsResponse>)
        | null

      if (!response.ok) {
        throw new Error(body?.error || 'No se pudieron cargar las entregas')
      }

      setSubmissionsByTask((prev) => ({
        ...prev,
        [taskId]: body as TaskSubmissionsResponse,
      }))
    } catch (err) {
      setSubmissionsError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSubmissionsLoadingTaskId(null)
    }
  }

  function startReview(submission: Submission) {
    setReviewingSubmissionId(submission.id)
    setReviewFeedback(submission.feedback ?? '')
    setReviewError(null)
    setReviewSuccess(null)
  }

  function cancelReview() {
    setReviewingSubmissionId(null)
    setReviewFeedback('')
    setReviewError(null)
    setReviewSuccess(null)
  }

  async function handleReviewSubmission(taskId: string, submissionId: string) {
    try {
      setReviewSubmittingId(submissionId)
      setReviewError(null)
      setReviewSuccess(null)

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        throw new Error('No autenticado')
      }

      const response = await fetch(`/api/teacher/submissions/${submissionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          feedback: reviewFeedback,
        }),
      })

      const body = (await response.json().catch(() => null)) as
        | { error?: string; submission?: Submission }
        | null

      if (!response.ok || !body?.submission) {
        throw new Error(body?.error || 'No se pudo guardar la revisión')
      }

      setSubmissionsByTask((prev) => {
        const current = prev[taskId]
        if (!current) return prev

        return {
          ...prev,
          [taskId]: {
            ...current,
            submissions: current.submissions.map((submission) =>
              submission.id === submissionId
                ? (body.submission as Submission)
                : submission
            ),
          },
        }
      })

      setReviewSuccess('Revisión guardada correctamente.')
      setReviewingSubmissionId(submissionId)
      setReviewFeedback(body.submission.feedback)
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setReviewSubmittingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tareas</h1>
        <p className="text-sm text-muted-foreground">
          Crea tareas para tus grupos, consulta las que ya registraste y revisa las entregas de tus alumnos.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">
            Cargando tareas del maestro...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-xl border p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border p-4">
            <h2 className="text-base font-semibold">Crear tarea</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Selecciona un grupo, una materia y captura la información básica.
            </p>

            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="group_id" className="text-sm font-medium">
                    Grupo
                  </label>
                  <select
                    id="group_id"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={form.group_id}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        group_id: event.target.value,
                        subject_id: '',
                      }))
                    }
                  >
                    <option value="">Selecciona un grupo</option>
                    {groupOptions.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="subject_id" className="text-sm font-medium">
                    Materia
                  </label>
                  <select
                    id="subject_id"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={form.subject_id}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        subject_id: event.target.value,
                      }))
                    }
                    disabled={!form.group_id}
                  >
                    <option value="">
                      {form.group_id
                        ? 'Selecciona una materia'
                        : 'Primero selecciona un grupo'}
                    </option>
                    {subjectOptions.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Título
                </label>
                <input
                  id="title"
                  type="text"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="Ej. Investigación sobre redes"
                  value={form.title}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Descripción
                </label>
                <textarea
                  id="description"
                  className="min-h-[120px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="Describe la actividad, instrucciones o criterios básicos."
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2 md:max-w-sm">
                <label htmlFor="due_date" className="text-sm font-medium">
                  Fecha límite
                </label>
                <input
                  id="due_date"
                  type="datetime-local"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={form.due_date}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      due_date: event.target.value,
                    }))
                  }
                />
              </div>

              {formError ? (
                <p className="text-sm text-red-600">{formError}</p>
              ) : null}

              {formSuccess ? (
                <p className="text-sm text-green-600">{formSuccess}</p>
              ) : null}

              <button
                type="submit"
                className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
                disabled={submitting}
              >
                {submitting ? 'Guardando...' : 'Crear tarea'}
              </button>
            </form>
          </div>

          <div className="rounded-xl border p-4">
            <h2 className="text-base font-semibold">Tareas registradas</h2>

            {tasks.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Todavía no has creado tareas.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {tasks.map((task) => {
                  const isEditing = editingTaskId === task.id
                  const isDeleting = deletingTaskId === task.id
                  const submissionsData = submissionsByTask[task.id]
                  const isOpen = openSubmissionsTaskId === task.id
                  const isSubmissionsLoading = submissionsLoadingTaskId === task.id

                  return (
                    <div key={task.id} className="rounded-lg border p-4">
                      {!isEditing ? (
                        <>
                          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                            <div>
                              <h3 className="text-base font-semibold">{task.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {task.group_name} · {task.subject_name}
                              </p>
                            </div>

                            <div className="text-sm text-muted-foreground">
                              {formatDateTime(task.due_date)}
                            </div>
                          </div>

                          <p className="mt-3 text-sm">
                            {task.description || 'Sin descripción.'}
                          </p>

                          <p className="mt-3 text-xs text-muted-foreground">
                            Creada: {formatDateTime(task.created_at)}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
                              onClick={() => startEditing(task)}
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
                              onClick={() => handleDelete(task.id)}
                              disabled={isDeleting}
                            >
                              {isDeleting ? 'Eliminando...' : 'Eliminar'}
                            </button>

                            <button
                              type="button"
                              className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
                              onClick={() => toggleSubmissions(task.id)}
                            >
                              {isOpen ? 'Ocultar entregas' : 'Ver entregas'}
                            </button>
                          </div>

                          {isOpen ? (
                            <div className="mt-4 rounded-lg border p-4">
                              <div className="flex items-center justify-between gap-4">
                                <h4 className="text-sm font-semibold">Entregas</h4>

                                {submissionsData ? (
                                  <span className="text-xs text-muted-foreground">
                                    {submissionsData.totalSubmissions} entrega{submissionsData.totalSubmissions === 1 ? '' : 's'}
                                  </span>
                                ) : null}
                              </div>

                              {isSubmissionsLoading ? (
                                <p className="mt-3 text-sm text-muted-foreground">
                                  Cargando entregas...
                                </p>
                              ) : submissionsError ? (
                                <p className="mt-3 text-sm text-red-600">
                                  {submissionsError}
                                </p>
                              ) : !submissionsData || submissionsData.submissions.length === 0 ? (
                                <p className="mt-3 text-sm text-muted-foreground">
                                  Todavía no hay entregas para esta tarea.
                                </p>
                              ) : (
                                <div className="mt-4 space-y-3">
                                  {submissionsData.submissions.map((submission) => {
                                    const isReviewing =
                                      reviewingSubmissionId === submission.id
                                    const isSavingReview =
                                      reviewSubmittingId === submission.id

                                    return (
                                      <div
                                        key={submission.id}
                                        className="rounded-md border p-3"
                                      >
                                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                          <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                              <p className="text-sm font-medium">
                                                @{submission.student_username}
                                              </p>

                                              <span className="rounded-full border px-2 py-0.5 text-xs">
                                                {submission.reviewed_at
                                                  ? 'Revisada'
                                                  : 'Sin revisar'}
                                              </span>
                                            </div>

                                            <p className="text-xs text-muted-foreground">
                                              Entregada: {formatDateTime(submission.submitted_at)}
                                            </p>
                                          </div>

                                          <p className="text-xs text-muted-foreground">
                                            Actualizada: {formatDateTime(submission.updated_at)}
                                          </p>
                                        </div>

                                        <p className="mt-3 text-sm">
                                          {submission.content}
                                        </p>

                                        {!isReviewing ? (
                                          <>
                                            <div className="mt-4 rounded-lg border p-3">
                                              <p className="text-sm font-medium">Feedback</p>
                                              <p className="mt-2 text-sm text-muted-foreground">
                                                {submission.feedback || 'Sin feedback todavía.'}
                                              </p>

                                              {submission.reviewed_at ? (
                                                <p className="mt-2 text-xs text-muted-foreground">
                                                  Revisada: {formatDateTime(submission.reviewed_at)}
                                                </p>
                                              ) : null}
                                            </div>

                                            <div className="mt-3">
                                              <button
                                                type="button"
                                                className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
                                                onClick={() => startReview(submission)}
                                              >
                                                {submission.reviewed_at
                                                  ? 'Editar revisión'
                                                  : 'Revisar entrega'}
                                              </button>
                                            </div>
                                          </>
                                        ) : (
                                          <div className="mt-4 rounded-lg border p-3">
                                            <div className="space-y-2">
                                              <label className="text-sm font-medium">
                                                Feedback
                                              </label>

                                              <textarea
                                                className="min-h-[120px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                                                placeholder="Escribe aquí observaciones o retroalimentación para el alumno."
                                                value={reviewFeedback}
                                                onChange={(event) =>
                                                  setReviewFeedback(event.target.value)
                                                }
                                              />
                                            </div>

                                            {reviewError ? (
                                              <p className="mt-3 text-sm text-red-600">
                                                {reviewError}
                                              </p>
                                            ) : null}

                                            {reviewSuccess ? (
                                              <p className="mt-3 text-sm text-green-600">
                                                {reviewSuccess}
                                              </p>
                                            ) : null}

                                            <div className="mt-4 flex flex-wrap gap-2">
                                              <button
                                                type="button"
                                                className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
                                                onClick={() =>
                                                  handleReviewSubmission(
                                                    task.id,
                                                    submission.id
                                                  )
                                                }
                                                disabled={isSavingReview}
                                              >
                                                {isSavingReview
                                                  ? 'Guardando...'
                                                  : 'Guardar revisión'}
                                              </button>

                                              <button
                                                type="button"
                                                className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
                                                onClick={cancelReview}
                                                disabled={isSavingReview}
                                              >
                                                Cancelar
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <form
                          className="space-y-4"
                          onSubmit={(event) => handleEditSubmit(event, task.id)}
                        >
                          <div>
                            <p className="text-sm text-muted-foreground">
                              {task.group_name} · {task.subject_name}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Título</label>
                            <input
                              type="text"
                              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                              value={editForm.title}
                              onChange={(event) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  title: event.target.value,
                                }))
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Descripción</label>
                            <textarea
                              className="min-h-[120px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                              value={editForm.description}
                              onChange={(event) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  description: event.target.value,
                                }))
                              }
                            />
                          </div>

                          <div className="space-y-2 md:max-w-sm">
                            <label className="text-sm font-medium">Fecha límite</label>
                            <input
                              type="datetime-local"
                              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                              value={editForm.due_date}
                              onChange={(event) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  due_date: event.target.value,
                                }))
                              }
                            />
                          </div>

                          {editError ? (
                            <p className="text-sm text-red-600">{editError}</p>
                          ) : null}

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="submit"
                              className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
                              disabled={editSubmitting}
                            >
                              {editSubmitting ? 'Guardando...' : 'Guardar cambios'}
                            </button>

                            <button
                              type="button"
                              className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
                              onClick={cancelEditing}
                              disabled={editSubmitting}
                            >
                              Cancelar
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
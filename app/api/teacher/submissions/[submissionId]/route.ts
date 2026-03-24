import { NextResponse } from 'next/server'
import { requireTeacher, supabaseUser } from '@/app/api/teacher/_lib/auth'
import { reviewTeacherSubmission } from '@/app/api/teacher/_lib/tasks'

type Context = {
  params: Promise<{
    submissionId: string
  }>
}

type ReviewBody = {
  feedback?: string
  grade?: number | null
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message
  }

  return 'Internal Server Error'
}

export async function PATCH(req: Request, context: Context) {
  const gate = await requireTeacher(req)

  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.error },
      { status: gate.status }
    )
  }

  const { submissionId } = await context.params

  if (!submissionId) {
    return NextResponse.json(
      { error: 'submissionId inválido' },
      { status: 400 }
    )
  }

  const body = (await req.json()) as ReviewBody
  const feedback = body.feedback ?? ''
const grade =
  body.grade === null || body.grade === undefined
    ? null
    : Number(body.grade)

  if (grade !== null && (Number.isNaN(grade) || grade < 0 || grade > 100)) {
    return NextResponse.json(
      { error: 'La calificación debe estar entre 0 y 100' },
      { status: 400 }
    )
  }

  const supabase = supabaseUser(gate.token)

  try {
    const submission = await reviewTeacherSubmission(
      supabase,
      gate.teacher.id,
      submissionId,
      { feedback, grade }
    )

    return NextResponse.json({ submission })
  } catch (error) {
    const message = getErrorMessage(error)

    if (message === 'NOT_FOUND') {
      return NextResponse.json(
        { error: 'Entrega no encontrada o no pertenece al maestro' },
        { status: 404 }
      )
    }

    console.error('PATCH /api/teacher/submissions/[submissionId]', error)

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
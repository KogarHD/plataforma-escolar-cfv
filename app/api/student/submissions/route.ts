// C:\Users\edgar\Proyectos\plataforma-escolar-cfv\app\api\student\submissions\route.ts
import { NextResponse } from 'next/server'
import { requireStudent, supabaseUser } from '@/app/api/student/_lib/auth'
import { createStudentSubmission } from '@/app/api/student/_lib/submissions'

type CreateSubmissionBody = {
  task_id?: string
  content?: string
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

function getErrorCode(error: unknown) {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    return error.code
  }

  return null
}

export async function POST(req: Request) {
  const gate = await requireStudent(req)

  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.error },
      { status: gate.status }
    )
  }

  const body = (await req.json()) as CreateSubmissionBody

  const task_id = (body.task_id ?? '').trim()
  const content = (body.content ?? '').trim()

  if (!task_id || !content) {
    return NextResponse.json(
      { error: 'task_id y content son obligatorios' },
      { status: 400 }
    )
  }

  const supabase = supabaseUser(gate.token)

  try {
    const submission = await createStudentSubmission(supabase, gate.student.id, {
      task_id,
      content,
    })

    return NextResponse.json({ submission }, { status: 201 })
  } catch (error) {
    const code = getErrorCode(error)
    const message = getErrorMessage(error)

    console.error('POST /api/student/submissions', error)

    if (code === '23505') {
      return NextResponse.json(
        { error: 'Ya existe una entrega para esta tarea' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
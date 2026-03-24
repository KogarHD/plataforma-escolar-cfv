// C:\Users\edgar\Proyectos\plataforma-escolar-cfv\app\api\student\submissions\[submissionId]\route.ts
import { NextResponse } from 'next/server'
import { requireStudent, supabaseUser } from '@/app/api/student/_lib/auth'
import { updateStudentSubmission } from '@/app/api/student/_lib/submissions'

type Context = {
  params: Promise<{
    submissionId: string
  }>
}

type UpdateSubmissionBody = {
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

export async function PATCH(req: Request, context: Context) {
  const gate = await requireStudent(req)

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

  const body = (await req.json()) as UpdateSubmissionBody
  const content = (body.content ?? '').trim()

  if (!content) {
    return NextResponse.json(
      { error: 'content es obligatorio' },
      { status: 400 }
    )
  }

  const supabase = supabaseUser(gate.token)

  try {
    const submission = await updateStudentSubmission(
      supabase,
      gate.student.id,
      submissionId,
      { content }
    )

    return NextResponse.json({ submission })
  } catch (error) {
    const message = getErrorMessage(error)

    console.error('PATCH /api/student/submissions/[submissionId]', error)

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
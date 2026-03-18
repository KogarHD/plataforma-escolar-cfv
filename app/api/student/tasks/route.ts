import { NextResponse } from 'next/server'
import { requireStudent, supabaseUser } from '@/app/api/student/_lib/auth'
import { getStudentTasks } from '@/app/api/student/_lib/queries'

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

export async function GET(req: Request) {
  const gate = await requireStudent(req)

  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.error },
      { status: gate.status }
    )
  }

  const supabase = supabaseUser(gate.token)

  try {
    const tasks = await getStudentTasks(supabase, gate.student.id)

    return NextResponse.json({
      student: gate.student,
      ...tasks,
    })
  } catch (error) {
    const message = getErrorMessage(error)

    console.error('GET /api/student/tasks', error)

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
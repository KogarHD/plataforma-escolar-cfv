// C:\Users\edgar\Proyectos\plataforma-escolar-cfv\app\api\teacher\tasks\[taskId]\submissions\route.ts
import { NextResponse } from 'next/server'
import { requireTeacher, supabaseUser } from '@/app/api/teacher/_lib/auth'
import { listTeacherTaskSubmissions } from '@/app/api/teacher/_lib/tasks'

type Context = {
  params: Promise<{
    taskId: string
  }>
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

export async function GET(req: Request, context: Context) {
  const gate = await requireTeacher(req)

  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.error },
      { status: gate.status }
    )
  }

  const { taskId } = await context.params

  if (!taskId) {
    return NextResponse.json(
      { error: 'taskId inválido' },
      { status: 400 }
    )
  }

  const supabase = supabaseUser(gate.token)

  try {
    const result = await listTeacherTaskSubmissions(
      supabase,
      gate.teacher.id,
      taskId
    )

    return NextResponse.json(result)
  } catch (error) {
    const message = getErrorMessage(error)

    if (message === 'NOT_FOUND') {
      return NextResponse.json(
        { error: 'Tarea no encontrada o no pertenece al maestro' },
        { status: 404 }
      )
    }

    console.error('GET /api/teacher/tasks/[taskId]/submissions', error)

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
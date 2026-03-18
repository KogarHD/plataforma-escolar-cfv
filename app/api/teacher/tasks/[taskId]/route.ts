// C:\Users\KOGARPC\Proyectos\plataforma-escolar-cfv\app\api\teacher\tasks\[taskId]\route.ts
import { NextResponse } from 'next/server'
import { requireTeacher, supabaseUser } from '@/app/api/teacher/_lib/auth'
import { deleteTeacherTask, updateTeacherTask } from '@/app/api/teacher/_lib/tasks'

type Context = {
  params: Promise<{
    taskId: string
  }>
}

type UpdateTaskBody = {
  title?: string
  description?: string
  due_date?: string | null
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

  const { taskId } = await context.params

  if (!taskId) {
    return NextResponse.json(
      { error: 'taskId inválido' },
      { status: 400 }
    )
  }

  const body = (await req.json()) as UpdateTaskBody

  const title = (body.title ?? '').trim()
  const description = body.description ?? ''
  const due_date = body.due_date ?? null

  if (!title) {
    return NextResponse.json(
      { error: 'title es obligatorio' },
      { status: 400 }
    )
  }

  const supabase = supabaseUser(gate.token)

  try {
    const task = await updateTeacherTask(supabase, gate.teacher.id, taskId, {
      title,
      description,
      due_date,
    })

    return NextResponse.json({ task })
  } catch (error) {
    const message = getErrorMessage(error)

    console.error('PATCH /api/teacher/tasks/[taskId]', error)

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request, context: Context) {
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
    await deleteTeacherTask(supabase, gate.teacher.id, taskId)

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = getErrorMessage(error)

    console.error('DELETE /api/teacher/tasks/[taskId]', error)

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
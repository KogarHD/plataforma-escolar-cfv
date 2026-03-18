// C:\Users\KOGARPC\Proyectos\plataforma-escolar-cfv\app\api\teacher\tasks\route.ts
import { NextResponse } from 'next/server'
import { requireTeacher, supabaseUser } from '@/app/api/teacher/_lib/auth'
import { createTeacherTask, listTeacherTasks } from '@/app/api/teacher/_lib/tasks'

type CreateTaskBody = {
  group_id?: string
  subject_id?: string
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

export async function GET(req: Request) {
  const gate = await requireTeacher(req)

  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.error },
      { status: gate.status }
    )
  }

  const supabase = supabaseUser(gate.token)

  try {
    const tasks = await listTeacherTasks(supabase, gate.teacher.id)

    return NextResponse.json({ tasks })
  } catch (error) {
    const message = getErrorMessage(error)

    console.error('GET /api/teacher/tasks', error)

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  const gate = await requireTeacher(req)

  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.error },
      { status: gate.status }
    )
  }

  const body = (await req.json()) as CreateTaskBody

  const group_id = (body.group_id ?? '').trim()
  const subject_id = (body.subject_id ?? '').trim()
  const title = (body.title ?? '').trim()
  const description = body.description ?? ''
  const due_date = body.due_date ?? null

  if (!group_id || !subject_id || !title) {
    return NextResponse.json(
      { error: 'group_id, subject_id y title son obligatorios' },
      { status: 400 }
    )
  }

  const supabase = supabaseUser(gate.token)

  try {
    const task = await createTeacherTask(supabase, gate.teacher.id, {
      group_id,
      subject_id,
      title,
      description,
      due_date,
    })

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    const message = getErrorMessage(error)

    console.error('POST /api/teacher/tasks', error)

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
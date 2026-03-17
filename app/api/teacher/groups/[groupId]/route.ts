// C:\Users\KOGARPC\Proyectos\plataforma-escolar-cfv\app\api\teacher\groups\[groupId]\route.ts
import { NextResponse } from 'next/server'
import { requireTeacher, supabaseUser } from '@/app/api/teacher/_lib/auth'
import { getTeacherGroupDetail } from '@/app/api/teacher/_lib/queries'

type Context = {
  params: Promise<{
    groupId: string
  }>
}

export async function GET(req: Request, context: Context) {
  const gate = await requireTeacher(req)

  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.error },
      { status: gate.status }
    )
  }

  const { groupId } = await context.params

  if (!groupId) {
    return NextResponse.json(
      { error: 'groupId inválido' },
      { status: 400 }
    )
  }

  const supabase = supabaseUser(gate.token)

  try {
    const detail = await getTeacherGroupDetail(
      supabase,
      gate.teacher.id,
      groupId
    )

    return NextResponse.json(detail)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Internal Server Error'

    if (message === 'NOT_FOUND') {
      return NextResponse.json(
        { error: 'Grupo no encontrado o no asignado al maestro' },
        { status: 404 }
      )
    }

    console.error('GET /api/teacher/groups/[groupId]', error)

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
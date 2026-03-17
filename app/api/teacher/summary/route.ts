// C:\Users\KOGARPC\Proyectos\plataforma-escolar-cfv\app\api\teacher\summary\route.ts
import { NextResponse } from 'next/server'
import { requireTeacher, supabaseUser } from '@/app/api/teacher/_lib/auth'
import { getTeacherSummary } from '@/app/api/teacher/_lib/queries'

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
    const summary = await getTeacherSummary(supabase, gate.teacher.id)

    return NextResponse.json({
      teacher: gate.teacher,
      ...summary,
    })
  } catch (error) {
    console.error('GET /api/teacher/summary', error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
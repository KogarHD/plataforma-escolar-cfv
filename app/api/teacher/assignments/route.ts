// C:\Users\KOGARPC\Proyectos\plataforma-escolar-cfv\app\api\teacher\assignments\route.ts
import { NextResponse } from 'next/server'
import { requireTeacher, supabaseUser } from '@/app/api/teacher/_lib/auth'
import { getTeacherAssignments } from '@/app/api/teacher/_lib/queries'

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
    const assignments = await getTeacherAssignments(supabase, gate.teacher.id)

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error('GET /api/teacher/assignments', error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
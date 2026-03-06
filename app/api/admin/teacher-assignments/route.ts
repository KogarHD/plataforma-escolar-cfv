// C:\Users\KOGARPC\Proyectos\plataforma-escolar-cfv\app\api\admin\teacher-assignments\route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type Role = 'admin' | 'teacher' | 'student'

function supabaseAnon() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, anonKey, { auth: { persistSession: false } })
}

function supabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, serviceKey, { auth: { persistSession: false } })
}

function getBearerToken(req: Request) {
  const header = req.headers.get('authorization') || ''
  const match = header.match(/^Bearer (.+)$/i)
  return match?.[1] ?? null
}

async function requireAdmin(req: Request) {
  const token = getBearerToken(req)
  if (!token) return { ok: false as const, error: 'No autenticado' }

  const anon = supabaseAnon()
  const { data, error } = await anon.auth.getUser(token)
  if (error || !data.user) return { ok: false as const, error: 'No autenticado' }

  const svc = supabaseService()
  const { data: profile, error: pErr } = await svc
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle()

  if (pErr) return { ok: false as const, error: pErr.message }
  if (!profile || (profile.role as Role) !== 'admin') return { ok: false as const, error: 'No autorizado' }

  return { ok: true as const }
}

type TeacherRow = {
  id: string
  username: string | null
  email: string | null
}

type AssignmentRow = {
  group_id: string
  subject_id: string
  teacher_id: string
}

export async function GET(req: Request) {
  const gate = await requireAdmin(req)
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: 403 })

  const url = new URL(req.url)
  const groupId = url.searchParams.get('groupId')?.trim()

  if (!groupId) {
    return NextResponse.json({ error: 'Falta groupId' }, { status: 400 })
  }

  const svc = supabaseService()

  try {
    const { data: teachersRaw, error: teachersErr } = await svc.auth.admin.listUsers()
    if (teachersErr) throw new Error(teachersErr.message)

    const teacherAuthUsers = (teachersRaw?.users ?? []).map((u) => ({
      id: u.id,
      email: u.email ?? null,
      username: typeof u.user_metadata?.username === 'string' ? u.user_metadata.username : null,
    }))

    const teacherIds = teacherAuthUsers.map((u) => u.id)

    let teacherProfiles: Array<{ id: string; username: string | null; role: string }> = []
    if (teacherIds.length > 0) {
      const { data: profData, error: profErr } = await svc
        .from('profiles')
        .select('id, username, role')
        .in('id', teacherIds)
        .eq('role', 'teacher')

      if (profErr) throw new Error(profErr.message)
      teacherProfiles = profData ?? []
    }

    const profileById = new Map(teacherProfiles.map((p) => [p.id, p]))

    const teachers: TeacherRow[] = teacherAuthUsers
      .filter((u) => profileById.has(u.id))
      .map((u) => {
        const p = profileById.get(u.id)
        return {
          id: u.id,
          username: p?.username ?? u.username ?? null,
          email: u.email,
        }
      })
      .sort((a, b) => (a.username ?? a.email ?? '').localeCompare(b.username ?? b.email ?? ''))

    const { data: assignments, error: aErr } = await svc
      .from('teacher_assignments')
      .select('group_id, subject_id, teacher_id')
      .eq('group_id', groupId)

    if (aErr) throw new Error(aErr.message)

    return NextResponse.json({
      teachers,
      assignments: (assignments ?? []) as AssignmentRow[],
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const gate = await requireAdmin(req)
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: 403 })

  const body = (await req.json()) as {
    groupId?: string
    subjectId?: string
    teacherId?: string
  }

  const groupId = body.groupId?.trim()
  const subjectId = body.subjectId?.trim()
  const teacherId = body.teacherId?.trim()

  if (!groupId || !subjectId || !teacherId) {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
  }

  const svc = supabaseService()

  try {
    const { error } = await svc.from('teacher_assignments').upsert(
      {
        group_id: groupId,
        subject_id: subjectId,
        teacher_id: teacherId,
      },
      {
        onConflict: 'group_id,subject_id',
      }
    )

    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const gate = await requireAdmin(req)
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: 403 })

  const url = new URL(req.url)
  const groupId = url.searchParams.get('groupId')?.trim()
  const subjectId = url.searchParams.get('subjectId')?.trim()

  if (!groupId || !subjectId) {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
  }

  const svc = supabaseService()

  try {
    const { error } = await svc
      .from('teacher_assignments')
      .delete()
      .eq('group_id', groupId)
      .eq('subject_id', subjectId)

    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
// C:\Users\KOGARPC\Proyectos\plataforma-escolar-cfv\app\api\admin\enrollments\route.ts
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

type StudentRow = {
  id: string
  username: string | null
  email: string | null
}

type EnrollmentRow = {
  group_id: string
  student_id: string
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
    const { data: usersData, error: usersErr } = await svc.auth.admin.listUsers()
    if (usersErr) throw new Error(usersErr.message)

    const authUsers = (usersData?.users ?? []).map((u) => ({
      id: u.id,
      email: u.email ?? null,
      username:
        typeof u.user_metadata?.username === 'string'
          ? u.user_metadata.username
          : null,
    }))

    const userIds = authUsers.map((u) => u.id)

    let studentProfiles: Array<{ id: string; username: string | null; role: string }> = []
    if (userIds.length > 0) {
      const { data: profData, error: profErr } = await svc
        .from('profiles')
        .select('id, username, role')
        .in('id', userIds)
        .eq('role', 'student')

      if (profErr) throw new Error(profErr.message)
      studentProfiles = profData ?? []
    }

    const profileById = new Map(studentProfiles.map((p) => [p.id, p]))

    const students: StudentRow[] = authUsers
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

    const { data: enrollments, error: eErr } = await svc
      .from('enrollments')
      .select('group_id, student_id')
      .eq('group_id', groupId)

    if (eErr) throw new Error(eErr.message)

    return NextResponse.json({
      students,
      enrollments: (enrollments ?? []) as EnrollmentRow[],
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
    studentId?: string
  }

  const groupId = body.groupId?.trim()
  const studentId = body.studentId?.trim()

  if (!groupId || !studentId) {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
  }

  const svc = supabaseService()

  try {
    const { error } = await svc.from('enrollments').insert({
      group_id: groupId,
      student_id: studentId,
    })

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
  const studentId = url.searchParams.get('studentId')?.trim()

  if (!groupId || !studentId) {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
  }

  const svc = supabaseService()

  try {
    const { error } = await svc
      .from('enrollments')
      .delete()
      .eq('group_id', groupId)
      .eq('student_id', studentId)

    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
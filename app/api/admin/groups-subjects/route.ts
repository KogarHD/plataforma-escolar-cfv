// C:\Users\edgar\Proyectos\plataforma-escolar-cfv\app\api\admin\group-subjects\route.ts
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

type GroupRow = {
  id: string
  code: string | null
  modality: string | null
  program_name: string | null
  term_name: string | null
}

type SubjectRow = {
  id: string
  name: string
  program_id: string
  term_id: string | null
}

export async function GET(req: Request) {
  const gate = await requireAdmin(req)
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: 403 })

  const url = new URL(req.url)
  const groupId = url.searchParams.get('groupId')

  const svc = supabaseService()

  try {
    const { data: groupsRaw, error: gErr } = await svc
      .from('groups')
      .select('id, code, modality, programs(name), terms(name)')
      .order('created_at', { ascending: false })

    if (gErr) throw new Error(gErr.message)

    type GroupJoinRow = {
  id: string
  code?: string | null
  modality?: string | null
  programs?: { name?: string | null } | null
  terms?: { name?: string | null } | null
}

const groups: GroupRow[] = (groupsRaw ?? []).map((g) => {
  const row = g as GroupJoinRow
  return {
    id: row.id,
    code: row.code ?? null,
    modality: row.modality ?? null,
    program_name: row.programs?.name ?? null,
    term_name: row.terms?.name ?? null,
  }
})

    // Subjects: por ahora listamos todas (en UI filtraremos según group seleccionado)
    const { data: subjects, error: sErr } = await svc
      .from('subjects')
      .select('id, name, program_id, term_id')
      .order('name', { ascending: true })

    if (sErr) throw new Error(sErr.message)

    let assignedSubjectIds: string[] = []

    if (groupId) {
      const { data: assigned, error: aErr } = await svc
        .from('group_subjects')
        .select('subject_id')
        .eq('group_id', groupId)

      if (aErr) throw new Error(aErr.message)
      assignedSubjectIds = (assigned ?? []).map((r) => (r as { subject_id: string }).subject_id)
    }

    return NextResponse.json({ groups, subjects: (subjects ?? []) as SubjectRow[], assignedSubjectIds })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const gate = await requireAdmin(req)
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: 403 })

  const body = (await req.json()) as { groupId?: string; subjectId?: string }
  const groupId = body.groupId?.trim()
  const subjectId = body.subjectId?.trim()

  if (!groupId || !subjectId) return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })

  const svc = supabaseService()
  try {
    const { error } = await svc.from('group_subjects').insert({ group_id: groupId, subject_id: subjectId })
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const gate = await requireAdmin(req)
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: 403 })

  const url = new URL(req.url)
  const groupId = url.searchParams.get('groupId')?.trim()
  const subjectId = url.searchParams.get('subjectId')?.trim()

  if (!groupId || !subjectId) return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })

  const svc = supabaseService()
  try {
    const { error } = await svc
      .from('group_subjects')
      .delete()
      .eq('group_id', groupId)
      .eq('subject_id', subjectId)

    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
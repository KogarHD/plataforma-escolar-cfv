// C:\Users\KOGARPC\Proyectos\plataforma-escolar-cfv\app\api\admin\users\route.ts
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
  if (!profile || profile.role !== 'admin') return { ok: false as const, error: 'No autorizado' }

  return { ok: true as const }
}

export async function GET(req: Request) {
  const gate = await requireAdmin(req)
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: 403 })

  const svc = supabaseService()
  try {
    const { data, error } = await svc
      .from('profiles')
      .select('id,role,username,email,created_at')
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return NextResponse.json({ users: data ?? [] })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const gate = await requireAdmin(req)
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: 403 })

  const body = (await req.json()) as { userId?: string; role?: Role }
  if (!body.userId || !body.role) return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })

  if (!['admin', 'teacher', 'student'].includes(body.role)) {
    return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
  }

  const svc = supabaseService()
  try {
    const { error } = await svc.from('profiles').update({ role: body.role }).eq('id', body.userId)
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
// C:\Users\KOGARPC\Proyectos\plataforma-escolar-cfv\app\api\student\_lib\auth.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type AppSupabase = SupabaseClient

function supabaseAnon(): AppSupabase {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createClient(url, anonKey, {
    auth: { persistSession: false },
  })
}

export function supabaseUser(token: string): AppSupabase {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createClient(url, anonKey, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  })
}

function getBearerToken(req: Request) {
  const header = req.headers.get('authorization') || ''
  const match = header.match(/^Bearer (.+)$/i)
  return match?.[1] ?? null
}

export async function requireStudent(req: Request) {
  const token = getBearerToken(req)

  if (!token) {
    return { ok: false as const, error: 'No autenticado', status: 401 }
  }

  const anon = supabaseAnon()
  const { data, error } = await anon.auth.getUser(token)

  if (error || !data.user) {
    return { ok: false as const, error: 'No autenticado', status: 401 }
  }

  const userClient = supabaseUser(token)

  const { data: profile, error: profileError } = await userClient
    .from('profiles')
    .select('id, role, username')
    .eq('id', data.user.id)
    .maybeSingle()

  if (profileError) {
    return { ok: false as const, error: profileError.message, status: 500 }
  }

  if (!profile || profile.role !== 'student') {
    return { ok: false as const, error: 'No autorizado', status: 403 }
  }

  return {
    ok: true as const,
    token,
    student: {
      id: profile.id,
      username: profile.username,
    },
  }
}
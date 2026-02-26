export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import GroupsClient from './ui'

type Program = { id: string; name: string }
type Term = { id: string; program_id: string; number: number; name: string }
type Group = {
  id: string
  program_id: string
  term_id: string
  code: string
  shift: 'matutino' | 'vespertino' | 'nocturno'
  created_at: string
}

async function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const cookieStore = await cookies()

  const setCookie = (name: string, value: string, options?: CookieOptions) => {
    ;(
      cookieStore as unknown as {
        set: (name: string, value: string, options?: CookieOptions) => void
      }
    ).set(name, value, options)
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          setCookie(name, value, options)
        }
      },
    },
  })
}

export default async function Page() {
  const supabase = await supabaseServer()

  const [
    { data: programs, error: programsError },
    { data: terms, error: termsError },
    { data: groups, error: groupsError },
  ] = await Promise.all([
    supabase.from('programs').select('id,name').order('name', { ascending: true }),
    supabase.from('terms').select('id,program_id,number,name').order('number', { ascending: true }),
    supabase
      .from('groups')
      .select('id,program_id,term_id,code,shift,created_at')
      .order('created_at', { ascending: false }),
  ])

  if (programsError) throw new Error(programsError.message)
  if (termsError) throw new Error(termsError.message)
  if (groupsError) throw new Error(groupsError.message)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Grupos</h1>
        <p className="text-sm text-muted-foreground">Grupos por carrera + cuatrimestre (con turno).</p>
      </div>

      <GroupsClient
        programs={(programs ?? []) as Program[]}
        terms={(terms ?? []) as Term[]}
        groups={(groups ?? []) as Group[]}
      />
    </div>
  )
}
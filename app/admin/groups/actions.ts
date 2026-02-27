'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

type GroupInsert = {
  program_id: string
  term_id: string
  code: string
  shift: 'matutino' | 'vespertino' | 'nocturno'
}

type GroupUpdate = Partial<GroupInsert>

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

export async function createGroup(input: GroupInsert) {
  if (!input.program_id || !input.term_id || !input.code || !input.shift) {
    throw new Error('Faltan campos requeridos.')
  }

  const supabase = await supabaseServer()
  const { error } = await supabase.from('groups').insert({
    program_id: input.program_id,
    term_id: input.term_id,
    code: input.code.trim(),
    shift: input.shift,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/admin/groups')
}

export async function updateGroup(id: string, patch: GroupUpdate) {
  if (!id) throw new Error('ID inválido.')

  const supabase = await supabaseServer()
  const { error } = await supabase
    .from('groups')
    .update({
      ...(patch.program_id ? { program_id: patch.program_id } : {}),
      ...(patch.term_id ? { term_id: patch.term_id } : {}),
      ...(patch.code ? { code: patch.code.trim() } : {}),
      ...(patch.shift ? { shift: patch.shift } : {}),
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/groups')
}

export async function deleteGroup(id: string) {
  if (!id) throw new Error('ID inválido.')

  const supabase = await supabaseServer()
  const { error } = await supabase.from('groups').delete().eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/groups')
}
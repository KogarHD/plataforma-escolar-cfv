'use client'

import * as React from 'react'
import { createClient } from '@supabase/supabase-js'

type Stats = {
  programs: number
  terms: number
  groups: number
  subjects: number
  users_total: number
  users_admin: number
  users_teacher: number
  users_student: number
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw new Error(error.message)
  const token = data.session?.access_token
  if (!token) throw new Error('No autenticado')
  return token
}

export default function AdminDashboardClient() {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [stats, setStats] = React.useState<Stats | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const token = await getAccessToken()
      const res = await fetch('/api/admin/stats', {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = (await res.json()) as { stats?: Stats; error?: string }
      if (!res.ok) throw new Error(data.error || 'Error cargando stats')
      setStats(data.stats ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando stats')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  if (loading) return <div className="rounded-md border p-4 text-sm text-muted-foreground">Cargando…</div>

  if (error) {
    return (
      <div className="rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm">
        <div className="font-medium">Error</div>
        <div className="text-muted-foreground">{error}</div>
      </div>
    )
  }

  if (!stats) return null

  const Card = (props: { title: string; value: number }) => (
    <div className="rounded-lg border p-4">
      <div className="text-sm text-muted-foreground">{props.title}</div>
      <div className="mt-1 text-3xl font-semibold">{props.value}</div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Carreras" value={stats.programs} />
        <Card title="Cuatrimestres" value={stats.terms} />
        <Card title="Grupos" value={stats.groups} />
        <Card title="Materias" value={stats.subjects} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Usuarios (total)" value={stats.users_total} />
        <Card title="Admins" value={stats.users_admin} />
        <Card title="Profesores" value={stats.users_teacher} />
        <Card title="Alumnos" value={stats.users_student} />
      </div>

      <div className="flex justify-end">
        <button className="rounded-md border px-4 py-2 text-sm font-medium" onClick={() => void load()}>
          Refrescar
        </button>
      </div>
    </div>
  )
}
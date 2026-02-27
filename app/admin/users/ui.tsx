'use client'

import * as React from 'react'
import { createClient } from '@supabase/supabase-js'

type Role = 'admin' | 'teacher' | 'student'

type ProfileRow = {
  id: string
  role: Role
  username?: string | null
  email?: string | null
  created_at?: string | null
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

export default function UsersClient() {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [users, setUsers] = React.useState<ProfileRow[]>([])

  const [createOpen, setCreateOpen] = React.useState(false)
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [role, setRole] = React.useState<Role>('student')

  const load = React.useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const token = await getAccessToken()
      const res = await fetch('/api/admin/users', {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = (await res.json()) as { users?: ProfileRow[]; error?: string }
      if (!res.ok) throw new Error(data.error || 'Error cargando usuarios')
      setUsers(data.users ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando usuarios')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  async function onChangeRole(userId: string, newRole: Role) {
    try {
      const token = await getAccessToken()
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, role: newRole }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error || 'Error actualizando rol')
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error actualizando rol')
    }
  }

  async function onCreate() {
    if (!username.trim() || !password.trim()) {
      alert('Completa username y password.')
      return
    }

    try {
      const token = await getAccessToken()
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username: username.trim(), password: password.trim(), role }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error || 'Error creando usuario')

      setCreateOpen(false)
      setUsername('')
      setPassword('')
      setRole('student')
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error creando usuario')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <button className="rounded-md border px-4 py-2 text-sm font-medium" onClick={() => void load()} disabled={loading}>
          Refrescar
        </button>
        <button
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          onClick={() => setCreateOpen(true)}
          disabled={loading}
        >
          Nuevo usuario
        </button>
      </div>

      {error ? (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm">
          <div className="font-medium">Error</div>
          <div className="text-muted-foreground">{error}</div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr className="text-left">
              <th className="p-3">Username</th>
              <th className="p-3">Email</th>
              <th className="p-3">Rol</th>
              <th className="p-3">Creado</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={5}>
                  Cargando…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={5}>
                  No hay usuarios todavía.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b last:border-b-0">
                  <td className="p-3">{u.username ?? '—'}</td>
                  <td className="p-3">{u.email ?? '—'}</td>
                  <td className="p-3">
                    <select
                      className="h-9 rounded-md border bg-background px-2 text-sm"
                      value={u.role}
                      onChange={(e) => void onChangeRole(u.id, e.target.value as Role)}
                    >
                      <option value="admin">admin</option>
                      <option value="teacher">teacher</option>
                      <option value="student">student</option>
                    </select>
                  </td>
                  <td className="p-3">{u.created_at ? new Date(u.created_at).toLocaleString() : '—'}</td>
                  <td className="p-3 text-right text-xs text-muted-foreground">—</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-background p-4 shadow-lg">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Nuevo usuario</h2>
              <p className="text-sm text-muted-foreground">Crea usuario en Supabase Auth + profile con rol.</p>
            </div>

            <div className="grid gap-3">
              <div className="grid gap-1">
                <label className="text-sm font-medium">Username</label>
                <input
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ej: alumno2"
                />
              </div>

              <div className="grid gap-1">
                <label className="text-sm font-medium">Password</label>
                <input
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ej: 12345678"
                  type="password"
                />
              </div>

              <div className="grid gap-1">
                <label className="text-sm font-medium">Rol</label>
                <select
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                >
                  <option value="student">student</option>
                  <option value="teacher">teacher</option>
                  <option value="admin">admin</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button className="rounded-md border px-4 py-2 text-sm font-medium" onClick={() => setCreateOpen(false)}>
                Cancelar
              </button>
              <button
                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                onClick={() => void onCreate()}
                disabled={!username.trim() || !password.trim()}
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
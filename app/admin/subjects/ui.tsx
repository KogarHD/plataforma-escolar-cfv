'use client'

import * as React from 'react'
import { createClient } from '@supabase/supabase-js'

type Program = { id: string; name: string }
type Term = { id: string; program_id: string; number: number; name: string }
type Subject = {
  id: string
  program_id: string
  term_id: string | null
  name: string
  code: string | null
  is_active: boolean
  created_at: string
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function termLabel(t: Term) {
  return `C${t.number} — ${t.name}`
}

export default function SubjectsClient() {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')

  const [programs, setPrograms] = React.useState<Program[]>([])
  const [terms, setTerms] = React.useState<Term[]>([])
  const [subjects, setSubjects] = React.useState<Subject[]>([])

  const programsById = React.useMemo(() => new Map(programs.map((p) => [p.id, p])), [programs])
  const termsById = React.useMemo(() => new Map(terms.map((t) => [t.id, t])), [terms])

  const [mode, setMode] = React.useState<'create' | 'edit' | null>(null)
  const [editingId, setEditingId] = React.useState('')

  const [programId, setProgramId] = React.useState('')
  const [termId, setTermId] = React.useState<string>('') // '' => null
  const [name, setName] = React.useState('')
  const [code, setCode] = React.useState('')
  const [isActive, setIsActive] = React.useState(true)

  const termsForProgram = React.useMemo(() => {
    if (!programId) return []
    return terms.filter((t) => t.program_id === programId)
  }, [terms, programId])

  const loadAll = React.useCallback(async () => {
    setLoading(true)
    setError('')

    const sessionRes = await supabase.auth.getSession()
    if (!sessionRes.data.session) {
      setLoading(false)
      setError('No se detectó sesión. Vuelve a iniciar sesión.')
      return
    }

    const [pRes, tRes, sRes] = await Promise.all([
      supabase.from('programs').select('id,name').order('name', { ascending: true }),
      supabase.from('terms').select('id,program_id,number,name').order('number', { ascending: true }),
      supabase
        .from('subjects')
        .select('id,program_id,term_id,name,code,is_active,created_at')
        .order('created_at', { ascending: false }),
    ])

    const firstErr = pRes.error ?? tRes.error ?? sRes.error
    if (firstErr) setError(firstErr.message)

    setPrograms((pRes.data ?? []) as Program[])
    setTerms((tRes.data ?? []) as Term[])
    setSubjects((sRes.data ?? []) as Subject[])

    setLoading(false)
  }, [])

  React.useEffect(() => {
    void loadAll()
  }, [loadAll])

  function resetForm() {
    setProgramId('')
    setTermId('')
    setName('')
    setCode('')
    setIsActive(true)
    setEditingId('')
  }

  function openCreate() {
    resetForm()
    setMode('create')
  }

  function openEdit(s: Subject) {
    setEditingId(s.id)
    setProgramId(s.program_id)
    setTermId(s.term_id ?? '')
    setName(s.name)
    setCode(s.code ?? '')
    setIsActive(!!s.is_active)
    setMode('edit')
  }

  function closeModal() {
    setMode(null)
    resetForm()
  }

  async function onSubmit() {
    if (!programId || !name.trim()) {
      alert('Completa Carrera y Nombre de materia.')
      return
    }

    const payload = {
      program_id: programId,
      term_id: termId ? termId : null,
      name: name.trim(),
      code: code.trim() ? code.trim() : null,
      is_active: isActive,
    }

    if (mode === 'create') {
      const { error } = await supabase.from('subjects').insert(payload)
      if (error) return alert(error.message)
    } else if (mode === 'edit') {
      const { error } = await supabase.from('subjects').update(payload).eq('id', editingId)
      if (error) return alert(error.message)
    }

    closeModal()
    await loadAll()
  }

  async function onDelete(id: string) {
    const ok = confirm('¿Eliminar esta materia?')
    if (!ok) return
    const { error } = await supabase.from('subjects').delete().eq('id', id)
    if (error) return alert(error.message)
    await loadAll()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button
          className="inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          onClick={openCreate}
          disabled={loading}
        >
          Nueva materia
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
              <th className="p-3">Carrera</th>
              <th className="p-3">Cuatrimestre</th>
              <th className="p-3">Materia</th>
              <th className="p-3">Clave</th>
              <th className="p-3">Activa</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={6}>
                  Cargando…
                </td>
              </tr>
            ) : subjects.length === 0 ? (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={6}>
                  No hay materias todavía.
                </td>
              </tr>
            ) : (
              subjects.map((s) => {
                const p = programsById.get(s.program_id)
                const t = s.term_id ? termsById.get(s.term_id) : null
                return (
                  <tr key={s.id} className="border-b last:border-b-0">
                    <td className="p-3">{p?.name ?? s.program_id}</td>
                    <td className="p-3">{t ? termLabel(t) : '—'}</td>
                    <td className="p-3 font-medium">{s.name}</td>
                    <td className="p-3">{s.code ?? '—'}</td>
                    <td className="p-3">{s.is_active ? 'Sí' : 'No'}</td>
                    <td className="p-3 text-right space-x-2">
                      <button className="rounded-md border px-3 py-1 text-xs font-medium" onClick={() => openEdit(s)}>
                        Editar
                      </button>
                      <button
                        className="rounded-md border border-red-600 px-3 py-1 text-xs font-medium text-red-600"
                        onClick={() => onDelete(s.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {mode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-background p-4 shadow-lg">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">{mode === 'create' ? 'Nueva materia' : 'Editar materia'}</h2>
              <p className="text-sm text-muted-foreground">Carrera + (Cuatrimestre opcional) + Materia</p>
            </div>

            <div className="grid gap-3">
              <div className="grid gap-1">
                <label className="text-sm font-medium">Carrera</label>
                <select
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={programId}
                  onChange={(e) => {
                    setProgramId(e.target.value)
                    setTermId('')
                  }}
                >
                  <option value="">Selecciona una carrera</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-1">
                <label className="text-sm font-medium">Cuatrimestre (opcional)</label>
                <select
                  className="h-10 rounded-md border bg-background px-3 text-sm disabled:opacity-50"
                  value={termId}
                  onChange={(e) => setTermId(e.target.value)}
                  disabled={!programId}
                >
                  <option value="">{programId ? 'Sin cuatrimestre' : 'Primero elige carrera'}</option>
                  {termsForProgram.map((t) => (
                    <option key={t.id} value={t.id}>
                      {termLabel(t)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-1">
                <label className="text-sm font-medium">Materia</label>
                <input
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Programación Web"
                />
              </div>

              <div className="grid gap-1">
                <label className="text-sm font-medium">Clave (opcional)</label>
                <input
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ej: PW-101"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <label htmlFor="isActive" className="text-sm">
                  Activa
                </label>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button className="rounded-md border px-4 py-2 text-sm font-medium" onClick={closeModal}>
                Cancelar
              </button>
              <button
                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                onClick={onSubmit}
                disabled={!programId || !name.trim()}
              >
                {mode === 'create' ? 'Crear' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
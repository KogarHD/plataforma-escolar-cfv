// C:\Users\edgar\Proyectos\plataforma-escolar-cfv\app\admin\terms\page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Program = {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  created_at: string;
};

type Term = {
  id: string;
  program_id: string;
  number: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
};

function formatSupabaseError(err: unknown): string {
  if (!err || typeof err !== "object") return "Error desconocido.";
  const e = err as { message?: string; details?: string; hint?: string };
  const parts = [e.message, e.details, e.hint].filter(Boolean);
  return parts.length ? parts.join(" | ") : "Error desconocido.";
}

export default function AdminTermsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [items, setItems] = useState<Term[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [loadingTerms, setLoadingTerms] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filterProgramId, setFilterProgramId] = useState<string>("all");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [programId, setProgramId] = useState<string>("");
  const [numberStr, setNumberStr] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(true);

  const programById = useMemo(() => {
    const m = new Map<string, Program>();
    for (const p of programs) m.set(p.id, p);
    return m;
  }, [programs]);

  const filteredItems = useMemo(() => {
    if (filterProgramId === "all") return items;
    return items.filter((t) => t.program_id === filterProgramId);
  }, [items, filterProgramId]);

  function resetForm(nextProgramId?: string) {
    setEditingId(null);
    setProgramId(nextProgramId ?? programId ?? "");
    setNumberStr("");
    setName("");
    setStartDate("");
    setEndDate("");
    setIsActive(true);
  }

  function beginEdit(t: Term) {
    setEditingId(t.id);
    setProgramId(t.program_id);
    setNumberStr(String(t.number));
    setName(t.name ?? "");
    setStartDate(t.start_date ?? "");
    setEndDate(t.end_date ?? "");
    setIsActive(Boolean(t.is_active));
  }

  useEffect(() => {
    let alive = true;

    void (async () => {
      setLoadingPrograms(true);
      setError(null);

      try {
        const { data, error: e } = await supabase
          .from("programs")
          .select("id, code, name, is_active, created_at")
          .order("created_at", { ascending: false });

        if (!alive) return;

        if (e) {
          console.error("programs load error:", e);
          setError(`Programs: ${e.message}${e.details ? ` | ${e.details}` : ""}`);
          setPrograms([]);
          setProgramId("");
          return;
        }

        const list = (data ?? []) as Program[];
        setPrograms(list);
        setProgramId((prev) => prev || list[0]?.id || "");
      } catch (err: unknown) {
        if (!alive) return;
        console.error("programs load catch:", err);
        setError(`Programs: ${formatSupabaseError(err)}`);
        setPrograms([]);
        setProgramId("");
      } finally {
        if (!alive) return;
        setLoadingPrograms(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    void (async () => {
      setLoadingTerms(true);
      setError(null);

      try {
        const { data, error: e } = await supabase
          .from("terms")
          .select("id, program_id, number, name, start_date, end_date, is_active, created_at")
          .order("created_at", { ascending: false });

        if (!alive) return;

        if (e) {
          console.error("terms load error:", e);
          setError(`Terms: ${e.message}${e.details ? ` | ${e.details}` : ""}`);
          setItems([]);
          return;
        }

        setItems((data ?? []) as Term[]);
      } catch (err: unknown) {
        if (!alive) return;
        console.error("terms load catch:", err);
        setError(`Terms: ${formatSupabaseError(err)}`);
        setItems([]);
      } finally {
        if (!alive) return;
        setLoadingTerms(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  async function reloadTerms() {
    const { data, error: e } = await supabase
      .from("terms")
      .select("id, program_id, number, name, start_date, end_date, is_active, created_at")
      .order("created_at", { ascending: false });

    if (e) {
      console.error("terms reload error:", e);
      setError(`Reload: ${e.message}${e.details ? ` | ${e.details}` : ""}`);
      return;
    }

    setItems((data ?? []) as Term[]);
  }

  async function onSave() {
    setError(null);

    const pId = programId.trim();
    const n = Number(numberStr);

    if (!pId) {
      setError("Selecciona una carrera.");
      return;
    }
    if (!Number.isFinite(n) || n <= 0) {
      setError("El número de cuatrimestre debe ser un entero > 0.");
      return;
    }
    if (!name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    setSaving(true);

    const payload = {
      program_id: pId,
      number: Math.trunc(n),
      name: name.trim(),
      start_date: startDate ? startDate : null,
      end_date: endDate ? endDate : null,
      is_active: isActive,
    };

    try {
      if (editingId) {
        const { error: e } = await supabase
          .from("terms")
          .update(payload)
          .eq("id", editingId);

        if (e) {
          console.error("terms update error:", e);
          setError(`Update: ${e.message}${e.details ? ` | ${e.details}` : ""}`);
          return;
        }
      } else {
        const { error: e } = await supabase.from("terms").insert(payload);

        if (e) {
          console.error("terms insert error:", e);
          setError(`Insert: ${e.message}${e.details ? ` | ${e.details}` : ""}`);
          return;
        }
      }

      await reloadTerms();
      resetForm(pId);
    } catch (err: unknown) {
      console.error("terms save catch:", err);
      setError(formatSupabaseError(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    const ok = confirm("¿Eliminar este cuatrimestre?");
    if (!ok) return;

    setError(null);
    setSaving(true);

    try {
      const { error: e } = await supabase.from("terms").delete().eq("id", id);

      if (e) {
        console.error("terms delete error:", e);
        setError(`Delete: ${e.message}${e.details ? ` | ${e.details}` : ""}`);
        return;
      }

      setItems((prev) => prev.filter((x) => x.id !== id));
      if (editingId === id) resetForm();
    } catch (err: unknown) {
      console.error("terms delete catch:", err);
      setError(formatSupabaseError(err));
    } finally {
      setSaving(false);
    }
  }

  const busy = loadingPrograms || loadingTerms || saving;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Cuatrimestres</h1>
          <p className="text-sm text-muted-foreground">
            Admin: gestiona cuatrimestres por carrera.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filtrar:</span>
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={filterProgramId}
              onChange={(e) => setFilterProgramId(e.target.value)}
              disabled={loadingPrograms}
            >
              <option value="all">Todas</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={() => resetForm(programs[0]?.id)}
            disabled={busy}
          >
            Nuevo
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">
            {editingId ? "Editar cuatrimestre" : "Crear cuatrimestre"}
          </CardTitle>
          <div className="text-xs text-muted-foreground">
            {busy ? "Cargando/guardando…" : "Listo"}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm">Carrera</label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
                disabled={loadingPrograms || saving}
              >
                {programs.length === 0 ? (
                  <option value="">Sin carreras</option>
                ) : (
                  programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm">Número</label>
              <Input
                value={numberStr}
                onChange={(e) => setNumberStr(e.target.value)}
                placeholder="1, 2, 3…"
                inputMode="numeric"
                disabled={saving}
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm">Nombre</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: 1er Cuatrimestre"
                disabled={saving}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm">Inicio</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm">Fin</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="flex items-center gap-2 md:col-span-2">
              <input
                id="isActive"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={saving}
              />
              <label htmlFor="isActive" className="text-sm">
                Activo
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            {editingId && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => resetForm(programId)}
                disabled={saving}
              >
                Cancelar
              </Button>
            )}
            <Button type="button" onClick={onSave} disabled={busy || programs.length === 0}>
              {saving ? "Guardando…" : editingId ? "Guardar cambios" : "Crear"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Listado</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estado</TableHead>
                <TableHead>Carrera</TableHead>
                <TableHead>Número</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Fin</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-sm text-muted-foreground">
                    {loadingTerms ? "Cargando…" : "No hay cuatrimestres."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((t) => {
                  const p = programById.get(t.program_id);
                  return (
                    <TableRow key={t.id}>
                      <TableCell>
                        {t.is_active ? (
                          <Badge>Activo</Badge>
                        ) : (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {p ? `${p.code} — ${p.name}` : t.program_id}
                      </TableCell>
                      <TableCell>{t.number}</TableCell>
                      <TableCell>{t.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {t.start_date ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {t.end_date ?? "—"}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => beginEdit(t)}
                          disabled={saving}
                        >
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => void onDelete(t.id)}
                          disabled={saving}
                        >
                          Eliminar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

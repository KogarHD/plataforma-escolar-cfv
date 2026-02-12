// C:\Users\edgar\Proyectos\plataforma-escolar-cfv\app\admin\programs\page.tsx
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Program = {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  created_at: string;
};

type FormMode = "create" | "edit" | null;

export default function AdminProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");

  const [mode, setMode] = useState<FormMode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);

  async function loadPrograms() {
    setLoading(true);
    setError(null);

    const { data, error: dbError } = await supabase
      .from("programs")
      .select("id, code, name, is_active, created_at")
      .order("created_at", { ascending: false });

    if (dbError) {
      setError(dbError.message);
      setPrograms([]);
      setLoading(false);
      return;
    }

    setPrograms((data ?? []) as Program[]);
    setLoading(false);
  }

 useEffect(() => {
  let alive = true;

  supabase
    .from("programs")
    .select("id, code, name, is_active, created_at")
    .order("created_at", { ascending: false })
    .then(({ data, error }) => {
      if (!alive) return;

      if (error) {
        console.error(error);
        setError("No se pudieron cargar las carreras.");
        setPrograms([]);
        return;
      }

      setPrograms(data ?? []);
    })
    .then(() => {
      if (!alive) return;
      setLoading(false);
    });

  return () => {
    alive = false;
  };
}, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return programs;
    return programs.filter((p) => {
      return (
        p.code.toLowerCase().includes(term) ||
        p.name.toLowerCase().includes(term)
      );
    });
  }, [programs, q]);

  function startCreate() {
    setMode("create");
    setEditingId(null);
    setCode("");
    setName("");
    setIsActive(true);
    setError(null);
  }

  function startEdit(p: Program) {
    setMode("edit");
    setEditingId(p.id);
    setCode(p.code ?? "");
    setName(p.name ?? "");
    setIsActive(!!p.is_active);
    setError(null);
  }

  function cancelForm() {
    setMode(null);
    setEditingId(null);
    setCode("");
    setName("");
    setIsActive(true);
    setError(null);
  }

  async function saveForm() {
    setError(null);

    const cleanCode = code.trim();
    const cleanName = name.trim();

    if (!cleanCode || !cleanName) {
      setError("Completa código y nombre.");
      return;
    }

    setSaving(true);

    if (mode === "create") {
      const { error: insErr } = await supabase.from("programs").insert({
        code: cleanCode,
        name: cleanName,
        is_active: isActive,
      });

      if (insErr) {
        setSaving(false);
        setError(insErr.message);
        return;
      }
    }

    if (mode === "edit" && editingId) {
      const { error: updErr } = await supabase
        .from("programs")
        .update({
          code: cleanCode,
          name: cleanName,
          is_active: isActive,
        })
        .eq("id", editingId);

      if (updErr) {
        setSaving(false);
        setError(updErr.message);
        return;
      }
    }

    setSaving(false);
    cancelForm();
    await loadPrograms();
  }

  async function toggleActive(p: Program) {
    setError(null);

    const { error: updErr } = await supabase
      .from("programs")
      .update({ is_active: !p.is_active })
      .eq("id", p.id);

    if (updErr) {
      setError(updErr.message);
      return;
    }

    await loadPrograms();
  }

  async function removeProgram(p: Program) {
    setError(null);

    const ok = confirm(
      `¿Eliminar la carrera "${p.name}" (${p.code})? Esto no se puede deshacer.`
    );
    if (!ok) return;

    const { error: delErr } = await supabase.from("programs").delete().eq("id", p.id);

    if (delErr) {
      setError(delErr.message);
      return;
    }

    await loadPrograms();
  }

  const fmtDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat("es-MX", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Carreras</h1>
          <p className="text-sm text-muted-foreground">
            Alta/edición de carreras (programs).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={loadPrograms} disabled={loading}>
            {loading ? "Cargando..." : "Refrescar"}
          </Button>
          <Button onClick={startCreate}>Nueva carrera</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Buscar</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por código o nombre…"
          />
        </CardContent>
      </Card>

      {mode && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {mode === "create" ? "Nueva carrera" : "Editar carrera"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Código</label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="ING-SIS"
                  autoComplete="off"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-sm text-muted-foreground">Nombre</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ingeniería en Sistemas"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                Activa
              </label>

              <div className="flex-1" />

              <Button variant="ghost" onClick={cancelForm} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={saveForm} disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Lista ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {error && (
            <div className="mb-3 text-sm text-red-500">
              Error: {error}
            </div>
          )}

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="w-[120px]">Estado</TableHead>
                  <TableHead className="w-[140px]">Creado</TableHead>
                  <TableHead className="w-[80px] text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                      Cargando…
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                      No hay carreras todavía.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-sm">{p.code}</TableCell>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>
                        {p.is_active ? (
                          <Badge>Activa</Badge>
                        ) : (
                          <Badge variant="secondary">Inactiva</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {fmtDate(p.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              ⋯
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => startEdit(p)}>
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleActive(p)}>
                              {p.is_active ? "Desactivar" : "Activar"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => removeProgram(p)}>
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Tip: si no quieres borrar, mejor usa “Desactivar”.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

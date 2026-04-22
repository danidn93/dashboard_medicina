//src/pages/Dashboard.tsx
"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import FloatingChatGPT from "@/components/FloatingChatGPT";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Tooltip,
  CartesianGrid,
  Cell,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

/* =========================
   Cromática institucional (UNEMI)
========================= */
const COLORS = {
  primary: "#002E45", // Pantone 7463 C
  accent: "#FF6900", // Pantone 1505 C
  dark: "#222223", // Pantone Neutral Black C
  muted: "#E5E7EB",
  bg: "#F8FAFC",
};

/* =========================
   Tipos
========================= */
type Item = {
  id: string;
  nombre: string;
  promedio: number;
};

type DocenteDetalle = {
  docente: string;
  asignatura: string;
  periodos: string[];
  // OJO: tu RPC no devuelve promedio aquí. Lo dejamos opcional por compatibilidad.
  promedio?: number;
};

type Response = {
  global: number;
  conteo?: number;

  por_componente: Item[];
  por_subcomponente: Item[];
  por_tema: Item[];
  por_asignatura: Item[];

  top5?: {
    componentes: Item[];
    subcomponentes: Item[];
    temas: Item[];
    asignaturas: Item[];
  };

  docentes_por_componente: Record<string, string[]>;
  docentes_por_subcomponente: Record<string, string[]>;
  docentes_por_tema: Record<string, string[]>;
  docentes_por_asignatura: Record<string, string[]>;

  docentes_global_detalle: DocenteDetalle[];
};

type DashboardProps = {
  forcePublic?: boolean;
  versionIdOverride?: string;
};

type NivelTab = "componentes" | "subcomponentes" | "temas";

/* =========================
   Utils
========================= */
const pct = (n: number) => `${Number.isFinite(n) ? n.toFixed(2) : "0.00"}%`;
const asc = (a: Item[]) => [...a].sort((x, y) => x.promedio - y.promedio);

function safeText(s: unknown) {
  return typeof s === "string" ? s : "";
}

function getNombreById(id: string | null, items?: Item[]): string | null {
  if (!id || !items) return null;
  return items.find((i) => i.id === id)?.nombre ?? null;
}

function FilterBadge({
  label,
  value,
  onClear,
}: {
  label: string;
  value: string;
  onClear: () => void;
}) {
  return (
    <Badge
      variant="outline"
      className="flex items-center gap-1 pr-1"
      style={{ borderColor: COLORS.primary, color: COLORS.primary }}
    >
      <span className="max-w-[200px] truncate">
        <strong>{label}:</strong> {value}
      </span>
      <button
        onClick={onClear}
        className="ml-1 rounded-full px-1 text-xs hover:bg-gray-200"
        aria-label={`Eliminar filtro ${label}`}
      >
        ✕
      </button>
    </Badge>
  );
}

/* =========================
   Componente principal
========================= */
export default function DashboardGerencial({
    forcePublic = false,
    versionIdOverride,
  }: DashboardProps) {
  const params = useParams<{ versionId: string }>();
  const versionId = versionIdOverride ?? params.versionId;
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(false);

  /* ---------- filtros (drill-down) ---------- */
  const [fComponente, setFComponente] = useState<string | null>(null);
  const [fSubcomponente, setFSubcomponente] = useState<string | null>(null);
  const [fTema, setFTema] = useState<string | null>(null);

  const [nivelActivo, setNivelActivo] = useState<NivelTab>("componentes");

  /* ---------- chat ---------- */
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<
    { from: "user" | "system"; text: string }[]
  >([]);

  /* =========================
     Carga (MISMA RPC, con filtros)
     - Primera vez: solo version_id
     - Luego: cambia según filtros
  ========================= */
  useEffect(() => {
    if (!versionId) return;

    let mounted = true;
    setLoading(true);

    supabase
      .rpc("eval_dashboard_analisis", {
        p_version_id: versionId,
        p_componente: fComponente,
        p_subcomponente: fSubcomponente,
        p_tema: fTema,
        p_asignatura: null,
        p_profesor: null,
        p_periodo: null,
      })
      .then(({ data, error }) => {
        if (error) {
          console.error("Dashboard RPC error:", error);
          return;
        }
        if (mounted) setData(data as Response);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [versionId, fComponente, fSubcomponente, fTema]);

  /* =========================
    Derivados
  ========================= */
  const nombreComponente = useMemo(
    () => getNombreById(fComponente, data?.por_componente),
    [fComponente, data]
  );

  const nombreSubcomponente = useMemo(
    () => getNombreById(fSubcomponente, data?.por_subcomponente),
    [fSubcomponente, data]
  );

  const nombreTema = useMemo(
    () => getNombreById(fTema, data?.por_tema),
    [fTema, data]
  );

  const componentes = useMemo(
    () => (data ? asc(data.por_componente ?? []) : []),
    [data]
  );
  const subcomponentes = useMemo(
    () => (data ? asc(data.por_subcomponente ?? []) : []),
    [data]
  );
  const temas = useMemo(() => (data ? asc(data.por_tema ?? []) : []), [data]);
  const asignaturas = useMemo(
    () => (data ? asc(data.por_asignatura ?? []) : []),
    [data]
  );

  /* =========================
     Limpieza de filtros
  ========================= */
  const clearFilters = useCallback(() => {
    setFComponente(null);
    setFSubcomponente(null);
    setFTema(null);
    setNivelActivo("componentes");
  }, []);

  /* =========================
     Chat lógico (sin IA), contextual
  ========================= */
  const handleChat = useCallback(() => {
    if (!data || !chatInput.trim()) return;

    const q = chatInput.toLowerCase();
    let answer = "No se encontró información para esa consulta.";

    const universeAsignaturas = asignaturas.length
      ? asignaturas
      : asc(data.por_asignatura ?? []);
    const universeComponentes = componentes.length
      ? componentes
      : asc(data.por_componente ?? []);
    const universeDocentes = [...(data.docentes_global_detalle ?? [])];

    if (
      q.includes("asignatura") &&
      (q.includes("menor") || q.includes("más baja") || q.includes("peor"))
    ) {
      const a = universeAsignaturas[0];
      if (a) answer = `La asignatura con menor puntaje es "${a.nombre}" (${pct(a.promedio)}).`;
    }

    if (
      q.includes("docente") &&
      (q.includes("mejor") || q.includes("más alto") || q.includes("mayor"))
    ) {
      // si tu backend no trae promedio en detalle, esta parte se mantiene “best effort”
      // ordenamos por promedio si existe, si no, devolvemos el primero (estable).
      const sorted = universeDocentes.sort((a, b) => {
        const ap = Number.isFinite(a.promedio as number) ? (a.promedio as number) : -Infinity;
        const bp = Number.isFinite(b.promedio as number) ? (b.promedio as number) : -Infinity;
        return bp - ap;
      });
      const d = sorted[0];
      if (d)
        answer = `Docente destacado: ${d.docente}, en ${d.asignatura}, períodos ${d.periodos.join(", ")}.`;
    }

    if (
      q.includes("componente") &&
      (q.includes("menor") || q.includes("más bajo") || q.includes("crítico"))
    ) {
      const c = universeComponentes[0];
      if (c) answer = `El componente más crítico es "${c.nombre}" (${pct(c.promedio)}).`;
    }

    setMessages((m) => [
      ...m,
      { from: "user", text: chatInput },
      { from: "system", text: answer },
    ]);
    setChatInput("");
  }, [data, chatInput, asignaturas, componentes]);

  if (loading && !data) return <div className="p-6">Cargando dashboard…</div>;
  if (!data) return <div className="p-6">No hay datos para mostrar.</div>;

  const docentesResumen = data.docentes_global_detalle
    .slice(0, 15) // límite defensivo
    .map(
      (d) =>
        `- ${d.docente}: ${d.asignatura} (${d.periodos.join(", ")})`
    )
    .join("\n");

const chatContext = `
DASHBOARD GERENCIAL — EVALUACIÓN ACADÉMICA

VERSIÓN ANALIZADA:
- Version ID: ${versionId}

NIVEL ACTIVO DE ANÁLISIS:
- ${nivelActivo}

FILTROS ACTUALES (definen el universo de datos):
- Componente: ${nombreComponente ?? "Todos"}
- Subcomponente: ${nombreSubcomponente ?? "Todos"}
- Tema: ${nombreTema ?? "Todos"}

INDICADORES GENERALES (sobre el universo filtrado):
- Promedio global de aciertos: ${data.global.toFixed(2)}%
- Total de registros considerados: ${data.conteo ?? "N/D"}

COMPONENTES MÁS CRÍTICOS (ordenados de menor a mayor desempeño):
${componentes.slice(0, 5).map(
  (c, i) => `${i + 1}. ${c.nombre} — ${c.promedio.toFixed(2)}%`
).join("\n")}

ASIGNATURAS CON MENOR DESEMPEÑO (dentro del universo actual):
${asignaturas.slice(0, 5).map(
  (a, i) => `${i + 1}. ${a.nombre} — ${a.promedio.toFixed(2)}%`
).join("\n")}

DOCENTES Y PERIODOS (universo actual):
${docentesResumen}

Nota:
El listado muestra docentes, asignaturas impartidas y periodos asociados,
limitado al universo definido por los filtros activos.
`;


  /* =========================
     Render
  ========================= */
  return (
    <div
      className="p-6 space-y-8"
      style={{ backgroundColor: COLORS.bg, color: COLORS.dark }}
    >
      {/* ================= Header + Filtros ================= */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm" style={{ color: COLORS.dark, opacity: 0.75 }}>
            Dashboard Gerencial
          </div>
          <div className="text-2xl font-bold" style={{ color: COLORS.primary }}>
            Evaluación — Análisis por jerarquía
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {nombreComponente && (
            <FilterBadge
              label="Componente"
              value={nombreComponente}
              onClear={() => {
                setFComponente(null);
                setFSubcomponente(null);
                setFTema(null);
                setNivelActivo("componentes");
              }}
            />
          )}

          {nombreSubcomponente && (
            <FilterBadge
              label="Subcomponente"
              value={nombreSubcomponente}
              onClear={() => {
                setFSubcomponente(null);
                setFTema(null);
                setNivelActivo("subcomponentes");
              }}
            />
          )}

          {nombreTema && (
            <FilterBadge
              label="Tema"
              value={nombreTema}
              onClear={() => {
                setFTema(null);
                setNivelActivo("temas");
              }}
            />
          )}

          {(fComponente || fSubcomponente || fTema) && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Limpiar todo
            </Button>
          )}
          {!forcePublic && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const publicUrl = `${window.location.origin}/public/dashboard/${versionId}`;
                navigator.clipboard.writeText(publicUrl);
                alert("Link público copiado al portapapeles");
              }}
            >
              Compartir link público
            </Button>
          )}
        </div>
      </div>

      {/* ================= KPIs ================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPI title="Promedio General" value={pct(data.global)} />
        <KPI title="Componentes" value={data.por_componente?.length ?? 0} />
        <KPI title="Asignaturas" value={data.por_asignatura?.length ?? 0} />
        <KPI title="Docentes" value={data.docentes_global_detalle?.length ?? 0} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        {/* ===== Tabs laterales ===== */}
        <aside>
          <VerticalTabs
            nivel={nivelActivo}
            setNivel={setNivelActivo}
            disabled={{
              subcomponentes: !fComponente,
              temas: !fSubcomponente,
            }}
          />
        </aside>

        {/* ===== Contenido principal ===== */}
        <main className="space-y-6">
          {nivelActivo === "componentes" && (
            <Section
              title="Desempeño por Componente"
              subtitle="Seleccione un componente para ver subcomponentes."
            >
              <BarBlock
                data={componentes}
                selectedId={fComponente}
                onSelect={(id) => {
                  setFComponente(id);
                  setFSubcomponente(null);
                  setFTema(null);
                  setNivelActivo("componentes");
                }}
              />

              {/* ✅ Lista: Top 5 + Acordeón (resto) */}
              <ListBlockExpandable
                title="Subcomponentes"
                data={subcomponentes}
                selectedId={fSubcomponente}
                onSelect={(id) => {
                  setFSubcomponente(id);
                  setFTema(null);
                  setNivelActivo("subcomponentes");
                }}
                docentesMap={data.docentes_por_subcomponente}
              />
            </Section>
          )}

          {nivelActivo === "subcomponentes" && (
            <Section
              title="Subcomponentes"
              subtitle="Seleccione un subcomponente para ver temas."
            >
              <BarBlock
                data={subcomponentes}
                selectedId={fSubcomponente}
                onSelect={(id) => {
                  setFSubcomponente(id);
                  setFTema(null);
                  setNivelActivo("subcomponentes");
                }}
              />

              {/* ✅ Lista: Top 5 + Acordeón (resto) */}
              <ListBlockExpandable
                title="Temas"
                data={temas}
                selectedId={fTema}
                onSelect={(id) => {
                  setFTema(id);
                  setNivelActivo("temas");
                }}
                docentesMap={data.docentes_por_tema}
              />
            </Section>
          )}

          {nivelActivo === "temas" && (
            <Section
              title="Temas"
              subtitle="Seleccione un tema para ver asignaturas."
            >
              <BarBlock
                data={temas}
                selectedId={fTema}
                onSelect={(id) => {
                  setFTema(id);
                  setNivelActivo("temas");
                }}
              />

              {/* ✅ Lista: Top 5 + Acordeón (resto) */}
              <ListBlockExpandable
                title="Asignaturas"
                data={asignaturas}
                docentesMap={data.docentes_por_asignatura}
              />
            </Section>
          )}
        </main>
      </div>
      <FloatingChatGPT
        dashboardContext={chatContext}
        rpcSnapshot={{
          global: data.global,
          conteo: data.conteo,
          por_componente: data.por_componente,
          por_subcomponente: data.por_subcomponente,
          por_tema: data.por_tema,
          por_asignatura: data.por_asignatura,
          docentes_global_detalle: data.docentes_global_detalle,
        }}
      />
    </div>
  );
}

/* =========================
   Lista (Top 5 + Acordeón + Ver docentes)
   - Top 5 = críticos (promedio ASC)
   - Acordeón = resto de resultados del mismo nivel
   - Ver docentes = usa el Record<string,string[]> de la MISMA RPC eval_dashboard_analisis
========================= */
function ListBlockExpandable({
  title,
  data,
  onSelect,
  selectedId,
  docentesMap,
}: {
  title: string;
  data: Item[];
  onSelect?: (id: string) => void;
  selectedId?: string | null;
  docentesMap: Record<string, string[]>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [openDocentes, setOpenDocentes] = useState<{
    id: string;
    nombre: string;
  } | null>(null);

  const top5 = useMemo(() => data.slice(0, 5), [data]);
  const resto = useMemo(() => data.slice(5), [data]);

  const docentes = useMemo(() => {
    if (!openDocentes) return [];
    return docentesMap?.[openDocentes.id] ?? [];
  }, [openDocentes, docentesMap]);

  return (
    <>
      <div className="rounded-lg border p-3" style={{ borderColor: COLORS.muted }}>
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold" style={{ color: COLORS.primary }}>
            {title} críticos
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline">Top 5</Badge>
            <Badge
              variant="outline"
              style={{ borderColor: COLORS.muted, color: COLORS.dark, opacity: 0.8 }}
              title="Total de resultados para este nivel (con los filtros actuales)"
            >
              Total: {data.length}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          {top5.map((i) => (
            <ItemRow
              key={i.id}
              item={i}
              active={selectedId === i.id}
              onSelect={onSelect}
              onVerDocentes={() => setOpenDocentes({ id: i.id, nombre: i.nombre })}
            />
          ))}

          {/* ✅ Acordeón del resto */}
          {resto.length > 0 && (
            <div className="pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpanded((v) => !v)}
                className="w-full justify-between"
                style={{ borderColor: COLORS.muted }}
              >
                <span>{expanded ? "Ocultar resto" : "Ver todos los resultados"}</span>
                <span className="text-xs opacity-70">
                  {expanded ? "▲" : "▼"} ({resto.length})
                </span>
              </Button>

              {expanded && (
                <div className="mt-2 space-y-2">
                  {resto.map((i) => (
                    <ItemRow
                      key={i.id}
                      item={i}
                      active={selectedId === i.id}
                      onSelect={onSelect}
                      onVerDocentes={() =>
                        setOpenDocentes({ id: i.id, nombre: i.nombre })
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ✅ Modal real (shadcn) para docentes */}
      <Dialog open={!!openDocentes} onOpenChange={(o) => !o && setOpenDocentes(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ color: COLORS.primary }}>
              Docentes — {openDocentes?.nombre ?? ""}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            {docentes.length === 0 ? (
              <div className="text-sm" style={{ color: COLORS.dark, opacity: 0.75 }}>
                No existen docentes asociados (según el universo filtrado).
              </div>
            ) : (
              <ul
                className="space-y-2 text-sm overflow-y-auto pr-2"
                style={{ maxHeight: "320px" }}   // 👈 controla cuándo aparece el scroll
              >

                {docentes.map((d, idx) => (
                  <li
                    key={`${d}-${idx}`}
                    className="rounded-md border px-3 py-2"
                    style={{ borderColor: COLORS.muted }}
                  >
                    {d}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="pt-2">
            <DialogClose asChild>
              <Button variant="outline" className="w-full">
                Cerrar
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ItemRow({
  item,
  active,
  onSelect,
  onVerDocentes,
}: {
  item: Item;
  active?: boolean;
  onSelect?: (id: string) => void;
  onVerDocentes: () => void;
}) {
  return (
    <div
      onClick={() => onSelect?.(item.id)}
      className="flex items-center justify-between rounded-md border px-3 py-2 transition"
      style={{
        borderColor: active ? COLORS.accent : COLORS.muted,
        backgroundColor: active ? "#FFF3EB" : "#FFFFFF",
        cursor: onSelect ? "pointer" : "default",
      }}
    >
      <div className="min-w-0">
        <div className="text-sm font-medium truncate" title={safeText(item.nombre)}>
          {item.nombre}
        </div>
        {active && (
          <div className="text-xs mt-0.5" style={{ color: COLORS.dark, opacity: 0.75 }}>
            Seleccionado para filtrar
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="outline">{pct(item.promedio)}</Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onVerDocentes();
          }}
        >
          Ver docentes
        </Button>
      </div>
    </div>
  );
}

function VerticalTabs({
  nivel,
  setNivel,
  disabled,
}: {
  nivel: NivelTab;
  setNivel: (n: NivelTab) => void;
  disabled: { subcomponentes: boolean; temas: boolean };
}) {
  const tabs: { id: NivelTab; label: string; disabled?: boolean }[] = [
    { id: "componentes", label: "Componentes" },
    { id: "subcomponentes", label: "Subcomponentes", disabled: disabled.subcomponentes },
    { id: "temas", label: "Temas", disabled: disabled.temas },
  ];

  return (
    <div className="space-y-2">
      {tabs.map((t) => (
        <Button
          key={t.id}
          variant={nivel === t.id ? "default" : "outline"}
          className="w-full justify-start"
          onClick={() => setNivel(t.id)}
          disabled={!!t.disabled}
          style={
            t.disabled
              ? { opacity: 0.6, cursor: "not-allowed" }
              : undefined
          }
          title={
            t.disabled
              ? t.id === "subcomponentes"
                ? "Seleccione un componente primero"
                : "Seleccione un subcomponente primero"
              : undefined
          }
        >
          {t.label}
        </Button>
      ))}
    </div>
  );
}

/* =========================
   UI: KPI
========================= */
function KPI({ title, value }: { title: string; value: any }) {
  return (
    <Card className="relative overflow-hidden">
      <div
        className="absolute left-0 top-0 h-full w-[6px]"
        style={{ backgroundColor: COLORS.accent }}
      />
      <CardContent className="p-4 pl-5">
        <div className="text-sm" style={{ color: COLORS.dark, opacity: 0.75 }}>
          {title}
        </div>
        <div className="text-3xl font-bold" style={{ color: COLORS.primary }}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

/* =========================
   UI: Section
========================= */
function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle style={{ color: COLORS.primary }}>{title}</CardTitle>
        {subtitle && (
          <div className="text-sm" style={{ color: COLORS.dark, opacity: 0.75 }}>
            {subtitle}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">{children}</CardContent>
    </Card>
  );
}

/* =========================
   UI: Chart (BarBlock)
   - sin etiquetas (solo hover)
========================= */
function BarBlock({
  data,
  onSelect,
  selectedId,
}: {
  data: Item[];
  onSelect?: (id: string) => void;
  selectedId?: string | null;
}) {
  return (
    <div
      className="rounded-lg border p-3 w-full overflow-hidden"
      style={{ borderColor: COLORS.muted }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="h-4 w-1 rounded" style={{ backgroundColor: COLORS.accent }} />
        <div className="text-sm font-medium" style={{ color: COLORS.dark }}>
          Seleccione un elemento para filtrar (clic en la barra)
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          {/* ✅ sin etiquetas */}
          <XAxis hide />
          <YAxis hide />

          <Tooltip
            formatter={(v: number) => pct(v)}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.nombre ?? ""}
          />

          <Bar
            dataKey="promedio"
            radius={[10, 10, 0, 0]}
            onClick={(p: any) => onSelect?.(p?.id)}
          >
            {data.map((item) => (
              <Cell
                key={item.id}
                fill={selectedId === item.id ? COLORS.accent : COLORS.primary}
                cursor="pointer"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
const RECOMMENDATIONS = {
  high: [
    "Rediseñar integralmente la estrategia didáctica del componente",
    "Implementar tutorías académicas obligatorias",
    "Asignar acompañamiento pedagógico semanal",
    "Reentrenar al docente en evaluación por competencias",
    "Revisar coherencia entre resultados y actividades",
    "Ajustar contenidos según resultados diagnósticos",
    "Aplicar plan de mejora con hitos verificables",
    "Intervención académica inmediata por coordinación",
    "Revisión estructural de la secuencia didáctica",
    "Evaluar pertinencia del enfoque metodológico",
    "Reformular actividades de aprendizaje clave",
    "Revisión urgente de rúbricas de evaluación",
    "Ajustar tiempos y cargas del proceso evaluativo",
    "Capacitación obligatoria en diseño instruccional",
    "Acompañamiento por parte de expertos disciplinares",
    "Evaluación externa del proceso académico",
    "Aplicar observaciones de clase focalizadas",
    "Redefinir criterios de evaluación del tema",
    "Revisión de alineación entre sílabos y resultados",
    "Intervención directa de coordinación académica",
    "Plan intensivo de mejora con evidencias documentadas",
    "Revisión del uso de recursos didácticos",
    "Reforzar competencias docentes críticas",
    "Análisis causa-raíz del bajo desempeño",
    "Implementar seguimiento académico quincenal",
    "Reentrenamiento en estrategias de enseñanza activa",
    "Revisión de prácticas evaluativas no alineadas",
    "Rediseño del plan de clases",
    "Aplicar acompañamiento académico individual",
    "Revisión del nivel de exigencia académica",
    "Implementar co-docencia temporal",
    "Reestructurar actividades prácticas",
    "Revisión del enfoque pedagógico institucional",
    "Evaluar dominio disciplinar del docente",
    "Aplicar evaluación pedagógica formativa al docente",
    "Reforzar uso de evidencias de aprendizaje",
    "Ajustar metodología según perfil estudiantil",
    "Implementar plan correctivo inmediato",
    "Monitoreo permanente por unidad académica",
    "Revisión del proceso de retroalimentación",
    "Reorientar actividades hacia resultados esperados",
    "Reformular instrumentos de medición",
    "Revisar diseño de evaluaciones sumativas",
    "Aplicar capacitación intensiva especializada",
    "Redefinir estrategias de enseñanza-aprendizaje",
    "Revisión de prácticas docentes observadas",
    "Revisar correspondencia entre contenidos y evaluaciones",
    "Intervención académica prioritaria",
    "Implementar plan de mejora documentado",
    "Evaluar desempeño docente con criterios ampliados",
    "Reestructurar evaluación continua",
    "Revisión profunda del enfoque curricular",
    "Fortalecer seguimiento pedagógico",
    "Aplicar controles académicos periódicos",
    "Revisión de evidencias de aprendizaje",
    "Reorientar proceso de enseñanza",
    "Ajustar secuencia de contenidos",
    "Evaluación integral del proceso formativo",
    "Implementar estrategia de recuperación académica",
    "Redefinir actividades evaluables",
    "Revisión del aprendizaje esperado",
    "Acompañamiento intensivo por pares expertos",
    "Aplicar plan de nivelación académica",
    "Revisar cumplimiento de estándares académicos",
    "Fortalecer control del proceso pedagógico",
    "Intervención académica focalizada",
    "Revisar planificación semanal",
    "Aplicar seguimiento continuo de resultados",
    "Evaluar impacto de estrategias aplicadas",
    "Revisión crítica de resultados históricos",
    "Ajustar criterios de logro",
    "Revisión de enfoque de enseñanza",
    "Implementar estrategia de mejora urgente",
    "Revisión del proceso de evaluación diagnóstica",
    "Redefinir objetivos de aprendizaje",
    "Aplicar intervención pedagógica correctiva",
    "Fortalecer acompañamiento académico",
    "Revisar metodología aplicada en aula",
    "Revisión integral del componente",
    "Aplicar control académico permanente",
    "Reformular diseño pedagógico",
    "Intervención académica estructural",
    "Implementar mejora académica intensiva",
    "Revisión crítica de desempeño docente",
    "Reorientar estrategia institucional",
    "Aplicar plan de acción inmediato"
  ],
  medium: [
    "Fortalecer estrategias de evaluación formativa",
    "Ajustar actividades de aprendizaje clave",
    "Reforzar seguimiento académico periódico",
    "Optimizar planificación microcurricular",
    "Ajustar instrumentos de evaluación",
    "Promover uso de metodologías activas",
    "Revisar coherencia entre contenidos y evaluaciones",
    "Implementar retroalimentación estructurada",
    "Capacitación puntual en evaluación por competencias",
    "Monitorear avances de aprendizaje",
    "Reforzar actividades prácticas",
    "Ajustar secuencia de contenidos",
    "Promover uso de recursos digitales",
    "Fortalecer procesos de retroalimentación",
    "Revisión periódica de resultados académicos",
    "Ajustar enfoque pedagógico",
    "Capacitación focalizada por resultados",
    "Revisión de planificación semanal",
    "Refuerzo metodológico específico",
    "Promover estrategias colaborativas",
    "Mejorar diseño de actividades evaluables",
    "Revisión de criterios de calificación",
    "Fortalecer evaluación continua",
    "Optimizar uso de rúbricas",
    "Promover reflexión pedagógica",
    "Seguimiento académico mensual",
    "Ajustar carga de actividades",
    "Revisión del proceso de enseñanza",
    "Fortalecer acompañamiento docente",
    "Promover uso de buenas prácticas",
    "Ajustar evaluación formativa",
    "Revisión de indicadores de desempeño",
    "Capacitación breve especializada",
    "Revisión de evidencias de aprendizaje",
    "Promover innovación metodológica",
    "Ajustar actividades según resultados",
    "Seguimiento por coordinación académica",
    "Revisión del diseño instruccional",
    "Mejorar retroalimentación al estudiante",
    "Ajustar estrategias didácticas",
    "Fortalecer planificación académica",
    "Revisión de prácticas docentes",
    "Optimizar instrumentos de evaluación",
    "Reforzar competencias específicas",
    "Revisión de procesos evaluativos",
    "Ajustar enfoque de enseñanza",
    "Mejorar alineación curricular",
    "Promover mejora continua",
    "Monitorear resultados intermedios",
    "Ajustar actividades prácticas",
    "Revisión del aprendizaje esperado",
    "Reforzar procesos de evaluación",
    "Promover análisis reflexivo",
    "Seguimiento sistemático de avances",
    "Optimizar metodología aplicada",
    "Revisión de resultados por cohorte",
    "Mejorar gestión del aula",
    "Revisión de secuencia didáctica",
    "Promover prácticas pedagógicas efectivas",
    "Ajustar diseño de evaluaciones",
    "Revisión del proceso formativo",
    "Promover mejora metodológica",
    "Fortalecer prácticas evaluativas",
    "Seguimiento académico focalizado",
    "Revisión de estrategias aplicadas",
    "Optimizar recursos de aprendizaje",
    "Ajustar evaluación continua",
    "Revisión periódica de desempeño",
    "Promover ajustes metodológicos",
    "Fortalecer acompañamiento académico",
    "Revisión del enfoque pedagógico",
    "Optimizar planificación académica",
    "Promover mejora del desempeño",
    "Revisión de resultados parciales",
    "Ajustar metodología de aula",
    "Promover análisis de resultados",
    "Seguimiento académico estructurado",
    "Mejorar estrategias de enseñanza",
    "Revisión del proceso evaluativo",
    "Optimizar actividades de aprendizaje",
    "Promover prácticas reflexivas",
    "Revisión de desempeño docente",
    "Fortalecer procesos académicos",
    "Promover ajustes pedagógicos",
    "Optimizar seguimiento académico",
    "Revisión del logro de resultados"
  ],
  low: [
    "Consolidar estrategias pedagógicas efectivas",
    "Documentar buenas prácticas docentes",
    "Promover transferencia de experiencias exitosas",
    "Reconocer desempeño académico destacado",
    "Fomentar liderazgo académico",
    "Difundir metodologías exitosas",
    "Fortalecer cultura de calidad académica",
    "Sistematizar prácticas pedagógicas",
    "Promover innovación educativa",
    "Reconocer buenas prácticas evaluativas",
    "Mantener seguimiento académico preventivo",
    "Consolidar planificación académica",
    "Promover excelencia docente",
    "Fortalecer prácticas evaluativas",
    "Difundir resultados positivos",
    "Promover mejora continua",
    "Documentar estrategias exitosas",
    "Reconocer buenas prácticas institucionales",
    "Promover mentoría entre pares",
    "Consolidar enfoques metodológicos",
    "Promover innovación curricular",
    "Sistematizar experiencias académicas",
    "Fortalecer liderazgo pedagógico",
    "Difundir experiencias exitosas",
    "Reconocer aportes docentes",
    "Promover prácticas de alto impacto",
    "Consolidar procesos académicos",
    "Fortalecer cultura de evaluación",
    "Promover mejora institucional",
    "Documentar estrategias de éxito",
    "Reconocer excelencia académica",
    "Promover aprendizaje organizacional",
    "Consolidar procesos de enseñanza",
    "Difundir buenas prácticas pedagógicas",
    "Promover innovación metodológica",
    "Reconocer resultados sobresalientes",
    "Fortalecer prácticas docentes",
    "Promover liderazgo académico",
    "Sistematizar experiencias exitosas",
    "Consolidar prácticas evaluativas",
    "Promover calidad académica",
    "Reconocer desempeño destacado",
    "Difundir estrategias efectivas",
    "Promover transferencia de conocimiento",
    "Consolidar cultura académica",
    "Fortalecer procesos formativos",
    "Promover excelencia pedagógica",
    "Documentar experiencias exitosas",
    "Reconocer buenas prácticas docentes",
    "Promover innovación educativa continua",
    "Consolidar logros académicos",
    "Fortalecer prácticas institucionales",
    "Promover liderazgo formativo",
    "Difundir modelos exitosos",
    "Promover calidad educativa",
    "Reconocer prácticas ejemplares",
    "Consolidar desempeño académico",
    "Fortalecer prácticas de evaluación",
    "Promover mejora sostenida",
    "Documentar logros académicos",
    "Reconocer aportes académicos",
    "Promover innovación docente",
    "Consolidar estrategias exitosas",
    "Fortalecer excelencia institucional",
    "Promover aprendizaje continuo",
    "Difundir buenas prácticas evaluativas",
    "Reconocer desempeño sobresaliente",
    "Promover cultura de excelencia",
    "Consolidar procesos exitosos",
    "Fortalecer liderazgo educativo",
    "Promover prácticas pedagógicas innovadoras",
    "Reconocer logros destacados",
    "Difundir resultados exitosos",
    "Promover mejora académica permanente",
    "Consolidar calidad académica",
    "Fortalecer buenas prácticas docentes",
    "Promover innovación institucional",
    "Reconocer excelencia formativa",
    "Consolidar desempeño docente",
    "Fortalecer cultura pedagógica",
    "Promover prácticas de referencia",
    "Difundir experiencias institucionales exitosas",
    "Reconocer impacto académico positivo"
  ],
};
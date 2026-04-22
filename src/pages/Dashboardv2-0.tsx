"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

/* =========================
   ESTILO INSTITUCIONAL
========================= */
const COLORS = {
  primary: "#002E45",
  accent: "#FF6900",
  danger: "#DC2626",
  warning: "#F59E0B",
  muted: "#E5E7EB",
  bg: "#F8FAFC",
};

const CRITICAL_THRESHOLD = 70;

/* =========================
   TIPOS
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
};

type Response = {
  global: number;
  conteo?: number;

  por_componente: Item[];
  por_subcomponente: Item[];
  por_tema: Item[];
  por_asignatura: Item[];

  docentes_por_componente: Record<string, string[]>;
  docentes_por_subcomponente: Record<string, string[]>;
  docentes_por_tema: Record<string, string[]>;
  docentes_por_asignatura: Record<string, string[]>;

  docentes_global_detalle: DocenteDetalle[];
};

type Nivel = "componentes" | "subcomponentes" | "temas";

/* =========================
   UTILS
========================= */
const pct = (n: number) => `${n.toFixed(2)}%`;
const asc = (a: Item[]) => [...a].sort((x, y) => x.promedio - y.promedio);

/* =========================
   DASHBOARD
========================= */
export default function DashboardGerencial() {
  const { versionId } = useParams<{ versionId: string }>();

  /* ---------- estado base ---------- */
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(false);

  /* ---------- navegación / filtros ---------- */
  const [nivel, setNivel] = useState<Nivel>("componentes");
  const [fComponente, setFComponente] = useState<string | null>(null);
  const [fSubcomponente, setFSubcomponente] = useState<string | null>(null);
  const [fTema, setFTema] = useState<string | null>(null);

  const [soloCriticos, setSoloCriticos] = useState(false);

  /* =========================
     CARGA RPC
  ========================= */
  useEffect(() => {
    if (!versionId) return;

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
      .then(({ data }) => setData(data as Response))
      .finally(() => setLoading(false));
  }, [versionId, fComponente, fSubcomponente, fTema]);

  /* =========================
     DERIVADOS (SIEMPRE)
  ========================= */
  const componentes = useMemo(
    () => (data ? asc(data.por_componente) : []),
    [data]
  );
  const subcomponentes = useMemo(
    () => (data ? asc(data.por_subcomponente) : []),
    [data]
  );
  const temas = useMemo(
    () => (data ? asc(data.por_tema) : []),
    [data]
  );
  const asignaturas = useMemo(
    () => (data ? asc(data.por_asignatura) : []),
    [data]
  );

  const universoActual = useMemo(() => {
    if (nivel === "componentes") return componentes;
    if (nivel === "subcomponentes") return subcomponentes;
    return temas;
  }, [nivel, componentes, subcomponentes, temas]);

  const visibles = useMemo(() => {
    return soloCriticos
      ? universoActual.filter(i => i.promedio < CRITICAL_THRESHOLD)
      : universoActual;
  }, [universoActual, soloCriticos]);

  const resumen = useMemo(() => {
    const total = universoActual.length;
    const crit = universoActual.filter(i => i.promedio < CRITICAL_THRESHOLD).length;

    return `En el nivel de ${nivel} se analizan ${total} elementos.
Se identifican ${crit} con desempeño inferior al ${CRITICAL_THRESHOLD}%.`;
  }, [universoActual, nivel]);

  /* =========================
     GUARDS
  ========================= */
  if (loading && !data) return <div className="p-6">Cargando dashboard…</div>;
  if (!data) return <div className="p-6">No existen datos para mostrar.</div>;

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="p-6 space-y-6" style={{ background: COLORS.bg }}>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center">
        <div>
          <div className="text-sm opacity-70">Dashboard Gerencial</div>
          <div className="text-2xl font-bold" style={{ color: COLORS.primary }}>
            Evaluación Académica
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => setSoloCriticos(v => !v)}
        >
          {soloCriticos ? "Ver todos" : "Solo críticos"}
        </Button>
      </div>

      {/* ================= KPIs ================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPI title="Promedio Global" value={pct(data.global)} />
        <KPI title="Componentes" value={componentes.length} />
        <KPI title="Asignaturas" value={asignaturas.length} />
        <KPI title="Docentes" value={data.docentes_global_detalle.length} />
      </div>

      {/* ================= BREADCRUMB ================= */}
      <div className="flex items-center gap-2 text-sm opacity-80">
        <button onClick={() => {
          setNivel("componentes");
          setFComponente(null);
          setFSubcomponente(null);
          setFTema(null);
        }}>
          Componentes
        </button>

        {nivel !== "componentes" && <span>›</span>}

        {nivel !== "componentes" && (
          <button onClick={() => {
            setNivel("subcomponentes");
            setFSubcomponente(null);
            setFTema(null);
          }}>
            Subcomponentes
          </button>
        )}

        {nivel === "temas" && (
          <>
            <span>›</span>
            <span className="font-semibold">Temas</span>
          </>
        )}
      </div>

      {/* ================= CONTENIDO ================= */}
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        {/* ===== NAV ===== */}
        <aside className="space-y-2">
          <NavButton active={nivel==="componentes"} label="Componentes" onClick={() => setNivel("componentes")} />
          <NavButton active={nivel==="subcomponentes"} label="Subcomponentes" onClick={() => setNivel("subcomponentes")} />
          <NavButton active={nivel==="temas"} label="Temas" onClick={() => setNivel("temas")} />
        </aside>

        {/* ===== MAIN ===== */}
        <main className="space-y-6">
          <Card>
            <CardContent className="p-4 italic text-sm opacity-80">
              {resumen}
            </CardContent>
          </Card>

          <Section title={`Desempeño por ${nivel}`}>
            <BarBlock data={visibles} />
            <ListBlock
              data={visibles}
              docentesMap={
                nivel==="componentes"
                  ? data.docentes_por_componente
                  : nivel==="subcomponentes"
                  ? data.docentes_por_subcomponente
                  : data.docentes_por_tema
              }
              onSelect={(id) => {
                if (nivel === "componentes") {
                  setFComponente(id);
                  setNivel("subcomponentes");
                }
                if (nivel === "subcomponentes") {
                  setFSubcomponente(id);
                  setNivel("temas");
                }
                if (nivel === "temas") {
                  setFTema(id);
                }
              }}
            />
          </Section>
        </main>
      </div>

      <FloatingChatGPT
        dashboardContext={resumen}
        rpcSnapshot={data}
      />
    </div>
  );
}

/* =========================
   UI COMPONENTS
========================= */
function KPI({ title, value }: { title: string; value: any }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-sm opacity-70">{title}</div>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function NavButton({
  active,
  label,
  onClick,
}: {
  active?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant={active ? "default" : "outline"}
      className="w-full justify-start"
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">{children}</CardContent>
    </Card>
  );
}

function BarBlock({ data }: { data: Item[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis hide />
        <YAxis hide />
        <Tooltip formatter={(v: number) => pct(v)} />
        <Bar dataKey="promedio" radius={[10, 10, 0, 0]}>
          {data.map(i => (
            <Cell
              key={i.id}
              fill={
                i.promedio < 60
                  ? COLORS.danger
                  : i.promedio < 70
                  ? COLORS.warning
                  : COLORS.primary
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function ListBlock({
  data,
  onSelect,
  docentesMap,
}: {
  data: Item[];
  onSelect: (id: string) => void;
  docentesMap: Record<string, string[]>;
}) {
  const [open, setOpen] = useState<{ id: string; nombre: string } | null>(null);

  return (
    <>
      <div className="space-y-2">
        {data.slice(0, 5).map(i => (
          <div
            key={i.id}
            className="flex justify-between items-center border rounded px-3 py-2 hover:bg-gray-50 cursor-pointer"
            onClick={() => onSelect(i.id)}
          >
            <div>
              <div className="font-medium">{i.nombre}</div>
              <div className="text-xs opacity-70">{pct(i.promedio)}</div>
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setOpen({ id: i.id, nombre: i.nombre });
              }}
            >
              Docentes
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={!!open} onOpenChange={() => setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Docentes — {open?.nombre}</DialogTitle>
          </DialogHeader>
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {(docentesMap[open?.id ?? ""] ?? []).map((d, i) => (
              <li key={i} className="border rounded px-2 py-1">
                {d}
              </li>
            ))}
          </ul>
          <DialogClose asChild>
            <Button variant="outline" className="w-full">
              Cerrar
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  );
}

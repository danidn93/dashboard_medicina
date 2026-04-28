import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import portadaImg from "@/assets/pdf/portada.png?base64";
import curvaImg from "@/assets/pdf/portada_medicina.png?base64";
import footerImg from "@/assets/pdf/footer.png?base64";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  BookOpen,
  Plus,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ReportTreeItemExact } from "@/components/dashboard/ReportTreeItem";
import { generarReportePDF } from "@/lib/pdfGenerator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  X,
  Trophy,
  TrendingDown,
  TrendingUp,
  CircleAlert,
  FileText,
  ChevronRight,
  ClipboardList,
  Users
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardKPIs } from "@/components/dashboard/DashboardKPIs";
import { CriticalAlertSection } from "@/components/dashboard/CriticalAlertSection";
import { LevelTabs, Level } from "@/components/dashboard/LevelTabs";
import { FilterChips, FilterType } from "@/components/dashboard/FilterChips";
import { QuickAccessGrid } from "@/components/dashboard/QuickAccessGrid";

type VersionRow = {
  id: string;
  version_number: number;
  file_name: string | null;
  total_preguntas: number | null;
  total_intentos: number | null;
  created_at: string;
  texto_documento: string | null;
};

type PreguntaRow = {
  id: string;
  numero_pregunta: number;
  pregunta_raw: string;
  enunciado: string | null;
  componente: string | null;
  subcomponente: string | null;
  tema: string | null;
  nivel: string | null;
  docente: string | null;
  justificacion: string | null;
};

type ReportItemType =
  | "TITULO"
  | "SUBTITULO"
  | "PARRAFO"
  | "ARTICULO"
  | "VINETA";

const REPORT_ITEM_TYPE_LABELS: Record<ReportItemType, string> = {
  TITULO: "Título",
  SUBTITULO: "Subtítulo",
  PARRAFO: "Párrafo",
  ARTICULO: "Artículo",
  VINETA: "Viñeta",
};

type ReportItem = {
  id: string;
  tipo: ReportItemType;
  parent_id: string | null;
  orden: number;
  titulo: string;
  contenido: string;
  children?: ReportItem[];
};

type ReportItemsPayload = {
  items: ReportItem[];
};

type PreguntaOpcionRow = {
  id: string;
  pregunta_id: string;
  orden: number;
  texto: string;
  es_correcta: boolean;
};

type IntentoRow = {
  id: string;
  apellidos: string;
  nombres: string;
  correo: string | null;
  estado: string | null;
  comenzado_el: string | null;
  finalizado_el: string | null;
  tiempo_requerido_texto: string | null;
  tiempo_requerido_segundos?: number | null;
  calificacion_total: number | null;
  nivel: string | null;
};

type RespuestaRow = {
  id: string;
  intento_id: string;
  pregunta_id: string;
  opcion_id?: string | null;
  es_correcta: boolean | null;
  puntaje_obtenido: number;
  respuesta_estudiante_raw: string | null;
  respuesta_estudiante_normalizada?: string | null;
};

type DashboardItem = {
  id: string;
  nombre: string;
  promedio: number;
  componente_id?: string;
  subcomponente_id?: string;
  totalRespuestas: number;
  totalAciertos: number;
};

type SidebarItemBase = {
  id: string;
  primary: string;
  secondary?: string;
  badge?: string;
  meta?: string;
  badgeClassName?: string;
  itemClassName?: string;
};

type SidebarItem =
  | (SidebarItemBase & {
      type: "student";
    })
  | (SidebarItemBase & {
      type: "question";
    })
  | (SidebarItemBase & {
      type: "answer";
      correctAnswer?: string;
    });

type SidebarState = {
  open: boolean;
  title: string;
  subtitle?: string;
  items: SidebarItem[];
};

type LegacyDashboardData = {
  periodo_detectado: string;
  global: number;
  porcentaje_aprobados: number;
  numero_estudiantes: number;
  total_inscritos: number;
  inscritos_primera_vez: number;
  inscritos_n_veces: number;
  aprobados_primera_vez: number;
  aprobados_n_veces: number;
  ausentes_primera_vez: number;
  ausentes_n_veces: number;
  por_componente: DashboardItem[];
  por_subcomponente: DashboardItem[];
  por_tema: DashboardItem[];
  docentes_por_componente: Record<string, string[]>;
  docentes_por_subcomponente: Record<string, string[]>;
  docentes_por_tema: Record<string, string[]>;
  asignaturas_detalle: any[];
  conteo: {
    preguntas: number;
    intentos: number;
    respuestas: number;
  };
  por_asignatura: any[];
  docentes_global_detalle: any[];
};

const PASS_SCORE = 70;
const PAGE_SIZE = 1000;

const RANGE_COLORS: Record<string, string> = {
  "0-49": "#B42318",
  "50-69": "#F79009",
  "70-84": "#264763",
  "85-100": "#067647",
  "Sin nota": "#98A2B3",
};

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((acc, n) => acc + n, 0) / values.length;
}

function percent(part: number, total: number) {
  if (!total) return 0;
  return (part / total) * 100;
}

function safeName(value: string | null | undefined, fallback: string) {
  return value?.trim() || fallback;
}

function truncate(text: string | null | undefined, max = 180) {
  const t = String(text ?? "");
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function getScoreRangeLabel(score: number | null | undefined) {
  if (score == null || Number.isNaN(Number(score))) return "Sin nota";
  if (score < 50) return "0-49";
  if (score < 70) return "50-69";
  if (score < 85) return "70-84";
  return "85-100";
}

async function fetchAllRows<T>(
  fetchPage: (from: number, to: number) => Promise<T[]>
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;

  while (true) {
    const page = await fetchPage(from, from + PAGE_SIZE - 1);
    all.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return all;
}

function buildTree(items: ReportItem[]): ReportItem[] {
  const map = new Map<string, ReportItem>();
  const roots: ReportItem[] = [];

  items.forEach((item) => {
    map.set(item.id, { ...item, children: [] });
  });

  items.forEach((item) => {
    const node = map.get(item.id)!;
    if (item.parent_id && map.has(item.parent_id)) {
      map.get(item.parent_id)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortChildren = (nodes: ReportItem[]) => {
    nodes.sort((a, b) => a.orden - b.orden);
    nodes.forEach((n) => n.children && sortChildren(n.children!));
  };

  sortChildren(roots);

  return roots;
}

function aggregateByLevel(
  level: Level,
  preguntas: PreguntaRow[],
  respuestas: RespuestaRow[]
): DashboardItem[] {
  const questionMap = new Map(preguntas.map((p) => [p.id, p]));
  const grouped = new Map<string, DashboardItem>();

  for (const r of respuestas) {
    const pregunta = questionMap.get(r.pregunta_id);
    if (!pregunta) continue;

    const componente = safeName(pregunta.componente, "Sin componente");
    const subcomponente = safeName(
      pregunta.subcomponente,
      "Sin subcomponente"
    );
    const tema = safeName(pregunta.tema, "Sin tema");

    const key =
      level === "componentes"
        ? componente
        : level === "subcomponentes"
          ? `${componente}|||${subcomponente}`
          : `${componente}|||${subcomponente}|||${tema}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        id: key,
        nombre:
          level === "componentes"
            ? componente
            : level === "subcomponentes"
              ? subcomponente
              : tema,
        promedio: 0,
        componente_id: componente,
        subcomponente_id:
          level === "componentes" ? undefined : subcomponente,
        totalRespuestas: 0,
        totalAciertos: 0,
      });
    }

    const item = grouped.get(key)!;
    item.totalRespuestas += 1;
    if (r.es_correcta === true) item.totalAciertos += 1;
  }

  return Array.from(grouped.values())
    .map((item) => ({
      ...item,
      promedio: percent(item.totalAciertos, item.totalRespuestas),
    }))
    .sort((a, b) => a.promedio - b.promedio);
}

function getUniqueCatalogValues(
  preguntas: PreguntaRow[],
  field: "componente" | "subcomponente" | "tema"
) {
  const set = new Set<string>();

  for (const pregunta of preguntas) {
    const value = safeName(pregunta[field], "");
    if (value) set.add(value);
  }

  return Array.from(set);
}

function getAsignaturasDetalle(preguntas: PreguntaRow[]) {
  const map = new Map<string, { nombre: string; docentes: string[] }>();

  for (const pregunta of preguntas) {
    const asignatura = safeName(pregunta.nivel, "");
    if (!asignatura) continue;

    if (!map.has(asignatura)) {
      map.set(asignatura, {
        nombre: asignatura,
        docentes: [],
      });
    }

    const docente = safeName(pregunta.docente, "");
    if (docente) {
      const actual = map.get(asignatura)!;
      if (!actual.docentes.includes(docente)) {
        actual.docentes.push(docente);
      }
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
  );
}

function getDocentesGlobalDetalle(preguntas: PreguntaRow[]) {
  const set = new Set<string>();

  for (const pregunta of preguntas) {
    const docente = safeName(pregunta.docente, "");
    if (docente) set.add(docente);
  }

  return Array.from(set)
    .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }))
    .map((docente) => ({ docente }));
}

function HeaderActions({
  title,
  subtitle,
  versionLabel,
  onBack,
  onGeneratePdf,
}: {
  title: string;
  subtitle: string;
  versionLabel: string;
  onBack: () => void;
  onGeneratePdf?: () => void;
}) {
  return (
    <div className="border-b bg-white">
      <div className="container mx-auto px-4 py-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>

              <h1 className="text-2xl font-bold text-[#002E45]">{title}</h1>

              <Badge>{versionLabel}</Badge>
            </div>

            <p className="text-sm text-[#222223]/70">{subtitle}</p>
          </div>

          {onGeneratePdf && (
            <Button
              className="bg-[#002E45] text-white hover:bg-[#001f31]"
              onClick={onGeneratePdf}
            >
              <FileText className="mr-2 h-4 w-4" />
              Generar informe PDF
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function DistributionCard({
  intentos,
  onOpenRange,
}: {
  intentos: IntentoRow[];
  onOpenRange: (range: string) => void;
}) {
  const distribution = useMemo(() => {
    const base = {
      "0-49": 0,
      "50-69": 0,
      "70-84": 0,
      "85-100": 0,
      "Sin nota": 0,
    };

    for (const intento of intentos) {
      const range = getScoreRangeLabel(intento.calificacion_total);
      base[range as keyof typeof base] += 1;
    }

    return Object.entries(base).map(([name, value]) => ({
      name,
      value,
      percent: percent(value, intentos.length),
      color: RANGE_COLORS[name],
    }));
  }, [intentos]);

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-[#002E45] flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Distribución de calificaciones
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="w-full h-12 rounded-full overflow-hidden border flex">
          {distribution.map((item) => (
            <button
              key={item.name}
              onClick={() => onOpenRange(item.name)}
              title={`${item.name}: ${item.value}`}
              className="h-full transition-opacity hover:opacity-80"
              style={{
                width: `${item.percent}%`,
                background: item.color,
                minWidth: item.value > 0 ? "10px" : "0px",
              }}
            />
          ))}
        </div>
        
        <div className="space-y-3">
          {/* Header */}
          <div className="grid grid-cols-[1fr_140px_120px] items-center px-6 text-sm font-semibold text-slate-600">
            <span>Rango</span>
            <span className="text-right">Porcentaje</span>
            <span className="text-right">Estudiantes</span>
          </div>

          {distribution.map((item) => (
            <button
              key={item.name}
              onClick={() => onOpenRange(item.name)}
              className="w-full grid grid-cols-[1fr_140px_120px] items-center rounded-lg border p-3 bg-white hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ background: item.color }}
                />
                <span className="text-[#002E45]">{item.name}</span>
              </div>

              <span className="text-sm text-slate-500 text-right">
                {item.percent.toFixed(1)}%
              </span>

              <div className="flex justify-end">
                <Badge variant="outline">{item.value}</Badge>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ComponentBarChart({
  items,
  onClickItem,
}: {
  items: DashboardItem[];
  onClickItem: (item: DashboardItem) => void;
}) {
  const sortedItems = useMemo(
    () => [...items].sort((a, b) => b.promedio - a.promedio),
    [items]
  );

  function getPerformanceColor(value: number) {
    const v = Math.max(0, Math.min(100, value));

    // 0%   -> rojo fuerte
    // 30%  -> rojo visible
    // 50%  -> naranja/amarillo
    // 70%  -> verde perceptible
    // 100% -> verde fuerte

    if (v <= 30) {
      // rojo oscuro -> rojo
      const t = v / 30;
      const r = Math.round(180 + (220 - 180) * t);
      const g = Math.round(35 + (65 - 35) * t);
      const b = Math.round(24 + (50 - 24) * t);
      return `rgb(${r}, ${g}, ${b})`;
    }

    if (v <= 50) {
      // rojo -> naranja
      const t = (v - 30) / 20;
      const r = Math.round(220 + (247 - 220) * t);
      const g = Math.round(65 + (144 - 65) * t);
      const b = Math.round(50 + (9 - 50) * t);
      return `rgb(${r}, ${g}, ${b})`;
    }

    if (v <= 70) {
      // naranja -> verde medio
      const t = (v - 50) / 20;
      const r = Math.round(247 + (56 - 247) * t);
      const g = Math.round(144 + (142 - 144) * t);
      const b = Math.round(9 + (60 - 9) * t);
      return `rgb(${r}, ${g}, ${b})`;
    }

    // 70 a 100: verde medio -> verde fuerte
    const t = (v - 70) / 30;
    const r = Math.round(56 + (6 - 56) * t);
    const g = Math.round(142 + (118 - 142) * t);
    const b = Math.round(60 + (71 - 60) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-[#002E45] flex items-center gap-2">
          <Users className="h-5 w-5" />
          Rendimiento por componente
        </CardTitle>
      </CardHeader>

      <CardContent>
        {sortedItems.length === 0 ? (
          <p className="text-sm text-slate-500">No hay componentes para mostrar.</p>
        ) : (
          <div className="space-y-6">
            <div className="h-[420px] w-full">
              <div className="h-full flex items-end gap-4">
                {sortedItems.map((item, index) => {
                  const color = getPerformanceColor(item.promedio);

                  return (
                    <button
                      key={item.id}
                      onClick={() => onClickItem(item)}
                      className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-3"
                      title={`${item.nombre} - ${item.promedio.toFixed(2)}%`}
                    >
                      <div className="text-center">
                        <div className="inline-flex rounded-full bg-[#143a52] px-3 py-1 text-sm font-semibold text-white">
                          {item.promedio.toFixed(2)}%
                        </div>
                      </div>

                      <div className="relative flex h-[300px] w-full items-end rounded-xl border border-slate-200 bg-slate-100 p-2 overflow-hidden">
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute bottom-1/4 left-0 right-0 border-t border-slate-200" />
                          <div className="absolute bottom-2/4 left-0 right-0 border-t border-slate-200" />
                          <div className="absolute bottom-3/4 left-0 right-0 border-t border-slate-200" />
                        </div>

                        <div
                          className="relative w-full rounded-lg transition-all duration-300 group-hover:opacity-90"
                          style={{
                            height: `${item.promedio}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>

                      <div className="w-full text-center space-y-1 px-1">
                        <p className="line-clamp-2 text-sm font-semibold text-[#002E45] break-words">
                          {item.nombre}
                        </p>
                        <p className="text-xs text-slate-500">
                          Respuestas: {item.totalRespuestas}
                        </p>
                        <p className="text-xs text-slate-500">
                          Aciertos: {item.totalAciertos}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RankingCard({
  title,
  icon,
  items,
  variant = "default",
  onClickStudent,
}: {
  title: string;
  icon: ReactNode;
  items: IntentoRow[];
  variant?: "default" | "destructive";
  onClickStudent: (student: IntentoRow) => void;
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#002E45]">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">
            No hay estudiantes con calificación disponible.
          </p>
        ) : (
          items.slice(0, 5).map((item, index) => (
            <button
              key={item.id}
              onClick={() => onClickStudent(item)}
              className="w-full text-left flex items-center justify-between rounded-xl border p-3 bg-white hover:bg-slate-50"
            >
              <div>
                <p className="font-medium text-[#002E45]">
                  {index + 1}. {item.apellidos} {item.nombres}
                </p>
                <p className="text-sm text-slate-500">
                  {item.correo || "Sin correo"}
                </p>
              </div>
              <Badge variant={variant}>
                {(item.calificacion_total ?? 0).toFixed(2)}
              </Badge>
            </button>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function QuestionsCard({
  title,
  icon,
  items,
  badgeVariant,
  onClickQuestion,
}: {
  title: string;
  icon: ReactNode;
  items: Array<{
    pregunta: PreguntaRow;
    total: number;
    aciertos: number;
    porcentaje: number;
  }>;
  badgeVariant?: "default" | "destructive";
  onClickQuestion: (item: {
    pregunta: PreguntaRow;
    total: number;
    aciertos: number;
    porcentaje: number;
  }) => void;
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#002E45]">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">
            No hay suficientes datos para mostrar.
          </p>
        ) : (
          items.slice(0, 5).map((item) => (
            <button
              key={item.pregunta.id}
              onClick={() => onClickQuestion(item)}
              className="w-full text-left rounded-xl border p-3 bg-white hover:bg-slate-50"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="font-medium text-[#002E45]">
                  Pregunta {item.pregunta.numero_pregunta}
                </p>
                <Badge variant={badgeVariant}>
                  {item.porcentaje.toFixed(2)}%
                </Badge>
              </div>
              <p className="text-sm text-slate-500 mt-2 line-clamp-3">
                {item.pregunta.enunciado || item.pregunta.pregunta_raw}
              </p>
            </button>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function SidebarPanel({
  sidebar,
  onClose,
}: {
  sidebar: SidebarState;
  onClose: () => void;
}) {
  if (!sidebar.open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <aside className="fixed top-0 right-0 h-full w-full max-w-xl bg-white shadow-2xl z-50 flex flex-col">
        <div className="border-b px-5 py-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#002E45]">
              {sidebar.title}
            </h2>
            {sidebar.subtitle && (
              <p className="text-sm mt-1 text-slate-500">
                {sidebar.subtitle}
              </p>
            )}
          </div>

          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {sidebar.items.length === 0 ? (
            <p className="text-sm text-slate-500">
              No hay elementos para mostrar.
            </p>
          ) : (
            sidebar.items.map((item) => (
              <div
                key={item.id}
                className={`rounded-xl border p-4 bg-white ${item.itemClassName ?? ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold break-words text-[#002E45]">
                      {item.primary}
                    </p>

                    {item.secondary && (
                      <p className="text-sm text-slate-500 mt-1 break-words">
                        {item.secondary}
                      </p>
                    )}

                    {item.meta && (
                      <p className="text-xs mt-2 text-[#264763]">{item.meta}</p>
                    )}

                    {"correctAnswer" in item && item.correctAnswer && (
                      <p className="text-xs mt-2 font-medium text-[#067647]">
                        {item.correctAnswer}
                      </p>
                    )}
                  </div>

                  {item.badge && (
                    <Badge className={item.badgeClassName}>
                      {item.badge}
                    </Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}

function AsignaturasDocentesCard({
  items,
}: {
  items: Array<{
    asignatura: string;
    docentes: string[];
    totalPreguntas: number;
    totalRespuestas: number;
    totalAciertos: number;
    aprobacion: number;
  }>;
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-[#002E45] flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Asignaturas, docentes y aprobación
        </CardTitle>
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">
            No hay asignaturas o docentes registrados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b bg-slate-50 text-[#002E45]">
                  <th className="text-left p-3 font-semibold">Asignatura</th>
                  <th className="text-left p-3 font-semibold">Docente(s)</th>
                  <th className="text-right p-3 font-semibold">Preguntas</th>
                  <th className="text-right p-3 font-semibold">Aciertos</th>
                  <th className="text-right p-3 font-semibold">Respuestas</th>
                  <th className="text-right p-3 font-semibold">Aprobación</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr key={item.asignatura} className="border-b last:border-0">
                    <td className="p-3 font-medium text-[#002E45]">
                      {item.asignatura}
                    </td>

                    <td className="p-3 text-slate-600">
                      {item.docentes.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {item.docentes.map((docente) => (
                            <Badge key={docente} variant="outline">
                              {docente}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">Sin docente</span>
                      )}
                    </td>

                    <td className="p-3 text-right">
                      <Badge variant="outline">{item.totalPreguntas}</Badge>
                    </td>

                    <td className="p-3 text-right">
                      <Badge variant="outline">{item.totalAciertos}</Badge>
                    </td>

                    <td className="p-3 text-right">
                      <Badge variant="outline">{item.totalRespuestas}</Badge>
                    </td>

                    <td className="p-3 text-right">
                      <Badge
                        className={
                          item.aprobacion < 60
                            ? "bg-[#B42318] text-white hover:bg-[#B42318]"
                            : item.aprobacion < 70
                              ? "bg-[#F79009] text-white hover:bg-[#F79009]"
                              : "bg-[#067647] text-white hover:bg-[#067647]"
                        }
                      >
                        {item.aprobacion.toFixed(2)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DashboardGerencialProps {
  forcePublic?: boolean;
  versionIdOverride?: string;
}

const obtenerConclusionesYRecomendaciones = async (versionId: string) => {
  const { data, error } = await supabase.functions.invoke(
    "generar-conclusiones-recomendaciones",
    {
      body: { versionId },
    }
  );

  if (error) {
    throw error;
  }

  return {
    conclusiones: Array.isArray(data?.conclusiones) ? data.conclusiones : [],
    recomendaciones: Array.isArray(data?.recomendaciones) ? data.recomendaciones : [],
  };
};

type PdfBlock =
  | { type: "paragraph"; text: string }
  | { type: "subtitle"; text: string }
  | { type: "bullet"; text: string }
  | { type: "article"; text: string };

type PdfSection = {
  title: string;
  blocks: PdfBlock[];
};

function flattenReportTreeToBlocks(nodes: ReportItem[]): PdfBlock[] {
  const blocks: PdfBlock[] = [];

  const walk = (items: ReportItem[]) => {
    for (const item of items) {
      const titulo = String(item.titulo ?? "").trim();
      const contenido = String(item.contenido ?? "").trim();

      if (item.tipo === "TITULO") {
        if (titulo) blocks.push({ type: "subtitle", text: titulo });
        if (item.children?.length) walk(item.children);
        continue;
      }

      if (item.tipo === "SUBTITULO") {
        if (titulo) blocks.push({ type: "subtitle", text: titulo });
        if (item.children?.length) walk(item.children);
        continue;
      }

      if (item.tipo === "PARRAFO") {
        if (contenido) blocks.push({ type: "paragraph", text: contenido });
        if (item.children?.length) walk(item.children);
        continue;
      }

      if (item.tipo === "ARTICULO") {
        if (contenido) blocks.push({ type: "article", text: contenido });
        if (item.children?.length) walk(item.children);
        continue;
      }

      if (item.tipo === "VINETA") {
        if (contenido) blocks.push({ type: "bullet", text: contenido });
        if (item.children?.length) walk(item.children);
      }
    }
  };

  walk(nodes);
  return blocks;
}

function treeToPdfSections(tree: ReportItem[]) {
  const rootTitles = tree.filter((item) => item.tipo === "TITULO");

  const fallbackSection = (title: string, blocks: PdfBlock[]): PdfSection | undefined =>
    blocks.length ? { title, blocks } : undefined;

  return {
    introduccionPersonalizada: fallbackSection(
      rootTitles[0]?.titulo || "Introducción",
      rootTitles[0]?.children ? flattenReportTreeToBlocks(rootTitles[0].children) : []
    ),
    antecedentesPersonalizados: fallbackSection(
      rootTitles[1]?.titulo || "Antecedentes",
      rootTitles[1]?.children ? flattenReportTreeToBlocks(rootTitles[1].children) : []
    ),
    motivacionJuridicaPersonalizada: fallbackSection(
      rootTitles[2]?.titulo || "Motivación Jurídica",
      rootTitles[2]?.children ? flattenReportTreeToBlocks(rootTitles[2].children) : []
    ),
    metodologiaPersonalizada: fallbackSection(
      rootTitles[3]?.titulo || "Metodología",
      rootTitles[3]?.children ? flattenReportTreeToBlocks(rootTitles[3].children) : []
    ),
  };
}

export default function DashboardGerencial({
  forcePublic = false,
  versionIdOverride,
}: DashboardGerencialProps) {
  const navigate = useNavigate();
  const params = useParams<{ versionId: string }>();
  const versionId = versionIdOverride ?? params.versionId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [version, setVersion] = useState<VersionRow | null>(null);
  const [preguntas, setPreguntas] = useState<PreguntaRow[]>([]);
  const [opciones, setOpciones] = useState<PreguntaOpcionRow[]>([]);
  const [intentos, setIntentos] = useState<IntentoRow[]>([]);
  const [respuestas, setRespuestas] = useState<RespuestaRow[]>([]);

  const [level, setLevel] = useState<Level>("componentes");
  const [filter, setFilter] = useState<FilterType>("todos");
  const [nivelFilter, setNivelFilter] = useState<string>("todos");

  const [componenteId, setComponenteId] = useState<string | undefined>();
  const [subcomponenteId, setSubcomponenteId] = useState<string | undefined>();

  const [selectedItem, setSelectedItem] = useState<DashboardItem | null>(null);
  const [sidebar, setSidebar] = useState<SidebarState>({
    open: false,
    title: "",
    items: [],
  });
  const [showPdfModal, setShowPdfModal] = useState(false);

  const [showShareModal, setShowShareModal] = useState(false);

  const [reportItems, setReportItems] = useState<ReportItem[]>([]);

  const [addRootOpen, setAddRootOpen] = useState(false);
  const [newRootType, setNewRootType] = useState<ReportItemType>("TITULO");
  const [newRootQuantity, setNewRootQuantity] = useState(1);

  const reportTree = useMemo(() => buildTree(reportItems), [reportItems]);

  const handleAddChildToTree = (
    parentId: string,
    tipo: ReportItemType,
    cantidad: number = 1
  ) => {
    const maxOrden = reportItems
      .filter((i) => i.parent_id === parentId)
      .reduce((max, i) => Math.max(max, i.orden), 0);

    const count = tipo === "PARRAFO" ? 1 : Math.max(1, Math.min(50, cantidad));

    const nuevos: ReportItem[] = Array.from({ length: count }, (_, i) => ({
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}-${i}`,
      tipo,
      parent_id: parentId,
      orden: maxOrden + 1 + i,
      titulo: "",
      contenido: "",
    }));

    setReportItems((prev) => [...prev, ...nuevos]);
  };

  const handleAddRootNodes = () => {
    const maxOrden = reportItems
      .filter((i) => !i.parent_id)
      .reduce((max, i) => Math.max(max, i.orden), 0);

    const count = Math.max(1, Math.min(50, newRootQuantity));

    const nuevos: ReportItem[] = Array.from({ length: count }, (_, i) => ({
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}-${i}`,
      tipo: newRootType,
      parent_id: null,
      orden: maxOrden + 1 + i,
      titulo: "",
      contenido: "",
    }));

    setReportItems((prev) => [...prev, ...nuevos]);
    setAddRootOpen(false);
    setNewRootQuantity(1);
  };

  const handleUpdateReportItem = (
    itemId: string,
    data: Partial<ReportItem>
  ) => {
    setReportItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, ...data } : item))
    );
  };

  const handleDeleteReportItem = (itemId: string) => {
    const collectChildrenIds = (items: ReportItem[], parentId: string): string[] => {
      const direct = items.filter((i) => i.parent_id === parentId).map((i) => i.id);
      return direct.flatMap((id) => [id, ...collectChildrenIds(items, id)]);
    };

    const childrenIds = collectChildrenIds(reportItems, itemId);
    const idsToDelete = new Set([itemId, ...childrenIds]);

    setReportItems((prev) => prev.filter((item) => !idsToDelete.has(item.id)));
  };

  const handleMoveReportItem = (
    draggedId: string,
    targetId: string,
    position: "before" | "after" | "inside"
  ) => {
    const dragged = reportItems.find((i) => i.id === draggedId);
    const target = reportItems.find((i) => i.id === targetId);
    if (!dragged || !target) return;

    let newParentId: string | null;
    let siblings: ReportItem[];

    if (position === "inside") {
      newParentId = targetId;
      siblings = reportItems.filter((i) => i.parent_id === targetId && i.id !== draggedId);
    } else {
      newParentId = target.parent_id;
      siblings = reportItems.filter(
        (i) => i.parent_id === target.parent_id && i.id !== draggedId
      );
    }

    const targetIndex = siblings.findIndex((i) => i.id === targetId);
    const insertAt =
      position === "before"
        ? targetIndex
        : position === "after"
          ? targetIndex + 1
          : siblings.length;

    const reordered = [...siblings];
    const draggedUpdated = { ...dragged, parent_id: newParentId };
    reordered.splice(Math.max(0, insertAt), 0, draggedUpdated);

    const reorderedIds = new Map(
      reordered.map((item, idx) => [item.id, idx + 1])
    );

    setReportItems((prev) =>
      prev.map((item) => {
        if (item.id === draggedId) {
          return {
            ...item,
            parent_id: newParentId,
            orden: reorderedIds.get(item.id) ?? item.orden,
          };
        }

        if (item.parent_id === newParentId && reorderedIds.has(item.id)) {
          return {
            ...item,
            orden: reorderedIds.get(item.id) ?? item.orden,
          };
        }

        return item;
      })
    );
  };

  const saveTextoDocumento = async (payload?: ReportItemsPayload) => {
    if (!versionId) return;

    const dataToSave: ReportItemsPayload = payload ?? { items: reportItems };

    const { error } = await supabase
      .from("exam_dataset_versions")
      .update({
        texto_documento: JSON.stringify(dataToSave),
      })
      .eq("id", versionId);

    if (error) throw error;
  };

  const handleGeneratePublicLink = () => {
    setShowShareModal(true);
  };

  const openTopStudentsByComponent = (item: DashboardItem) => {
    const items = buildTopStudentsByComponent(item.nombre);

    setSidebar({
      open: true,
      title: `Mejores estudiantes en ${item.nombre}`,
      subtitle: `${items.length} estudiante(s) con respuestas en este componente`,
      items,
    });
  };
  useEffect(() => {
    if (!versionId) return;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: versionData, error: versionError } = await supabase
          .from("exam_dataset_versions")
          .select(
            "id, version_number, file_name, total_preguntas, total_intentos, created_at, texto_documento"
          )
          .eq("id", versionId)
          .single();

        if (versionError) throw versionError;
        setVersion(versionData);

        if (versionData?.texto_documento) {
          try {
            const parsed = JSON.parse(versionData.texto_documento) as Partial<ReportItemsPayload>;

            if (Array.isArray(parsed?.items)) {
              const normalized: ReportItem[] = parsed.items.map((item, index) => ({
                id: item.id || `${Date.now()}-${index}`,
                tipo: item.tipo as ReportItemType,
                parent_id: item.parent_id ?? null,
                orden: typeof item.orden === "number" ? item.orden : index + 1,
                titulo: item.titulo ?? "",
                contenido: item.contenido ?? "",
              }));

              setReportItems(normalized);
            } else {
              setReportItems([]);
            }
          } catch (err) {
            console.error("Error parseando texto_documento:", err);
            setReportItems([]);
          }
        } else {
          setReportItems([]);
        }

        const preguntasAll = await fetchAllRows<PreguntaRow>(
          async (from, to) => {
            const { data, error } = await supabase
              .from("preguntas")
              .select(
                "id, numero_pregunta, pregunta_raw, enunciado, componente, subcomponente, tema, nivel, docente, justificacion"
              )
              .eq("version_id", versionId)
              .order("numero_pregunta", { ascending: true })
              .range(from, to);

            if (error) throw error;
            return (data || []) as PreguntaRow[];
          }
        );

        setPreguntas(preguntasAll);

        if (preguntasAll.length) {
          const preguntaIds = preguntasAll.map((p) => p.id);

          const { data: opcionesData, error: opcionesError } = await supabase
            .from("pregunta_opciones")
            .select("id, pregunta_id, orden, texto, es_correcta")
            .in("pregunta_id", preguntaIds)
            .order("orden", { ascending: true });

          if (opcionesError) throw opcionesError;
          setOpciones((opcionesData || []) as PreguntaOpcionRow[]);
        } else {
          setOpciones([]);
        }

        const intentosAll = await fetchAllRows<IntentoRow>(
          async (from, to) => {
            const { data, error } = await supabase
              .from("intentos")
              .select(
                "id, apellidos, nombres, correo, estado, comenzado_el, finalizado_el, tiempo_requerido_texto, tiempo_requerido_segundos, calificacion_total, nivel"
              )
              .eq("version_id", versionId)
              .range(from, to);

            if (error) throw error;
            return (data || []) as IntentoRow[];
          }
        );

        setIntentos(intentosAll);

        if (!intentosAll.length) {
          setRespuestas([]);
          return;
        }

        const intentoIds = intentosAll.map((i) => i.id);

        const chunkArray = <T,>(array: T[], size: number): T[][] => {
          const chunks: T[][] = [];

          for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
          }

          return chunks;
        };

        const respuestasAll: RespuestaRow[] = [];

        for (const chunk of chunkArray(intentoIds, 100)) {
          const respuestasChunk = await fetchAllRows<RespuestaRow>(
            async (from, to) => {
              const { data, error } = await supabase
                .from("intento_respuestas")
                .select(
                  "id, intento_id, pregunta_id, opcion_id, es_correcta, puntaje_obtenido, respuesta_estudiante_raw, respuesta_estudiante_normalizada"
                )
                .in("intento_id", chunk)
                .order("intento_id", { ascending: true })
                .order("pregunta_id", { ascending: true })
                .range(from, to);

              if (error) throw error;

              return (data || []) as RespuestaRow[];
            }
          );

          respuestasAll.push(...respuestasChunk);
        }

        setRespuestas(respuestasAll);
      } catch (e: any) {
        console.error(e);
        setError(e?.message || "No se pudo cargar el dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [versionId]);

  const preguntasMap = useMemo(
    () => new Map(preguntas.map((p) => [p.id, p])),
    [preguntas]
  );

  const intentosMap = useMemo(
    () => new Map(intentos.map((i) => [i.id, i])),
    [intentos]
  );

  const nivelesDisponibles = useMemo(() => {
    const set = new Set<string>();

    for (const intento of intentos) {
      const nivel = safeName(intento.nivel, "");
      if (nivel) set.add(nivel);
    }

    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" })
    );
  }, [intentos]);

  const intentosFiltrados = useMemo(() => {
    if (nivelFilter === "todos") return intentos;

    return intentos.filter(
      (intento) => safeName(intento.nivel, "Sin nivel") === nivelFilter
    );
  }, [intentos, nivelFilter]);

  const intentoIdsFiltrados = useMemo(
    () => new Set(intentosFiltrados.map((i) => i.id)),
    [intentosFiltrados]
  );

  const respuestasFiltradas = useMemo(() => {
    if (nivelFilter === "todos") return respuestas;

    return respuestas.filter((respuesta) =>
      intentoIdsFiltrados.has(respuesta.intento_id)
    );
  }, [respuestas, intentoIdsFiltrados, nivelFilter]);

  const preguntaIdsConRespuestasFiltradas = useMemo(
    () => new Set(respuestasFiltradas.map((r) => r.pregunta_id)),
    [respuestasFiltradas]
  );

  const preguntasFiltradas = useMemo(() => {
    if (nivelFilter === "todos") return preguntas;

    return preguntas.filter((pregunta) =>
      preguntaIdsConRespuestasFiltradas.has(pregunta.id)
    );
  }, [preguntas, preguntaIdsConRespuestasFiltradas, nivelFilter]);

  const asignaturasDocentes = useMemo(() => {
    const preguntasMapLocal = new Map(preguntasFiltradas.map((p) => [p.id, p]));

    const map = new Map<
      string,
      {
        asignatura: string;
        docentes: Set<string>;
        totalPreguntas: Set<string>;
        totalRespuestas: number;
        totalAciertos: number;
      }
    >();

    for (const pregunta of preguntasFiltradas) {
      const asignatura = safeName(pregunta.nivel, "Sin asignatura");
      const docente = safeName(pregunta.docente, "");

      if (!map.has(asignatura)) {
        map.set(asignatura, {
          asignatura,
          docentes: new Set<string>(),
          totalPreguntas: new Set<string>(),
          totalRespuestas: 0,
          totalAciertos: 0,
        });
      }

      const item = map.get(asignatura)!;
      item.totalPreguntas.add(pregunta.id);

      if (docente) item.docentes.add(docente);
    }

    for (const respuesta of respuestasFiltradas) {
      const pregunta = preguntasMapLocal.get(respuesta.pregunta_id);
      if (!pregunta) continue;

      const asignatura = safeName(pregunta.nivel, "Sin asignatura");
      const item = map.get(asignatura);
      if (!item) continue;

      item.totalRespuestas += 1;
      if (respuesta.es_correcta === true) {
        item.totalAciertos += 1;
      }
    }

    return Array.from(map.values())
      .filter((item) => item.totalRespuestas > 0)
      .map((item) => ({
        asignatura: item.asignatura,
        docentes: Array.from(item.docentes).sort((a, b) =>
          a.localeCompare(b, "es", { sensitivity: "base" })
        ),
        totalPreguntas: item.totalPreguntas.size,
        totalRespuestas: item.totalRespuestas,
        totalAciertos: item.totalAciertos,
        aprobacion: percent(item.totalAciertos, item.totalRespuestas),
      }))
      .sort((a, b) => a.aprobacion - b.aprobacion);
  }, [preguntasFiltradas, respuestasFiltradas]);

  const correctOptionMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const op of opciones) {
      if (op.es_correcta) map.set(op.pregunta_id, op.texto);
    }
    return map;
  }, [opciones]);

  const itemsByLevel = useMemo(
    () => ({
      componentes: aggregateByLevel(
        "componentes",
        preguntasFiltradas,
        respuestasFiltradas
      ),
      subcomponentes: aggregateByLevel(
        "subcomponentes",
        preguntasFiltradas,
        respuestasFiltradas
      ),
      temas: aggregateByLevel(
        "temas",
        preguntasFiltradas,
        respuestasFiltradas
      ),
    }),
    [preguntasFiltradas, respuestasFiltradas]
  );

  const currentItems = useMemo(() => {
    let items =
      level === "componentes"
        ? itemsByLevel.componentes
        : level === "subcomponentes"
          ? itemsByLevel.subcomponentes
          : itemsByLevel.temas;

    if (level !== "componentes" && componenteId) {
      items = items.filter((i) => i.componente_id === componenteId);
    }

    if (level === "temas" && subcomponenteId) {
      items = items.filter((i) => i.subcomponente_id === subcomponenteId);
    }

    return [...items].sort((a, b) => a.promedio - b.promedio);
  }, [itemsByLevel, level, componenteId, subcomponenteId]);

  const filteredItems = useMemo(() => {
    if (filter === "todos") return currentItems;
    if (filter === "criticos")
      return currentItems.filter((i) => i.promedio < 60);
    if (filter === "atencion")
      return currentItems.filter(
        (i) => i.promedio >= 60 && i.promedio < 70
      );
    return currentItems.filter((i) => i.promedio >= 70);
  }, [currentItems, filter]);

  const filterCounts = useMemo(
    () => ({
      todos: currentItems.length,
      criticos: currentItems.filter((i) => i.promedio < 60).length,
      atencion: currentItems.filter(
        (i) => i.promedio >= 60 && i.promedio < 70
      ).length,
      optimos: currentItems.filter((i) => i.promedio >= 70).length,
    }),
    [currentItems]
  );

  const preguntasStats = useMemo(() => {
    const grouped = new Map<
      string,
      { pregunta: PreguntaRow; total: number; aciertos: number }
    >();

    const preguntasFiltradasMap = new Map(
      preguntasFiltradas.map((p) => [p.id, p])
    );

    for (const r of respuestasFiltradas) {
      const pregunta = preguntasFiltradasMap.get(r.pregunta_id);
      if (!pregunta) continue;

      if (!grouped.has(pregunta.id)) {
        grouped.set(pregunta.id, {
          pregunta,
          total: 0,
          aciertos: 0,
        });
      }

      const item = grouped.get(pregunta.id)!;
      item.total += 1;
      if (r.es_correcta === true) item.aciertos += 1;
    }

    return Array.from(grouped.values()).map((item) => ({
      ...item,
      porcentaje: percent(item.aciertos, item.total),
    }));
  }, [preguntasFiltradas, respuestasFiltradas]);

  const preguntasDificiles = useMemo(
    () =>
      [...preguntasStats]
        .sort((a, b) => a.porcentaje - b.porcentaje)
        .slice(0, 10),
    [preguntasStats]
  );

  const preguntasFaciles = useMemo(
    () =>
      [...preguntasStats]
        .sort((a, b) => b.porcentaje - a.porcentaje)
        .slice(0, 10),
    [preguntasStats]
  );

  const topEstudiantes = useMemo(
    () =>
      [...intentosFiltrados]
        .filter((i) => i.calificacion_total != null)
        .sort(
          (a, b) => (b.calificacion_total ?? 0) - (a.calificacion_total ?? 0)
        )
        .slice(0, 10),
    [intentosFiltrados]
  );

  const peoresEstudiantes = useMemo(
    () =>
      [...intentosFiltrados]
        .filter((i) => i.calificacion_total != null)
        .sort(
          (a, b) =>
            (a.calificacion_total ?? 9999) - (b.calificacion_total ?? 9999)
        )
        .slice(0, 10),
    [intentosFiltrados]
  );

  const statsRespuestas = useMemo(() => {
    const total = respuestasFiltradas.length;
    const correctas = respuestasFiltradas.filter(
      (r) => r.es_correcta === true
    ).length;
    const incorrectas = respuestasFiltradas.filter(
      (r) => r.es_correcta === false
    ).length;
    const nulas = respuestasFiltradas.filter((r) => r.es_correcta == null).length;
    const conOpcion = respuestasFiltradas.filter((r) => !!r.opcion_id).length;

    return { total, correctas, incorrectas, nulas, conOpcion };
  }, [respuestasFiltradas]);

  const diagnosticoProcesamiento = useMemo(() => {
    const preguntasReales = new Set(
      respuestasFiltradas.map((r) => r.pregunta_id)
    );

    const totalPreguntas = preguntasReales.size;

    const estudiantesConRespuestas = new Set(
      respuestasFiltradas.map((r) => r.intento_id)
    );

    const totalEstudiantesEvaluados = estudiantesConRespuestas.size;

    const totalEsperado = totalEstudiantesEvaluados * totalPreguntas;

    return {
      totalPreguntas,
      totalEstudiantesEvaluados,
      totalEsperado,
      correctas: statsRespuestas.correctas,
      incorrectas: statsRespuestas.incorrectas,
      nulas: statsRespuestas.nulas,
    };
  }, [respuestasFiltradas, statsRespuestas]);

  const kpis = useMemo(() => {
    const calificaciones = intentosFiltrados
      .map((i) => Number(i.calificacion_total))
      .filter((n) => Number.isFinite(n));

    const promedioCalificacion = average(calificaciones);
    const aprobados = calificaciones.filter((n) => n >= PASS_SCORE).length;
    const porcentajeAprobacion = percent(aprobados, calificaciones.length);

    const totalAciertos = respuestasFiltradas.filter(
      (r) => r.es_correcta === true
    ).length;

    const aciertoGlobal = percent(totalAciertos, respuestasFiltradas.length);

    const totalPreguntasUnicas =
      new Set(
        preguntasFiltradas
          .map((p) => p.numero_pregunta)
          .filter((n) => typeof n === "number" && Number.isFinite(n))
      ).size || 0;

    return {
      totalPreguntas: totalPreguntasUnicas,
      totalIntentos: intentosFiltrados.length,
      promedioCalificacion,
      porcentajeAprobacion,
      aciertoGlobal,
    };
  }, [preguntasFiltradas, intentosFiltrados, respuestasFiltradas]);

  const dashboardData = useMemo<LegacyDashboardData | null>(() => {
    if (!version) return null;

    const aprobados = intentosFiltrados.filter(
      (i) => (i.calificacion_total ?? 0) >= PASS_SCORE
    ).length;

    return {
      periodo_detectado: `Versión ${version.version_number}`,
      global: kpis.aciertoGlobal,
      porcentaje_aprobados: kpis.porcentajeAprobacion,
      numero_estudiantes: intentosFiltrados.filter(
        (i) => i.calificacion_total != null
      ).length,
      total_inscritos: intentosFiltrados.length,
      inscritos_primera_vez: intentosFiltrados.length,
      inscritos_n_veces: 0,
      aprobados_primera_vez: aprobados,
      aprobados_n_veces: 0,
      ausentes_primera_vez: 0,
      ausentes_n_veces: 0,
      por_componente: itemsByLevel.componentes,
      por_subcomponente: itemsByLevel.subcomponentes,
      por_tema: itemsByLevel.temas,
      docentes_por_componente: {},
      docentes_por_subcomponente: {},
      docentes_por_tema: {},
      asignaturas_detalle: [],
      conteo: {
        preguntas: preguntasFiltradas.length,
        intentos: intentosFiltrados.length,
        respuestas: respuestasFiltradas.length,
      },
      por_asignatura: [],
      docentes_global_detalle: [],
    };
  }, [
    version,
    kpis,
    intentosFiltrados,
    itemsByLevel,
    preguntasFiltradas.length,
    respuestasFiltradas.length,
  ]);

  const allCriticalItems = useMemo(() => {
    if (!dashboardData) return [];

    const all = [
      ...(dashboardData.por_componente ?? []).map((i) => ({
        ...i,
        type: "componente" as const,
      })),
      ...(dashboardData.por_subcomponente ?? []).map((i) => ({
        ...i,
        type: "subcomponente" as const,
      })),
      ...(dashboardData.por_tema ?? []).map((i) => ({
        ...i,
        type: "tema" as const,
      })),
    ];

    return all
      .filter((i) => i.promedio < 60)
      .sort((a, b) => a.promedio - b.promedio)
      .slice(0, 6);
  }, [dashboardData]);

  const buildStudentsForRange = (range: string): SidebarItem[] => {
    return intentos
      .filter((i) => getScoreRangeLabel(i.calificacion_total) === range)
      .sort((a, b) => (b.calificacion_total ?? -1) - (a.calificacion_total ?? -1))
      .map((i) => ({
        type: "student",
        id: i.id,
        primary: `${i.apellidos} ${i.nombres}`.trim(),
        secondary: i.correo || "Sin correo",
        badge:
          i.calificacion_total != null
            ? Number(i.calificacion_total).toFixed(2)
            : "N/D",
        meta: i.estado || undefined,
      }));
  };

  const buildStudentsWhoAnsweredCorrectly = (
    selected: DashboardItem
  ): SidebarItem[] => {
    const grouped = new Map<string, { intento_id: string; aciertos: number }>();

    const respuestasDelNivel = respuestas.filter((r) => {
      const pregunta = preguntasMap.get(r.pregunta_id);
      if (!pregunta || r.es_correcta !== true) return false;

      const componente = safeName(pregunta.componente, "Sin componente");
      const subcomponente = safeName(pregunta.subcomponente, "Sin subcomponente");
      const tema = safeName(pregunta.tema, "Sin tema");

      if (level === "componentes") return componente === selected.nombre;
      if (level === "subcomponentes") return subcomponente === selected.nombre;
      return tema === selected.nombre;
    });

    for (const r of respuestasDelNivel) {
      if (!grouped.has(r.intento_id)) {
        grouped.set(r.intento_id, { intento_id: r.intento_id, aciertos: 0 });
      }
      grouped.get(r.intento_id)!.aciertos += 1;
    }

    return Array.from(grouped.values())
      .sort((a, b) => b.aciertos - a.aciertos)
      .map((g) => {
        const intento = intentosMap.get(g.intento_id);
        return {
          type: "student",
          id: g.intento_id,
          primary: intento
            ? `${intento.apellidos} ${intento.nombres}`.trim()
            : "Estudiante no encontrado",
          secondary: intento?.correo || "Sin correo",
          badge: `${g.aciertos} aciertos`,
          meta:
            intento?.calificacion_total != null
              ? `Nota: ${Number(intento.calificacion_total).toFixed(2)}`
              : undefined,
        } as SidebarItem;
      });
  };

  const buildQuestionSuccessSidebar = (
    questionId: string,
    onlyCorrect: boolean
  ): SidebarItem[] => {
    return respuestas
      .filter((r) => r.pregunta_id === questionId && r.es_correcta === onlyCorrect)
      .map((r) => {
        const intento = intentosMap.get(r.intento_id);
        return {
          type: "student",
          id: r.id,
          primary: intento
            ? `${intento.apellidos} ${intento.nombres}`.trim()
            : "Estudiante no encontrado",
          secondary: r.respuesta_estudiante_raw || "Sin respuesta",
          badge: onlyCorrect ? "Acertó" : "Falló",
          meta: intento?.correo || undefined,
        } as SidebarItem;
      });
  };

  const buildTopStudentsByComponent = (componentName: string): SidebarItem[] => {
    const componentQuestions = preguntas.filter(
      (p) => safeName(p.componente, "Sin componente") === componentName
    );

    const componentQuestionIds = new Set(componentQuestions.map((p) => p.id));

    const grouped = new Map<
      string,
      {
        intento_id: string;
        aciertos: number;
        total: number;
        porcentaje: number;
        notaGlobal: number | null;
      }
    >();

    for (const r of respuestas) {
      if (!componentQuestionIds.has(r.pregunta_id)) continue;

      if (!grouped.has(r.intento_id)) {
        const intento = intentosMap.get(r.intento_id);
        grouped.set(r.intento_id, {
          intento_id: r.intento_id,
          aciertos: 0,
          total: 0,
          porcentaje: 0,
          notaGlobal: intento?.calificacion_total ?? null,
        });
      }

      const item = grouped.get(r.intento_id)!;
      item.total += 1;
      if (r.es_correcta === true) item.aciertos += 1;
    }

    return Array.from(grouped.values())
      .map((item) => ({
        ...item,
        porcentaje: percent(item.aciertos, item.total),
      }))
      .sort((a, b) => {
        if (b.porcentaje !== a.porcentaje) return b.porcentaje - a.porcentaje;
        if ((b.aciertos ?? 0) !== (a.aciertos ?? 0)) return b.aciertos - a.aciertos;
        return (b.notaGlobal ?? 0) - (a.notaGlobal ?? 0);
      })
      .map((item) => {
        const intento = intentosMap.get(item.intento_id);

        return {
          type: "student",
          id: item.intento_id,
          primary: intento
            ? `${intento.apellidos} ${intento.nombres}`.trim()
            : "Estudiante no encontrado",
          secondary: intento?.correo || "Sin correo",
          badge: `${item.porcentaje.toFixed(2)}%`,
          meta: `Aciertos en componente: ${item.aciertos}/${item.total} · Nota global: ${(item.notaGlobal ?? 0).toFixed(2)}`,
        } as SidebarItem;
      });
  };

  const buildStudentAnswerDetails = (studentId: string): SidebarItem[] => {
    const respuestasEstudiante = respuestas.filter(
      (r) => r.intento_id === studentId
    );

    if (respuestasEstudiante.length === 0) {
      return [
        {
          type: "answer",
          id: `empty-${studentId}`,
          primary: "Sin respuestas cargadas",
          secondary:
            "No se encontraron respuestas para este estudiante en intento_respuestas.",
          badge: "Sin datos",
          itemClassName: "border-[#FF6900] bg-[#FF6900]/5",
          badgeClassName: "bg-[#FF6900] text-white hover:bg-[#FF6900]",
        },
      ];
    }

    return respuestasEstudiante
      .map((r) => {
        const pregunta = preguntasMap.get(r.pregunta_id);
        const correctAnswer = correctOptionMap.get(r.pregunta_id);
        const incorrecta = r.es_correcta === false;
        const correcta = r.es_correcta === true;

        return {
          type: "answer",
          id: r.id,
          primary: `Pregunta ${pregunta?.numero_pregunta ?? "N/D"}`,
          secondary: `Respuesta del estudiante: ${
            r.respuesta_estudiante_raw ||
            r.respuesta_estudiante_normalizada ||
            "Sin respuesta"
          }`,
          badge: correcta ? "Correcta" : incorrecta ? "Incorrecta" : "Sin validar",
          meta: truncate(pregunta?.enunciado || pregunta?.pregunta_raw, 220),
          correctAnswer:
            incorrecta && correctAnswer
              ? `Respuesta correcta: ${correctAnswer}`
              : undefined,
          badgeClassName: correcta
            ? "bg-emerald-600 text-white hover:bg-emerald-600"
            : incorrecta
              ? "bg-[#FF6900] text-white hover:bg-[#FF6900]"
              : "bg-slate-500 text-white hover:bg-slate-500",
          itemClassName: correcta
            ? "border-emerald-500/40 bg-emerald-50"
            : incorrecta
              ? "border-[#FF6900] bg-[#FF6900]/5"
              : "border-slate-300 bg-slate-50",
        } as SidebarItem;
      })
      .sort((a, b) =>
        a.primary.localeCompare(b.primary, undefined, { numeric: true })
      );
  };

  const openStudentsByLevelItem = (item: DashboardItem) => {
    const items = buildStudentsWhoAnsweredCorrectly(item);
    setSelectedItem(item);
    setSidebar({
      open: true,
      title: `Estudiantes que acertaron en ${item.nombre}`,
      subtitle: `${items.length} estudiante(s)`,
      items,
    });
  };

  const openStudentsByRange = (range: string) => {
    const items = buildStudentsForRange(range);
    setSidebar({
      open: true,
      title: `Estudiantes del rango ${range}`,
      subtitle: `${items.length} estudiante(s)`,
      items,
    });
  };

  const openBestStudents = () => {
    setSidebar({
      open: true,
      title: "Mejores puntuados",
      subtitle: `${topEstudiantes.length} estudiante(s)`,
      items: topEstudiantes.map((i) => ({
        type: "student",
        id: i.id,
        primary: `${i.apellidos} ${i.nombres}`.trim(),
        secondary: i.correo || "Sin correo",
        badge: (i.calificacion_total ?? 0).toFixed(2),
        meta: "Haz clic en la fila del dashboard de ranking para ver respuestas",
      })),
    });
  };

  const openWorstStudents = () => {
    setSidebar({
      open: true,
      title: "Peores puntuados",
      subtitle: `${peoresEstudiantes.length} estudiante(s)`,
      items: peoresEstudiantes.map((i) => ({
        type: "student",
        id: i.id,
        primary: `${i.apellidos} ${i.nombres}`.trim(),
        secondary: i.correo || "Sin correo",
        badge: (i.calificacion_total ?? 0).toFixed(2),
        meta: "Haz clic en la fila del dashboard de ranking para ver respuestas",
      })),
    });
  };

  const openHardQuestions = () => {
    setSidebar({
      open: true,
      title: "Preguntas más difíciles",
      subtitle: `${preguntasDificiles.length} pregunta(s)`,
      items: preguntasDificiles.map((q) => ({
        type: "question",
        id: q.pregunta.id,
        primary: `Pregunta ${q.pregunta.numero_pregunta}`,
        secondary: q.pregunta.enunciado || q.pregunta.pregunta_raw,
        badge: `${q.porcentaje.toFixed(2)}%`,
        meta: "Haz clic en una tarjeta del dashboard para ver quiénes acertaron",
      })),
    });
  };

  const openEasyQuestions = () => {
    setSidebar({
      open: true,
      title: "Preguntas más fáciles",
      subtitle: `${preguntasFaciles.length} pregunta(s)`,
      items: preguntasFaciles.map((q) => ({
        type: "question",
        id: q.pregunta.id,
        primary: `Pregunta ${q.pregunta.numero_pregunta}`,
        secondary: q.pregunta.enunciado || q.pregunta.pregunta_raw,
        badge: `${q.porcentaje.toFixed(2)}%`,
        meta: "Haz clic en una tarjeta del dashboard para ver quiénes fallaron",
      })),
    });
  };

  const handleCriticalItemClick = (
    item: DashboardItem & { type: "componente" | "subcomponente" | "tema" }
  ) => {
    if (item.type === "componente") {
      setLevel("componentes");
      setComponenteId(undefined);
      setSubcomponenteId(undefined);
    }

    if (item.type === "subcomponente") {
      setLevel("subcomponentes");
      setComponenteId(item.componente_id);
      setSubcomponenteId(undefined);
    }

    if (item.type === "tema") {
      setLevel("temas");
      setComponenteId(item.componente_id);
      setSubcomponenteId(item.subcomponente_id);
    }

    openStudentsByLevelItem(item);
  };

  const chatContext = useMemo(() => {
    if (!dashboardData) return "";

    const nivelLabel =
      level === "componentes"
        ? "COMPONENTES"
        : level === "subcomponentes"
          ? "SUBCOMPONENTES"
          : "TEMAS";

    const itemsNivel =
      level === "componentes"
        ? dashboardData.por_componente
        : level === "subcomponentes"
          ? dashboardData.por_subcomponente
          : dashboardData.por_tema;

    const topCriticos = (itemsNivel ?? [])
      .filter((i) => i.promedio < 60)
      .sort((a, b) => a.promedio - b.promedio)
      .slice(0, 5);

    return `
DASHBOARD DE EXAMEN

- Version ID: ${versionId}
- Periodo detectado: ${dashboardData.periodo_detectado}
- Acierto global: ${dashboardData.global.toFixed(2)}%
- Porcentaje aprobados: ${dashboardData.porcentaje_aprobados.toFixed(2)}%
- Estudiantes evaluados: ${dashboardData.numero_estudiantes}

Nivel actual: ${nivelLabel}

Top críticos:
${topCriticos
  .map((i, idx) => `${idx + 1}. ${i.nombre} — ${i.promedio.toFixed(2)}%`)
  .join("\n")}
`;
  }, [dashboardData, versionId, level]);

  const rpcSnapshot = useMemo(() => {
    if (!dashboardData) return null;

    return {
      global: dashboardData.global,
      conteo: dashboardData.conteo,
      por_componente: dashboardData.por_componente,
      por_subcomponente: dashboardData.por_subcomponente,
      por_tema: dashboardData.por_tema,
      por_asignatura: dashboardData.por_asignatura,
      docentes_global_detalle: dashboardData.docentes_global_detalle,
    };
  }, [dashboardData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 rounded-full border-b-2 border-[#002E45] mx-auto mb-4" />
          <p className="text-[#264763]">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !version || !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <p className="text-lg font-medium text-[#002E45] mb-2">
            Sin datos disponibles
          </p>
          <p className="text-sm text-[#222223]/70">
            {error || "No se encontró la versión"}
          </p>
        </div>
      </div>
    );
  }

  const handleGeneratePdf = async () => {
    try {
      if (!version || !dashboardData) return;

      const distribucionMap = {
        "0-49": 0,
        "50-69": 0,
        "70-84": 0,
        "85-100": 0,
        "Sin nota": 0,
      };

      for (const intento of intentos) {
        const range = getScoreRangeLabel(intento.calificacion_total);
        distribucionMap[range as keyof typeof distribucionMap] += 1;
      }

      const distribucionCalificaciones = Object.entries(distribucionMap)
        .map(([rango, frecuencia]) => ({
          rango,
          frecuencia,
          porcentaje: percent(frecuencia, intentos.length),
        }))
        .filter((item) => item.frecuencia > 0);

      const assets = {
        portada: portadaImg,
        header: curvaImg,
        footer: footerImg,
      };

      const pdfSections = treeToPdfSections(reportTree);
      await saveTextoDocumento({ items: reportItems });

      const {
        conclusiones,
        recomendaciones,
      } = await obtenerConclusionesYRecomendaciones(versionId!);

      const nivelesParaPdf = nivelesDisponibles;

      const componentesPorNivel = nivelesParaPdf.map((nivel) => {
        const intentosNivel = intentos.filter(
          (intento) => safeName(intento.nivel, "Sin nivel") === nivel
        );

        const intentoIdsNivel = new Set(intentosNivel.map((i) => i.id));

        const respuestasNivel = respuestas.filter((respuesta) =>
          intentoIdsNivel.has(respuesta.intento_id)
        );

        const preguntaIdsNivel = new Set(
          respuestasNivel.map((respuesta) => respuesta.pregunta_id)
        );

        const preguntasNivel = preguntas.filter((pregunta) =>
          preguntaIdsNivel.has(pregunta.id)
        );

        return {
          nivel,
          componentes: aggregateByLevel(
            "componentes",
            preguntasNivel,
            respuestasNivel
          ).map((item) => ({
            nombre: item.nombre,
            promedio: item.promedio,
            totalRespuestas: item.totalRespuestas,
            totalAciertos: item.totalAciertos,
          })),
        };
      }).filter((grupo) => grupo.componentes.length > 0);

      const distribucionPorNivel = nivelesDisponibles.map((nivel) => {
        const intentosNivel = intentos.filter(
          (intento) => safeName(intento.nivel, "Sin nivel") === nivel
        );

        const distribucionMap = {
          "0-49": 0,
          "50-69": 0,
          "70-84": 0,
          "85-100": 0,
          "Sin nota": 0,
        };

        for (const intento of intentosNivel) {
          const range = getScoreRangeLabel(intento.calificacion_total);
          distribucionMap[range as keyof typeof distribucionMap] += 1;
        }

        return {
          nivel,
          distribucion: Object.entries(distribucionMap).map(([rango, frecuencia]) => ({
            rango,
            frecuencia,
            porcentaje: percent(frecuencia, intentosNivel.length),
          })),
        };
      }).filter((grupo) =>
        grupo.distribucion.some((item) => item.frecuencia > 0)
      );

      const preguntasDificilesPorNivel = nivelesDisponibles.map((nivel) => {
        const intentosNivel = intentos.filter(
          (intento) => safeName(intento.nivel, "Sin nivel") === nivel
        );

        const intentoIdsNivel = new Set(intentosNivel.map((i) => i.id));

        const respuestasNivel = respuestas.filter((respuesta) =>
          intentoIdsNivel.has(respuesta.intento_id)
        );

        const grouped = new Map<
          string,
          { pregunta: PreguntaRow; total: number; aciertos: number }
        >();

        for (const respuesta of respuestasNivel) {
          const pregunta = preguntasMap.get(respuesta.pregunta_id);
          if (!pregunta) continue;

          if (!grouped.has(pregunta.id)) {
            grouped.set(pregunta.id, {
              pregunta,
              total: 0,
              aciertos: 0,
            });
          }

          const item = grouped.get(pregunta.id)!;
          item.total += 1;

          if (respuesta.es_correcta === true) {
            item.aciertos += 1;
          }
        }

        return {
          nivel,
          preguntas: Array.from(grouped.values())
            .map((item) => ({
              numero_pregunta: item.pregunta.numero_pregunta,
              enunciado: item.pregunta.enunciado || item.pregunta.pregunta_raw,
              tema: item.pregunta.tema || "Sin tema",
              componente: item.pregunta.componente || "Sin componente",
              porcentaje: percent(item.aciertos, item.total),
            }))
            .sort((a, b) => a.porcentaje - b.porcentaje)
            .slice(0, 5),
        };
      }).filter((grupo) => grupo.preguntas.length > 0);

      const promediosPorNivel = nivelesDisponibles
        .map((nivel) => {
          const intentosNivel = intentos.filter(
            (intento) => safeName(intento.nivel, "Sin nivel") === nivel
          );

          const calificaciones = intentosNivel
            .map((i) => Number(i.calificacion_total))
            .filter((n) => Number.isFinite(n));

          return {
            nivel,
            promedio: average(calificaciones),
            totalEstudiantes: calificaciones.length,
          };
        })
        .filter((item) => item.totalEstudiantes > 0);
        
      await generarReportePDF(
        {
          carrera: "Medicina",
          periodo: dashboardData.periodo_detectado,
          totalEstudiantes: dashboardData.numero_estudiantes,
          totalPreguntas: kpis.totalPreguntas,
          promedioGeneral: kpis.promedioCalificacion,
          porcentajeAprobacion: kpis.porcentajeAprobacion,
          aciertoGlobal: kpis.aciertoGlobal,
          promediosPorNivel,
          distribucionCalificaciones,
          distribucionPorNivel,

          componentes: itemsByLevel.componentes.map((item) => ({
            nombre: item.nombre,
            promedio: item.promedio,
            totalRespuestas: item.totalRespuestas,
            totalAciertos: item.totalAciertos,
          })),

          componentesPorNivel,
          preguntasDificiles: preguntasDificiles.map((item) => ({
            numero_pregunta: item.pregunta.numero_pregunta,
            enunciado: item.pregunta.enunciado || item.pregunta.pregunta_raw,
            tema: item.pregunta.tema || "Sin tema",
            componente: item.pregunta.componente || "Sin componente",
            porcentaje: item.porcentaje,
          })),

          preguntasDificilesPorNivel,

          preguntasFaciles: preguntasFaciles.map((item) => ({
            numero_pregunta: item.pregunta.numero_pregunta,
            enunciado: item.pregunta.enunciado || item.pregunta.pregunta_raw,
            tema: item.pregunta.tema || "Sin tema",
            componente: item.pregunta.componente || "Sin componente",
            porcentaje: item.porcentaje,
          })),

          conclusionesGeneradas: conclusiones,
          recomendacionesGeneradas: recomendaciones,
          usarSeccionesPorDefecto: false,
          introduccionPersonalizada: pdfSections.introduccionPersonalizada,
          antecedentesPersonalizados: pdfSections.antecedentesPersonalizados,
          motivacionJuridicaPersonalizada: pdfSections.motivacionJuridicaPersonalizada,
          metodologiaPersonalizada: pdfSections.metodologiaPersonalizada,
        },
        assets
      );

      setShowPdfModal(false);
    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("No se pudo generar el PDF.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {!forcePublic && (
        <HeaderActions
          title="Evaluación de Resultados de Aprendizaje - Carrera de Medicina"
          versionLabel={`v${version.version_number}`}
          subtitle={`${version.file_name || "Archivo sin nombre"} · ${new Date(
            version.created_at
          ).toLocaleString()}`}
          onBack={() => navigate(-1)}
          onGeneratePdf={() => setShowPdfModal(true)}
        />
      )}

      <DashboardHeader
        periodoDetectado={dashboardData.periodo_detectado}
        onSharePublic={!forcePublic ? handleGeneratePublicLink : undefined}
      />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <DashboardKPIs data={dashboardData} />
        
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 items-end">
              <div className="space-y-2">
                <Label>Filtrar por nivel</Label>

                <Select
                  value={nivelFilter}
                  onValueChange={(value) => {
                    setNivelFilter(value);
                    setSelectedItem(null);
                    setComponenteId(undefined);
                    setSubcomponenteId(undefined);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un nivel" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="todos">Todos los niveles</SelectItem>

                    {nivelesDisponibles.map((nivel) => (
                      <SelectItem key={nivel} value={nivel}>
                        {nivel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-xl bg-[#002E45]/5 border border-[#002E45]/10 p-4">
                <p className="text-sm text-slate-500">Vista actual</p>
                <p className="text-lg font-semibold text-[#002E45]">
                  {nivelFilter === "todos" ? "Todos los niveles" : nivelFilter}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {intentosFiltrados.length} intento(s) · {preguntasFiltradas.length} pregunta(s) ·{" "}
                  {respuestasFiltradas.length} respuesta(s)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <AsignaturasDocentesCard items={asignaturasDocentes} />

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-[#002E45] flex items-center gap-2">
              <Users className="h-4 w-4" />
              Diagnóstico de procesamiento
            </CardTitle>
          </CardHeader>

          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xl text-slate-500">Estudiantes evaluados</p>
              <p className="text-4xl font-bold text-[#002E45]">
                {diagnosticoProcesamiento.totalEstudiantesEvaluados}
              </p>
              <p className="text-l text-slate-400 mt-1">
                Preguntas: {diagnosticoProcesamiento.totalPreguntas}
              </p>
            </div>

            <div>
              <p className="text-xl text-slate-500">Correctas</p>
              <p className="text-4xl font-bold text-[#067647]">
                {diagnosticoProcesamiento.correctas}/{diagnosticoProcesamiento.totalEsperado}
              </p>
              <p className="text-l text-slate-400 mt-1">
                Respuestas correctas / totales
              </p>
            </div>

            <div>
              <p className="text-xl text-slate-500">Incorrectas</p>
              <p className="text-4xl font-bold text-[#B42318]">
                {diagnosticoProcesamiento.incorrectas}/{diagnosticoProcesamiento.totalEsperado}
              </p>
              <p className="text-l text-slate-400 mt-1">
                Respuestas incorrectas / totales
              </p>
            </div>

          </CardContent>
        </Card>

        <ComponentBarChart
          items={itemsByLevel.componentes}
          onClickItem={openTopStudentsByComponent}
        />

        <CriticalAlertSection
          items={allCriticalItems}
          onItemClick={handleCriticalItemClick}
        />

        <LevelTabs
          active={level}
          onChange={(newLevel) => {
            setLevel(newLevel);
            setSelectedItem(null);

            if (newLevel === "componentes") {
              setComponenteId(undefined);
              setSubcomponenteId(undefined);
            }

            if (newLevel === "subcomponentes") {
              setSubcomponenteId(undefined);
            }
          }}
        />

        <div
          className="
            flex flex-wrap items-center gap-3
            p-3 rounded-xl
            bg-[#002E45]/5
            border border-[#1c3247]/30
          "
        >
          <div className="text-sm font-medium text-[#264763]">
            Filtrar desempeño:
          </div>

          <div className="h-8 w-px bg-[#1c3247]/30 hidden sm:block" />

          <FilterChips
            active={filter}
            onChange={setFilter}
            counts={filterCounts}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <DistributionCard
            intentos={intentosFiltrados}
            onOpenRange={openStudentsByRange}
          />

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#002E45]">
                {level === "componentes"
                  ? "Rendimiento por componente"
                  : level === "subcomponentes"
                    ? "Rendimiento por subcomponente"
                    : "Rendimiento por tema"}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {filteredItems.slice(0, 20).length === 0 ? (
                <p className="text-sm text-slate-500">
                  No hay datos para mostrar.
                </p>
              ) : (
                filteredItems.slice(0, 20).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => openStudentsByLevelItem(item)}
                    className="w-full text-left space-y-2 rounded-xl border p-3 bg-white hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-medium text-[#002E45]">
                        {item.nombre}
                      </span>
                      <Badge>
                        {item.promedio.toFixed(2)}%
                      </Badge>
                    </div>

                    <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${item.promedio}%`,
                          background:
                            item.promedio < 60
                              ? "#B42318"
                              : item.promedio < 70
                                ? "#F79009"
                                : "#067647",
                        }}
                      />
                    </div>

                    <p className="text-sm text-slate-500">
                      Respuestas: {item.totalRespuestas} · Aciertos:{" "}
                      {item.totalAciertos}
                    </p>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <QuestionsCard
            title="Preguntas más difíciles"
            icon={<TrendingDown className="h-5 w-5" />}
            items={preguntasDificiles}
            badgeVariant="destructive"
            onClickQuestion={(item) =>
              setSidebar({
                open: true,
                title: `Quiénes acertaron la pregunta ${item.pregunta.numero_pregunta}`,
                subtitle: `${item.aciertos} acierto(s)`,
                items: buildQuestionSuccessSidebar(item.pregunta.id, true),
              })
            }
          />

          <QuestionsCard
            title="Preguntas más fáciles"
            icon={<TrendingUp className="h-5 w-5" />}
            items={preguntasFaciles}
            onClickQuestion={(item) =>
              setSidebar({
                open: true,
                title: `Quiénes fallaron la pregunta ${item.pregunta.numero_pregunta}`,
                subtitle: `${item.total - item.aciertos} fallo(s)`,
                items: buildQuestionSuccessSidebar(item.pregunta.id, false),
              })
            }
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <RankingCard
            title="Mejores puntuados"
            icon={<Trophy className="h-5 w-5" />}
            items={topEstudiantes}
            onClickStudent={(item) =>
              setSidebar({
                open: true,
                title: `Respuestas de ${item.apellidos} ${item.nombres}`,
                subtitle: `Nota: ${(item.calificacion_total ?? 0).toFixed(2)}`,
                items: buildStudentAnswerDetails(item.id),
              })
            }
          />

          <RankingCard
            title="Peores puntuados"
            icon={<CircleAlert className="h-5 w-5" />}
            items={peoresEstudiantes}
            variant="destructive"
            onClickStudent={(item) =>
              setSidebar({
                open: true,
                title: `Respuestas de ${item.apellidos} ${item.nombres}`,
                subtitle: `Nota: ${(item.calificacion_total ?? 0).toFixed(2)}`,
                items: buildStudentAnswerDetails(item.id),
              })
            }
          />
        </div>

        <QuickAccessGrid
          title={
            level === "componentes"
              ? "Componentes"
              : level === "subcomponentes"
                ? "Subcomponentes"
                : "Temas"
          }
          items={filteredItems}
          type={
            level === "componentes"
              ? "componente"
              : level === "subcomponentes"
                ? "subcomponente"
                : "tema"
          }
          docentesMap={{}}
          onItemClick={openStudentsByLevelItem}
          maxItems={100}
        />

      </main>

      <SidebarPanel
        sidebar={sidebar}
        onClose={() => setSidebar({ open: false, title: "", items: [] })}
      />

      <Dialog open={showPdfModal} onOpenChange={setShowPdfModal}>
        <DialogContent className="sm:max-w-5xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Generar informe PDF
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Personaliza el informe en una sola estructura jerárquica, con la misma
              lógica del editor de normativa.
            </p>

            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Datos listos para el informe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                  <li>Versión: v{version.version_number}</li>
                  <li>Total preguntas: {kpis.totalPreguntas}</li>
                  <li>Total intentos: {kpis.totalIntentos}</li>
                  <li>Promedio general: {kpis.promedioCalificacion.toFixed(2)}</li>
                  <li>Aprobación: {kpis.porcentajeAprobacion.toFixed(2)}%</li>
                  <li>Acierto global: {kpis.aciertoGlobal.toFixed(2)}%</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Estructura del informe
                </CardTitle>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => setAddRootOpen(true)}
                  >
                    <Plus className="h-3 w-3" />
                    Agregar raíz
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                {reportTree.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">
                      No hay elementos. Agrega un título para comenzar.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {reportTree.map((item) => (
                      <ReportTreeItemExact
                        key={item.id}
                        item={item}
                        depth={0}
                        readOnly={false}
                        onAddChild={handleAddChildToTree}
                        onUpdate={handleUpdateReportItem}
                        onDelete={handleDeleteReportItem}
                        onMove={handleMoveReportItem}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await saveTextoDocumento({ items: reportItems });
                  alert("Contenido guardado correctamente.");
                } catch (error) {
                  console.error(error);
                  alert("No se pudo guardar el contenido.");
                }
              }}
            >
              Guardar contenido
            </Button>

            <Button variant="outline" onClick={() => setShowPdfModal(false)}>
              Cerrar
            </Button>

            <Button
              className="bg-[#002E45] text-white hover:bg-[#001f31]"
              onClick={handleGeneratePdf}
            >
              Generar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={addRootOpen} onOpenChange={setAddRootOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Agregar elemento raíz</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label>Tipo</Label>
            <Select
              value={newRootType}
              onValueChange={(v) => setNewRootType(v as ReportItemType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TITULO">Título</SelectItem>
                <SelectItem value="SUBTITULO">Subtítulo</SelectItem>
                <SelectItem value="ARTICULO">Artículo</SelectItem>
                <SelectItem value="VINETA">Viñeta</SelectItem>
                <SelectItem value="PARRAFO">Párrafo</SelectItem>
              </SelectContent>
            </Select>

            <div>
              <Label>Cantidad</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={newRootQuantity}
                onChange={(e) =>
                  setNewRootQuantity(
                    Math.max(1, Math.min(50, parseInt(e.target.value) || 1))
                  )
                }
                className="w-24 h-8 text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleAddRootNodes}
              className="bg-[#002E45] text-white hover:bg-[#001f31]"
            >
              Agregar {newRootQuantity > 1 ? `(${newRootQuantity})` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[#002E45]">
                  Enlace público
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Este enlace permitirá abrir el dashboard sin iniciar sesión.
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowShareModal(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="rounded-xl border bg-slate-50 p-4">
              <p className="text-sm text-slate-600 break-all">
                {`${window.location.origin}/public/dashboard/${versionId}`}
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowShareModal(false)}>
                Cerrar
              </Button>

              <Button
                className="bg-[#002E45] text-white hover:bg-[#001f31]"
                onClick={() =>
                  navigator.clipboard.writeText(
                    `${window.location.origin}/public/dashboard/${versionId}`
                  )
                }
              >
                Copiar enlace
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
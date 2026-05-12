import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  FileText,
  Plus,
  Save,
  Target,
  Trophy,
  Users,
  X,
  XCircle,
} from "lucide-react";

import { toast } from "sonner";
import { ReportTreeItemExact } from "@/components/dashboard/ReportTreeItem";

const db = supabase as any;
const PAGE_SIZE = 1000;
const PASS_SCORE = 70;

type ReportItemType =
  | "TITULO"
  | "SUBTITULO"
  | "PARRAFO"
  | "ARTICULO"
  | "VINETA"
  | "TABLA";

const REPORT_ITEM_TYPE_LABELS: Record<ReportItemType, string> = {
  TITULO: "Título",
  SUBTITULO: "Subtítulo",
  PARRAFO: "Párrafo",
  ARTICULO: "Artículo",
  VINETA: "Viñeta",
  TABLA: "Tabla",
};

type ReportTableData = {
  headers: string[];
  rows: string[][];
};

type ReportItem = {
  id: string;
  tipo: ReportItemType;
  parent_id: string | null;
  orden: number;
  titulo: string;
  contenido: string;
  table_data?: ReportTableData;
  children?: ReportItem[];
};

type FirmaPdf = {
  nombre: string;
  cargo: string;
};

type CourseRow = {
  id: string;
  nombre: string;
  descripcion: string | null;
  periodo: string | null;
  paralelo: string | null;
  docente: string | null;
};

type StudentRow = {
  id: string;
  course_id: string;
  cedula: string | null;
  nombres: string;
  apellidos: string;
  email: string | null;
};

type TestRow = {
  id: string;
  course_id: string;
  nombre: string;
  descripcion: string | null;
  estado: string;
  total_preguntas: number;
  nota_aprobacion: number;
  duracion_minutos: number | null;
  intentos_permitidos: number;
};

type CategoryRow = {
  id: string;
  course_id: string;
  parent_id: string | null;
  nombre: string;
};

type QuestionRow = {
  id: string;
  course_id: string;
  category_id: string;
  tipo: string;
  enunciado: string;
  explicacion: string | null;
  activa: boolean;
};

type AttemptRow = {
  id: string;
  test_id: string;
  course_id: string;
  student_id: string;
  numero_intento: number;
  estado: string;
  score_percent: number | null;
  aprobado: boolean | null;
  started_at: string;
  finished_at: string | null;
};

type AttemptQuestionRow = {
  id: string;
  attempt_id: string;
  question_id: string;
  orden: number;
  puntaje: number;
  tipo_snapshot: string;
  enunciado_snapshot: string;
};

type AttemptAnswerRow = {
  id: string;
  attempt_question_id: string;
  selected_option_id: string | null;
  respuesta_texto: string | null;
  respuesta_json: any | null;
  es_correcta: boolean | null;
  puntaje_obtenido: number;
};

type DashboardItem = {
  id: string;
  nombre: string;
  promedio: number;
  totalRespuestas: number;
  totalAciertos: number;
};

type QuestionStat = {
  question: QuestionRow;
  total: number;
  aciertos: number;
  porcentaje: number;
};

type SidebarState = {
  open: boolean;
  title: string;
  subtitle?: string;
  items: Array<{
    id: string;
    primary: string;
    secondary?: string;
    badge?: string;
    variant?: "success" | "danger" | "default";
  }>;
};

const DEFAULT_TABLE_DATA: ReportTableData = {
  headers: ["Columna 1", "Columna 2"],
  rows: [["", ""]],
};

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

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percent(part: number, total: number) {
  if (!total) return 0;
  return (part / total) * 100;
}

function safeNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeTableData(tableData?: ReportTableData): ReportTableData {
  const headers =
    tableData?.headers?.length
      ? tableData.headers.map((h, index) => h ?? `Columna ${index + 1}`)
      : [...DEFAULT_TABLE_DATA.headers];

  const rows =
    tableData?.rows?.length
      ? tableData.rows.map((row) => {
          const normalizedRow = [...row];

          while (normalizedRow.length < headers.length) {
            normalizedRow.push("");
          }

          return normalizedRow.slice(0, headers.length);
        })
      : [headers.map(() => "")];

  return { headers, rows };
}

function textToArray(value: string): string[] {
  return String(value ?? "")
    .split(/\n+/)
    .map((line) =>
      line
        .replace(/^[-•]\s*/, "")
        .replace(/^\d+[\.\)]\s*/, "")
        .trim()
    )
    .filter(Boolean);
}

function jsonToText(value: unknown): string {
  if (!value) return "";

  if (Array.isArray(value)) return value.map(String).join("\n");

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String).join("\n");
    } catch {
      return value;
    }

    return value;
  }

  return String(value);
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
    nodes.forEach((node) => {
      if (node.children) sortChildren(node.children);
    });
  };

  sortChildren(roots);

  return roots;
}

function getScoreRangeLabel(score: number | null | undefined) {
  if (score == null || Number.isNaN(Number(score))) return "Sin nota";
  if (score < 50) return "0-49";
  if (score < 70) return "50-69";
  if (score < 85) return "70-84";
  return "85-100";
}

const RANGE_COLORS: Record<string, string> = {
  "0-49": "#B42318",
  "50-69": "#F79009",
  "70-84": "#264763",
  "85-100": "#067647",
  "Sin nota": "#98A2B3",
};

function HeaderActions({
  title,
  subtitle,
  badge,
  onBack,
  onGeneratePdf,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  onBack: () => void;
  onGeneratePdf: () => void;
}) {
  return (
    <div className="border-b bg-white">
      <div className="container mx-auto px-4 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>

              <h1 className="text-2xl font-bold text-[#002E45]">{title}</h1>

              {badge && <Badge>{badge}</Badge>}
            </div>

            <p className="text-sm text-[#222223]/70">{subtitle}</p>
          </div>

          <Button
            className="bg-[#002E45] text-white hover:bg-[#001f31]"
            onClick={onGeneratePdf}
          >
            <FileText className="mr-2 h-4 w-4" />
            Generar informe PDF
          </Button>
        </div>
      </div>
    </div>
  );
}

function KPICards({
  totalEstudiantes,
  totalTests,
  totalIntentos,
  promedioGeneral,
  porcentajeAprobacion,
  aciertoGlobal,
}: {
  totalEstudiantes: number;
  totalTests: number;
  totalIntentos: number;
  promedioGeneral: number;
  porcentajeAprobacion: number;
  aciertoGlobal: number;
}) {
  const items = [
    {
      label: "Estudiantes",
      value: totalEstudiantes,
      icon: Users,
    },
    {
      label: "Tests",
      value: totalTests,
      icon: BookOpen,
    },
    {
      label: "Intentos",
      value: totalIntentos,
      icon: ClipboardList,
    },
    {
      label: "Promedio",
      value: `${promedioGeneral.toFixed(2)}%`,
      icon: Target,
    },
    {
      label: "Aprobación",
      value: `${porcentajeAprobacion.toFixed(2)}%`,
      icon: Trophy,
    },
    {
      label: "Acierto global",
      value: `${aciertoGlobal.toFixed(2)}%`,
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Card key={item.label} className="border-slate-200 shadow-sm">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className="mt-1 text-2xl font-black text-[#002E45]">
                  {item.value}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#002E45]/10">
                <Icon className="h-6 w-6 text-[#FF6900]" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function DistributionCard({
  attempts,
  onOpenRange,
}: {
  attempts: AttemptRow[];
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

    for (const attempt of attempts) {
      const range = getScoreRangeLabel(attempt.score_percent);
      base[range as keyof typeof base] += 1;
    }

    return Object.entries(base).map(([name, value]) => ({
      name,
      value,
      percent: percent(value, attempts.length),
      color: RANGE_COLORS[name],
    }));
  }, [attempts]);

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#002E45]">
          <ClipboardList className="h-5 w-5" />
          Distribución de calificaciones
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex h-12 w-full overflow-hidden rounded-full border">
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
          {distribution.map((item) => (
            <button
              key={item.name}
              onClick={() => onOpenRange(item.name)}
              className="grid w-full grid-cols-[1fr_120px_90px] items-center rounded-lg border bg-white p-3 hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ background: item.color }}
                />
                <span className="text-[#002E45]">{item.name}</span>
              </div>

              <span className="text-right text-sm text-slate-500">
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

function getPerformanceClass(value: number) {
  if (value < 50) return "bg-red-600";
  if (value < 70) return "bg-orange-500";
  if (value < 85) return "bg-[#264763]";
  return "bg-green-700";
}

function PerformanceList({
  title,
  icon,
  items,
}: {
  title: string;
  icon: ReactNode;
  items: DashboardItem[];
}) {
  const sorted = [...items].sort((a, b) => a.promedio - b.promedio);

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#002E45]">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {sorted.length === 0 ? (
          <p className="text-sm text-slate-500">No hay datos para mostrar.</p>
        ) : (
          sorted.map((item) => (
            <div key={item.id} className="rounded-xl border bg-white p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-[#002E45]">{item.nombre}</p>
                  <p className="text-xs text-slate-500">
                    Aciertos: {item.totalAciertos} / Respuestas:{" "}
                    {item.totalRespuestas}
                  </p>
                </div>

                <Badge
                  className={`${getPerformanceClass(
                    item.promedio
                  )} text-white hover:${getPerformanceClass(item.promedio)}`}
                >
                  {item.promedio.toFixed(2)}%
                </Badge>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full ${getPerformanceClass(item.promedio)}`}
                  style={{
                    width: `${Math.max(3, Math.min(100, item.promedio))}%`,
                  }}
                />
              </div>
            </div>
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
  variant,
}: {
  title: string;
  icon: ReactNode;
  items: QuestionStat[];
  variant?: "default" | "destructive";
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
          <p className="text-sm text-slate-500">No hay preguntas para mostrar.</p>
        ) : (
          items.slice(0, 8).map((item, index) => (
            <div key={item.question.id} className="rounded-xl border bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-[#002E45]">
                  Pregunta {index + 1}
                </p>

                <Badge variant={variant}>{item.porcentaje.toFixed(2)}%</Badge>
              </div>

              <p className="mt-2 line-clamp-3 text-sm text-slate-500">
                {item.question.enunciado}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                Aciertos: {item.aciertos} / Respuestas: {item.total}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function RankingCard({
  title,
  icon,
  items,
  getStudentName,
}: {
  title: string;
  icon: ReactNode;
  items: Array<{
    student_id: string;
    promedio: number;
    totalIntentos: number;
  }>;
  getStudentName: (id: string) => string;
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
          <p className="text-sm text-slate-500">No hay estudiantes para mostrar.</p>
        ) : (
          items.slice(0, 8).map((item, index) => (
            <div
              key={item.student_id}
              className="flex items-center justify-between rounded-xl border bg-white p-4"
            >
              <div>
                <p className="font-semibold text-[#002E45]">
                  {index + 1}. {getStudentName(item.student_id)}
                </p>
                <p className="text-xs text-slate-500">
                  Intentos: {item.totalIntentos}
                </p>
              </div>

              <Badge>{item.promedio.toFixed(2)}%</Badge>
            </div>
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
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />

      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div>
            <h2 className="text-xl font-bold text-[#002E45]">
              {sidebar.title}
            </h2>

            {sidebar.subtitle && (
              <p className="mt-1 text-sm text-slate-500">{sidebar.subtitle}</p>
            )}
          </div>

          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {sidebar.items.length === 0 ? (
            <p className="text-sm text-slate-500">No hay elementos para mostrar.</p>
          ) : (
            sidebar.items.map((item) => (
              <div key={item.id} className="rounded-xl border bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#002E45]">
                      {item.primary}
                    </p>

                    {item.secondary && (
                      <p className="mt-1 text-sm text-slate-500">
                        {item.secondary}
                      </p>
                    )}
                  </div>

                  {item.badge && (
                    <Badge
                      className={
                        item.variant === "success"
                          ? "bg-green-600 text-white hover:bg-green-600"
                          : item.variant === "danger"
                            ? "bg-red-600 text-white hover:bg-red-600"
                            : ""
                      }
                    >
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

export default function QuizCourseDashboard() {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();

  const [loading, setLoading] = useState(true);

  const [course, setCourse] = useState<CourseRow | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [tests, setTests] = useState<TestRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [attemptQuestions, setAttemptQuestions] = useState<AttemptQuestionRow[]>([]);
  const [answers, setAnswers] = useState<AttemptAnswerRow[]>([]);

  const [selectedTestFilter, setSelectedTestFilter] = useState("todos");

  const [showPdfModal, setShowPdfModal] = useState(false);
  const [reportItems, setReportItems] = useState<ReportItem[]>([]);
  const [conclusionesTexto, setConclusionesTexto] = useState("");
  const [recomendacionesTexto, setRecomendacionesTexto] = useState("");
  const [firmasPdf, setFirmasPdf] = useState<FirmaPdf[]>([]);

  const [addRootOpen, setAddRootOpen] = useState(false);
  const [newRootType, setNewRootType] = useState<ReportItemType>("TITULO");
  const [newRootQuantity, setNewRootQuantity] = useState(1);

  const [sidebar, setSidebar] = useState<SidebarState>({
    open: false,
    title: "",
    items: [],
  });

  const reportTree = useMemo(() => buildTree(reportItems), [reportItems]);

  useEffect(() => {
    if (!courseId) return;

    const loadDashboard = async () => {
      try {
        setLoading(true);

        const { data: courseData, error: courseError } = await db
          .from("quiz_courses")
          .select("*")
          .eq("id", courseId)
          .single();

        if (courseError) throw courseError;
        setCourse(courseData);

        const [
          studentsData,
          testsData,
          categoriesData,
          questionsData,
          attemptsData,
          reportData,
          configData,
        ] = await Promise.all([
          fetchAllRows<StudentRow>(async (from, to) => {
            const { data, error } = await db
              .from("quiz_students")
              .select("*")
              .eq("course_id", courseId)
              .range(from, to);

            if (error) throw error;
            return data || [];
          }),

          fetchAllRows<TestRow>(async (from, to) => {
            const { data, error } = await db
              .from("quiz_tests")
              .select("*")
              .eq("course_id", courseId)
              .range(from, to);

            if (error) throw error;
            return data || [];
          }),

          fetchAllRows<CategoryRow>(async (from, to) => {
            const { data, error } = await db
              .from("quiz_categories")
              .select("*")
              .eq("course_id", courseId)
              .range(from, to);

            if (error) throw error;
            return data || [];
          }),

          fetchAllRows<QuestionRow>(async (from, to) => {
            const { data, error } = await db
              .from("quiz_questions")
              .select("*")
              .eq("course_id", courseId)
              .range(from, to);

            if (error) throw error;
            return data || [];
          }),

          fetchAllRows<AttemptRow>(async (from, to) => {
            const { data, error } = await db
              .from("quiz_attempts")
              .select("*")
              .eq("course_id", courseId)
              .range(from, to);

            if (error) throw error;
            return data || [];
          }),

          fetchAllRows<any>(async (from, to) => {
            const { data, error } = await db
              .from("quiz_course_report_items")
              .select("*")
              .eq("course_id", courseId)
              .order("orden", { ascending: true })
              .range(from, to);

            if (error) throw error;
            return data || [];
          }),

          db
            .from("quiz_course_report_configs")
            .select("*")
            .eq("course_id", courseId)
            .maybeSingle(),
        ]);

        setStudents(studentsData);
        setTests(testsData);
        setCategories(categoriesData);
        setQuestions(questionsData);
        setAttempts(attemptsData);

        setReportItems(
          (reportData || []).map((item: any) => ({
            id: item.id,
            tipo: item.tipo,
            parent_id: item.parent_id,
            orden: item.orden,
            titulo: item.titulo || "",
            contenido: item.contenido || "",
            ...(item.tipo === "TABLA"
              ? { table_data: normalizeTableData(item.table_data) }
              : {}),
          }))
        );

        if (configData?.error) throw configData.error;

        setConclusionesTexto(jsonToText(configData?.data?.conclusiones));
        setRecomendacionesTexto(jsonToText(configData?.data?.recomendaciones));

        setFirmasPdf(
          Array.isArray(configData?.data?.firmas)
            ? configData.data.firmas
            : []
        );

        if (attemptsData.length > 0) {
          const attemptIds = attemptsData.map((a) => a.id);

          const attemptQuestionsData = await fetchAllRows<AttemptQuestionRow>(
            async (from, to) => {
              const { data, error } = await db
                .from("quiz_attempt_questions")
                .select("*")
                .in("attempt_id", attemptIds)
                .range(from, to);

              if (error) throw error;
              return data || [];
            }
          );

          setAttemptQuestions(attemptQuestionsData);

          if (attemptQuestionsData.length > 0) {
            const attemptQuestionIds = attemptQuestionsData.map((q) => q.id);

            const answersData = await fetchAllRows<AttemptAnswerRow>(
              async (from, to) => {
                const { data, error } = await db
                  .from("quiz_attempt_answers")
                  .select("*")
                  .in("attempt_question_id", attemptQuestionIds)
                  .range(from, to);

                if (error) throw error;
                return data || [];
              }
            );

            setAnswers(answersData);
          } else {
            setAnswers([]);
          }
        } else {
          setAttemptQuestions([]);
          setAnswers([]);
        }
      } catch (error: any) {
        toast.error(error.message || "Error cargando dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [courseId]);

  const studentsMap = useMemo(
    () => new Map(students.map((s) => [s.id, s])),
    [students]
  );

  const testsMap = useMemo(() => new Map(tests.map((t) => [t.id, t])), [tests]);

  const categoriesMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const questionsMap = useMemo(
    () => new Map(questions.map((q) => [q.id, q])),
    [questions]
  );

  const getStudentName = (id: string) => {
    const s = studentsMap.get(id);
    return s
      ? `${s.nombres} ${s.apellidos}`.trim()
      : "Estudiante no encontrado";
  };

  const getCategoryName = (id: string) => {
    const category = categoriesMap.get(id);
    if (!category) return "Sin categoría";

    if (!category.parent_id) return category.nombre;

    const parent = categoriesMap.get(category.parent_id);
    return parent ? `${parent.nombre} / ${category.nombre}` : category.nombre;
  };

  const attemptsFiltrados = useMemo(() => {
    if (selectedTestFilter === "todos") return attempts;
    return attempts.filter((attempt) => attempt.test_id === selectedTestFilter);
  }, [attempts, selectedTestFilter]);

  const attemptIdsFiltrados = useMemo(
    () => new Set(attemptsFiltrados.map((attempt) => attempt.id)),
    [attemptsFiltrados]
  );

  const attemptQuestionsFiltradas = useMemo(() => {
    return attemptQuestions.filter((question) =>
      attemptIdsFiltrados.has(question.attempt_id)
    );
  }, [attemptQuestions, attemptIdsFiltrados]);

  const attemptQuestionIdsFiltrados = useMemo(
    () => new Set(attemptQuestionsFiltradas.map((question) => question.id)),
    [attemptQuestionsFiltradas]
  );

  const answersFiltradas = useMemo(() => {
    return answers.filter((answer) =>
      attemptQuestionIdsFiltrados.has(answer.attempt_question_id)
    );
  }, [answers, attemptQuestionIdsFiltrados]);

  const questionIdsFiltrados = useMemo(
    () =>
      new Set(
        attemptQuestionsFiltradas.map((question) => question.question_id)
      ),
    [attemptQuestionsFiltradas]
  );

  const questionsFiltradas = useMemo(() => {
    if (selectedTestFilter === "todos") return questions;
    return questions.filter((question) => questionIdsFiltrados.has(question.id));
  }, [questions, questionIdsFiltrados, selectedTestFilter]);

  const kpis = useMemo(() => {
    const finished = attemptsFiltrados.filter((a) => a.finished_at);
    const scores = finished.map((a) => safeNumber(a.score_percent));

    const promedioGeneral = average(scores);
    const aprobados = scores.filter((score) => score >= PASS_SCORE).length;

    const correctas = answersFiltradas.filter((a) => a.es_correcta === true).length;
    const aciertoGlobal = percent(correctas, answersFiltradas.length);

    return {
      totalEstudiantes: students.length,
      totalTests: selectedTestFilter === "todos" ? tests.length : 1,
      totalIntentos: attemptsFiltrados.length,
      promedioGeneral,
      porcentajeAprobacion: percent(aprobados, scores.length),
      aciertoGlobal,
      totalPreguntas: questionsFiltradas.length,
    };
  }, [
    students.length,
    tests.length,
    attemptsFiltrados,
    answersFiltradas,
    questionsFiltradas.length,
    selectedTestFilter,
  ]);

  const rendimientoPorTest = useMemo<DashboardItem[]>(() => {
    const baseTests =
      selectedTestFilter === "todos"
        ? tests
        : tests.filter((test) => test.id === selectedTestFilter);

    return baseTests.map((test) => {
      const testAttempts = attempts.filter((a) => a.test_id === test.id);
      const scores = testAttempts
        .filter((a) => a.finished_at)
        .map((a) => safeNumber(a.score_percent));

      return {
        id: test.id,
        nombre: test.nombre,
        promedio: average(scores),
        totalRespuestas: testAttempts.length,
        totalAciertos: scores.filter((score) => score >= test.nota_aprobacion)
          .length,
      };
    });
  }, [tests, attempts, selectedTestFilter]);

  const rendimientoPorCategoria = useMemo<DashboardItem[]>(() => {
    const grouped = new Map<string, DashboardItem>();
    const attemptQuestionMap = new Map(
      attemptQuestionsFiltradas.map((aq) => [aq.id, aq])
    );

    for (const answer of answersFiltradas) {
      const attemptQuestion = attemptQuestionMap.get(answer.attempt_question_id);
      if (!attemptQuestion) continue;

      const question = questionsMap.get(attemptQuestion.question_id);
      if (!question) continue;

      const categoryId = question.category_id;
      const categoryName = getCategoryName(categoryId);

      if (!grouped.has(categoryId)) {
        grouped.set(categoryId, {
          id: categoryId,
          nombre: categoryName,
          promedio: 0,
          totalRespuestas: 0,
          totalAciertos: 0,
        });
      }

      const item = grouped.get(categoryId)!;
      item.totalRespuestas += 1;
      if (answer.es_correcta === true) item.totalAciertos += 1;
    }

    return Array.from(grouped.values()).map((item) => ({
      ...item,
      promedio: percent(item.totalAciertos, item.totalRespuestas),
    }));
  }, [answersFiltradas, attemptQuestionsFiltradas, questionsMap, categoriesMap]);

  const preguntasStats = useMemo<QuestionStat[]>(() => {
    const grouped = new Map<
      string,
      { question: QuestionRow; total: number; aciertos: number }
    >();

    const attemptQuestionMap = new Map(
      attemptQuestionsFiltradas.map((aq) => [aq.id, aq])
    );

    for (const answer of answersFiltradas) {
      const attemptQuestion = attemptQuestionMap.get(answer.attempt_question_id);
      if (!attemptQuestion) continue;

      const question = questionsMap.get(attemptQuestion.question_id);
      if (!question) continue;

      if (!grouped.has(question.id)) {
        grouped.set(question.id, {
          question,
          total: 0,
          aciertos: 0,
        });
      }

      const item = grouped.get(question.id)!;
      item.total += 1;
      if (answer.es_correcta === true) item.aciertos += 1;
    }

    return Array.from(grouped.values()).map((item) => ({
      ...item,
      porcentaje: percent(item.aciertos, item.total),
    }));
  }, [answersFiltradas, attemptQuestionsFiltradas, questionsMap]);

  const preguntasDificiles = useMemo(
    () => [...preguntasStats].sort((a, b) => a.porcentaje - b.porcentaje),
    [preguntasStats]
  );

  const preguntasFaciles = useMemo(
    () => [...preguntasStats].sort((a, b) => b.porcentaje - a.porcentaje),
    [preguntasStats]
  );

  const rankingEstudiantes = useMemo(() => {
    const grouped = new Map<
      string,
      {
        student_id: string;
        promedio: number;
        totalIntentos: number;
      }
    >();

    for (const attempt of attemptsFiltrados.filter((a) => a.finished_at)) {
      const current = grouped.get(attempt.student_id);
      const score = safeNumber(attempt.score_percent);

      if (!current) {
        grouped.set(attempt.student_id, {
          student_id: attempt.student_id,
          promedio: score,
          totalIntentos: 1,
        });
      } else {
        const total = current.totalIntentos + 1;
        current.promedio =
          (current.promedio * current.totalIntentos + score) / total;
        current.totalIntentos = total;
      }
    }

    return Array.from(grouped.values());
  }, [attemptsFiltrados]);

  const topEstudiantes = useMemo(
    () => [...rankingEstudiantes].sort((a, b) => b.promedio - a.promedio),
    [rankingEstudiantes]
  );

  const peoresEstudiantes = useMemo(
    () => [...rankingEstudiantes].sort((a, b) => a.promedio - b.promedio),
    [rankingEstudiantes]
  );

  const openRange = (range: string) => {
    const inRange = attemptsFiltrados.filter((attempt) => {
      const score = attempt.score_percent;

      if (range === "Sin nota") return score == null;
      if (range === "0-49") return safeNumber(score) < 50;
      if (range === "50-69") return safeNumber(score) >= 50 && safeNumber(score) < 70;
      if (range === "70-84") return safeNumber(score) >= 70 && safeNumber(score) < 85;
      if (range === "85-100") return safeNumber(score) >= 85;

      return false;
    });

    setSidebar({
      open: true,
      title: `Estudiantes en rango ${range}`,
      subtitle: `${inRange.length} intento(s)`,
      items: inRange.map((a) => ({
        id: a.id,
        primary: getStudentName(a.student_id),
        secondary: testsMap.get(a.test_id)?.nombre || "Test no encontrado",
        badge: `${safeNumber(a.score_percent).toFixed(2)}%`,
        variant: safeNumber(a.score_percent) >= PASS_SCORE ? "success" : "danger",
      })),
    });
  };

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
      titulo: tipo === "TABLA" ? "Nueva tabla" : "",
      contenido: "",
      ...(tipo === "TABLA"
        ? {
            table_data: normalizeTableData(),
          }
        : {}),
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
      titulo: newRootType === "TABLA" ? "Nueva tabla" : "",
      contenido: "",
      ...(newRootType === "TABLA"
        ? {
            table_data: normalizeTableData(),
          }
        : {}),
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
    const collectChildrenIds = (
      items: ReportItem[],
      parentId: string
    ): string[] => {
      const direct = items
        .filter((i) => i.parent_id === parentId)
        .map((i) => i.id);

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
      siblings = reportItems.filter(
        (i) => i.parent_id === targetId && i.id !== draggedId
      );
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

  const updateFirmaPdf = (
    index: number,
    field: keyof FirmaPdf,
    value: string
  ) => {
    setFirmasPdf((prev) =>
      prev.map((firma, i) => (i === index ? { ...firma, [field]: value } : firma))
    );
  };

  const addFirmaPdf = () => {
    setFirmasPdf((prev) => [...prev, { nombre: "", cargo: "" }]);
  };

  const removeFirmaPdf = (index: number) => {
    setFirmasPdf((prev) => prev.filter((_, i) => i !== index));
  };

  const saveReportConfig = async () => {
    if (!courseId) return;

    await db.from("quiz_course_report_items").delete().eq("course_id", courseId);

    if (reportItems.length > 0) {
      const rows = reportItems.map((item) => ({
        id: item.id,
        course_id: courseId,
        tipo: item.tipo,
        parent_id: item.parent_id,
        orden: item.orden,
        titulo: item.titulo || "",
        contenido: item.contenido || "",
        table_data:
          item.tipo === "TABLA"
            ? normalizeTableData(item.table_data)
            : item.table_data || null,
      }));

      const { error } = await db.from("quiz_course_report_items").insert(rows);
      if (error) throw error;
    }

    const { error: configError } = await db
      .from("quiz_course_report_configs")
      .upsert({
        course_id: courseId,
        conclusiones: textToArray(conclusionesTexto),
        recomendaciones: textToArray(recomendacionesTexto),
        firmas: firmasPdf.filter(
          (firma) => firma.nombre.trim() || firma.cargo.trim()
        ),
        updated_at: new Date().toISOString(),
      });

    if (configError) throw configError;
  };

  const handleGeneratePdf = async () => {
    try {
      await saveReportConfig();

      toast.info(
        "Configuración guardada. En el siguiente paso conectamos quizPdfGenerator.ts."
      );
    } catch (error: any) {
      toast.error(error.message || "No se pudo guardar la configuración");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <p className="text-sm text-slate-500">Cargando dashboard...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <Card>
          <CardContent className="p-8 text-center text-slate-500">
            No se encontró el curso.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <HeaderActions
        title={`Dashboard del curso: ${course.nombre}`}
        subtitle={`${course.periodo || "Sin periodo"} · ${
          course.docente || "Sin docente"
        }`}
        badge={course.paralelo || undefined}
        onBack={() => navigate("/tests")}
        onGeneratePdf={() => setShowPdfModal(true)}
      />

      <main className="container mx-auto space-y-6 px-4 py-6">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="grid gap-3 md:grid-cols-[320px_1fr] md:items-end">
              <div>
                <Label>Filtrar por test</Label>
                <Select
                  value={selectedTestFilter}
                  onValueChange={setSelectedTestFilter}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="todos">
                      Todos los tests del curso
                    </SelectItem>

                    {tests.map((test) => (
                      <SelectItem key={test.id} value={test.id}>
                        {test.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <p className="text-sm text-slate-500">
                Los indicadores, preguntas, ranking y distribución se recalculan
                según el test seleccionado.
              </p>
            </div>
          </CardContent>
        </Card>

        <KPICards
          totalEstudiantes={kpis.totalEstudiantes}
          totalTests={kpis.totalTests}
          totalIntentos={kpis.totalIntentos}
          promedioGeneral={kpis.promedioGeneral}
          porcentajeAprobacion={kpis.porcentajeAprobacion}
          aciertoGlobal={kpis.aciertoGlobal}
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <DistributionCard attempts={attemptsFiltrados} onOpenRange={openRange} />

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#002E45]">
                <Target className="h-5 w-5" />
                Resumen del filtro
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="rounded-xl bg-white p-4 border">
                <p className="text-sm text-slate-500">Preguntas</p>
                <p className="text-3xl font-black text-[#002E45]">
                  {kpis.totalPreguntas}
                </p>
              </div>

              <div className="rounded-xl bg-white p-4 border">
                <p className="text-sm text-slate-500">Respuestas evaluadas</p>
                <p className="text-3xl font-black text-[#002E45]">
                  {answersFiltradas.length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <PerformanceList
            title="Rendimiento por test"
            icon={<ClipboardList className="h-5 w-5" />}
            items={rendimientoPorTest}
          />

          <PerformanceList
            title="Rendimiento por categoría"
            icon={<BookOpen className="h-5 w-5" />}
            items={rendimientoPorCategoria}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <QuestionsCard
            title="Preguntas más difíciles"
            icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
            items={preguntasDificiles}
            variant="destructive"
          />

          <QuestionsCard
            title="Preguntas con mejor desempeño"
            icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
            items={preguntasFaciles}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <RankingCard
            title="Mejores estudiantes"
            icon={<Trophy className="h-5 w-5 text-[#FF6900]" />}
            items={topEstudiantes}
            getStudentName={getStudentName}
          />

          <RankingCard
            title="Estudiantes con menor promedio"
            icon={<XCircle className="h-5 w-5 text-red-600" />}
            items={peoresEstudiantes}
            getStudentName={getStudentName}
          />
        </div>
      </main>

      <SidebarPanel
        sidebar={sidebar}
        onClose={() => setSidebar({ open: false, title: "", items: [] })}
      />

      <Dialog open={showPdfModal} onOpenChange={setShowPdfModal}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#002E45]">
              Generar informe PDF del curso
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-[#002E45]">
                  Configuración del informe
                </CardTitle>

                <CardDescription>
                  El informe se generará usando los datos del filtro seleccionado.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div>
                  <Label>Test incluido en el informe</Label>
                  <Select
                    value={selectedTestFilter}
                    onValueChange={setSelectedTestFilter}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="todos">
                        Todos los tests del curso
                      </SelectItem>

                      {tests.map((test) => (
                        <SelectItem key={test.id} value={test.id}>
                          {test.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-base text-[#002E45]">
                  Conclusiones y recomendaciones
                </CardTitle>
              </CardHeader>

              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Conclusiones</Label>
                  <Textarea
                    value={conclusionesTexto}
                    onChange={(e) => setConclusionesTexto(e.target.value)}
                    placeholder="Escriba las conclusiones. Puede separar cada conclusión en una línea."
                    className="min-h-[140px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Recomendaciones</Label>
                  <Textarea
                    value={recomendacionesTexto}
                    onChange={(e) => setRecomendacionesTexto(e.target.value)}
                    placeholder="Escriba las recomendaciones. Puede separar cada recomendación en una línea."
                    className="min-h-[140px]"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-[#002E45]">
                  <BookOpen className="h-5 w-5 text-[#FF6900]" />
                  Estructura del informe
                </CardTitle>

                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => setAddRootOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                  Agregar raíz
                </Button>
              </CardHeader>

              <CardContent>
                {reportTree.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <BookOpen className="mx-auto mb-2 h-8 w-8 opacity-30" />
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

            <Card className="border-slate-200">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-[#002E45]">
                    Firmas del informe
                  </CardTitle>

                  <Button variant="outline" size="sm" onClick={addFirmaPdf}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar firma
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {firmasPdf.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No se han agregado firmas. El informe se generará sin bloque
                    de firmas.
                  </p>
                ) : (
                  firmasPdf.map((firma, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 items-end gap-3 rounded-xl border bg-white p-3 md:grid-cols-[1fr_1fr_auto]"
                    >
                      <div className="space-y-1">
                        <Label>Nombre</Label>
                        <Input
                          value={firma.nombre}
                          placeholder="Ej. Mgs. Nombre Apellido"
                          onChange={(e) =>
                            updateFirmaPdf(index, "nombre", e.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <Label>Cargo</Label>
                        <Input
                          value={firma.cargo}
                          placeholder="Ej. Director/a"
                          onChange={(e) =>
                            updateFirmaPdf(index, "cargo", e.target.value)
                          }
                        />
                      </div>

                      <Button
                        variant="outline"
                        className="text-red-600"
                        onClick={() => removeFirmaPdf(index)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPdfModal(false)}>
              Cerrar
            </Button>

            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await saveReportConfig();
                  toast.success("Configuración guardada");
                } catch (error: any) {
                  toast.error(error.message || "No se pudo guardar");
                }
              }}
            >
              <Save className="mr-2 h-4 w-4" />
              Guardar
            </Button>

            <Button
              className="bg-[#002E45] hover:bg-[#001f31]"
              onClick={handleGeneratePdf}
            >
              <FileText className="mr-2 h-4 w-4" />
              Generar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addRootOpen} onOpenChange={setAddRootOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar elementos raíz</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Tipo de elemento</Label>
              <Select
                value={newRootType}
                onValueChange={(value) =>
                  setNewRootType(value as ReportItemType)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {Object.entries(REPORT_ITEM_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Cantidad</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={newRootQuantity}
                onChange={(e) =>
                  setNewRootQuantity(Number(e.target.value || 1))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddRootOpen(false)}>
              Cancelar
            </Button>

            <Button
              className="bg-[#002E45] hover:bg-[#001f31]"
              onClick={handleAddRootNodes}
            >
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
"use client";

import { useMemo,useState } from "react";
import { X, Users, BookOpen } from "lucide-react";
import { Item } from "@/types/dashboard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

/* =========================
   Tipos
========================= */
interface DocenteRaw {
  docente: string;
  promedio: number;
  periodos?: string[];
}

interface AsignaturaRaw {
  nombre: string;
  docentes: DocenteRaw[];
}

interface DocenteAgrupado {
  docente: string;
  promedio: number;
  brecha: number;
  periodos: string[];
}

interface AsignaturaAgrupada {
  nombre: string;
  promedio: number;
  brecha: number;
  docentes: DocenteAgrupado[];
  docentesCount: number;
  min: number;
  max: number;
}

interface DetailPanelProps {
  item: Item | null;
  type: "componente" | "subcomponente" | "tema";
  docentes: string[];
  asignaturas?: AsignaturaRaw[];
  onClose: () => void;
  onDocentesClick: () => void;
}

/* =========================
   Recomendaciones
========================= */
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
/* =========================
   Utils
========================= */
function pickRandom<T>(arr: T[], count: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, count);
}

function getColorByPromedio(p: number) {
  if (p < 60) return "#FF6900";
  if (p < 70) return "#da8b33";
  return "#002E45";
}

/* =========================
   Componente
========================= */
export function DetailPanel({
  item,
  type,
  docentes,
  asignaturas = [],
  onClose,
  onDocentesClick,
}: DetailPanelProps) {
  if (!item) return null;

  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<string | null>(null);
  /* =========================
     Estado global
  ========================= */
  const getStatus = (p: number) => {
    if (p < 60) return "high";
    if (p < 70) return "medium";
    return "low";
  };

  const statusKey = getStatus(item.promedio);

  const statusStyles = {
    high: { label: "Crítico", color: "#FF6900", bg: "#FF690015" },
    medium: { label: "Requiere atención", color: "#da8b33", bg: "#da8b3315" },
    low: { label: "Satisfactorio", color: "#002E45", bg: "#002E4515" },
  }[statusKey];

  const typeLabels = {
    componente: "Componente",
    subcomponente: "Subcomponente",
    tema: "Tema",
  };

  const periodosDisponibles = useMemo(() => {
    const set = new Set<string>();

    asignaturas.forEach(a =>
      a.docentes.forEach(d =>
        (d.periodos ?? []).forEach(p => set.add(p))
      )
    );

    return Array.from(set).sort();
  }, [asignaturas]);

  /* =========================
     AGRUPACIÓN REAL
  ========================= */
  const asignaturasAgrupadas: AsignaturaAgrupada[] = useMemo(() => {
    const mapAsignaturas = new Map<string, DocenteRaw[]>();

    asignaturas.forEach(a => {
      const docentesFiltrados = periodoSeleccionado
        ? a.docentes.filter(d => d.periodos?.includes(periodoSeleccionado))
        : a.docentes;

      if (!docentesFiltrados.length) return;

      if (!mapAsignaturas.has(a.nombre)) {
        mapAsignaturas.set(a.nombre, []);
      }

      mapAsignaturas.get(a.nombre)!.push(...docentesFiltrados);
    });

    return Array.from(mapAsignaturas.entries()).map(([nombre, docentesRaw]) => {
      const mapDocentes = new Map<string, DocenteRaw[]>();

      docentesRaw.forEach(d => {
        if (!mapDocentes.has(d.docente)) {
          mapDocentes.set(d.docente, []);
        }
        mapDocentes.get(d.docente)!.push(d);
      });

      const docentesAgrupados: DocenteAgrupado[] = Array.from(mapDocentes.entries()).map(
        ([docente, registros]) => {
          const promedio =
            registros.reduce((s, r) => s + r.promedio, 0) / registros.length;

          return {
            docente,
            promedio,
            brecha: 100 - promedio,
            periodos: [], // ← ya no se usan
          };
        }
      );

      const promedios = docentesAgrupados.map(d => d.promedio);

      const promedioAsignatura =
        promedios.reduce((s, v) => s + v, 0) / promedios.length;

      return {
        nombre,
        docentes: docentesAgrupados,
        docentesCount: docentesAgrupados.length,
        promedio: promedioAsignatura,
        brecha: 100 - promedioAsignatura,
        min: Math.min(...promedios),
        max: Math.max(...promedios),
      };
    });
  }, [asignaturas, periodoSeleccionado]);

  /* =========================
     Recomendaciones
  ========================= */
  const recomendaciones = pickRandom(
    RECOMMENDATIONS[statusKey],
    statusKey === "high" ? 3 : 2
  );

  return (
    <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white border-l border-[#1c3247]/30 shadow-2xl z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-[#1c3247]/30 z-10">
        <div className="flex items-center justify-between p-4">
          <div>
            <span className="text-xs font-medium uppercase text-[#264763]">
              {typeLabels[type]}
            </span>
            <h2 className="text-xl font-bold text-[#002E45]">
              {item.nombre}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-8">
        {/* PROMEDIO GLOBAL */}
        <div
          className="text-center py-8 rounded-xl"
          style={{ backgroundColor: statusStyles.bg }}
        >
          <p className="text-sm mb-2">Promedio global</p>
          <p
            className="text-5xl font-extrabold"
            style={{ color: statusStyles.color }}
          >
            {item.promedio.toFixed(1)}%
          </p>
          <p className="text-sm mt-2">
            Brecha:{" "}
            <strong>{(100 - item.promedio).toFixed(1)}%</strong>
          </p>
        </div>

        {/* ASIGNATURAS */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#002E45] flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Resumen por asignaturas
            </h3>

            <Select
              value={periodoSeleccionado ?? "all"}
              onValueChange={v => setPeriodoSeleccionado(v === "all" ? null : v)}
            >
              <SelectTrigger className="h-9 w-[240px] text-sm">
                <SelectValue placeholder="Período" />
              </SelectTrigger>

              <SelectContent className="z-[100]">
                <SelectItem value="all">Todos</SelectItem>
                {periodosDisponibles.map(p => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
          </div>
          {periodoSeleccionado && (
            <div className="mt-2">
              <Badge
                variant="outline"
                className="text-xs border-[#002E45]/40 text-[#002E45] bg-[#002E45]/5"
              >
                Período seleccionado: {periodoSeleccionado}
              </Badge>
            </div>
          )}

          <div className="space-y-3">
            {asignaturasAgrupadas.map((a, i) => (
              <details key={i} className="rounded-lg border">
                <summary className="cursor-pointer list-none p-3 hover:bg-[#002E45]/5">
                  <p className="font-semibold text-[#002E45]">{a.nombre}</p>
                  <p className="text-xs">
                    Promedio: <strong>{a.promedio.toFixed(1)}%</strong> ·
                    Brecha:{" "}
                    <strong style={{ color: getColorByPromedio(a.promedio) }}>
                      {a.brecha.toFixed(1)}%
                    </strong>
                  </p>
                </summary>

                <div className="px-4 pb-4 space-y-3">
                  {a.docentes.map((d, di) => (
                    <div
                      key={di}
                      className="pl-3 border-l border-[#002E45]/30"
                    >
                      <p className="text-sm font-medium">{d.docente}</p>
                      <p className="text-xs">
                        Promedio:{" "}
                        <strong>{d.promedio.toFixed(1)}%</strong> ·
                        Brecha:{" "}
                        <strong style={{ color: getColorByPromedio(d.promedio) }}>
                          {d.brecha.toFixed(1)}%
                        </strong>
                      </p>
                      
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* RECOMENDACIONES */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-[#002E45]">
            Recomendaciones
          </h3>
          <div className="space-y-2">
            {recomendaciones.map((r, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border"
                style={{
                  backgroundColor: statusStyles.bg,
                  borderColor: statusStyles.color + "30",
                  color: statusStyles.color,
                }}
              >
                {r}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

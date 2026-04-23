import { useMemo } from "react";
import { LayoutGrid, Users, BookOpen } from "lucide-react";

import { KPIHero } from "./KPIHero";
import { KPICard } from "./KPICard";
import { DashboardResponse } from "@/types/dashboard";
import { Badge } from "@/components/ui/badge";

interface DashboardKPIsProps {
  data: DashboardResponse;
}

export function DashboardKPIs({ data }: DashboardKPIsProps) {
  const componentes = data.por_componente ?? [];
  const subcomponentes = data.por_subcomponente ?? [];
  const temas = data.por_tema ?? [];

  /* =========================
     Docentes únicos reales
  ========================= */
  const docentesUnicos = useMemo(() => {
    if (!data?.docentes_global_detalle) return [];
    const set = new Set<string>();

    data.docentes_global_detalle.forEach((d) => {
      if (d.docente?.trim()) {
        set.add(d.docente.trim());
      }
    });

    return Array.from(set);
  }, [data]);

  /* =========================
     Totales esperados
     Ajusta estos campos si en tu API vienen con otros nombres
  ========================= */
  const totalComponentes = 7;
  
  const totalSubcomponentes = 28;

  const totalTemas = 253;

  const totalDocentes = useMemo(() => {
    return (
      data.total_docentes ??
      data.numero_docentes ??
      docentesUnicos.length
    );
  }, [data, docentesUnicos.length]);

  const asignaturasEvaluadasActual = 16

  const totalAsignaturasEvaluadas = 52

  /* =========================
     Trend por aprobación
  ========================= */
  const approvalTrend =
    data.porcentaje_aprobados >= 80
      ? "up"
      : data.porcentaje_aprobados >= 70
      ? "neutral"
      : "down";

  const { peorComponente, mejorComponente } = useMemo(() => {
    if (!componentes.length) {
      return { peorComponente: null, mejorComponente: null };
    }

    const ordenados = [...componentes].sort((a, b) => a.promedio - b.promedio);

    return {
      peorComponente: ordenados[0],
      mejorComponente: ordenados[ordenados.length - 1],
    };
  }, [componentes]);

  const mostrarDocentes = docentesUnicos.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* =========================
          KPI HERO
      ========================= */}
      <div className="lg:col-span-1">
        <KPIHero
          value={data.porcentaje_aprobados}
          label="Aprobación Global"
          trend={approvalTrend}
          description="Porcentaje total de estudiantes aprobados"
          className="
            bg-[#002E45]
            text-white
            border-l-8
            border-[#FF6900]
          "
          valueClassName="text-[#FF6900]"
        >
          <div className="mt-4 pt-3 border-t border-white/20 text-center">
            {typeof data.numero_estudiantes === "number" && (
              <div>
                <p className="text-sm sm:text-base text-white/75 font-medium">
                  Estudiantes evaluados
                </p>
                <p className="text-lg sm:text-xl font-semibold text-white leading-tight">
                  {data.numero_estudiantes}
                </p>
              </div>
            )}
          </div>
        </KPIHero>
      </div>

      {/* =========================
          KPI CARDS
      ========================= */}
      <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* ================= COMPONENTES + SUBCOMPONENTES ================= */}
        <KPICard
          value={`${componentes.length}/${totalComponentes}`}
          label="Componentes"
          icon={<LayoutGrid className="h-5 w-5 text-[#FF6900]" />}
        >
          <div className="mt-4 border-t border-[#002E45]/20 pt-3">
            <p className="text-xl font-medium text-[#264763] mb-1 truncate">
              Subcomponentes
            </p>

            <p className="text-4xl font-extrabold leading-tight tracking-tight text-[#002E45] break-words">
              {subcomponentes.length}/{totalSubcomponentes}
            </p>
          </div>
        </KPICard>

        {/* ================= MEJOR / PEOR COMPONENTE ================= */}
        <KPICard
          value=""
          label="Resultados Componentes"
          icon={<BookOpen className="h-5 w-5 text-[#FF6900]" />}
        >
          {(mejorComponente || peorComponente) && (
            <div className="mt-8 flex flex-col gap-2 w-full border-t border-[#002E45]/20 pt-6">
              {mejorComponente && (
                <Badge
                  variant="outline"
                  title={`Mejor Puntuado: ${mejorComponente.nombre} (${mejorComponente.promedio.toFixed(1)}%)`}
                  className="
                    text-[11px] sm:text-xs
                    py-1.5 px-3
                    w-full
                    justify-start
                    font-medium
                    text-[#002E45]
                    border-[#002E45]
                    shadow-none
                    whitespace-normal
                    text-left
                  "
                >
                  ↑ Mejor Puntuado: {mejorComponente.nombre} ({mejorComponente.promedio.toFixed(1)}%)
                </Badge>
              )}

              {peorComponente && (
                <Badge
                  variant="outline"
                  title={`Menor Puntuado: ${peorComponente.nombre} (${peorComponente.promedio.toFixed(1)}%)`}
                  className="
                    text-[11px] sm:text-xs
                    py-1.5 px-3
                    w-full
                    justify-start
                    font-medium
                    text-[#FF6900]
                    border-[#FF6900]
                    shadow-none
                    whitespace-normal
                    text-left
                  "
                >
                  ↓ Menor Puntuado: {peorComponente.nombre} ({peorComponente.promedio.toFixed(1)}%)
                </Badge>
              )}
            </div>
          )}
        </KPICard>

        {/* ================= DOCENTES / ASIGNATURAS ================= */}
        <KPICard
          value={
            mostrarDocentes
              ? `${docentesUnicos.length}/${totalDocentes}`
              : `${asignaturasEvaluadasActual}/${totalAsignaturasEvaluadas}`
          }
          label={mostrarDocentes ? "Docentes Evaluados" : "Asignaturas Evaluadas"}
          icon={<Users className="h-5 w-5 text-[#FF6900]" />}
        >
          <div className="mt-4 border-t border-[#002E45]/20 pt-3">
            <p className="text-xl font-medium text-[#264763] mb-1 truncate">
              Temas
            </p>

            <p className="text-4xl font-extrabold leading-tight tracking-tight text-[#002E45] break-words">
              {temas.length}/{totalTemas}
            </p>
          </div>
        </KPICard>
      </div>
    </div>
  );
}
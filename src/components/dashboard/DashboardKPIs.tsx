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
    data.docentes_global_detalle.forEach(d => {
      if (d.docente) set.add(d.docente.trim());
    });
    return Array.from(set);
  }, [data]);

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

    const ordenados = [...componentes].sort(
      (a, b) => a.promedio - b.promedio
    );

    return {
      peorComponente: ordenados[0],
      mejorComponente: ordenados[ordenados.length - 1],
    };
  }, [componentes]);

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
            border-l-4
            border-[#FF6900]
          "
        >
          {typeof data.numero_estudiantes === "number" && (
            <div className="mt-3 pt-2 border-t border-white/20 text-center">
              <p className="text-xs text-white/70">
                Estudiantes aprobados
              </p>
              <p className="text-sm font-semibold text-white">
                {data.numero_estudiantes}
              </p>
            </div>
          )}
        </KPIHero>
      </div>

      {/* =========================
          KPI CARDS
      ========================= */}
      <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* ================= COMPONENTES + SUBCOMPONENTES ================= */}
        <KPICard
          value={componentes.length}
          label="Componentes"
          icon={<LayoutGrid className="h-5 w-5 text-[#FF6900]" />}
        >
          <div className="mt-4 border-t border-[#002E45]/20 pt-3">
            <p className="text-xl font-medium text-[#264763] mb-1 truncate">
              Subcomponentes
            </p>

            <p className="text-4xl font-extrabold leading-tight tracking-tight text-[#002E45] break-words">
              {subcomponentes.length}
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
                  "
                >
                  ↑ Mejor Puntuado: Componente {mejorComponente.nombre?.trim()?.charAt(0)} ({mejorComponente.promedio.toFixed(1)}%)
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
                  "
                >
                  ↓ Menor Puntuado: Componente {peorComponente.nombre?.trim()?.charAt(0)} ({peorComponente.promedio.toFixed(1)}%)
                </Badge>
              )}
            </div>
          )}
        </KPICard>

        {/* ================= DOCENTES ================= */}
        <KPICard
          value={docentesUnicos.length}
          label="Docentes Evaluados"
          icon={<Users className="h-5 w-5 text-[#FF6900]" />}          
        >
          <div className="mt-4 border-t border-[#002E45]/20 pt-3">
            <p className="text-xl font-medium text-[#264763] mb-1 truncate">
              Temas
            </p>

            <p className="text-4xl font-extrabold leading-tight tracking-tight text-[#002E45] break-words">
              {temas.length}
            </p>
            
          </div>
        </KPICard>        
      </div>
    </div>
  );
}

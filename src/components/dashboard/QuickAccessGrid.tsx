import { Item } from "@/types/dashboard";
import { ChevronRight, Users } from "lucide-react";

interface QuickAccessGridProps {
  title: string;
  items: Item[];
  type: "componente" | "subcomponente" | "tema";
  docentesMap: Record<string, string[]> | null;
  onItemClick?: (item: Item) => void;
  maxItems?: number;
}

export function QuickAccessGrid({
  title,
  items,
  type,
  docentesMap,
  onItemClick,
  maxItems = 6,
}: QuickAccessGridProps) {
  const safeDocentesMap = docentesMap ?? {};

  /* =========================
     ORDENAR: MAYOR → MENOR
  ========================= */
  const displayItems = [...items]
    .sort((a, b) => b.promedio - a.promedio)
    .slice(0, maxItems);

  /* =========================
     STATUS / COLORES
  ========================= */
  const getStatusStyles = (promedio: number) => {
    if (promedio < 60) {
      return {
        badge: "bg-red-100 text-red-700 border-red-300",
        percent: "text-red-700",
        bar: "bg-red-500",
        label: "Crítico",
      };
    }

    if (promedio < 70) {
      return {
        badge: "bg-[#FF6900]/10 text-[#FF6900] border-[#FF6900]/40",
        percent: "text-[#FF6900]",
        bar: "bg-[#FF6900]",
        label: "Atención",
      };
    }

    return {
      badge: "bg-green-100 text-green-700 border-green-300",
      percent: "text-green-700",
      bar: "bg-green-600",
      label: "Óptimo",
    };
  };

  return (
    <section className="space-y-3 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#002E45]">
          {title}
          <span className="ml-2 text-sm font-normal text-[#222223]/70">
            ({items.length} total)
          </span>
        </h2>
      </div>

      {/* Lista */}
      <div className="divide-y divide-[#1c3247]/15 rounded-xl border border-[#1c3247]/20 bg-white">
        {displayItems.map((item) => {
          const status = getStatusStyles(item.promedio);
          const docentesCount = safeDocentesMap[item.id]?.length || 0;

          return (
            <button
              key={item.id}
              onClick={() => onItemClick?.(item)}
              className="
                w-full text-left
                px-4 py-3
                flex items-center justify-between gap-4
                hover:bg-[#002E45]/5
                transition-colors
              "
            >
              {/* IZQUIERDA */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#222223] truncate">
                  {item.nombre}
                </p>

                <div className="flex items-center gap-3 mt-1 text-xs text-[#222223]/70">
                  <span
                    className={`
                      px-2 py-0.5 rounded-md border text-[11px] font-semibold
                      ${status.badge}
                    `}
                  >
                    {status.label}
                  </span>
                </div>

                {/* BARRA DE PROGRESO */}
                <div className="mt-2 flex items-center gap-3">
                  {/* ESPACIO FIJO PARA DOCENTES (SIEMPRE EXISTE) */}
                  <div className="w-[48px] flex items-center justify-start">
                    {docentesCount > 0 && (
                      <span className="flex items-center gap-1 text-xs text-[#222223]/70 whitespace-nowrap">
                        <Users className="h-3 w-3" />
                        {docentesCount}
                      </span>
                    )}
                  </div>

                  {/* BARRA: OCUPA TODO HASTA EL PORCENTAJE */}
                  <div className="flex-1 h-2 rounded-full bg-[#E5E7EB] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${status.bar}`}
                      style={{ width: `${Math.min(item.promedio, 100)}%` }}
                    />
                  </div>
                </div>

              </div>

              {/* DERECHA */}
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-sm font-bold ${status.percent}`}>
                  {item.promedio.toFixed(1)}%
                </span>
                <ChevronRight className="h-4 w-4 text-[#1c3247]/50" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

import { AlertTriangle, ChevronDown } from "lucide-react";
import { Item } from "@/types/dashboard";

type CriticalItem = Item & {
  type: "componente" | "subcomponente" | "tema";
};

interface CriticalAlertSectionProps {
  items: CriticalItem[];
  onItemClick: (item: CriticalItem) => void;
}

export function CriticalAlertSection({
  items,
  onItemClick,
}: CriticalAlertSectionProps) {
  if (items.length === 0) return null;

  const temas = items.filter((i) => i.type === "tema");
  const subcomponentes = items.filter((i) => i.type === "subcomponente");

  const renderItem = (item: CriticalItem) => (
    <button
      key={`${item.type}-${item.id}`}
      onClick={() => onItemClick(item)}
      className="
        w-full text-left
        px-3 py-2 rounded-lg
        bg-white
        border border-[#1c3247]/40
        hover:border-[#FF6900]
        hover:shadow-sm
        transition-all
      "
    >
      <p className="text-sm font-medium text-[#222223] truncate">
        {item.nombre}
      </p>
      <span className="text-xs font-bold text-[#FF6900]">
        {item.promedio.toFixed(1)}%
      </span>
    </button>
  );

  return (
    <div
      className="
        rounded-xl p-4
        bg-[#002E45]/5
        border border-[#FF6900]/40
      "
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-[#FF6900]" />
        <h2 className="font-semibold text-[#002E45]">
          Elementos Críticos – Acceso Rápido
        </h2>
        <span className="text-sm text-[#222223]/70">
          ({items.length} bajo 60%)
        </span>
      </div>

      {/* Acordeones */}
      <div className="space-y-3">
        {/* TEMAS */}
        <details className="group rounded-lg border border-[#1c3247]/30 bg-white">
          <summary
            className="
              cursor-pointer list-none
              flex items-center justify-between
              px-4 py-3
              hover:bg-[#002E45]/5
            "
          >
            <div>
              <p className="text-sm font-semibold text-[#002E45]">
                Temas críticos
              </p>
              <p className="text-xs text-[#222223]/60">
                {temas.length} elementos
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-[#002E45] transition-transform group-open:rotate-180" />
          </summary>

          <div className="px-4 pb-3 pt-1 space-y-2">
            {temas.length === 0 ? (
              <p className="text-xs text-[#222223]/60">
                No hay temas críticos
              </p>
            ) : (
              temas.map(renderItem)
            )}
          </div>
        </details>

        {/* SUBCOMPONENTES */}
        <details className="group rounded-lg border border-[#1c3247]/30 bg-white">
          <summary
            className="
              cursor-pointer list-none
              flex items-center justify-between
              px-4 py-3
              hover:bg-[#002E45]/5
            "
          >
            <div>
              <p className="text-sm font-semibold text-[#002E45]">
                Subcomponentes críticos
              </p>
              <p className="text-xs text-[#222223]/60">
                {subcomponentes.length} elementos
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-[#002E45] transition-transform group-open:rotate-180" />
          </summary>

          <div className="px-4 pb-3 pt-1 space-y-2">
            {subcomponentes.length === 0 ? (
              <p className="text-xs text-[#222223]/60">
                No hay subcomponentes críticos
              </p>
            ) : (
              subcomponentes.map(renderItem)
            )}
          </div>
        </details>
      </div>
    </div>
  );
}

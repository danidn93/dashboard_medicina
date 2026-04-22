interface Option {
  id: string;
  nombre: string;
  componente_id?: string;
}

interface HierarchySelectorProps {
  level: "componentes" | "subcomponentes" | "temas";

  componentes: Option[];
  subcomponentes: Option[];

  componenteActivo?: string;
  subcomponenteActivo?: string;

  onComponenteChange: (id?: string) => void;
  onSubcomponenteChange: (id?: string) => void;
}

function parseOrder(nombre: string): number[] {
  const match = nombre.trim().match(/^(\d+(?:\.\d+)*)/);
  if (!match) return [9999];
  return match[1].split(".").map(n => parseInt(n, 10));
}

function compareHierarchy(a: string, b: string) {
  const pa = parseOrder(a);
  const pb = parseOrder(b);

  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na !== nb) return na - nb;
  }
  return 0;
}

export function HierarchySelector({
  level,
  componentes,
  subcomponentes,
  componenteActivo,
  subcomponenteActivo,
  onComponenteChange,
  onSubcomponenteChange,
}: HierarchySelectorProps) {
  if (level === "componentes") return null;

  const componentesOrdenados = [...(componentes ?? [])].sort((a, b) =>
    compareHierarchy(a.nombre, b.nombre)
  );

  const subcomponentesFiltrados = componenteActivo
    ? [...subcomponentes]
        .filter(s => s.componente_id === componenteActivo)
        .sort((a, b) => compareHierarchy(a.nombre, b.nombre))
    : [];

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
      {/* ========================
          SELECT COMPONENTE
      ======================== */}
      <select
        value={componenteActivo ?? ""}
        onChange={(e) => onComponenteChange(e.target.value || undefined)}
        className="
          w-full sm:w-auto
          px-4 py-3 sm:py-2
          rounded-lg text-sm
          border border-[#1c3247]/30
          text-[#222223]
          focus:outline-none
          focus:border-[#FF6900]
          bg-white
          truncate
        "
      >
        <option value="">Todos los componentes</option>
        {componentesOrdenados.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </select>

      {/* ========================
          SELECT SUBCOMPONENTE
      ======================== */}
      {level === "temas" && (
        <select
          value={subcomponenteActivo ?? ""}
          onChange={(e) => onSubcomponenteChange(e.target.value || undefined)}
          disabled={!componenteActivo}
          className="
            w-full sm:w-auto
            px-4 py-3 sm:py-2
            rounded-lg text-sm
            border border-[#1c3247]/30
            text-[#222223]
            disabled:opacity-50
            focus:outline-none
            focus:border-[#FF6900]
            bg-white
            truncate
          "
        >
          <option value="">
            {componenteActivo
              ? "Todos los subcomponentes"
              : "Seleccione un componente"}
          </option>

          {subcomponentesFiltrados.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

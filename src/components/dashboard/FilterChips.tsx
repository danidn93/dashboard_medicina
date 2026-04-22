type FilterType = "todos" | "criticos" | "atencion" | "optimos";

interface FilterChipsProps {
  active: FilterType;
  onChange: (filter: FilterType) => void;
  counts: {
    todos: number;
    criticos: number;
    atencion: number;
    optimos: number;
  };
}

export function FilterChips({ active, onChange, counts }: FilterChipsProps) {
  const filters: { key: FilterType; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "criticos", label: "Críticos" },
    { key: "atencion", label: "Atención" },
    { key: "optimos", label: "Óptimos" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => {
        const isActive = active === filter.key;

        return (
          <button
            key={filter.key}
            onClick={() => onChange(filter.key)}
            className={`
              px-4 py-2 rounded-full text-sm font-medium transition-all
              border
              ${
                isActive
                  ? `
                    bg-[#002E45]
                    text-white
                    border-[#002E45]
                  `
                  : `
                    bg-white
                    text-[#222223]/70
                    border-[#1c3247]/30
                    hover:border-[#FF6900]
                    hover:text-[#002E45]
                  `
              }
            `}
          >
            {filter.label}
            <span className="ml-2 text-xs opacity-70">
              ({counts[filter.key]})
            </span>
          </button>
        );
      })}
    </div>
  );
}

export type { FilterType };

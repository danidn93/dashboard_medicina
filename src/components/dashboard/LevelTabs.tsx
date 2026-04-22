import { LayoutGrid, Layers, BookOpen } from "lucide-react";

type Level = "componentes" | "subcomponentes" | "temas";

interface LevelTabsProps {
  active: Level;
  onChange: (level: Level) => void;
}

export function LevelTabs({ active, onChange }: LevelTabsProps) {
  const tabs: { key: Level; label: string; icon: React.ElementType }[] = [
    { key: "componentes", label: "Componentes", icon: LayoutGrid },
    { key: "subcomponentes", label: "Subcomponentes", icon: Layers },
    { key: "temas", label: "Temas", icon: BookOpen },
  ];

  return (
    <div
      className="
        flex gap-1 p-1 rounded-xl
        bg-[#002E45]/5
        border border-[#1c3247]/30
      "
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.key;

        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`
              flex-1 flex items-center justify-center gap-2
              px-4 py-3 rounded-lg text-sm font-medium
              transition-all duration-200
              ${
                isActive
                  ? `
                    bg-[#002E45]
                    text-white
                    shadow-sm
                    border border-[#002E45]
                  `
                  : `
                    text-[#222223]/70
                    hover:text-[#002E45]
                    hover:bg-white
                  `
              }
            `}
          >
            <Icon
              className={`
                h-4 w-4
                ${
                  isActive
                    ? "text-[#FF6900]"
                    : "text-[#264763]"
                }
              `}
            />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export type { Level };

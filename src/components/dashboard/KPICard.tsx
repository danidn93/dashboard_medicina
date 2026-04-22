import React from "react";

interface KPICardProps {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
}

export function KPICard({
  value,
  label,
  icon,
  subtitle,
  className = "",
  children,
}: KPICardProps) {
  return (
    <div
      className={`
        p-4 sm:p-5 rounded-xl
        bg-white
        border border-[#1c3247]/20
        shadow-sm
        animate-slide-up
        transition-all
        ${className}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Contenedor principal de texto: crecemos para ocupar el máximo posible */}
        <div className="flex-1 min-w-0">
          <p className="text-xl font-medium text-[#264763] mb-1 truncate">
            {label}
          </p>

          <p className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight text-[#002E45] break-words">
            {value}
          </p>

          {subtitle && (
            <p className="text-xs text-[#222223]/70 mt-1 italic">
              {subtitle}
            </p>
          )}

          {/* Contenedor de Badges: Expandido al 100% del ancho disponible */}
          {children && (
            <div className="mt-4 w-full">
              <div className="flex flex-col gap-2 w-full">
                {children}
              </div>
            </div>
          )}
        </div>

        {/* Icono: se mantiene pequeño y a un lado */}
        {icon && (
          <div className="p-2 rounded-lg bg-[#002E45]/5 text-[#002E45] shrink-0">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
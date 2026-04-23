import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import React from "react";

interface KPIHeroProps {
  value: number;
  label: string;
  trend?: "up" | "down" | "neutral";
  description?: string;
  className?: string;
  valueClassName?: string; // ✅ NUEVO
  children?: React.ReactNode;
}

export function KPIHero({
  value,
  label,
  trend = "neutral",
  description,
  className = "",
  valueClassName = "",
  children,
}: KPIHeroProps) {
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <div
      className={`
        p-8 rounded-xl
        bg-[#002E45]
        text-white
        border-l-4 border-[#FF6900]
        shadow-md
        animate-fade-in
        ${className}
      `}
    >
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-wider text-white/70 mb-2">
            {label}
          </p>

          <div className="flex items-baseline gap-2">
            <span
              className={`
                text-6xl font-extrabold tracking-tight
                ${valueClassName}
              `}
            >
              {value.toFixed(1)}
            </span>

            <span className="text-3xl font-medium text-[#FF6900]">%</span>
          </div>

          {description && (
            <p className="mt-3 text-sm text-white/70 max-w-xs">
              {description}
            </p>
          )}

          {children}
        </div>

        <div className="p-3 rounded-full bg-white/15">
          <TrendIcon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}
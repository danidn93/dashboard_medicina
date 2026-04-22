import { ChevronRight, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import { Item } from "@/types/dashboard";

interface CriticalItemCardProps {
  item: Item;
  type: "componente" | "subcomponente" | "tema";
  onClick?: () => void;
  docentesCount?: number;
}

export function CriticalItemCard({ item, type, onClick, docentesCount }: CriticalItemCardProps) {
  const getStatusInfo = (promedio: number) => {
    if (promedio < 60) return { 
      color: "danger", 
      icon: AlertTriangle, 
      label: "Crítico",
      progressClass: "progress-fill-danger"
    };
    if (promedio < 70) return { 
      color: "warning", 
      icon: AlertCircle, 
      label: "Atención",
      progressClass: "progress-fill-warning"
    };
    return { 
      color: "success", 
      icon: CheckCircle, 
      label: "Óptimo",
      progressClass: "progress-fill-success"
    };
  };

  const status = getStatusInfo(item.promedio);
  const StatusIcon = status.icon;

  const typeLabels = {
    componente: "Componente",
    subcomponente: "Subcomponente",
    tema: "Tema",
  };

  return (
    <div 
      className="critical-item group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {typeLabels[type]}
          </span>
          <h3 className="font-semibold text-foreground mt-1 pr-4 line-clamp-2">
            {item.nombre}
          </h3>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-${status.color}/10 text-${status.color}`}
             style={{
               backgroundColor: status.color === 'danger' ? 'hsl(var(--danger) / 0.1)' : 
                               status.color === 'warning' ? 'hsl(var(--warning) / 0.1)' : 
                               'hsl(var(--success) / 0.1)',
               color: status.color === 'danger' ? 'hsl(var(--danger))' : 
                     status.color === 'warning' ? 'hsl(var(--warning))' : 
                     'hsl(var(--success))'
             }}>
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-end justify-between">
          <span className="text-2xl font-bold text-foreground">
            {item.promedio.toFixed(1)}%
          </span>
          {docentesCount !== undefined && (
            <span className="text-xs text-muted-foreground">
              {docentesCount} docente{docentesCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        <div className="progress-bar">
          <div 
            className={status.progressClass}
            style={{ width: `${Math.min(item.promedio, 100)}%` }}
          />
        </div>
      </div>

      {onClick && (
        <div className="flex items-center justify-end mt-3 text-xs text-muted-foreground group-hover:text-accent transition-colors">
          <span>Ver detalle</span>
          <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      )}
    </div>
  );
}

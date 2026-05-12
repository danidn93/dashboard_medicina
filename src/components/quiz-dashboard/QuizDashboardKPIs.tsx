import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen,
  ClipboardList,
  Target,
  Trophy,
  Users,
} from "lucide-react";

type Props = {
  totalEstudiantes: number;
  totalTests: number;
  totalIntentos: number;
  promedioGeneral: number;
  porcentajeAprobacion: number;
};

export function QuizDashboardKPIs({
  totalEstudiantes,
  totalTests,
  totalIntentos,
  promedioGeneral,
  porcentajeAprobacion,
}: Props) {
  const items = [
    {
      label: "Estudiantes",
      value: totalEstudiantes,
      icon: Users,
    },
    {
      label: "Tests",
      value: totalTests,
      icon: BookOpen,
    },
    {
      label: "Intentos",
      value: totalIntentos,
      icon: ClipboardList,
    },
    {
      label: "Promedio general",
      value: `${promedioGeneral.toFixed(2)}%`,
      icon: Target,
    },
    {
      label: "Aprobación",
      value: `${porcentajeAprobacion.toFixed(2)}%`,
      icon: Trophy,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Card key={item.label} className="border-slate-200 shadow-sm">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className="mt-1 text-2xl font-black text-[#002E45]">
                  {item.value}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#002E45]/10">
                <Icon className="h-6 w-6 text-[#FF6900]" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
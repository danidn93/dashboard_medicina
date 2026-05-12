import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Props = {
  title: string;
  subtitle: string;
  badge?: string;
  onBack: () => void;
  onGeneratePdf?: () => void;
};

export function QuizDashboardHeader({
  title,
  subtitle,
  badge,
  onBack,
  onGeneratePdf,
}: Props) {
  return (
    <div className="border-b bg-white">
      <div className="container mx-auto px-4 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>

              <h1 className="text-2xl font-bold text-[#002E45]">
                {title}
              </h1>

              {badge && <Badge>{badge}</Badge>}
            </div>

            <p className="text-sm text-[#222223]/70">{subtitle}</p>
          </div>

          {onGeneratePdf && (
            <Button
              className="bg-[#002E45] text-white hover:bg-[#001f31]"
              onClick={onGeneratePdf}
            >
              <FileText className="mr-2 h-4 w-4" />
              Generar informe PDF
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
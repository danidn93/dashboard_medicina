import { useMemo } from "react";
import { ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const RANGE_COLORS: Record<string, string> = {
  "0-49": "#B42318",
  "50-69": "#F79009",
  "70-84": "#264763",
  "85-100": "#067647",
  "Sin nota": "#98A2B3",
};

function percent(part: number, total: number) {
  if (!total) return 0;
  return (part / total) * 100;
}

function getScoreRangeLabel(score: number | null | undefined) {
  if (score == null || Number.isNaN(Number(score))) return "Sin nota";
  if (score < 50) return "0-49";
  if (score < 70) return "50-69";
  if (score < 85) return "70-84";
  return "85-100";
}

type AttemptLike = {
  id: string;
  score_percent: number | null;
};

type Props = {
  attempts: AttemptLike[];
  onOpenRange?: (range: string) => void;
};

export function QuizDistributionCard({ attempts, onOpenRange }: Props) {
  const distribution = useMemo(() => {
    const base = {
      "0-49": 0,
      "50-69": 0,
      "70-84": 0,
      "85-100": 0,
      "Sin nota": 0,
    };

    for (const attempt of attempts) {
      const range = getScoreRangeLabel(attempt.score_percent);
      base[range as keyof typeof base] += 1;
    }

    return Object.entries(base).map(([name, value]) => ({
      name,
      value,
      percent: percent(value, attempts.length),
      color: RANGE_COLORS[name],
    }));
  }, [attempts]);

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#002E45]">
          <ClipboardList className="h-5 w-5" />
          Distribución de calificaciones
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex h-12 w-full overflow-hidden rounded-full border">
          {distribution.map((item) => (
            <button
              key={item.name}
              onClick={() => onOpenRange?.(item.name)}
              title={`${item.name}: ${item.value}`}
              className="h-full transition-opacity hover:opacity-80"
              style={{
                width: `${item.percent}%`,
                background: item.color,
                minWidth: item.value > 0 ? "10px" : "0px",
              }}
            />
          ))}
        </div>

        <div className="space-y-3">
          {distribution.map((item) => (
            <button
              key={item.name}
              onClick={() => onOpenRange?.(item.name)}
              className="grid w-full grid-cols-[1fr_120px_90px] items-center rounded-lg border bg-white p-3 hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ background: item.color }}
                />
                <span className="text-[#002E45]">{item.name}</span>
              </div>

              <span className="text-right text-sm text-slate-500">
                {item.percent.toFixed(1)}%
              </span>

              <div className="flex justify-end">
                <Badge variant="outline">{item.value}</Badge>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { WizardData, SheetRole } from "@/pages/CreateVersion";

interface ColumnSelectionStepProps {
  wizardData: WizardData;
  updateWizardData: (data: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}

type RequiredField = {
  key: string;
  label: string;
  required?: boolean;
};

const FIELD_CONFIG: Record<
  Exclude<SheetRole, "IGNORAR" | null>,
  RequiredField[]
> = {
  PREGUNTAS: [
    { key: "NUMERO_PREGUNTA", label: "Número de pregunta", required: true },
    { key: "PREGUNTA_RAW", label: "Pregunta completa", required: true },
    { key: "RESPUESTA_CORRECTA", label: "Respuesta correcta", required: true },
    { key: "COMPONENTE", label: "Componente" },
    { key: "SUBCOMPONENTE", label: "Subcomponente" },
    { key: "TEMA", label: "Tema" },
    { key: "NIVEL", label: "Nivel" },
    { key: "DOCENTE", label: "Docente" },
    { key: "JUSTIFICACION", label: "Justificación" },
  ],
  INTENTOS: [
    { key: "APELLIDOS", label: "Apellido(s)", required: true },
    { key: "NOMBRES", label: "Nombre", required: true },
    { key: "CORREO", label: "Dirección de correo" },
    { key: "ESTADO", label: "Estado" },
    { key: "COMENZADO_EL", label: "Comenzado el" },
    { key: "FINALIZADO_EL", label: "Finalizado" },
    { key: "TIEMPO_REQUERIDO_TEXTO", label: "Tiempo requerido" },
    { key: "CALIFICACION_TOTAL", label: "Calificación total" },
  ],
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const detectResponseColumns = (headers: string[]) => {
  return headers.filter((header) => {
    const normalized = normalizeText(header);
    return /^respuesta\s*\d+$/.test(normalized);
  });
};

const ColumnSelectionStep = ({
  wizardData,
  updateWizardData,
  onNext,
  onBack,
}: ColumnSelectionStepProps) => {
  const { toast } = useToast();

  const getUsedColumns = (sheet: WizardData["sheets"][number]) => {
    return Object.values(sheet.columnMap ?? {}).filter(Boolean);
  };

  const updateColumnMap = (
    visibleSheetIndex: number,
    fieldKey: string,
    columnName: string
  ) => {
    const mappedSheets = wizardData.sheets.filter(
      (s) => s.role && s.role !== "IGNORAR"
    );
    const targetSheet = mappedSheets[visibleSheetIndex];

    const updatedSheets = wizardData.sheets.map((sheet) =>
      sheet.sheetName === targetSheet.sheetName
        ? {
            ...sheet,
            columnMap: {
              ...(sheet.columnMap ?? {}),
              [fieldKey]: columnName,
            },
          }
        : sheet
    );

    updateWizardData({ sheets: updatedSheets });
  };

  const handleNext = () => {
    for (const sheet of wizardData.sheets) {
      if (!sheet.role || sheet.role === "IGNORAR") continue;

      const fields = FIELD_CONFIG[sheet.role];
      const missingRequired = fields.filter(
        (field) => field.required && !sheet.columnMap?.[field.key]
      );

      if (missingRequired.length > 0) {
        toast({
          title: "Mapeo incompleto",
          description: `Faltan campos obligatorios en la hoja "${sheet.sheetName}".`,
          variant: "destructive",
        });
        return;
      }

      if (sheet.role === "INTENTOS") {
        const responseColumns = detectResponseColumns(sheet.headers);
        if (responseColumns.length === 0) {
          toast({
            title: "Columnas de respuestas no detectadas",
            description: `La hoja "${sheet.sheetName}" no contiene columnas del tipo "Respuesta 1", "Respuesta 2", etc.`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    onNext();
  };

  const mappedSheets = wizardData.sheets.filter(
    (s) => s.role && s.role !== "IGNORAR"
  );

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Mapeo de columnas</h2>
        <p className="text-muted-foreground">
          Indica qué columna corresponde a cada campo requerido.
        </p>
      </div>

      <div className="space-y-6">
        {mappedSheets.map((sheet, sheetIndex) => {
          const fields = FIELD_CONFIG[sheet.role!];
          const detectedResponseColumns =
            sheet.role === "INTENTOS"
              ? detectResponseColumns(sheet.headers)
              : [];

          return (
            <Card key={sheet.sheetName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <span>Hoja: {sheet.sheetName}</span>
                  <Badge variant="secondary">{sheet.role}</Badge>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-5">
                {fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label>
                      {field.label}
                      {field.required && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </Label>

                    <Select
                      value={sheet.columnMap?.[field.key] ?? ""}
                      onValueChange={(value) =>
                        updateColumnMap(sheetIndex, field.key, value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona la columna" />
                      </SelectTrigger>

                      <SelectContent>
                        {sheet.headers.map((header) => {
                          const usedColumns = getUsedColumns(sheet);
                          const isUsed =
                            usedColumns.includes(header) &&
                            sheet.columnMap?.[field.key] !== header;

                          return (
                            <SelectItem
                              key={header}
                              value={header}
                              disabled={isUsed}
                            >
                              {header}
                              {isUsed ? " (ya asignada)" : ""}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                ))}

                {sheet.role === "INTENTOS" && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium mb-2">
                      Columnas de respuestas detectadas automáticamente
                    </p>

                    {detectedResponseColumns.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {detectedResponseColumns.map((col) => (
                          <Badge key={col} variant="outline">
                            {col}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-destructive">
                        No se detectaron columnas tipo "Respuesta 1", "Respuesta 2", etc.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Atrás
        </Button>

        <Button
          onClick={handleNext}
          className="bg-accent hover:bg-accent/90"
        >
          Continuar
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ColumnSelectionStep;
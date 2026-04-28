import { useEffect } from "react";
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

const CLEAR_VALUE = "__CLEAR__";

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
    { key: "ASIGNATURA", label: "Asignatura" },
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
    { key: "NIVEL", label: "Nivel" },
  ],
};

const FIELD_ALIASES: Record<string, string[]> = {
  NUMERO_PREGUNTA: [
    "n",
    "n°",
    "nº",
    "no",
    "numero",
    "numero pregunta",
    "numero de pregunta",
    "nro pregunta",
    "pregunta numero",
  ],
  PREGUNTA_RAW: [
    "pregunta",
    "pregunta completa",
    "enunciado",
    "texto pregunta",
    "texto de pregunta",
  ],
  RESPUESTA_CORRECTA: [
    "respuesta correcta",
    "correcta",
    "opcion correcta",
    "opción correcta",
    "respuesta",
  ],
  COMPONENTE: ["componente"],
  SUBCOMPONENTE: ["subcomponente", "sub componente"],
  TEMA: ["tema"],
  ASIGNATURA: ["asignatura", "materia"],
  JUSTIFICACION: ["justificacion", "justificación", "retroalimentacion", "retroalimentación"],

  APELLIDOS: ["apellido(s)", "apellidos", "apellido"],
  NOMBRES: ["nombre", "nombres"],
  CORREO: [
    "correo",
    "direccion de correo",
    "dirección de correo",
    "email",
    "e-mail",
    "correo electronico",
    "correo electrónico",
  ],
  ESTADO: ["estado"],
  COMENZADO_EL: ["comenzado el", "fecha inicio", "inicio"],
  FINALIZADO_EL: ["finalizado", "finalizado el", "fecha fin", "fin"],
  TIEMPO_REQUERIDO_TEXTO: [
    "tiempo requerido",
    "tiempo",
    "duracion",
    "duración",
  ],
  CALIFICACION_TOTAL: [
    "calificacion total",
    "calificación total",
    "calificacion",
    "calificación",
    "nota",
    "puntaje",
  ],
  NIVEL: ["nivel"],
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.:;,_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const detectResponseColumns = (headers: string[]) => {
  return headers.filter((header) => {
    const normalized = normalizeText(header);
    return /^respuesta\s*\d+$/.test(normalized);
  });
};

const findHeaderForField = (
  headers: string[],
  fieldKey: string,
  usedHeaders: Set<string>
) => {
  const aliases = FIELD_ALIASES[fieldKey] ?? [];
  const normalizedAliases = aliases.map(normalizeText);

  const exact = headers.find((header) => {
    if (usedHeaders.has(header)) return false;
    return normalizedAliases.includes(normalizeText(header));
  });

  if (exact) return exact;

  const partial = headers.find((header) => {
    if (usedHeaders.has(header)) return false;

    const normalizedHeader = normalizeText(header);

    return normalizedAliases.some((alias) => {
      if (!alias) return false;
      return normalizedHeader.includes(alias) || alias.includes(normalizedHeader);
    });
  });

  return partial ?? "";
};

const buildAutoColumnMap = (
  sheet: WizardData["sheets"][number]
): Record<string, string> => {
  if (!sheet.role || sheet.role === "IGNORAR") return sheet.columnMap ?? {};

  const fields = FIELD_CONFIG[sheet.role];
  const nextColumnMap: Record<string, string> = { ...(sheet.columnMap ?? {}) };
  const usedHeaders = new Set(
    Object.values(nextColumnMap).filter(Boolean)
  );

  for (const field of fields) {
    if (nextColumnMap[field.key]) continue;

    const detectedHeader = findHeaderForField(
      sheet.headers,
      field.key,
      usedHeaders
    );

    if (detectedHeader) {
      nextColumnMap[field.key] = detectedHeader;
      usedHeaders.add(detectedHeader);
    }
  }

  return nextColumnMap;
};

const ColumnSelectionStep = ({
  wizardData,
  updateWizardData,
  onNext,
  onBack,
}: ColumnSelectionStepProps) => {
  const { toast } = useToast();

  useEffect(() => {
    let changed = false;

    const updatedSheets = wizardData.sheets.map((sheet) => {
      if (!sheet.role || sheet.role === "IGNORAR") return sheet;

      const autoMap = buildAutoColumnMap(sheet);

      if (JSON.stringify(autoMap) !== JSON.stringify(sheet.columnMap ?? {})) {
        changed = true;
        return {
          ...sheet,
          columnMap: autoMap,
        };
      }

      return sheet;
    });

    if (changed) {
      updateWizardData({ sheets: updatedSheets });
    }
  }, []);

  const mappedSheets = wizardData.sheets
    .map((sheet, originalIndex) => ({
      ...sheet,
      originalIndex,
    }))
    .filter((sheet) => sheet.role && sheet.role !== "IGNORAR");

  const getUsedColumns = (sheet: WizardData["sheets"][number]) => {
    return Object.values(sheet.columnMap ?? {}).filter(Boolean);
  };

  const updateColumnMap = (
    originalSheetIndex: number,
    fieldKey: string,
    columnName: string
  ) => {
    const updatedSheets = wizardData.sheets.map((sheet, index) => {
      if (index !== originalSheetIndex) return sheet;

      const nextColumnMap = {
        ...(sheet.columnMap ?? {}),
      };

      if (columnName === CLEAR_VALUE) {
        delete nextColumnMap[fieldKey];
      } else {
        nextColumnMap[fieldKey] = columnName;
      }

      return {
        ...sheet,
        columnMap: nextColumnMap,
      };
    });

    updateWizardData({ sheets: updatedSheets });
  };

  const handleAutoMap = () => {
    const updatedSheets = wizardData.sheets.map((sheet) => {
      if (!sheet.role || sheet.role === "IGNORAR") return sheet;

      return {
        ...sheet,
        columnMap: buildAutoColumnMap({
          ...sheet,
          columnMap: {},
        }),
      };
    });

    updateWizardData({ sheets: updatedSheets });

    toast({
      title: "Columnas preseleccionadas",
      description: "Se asignaron columnas según los encabezados detectados.",
    });
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

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Mapeo de columnas</h2>
        <p className="text-muted-foreground">
          Indica qué columna corresponde a cada campo requerido.
        </p>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={handleAutoMap}>
          Preseleccionar columnas
        </Button>
      </div>

      <div className="space-y-6">
        {mappedSheets.map((sheet, visibleIndex) => {
          const fields =
            FIELD_CONFIG[
              sheet.role as Exclude<SheetRole, "IGNORAR" | null>
            ];

          const detectedResponseColumns =
            sheet.role === "INTENTOS"
              ? detectResponseColumns(sheet.headers)
              : [];

          return (
            <Card key={`${sheet.sheetName}-${sheet.originalIndex}`}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-3">
                  <span>Hoja: {sheet.sheetName}</span>
                  <Badge variant="secondary">{sheet.role}</Badge>
                  <Badge variant="outline">#{visibleIndex + 1}</Badge>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-5">
                {fields.map((field) => {
                  const selectedValue = sheet.columnMap?.[field.key] ?? "";
                  const usedColumns = getUsedColumns(sheet);

                  return (
                    <div key={field.key} className="space-y-2">
                      <Label>
                        {field.label}
                        {field.required && (
                          <span className="text-destructive ml-1">*</span>
                        )}
                      </Label>

                      <Select
                        value={selectedValue}
                        onValueChange={(value) =>
                          updateColumnMap(
                            sheet.originalIndex,
                            field.key,
                            value
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona la columna" />
                        </SelectTrigger>

                        <SelectContent>
                          {!field.required && (
                            <SelectItem value={CLEAR_VALUE}>
                              Sin asignar
                            </SelectItem>
                          )}

                          {sheet.headers.map((header, headerIndex) => {
                            const isUsed =
                              usedColumns.includes(header) &&
                              selectedValue !== header;

                            return (
                              <SelectItem
                                key={`${header}-${headerIndex}`}
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
                  );
                })}

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
                        No se detectaron columnas tipo "Respuesta 1", "Respuesta
                        2", etc.
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

        <Button onClick={handleNext} className="bg-accent hover:bg-accent/90">
          Continuar
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ColumnSelectionStep;